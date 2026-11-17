/**
 * Approved behavior changes D1, D3, D4, D5 against the suite backend.
 */
import { test, expect, request as playwrightRequest } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { loginCtx } from './helpers.js';
import { CHANCE_PHASE } from '../db/schema/enums.js';

const BASE_URL = 'http://localhost:7070';

interface ErrorBody {
  status: number;
  message: string;
  timestamp: string;
  fieldErrors: Record<string, string>;
}

let adminCtx: APIRequestContext;
let anonCtx: APIRequestContext;

test.beforeAll(async () => {
  adminCtx = await loginCtx('admin', 'admin123');
  anonCtx = await playwrightRequest.newContext({ baseURL: BASE_URL });
});

test.afterAll(async () => {
  await adminCtx.dispose();
  await anonCtx.dispose();
});

test.describe('D1 chancen phase error', () => {
  test('invalid phase answers 400 in the standard shape', async () => {
    const resp = await adminCtx.get('/api/chancen?phase=BOGUS');
    expect(resp.status()).toBe(400);
    const message = `Ungültiger phase-Wert: BOGUS. Erlaubt: ${CHANCE_PHASE.join(', ')}`;
    expect((await resp.json()) as ErrorBody).toEqual({
      status: 400,
      message,
      timestamp: expect.any(String),
      fieldErrors: { phase: message },
    });
  });
});

test.describe('D3 JSON 404 catch-all', () => {
  test('unknown /api path answers 404 JSON', async () => {
    const resp = await adminCtx.get('/api/does-not-exist');
    expect(resp.status()).toBe(404);
    expect((await resp.json()) as ErrorBody).toEqual({
      status: 404,
      message: 'Ressource nicht gefunden',
      timestamp: expect.any(String),
      fieldErrors: {},
    });
  });

  test('unsupported method on a known path answers 404 JSON', async () => {
    const resp = await adminCtx.delete('/api/firmen');
    expect(resp.status()).toBe(404);
    expect((await resp.json()) as ErrorBody).toEqual({
      status: 404,
      message: 'Ressource nicht gefunden',
      timestamp: expect.any(String),
      fieldErrors: {},
    });
  });
});

test.describe('D4 body-parser errors', () => {
  test('malformed JSON answers 400 Validierungsfehler', async () => {
    const resp = await adminCtx.post('/api/firmen', {
      headers: { 'content-type': 'application/json' },
      data: '{"name": ',
    });
    expect(resp.status()).toBe(400);
    expect((await resp.json()) as ErrorBody).toEqual({
      status: 400,
      message: 'Validierungsfehler',
      timestamp: expect.any(String),
      fieldErrors: { _: 'Ungültige Anfrage' },
    });
  });

  test('a 150 KB body answers 413 Anfrage zu groß', async () => {
    const resp = await adminCtx.post('/api/firmen', {
      headers: { 'content-type': 'application/json' },
      data: JSON.stringify({ name: 'a'.repeat(150 * 1024) }),
    });
    expect(resp.status()).toBe(413);
    expect((await resp.json()) as ErrorBody).toEqual({
      status: 413,
      message: 'Anfrage zu groß',
      timestamp: expect.any(String),
      fieldErrors: {},
    });
  });
});

test.describe('D5 test-login availability', () => {
  test('testLogin answers 200 in test mode', async () => {
    const resp = await anonCtx.post('/api/auth/test-login', { data: { benutzername: 'admin' } });
    expect(resp.status()).toBe(200);
  });
});
