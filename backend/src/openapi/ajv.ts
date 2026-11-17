/**
 * The one Ajv setup for the API contract. Used by the runtime
 * (`contract.ts`) and by `scripts/api-check.ts` (step 4), so both compile the
 * bundle exactly the same way. Documented in openapi/README.md ("Ajv setup").
 */
import { Ajv2020, type Logger, type Options } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

/**
 * Ajv 8 marks `unicode` as deprecated and warns on every instance, but still
 * honors `unicode: false` (limitLength uses `.length`). We set it on purpose,
 * so drop exactly that warning; everything else goes to the console.
 */
const UNICODE_DEPRECATION = 'DEPRECATED: option unicode.';
const AJV_LOGGER: Logger = {
  log: (...args: unknown[]) => console.log(...args),
  warn: (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith(UNICODE_DEPRECATION)) return;
    console.warn(...args);
  },
  error: (...args: unknown[]) => console.error(...args),
};

/** Key under which the bundle is registered; refs look like `spec#/components/schemas/X`. */
export const SPEC_ID = 'spec';

/** The only formats the contract may use (`rule/allowed-formats`). */
export const CONTRACT_FORMATS = ['email', 'uri'] as const;

/**
 * `strict: false` makes Ajv ignore OAS keywords (`example`, `discriminator`,
 * `xml`, `externalDocs`) and every `x-*` keyword. `verbose: true` puts
 * `schema`, `parentSchema` and `data` on every error (the error mapper needs them).
 * `unicode: false`: `minLength`/`maxLength` count UTF-16 code units, like JS
 * `.length` and Zod's `.min()`/`.max()` (Ajv's default counts code points, so
 * 255 × '😀' would pass Ajv's `maxLength: 255`).
 */
export const AJV_BASE_OPTIONS: Readonly<Options> = Object.freeze({
  strict: false,
  allowUnionTypes: true,
  allErrors: true,
  verbose: true,
  unicode: false,
  logger: AJV_LOGGER,
});

/**
 * Request bodies: strip unknown fields, never coerce ("5" stays a string).
 * `removeAdditional: 'all'` mutates the data: always validate a deep clone.
 * Ajv strips only on object schemas that declare `properties`.
 */
export const AJV_BODY_OPTIONS: Readonly<Options> = Object.freeze({
  removeAdditional: 'all',
  coerceTypes: false,
});

/** `body`: request bodies. `plain`: path params and responses (no coercion, no removal). */
export type ContractAjvKind = 'body' | 'plain';

/** A fresh Ajv 2020 instance of the given kind, with the contract formats, without the bundle. */
export function createAjv(kind: ContractAjvKind): Ajv2020 {
  const ajv = new Ajv2020(kind === 'body' ? { ...AJV_BASE_OPTIONS, ...AJV_BODY_OPTIONS } : { ...AJV_BASE_OPTIONS });
  // ajv-formats is CommonJS; under NodeNext its default import is module.exports,
  // whose `.default` is the plugin function (types and runtime agree).
  addFormats.default(ajv, [...CONTRACT_FORMATS]);
  return ajv;
}

export interface ContractAjvs {
  /** Request bodies: `removeAdditional: 'all'`, `coerceTypes: false`. */
  readonly body: Ajv2020;
  /** Path params and responses: no coercion, no removal. */
  readonly plain: Ajv2020;
}

/** Both instances, each with the bundle registered as `spec` (once per instance). */
export function createContractAjvs(bundle: Readonly<Record<string, unknown>>): ContractAjvs {
  const body = createAjv('body');
  const plain = createAjv('plain');
  body.addSchema(bundle, SPEC_ID);
  plain.addSchema(bundle, SPEC_ID);
  return { body, plain };
}

/** Escapes one JSON-pointer segment (`~` → `~0`, `/` → `~1`). */
export function escapePointerSegment(segment: string): string {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1');
}

/** Reverses {@link escapePointerSegment}. */
export function unescapePointerSegment(segment: string): string {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~');
}

/** Ajv ref into the registered bundle: segments JSON-pointer-escaped, then URI-encoded. */
export function specRef(segments: readonly string[]): string {
  return `${SPEC_ID}#${segments.map((s) => `/${encodeURIComponent(escapePointerSegment(s))}`).join('')}`;
}
