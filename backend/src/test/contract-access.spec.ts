/**
 * Contract access (security-relevant). Cases are generated from the bundle.
 *
 * Path params are `1`; operations with a requestBody get body `[]`. The access
 * check must run before input validation, so a 401/403 (not 400) proves order.
 *
 *  - non-empty security, no cookie, wrong X-Agent-Token        -> 401
 *  - x-loopback-bypass, no cookie, no token, X-Forwarded-For   -> 401 (bypass refused)
 *  - sessionCookie scope ADMIN, non-admin session, X-Forwarded-For -> 403
 *    (operations that list cronBearer -> 401, as the cron guard does)
 */
import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { loginCtx } from './helpers.js';
import { concretePath, deleteCronRuns, getOp, operations, type Operation } from './contract-helpers.js';

const BASE_URL = 'http://localhost:7070';
const FORWARDED = { 'X-Forwarded-For': '203.0.113.1' };

interface ErrorBody {
  status: number;
  message: string;
  timestamp: string;
  fieldErrors: Record<string, string>;
}

function schemesOf(op: Operation): Set<string> {
  return new Set(op.security.flatMap((req) => Object.keys(req)));
}

function requiresAdminScope(op: Operation): boolean {
  return op.security.some((req) => (req['sessionCookie'] ?? []).includes('ADMIN'));
}

async function call(
  ctx: APIRequestContext,
  op: Operation,
  headers: Record<string, string>,
) {
  return ctx.fetch(concretePath(op.fullPath), {
    method: op.method,
    headers,
    ...(op.hasBody ? { data: [] } : {}),
  });
}

async function expectErrorShape(resp: Awaited<ReturnType<typeof call>>, status: number): Promise<void> {
  expect(resp.status()).toBe(status);
  const body = (await resp.json()) as ErrorBody;
  expect(body.status).toBe(status);
  expect(typeof body.message).toBe('string');
  expect(typeof body.timestamp).toBe('string');
  expect(typeof body.fieldErrors).toBe('object');
  expect(body.fieldErrors).not.toBeNull();
}

const protectedOps = operations.filter((o) => o.security.length > 0);
const bypassOps = operations.filter((o) => o.loopbackBypass);
const adminOps = operations.filter(requiresAdminScope);

let anon: APIRequestContext;
let userCtx: APIRequestContext;
let adminCtx: APIRequestContext;
const createdCronRunIds: number[] = [];

test.beforeAll(async () => {
  anon = await playwrightRequest.newContext({ baseURL: BASE_URL });
  userCtx = await loginCtx('user', 'test123');
  adminCtx = await loginCtx('admin', 'admin123');
});

test.afterAll(async () => {
  await deleteCronRuns(createdCronRunIds);
  await anon.dispose();
  await userCtx.dispose();
  await adminCtx.dispose();
});

test.describe('contract access: unauthenticated with wrong agent token', () => {
  test('case counts are sane', () => {
    expect(protectedOps.length).toBeGreaterThan(0);
    expect(bypassOps.length).toBeGreaterThan(0);
    expect(adminOps.length).toBeGreaterThan(0);
  });

  for (const op of protectedOps) {
    test(`401 ${op.operationId} (${op.method} ${op.fullPath})`, async () => {
      const resp = await call(anon, op, { 'X-Agent-Token': 'wrong-token' });
      await expectErrorShape(resp, 401);
    });
  }
});

test.describe('contract access: loopback bypass is refused behind a proxy', () => {
  for (const op of bypassOps) {
    test(`401 ${op.operationId} with X-Forwarded-For and no token`, async () => {
      const resp = await call(anon, op, { ...FORWARDED });
      await expectErrorShape(resp, 401);
    });
  }
});

test.describe('contract access: non-admin session on ADMIN operations', () => {
  for (const op of adminOps) {
    const cron = schemesOf(op).has('cronBearer');
    const expected = cron ? 401 : 403;
    test(`${expected} ${op.operationId} as role USER`, async () => {
      const resp = await call(userCtx, op, { ...FORWARDED });
      await expectErrorShape(resp, expected);
    });
  }
});

test.describe('contract access: bypass and fallthrough rules', () => {
  test('loopback bypass works: getTicketBoard without auth headers -> 200', async () => {
    const op = getOp('getTicketBoard');
    const resp = await anon.fetch(concretePath(op.fullPath), { method: op.method });
    expect(resp.status()).toBe(200);
  });

  test('wrong agent token never falls through to the admin session: getTicket -> 401', async () => {
    const op = getOp('getTicket');
    const resp = await adminCtx.fetch(concretePath(op.fullPath), {
      method: op.method,
      headers: { 'X-Agent-Token': 'wrong' },
    });
    await expectErrorShape(resp, 401);
  });

  test('wrong cron bearer falls through to the admin session: triggerGithubIssuesRun -> 200', async () => {
    const op = getOp('triggerGithubIssuesRun');
    const resp = await adminCtx.fetch(concretePath(op.fullPath), {
      method: op.method,
      headers: { Authorization: 'Bearer wrong' },
    });
    expect(resp.status()).toBe(200);
    // Empty GH_DISPATCH_TOKEN: dispatch throws before any fetch -> FAILED or SKIPPED run.
    const run = (await resp.json()) as { id: number; status: string };
    createdCronRunIds.push(run.id);
    expect(['FAILED', 'SKIPPED']).toContain(run.status);
  });
});
