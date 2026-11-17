/**
 * Shared helpers for the contract tests. Reads the bundled OpenAPI contract
 * (src/generated/openapi.json) and exposes typed operations.
 * Not a spec file: Playwright does not pick it up.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const BUNDLE_PATH = resolve(__dirname, '..', 'generated', 'openapi.json');

export const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export interface JsonSchema {
  $ref?: string;
  enum?: string[];
  [key: string]: unknown;
}

export interface Parameter {
  $ref?: string;
  name?: string;
  in?: string;
  schema?: JsonSchema;
}

export interface RawOperation {
  operationId: string;
  security?: Record<string, string[]>[];
  parameters?: Parameter[];
  requestBody?: unknown;
  'x-loopback-bypass'?: boolean;
  'x-sort-fields'?: string[];
  'x-default-sort'?: string;
}

export interface Bundle {
  servers: { url: string }[];
  paths: Record<string, Partial<Record<HttpMethod, RawOperation>>>;
  components: {
    schemas: Record<string, JsonSchema>;
    parameters: Record<string, Parameter>;
  };
}

export interface Operation {
  operationId: string;
  method: Uppercase<HttpMethod>;
  /** Contract path without server prefix, for example `/firmen/{id}`. */
  path: string;
  /** Full path with server prefix, for example `/api/firmen/{id}`. */
  fullPath: string;
  security: Record<string, string[]>[];
  hasBody: boolean;
  loopbackBypass: boolean;
  raw: RawOperation;
}

export const bundle: Bundle = JSON.parse(readFileSync(BUNDLE_PATH, 'utf8')) as Bundle;

export const SERVER_PREFIX = bundle.servers[0]?.url ?? '';

export const operations: Operation[] = [];
for (const [path, item] of Object.entries(bundle.paths)) {
  for (const method of HTTP_METHODS) {
    const raw = item[method];
    if (!raw) continue;
    operations.push({
      operationId: raw.operationId,
      method: method.toUpperCase() as Uppercase<HttpMethod>,
      path,
      fullPath: `${SERVER_PREFIX}${path}`,
      security: raw.security ?? [],
      hasBody: raw.requestBody !== undefined,
      loopbackBypass: raw['x-loopback-bypass'] === true,
      raw,
    });
  }
}

export function getOp(operationId: string): Operation {
  const op = operations.find((o) => o.operationId === operationId);
  if (!op) throw new Error(`Operation not in contract: ${operationId}`);
  return op;
}

/** Resolve `#/components/...` refs one level (schemas and parameters). */
export function resolveSchema(schema: JsonSchema): JsonSchema {
  if (!schema.$ref) return schema;
  const name = schema.$ref.split('/').pop() ?? '';
  const target = bundle.components.schemas[name];
  if (!target) throw new Error(`Unknown schema ref ${schema.$ref}`);
  return target;
}

export function resolveParameters(op: Operation): { name: string; in: string; schema?: JsonSchema }[] {
  return (op.raw.parameters ?? []).map((p) => {
    const resolved = p.$ref ? bundle.components.parameters[p.$ref.split('/').pop() ?? ''] : p;
    if (!resolved || !resolved.name || !resolved.in) throw new Error(`Bad parameter in ${op.operationId}`);
    return { name: resolved.name, in: resolved.in, schema: resolved.schema };
  });
}

/** Replace every `{param}` with `1`. */
export function concretePath(fullPath: string): string {
  return fullPath.replace(/\{[^}]+\}/g, '1');
}

export function sameSet(a: readonly string[], b: readonly string[]): boolean {
  return a.length === new Set(a).size && b.length === new Set(b).size && a.length === b.length && a.every((x) => b.includes(x));
}

/**
 * cron_run cleanup. Other specs (cron.spec.ts) assume no leftover runs.
 * Record the baseline in beforeAll, delete everything above it in afterAll.
 * Dynamic import keeps the DB connection out of specs that do not need it.
 */
export async function cronRunBaseline(): Promise<number> {
  const { client } = await import('../config/db.js');
  const rs = await client.execute('SELECT COALESCE(MAX(id), 0) AS m FROM cron_run');
  return Number(rs.rows[0]?.['m'] ?? 0);
}

export async function deleteCronRunsAbove(baseline: number): Promise<void> {
  const { client } = await import('../config/db.js');
  await client.execute({ sql: 'DELETE FROM cron_run WHERE id > ?', args: [baseline] });
}
