/**
 * Contract runtime core: loads the bundled OpenAPI 3.1 contract
 * (`src/generated/openapi.json`) once at import and compiles every operation
 * with Ajv 2020 (setup in `./ajv.ts`, the same one `api:check` uses).
 *
 * Per operation: a path-params validator, a request-body validator, one
 * validator per declared response status, and a precomputed index of
 * `x-error-messages` by instance path (for `errorMapper.ts`).
 *
 * Fails fast at import with a clear message when the bundle is missing or an
 * operation does not compile. Nothing here touches Express or a request.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Ajv2020, ValidateFunction } from 'ajv/dist/2020.js';
import { createContractAjvs, escapePointerSegment, specRef, unescapePointerSegment } from './ajv.js';
import type { DevOrTestMode } from './runtimeMode.js';

/** Absolute path of the bundle, resolved from this module (not from the working directory). */
export const BUNDLE_FILE = fileURLToPath(new URL('../generated/openapi.json', import.meta.url));

export type HttpMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'PATCH' | 'TRACE';

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;
const JSON_MEDIA_TYPE = 'application/json';
const ENVIRONMENTS: ReadonlySet<string> = new Set<DevOrTestMode>(['development', 'test']);

/** Ajv keyword → German text, from `x-error-messages`. */
export type ErrorMessages = Readonly<Record<string, string>>;

/**
 * `x-error-messages` by instance-path pattern. A pattern is a JSON pointer into
 * the request data (`''` = root, `/humanSteps/works`); `*` stands for any
 * array index (`/humanSteps/works/*`). Built by walking the contract schema
 * (`properties`, `items`, `anyOf`/`oneOf`/`allOf`, `$ref`), never from Ajv's
 * `parentSchema`: a `$ref`'d property keeps its texts next to the `$ref`.
 */
export interface MessageIndex {
  /** Pattern → texts. Only patterns that carry at least one text. */
  readonly messages: ReadonlyMap<string, ErrorMessages>;
  /** Every pattern the walk reached, also those without texts (resolves array indexes). */
  readonly patterns: ReadonlySet<string>;
}

/** One declared response of an operation. */
export interface ContractResponse {
  /** Status key as written in the contract: `200`, `4XX` or `default`. */
  readonly status: string;
  /** Validator for the `application/json` body; `null` when the response declares no JSON body (204). */
  readonly validator: ValidateFunction | null;
}

/**
 * One compiled operation. Validators are shared and not reentrant-safe across
 * awaits: read `validator.errors` right after the call, in the same tick.
 */
export interface ContractOperation {
  readonly operationId: string;
  /** Upper case, e.g. `GET`. */
  readonly method: HttpMethod;
  /** Path as in the contract, without the server base path: `/firmen/{id}`. */
  readonly specPath: string;
  /** JSON pointer of the operation in the bundle, for messages: `#/paths/~1firmen~1{id}/get`. */
  readonly pointer: string;
  /** Names of the `{param}` placeholders, in path order. */
  readonly pathParamNames: readonly string[];
  /** Validates an object of path params (strings, no coercion). `null` when the path has none. */
  readonly pathParamsValidator: ValidateFunction | null;
  /**
   * Body validator (body Ajv instance: strips unknown fields, mutates its input,
   * never coerces). `null` when the operation declares no request body.
   */
  readonly bodyValidator: ValidateFunction | null;
  /** `requestBody.required === true`. */
  readonly bodyRequired: boolean;
  /** `x-skip-request-validation: true` (login, testLogin). */
  readonly skipRequestValidation: boolean;
  /** `x-environments`, or `null` when the route exists in every mode. */
  readonly environments: readonly DevOrTestMode[] | null;
  /** Status key (`200`, `4XX`, `default`) → response. Use {@link findResponse} to resolve a numeric status. */
  readonly responses: ReadonlyMap<string, ContractResponse>;
  /** `x-error-messages` for the request body and for the path params (pattern `/<name>`). */
  readonly errorMessages: { readonly body: MessageIndex; readonly path: MessageIndex };
}

export interface Contract {
  /** Server base path from `servers[0].url`, e.g. `/api`. */
  readonly basePath: string;
  /** Every operation in bundle order. Empty path items (areas not yet written) contribute none. */
  readonly operations: readonly ContractOperation[];
  /** Validator for `ErrorResponse` (plain instance): 5xx answers and requests without an operation. */
  readonly errorResponseValidator: ValidateFunction;
  /** Wall time of load plus compile, in milliseconds. */
  readonly compileMs: number;
  getOperation(operationId: string): ContractOperation | undefined;
  findOperation(method: string, expressFullPath: string): ContractOperation | undefined;
  matchOperation(method: string, originalUrl: string): ContractOperation | undefined;
}

/** Thrown at load when the bundle is missing, malformed or does not compile. */
export class ContractLoadError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(`[contract] ${message}`, options);
    this.name = 'ContractLoadError';
  }
}

// ─── JSON helpers ─────────────────────────────────────────────────────────────
type JsonObject = { [key: string]: unknown };

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Display pointer: `#/paths/~1firmen~1{id}/get`. */
function displayPointer(segments: readonly string[]): string {
  return `#${segments.map((s) => `/${escapePointerSegment(s)}`).join('')}`;
}

function getAt(root: JsonObject, segments: readonly string[]): unknown {
  let node: unknown = root;
  for (const segment of segments) {
    if (isObject(node)) node = node[segment];
    else if (Array.isArray(node)) node = node[Number(segment)];
    else return undefined;
  }
  return node;
}

function segmentsOfLocalRef(ref: string): string[] | undefined {
  if (!ref.startsWith('#/')) return undefined;
  return ref
    .slice(2)
    .split('/')
    .map((s) => unescapePointerSegment(decodeURIComponent(s)));
}

interface Located {
  readonly node: JsonObject;
  readonly segments: string[];
}

const MAX_REF_HOPS = 20;

/**
 * Follows OAS-level `$ref`s (path items, parameters, request bodies, responses)
 * to their target. Ajv does not follow a `$ref` in the middle of a pointer, so
 * validators must be compiled at the resolved location.
 */
function follow(root: JsonObject, node: unknown, segments: string[]): Located | undefined {
  let current = node;
  let at = segments;
  for (let hop = 0; hop < MAX_REF_HOPS; hop++) {
    if (!isObject(current)) return undefined;
    const ref = current['$ref'];
    if (typeof ref !== 'string') return { node: current, segments: at };
    const target = segmentsOfLocalRef(ref);
    if (!target) throw new ContractLoadError(`${displayPointer(at)}: only local $refs are supported, found "${ref}"`);
    at = target;
    current = getAt(root, at);
    if (current === undefined) throw new ContractLoadError(`${displayPointer(segments)}: $ref "${ref}" points to nothing`);
  }
  throw new ContractLoadError(`${displayPointer(segments)}: $ref chain longer than ${MAX_REF_HOPS} hops`);
}

// ─── Error-message index ──────────────────────────────────────────────────────
/** Recursion guard for self-referencing schemas (texts below this depth fall back to defaults). */
const MAX_MESSAGE_DEPTH = 32;

class MessageIndexBuilder {
  readonly messages = new Map<string, Record<string, string>>();
  readonly patterns = new Set<string>();
  private readonly visited = new Map<object, Set<string>>();

  constructor(private readonly root: JsonObject) {}

  build(): MessageIndex {
    return { messages: this.messages, patterns: this.patterns };
  }

  /** Walks `schema` as the schema for data at `pattern`. */
  collect(schema: unknown, pattern: string, depth = 0): void {
    if (depth > MAX_MESSAGE_DEPTH) return;
    this.patterns.add(pattern);

    // 1. The $ref chain of this node: own texts first, then each target's texts
    //    for keywords not set yet (the property node wins over the referenced schema).
    const chain: JsonObject[] = [];
    let node: unknown = schema;
    while (isObject(node) && !this.seen(node, pattern)) {
      chain.push(node);
      this.addMessages(pattern, node['x-error-messages']);
      const ref = node['$ref'];
      if (typeof ref !== 'string') break;
      const target = segmentsOfLocalRef(ref);
      node = target ? getAt(this.root, target) : undefined;
    }

    // 2. Children of every node in the chain ($ref with siblings applies both).
    for (const current of chain) {
      const properties = current['properties'];
      if (isObject(properties)) {
        for (const [name, child] of Object.entries(properties)) {
          this.collect(child, `${pattern}/${escapePointerSegment(name)}`, depth + 1);
        }
      }
      const items = current['items'];
      if (isObject(items)) this.collect(items, `${pattern}/*`, depth + 1);
      // Branches describe the same data: same pattern, texts only for keywords still missing.
      for (const keyword of ['anyOf', 'oneOf', 'allOf']) {
        const branches = current[keyword];
        if (Array.isArray(branches)) {
          for (const branch of branches) this.collect(branch, pattern, depth + 1);
        }
      }
    }
  }

  private seen(node: object, pattern: string): boolean {
    let patterns = this.visited.get(node);
    if (!patterns) {
      patterns = new Set();
      this.visited.set(node, patterns);
    }
    if (patterns.has(pattern)) return true;
    patterns.add(pattern);
    return false;
  }

  private addMessages(pattern: string, value: unknown): void {
    if (!isObject(value)) return;
    let target = this.messages.get(pattern);
    for (const [keyword, text] of Object.entries(value)) {
      if (typeof text !== 'string' || text.length === 0) continue;
      if (!target) {
        target = {};
        this.messages.set(pattern, target);
      }
      if (!Object.hasOwn(target, keyword)) target[keyword] = text;
    }
  }
}

const ARRAY_INDEX = /^(?:0|[1-9][0-9]*)$/;

/**
 * Texts for an Ajv `instancePath` (JSON pointer, escaped as Ajv sends it).
 * Exact property names win; a numeric segment falls back to `*` (array item).
 */
export function findErrorMessages(index: MessageIndex, instancePath: string): ErrorMessages | undefined {
  let prefix = '';
  if (instancePath !== '') {
    for (const segment of instancePath.split('/').slice(1)) {
      const exact = `${prefix}/${segment}`;
      if (index.patterns.has(exact)) {
        prefix = exact;
        continue;
      }
      const wildcard = `${prefix}/*`;
      if (ARRAY_INDEX.test(segment) && index.patterns.has(wildcard)) {
        prefix = wildcard;
        continue;
      }
      return undefined;
    }
  }
  return index.messages.get(prefix);
}

// ─── Compile ──────────────────────────────────────────────────────────────────
/** Compiles at `spec#<pointer>`, once per instance and location. */
class Compiler {
  private readonly cache = new Map<string, ValidateFunction>();

  constructor(private readonly ajv: Ajv2020) {}

  at(segments: readonly string[], context: string): ValidateFunction {
    return this.schema({ $ref: specRef(segments) }, `${displayPointer(segments)} (${context})`);
  }

  schema(schema: JsonObject, context: string): ValidateFunction {
    const key = JSON.stringify(schema);
    const cached = this.cache.get(key);
    if (cached) return cached;
    let validator: ValidateFunction;
    try {
      validator = this.ajv.compile(schema);
    } catch (err) {
      throw new ContractLoadError(`Ajv cannot compile ${context}: ${errorText(err)}`, { cause: err });
    }
    this.cache.set(key, validator);
    return validator;
  }
}

interface ParameterRef {
  readonly name: string;
  readonly in: string;
  readonly located: Located;
}

/** Path-item parameters merged with operation parameters (the operation wins per name + in). */
function parametersOf(root: JsonObject, item: Located, op: Located): ParameterRef[] {
  const byKey = new Map<string, ParameterRef>();
  for (const owner of [item, op]) {
    const list = owner.node['parameters'];
    if (!Array.isArray(list)) continue;
    list.forEach((param, index) => {
      const located = follow(root, param, [...owner.segments, 'parameters', String(index)]);
      if (!located) return;
      const name = located.node['name'];
      const location = located.node['in'];
      if (typeof name !== 'string' || typeof location !== 'string') {
        throw new ContractLoadError(`${displayPointer(located.segments)}: parameter without name or in`);
      }
      byKey.set(`${location}:${name}`, { name, in: location, located });
    });
  }
  return [...byKey.values()];
}

/** `{name}` placeholders of a contract path, in order. */
function templateNames(specPath: string): string[] {
  return [...specPath.matchAll(/\{([^}/]+)\}/g)].map((m) => m[1] ?? '');
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface Route {
  readonly op: ContractOperation;
  readonly regex: RegExp;
  /** Per segment: true when it holds a `{param}`. */
  readonly templated: readonly boolean[];
  readonly paramCount: number;
  readonly order: number;
}

/**
 * Tie-break for URLs several templates match (they have the same segment
 * count): at the first segment where one is static and the other templated,
 * the static one wins; then fewer params; then bundle order.
 * `/agent-tasks/next` beats `/agent-tasks/{id}`; `/abteilungen/firma/{firmaId}`
 * beats `/abteilungen/{id}/personen`.
 */
function compareRoutes(a: Route, b: Route): number {
  const length = Math.min(a.templated.length, b.templated.length);
  for (let i = 0; i < length; i++) {
    if (a.templated[i] !== b.templated[i]) return a.templated[i] ? 1 : -1;
  }
  return a.paramCount - b.paramCount || a.order - b.order;
}

function stripTrailingSlash(path: string): string {
  // Express (strict routing off) treats one trailing slash as optional.
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

function readEnvironments(value: unknown, pointer: string): readonly DevOrTestMode[] | null {
  if (value === undefined) return null;
  if (!Array.isArray(value) || value.length === 0 || !value.every((v) => typeof v === 'string' && ENVIRONMENTS.has(v))) {
    throw new ContractLoadError(`${pointer}: x-environments must be a non-empty array of "development" and/or "test"`);
  }
  // Checked element by element just above.
  return Object.freeze([...(value as DevOrTestMode[])]);
}

function readBasePath(bundle: JsonObject): string {
  const servers = bundle['servers'];
  const first: unknown = Array.isArray(servers) ? servers[0] : undefined;
  const url = isObject(first) ? first['url'] : undefined;
  if (typeof url !== 'string' || !url.startsWith('/') || (url.length > 1 && url.endsWith('/'))) {
    throw new ContractLoadError('servers[0].url must be a relative base path such as "/api"');
  }
  return url === '/' ? '' : url;
}

/** Compiles every operation of a bundle. Exported for tests; the app uses {@link contract}. */
export function buildContract(bundle: unknown): Contract {
  const started = performance.now();
  const paths = isObject(bundle) ? bundle['paths'] : undefined;
  if (!isObject(bundle) || !isObject(paths)) {
    throw new ContractLoadError('the bundle is not an OpenAPI document with `paths`');
  }
  const root = bundle;
  const basePath = readBasePath(root);

  let ajvs: ReturnType<typeof createContractAjvs>;
  try {
    ajvs = createContractAjvs(root);
  } catch (err) {
    throw new ContractLoadError(`Ajv cannot register the bundle: ${errorText(err)}`, { cause: err });
  }
  const body = new Compiler(ajvs.body);
  const plain = new Compiler(ajvs.plain);

  if (!isObject(getAt(root, ['components', 'schemas', 'ErrorResponse']))) {
    throw new ContractLoadError('components.schemas.ErrorResponse is missing');
  }
  const errorResponseValidator = plain.at(['components', 'schemas', 'ErrorResponse'], 'ErrorResponse');

  const operations: ContractOperation[] = [];
  const byId = new Map<string, ContractOperation>();
  const byKey = new Map<string, ContractOperation>();
  const routes: Route[] = [];

  for (const specPath of Object.keys(paths)) {
    const item = follow(root, paths[specPath], ['paths', specPath]);
    if (!item) continue;
    for (const lower of HTTP_METHODS) {
      const opNode = item.node[lower];
      if (!isObject(opNode)) continue;
      const opLocated: Located = { node: opNode, segments: [...item.segments, lower] };
      const pointer = displayPointer(opLocated.segments);
      const method = lower.toUpperCase() as HttpMethod; // one of HTTP_METHODS, upper-cased
      const operationId = opNode['operationId'];
      if (typeof operationId !== 'string' || operationId.length === 0) {
        throw new ContractLoadError(`${pointer}: operationId is missing`);
      }
      if (byId.has(operationId)) throw new ContractLoadError(`${pointer}: duplicate operationId "${operationId}"`);
      const context = (what: string): string => `${operationId} ${what}`;

      // Path params: one object schema over the resolved parameter schemas.
      const names = templateNames(specPath);
      const pathParams = parametersOf(root, item, opLocated).filter((p) => p.in === 'path');
      const declared = pathParams.map((p) => p.name).sort();
      if (JSON.stringify(declared) !== JSON.stringify([...names].sort())) {
        throw new ContractLoadError(
          `${pointer}: path params in the template (${names.join(', ') || 'none'}) and in parameters (${declared.join(', ') || 'none'}) differ`,
        );
      }
      const pathIndex = new MessageIndexBuilder(root);
      pathIndex.patterns.add('');
      const pathProperties: JsonObject = {};
      for (const param of pathParams) {
        if (!isObject(param.located.node['schema'])) {
          throw new ContractLoadError(`${displayPointer(param.located.segments)}: path parameter "${param.name}" needs a schema`);
        }
        const schemaSegments = [...param.located.segments, 'schema'];
        pathProperties[param.name] = { $ref: specRef(schemaSegments) };
        pathIndex.collect(getAt(root, schemaSegments), `/${escapePointerSegment(param.name)}`);
      }
      const pathParamsValidator =
        names.length === 0
          ? null
          : plain.schema({ type: 'object', required: names, properties: pathProperties }, context('path params'));

      // Request body: application/json only.
      const bodyIndex = new MessageIndexBuilder(root);
      let bodyValidator: ValidateFunction | null = null;
      let bodyRequired = false;
      const requestBody = follow(root, opNode['requestBody'], [...opLocated.segments, 'requestBody']);
      if (requestBody) {
        const content = requestBody.node['content'];
        const media = isObject(content) ? content[JSON_MEDIA_TYPE] : undefined;
        if (!isObject(media) || !isObject(media['schema'])) {
          throw new ContractLoadError(`${pointer}: requestBody needs content.${JSON_MEDIA_TYPE}.schema`);
        }
        const schemaSegments = [...requestBody.segments, 'content', JSON_MEDIA_TYPE, 'schema'];
        bodyValidator = body.at(schemaSegments, context('request body'));
        bodyRequired = requestBody.node['required'] === true;
        bodyIndex.collect(media['schema'], '');
      }

      // Responses: status → validator of the JSON body (null without one).
      const responses = new Map<string, ContractResponse>();
      const responseNodes = opNode['responses'];
      if (isObject(responseNodes)) {
        for (const status of Object.keys(responseNodes)) {
          const response = follow(root, responseNodes[status], [...opLocated.segments, 'responses', status]);
          const content = response?.node['content'];
          const media = isObject(content) ? content[JSON_MEDIA_TYPE] : undefined;
          const validator =
            response && isObject(media) && isObject(media['schema'])
              ? plain.at([...response.segments, 'content', JSON_MEDIA_TYPE, 'schema'], context(`response ${status}`))
              : null;
          responses.set(status, Object.freeze({ status, validator }));
        }
      }

      const operation: ContractOperation = Object.freeze({
        operationId,
        method,
        specPath,
        pointer,
        pathParamNames: Object.freeze(names),
        pathParamsValidator,
        bodyValidator,
        bodyRequired,
        skipRequestValidation: opNode['x-skip-request-validation'] === true,
        environments: readEnvironments(opNode['x-environments'], pointer),
        responses,
        errorMessages: Object.freeze({ body: bodyIndex.build(), path: pathIndex.build() }),
      });
      operations.push(operation);
      byId.set(operationId, operation);
      // Key is case-folded: Express matches routes case-insensitively.
      byKey.set(`${method} ${specPath.toLowerCase()}`, operation);

      const segments = specPath.split('/').slice(1);
      const pattern = segments
        .map((segment) => segment.split(/\{[^}/]+\}/).map(escapeRegExp).join('[^/]+'))
        .join('/');
      routes.push({
        op: operation,
        // Case-insensitive like Express routing (caseSensitive is off by default).
        regex: new RegExp(`^${escapeRegExp(basePath)}/${pattern}$`, 'i'),
        templated: segments.map((segment) => segment.includes('{')),
        paramCount: names.length,
        order: routes.length,
      });
    }
  }

  // Candidates per method, best first (see compareRoutes).
  const routesByMethod = new Map<string, Route[]>();
  for (const route of routes) {
    const list = routesByMethod.get(route.op.method) ?? [];
    list.push(route);
    routesByMethod.set(route.op.method, list);
  }
  for (const list of routesByMethod.values()) list.sort(compareRoutes);

  const withHeadFallback = <T>(method: string, lookup: (m: string) => T | undefined): T | undefined => {
    const upper = method.toUpperCase();
    // Express answers HEAD with the GET route when no HEAD route exists.
    return lookup(upper) ?? (upper === 'HEAD' ? lookup('GET') : undefined);
  };

  const contract: Contract = {
    basePath,
    operations: Object.freeze(operations),
    errorResponseValidator,
    compileMs: Math.round((performance.now() - started) * 10) / 10,
    getOperation: (operationId) => byId.get(operationId),

    findOperation(method, expressFullPath) {
      // `req.baseUrl + req.route.path`, e.g. `/api/firmen/:id` → `/firmen/{id}`.
      const path = stripTrailingSlash(expressFullPath).replace(/:([A-Za-z0-9_]+)/g, '{$1}');
      // Express matches case-insensitively, so fold before comparing/stripping the base path.
      const folded = path.toLowerCase();
      const base = basePath.toLowerCase();
      if (folded !== base && !folded.startsWith(`${base}/`)) return undefined;
      const specPath = folded.slice(base.length) || '/';
      return withHeadFallback(method, (m) => byKey.get(`${m} ${specPath}`));
    },

    matchOperation(method, originalUrl) {
      const queryAt = originalUrl.search(/[?#]/);
      const path = stripTrailingSlash(queryAt >= 0 ? originalUrl.slice(0, queryAt) : originalUrl);
      return withHeadFallback(method, (m) => routesByMethod.get(m)?.find((route) => route.regex.test(path))?.op);
    },
  };
  return Object.freeze(contract);
}

/** Reads and compiles the bundle file. Throws {@link ContractLoadError} with a fix hint. */
export function loadContract(file: string = BUNDLE_FILE): Contract {
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (err) {
    throw new ContractLoadError(
      `cannot read the API contract bundle at ${file} (${errorText(err)}). Run "cd backend && npm run api:generate".`,
      { cause: err },
    );
  }
  let bundle: unknown;
  try {
    bundle = JSON.parse(text);
  } catch (err) {
    throw new ContractLoadError(
      `the API contract bundle at ${file} is not valid JSON (${errorText(err)}). Run "cd backend && npm run api:generate".`,
      { cause: err },
    );
  }
  return buildContract(bundle);
}

/** The compiled contract of this process, built once at import. */
export const contract: Contract = loadContract();

/** Operation by operationId. */
export function getOperation(operationId: string): ContractOperation | undefined {
  return contract.getOperation(operationId);
}

/**
 * Operation for a matched Express route: `findOperation(req.method, req.baseUrl + req.route.path)`.
 * Converts `:id` to `{id}`, strips the base path and one trailing slash. HEAD falls back to GET.
 * Used by `specValidate`.
 */
export function findOperation(method: string, expressFullPath: string): ContractOperation | undefined {
  return contract.findOperation(method, expressFullPath);
}

/**
 * Operation for a raw request URL (`req.originalUrl`, never `req.baseUrl`).
 * Strips the query and one trailing slash, matches case-insensitively
 * (`{param}` → `[^/]+`), static segments before templated ones. HEAD falls back to GET.
 * Used by the response check when `specValidate` did not set `res.locals.contractOp`.
 */
export function matchOperation(method: string, originalUrl: string): ContractOperation | undefined {
  return contract.matchOperation(method, originalUrl);
}

/** Declared response for a numeric status: exact, then `4XX`-style range, then `default`. */
export function findResponse(op: ContractOperation, status: number): ContractResponse | undefined {
  const range = `${Math.floor(status / 100)}XX`;
  return op.responses.get(String(status)) ?? op.responses.get(range) ?? op.responses.get(range.toLowerCase()) ?? op.responses.get('default');
}
