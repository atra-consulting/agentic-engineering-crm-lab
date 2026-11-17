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
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../app.js';
import { responseCheck } from '../openapi/responseCheck.js';
import type { ContractMode } from '../openapi/runtimeMode.js';

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
  app.get('/api/firmen/:id', (_req, res) => {
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
    const body = (await resp.json()) as ErrorBody;
    expect(body).toMatchObject({ status: 404, message: 'Ressource nicht gefunden', fieldErrors: {} });
    expect(typeof body.timestamp).toBe('string');
  });

  test('GET /api/docs is a JSON 404', async () => {
    const resp = await fetch(`${url}/api/docs`);
    expect(resp.status).toBe(404);
    expect(resp.headers.get('content-type')).toContain('application/json');
    expect(((await resp.json()) as ErrorBody).status).toBe(404);
  });
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

  test('a valid answer passes in test mode', async () => {
    const resp = await fetch(`${urls.test}/api/health`);
    expect(resp.status).toBe(200);
  });
});

test.describe('coverage file', () => {
  let dir: string;
  let saved: string | undefined;
  let server: Server | undefined;

  test.beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'contract-cov-'));
    saved = process.env['CONTRACT_COVERAGE_FILE'];
    delete process.env['CONTRACT_COVERAGE_FILE'];
  });

  test.afterAll(async () => {
    if (saved === undefined) delete process.env['CONTRACT_COVERAGE_FILE'];
    else process.env['CONTRACT_COVERAGE_FILE'] = saved;
    await close(server);
    rmSync(dir, { recursive: true, force: true });
  });

  test('no file appears while CONTRACT_COVERAGE_FILE is unset', async () => {
    const file = join(dir, 'coverage.txt');
    const started = await listen(checkApp('test'));
    server = started.server;
    const resp = await fetch(`${started.url}/api/health`);
    expect(resp.status).toBe(200);
    await resp.text();
    // The finish handler runs after the response; give it a tick.
    await new Promise((r) => setTimeout(r, 50));
    expect(existsSync(file)).toBe(false);
    expect(process.env['CONTRACT_COVERAGE_FILE']).toBeUndefined();
  });
});
