/**
 * Contract gate. Local and CI: cd backend && npm run api:check
 *
 *   1. Redocly lint (openapi/redocly.yaml, zero errors required)
 *   2. api:generate (bundle + types)
 *   3. Project rules that Redocly cannot express (see RULES below)
 *   4. Compile the whole bundle with the runtime Ajv 2020 setup
 *   5. Drift: step 2 must not have rewritten any generated file (stale or
 *      hand-edited, even uncommitted), and `git status --porcelain` on the
 *      generated paths must be empty (catches changed AND untracked files)
 *
 * Exit 0 when every step passes, else 1 at the first failing step.
 */
import { spawnSync } from 'node:child_process';
import type { Ajv2020 } from 'ajv/dist/2020.js';
import { createContractAjvs } from '../src/openapi/ajv.js';
import {
  CONTRACT_ROOT,
  GENERATED_DIR,
  REDOCLY_CONFIG,
  REPO_ROOT,
  TYPES_FILE_FRONTEND,
  generate,
  repoPath,
  runRedocly,
  type JsonObject,
} from './api-generate.js';

// ─── Binding operationId table (copy of openapi/README.md) ────────────────────
const OPERATION_IDS: Readonly<Record<string, string>> = {
  'GET /health': 'getHealth',
  'POST /auth/login': 'login',
  'POST /auth/logout': 'logout',
  'GET /auth/me': 'getCurrentUser',
  'POST /auth/test-login': 'testLogin',
  'GET /firmen': 'listFirmen',
  'GET /firmen/all': 'listAllFirmen',
  'GET /firmen/{id}': 'getFirma',
  'POST /firmen': 'createFirma',
  'PUT /firmen/{id}': 'updateFirma',
  'DELETE /firmen/{id}': 'deleteFirma',
  'GET /firmen/{id}/personen': 'listFirmaPersonen',
  'GET /firmen/{id}/abteilungen': 'listFirmaAbteilungen',
  'GET /personen': 'listPersonen',
  'GET /personen/all': 'listAllPersonen',
  'GET /personen/{id}': 'getPerson',
  'POST /personen': 'createPerson',
  'PUT /personen/{id}': 'updatePerson',
  'DELETE /personen/{id}': 'deletePerson',
  'GET /abteilungen': 'listAbteilungen',
  'GET /abteilungen/all': 'listAllAbteilungen',
  'GET /abteilungen/firma/{firmaId}': 'listAbteilungenByFirma',
  'GET /abteilungen/{id}': 'getAbteilung',
  'POST /abteilungen': 'createAbteilung',
  'PUT /abteilungen/{id}': 'updateAbteilung',
  'DELETE /abteilungen/{id}': 'deleteAbteilung',
  'GET /abteilungen/{id}/personen': 'listAbteilungPersonen',
  'GET /adressen': 'listAdressen',
  'GET /adressen/all': 'listAllAdressen',
  'GET /adressen/{id}': 'getAdresse',
  'POST /adressen': 'createAdresse',
  'PUT /adressen/{id}': 'updateAdresse',
  'DELETE /adressen/{id}': 'deleteAdresse',
  'GET /aktivitaeten': 'listAktivitaeten',
  'GET /aktivitaeten/all': 'listAllAktivitaeten',
  'GET /aktivitaeten/{id}': 'getAktivitaet',
  'POST /aktivitaeten': 'createAktivitaet',
  'PUT /aktivitaeten/{id}': 'updateAktivitaet',
  'DELETE /aktivitaeten/{id}': 'deleteAktivitaet',
  'GET /chancen': 'listChancen',
  'GET /chancen/all': 'listAllChancen',
  'GET /chancen/{id}': 'getChance',
  'POST /chancen': 'createChance',
  'PUT /chancen/{id}': 'updateChance',
  'DELETE /chancen/{id}': 'deleteChance',
  'GET /dashboard': 'getDashboard',
  'GET /szenarien': 'listSzenarien',
  'GET /szenarien/{id}': 'getSzenario',
  'POST /szenarien': 'createSzenario',
  'PUT /szenarien/{id}': 'updateSzenario',
  'DELETE /szenarien/{id}': 'deleteSzenario',
  'GET /agent-tasks/next': 'claimNextAgentTask',
  'GET /agent-tasks/summary': 'getAgentTaskSummary',
  'POST /agent-tasks/reset': 'resetAgentTasks',
  'POST /agent-tasks/{id}/start': 'startAgentTask',
  'POST /agent-tasks/{id}/reject': 'rejectAgentTask',
  'POST /agent-tasks/{id}/done': 'completeAgentTask',
  'GET /agent-tasks/{id}': 'getAgentTask',
  'GET /agent-tasks': 'listAgentTasks',
  'GET /tickets/next': 'claimNextTicket',
  'GET /tickets/board': 'getTicketBoard',
  'GET /tickets/summary': 'getTicketSummary',
  'POST /tickets/reset': 'resetTickets',
  'GET /tickets': 'listTickets',
  'POST /tickets': 'createTicket',
  'GET /tickets/{id}': 'getTicket',
  'PATCH /tickets/{id}/status': 'setTicketStatus',
  'PATCH /tickets/{id}/owner': 'setTicketOwner',
  'POST /tickets/{id}/start': 'startTicket',
  'POST /tickets/{id}/done': 'completeTicket',
  'POST /tickets/{id}/ask': 'askTicketQuestion',
  'POST /tickets/{id}/wont-do': 'markTicketWontDo',
  'POST /tickets/{id}/hand-to-ai': 'handTicketToAi',
  'POST /tickets/{id}/comments': 'addTicketComment',
  'GET /cron/agent-tasks': 'triggerAgentTasksRun',
  'GET /cron/github-issues': 'triggerGithubIssuesRun',
  'POST /cron/runs/{id}/complete': 'completeCronRun',
  'GET /cron/runs': 'listCronRuns',
  'GET /cron/jobs': 'listCronJobs',
};

// ─── Vendor keywords (openapi/README.md) ──────────────────────────────────────
const OPERATION_KEYWORDS = new Set([
  'x-sort-fields',
  'x-default-sort',
  'x-skip-request-validation',
  'x-loopback-bypass',
  'x-environments',
]);
const SCHEMA_KEYWORDS = new Set(['x-error-messages']);
const ROOT_KEYWORDS = new Set(['x-generated']);
/** Ajv keywords that may key an `x-error-messages` entry. */
const MESSAGE_KEYS = new Set([
  'required', 'type', 'const', 'enum', 'format', 'pattern', 'anyOf', 'oneOf',
  'minLength', 'maxLength', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum',
  'multipleOf', 'minItems', 'maxItems', 'uniqueItems',
]);
const MESSAGE_PLACEHOLDERS = new Set(['limit', 'min', 'max', 'value']);
const ENVIRONMENTS = new Set(['development', 'test']);
const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;
/** Objects whose keys are names (properties, headers, status codes …), not keywords. */
const NAME_MAPS = new Set([
  'paths', 'properties', 'patternProperties', 'dependentSchemas', '$defs', 'headers', 'content',
  'responses', 'schemas', 'parameters', 'requestBodies', 'securitySchemes', 'examples', 'links', 'callbacks',
]);

// ─── JSON helpers ─────────────────────────────────────────────────────────────
function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function escapeSegment(segment: string): string {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1');
}

function unescapeSegment(segment: string): string {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~');
}

/** JSON pointer for messages: `#/paths/~1firmen~1{id}/get`. */
function pointer(segments: readonly string[]): string {
  return `#${segments.map((s) => `/${escapeSegment(s)}`).join('')}`;
}

/** Ajv ref into the `spec` schema: segments JSON-pointer-escaped, then URI-encoded. */
function specRef(segments: readonly string[]): string {
  return `spec#${segments.map((s) => `/${encodeURIComponent(escapeSegment(s))}`).join('')}`;
}

function segmentsOfLocalRef(ref: string): string[] {
  if (!ref.startsWith('#/')) throw new Error(`not a local $ref: ${ref}`);
  return ref.slice(2).split('/').map((s) => unescapeSegment(decodeURIComponent(s)));
}

function getAt(root: JsonObject, segments: readonly string[]): unknown {
  let node: unknown = root;
  for (const segment of segments) {
    if (!isObject(node) && !Array.isArray(node)) return undefined;
    node = (node as Record<string, unknown>)[segment];
  }
  return node;
}

interface Located {
  node: JsonObject;
  segments: string[];
}

/** Follows OAS-level `$ref`s (parameters, responses, request bodies) to the target. */
function follow(root: JsonObject, node: unknown, segments: string[]): Located | undefined {
  let current = node;
  let at = segments;
  for (let hops = 0; hops < 20; hops++) {
    if (!isObject(current)) return undefined;
    const ref = current['$ref'];
    if (typeof ref !== 'string') return { node: current, segments: at };
    at = segmentsOfLocalRef(ref);
    current = getAt(root, at);
  }
  throw new Error(`$ref chain too long at ${pointer(segments)}`);
}

interface Operation {
  key: string; // "GET /firmen/{id}"
  path: string;
  method: (typeof HTTP_METHODS)[number];
  op: JsonObject;
  segments: string[];
}

function operationsOf(bundle: JsonObject): Operation[] {
  const out: Operation[] = [];
  const paths = isObject(bundle['paths']) ? bundle['paths'] : {};
  for (const path of Object.keys(paths)) {
    const item = follow(bundle, paths[path], ['paths', path]);
    if (!item) continue;
    for (const method of HTTP_METHODS) {
      const op = item.node[method];
      if (isObject(op)) {
        out.push({ key: `${method.toUpperCase()} ${path}`, path, method, op, segments: [...item.segments, method] });
      }
    }
  }
  return out;
}

function parametersOf(bundle: JsonObject, op: Operation): Located[] {
  const params = op.op['parameters'];
  if (!Array.isArray(params)) return [];
  const out: Located[] = [];
  params.forEach((param, index) => {
    const located = follow(bundle, param, [...op.segments, 'parameters', String(index)]);
    if (located) out.push(located);
  });
  return out;
}

// ─── Step 3: project rules ────────────────────────────────────────────────────
function checkRules(bundle: JsonObject, ops: Operation[]): string[] {
  const problems: string[] = [];
  const report = (segments: readonly string[], message: string): void => {
    problems.push(`${pointer(segments)}: ${message}`);
  };

  for (const op of ops) {
    // operationId and path match the binding table.
    const expected = OPERATION_IDS[op.key];
    if (expected === undefined) {
      report(op.segments, `${op.key} is not in the binding operationId table (openapi/README.md)`);
    } else if (op.op['operationId'] !== expected) {
      report(op.segments, `operationId must be "${expected}", found "${String(op.op['operationId'])}"`);
    }

    // A `sort` query param needs x-sort-fields and x-default-sort, and vice versa.
    const params = parametersOf(bundle, op);
    const hasSort = params.some((p) => p.node['in'] === 'query' && p.node['name'] === 'sort');
    const fields = op.op['x-sort-fields'];
    const defaultSort = op.op['x-default-sort'];
    if (hasSort) {
      const validFields =
        Array.isArray(fields) &&
        fields.length > 0 &&
        fields.every((f) => typeof f === 'string' && f.length > 0) &&
        new Set(fields).size === fields.length;
      if (!validFields) {
        report(op.segments, 'a `sort` query parameter needs a non-empty, duplicate-free string array `x-sort-fields`');
      }
      const match = typeof defaultSort === 'string' ? /^([^,\s]+),(ASC|DESC)$/.exec(defaultSort) : null;
      if (!match) {
        report(op.segments, 'a `sort` query parameter needs `x-default-sort` as "field,ASC" or "field,DESC"');
      } else if (validFields && !(fields as string[]).includes(match[1] ?? '')) {
        report(op.segments, `x-default-sort field "${match[1]}" is not in x-sort-fields`);
      }
    } else if (fields !== undefined || defaultSort !== undefined) {
      report(op.segments, 'x-sort-fields / x-default-sort need a `sort` query parameter');
    }

    // x-loopback-bypass: only `true`, and only where security includes agentBearer.
    if (op.op['x-loopback-bypass'] !== undefined) {
      const security = op.op['security'];
      const hasAgentBearer =
        Array.isArray(security) && security.some((req) => isObject(req) && 'agentBearer' in req);
      if (op.op['x-loopback-bypass'] !== true) report(op.segments, 'x-loopback-bypass must be `true`');
      if (!hasAgentBearer) report(op.segments, 'x-loopback-bypass is allowed only where security includes agentBearer');
    }
    if (op.op['x-skip-request-validation'] !== undefined && op.op['x-skip-request-validation'] !== true) {
      report(op.segments, 'x-skip-request-validation must be `true`');
    }
    const envs = op.op['x-environments'];
    if (
      envs !== undefined &&
      !(Array.isArray(envs) && envs.length > 0 && envs.every((e) => typeof e === 'string' && ENVIRONMENTS.has(e)))
    ) {
      report(op.segments, 'x-environments must be a non-empty array of "development" and/or "test"');
    }

    // No allOf anywhere inside a request body schema (removeAdditional: 'all').
    const body = follow(bundle, op.op['requestBody'], [...op.segments, 'requestBody']);
    const content = body && isObject(body.node['content']) ? body.node['content'] : {};
    for (const mediaType of Object.keys(content)) {
      const schemaSegments = [...(body?.segments ?? []), 'content', mediaType, 'schema'];
      const visited = new Set<string>();
      const walk = (node: unknown, at: string[]): void => {
        if (Array.isArray(node)) {
          node.forEach((child, i) => walk(child, [...at, String(i)]));
          return;
        }
        if (!isObject(node)) return;
        const key = pointer(at);
        if (visited.has(key)) return;
        visited.add(key);
        if ('allOf' in node) report(at, `allOf in the request body of ${op.key} (removeAdditional 'all' strips sibling properties)`);
        const ref = node['$ref'];
        if (typeof ref === 'string') {
          const target = segmentsOfLocalRef(ref);
          walk(getAt(bundle, target), target);
        }
        for (const [k, v] of Object.entries(node)) {
          if (k !== '$ref' && !k.startsWith('x-') && k !== 'const' && k !== 'enum' && k !== 'default' && k !== 'examples') {
            walk(v, [...at, k]);
          }
        }
      };
      walk(getAt(bundle, schemaSegments), schemaSegments);
    }
  }

  // Component names are PascalCase. Redocly hoists any other $ref target into
  // components under its basename (`200`, `firmen`) and renames clashes
  // (`Firma-2`); both show up here.
  const components = isObject(bundle['components']) ? bundle['components'] : {};
  for (const section of ['schemas', 'parameters', 'responses']) {
    const group = components[section];
    for (const name of isObject(group) ? Object.keys(group) : []) {
      if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
        report(
          ['components', section, name],
          'component name is not PascalCase: reference ../schemas/<area>.yaml#/<Name> or ../common.yaml#/<section>/<Name>, never another path item or a renamed duplicate',
        );
      }
    }
  }

  // Generic walk: every $ref targets #/components/, vendor keywords sit in the right place.
  const opPointers = new Set(ops.map((o) => pointer(o.segments)));
  // isNameMap: this node's keys are names (a property called `content` is a
  // name inside `properties`, not the `content` keyword).
  const walkAll = (node: unknown, at: string[], isNameMap: boolean): void => {
    if (Array.isArray(node)) {
      node.forEach((child, i) => walkAll(child, [...at, String(i)], false));
      return;
    }
    if (!isObject(node)) return;
    for (const [key, value] of Object.entries(node)) {
      if (key === '$ref' && typeof value === 'string' && !value.startsWith('#/components/')) {
        report(at, `$ref "${value}" must point into #/components/ (reference the area or common file instead)`);
      }
      if (key.startsWith('x-') && !isNameMap) {
        if (OPERATION_KEYWORDS.has(key)) {
          if (!opPointers.has(pointer(at))) report(at, `${key} belongs on an operation`);
        } else if (SCHEMA_KEYWORDS.has(key)) {
          if (!isObject(value)) {
            report(at, 'x-error-messages must be an object (Ajv keyword → German text)');
          } else {
            for (const [keyword, text] of Object.entries(value)) {
              if (!MESSAGE_KEYS.has(keyword)) report(at, `x-error-messages key "${keyword}" is not a supported Ajv keyword`);
              if (typeof text !== 'string' || text.length === 0) {
                report(at, `x-error-messages.${keyword} must be a non-empty string`);
              } else {
                for (const m of text.matchAll(/\{(\w+)\}/g)) {
                  if (!MESSAGE_PLACEHOLDERS.has(m[1] ?? '')) report(at, `x-error-messages.${keyword}: unknown placeholder {${m[1]}}`);
                }
              }
            }
          }
          continue; // values are texts, not schema nodes
        } else if (!(ROOT_KEYWORDS.has(key) && at.length === 0)) {
          report(at, `unknown vendor keyword "${key}" (allowed: see openapi/README.md)`);
        }
      }
      walkAll(value, [...at, key], !isNameMap && NAME_MAPS.has(key));
    }
  };
  walkAll(bundle, [], false);
  return problems;
}

// ─── Step 4: compile the whole bundle with the runtime Ajv setup ──────────────
interface CompileStats {
  componentSchemas: number;
  operationValidators: number;
  ms: number;
}

function compileBundle(bundle: JsonObject, ops: Operation[]): CompileStats {
  const started = performance.now();
  // The runtime Ajv setup (src/openapi/ajv.ts, openapi/README.md "Ajv setup"):
  // body (strip unknown fields, no coercion) and plain (path params and
  // responses), each with the bundle registered as `spec`.
  const { body: bodyAjv, plain: plainAjv } = createContractAjvs(bundle);

  const compileAt = (ajv: Ajv2020, segments: string[]): void => {
    try {
      ajv.compile({ $ref: specRef(segments) });
    } catch (err) {
      throw new Error(`Ajv cannot compile ${pointer(segments)}: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const schemas = isObject(bundle['components']) && isObject(bundle['components']['schemas'])
    ? Object.keys(bundle['components']['schemas'])
    : [];
  for (const name of schemas) {
    const ref = specRef(['components', 'schemas', name]);
    if (!plainAjv.getSchema(ref)) throw new Error(`Ajv getSchema found nothing at ${ref}`);
  }

  let operationValidators = 0;
  for (const op of ops) {
    for (const param of parametersOf(bundle, op)) {
      if (isObject(param.node['schema'])) {
        compileAt(plainAjv, [...param.segments, 'schema']);
        operationValidators++;
      }
    }
    const body = follow(bundle, op.op['requestBody'], [...op.segments, 'requestBody']);
    if (body && isObject(body.node['content'])) {
      for (const mediaType of Object.keys(body.node['content'])) {
        compileAt(bodyAjv, [...body.segments, 'content', mediaType, 'schema']);
        operationValidators++;
      }
    }
    const responses = isObject(op.op['responses']) ? op.op['responses'] : {};
    for (const status of Object.keys(responses)) {
      const response = follow(bundle, responses[status], [...op.segments, 'responses', status]);
      if (response && isObject(response.node['content'])) {
        for (const mediaType of Object.keys(response.node['content'])) {
          compileAt(plainAjv, [...response.segments, 'content', mediaType, 'schema']);
          operationValidators++;
        }
      }
    }
  }
  return { componentSchemas: schemas.length, operationValidators, ms: Math.round(performance.now() - started) };
}

// ─── Step 5: drift ────────────────────────────────────────────────────────────
function gitDrift(): string {
  const result = spawnSync(
    'git',
    ['status', '--porcelain', '--untracked-files=all', '--', repoPath(GENERATED_DIR), repoPath(TYPES_FILE_FRONTEND)],
    { cwd: REPO_ROOT, encoding: 'utf8' },
  );
  if (result.error) throw new Error(`git not available: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`git status failed: ${result.stderr.trim()}`);
  return result.stdout.trimEnd();
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function fail(step: string, details: string[]): never {
  console.error(`\napi:check FAILED at ${step}`);
  for (const line of details) console.error(`  ${line}`);
  process.exit(1);
}

async function main(): Promise<void> {
  console.log('api:check [1/5] Redocly lint');
  const lint = runRedocly(['lint', repoPath(CONTRACT_ROOT), '--config', repoPath(REDOCLY_CONFIG)], false);
  if (lint.status !== 0) fail('lint', ['Fix the errors above.']);

  console.log('api:check [2/5] generate');
  const { bundle, changed } = await generate();
  for (const file of changed) console.log(`  updated ${file}`);

  console.log('api:check [3/5] project rules');
  const ops = operationsOf(bundle);
  const problems = checkRules(bundle, ops);
  if (problems.length > 0) fail('project rules', problems);
  const total = Object.keys(OPERATION_IDS).length;
  console.log(`  ok: ${ops.length} of ${total} operations present, all match the operationId table`);

  console.log('api:check [4/5] Ajv 2020 compile');
  let stats: CompileStats;
  try {
    stats = compileBundle(bundle, ops);
  } catch (err) {
    fail('Ajv compile', [err instanceof Error ? err.message : String(err)]);
  }
  console.log(`  ok: ${stats.componentSchemas} component schemas, ${stats.operationValidators} operation validators, ${stats.ms} ms`);

  console.log('api:check [5/5] drift (generated files vs. contract and commit)');
  // Step 2 rewrote every generated file that did not match the contract: a
  // stale file or a hand edit (even an uncommitted one, which git status alone
  // would no longer see). git status then catches anything that differs from
  // the commit or is untracked.
  const drift = gitDrift();
  if (changed.length > 0 || drift) {
    fail('drift', [
      ...changed.map((file) => `rewritten by generate (was stale or hand-edited): ${file}`),
      ...(drift ? ['git status --porcelain:', ...drift.split('\n').map((line) => `  ${line}`)] : []),
      'Generated files must match the contract and be committed (no untracked files).',
      'Run `cd backend && npm run api:generate` and commit the result. Never edit or hand-merge generated files.',
    ]);
  }
  console.log('  ok: generated files match the contract and the commit');
  console.log('\napi:check passed');
}

main().catch((err: unknown) => {
  fail('unexpected error', [err instanceof Error ? (err.stack ?? err.message) : String(err)]);
});
