/**
 * Maps Ajv errors to the `fieldErrors` of the standard 400 answer
 * (PRD TN4, openapi/README.md "Error texts").
 *
 * Keys:
 * - body: dot path inside the body (`name`, `humanSteps.works.3`); for
 *   `required` the path plus `missingProperty`; the body root is `_`
 * - path: the param name (`id`, `firmaId`)
 *
 * One text per key. Precedence: required/type → const/enum →
 * format/anyOf/oneOf/pattern → length/range/items → others; equal rank keeps
 * Ajv's order. Text: `x-error-messages[keyword]` found by walking the contract
 * along the instance path (see `MessageIndex`), else a German default.
 */
import type { ErrorObject } from 'ajv/dist/2020.js';
import { ValidationError } from '../utils/errors.js';
import { unescapePointerSegment, escapePointerSegment } from './ajv.js';
import { findErrorMessages, type ContractOperation } from './contract.js';

export type ErrorLocation = 'body' | 'path';

/** Top-level message of every body and path-param error. */
export const VALIDATION_ERROR_MESSAGE = 'Validierungsfehler';
/** fieldErrors key for an error on the body itself (e.g. the body is not an object). */
export const ROOT_ERROR_KEY = '_';

export const DEFAULT_MESSAGES = Object.freeze({
  required: 'Ungültiger Wert',
  integer: 'Muss eine ganze Zahl sein',
  boolean: 'Muss true oder false sein',
  type: 'Ungültiger Wert',
  root: 'Ungültige Anfrage',
  maxLength: 'Maximal {limit} Zeichen',
  range: 'Muss zwischen {min} und {max} liegen',
  nonNegative: 'Darf nicht negativ sein',
  uri: 'Ungültige URL',
  pathParam: 'Ungültige ID',
  fallback: 'Ungültiger Wert',
});

const RANKS: ReadonlyMap<string, number> = new Map([
  ['required', 0],
  ['type', 0],
  ['const', 1],
  ['enum', 1],
  ['format', 2],
  ['anyOf', 2],
  ['oneOf', 2],
  ['pattern', 2],
  ...[
    'minLength', 'maxLength', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf',
    'minItems', 'maxItems', 'uniqueItems', 'minContains', 'maxContains', 'minProperties', 'maxProperties',
  ].map((keyword): [string, number] => [keyword, 3]),
]);
const OTHER_RANK = 4;

/** schemaPath of an error raised inside an `anyOf`/`oneOf` branch (inlined refs). */
const BRANCH_SCHEMA_PATH = /\/(?:anyOf|oneOf)\/\d+\//;
const MAX_VALUE_LENGTH = 100;

interface Candidate {
  readonly error: ErrorObject;
  readonly rank: number;
}

/** Instance pointer the error is about: for `required`, the missing property's own path. */
function subjectPointer(error: ErrorObject): string {
  const missing: unknown = error.params['missingProperty'];
  return error.keyword === 'required' && typeof missing === 'string'
    ? `${error.instancePath}/${escapePointerSegment(missing)}`
    : error.instancePath;
}

function keyOf(pointer: string, location: ErrorLocation): string {
  if (pointer === '') return ROOT_ERROR_KEY;
  const segments = pointer.split('/').slice(1).map(unescapePointerSegment);
  // Path params: the param name (the validator sees a flat object).
  return location === 'path' ? (segments[0] ?? ROOT_ERROR_KEY) : segments.join('.');
}

function isAtOrBelow(pointer: string, ancestor: string): boolean {
  return pointer === ancestor || pointer.startsWith(`${ancestor}/`);
}

interface FailedUnion {
  /** Instance path of the failed anyOf/oneOf. */
  readonly pointer: string;
  /** schemaPath of the schema object that holds the anyOf/oneOf, with a trailing `/`. */
  readonly schemaPrefix: string;
}

/**
 * Drops errors from inside a failed `anyOf`/`oneOf` branch; the
 * `anyOf`/`oneOf` error itself speaks for them. Branch errors carry the
 * branch's keywords (an email `"bad"` also gets "must be null"), which would
 * pick the wrong text. Ajv's `schemaPath` shows a branch in three ways:
 * - inline branch: contains `/anyOf/<n>/`
 * - inlined `$ref` branch: the target's path (`#/components/schemas/X/enum`)
 * - non-inlined `$ref` branch: the callee's own root (`#/type`)
 *
 * So for each failed union at instance path P whose holder schema has
 * schemaPath S, keep an error at or below P only when its schemaPath starts
 * with `S/` (a sibling keyword such as `type` next to `anyOf`).
 */
function withoutBranchErrors(errors: readonly ErrorObject[]): ErrorObject[] {
  const unions: FailedUnion[] = errors
    .filter((e) => (e.keyword === 'anyOf' || e.keyword === 'oneOf') && !BRANCH_SCHEMA_PATH.test(e.schemaPath))
    .map((e) => ({ pointer: e.instancePath, schemaPrefix: e.schemaPath.slice(0, e.schemaPath.lastIndexOf('/') + 1) }));
  return errors.filter((error) => {
    if (BRANCH_SCHEMA_PATH.test(error.schemaPath)) return false;
    const pointer = subjectPointer(error);
    return unions.every((union) => !isAtOrBelow(pointer, union.pointer) || error.schemaPath.startsWith(union.schemaPrefix));
  });
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function schemaNumber(error: ErrorObject, keyword: string): number | undefined {
  const parent: unknown = error.parentSchema;
  return typeof parent === 'object' && parent !== null ? asNumber((parent as Record<string, unknown>)[keyword]) : undefined;
}

function typeList(schema: unknown): string[] {
  if (typeof schema === 'string') return [schema];
  return Array.isArray(schema) ? schema.filter((t): t is string => typeof t === 'string') : [];
}

function defaultText(error: ErrorObject, location: ErrorLocation, key: string): string {
  if (location === 'path') return DEFAULT_MESSAGES.pathParam;
  if (key === ROOT_ERROR_KEY) return DEFAULT_MESSAGES.root;
  switch (error.keyword) {
    case 'required':
      return DEFAULT_MESSAGES.required;
    case 'type': {
      const types = typeList(error.schema);
      if (types.includes('integer') && typeof error.data === 'number') return DEFAULT_MESSAGES.integer;
      if (types.includes('boolean')) return DEFAULT_MESSAGES.boolean;
      return DEFAULT_MESSAGES.type;
    }
    case 'maxLength':
      return DEFAULT_MESSAGES.maxLength;
    case 'minimum':
    case 'maximum': {
      const min = schemaNumber(error, 'minimum');
      const max = schemaNumber(error, 'maximum');
      if (min !== undefined && max !== undefined) return DEFAULT_MESSAGES.range;
      if (error.keyword === 'minimum' && min === 0) return DEFAULT_MESSAGES.nonNegative;
      return DEFAULT_MESSAGES.fallback;
    }
    case 'format':
      return error.params['format'] === 'uri' ? DEFAULT_MESSAGES.uri : DEFAULT_MESSAGES.fallback;
    default:
      return DEFAULT_MESSAGES.fallback;
  }
}

function formatValue(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > MAX_VALUE_LENGTH ? `${text.slice(0, MAX_VALUE_LENGTH)}…` : text;
}

/** Fills `{limit}`, `{min}`, `{max}`, `{value}`. A placeholder without a value stays as written. */
function fillPlaceholders(text: string, error: ErrorObject): string {
  return text.replace(/\{(limit|min|max|value)\}/g, (whole, name: string) => {
    let value: string | undefined;
    if (name === 'limit') {
      const limit = asNumber(error.params['limit']);
      value = limit === undefined ? undefined : String(limit);
    } else if (name === 'min') {
      const min = schemaNumber(error, 'minimum') ?? schemaNumber(error, 'exclusiveMinimum');
      value = min === undefined ? undefined : String(min);
    } else if (name === 'max') {
      const max = schemaNumber(error, 'maximum') ?? schemaNumber(error, 'exclusiveMaximum');
      value = max === undefined ? undefined : String(max);
    } else if (error.keyword !== 'required') {
      value = formatValue(error.data);
    }
    return value ?? whole;
  });
}

/**
 * Ajv errors (from `op.bodyValidator` or `op.pathParamsValidator`, read right
 * after the call) → `fieldErrors`. Empty input gives `{}`.
 */
export function mapAjvErrors(
  errors: readonly ErrorObject[] | null | undefined,
  location: ErrorLocation,
  op: ContractOperation,
): Record<string, string> {
  if (!errors || errors.length === 0) return {};
  const index = location === 'body' ? op.errorMessages.body : op.errorMessages.path;

  // One candidate per key: lowest rank wins, equal rank keeps the first.
  const best = new Map<string, Candidate>();
  for (const error of withoutBranchErrors(errors)) {
    const key = keyOf(subjectPointer(error), location);
    const rank = RANKS.get(error.keyword) ?? OTHER_RANK;
    const current = best.get(key);
    if (!current || rank < current.rank) best.set(key, { error, rank });
  }

  const fieldErrors = new Map<string, string>();
  for (const [key, { error }] of best) {
    const messages = findErrorMessages(index, subjectPointer(error));
    const override = messages && Object.hasOwn(messages, error.keyword) ? messages[error.keyword] : undefined;
    fieldErrors.set(key, fillPlaceholders(override ?? defaultText(error, location, key), error));
  }
  // fromEntries defines own data properties, so a key like `__proto__` stays a plain key.
  return Object.fromEntries(fieldErrors);
}

/** The standard 400: message "Validierungsfehler" plus the mapped field errors. */
export function toValidationError(fieldErrors: Record<string, string>): ValidationError {
  return new ValidationError(VALIDATION_ERROR_MESSAGE, fieldErrors);
}
