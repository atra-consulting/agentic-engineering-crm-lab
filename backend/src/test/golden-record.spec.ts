/**
 * Golden recorder. Captures TODAY's validation error answers and Zod's
 * email/url decisions before Zod is replaced.
 *
 * Opt-in only: runs when GOLDEN_RECORD=1, otherwise reported as skipped.
 * Writes fixtures/golden-errors.json and fixtures/format-parity.json.
 * All corpus cases are invalid requests, so no state changes.
 */
import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loginCtx } from './helpers.js';
import { TEST_AGENT_TOKEN } from './globalSetup.js';
import { goldenCorpus, type GoldenCase } from './fixtures/golden-corpus.js';
import { emailCorpus, urlCorpus } from './fixtures/format-corpus.js';

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const BASE_URL = 'http://localhost:7070';

interface RecordedAnswer {
  status: number;
  message: unknown;
  fieldErrors: unknown;
}

function sortedObject<T>(entries: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const key of Object.keys(entries).sort()) out[key] = entries[key] as T;
  return out;
}

function writeJson(fileName: string, data: unknown): void {
  writeFileSync(join(FIXTURES_DIR, fileName), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

test.describe('golden record', () => {
  test.skip(process.env['GOLDEN_RECORD'] !== '1', 'Set GOLDEN_RECORD=1 to record golden fixtures');

  let adminCtx: APIRequestContext;
  let agentCtx: APIRequestContext;
  let anonCtx: APIRequestContext;

  test.beforeAll(async () => {
    adminCtx = await loginCtx('admin', 'admin123');
    agentCtx = await playwrightRequest.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${TEST_AGENT_TOKEN}` },
    });
    anonCtx = await playwrightRequest.newContext({ baseURL: BASE_URL });
  });

  test.afterAll(async () => {
    await adminCtx?.dispose();
    await agentCtx?.dispose();
    await anonCtx?.dispose();
  });

  function ctxFor(auth: GoldenCase['auth']): APIRequestContext {
    if (auth === 'admin') return adminCtx;
    if (auth === 'agent') return agentCtx;
    return anonCtx;
  }

  test('records error answers for every corpus case', async () => {
    const ids = goldenCorpus.map((c) => c.id);
    expect(new Set(ids).size, 'corpus ids must be unique').toBe(ids.length);

    const recorded: Record<string, RecordedAnswer> = {};
    const succeeded: string[] = [];

    for (const c of goldenCorpus) {
      const payload =
        c.rawBody !== undefined
          ? c.rawBody
          : c.body !== undefined
            ? JSON.stringify(c.body)
            : undefined;
      const resp = await ctxFor(c.auth).fetch(c.path, {
        method: c.method,
        params: c.query,
        headers: payload !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        data: payload,
      });
      const status = resp.status();
      if (status >= 200 && status < 300) succeeded.push(c.id);

      let json: { message?: unknown; fieldErrors?: unknown } = {};
      try {
        json = (await resp.json()) as { message?: unknown; fieldErrors?: unknown };
      } catch {
        // non-JSON body: keep empty
      }
      recorded[c.id] = {
        status,
        message: json.message ?? null,
        fieldErrors: json.fieldErrors ?? null,
      };
    }

    writeJson('golden-errors.json', sortedObject(recorded));
    expect(succeeded, `cases returned 2xx (must all be invalid): ${succeeded.join(', ')}`).toEqual([]);
  });

  test('records Zod email and url parity', async () => {
    const { z } = await import('zod');
    const email: Record<string, boolean> = {};
    const url: Record<string, boolean> = {};
    for (const s of emailCorpus) email[s] = z.string().email().safeParse(s).success;
    for (const s of urlCorpus) url[s] = z.string().url().safeParse(s).success;
    writeJson('format-parity.json', { email: sortedObject(email), url: sortedObject(url) });
  });
});
