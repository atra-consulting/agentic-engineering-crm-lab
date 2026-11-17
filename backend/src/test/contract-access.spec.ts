/**
 * Contract access (security-relevant). Cases are generated from the bundle.
 *
 * Path params are `1`; operations with a requestBody get body `[]`. The access
 * check must run before input validation, so a 401/403 (not 400) proves order.
 *
 *  - non-empty security, no cookie, wrong X-Agent-Token        -> 401
 *  - x-loopback-bypass, no cookie, no token, X-Forwarded-For   -> 401 (bypass refused)
 *  - agent + sessionCookie ops: admin session + wrong token (header or bearer) -> 401
 *  - agent-only ops: admin session, no token, X-Forwarded-For -> 401
 *  - sessionCookie scope ADMIN, non-admin session, X-Forwarded-For -> 403
 *    (operations that list cronBearer -> 401, as the cron guard does)
 */
import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { loginCtx } from './helpers.js';
import type { Request, Response } from 'express';
import {
  requireAgentToken,
  requireAgentTokenOrAdminSession,
  requireAgentTokenOrSession,
} from '../middleware/agentAuth.js';
import {
  concretePath,
  cronRunBaseline,
  deleteCronRunsAbove,
  getOp,
  operations,
  type Operation,
} from './contract-helpers.js';

const BASE_URL = 'http://localhost:7070';
const FORWARDED = { 'X-Forwarded-For': '203.0.113.1' };
/** Each of these headers must make the loopback bypass refuse. */
const PROXY_HEADERS: Record<string, string>[] = [
  { 'X-Forwarded-For': '203.0.113.1' },
  { 'X-Real-IP': '203.0.113.1' },
  { Forwarded: 'for=203.0.113.1' },
];

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
const publicOps = operations.filter((o) => o.security.length === 0);
const bypassOps = operations.filter((o) => o.loopbackBypass);
const adminOps = operations.filter(requiresAdminScope);
const AGENT_SCHEMES = ['agentBearer', 'agentHeader'];
const hasAgent = (op: Operation): boolean => AGENT_SCHEMES.some((a) => schemesOf(op).has(a));
const hasSession = (op: Operation): boolean => schemesOf(op).has('sessionCookie');
const agentAndSessionOps = operations.filter((o) => hasAgent(o) && hasSession(o));
const agentOnlyOps = operations.filter((o) => hasAgent(o) && !hasSession(o));

const ids = (ops: Operation[]): string[] => ops.map((o) => o.operationId).sort();

let anon: APIRequestContext;
let userCtx: APIRequestContext;
let adminCtx: APIRequestContext;
let cronBaseline = 0;

test.beforeAll(async () => {
  anon = await playwrightRequest.newContext({ baseURL: BASE_URL });
  userCtx = await loginCtx('user', 'test123');
  adminCtx = await loginCtx('admin', 'admin123');
  cronBaseline = await cronRunBaseline();
});

test.afterAll(async () => {
  await deleteCronRunsAbove(cronBaseline);
  await anon.dispose();
  await userCtx.dispose();
  await adminCtx.dispose();
});

test.describe('contract access: oracle (security sets are pinned)', () => {
  test('public operations', () => {
    expect(ids(publicOps)).toEqual(['getHealth', 'login', 'logout', 'testLogin'].sort());
  });

  test('loopback bypass operations', () => {
    expect(ids(bypassOps)).toEqual(
      [
        'addTicketComment',
        'askTicketQuestion',
        'claimNextAgentTask',
        'claimNextTicket',
        'completeAgentTask',
        'completeCronRun',
        'completeTicket',
        'createTicket',
        'getAgentTask',
        'getTicket',
        'getTicketBoard',
        'rejectAgentTask',
        'setTicketOwner',
        'setTicketStatus',
        'startAgentTask',
        'startTicket',
      ].sort(),
    );
  });

  test('ADMIN-scope operations', () => {
    expect(ids(adminOps)).toEqual(
      [
        'addTicketComment',
        'askTicketQuestion',
        'completeTicket',
        'createTicket',
        'getAgentTask',
        'getAgentTaskSummary',
        'handTicketToAi',
        'listAgentTasks',
        'listCronJobs',
        'listCronRuns',
        'listTickets',
        'markTicketWontDo',
        'resetAgentTasks',
        'resetTickets',
        'setTicketOwner',
        'setTicketStatus',
        'startTicket',
        'triggerAgentTasksRun',
        'triggerGithubIssuesRun',
      ].sort(),
    );
  });

  test('every operation is public or protected', () => {
    expect(publicOps.length + protectedOps.length).toBe(operations.length);
  });
});

test.describe('contract access: unauthenticated with wrong agent token', () => {
  for (const op of protectedOps) {
    test(`401 ${op.operationId} (${op.method} ${op.fullPath})`, async () => {
      const resp = await call(anon, op, { 'X-Agent-Token': 'wrong-token' });
      await expectErrorShape(resp, 401);
    });
  }
});

test.describe('contract access: loopback bypass is refused behind a proxy', () => {
  for (const op of bypassOps) {
    for (const headers of PROXY_HEADERS) {
      const headerName = Object.keys(headers)[0] ?? '';
      test(`401 ${op.operationId} with ${headerName} and no token`, async () => {
        const resp = await call(anon, op, { ...headers });
        await expectErrorShape(resp, 401);
      });
    }
  }
});

test.describe('contract access: wrong agent token never falls through to a valid admin session', () => {
  for (const op of agentAndSessionOps) {
    test(`401 ${op.operationId} admin session + X-Agent-Token wrong`, async () => {
      const resp = await call(adminCtx, op, { 'X-Agent-Token': 'wrong' });
      await expectErrorShape(resp, 401);
    });
    test(`401 ${op.operationId} admin session + Authorization Bearer wrong`, async () => {
      const resp = await call(adminCtx, op, { Authorization: 'Bearer wrong' });
      await expectErrorShape(resp, 401);
    });
  }
});

test.describe('contract access: agent-only operations ignore a valid admin session', () => {
  for (const op of agentOnlyOps) {
    test(`401 ${op.operationId} admin session, X-Forwarded-For, no token`, async () => {
      const resp = await call(adminCtx, op, { ...FORWARDED });
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

test.describe('contract access: loopback bypass works without headers', () => {
  test('requireAgentTokenOrSession op: getTicketBoard -> 200 with board columns', async () => {
    const op = getOp('getTicketBoard');
    const resp = await anon.fetch(concretePath(op.fullPath), { method: op.method });
    expect(resp.status()).toBe(200);
    const body = (await resp.json()) as Record<string, unknown>;
    expect(Array.isArray(body['TODO'])).toBe(true);
  });

  test('requireAgentTokenOrAdminSession op: getAgentTask 1 -> 200 with id', async () => {
    const resp = await anon.get('/api/agent-tasks/1');
    expect(resp.status()).toBe(200);
    const body = (await resp.json()) as { id: number };
    expect(body.id).toBe(1);
  });

  test('requireAgentToken op: claimNextAgentTask passes the guard (400 for the missing source, not 401)', async () => {
    // A 2xx here would claim a task. A 400 comes only after the guard let the call through.
    const resp = await anon.get('/api/agent-tasks/next');
    expect(resp.status()).toBe(400);
    const body = (await resp.json()) as ErrorBody;
    expect(body.fieldErrors['source']).toBeDefined();
  });
});

test.describe('contract access: fallthrough rules', () => {
  test('wrong cron bearer falls through to the admin session: triggerGithubIssuesRun -> FAILED run', async () => {
    const op = getOp('triggerGithubIssuesRun');
    const resp = await adminCtx.fetch(concretePath(op.fullPath), {
      method: op.method,
      headers: { Authorization: 'Bearer wrong' },
    });
    expect(resp.status()).toBe(200);
    // Empty GH_DISPATCH_TOKEN: dispatch throws before any fetch -> FAILED run.
    const run = (await resp.json()) as { status: string; error: string | null };
    expect(run.status).toBe('FAILED');
    expect(run.error ?? '').toContain('GH_DISPATCH_TOKEN');
  });
});

// ---------------------------------------------------------------------------
// Unit tests: the agentAuth middleware called directly with a fake loopback req
// ---------------------------------------------------------------------------

type Guard = (req: Request, res: Response, next: (err?: unknown) => void) => void;

function runGuard(guard: Guard): { called: boolean; error: unknown } {
  const req = {
    socket: { remoteAddress: '127.0.0.1' },
    headers: {},
    session: {},
  } as unknown as Request;
  const result: { called: boolean; error: unknown } = { called: false, error: undefined };
  guard(req, {} as Response, (err?: unknown) => {
    result.called = true;
    result.error = err;
  });
  return result;
}

test.describe('agentAuth middleware: loopback bypass preconditions', () => {
  const guards: [string, Guard][] = [
    ['requireAgentToken', requireAgentToken as Guard],
    ['requireAgentTokenOrAdminSession', requireAgentTokenOrAdminSession as Guard],
    ['requireAgentTokenOrSession', requireAgentTokenOrSession as Guard],
  ];
  let savedToken: string | undefined;
  let savedLoopback: string | undefined;

  test.beforeEach(() => {
    savedToken = process.env['AGENT_API_TOKEN'];
    savedLoopback = process.env['AGENT_AUTH_ALLOW_LOOPBACK'];
  });
  test.afterEach(() => {
    if (savedToken === undefined) delete process.env['AGENT_API_TOKEN'];
    else process.env['AGENT_API_TOKEN'] = savedToken;
    if (savedLoopback === undefined) delete process.env['AGENT_AUTH_ALLOW_LOOPBACK'];
    else process.env['AGENT_AUTH_ALLOW_LOOPBACK'] = savedLoopback;
  });

  for (const [name, guard] of guards) {
    test(`${name}: token and flag set, loopback, no headers -> allowed (control)`, () => {
      process.env['AGENT_API_TOKEN'] = 'unit-token';
      process.env['AGENT_AUTH_ALLOW_LOOPBACK'] = '1';
      const r = runGuard(guard);
      expect(r.called).toBe(true);
      expect(r.error).toBeUndefined();
    });

    test(`${name}: AGENT_API_TOKEN unset -> refused even with AGENT_AUTH_ALLOW_LOOPBACK=1`, () => {
      delete process.env['AGENT_API_TOKEN'];
      process.env['AGENT_AUTH_ALLOW_LOOPBACK'] = '1';
      const r = runGuard(guard);
      expect(r.called).toBe(true);
      expect(r.error).toBeDefined();
    });

    test(`${name}: AGENT_AUTH_ALLOW_LOOPBACK unset -> refused`, () => {
      process.env['AGENT_API_TOKEN'] = 'unit-token';
      delete process.env['AGENT_AUTH_ALLOW_LOOPBACK'];
      const r = runGuard(guard);
      expect(r.called).toBe(true);
      expect(r.error).toBeDefined();
    });
  }
});
