/**
 * Contract coverage: every operation in the bundle must have answered with 2xx
 * at least once during the `api` project. The suite backend appends the
 * operationId to CONTRACT_COVERAGE_FILE (see globalSetup.ts).
 * Runs in its own project that depends on `api`.
 */
import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { COVERAGE_FILE, operations } from './contract-helpers.js';
import { COVERAGE_EXEMPTIONS } from './contract-coverage-exemptions.js';

test.describe('contract coverage', () => {
  test('coverage file exists', () => {
    expect(existsSync(COVERAGE_FILE), `missing ${COVERAGE_FILE}`).toBe(true);
  });

  test('every operation answered 2xx at least once', () => {
    const seen = new Set(
      readFileSync(COVERAGE_FILE, 'utf8')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0),
    );
    const exempt = new Set(COVERAGE_EXEMPTIONS.map((e) => e.operationId));
    const missing = operations.map((o) => o.operationId).filter((id) => !seen.has(id) && !exempt.has(id));
    expect(missing, `operations never answered 2xx: ${missing.join(', ')}`).toEqual([]);
  });

  test('exemptions name real operations and carry a reason', () => {
    const ids = new Set(operations.map((o) => o.operationId));
    const bad = COVERAGE_EXEMPTIONS.filter((e) => !ids.has(e.operationId) || e.reason.trim() === '');
    expect(bad).toEqual([]);
  });

  test('covered operationIds exist in the contract', () => {
    const ids = new Set(operations.map((o) => o.operationId));
    const unknown = readFileSync(COVERAGE_FILE, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !ids.has(l));
    expect(unknown).toEqual([]);
  });
});
