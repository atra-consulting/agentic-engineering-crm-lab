/**
 * Builds the three generated API files from the hand-written contract:
 *
 *   openapi/openapi.yaml ──Redocly bundle──▶ backend/src/generated/openapi.json
 *                        ──openapi-typescript──▶ backend/src/generated/api-types.ts
 *                                              ▶ frontend/src/app/core/api/api-types.ts (byte-identical)
 *
 * Run: cd backend && npm run api:generate   (the frontend has the same script)
 *
 * All paths resolve from this file, never from the working directory.
 * Output is deterministic: two runs on the same contract give identical bytes.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import openapiTS, { astToString, type OpenAPI3 } from 'openapi-typescript';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
export const BACKEND_DIR = resolve(SCRIPT_DIR, '..');
export const REPO_ROOT = resolve(BACKEND_DIR, '..');
export const CONTRACT_DIR = join(REPO_ROOT, 'openapi');
export const CONTRACT_ROOT = join(CONTRACT_DIR, 'openapi.yaml');
export const REDOCLY_CONFIG = join(CONTRACT_DIR, 'redocly.yaml');
export const GENERATED_DIR = join(BACKEND_DIR, 'src', 'generated');
export const BUNDLE_FILE = join(GENERATED_DIR, 'openapi.json');
export const TYPES_FILE_BACKEND = join(GENERATED_DIR, 'api-types.ts');
export const TYPES_FILE_FRONTEND = join(REPO_ROOT, 'frontend', 'src', 'app', 'core', 'api', 'api-types.ts');

export const GENERATED_HEADER = 'GENERATED — do not edit. Rebuild: cd backend && npm run api:generate';

/** Repo-relative path with forward slashes, for messages and git pathspecs. */
export function repoPath(absolutePath: string): string {
  return relative(REPO_ROOT, absolutePath).split('\\').join('/');
}

/** Absolute path of the Redocly CLI entry, read from its package.json `bin`. */
function redoclyCliEntry(): string {
  const pkgDir = join(BACKEND_DIR, 'node_modules', '@redocly', 'cli');
  const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')) as {
    bin?: string | Record<string, string>;
  };
  const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.['redocly'];
  if (!bin) throw new Error('@redocly/cli: no "redocly" bin entry in package.json');
  return join(pkgDir, bin);
}

export interface RedoclyRun {
  status: number;
  stdout: string;
}

/**
 * Runs the Redocly CLI with the current Node binary (no shell, works on every OS).
 * cwd is the repo root, so messages show paths like `openapi/paths/firmen.yaml`.
 * Telemetry and the update check are switched off: no network calls.
 */
export function runRedocly(args: string[], captureStdout: boolean): RedoclyRun {
  const result = spawnSync(process.execPath, [redoclyCliEntry(), ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', captureStdout ? 'pipe' : 'inherit', 'inherit'],
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, REDOCLY_TELEMETRY: 'off', REDOCLY_SUPPRESS_UPDATE_NOTICE: 'true' },
  });
  if (result.error) throw result.error;
  return { status: result.status ?? 1, stdout: result.stdout ?? '' };
}

/** A bundled contract as plain JSON data. */
export type JsonObject = { [key: string]: unknown };

function bundleContract(): JsonObject {
  const run = runRedocly(
    [
      'bundle',
      repoPath(CONTRACT_ROOT),
      '--config',
      repoPath(REDOCLY_CONFIG),
      '--ext',
      'json',
      // Fail instead of emitting a renamed duplicate such as `Firma-2`.
      '--component-renaming-conflicts-severity',
      'error',
    ],
    true,
  );
  if (run.status !== 0) {
    throw new Error(`redocly bundle failed (exit ${run.status})`);
  }
  const parsed: unknown = JSON.parse(run.stdout);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('redocly bundle did not return a JSON object');
  }
  return parsed as JsonObject;
}

function writeIfChanged(file: string, content: string): boolean {
  let current: string | undefined;
  try {
    current = readFileSync(file, 'utf8');
  } catch {
    current = undefined;
  }
  if (current === content) return false;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content, 'utf8');
  return true;
}

export interface GenerateResult {
  /** The bundle exactly as written to openapi.json (parsed back). */
  bundle: JsonObject;
  /** Repo-relative paths of files whose content changed. */
  changed: string[];
}

export async function generate(): Promise<GenerateResult> {
  // 1. Bundle; 2. add the header key (first key, so readers see it at once).
  const bundle: JsonObject = { 'x-generated': GENERATED_HEADER, ...bundleContract() };
  // 3. openapi.json: 2-space indent, trailing newline.
  const bundleText = `${JSON.stringify(bundle, null, 2)}\n`;

  // 4. openapi-typescript with default options, on a fresh copy of the bundle.
  const ast = await openapiTS(JSON.parse(bundleText) as OpenAPI3);
  // 5. Same header as a comment.
  const typesText = `// ${GENERATED_HEADER}\n\n${astToString(ast)}`;

  // 6. Write all three files.
  const changed: string[] = [];
  if (writeIfChanged(BUNDLE_FILE, bundleText)) changed.push(repoPath(BUNDLE_FILE));
  for (const file of [TYPES_FILE_BACKEND, TYPES_FILE_FRONTEND]) {
    if (writeIfChanged(file, typesText)) changed.push(repoPath(file));
  }
  return { bundle: JSON.parse(bundleText) as JsonObject, changed };
}

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  try {
    const { changed } = await generate();
    for (const file of [BUNDLE_FILE, TYPES_FILE_BACKEND, TYPES_FILE_FRONTEND].map(repoPath)) {
      console.log(`api:generate: ${changed.includes(file) ? 'updated  ' : 'unchanged'} ${file}`);
    }
  } catch (err) {
    console.error(`api:generate: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
