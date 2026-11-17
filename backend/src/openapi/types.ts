/**
 * Type-only helpers over the generated contract types
 * (`src/generated/api-types.ts`, built by `npm run api:generate`).
 *
 *   Schema<'Firma'>                  → components['schemas']['Firma']
 *   RequestBody<'createFirma'>       → the JSON request body (never without one)
 *   JsonResponse<'getFirma', 200>    → the JSON answer for that status (never for 204)
 *   PathParams<'getFirma'>           → { id: string }
 */
import type { components, operations } from '../generated/api-types.js';

export type SchemaName = keyof components['schemas'];

/** A named component schema. */
export type Schema<Name extends SchemaName> = components['schemas'][Name];

export type OperationId = keyof operations;

type JsonContent<T> = T extends { content: { 'application/json': infer Body } } ? Body : never;

/** JSON request body of an operation; `never` when it declares none. Optional bodies give the body type. */
export type RequestBody<Op extends OperationId> = JsonContent<NonNullable<operations[Op]['requestBody']>>;

/** Status codes an operation declares (numeric literals, e.g. `200 | 400 | 401`). */
export type ResponseStatus<Op extends OperationId> = keyof operations[Op]['responses'];

/** JSON answer of an operation for one status; `never` for a status without a JSON body (204). */
export type JsonResponse<Op extends OperationId, Status extends ResponseStatus<Op>> = JsonContent<
  operations[Op]['responses'][Status]
>;

/** Path params of an operation (`never` when it has none). Values are strings, as Express delivers them. */
export type PathParams<Op extends OperationId> = NonNullable<operations[Op]['parameters']['path']>;

/** Query params of an operation (`never` when it has none). */
export type QueryParams<Op extends OperationId> = NonNullable<operations[Op]['parameters']['query']>;
