/**
 * Compile-time checks for ApiClient. Compiled by `ng build`, never executed:
 * the function below is not called.
 */
import type { Observable } from 'rxjs';
import type { ApiClient } from './api-client';
import type { components } from './api-types';
import type { AssertTrue, Equal } from './type-utils';

declare const api: ApiClient;

export function apiClientTypeChecks(): void {
  // --- must NOT compile ---

  // Guarantee: only contract paths are callable.
  // @ts-expect-error unknown path
  api.get('/does-not-exist');

  // Guarantee: required path params must be passed.
  // @ts-expect-error getFirma needs `path`
  api.get('/firmen/{id}');

  // Guarantee: only methods the contract has on a path are callable.
  // @ts-expect-error '/firmen/{id}' has no POST
  api.post('/firmen/{id}', { path: { id: 1 } });

  // Guarantee: operations without a request body reject one.
  // @ts-expect-error GET '/firmen' takes no body
  api.get('/firmen', { body: { name: 'x' } });

  // Guarantee: required request bodies must be passed.
  // @ts-expect-error createFirma requires a body
  api.post('/firmen');

  // Guarantee: required query params must be passed (no options at all).
  // @ts-expect-error claimNextAgentTask requires `source`
  api.get('/agent-tasks/next');

  // Guarantee: required query params must be passed (options without query).
  // @ts-expect-error claimNextAgentTask requires `source`
  api.get('/agent-tasks/next', {});

  // Guarantee: query enum values are checked.
  // @ts-expect-error 'NOPE' is not a TicketStatus
  api.get('/tickets', { query: { status: 'NOPE' } });

  // Guarantee: query names are checked.
  // @ts-expect-error `bogus` is not a query param of GET /firmen
  api.get('/firmen', { query: { bogus: 1 } });

  // Guarantee: body field types are checked.
  // @ts-expect-error name must be a string
  api.post('/firmen', { body: { name: 123 } });

  // Guarantee: the response type is the contract's, not any.
  // @ts-expect-error a Firma is not a string
  const wrong: Observable<string> = api.get('/firmen/{id}', { path: { id: 1 } });
  void wrong;

  // Guarantee: path param keys are checked.
  // @ts-expect-error '/firmen/{id}' has `id`, not `firmaId`
  api.get('/firmen/{id}', { path: { firmaId: 1 } });

  // --- must compile ---

  // Guarantee: 204 answers type as void.
  const deleted = api.delete('/firmen/{id}', { path: { id: 1 } });
  type _Deleted = AssertTrue<Equal<typeof deleted, Observable<void>>>;

  // Guarantee: optional bodies may be omitted or passed.
  api.post('/tickets/{id}/hand-to-ai', { path: { id: 1 } });
  api.post('/tickets/{id}/hand-to-ai', { path: { id: 1 }, body: {} });

  // Guarantee: path params accept numbers and strings.
  api.get('/firmen/{id}', { path: { id: 5 } });
  api.get('/firmen/{id}', { path: { id: '5' } });

  // Guarantee: all-optional queries and options may be omitted; required query works.
  api.get('/firmen');
  api.get('/agent-tasks/next', { query: { source: 'EMAIL' } });

  // Guarantee: JSON responses carry the generated schema type.
  const firma: Observable<components['schemas']['Firma']> = api.get('/firmen/{id}', { path: { id: 1 } });
  void firma;
}
