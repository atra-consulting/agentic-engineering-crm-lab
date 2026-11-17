/**
 * Input validation after the switch to contract validation: stripping of unknown
 * fields, ID path checks, routes that must not reject a missing body, auth order,
 * and pagination/sort edge cases.
 */
import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { loginCtx, resetDatabase } from './helpers.js';
import { TEST_AGENT_TOKEN } from './globalSetup.js';

const BASE_URL = 'http://localhost:7070';

interface ErrorBody {
  status: number;
  message: string;
  fieldErrors: Record<string, string>;
}
interface Page {
  content: unknown[];
  number: number;
  size: number;
}

test.describe('input validation', () => {
  let admin: APIRequestContext;
  let user: APIRequestContext;
  let anon: APIRequestContext;
  let agent: APIRequestContext;
  const createdFirmen: number[] = [];

  test.beforeAll(async () => {
    admin = await loginCtx('admin', 'admin123');
    user = await loginCtx('user', 'test123');
    anon = await playwrightRequest.newContext({ baseURL: BASE_URL });
    agent = await playwrightRequest.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${TEST_AGENT_TOKEN}` },
    });
  });

  test.afterAll(async () => {
    for (const id of createdFirmen) await admin.delete(`/api/firmen/${id}`);
    await admin.post('/api/tickets/reset');
    await resetDatabase();
    await admin.dispose();
    await user.dispose();
    await anon.dispose();
    await agent.dispose();
  });

  test('POST /api/firmen strips unknown field isAdmin', async () => {
    const resp = await admin.post('/api/firmen', { data: { name: 'Strip Test GmbH', isAdmin: true } });
    expect(resp.status()).toBe(201);
    const created = (await resp.json()) as Record<string, unknown> & { id: number };
    createdFirmen.push(created.id);
    expect(created).not.toHaveProperty('isAdmin');

    const get = await admin.get(`/api/firmen/${created.id}`);
    expect(get.status()).toBe(200);
    expect((await get.json()) as Record<string, unknown>).not.toHaveProperty('isAdmin');
  });

  test('POST /api/personen with string firmaId "5" -> 400 Firma ist erforderlich', async () => {
    const resp = await admin.post('/api/personen', { data: { firstName: 'A', lastName: 'B', firmaId: '5' } });
    expect(resp.status()).toBe(400);
    const body = (await resp.json()) as ErrorBody;
    expect(body.fieldErrors['firmaId']).toBe('Firma ist erforderlich');
  });

  // JSON.parse('1e400') is Infinity. Zod answered 400; libsql would throw (500).
  for (const [method, path] of [['post', '/api/chancen'], ['put', '/api/chancen/1']] as const) {
    test(`${method.toUpperCase()} ${path} with wert 1e400 (Infinity) -> 400 fieldErrors.wert`, async () => {
      const resp = await admin[method](path, {
        data: '{"titel":"x","firmaId":1,"wert":1e400}',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(resp.status()).toBe(400);
      const body = (await resp.json()) as ErrorBody;
      expect(body.message).toBe('Validierungsfehler');
      expect(body.fieldErrors).toHaveProperty('wert');
    });
  }

  for (const badId of ['abc', '0', '-1', '01']) {
    test(`GET /api/firmen/${badId} -> 400 Ungültige ID`, async () => {
      const resp = await admin.get(`/api/firmen/${badId}`);
      expect(resp.status()).toBe(400);
      const body = (await resp.json()) as ErrorBody;
      expect(body.message).toBe('Validierungsfehler');
      expect(body.fieldErrors['id']).toBe('Ungültige ID');
    });
  }

  test('GET /api/abteilungen/firma/abc -> 400 with fieldErrors.firmaId', async () => {
    const resp = await admin.get('/api/abteilungen/firma/abc');
    expect(resp.status()).toBe(400);
    const body = (await resp.json()) as ErrorBody;
    expect(body.fieldErrors).toHaveProperty('firmaId');
  });

  test('POST /api/tickets/1/start without body is not rejected with 400 (agent token)', async () => {
    const resp = await agent.post('/api/tickets/1/start');
    expect(resp.status()).not.toBe(400);
  });

  test('POST /api/agent-tasks/1/done without body is not rejected with 400', async () => {
    const resp = await agent.post('/api/agent-tasks/1/done');
    expect(resp.status()).not.toBe(400);
  });

  test('POST /api/tickets/1/hand-to-ai with {} is not rejected with 400 (admin)', async () => {
    const resp = await admin.post('/api/tickets/1/hand-to-ai', { data: {} });
    expect(resp.status()).not.toBe(400);
  });

  test('POST /api/auth/logout without body -> 200', async () => {
    const ctx = await loginCtx('demo', 'demo1234');
    try {
      const resp = await ctx.post('/api/auth/logout');
      expect(resp.status()).toBe(200);
    } finally {
      await ctx.dispose();
    }
  });

  test('mixed-case paths match like Express: /api/Firmen/1, /api/FIRMEN/1, /API/Firmen/1, /Api/firmen/1 -> 200, same body', async () => {
    const base = await admin.get('/api/firmen/1');
    expect(base.status()).toBe(200);
    const expected = (await base.json()) as unknown;
    for (const path of ['/api/Firmen/1', '/api/FIRMEN/1', '/API/Firmen/1', '/Api/firmen/1']) {
      const resp = await admin.get(path);
      expect(resp.status(), path).toBe(200);
      expect((await resp.json()) as unknown, path).toEqual(expected);
    }
  });

  for (const path of ['/api/AUTH/logout', '/API/auth/logout']) {
    test(`POST ${path} (mixed case) -> 200`, async () => {
      const ctx = await loginCtx('demo', 'demo1234');
      try {
        const resp = await ctx.post(path);
        expect(resp.status()).toBe(200);
      } finally {
        await ctx.dispose();
      }
    });
  }

  test('login without passwort -> 401 Ungültige Anmeldedaten', async () => {
    const resp = await anon.post('/api/auth/login', { data: { benutzername: 'admin' } });
    expect(resp.status()).toBe(401);
    expect(((await resp.json()) as ErrorBody).message).toBe('Ungültige Anmeldedaten');
  });

  test('test-login without benutzername -> 401 benutzername required', async () => {
    const resp = await anon.post('/api/auth/test-login', { data: {} });
    expect(resp.status()).toBe(401);
    expect(((await resp.json()) as ErrorBody).message).toBe('benutzername required');
  });

  test('POST /api/firmen with [] and no cookie -> 401 (auth before validation)', async () => {
    const resp = await anon.post('/api/firmen', {
      headers: { 'Content-Type': 'application/json' },
      data: '[]',
    });
    expect(resp.status()).toBe(401);
  });

  test('POST /api/tickets/reset as user without loopback bypass -> 403 (not 400)', async () => {
    const resp = await user.post('/api/tickets/reset', { headers: { 'X-Forwarded-For': '203.0.113.1' } });
    expect(resp.status()).toBe(403);
  });

  test('GET /api/firmen?page=abc&size=abc -> 200, number 0, size 10', async () => {
    const resp = await admin.get('/api/firmen', { params: { page: 'abc', size: 'abc' } });
    expect(resp.status()).toBe(200);
    const body = (await resp.json()) as Page;
    expect(body.number).toBe(0);
    expect(body.size).toBe(10);
  });

  test('GET /api/firmen?size=500 -> 200, size capped to 200', async () => {
    const resp = await admin.get('/api/firmen', { params: { size: '500' } });
    expect(resp.status()).toBe(200);
    expect(((await resp.json()) as Page).size).toBe(200);
  });

  test('GET /api/firmen?sort=bogus,asc -> 400 Ungültiges Sortierfeld: bogus', async () => {
    const resp = await admin.get('/api/firmen', { params: { sort: 'bogus,asc' } });
    expect(resp.status()).toBe(400);
    expect(((await resp.json()) as ErrorBody).message).toBe('Ungültiges Sortierfeld: bogus');
  });

  test('GET /api/chancen?search=a&search=b -> 200', async () => {
    const resp = await admin.get('/api/chancen?search=a&search=b');
    expect(resp.status()).toBe(200);
  });
});
