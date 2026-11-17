/**
 * Interactive API docs per runtime mode, in-process on ephemeral ports (never 7070).
 * - development and test: /api/docs, whitelisted assets, /api/openapi.json
 * - development: traversal and non-whitelisted files answer the JSON 404
 * - production: docs and spec answer the JSON 404
 */
import { test, expect } from '@playwright/test';
import { request as httpRequest } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApp } from '../app.js';
import type { ContractMode } from '../openapi/runtimeMode.js';

interface RawResponse {
  status: number;
  contentType: string | undefined;
  body: string;
}

const GENERATED_SPEC_PATH = fileURLToPath(new URL('../generated/openapi.json', import.meta.url));

function listen(mode: ContractMode): Promise<{ server: Server; url: string }> {
  return new Promise((resolve) => {
    const server = createApp(mode).listen(0, '127.0.0.1', () => {
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

/** Sends the path byte for byte. fetch would resolve "/../" before sending. */
function rawGet(base: string, path: string): Promise<RawResponse> {
  const { hostname, port } = new URL(base);
  return new Promise((resolve, reject) => {
    const req = httpRequest({ hostname, port, path, method: 'GET' }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => {
        resolve({
          status: res.statusCode ?? 0,
          contentType: res.headers['content-type'],
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function expectStandard404(status: number, body: unknown): void {
  expect(status).toBe(404);
  expect(body).toEqual({
    status: 404,
    message: 'Ressource nicht gefunden',
    timestamp: expect.any(String),
    fieldErrors: {},
  });
}

test.describe('createApp(development)', () => {
  let server: Server;
  let url: string;

  test.beforeAll(async () => {
    ({ server, url } = await listen('development'));
  });

  test.afterAll(async () => {
    await close(server);
  });

  test('GET /api/docs serves the HTML page', async () => {
    const resp = await fetch(`${url}/api/docs`);
    expect(resp.status).toBe(200);
    expect(resp.headers.get('content-type')).toContain('text/html');
  });

  test('the docs page loads no assets from an absolute http(s) host', async () => {
    const html = await (await fetch(`${url}/api/docs`)).text();
    expect(html).not.toMatch(/https?:\/\//);
  });

  test('GET /api/docs/assets/swagger-ui.css serves CSS', async () => {
    const resp = await fetch(`${url}/api/docs/assets/swagger-ui.css`);
    expect(resp.status).toBe(200);
    expect(resp.headers.get('content-type')).toContain('text/css');
    await resp.arrayBuffer();
  });

  test('GET /api/docs/assets/swagger-ui-bundle.js serves JavaScript', async () => {
    const resp = await fetch(`${url}/api/docs/assets/swagger-ui-bundle.js`);
    expect(resp.status).toBe(200);
    expect(resp.headers.get('content-type')).toContain('javascript');
    await resp.arrayBuffer();
  });

  test('GET /api/docs/assets/docs-init.js points at /api/openapi.json', async () => {
    const resp = await fetch(`${url}/api/docs/assets/docs-init.js`);
    expect(resp.status).toBe(200);
    expect(resp.headers.get('content-type')).toContain('javascript');
    expect(await resp.text()).toContain('/api/openapi.json');
  });

  test('GET /api/openapi.json deep-equals the generated spec', async () => {
    const resp = await fetch(`${url}/api/openapi.json`);
    expect(resp.status).toBe(200);
    const expected: unknown = JSON.parse(readFileSync(GENERATED_SPEC_PATH, 'utf8'));
    expect(await resp.json()).toEqual(expected);
  });

  test('traversal with a literal ../ is a JSON 404', async () => {
    const resp = await rawGet(url, '/api/docs/assets/../package.json');
    expectStandard404(resp.status, JSON.parse(resp.body));
  });

  test('traversal with an encoded %2F is a JSON 404', async () => {
    const resp = await fetch(`${url}/api/docs/assets/..%2Fpackage.json`);
    expectStandard404(resp.status, await resp.json());
  });

  test('index.html of swagger-ui-dist is not served', async () => {
    const resp = await fetch(`${url}/api/docs/assets/index.html`);
    expectStandard404(resp.status, await resp.json());
  });

  test('swagger-initializer.js is not served', async () => {
    const resp = await fetch(`${url}/api/docs/assets/swagger-initializer.js`);
    expectStandard404(resp.status, await resp.json());
  });
});

test.describe('createApp(test)', () => {
  let server: Server;
  let url: string;

  test.beforeAll(async () => {
    ({ server, url } = await listen('test'));
  });

  test.afterAll(async () => {
    await close(server);
  });

  test('GET /api/docs serves the HTML page', async () => {
    const resp = await fetch(`${url}/api/docs`);
    expect(resp.status).toBe(200);
    expect(resp.headers.get('content-type')).toContain('text/html');
  });
});

test.describe('createApp(production)', () => {
  let server: Server;
  let url: string;

  test.beforeAll(async () => {
    ({ server, url } = await listen('production'));
  });

  test.afterAll(async () => {
    await close(server);
  });

  test('GET /api/docs is a JSON 404', async () => {
    const resp = await fetch(`${url}/api/docs`);
    expectStandard404(resp.status, await resp.json());
  });

  test('GET /api/openapi.json is a JSON 404', async () => {
    const resp = await fetch(`${url}/api/openapi.json`);
    expectStandard404(resp.status, await resp.json());
  });
});
