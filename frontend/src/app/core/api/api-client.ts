/**
 * Typed wrapper over HttpClient. Paths, methods, params and bodies are checked against the
 * generated OpenAPI types (`api-types.ts`), so `ng build` fails when a call drifts from the contract.
 *
 * Example: `api.get('/firmen/{id}', { path: { id } })` sends GET /api/firmen/5 (for id = 5).
 *
 * Type idiom: `[X] extends [never]` (tuple-wrapped) avoids distribution over `never`/`undefined`,
 * so "is this absent?" checks give one answer instead of a union.
 */
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { paths } from './api-types';

export type ApiMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

type Paths = paths;

/** Paths whose `M` entry is a real operation (not `undefined` / `never`). */
export type PathsWith<M extends ApiMethod> = {
  [P in keyof Paths]: [NonNullable<Paths[P][M]>] extends [never] ? never : P;
}[keyof Paths];

type Op<P extends keyof Paths, M extends ApiMethod> = NonNullable<Paths[P][M]>;

type ParamsOf<P extends keyof Paths, M extends ApiMethod> = Op<P, M> extends { parameters: infer X } ? X : never;

type PathObj<P extends keyof Paths, M extends ApiMethod> = ParamsOf<P, M> extends { path?: infer X }
  ? [NonNullable<X>] extends [never]
    ? never
    : NonNullable<X>
  : never;

/** Path params of the operation, each widened to `string | number`. `never` when absent. */
export type PathParams<P extends keyof Paths, M extends ApiMethod> = [PathObj<P, M>] extends [never]
  ? never
  : { [K in keyof PathObj<P, M>]: string | number };

type QueryObj<P extends keyof Paths, M extends ApiMethod> = ParamsOf<P, M> extends { query?: infer X }
  ? NonNullable<X>
  : never;

/** Query params of the operation. `never` when absent. */
export type QueryOf<P extends keyof Paths, M extends ApiMethod> = [QueryObj<P, M>] extends [never]
  ? never
  : QueryObj<P, M>;

/** True when the operation declares a non-optional `query` (e.g. `source` on GET /agent-tasks/next). */
export type QueryRequired<P extends keyof Paths, M extends ApiMethod> = ParamsOf<P, M> extends { query: unknown }
  ? [QueryOf<P, M>] extends [never]
    ? false
    : true
  : false;

type BodyObj<P extends keyof Paths, M extends ApiMethod> = Op<P, M> extends { requestBody?: infer X }
  ? NonNullable<X>
  : never;

/** JSON request body type. `never` when absent. */
export type RequestBody<P extends keyof Paths, M extends ApiMethod> = [BodyObj<P, M>] extends [never]
  ? never
  : BodyObj<P, M> extends { content: { 'application/json': infer B } }
    ? B
    : never;

/** True only when the operation's `requestBody` is required. */
export type BodyRequired<P extends keyof Paths, M extends ApiMethod> = [RequestBody<P, M>] extends [never]
  ? false
  : Op<P, M> extends { requestBody: unknown }
    ? true
    : false;

type SuccessContent<P extends keyof Paths, M extends ApiMethod> = Op<P, M> extends { responses: infer R }
  ? (R extends { 200: infer A } ? A : never) | (R extends { 201: infer B } ? B : never)
  : never;

type JsonOf<T> = T extends { content: { 'application/json': infer J } } ? J : never;

/** Union of the 200 and 201 JSON bodies. `void` when there is no JSON success body (204). */
export type JsonResponse<P extends keyof Paths, M extends ApiMethod> = [JsonOf<SuccessContent<P, M>>] extends [never]
  ? void
  : JsonOf<SuccessContent<P, M>>;

export type ApiOptions<P extends keyof Paths, M extends ApiMethod> = ([PathParams<P, M>] extends [never]
  ? { path?: never }
  : { path: PathParams<P, M> }) &
  ([QueryOf<P, M>] extends [never]
    ? { query?: never }
    : QueryRequired<P, M> extends true
      ? { query: QueryOf<P, M> }
      : { query?: QueryOf<P, M> }) &
  ([RequestBody<P, M>] extends [never]
    ? { body?: never }
    : BodyRequired<P, M> extends true
      ? { body: RequestBody<P, M> }
      : { body?: RequestBody<P, M> });

/** True when the caller must pass an options object (path params, a query or a body is required). */
export type NeedsOptions<P extends keyof Paths, M extends ApiMethod> = [PathParams<P, M>] extends [never]
  ? QueryRequired<P, M> extends true
    ? true
    : BodyRequired<P, M>
  : true;

type Args<P extends keyof Paths, M extends ApiMethod> = NeedsOptions<P, M> extends true
  ? [opts: ApiOptions<P, M>]
  : [opts?: ApiOptions<P, M>];

interface UntypedOptions {
  path?: Record<string, string | number>;
  query?: Record<string, unknown>;
  body?: unknown;
}

/**
 * Thin typed wrapper over HttpClient.
 * Callers must list query keys in the same order the old HttpParams.set chain used,
 * so URLs stay byte-identical.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private http = inject(HttpClient);

  get<P extends PathsWith<'get'>>(path: P, ...args: Args<P, 'get'>): Observable<JsonResponse<P, 'get'>> {
    return this.request('get', path, args[0]);
  }

  post<P extends PathsWith<'post'>>(path: P, ...args: Args<P, 'post'>): Observable<JsonResponse<P, 'post'>> {
    return this.request('post', path, args[0]);
  }

  put<P extends PathsWith<'put'>>(path: P, ...args: Args<P, 'put'>): Observable<JsonResponse<P, 'put'>> {
    return this.request('put', path, args[0]);
  }

  patch<P extends PathsWith<'patch'>>(path: P, ...args: Args<P, 'patch'>): Observable<JsonResponse<P, 'patch'>> {
    return this.request('patch', path, args[0]);
  }

  delete<P extends PathsWith<'delete'>>(path: P, ...args: Args<P, 'delete'>): Observable<JsonResponse<P, 'delete'>> {
    return this.request('delete', path, args[0]);
  }

  /**
   * Untyped core. The public methods enforce the contract; this one only builds the request.
   * The single cast: the result type is guaranteed by the typed callers.
   */
  private request<R>(method: ApiMethod, path: string, opts?: object): Observable<R> {
    const { path: pathParams, query, body } = (opts ?? {}) as UntypedOptions;
    const url =
      '/api' +
      path.replace(/\{(\w+)\}/g, (_m, name: string) => encodeURIComponent(String(pathParams?.[name])));

    // Order matters: params are appended in the caller's key order (never sorted), so URLs stay
    // byte-identical to the old HttpParams.set chain. Values go through String() (the contract has
    // no array or date params today); only undefined/null are skipped, '' is kept.
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value === undefined || value === null) continue;
      params = params.set(key, String(value));
    }

    return this.http.request<R>(method, url, { params, body });
  }
}
