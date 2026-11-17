/**
 * In-process mode tests on ephemeral ports (never 7070, no child process):
 * - createApp('production'): no test-login, no docs, JSON 404 catch-all
 * - responseCheck(mode) per mode on a tiny Express app
 * - no coverage file without CONTRACT_COVERAGE_FILE
 */
import { test, expect } from '@playwright/test';
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../app.js';
import { responseCheck } from '../openapi/responseCheck.js';
import { getContractMode, type ContractMode } from '../openapi/runtimeMode.js';

interface ErrorBody {
  status: number;
  message: string;
  timestamp: string;
  fieldErrors: Record<string, string>;
}

function listen(app: express.Express): Promise<{ server: Server; url: string }> {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

function close(server: Server | undefined): Promise<void> {
  return new Promise((resolve) => {
    if (!server) return resolve();
    server.close(() => resolve());
    server.closeAllConnections();
  });
}

function checkApp(mode: ContractMode): express.Express {
  const app = express();
  app.use(responseCheck(mode));
  // Violates the getFirma contract on purpose: required fields are missing.
  app.get('/api/firmen/:id', (req, res) => {
    if (req.query['case'] === 'circular') {
      const circular: Record<string, unknown> = {};
      circular['self'] = circular;
      res.json(circular);
      return;
    }
    if (req.query['case'] === 'header') {
      // Violation pointer carries a long non-ASCII key.
      res.status(500).json({
        status: 500,
        message: 'x',
        timestamp: 't',
        fieldErrors: { ['ü'.repeat(300)]: 1 },
      });
      return;
    }
    res.json({});
  });
  // Valid getHealth answer.
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
  });
  return app;
}

test.describe('createApp(production)', () => {
  let server: Server;
  let url: string;

  test.beforeAll(async () => {
    ({ server, url } = await listen(createApp('production')));
  });

  test.afterAll(async () => {
    await close(server);
  });

  test('POST /api/auth/test-login is a JSON 404 in the standard shape', async () => {
    const resp = await fetch(`${url}/api/auth/test-login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ benutzername: 'admin' }),
    });
    expect(resp.status).toBe(404);
    expect((await resp.json()) as ErrorBody).toEqual({
      status: 404,
      message: 'Ressource nicht gefunden',
      timestamp: expect.any(String),
      fieldErrors: {},
    });
  });

  test('GET /api/docs is a JSON 404', async () => {
    const resp = await fetch(`${url}/api/docs`);
    expect(resp.status).toBe(404);
    expect(resp.headers.get('content-type')).toContain('application/json');
    expect((await resp.json()) as ErrorBody).toEqual({
      status: 404,
      message: 'Ressource nicht gefunden',
      timestamp: expect.any(String),
      fieldErrors: {},
    });
  });
});

test.describe('fail-closed mode integration', () => {
  const cases: ReadonlyArray<[string, Record<string, string | undefined>]> = [
    ['NODE_ENV=Staging', { NODE_ENV: 'Staging' }],
    ['NODE_ENV unset', {}],
  ];
  for (const [label, env] of cases) {
    test(`${label} registers no test-login`, async () => {
      const { server, url } = await listen(createApp(getContractMode(env)));
      try {
        const resp = await fetch(`${url}/api/auth/test-login`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ benutzername: 'admin' }),
        });
        expect(resp.status).toBe(404);
        expect(resp.headers.get('content-type')).toContain('application/json');
        expect(((await resp.json()) as ErrorBody).message).toBe('Ressource nicht gefunden');
      } finally {
        await close(server);
      }
    });
  }
});

test.describe('responseCheck per mode', () => {
  const servers: Server[] = [];
  const urls = {} as Record<ContractMode, string>;

  test.beforeAll(async () => {
    for (const mode of ['production', 'development', 'test'] as const) {
      const { server, url } = await listen(checkApp(mode));
      servers.push(server);
      urls[mode] = url;
    }
  });

  test.afterAll(async () => {
    await Promise.all(servers.map((s) => close(s)));
  });

  test('production leaves the answer unchanged', async () => {
    const resp = await fetch(`${urls.production}/api/firmen/1`);
    expect(resp.status).toBe(200);
    expect(resp.headers.get('x-contract-violation')).toBeNull();
    expect(await resp.json()).toEqual({});
  });

  test('development keeps the body and sets X-Contract-Violation', async () => {
    const resp = await fetch(`${urls.development}/api/firmen/1`);
    expect(resp.status).toBe(200);
    expect(resp.headers.get('x-contract-violation')).toContain('getFirma');
    expect(await resp.json()).toEqual({});
  });

  test('test answers 500 in the standard shape naming getFirma', async () => {
    const resp = await fetch(`${urls.test}/api/firmen/1`);
    expect(resp.status).toBe(500);
    const body = (await resp.json()) as ErrorBody;
    expect(body.status).toBe(500);
    expect(body.message).toContain('getFirma');
    expect(body.fieldErrors).toEqual({});
  });

  for (const mode of ['test', 'development'] as const) {
    test(`${mode}: circular body does not crash the server`, async () => {
      const first = await fetch(`${urls[mode]}/api/firmen/1?case=circular`);
      await first.text();
      // test mode swaps in the standard 500; development fails in JSON.stringify and Express answers 500.
      expect(first.status).toBe(500);
      const second = await fetch(`${urls[mode]}/api/health`);
      expect(second.status).toBe(200);
    });
  }

  test('development: header carries printable ASCII only, at most 200 chars', async () => {
    const resp = await fetch(`${urls.development}/api/firmen/1?case=header`);
    expect(resp.status).toBe(500);
    const header = resp.headers.get('x-contract-violation');
    expect(header).not.toBeNull();
    expect(header).toMatch(/^[\x20-\x7e]+$/);
    expect(header?.length).toBeLessThanOrEqual(200);
    expect(header).toContain('getFirma');
  });

  test('a valid answer passes in test mode', async () => {
    const resp = await fetch(`${urls.test}/api/health`);
    expect(resp.status).toBe(200);
  });
});

test.describe('CONTRACT_RESPONSE_CHECK switch via createApp', () => {
  // Tests the install condition in app.ts: responseCheck is mounted for
  // development, and for test unless CONTRACT_RESPONSE_CHECK=off. No real route
  // returns a contract-breaking body, so inspect the router stack instead: the
  // middleware is an anonymous arrow function, so compare layer counts. The
  // check layer is the only difference between the variants.
  let saved: string | undefined;

  test.beforeEach(() => {
    saved = process.env['CONTRACT_RESPONSE_CHECK'];
  });
  test.afterEach(() => {
    if (saved === undefined) delete process.env['CONTRACT_RESPONSE_CHECK'];
    else process.env['CONTRACT_RESPONSE_CHECK'] = saved;
  });

  function layerCount(mode: ContractMode, env: string | undefined): number {
    if (env === undefined) delete process.env['CONTRACT_RESPONSE_CHECK'];
    else process.env['CONTRACT_RESPONSE_CHECK'] = env;
    const app = createApp(mode) as unknown as { _router: { stack: unknown[] } };
    return app._router.stack.length;
  }

  test('test + off mounts no responseCheck layer; test without off does', () => {
    const withCheck = layerCount('test', undefined);
    const off = layerCount('test', 'off');
    expect(withCheck - off).toBe(1);
  });

  test('development + off still mounts the responseCheck layer', () => {
    const devOff = layerCount('development', 'off');
    const devDefault = layerCount('development', undefined);
    expect(devOff).toBe(devDefault);
    // Same layer count as test with the check on (both mount it).
    expect(devOff).toBe(layerCount('test', undefined));
  });

  test('production mounts no responseCheck layer', () => {
    expect(layerCount('production', undefined)).toBeLessThan(layerCount('test', undefined));
  });
});

test.describe('coverage file', () => {
  let dir: string;
  let saved: string | undefined;
  const servers: Server[] = [];

  async function hitHealth(mode: ContractMode): Promise<void> {
    const started = await listen(checkApp(mode));
    servers.push(started.server);
    const resp = await fetch(`${started.url}/api/health`);
    expect(resp.status).toBe(200);
    await resp.text();
  }

  async function waitForFile(file: string): Promise<boolean> {
    for (let i = 0; i < 40; i++) {
      if (existsSync(file)) return true;
      await new Promise((r) => setTimeout(r, 25));
    }
    return false;
  }

  test.beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'contract-cov-'));
    saved = process.env['CONTRACT_COVERAGE_FILE'];
  });

  test.afterEach(() => {
    if (saved === undefined) delete process.env['CONTRACT_COVERAGE_FILE'];
    else process.env['CONTRACT_COVERAGE_FILE'] = saved;
  });

  test.afterAll(async () => {
    await Promise.all(servers.map((s) => close(s)));
    rmSync(dir, { recursive: true, force: true });
  });

  test('unset: no file, no coverage error log', async () => {
    delete process.env['CONTRACT_COVERAGE_FILE'];
    const errors: unknown[][] = [];
    const original = console.error;
    console.error = (...args: unknown[]): void => {
      errors.push(args);
    };
    try {
      await hitHealth('test');
      await new Promise((r) => setTimeout(r, 100));
    } finally {
      console.error = original;
    }
    expect(errors.filter((e) => String(e[0]).includes('coverage'))).toEqual([]);
    expect(readdirSync(dir)).toEqual([]);
  });

  test('development and production write nothing even when set', async () => {
    const file = join(dir, 'other.txt');
    process.env['CONTRACT_COVERAGE_FILE'] = file;
    await hitHealth('development');
    await hitHealth('production');
    await new Promise((r) => setTimeout(r, 100));
    expect(existsSync(file)).toBe(false);
  });

  test('positive control: test mode with the env set records getHealth', async () => {
    const file = join(dir, 'cov.txt');
    process.env['CONTRACT_COVERAGE_FILE'] = file;
    await hitHealth('test');
    expect(await waitForFile(file)).toBe(true);
    expect(readFileSync(file, 'utf8')).toBe('getHealth\n');
  });
});
