/**
 * Compile-time checks for ApiClient. Compiled by `ng build`, never executed:
 * the function below is not called and nothing is exported.
 */
import type { Observable } from 'rxjs';
import type { ApiClient } from './api-client';

type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const assertTrue = <_T extends true>(): void => undefined;

declare const api: ApiClient;

export function apiClientTypeChecks(): void {
  // --- must NOT compile ---
  // @ts-expect-error unknown path
  api.get('/does-not-exist');

  // @ts-expect-error getFirma needs `path`
  api.get('/firmen/{id}');

  // @ts-expect-error '/firmen/{id}' has no POST
  api.post('/firmen/{id}', { path: { id: 1 } });

  // @ts-expect-error GET '/firmen' takes no body
  api.get('/firmen', { body: { name: 'x' } });

  // @ts-expect-error createFirma requires a body
  api.post('/firmen');

  // --- must compile ---
  const deleted = api.delete('/firmen/{id}', { path: { id: 1 } });
  assertTrue<Equal<typeof deleted, Observable<void>>>();

  api.post('/tickets/{id}/hand-to-ai', { path: { id: 1 } });
  api.post('/tickets/{id}/hand-to-ai', { path: { id: 1 }, body: {} });

  api.get('/firmen/{id}', { path: { id: 5 } });
  api.get('/firmen/{id}', { path: { id: '5' } });
  api.get('/firmen');
}
