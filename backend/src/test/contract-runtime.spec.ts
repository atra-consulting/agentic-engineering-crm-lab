/**
 * Unit tests (runner process) for the OpenAPI contract runtime core:
 * runtimeMode, contract.matchOperation, errorMapper, responseCheck.checkResponse.
 *
 * Validators are shared and the body validator mutates its input, so every
 * validation runs on a structuredClone and reads `.errors` right away.
 */
import { test, expect } from '@playwright/test';
import type { ErrorObject } from 'ajv/dist/2020.js';
import { contract, type ContractOperation } from '../openapi/contract.js';
import { getContractMode, isDevOrTest } from '../openapi/runtimeMode.js';
import { mapAjvErrors } from '../openapi/errorMapper.js';
import { checkResponse } from '../openapi/responseCheck.js';

function op(operationId: string): ContractOperation {
  const found = contract.getOperation(operationId);
  if (!found) throw new Error(`Operation ${operationId} not in contract`);
  return found;
}

function bodyErrors(operationId: string, body: unknown): Record<string, string> {
  const o = op(operationId);
  if (!o.bodyValidator) throw new Error(`${operationId} has no body validator`);
  o.bodyValidator(structuredClone(body));
  return mapAjvErrors(o.bodyValidator.errors, 'body', o);
}

function pathErrors(operationId: string, params: Record<string, string>): Record<string, string> {
  const o = op(operationId);
  if (!o.pathParamsValidator) throw new Error(`${operationId} has no path validator`);
  o.pathParamsValidator(structuredClone(params));
  return mapAjvErrors(o.pathParamsValidator.errors, 'path', o);
}

function works(n: number): number[] {
  return Array.from({ length: n }, () => 10);
}

function validSzenario(): Record<string, unknown> {
  return {
    name: 'Test',
    humanSteps: { works: works(19), waits: works(18) },
    agileKiSteps: { works: works(19), waits: works(18) },
    semiAutomatedSteps: { works: works(11), waits: works(10) },
    automatedSteps: { works: works(2), waits: works(1) },
  };
}

function validCronComplete(): Record<string, unknown> {
  return { status: 'SUCCESS', tasksSolved: 1, tasksRejected: 0, githubRunUrl: 'https://github.com/x/y/actions/runs/1' };
}

const VALID_FIRMA = {
  id: 1,
  name: 'Acme',
  industry: null,
  website: null,
  phone: null,
  email: null,
  notes: null,
  personenCount: 0,
  abteilungenCount: 0,
  createdAt: '2026-01-01T00:00:00.000',
  updatedAt: '2026-01-01T00:00:00.000',
};

test.describe('getContractMode', () => {
  test('development maps to development', () => {
    expect(getContractMode({ NODE_ENV: 'development' })).toBe('development');
  });

  test('test maps to test', () => {
    expect(getContractMode({ NODE_ENV: 'test' })).toBe('test');
  });

  for (const value of [undefined, '', 'production', 'staging', 'Development']) {
    test(`${JSON.stringify(value)} fails closed to production`, () => {
      expect(getContractMode({ NODE_ENV: value })).toBe('production');
    });
  }

  test('isDevOrTest is true only for development and test', () => {
    expect([isDevOrTest('development'), isDevOrTest('test'), isDevOrTest('production')]).toEqual([true, true, false]);
  });
});

test.describe('matchOperation', () => {
  test('static route beats the param route', () => {
    expect(contract.matchOperation('GET', '/api/agent-tasks/next')?.operationId).toBe('claimNextAgentTask');
  });

  test('query string is ignored', () => {
    expect(contract.matchOperation('GET', '/api/firmen/1?x=1')?.operationId).toBe('getFirma');
  });

  test('trailing slash matches the list route', () => {
    expect(contract.matchOperation('GET', '/api/firmen/')?.operationId).toBe('listFirmen');
  });
});

test.describe('mapAjvErrors', () => {
  test('missing required field gives key plus override text', () => {
    expect(bodyErrors('createFirma', {})).toEqual({ name: 'Name ist erforderlich' });
  });

  test('nested missing field gives a dot key', () => {
    const body = validSzenario();
    body['humanSteps'] = { works: works(19) };
    expect(Object.keys(bodyErrors('createSzenario', body))).toEqual(['humanSteps.waits']);
  });

  test('array item error gives an index key with override text', () => {
    const body = validSzenario();
    const human = body['humanSteps'] as { works: number[] };
    human.works[3] = -1;
    expect(bodyErrors('createSzenario', body)).toEqual({ 'humanSteps.works.3': 'Darf nicht negativ sein' });
  });

  test('body [] gives the root key', () => {
    expect(bodyErrors('createFirma', [])).toEqual({ _: 'Ungültige Anfrage' });
  });

  test('integer field with 1.5 gives the integer text', () => {
    expect(bodyErrors('completeCronRun', { ...validCronComplete(), tasksSolved: 1.5 })).toEqual({
      tasksSolved: 'Muss eine ganze Zahl sein',
    });
  });

  test('integer field with a string gives the generic text', () => {
    expect(bodyErrors('completeCronRun', { ...validCronComplete(), tasksSolved: 'x' })).toEqual({
      tasksSolved: 'Ungültiger Wert',
    });
  });

  test('maxLength gives "Maximal 255 Zeichen"', () => {
    expect(bodyErrors('createFirma', { name: 'a', industry: 'b'.repeat(256) })).toEqual({
      industry: 'Maximal 255 Zeichen',
    });
  });

  test('maxLength on name gives "Maximal 255 Zeichen"', () => {
    expect(bodyErrors('createFirma', { name: 'a'.repeat(256) })).toEqual({ name: 'Maximal 255 Zeichen' });
  });

  test('latitude out of range gives the range text', () => {
    expect(bodyErrors('createAdresse', { latitude: 91 })).toEqual({ latitude: 'Muss zwischen -90 und 90 liegen' });
  });

  test('tasksSolved -1 gives "Darf nicht negativ sein"', () => {
    expect(bodyErrors('completeCronRun', { ...validCronComplete(), tasksSolved: -1 })).toEqual({
      tasksSolved: 'Darf nicht negativ sein',
    });
  });

  test('path id "abc" gives "Ungültige ID" on key id', () => {
    expect(pathErrors('getFirma', { id: 'abc' })).toEqual({ id: 'Ungültige ID' });
  });

  test('a type error beats minimum on the same key', () => {
    const o = op('completeCronRun');
    const errors: ErrorObject[] = [
      {
        keyword: 'minimum',
        instancePath: '/tasksSolved',
        schemaPath: '#/properties/tasksSolved/minimum',
        params: { comparison: '>=', limit: 0 },
        schema: 0,
        data: 1.5,
      },
      {
        keyword: 'type',
        instancePath: '/tasksSolved',
        schemaPath: '#/properties/tasksSolved/type',
        params: { type: 'integer' },
        schema: 'integer',
        data: 1.5,
      },
    ];
    expect(mapAjvErrors(errors, 'body', o)).toEqual({ tasksSolved: 'Muss eine ganze Zahl sein' });
  });

  test('an override beats the default text', () => {
    // Default for minLength would be "Ungültiger Wert"; the contract overrides it.
    expect(bodyErrors('createFirma', { name: '' })).toEqual({ name: 'Name ist erforderlich' });
  });

  test('empty or missing errors give {}', () => {
    expect([mapAjvErrors(null, 'body', op('createFirma')), mapAjvErrors([], 'body', op('createFirma'))]).toEqual([{}, {}]);
  });
});

test.describe('checkResponse', () => {
  test('valid body is ok', () => {
    expect(checkResponse('test', op('getFirma'), 200, VALID_FIRMA)).toEqual({ ok: true });
  });

  test('missing field is a violation with operationId and pointer', () => {
    const { id: _id, ...withoutId } = VALID_FIRMA;
    const result = checkResponse('test', op('getFirma'), 200, withoutId);
    expect(result).toMatchObject({ ok: false, operationId: 'getFirma' });
    expect(result.ok === false && result.reason).toContain('id');
  });

  test('wrong type reports the pointer of the field', () => {
    const result = checkResponse('test', op('getFirma'), 200, { ...VALID_FIRMA, personenCount: 'x' });
    expect(result).toMatchObject({ ok: false, operationId: 'getFirma', pointer: '/personenCount' });
  });

  test('undeclared status is a violation', () => {
    expect(checkResponse('test', op('getFirma'), 409, {})).toMatchObject({
      ok: false,
      operationId: 'getFirma',
      reason: 'undeclared status',
    });
  });

  test('500 is checked against ErrorResponse (valid)', () => {
    const body = { status: 500, message: 'x', timestamp: '2026-01-01T00:00:00.000', fieldErrors: {} };
    expect(checkResponse('test', op('getFirma'), 500, body)).toEqual({ ok: true });
  });

  test('500 is checked against ErrorResponse (invalid)', () => {
    expect(checkResponse('test', op('getFirma'), 500, { message: 'x' })).toMatchObject({
      ok: false,
      operationId: 'getFirma',
    });
  });

  test('no operation checks against ErrorResponse', () => {
    const body = { status: 404, message: 'x', timestamp: '2026-01-01T00:00:00.000', fieldErrors: {} };
    expect(checkResponse('test', undefined, 404, body)).toEqual({ ok: true });
    expect(checkResponse('test', undefined, 404, { foo: 1 })).toMatchObject({ ok: false, operationId: 'unknown' });
  });

  test('204 is skipped', () => {
    expect(checkResponse('test', op('deleteFirma'), 204, { anything: true })).toEqual({ ok: true });
  });

  test('production is skipped', () => {
    expect(checkResponse('production', op('getFirma'), 200, {})).toEqual({ ok: true });
  });
});
