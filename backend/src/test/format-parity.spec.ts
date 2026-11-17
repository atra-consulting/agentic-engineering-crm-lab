/**
 * Format parity: Ajv 2020 + custom formats (project factory, `unicode: false`) must
 * give the same email and uri verdicts as Zod did (fixtures/format-parity.json).
 * Differences are only allowed after an orchestrator decision: add them to
 * `acceptedDifferences`.
 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAjv } from '../openapi/ajv.js';
import { emailCorpus, urlCorpus } from './fixtures/format-corpus.js';

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

interface Parity {
  email: Record<string, boolean>;
  url: Record<string, boolean>;
}

const parity = JSON.parse(readFileSync(join(FIXTURES_DIR, 'format-parity.json'), 'utf8')) as Parity;

/** Entries are added only after an orchestrator decision. */
const acceptedDifferences: { input: string; reason: string }[] = [];

function differences(format: 'email' | 'uri', zod: Record<string, boolean>): string[] {
  const validate = createAjv('plain').compile({ type: 'string', format });
  const accepted = new Set(acceptedDifferences.map((d) => d.input));
  const out: string[] = [];
  for (const [input, zodVerdict] of Object.entries(zod)) {
    const ajvVerdict = validate(input);
    if (ajvVerdict !== zodVerdict && !accepted.has(input)) {
      out.push(`${format} ${JSON.stringify(input)}: zod=${zodVerdict}, ajv=${ajvVerdict}`);
    }
  }
  return out;
}

test.describe('format parity (Zod vs Ajv)', () => {
  test('recording covers the whole corpus', () => {
    expect(Object.keys(parity.email).sort()).toEqual([...new Set(emailCorpus)].sort());
    expect(Object.keys(parity.url).sort()).toEqual([...new Set(urlCorpus)].sort());
  });

  test('email verdicts match', () => {
    const diffs = differences('email', parity.email);
    expect(diffs, `email differences:\n${diffs.join('\n')}`).toEqual([]);
  });

  test('uri verdicts match', () => {
    const diffs = differences('uri', parity.url);
    expect(diffs, `uri differences:\n${diffs.join('\n')}`).toEqual([]);
  });

  test('accepted differences carry a reason', () => {
    for (const d of acceptedDifferences) expect(d.reason.length).toBeGreaterThan(0);
  });
});
