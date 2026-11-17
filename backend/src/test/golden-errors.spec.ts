/**
 * Golden errors: every invalid request in the golden corpus must answer with the
 * status, message and fieldErrors keys recorded before Zod was replaced. Texts must
 * match the recording, or the case's `expectGerman` annotation (decision D6).
 */
import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loginCtx } from './helpers.js';
import { TEST_AGENT_TOKEN } from './globalSetup.js';
import { goldenCorpus, type GoldenCase } from './fixtures/golden-corpus.js';

const BASE_URL = 'http://localhost:7070';
const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

interface RecordedAnswer {
  status: number;
  message: string | null;
  fieldErrors: Record<string, string> | null;
}

const golden = JSON.parse(readFileSync(join(FIXTURES_DIR, 'golden-errors.json'), 'utf8')) as Record<string, RecordedAnswer>;

const ENGLISH_PREFIX = /^(Invalid|Too|Expected|Required)/;

test.describe('golden errors', () => {
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

  test('corpus and recording cover the same case ids', () => {
    const corpusIds = goldenCorpus.map((c) => c.id).sort();
    expect(new Set(corpusIds).size, 'corpus ids must be unique').toBe(corpusIds.length);
    expect(corpusIds).toEqual(Object.keys(golden).sort());
  });

  test('every corpus case answers as recorded (D6 texts applied)', async () => {
    const problems: string[] = [];

    for (const c of goldenCorpus) {
      const recorded = golden[c.id];
      if (!recorded) {
        problems.push(`${c.id}: no recording`);
        continue;
      }
      const payload =
        c.rawBody !== undefined ? c.rawBody : c.body !== undefined ? JSON.stringify(c.body) : undefined;
      const resp = await ctxFor(c.auth).fetch(c.path, {
        method: c.method,
        params: c.query,
        headers: payload !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        data: payload,
      });

      let json: { message?: string | null; fieldErrors?: Record<string, string> | null } = {};
      try {
        json = (await resp.json()) as typeof json;
      } catch {
        // non-JSON body: stays empty
      }
      const actualMessage = json.message ?? null;
      const actualErrors = json.fieldErrors ?? null;

      if (resp.status() !== recorded.status) {
        problems.push(`${c.id}: status expected ${recorded.status}, got ${resp.status()}`);
      }
      if (actualMessage !== recorded.message) {
        problems.push(`${c.id}: message expected ${JSON.stringify(recorded.message)}, got ${JSON.stringify(actualMessage)}`);
      }

      const expectedKeys = recorded.fieldErrors ? Object.keys(recorded.fieldErrors).sort() : null;
      const actualKeys = actualErrors ? Object.keys(actualErrors).sort() : null;
      if (JSON.stringify(expectedKeys) !== JSON.stringify(actualKeys)) {
        problems.push(`${c.id}: fieldErrors keys expected ${JSON.stringify(expectedKeys)}, got ${JSON.stringify(actualKeys)}`);
        continue;
      }
      if (!recorded.fieldErrors || !actualErrors) continue;

      for (const key of Object.keys(recorded.fieldErrors)) {
        const recordedText = recorded.fieldErrors[key] as string;
        const german = c.expectGerman?.[key];
        if (german === undefined && ENGLISH_PREFIX.test(recordedText)) {
          problems.push(`${c.id}.${key}: recorded text "${recordedText}" is English and the case has no expectGerman. Annotate it under the D6 rules.`);
          continue;
        }
        const expectedText = german ?? recordedText;
        if (actualErrors[key] !== expectedText) {
          problems.push(`${c.id}.${key}: text expected ${JSON.stringify(expectedText)}, got ${JSON.stringify(actualErrors[key])}`);
        }
      }
    }

    expect(problems, `golden differences:\n${problems.join('\n')}`).toEqual([]);
  });
});
