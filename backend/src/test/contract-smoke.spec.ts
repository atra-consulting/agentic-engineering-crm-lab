/**
 * Contract smoke: one minimal success call for every operation that no other
 * spec calls, so contract-coverage.spec.ts finds a 2xx for it.
 *
 * Covers: testLogin, listAllFirmen, listFirmaPersonen, listFirmaAbteilungen,
 * createPerson, listPersonen (filter), listAllPersonen, getPerson, updatePerson,
 * deletePerson, createAbteilung, listAbteilungen, listAllAbteilungen,
 * listAbteilungenByFirma, getAbteilung, updateAbteilung, listAbteilungPersonen,
 * deleteAbteilung, listAllAdressen, createChance, listAllChancen, getChance,
 * updateChance, deleteChance, getDashboard, triggerGithubIssuesRun.
 *
 * State: creates one firma tree and deletes it again.
 */
import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { loginCtx } from './helpers.js';

const BASE_URL = 'http://localhost:7070';

interface Created {
  id: number;
}

let admin: APIRequestContext;
let firmaId: number | undefined;
let abteilungId: number | undefined;
let personId: number | undefined;
let chanceId: number | undefined;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  admin = await loginCtx('admin', 'admin123');
});

test.afterAll(async () => {
  // Best-effort cleanup in FK order, in case a test failed midway.
  if (chanceId !== undefined) await admin.delete(`/api/chancen/${chanceId}`);
  if (personId !== undefined) await admin.delete(`/api/personen/${personId}`);
  if (abteilungId !== undefined) await admin.delete(`/api/abteilungen/${abteilungId}`);
  if (firmaId !== undefined) await admin.delete(`/api/firmen/${firmaId}`);
  await admin.dispose();
});

test('testLogin: POST /api/auth/test-login', async () => {
  const anon = await playwrightRequest.newContext({ baseURL: BASE_URL });
  try {
    const resp = await anon.post('/api/auth/test-login', { data: { benutzername: 'admin' } });
    expect(resp.status()).toBe(200);
  } finally {
    await anon.dispose();
  }
});

test('firma tree: create, read lists', async () => {
  await test.step('create firma', async () => {
    const resp = await admin.post('/api/firmen', { data: { name: `Contract Smoke ${Date.now()}` } });
    expect(resp.ok()).toBe(true);
    firmaId = ((await resp.json()) as Created).id;
  });
  await test.step('listAllFirmen', async () => {
    expect((await admin.get('/api/firmen/all')).status()).toBe(200);
  });
  await test.step('createAbteilung', async () => {
    const resp = await admin.post('/api/abteilungen', { data: { name: 'Smoke Abteilung', firmaId } });
    expect(resp.ok()).toBe(true);
    abteilungId = ((await resp.json()) as Created).id;
  });
  await test.step('createPerson', async () => {
    const resp = await admin.post('/api/personen', {
      data: { firstName: 'Smoke', lastName: 'Test', firmaId, abteilungId },
    });
    expect(resp.ok()).toBe(true);
    personId = ((await resp.json()) as Created).id;
  });
  await test.step('createChance', async () => {
    const resp = await admin.post('/api/chancen', { data: { titel: 'Smoke Chance', firmaId } });
    expect(resp.ok()).toBe(true);
    chanceId = ((await resp.json()) as Created).id;
  });
});

test('firma tree: reads', async () => {
  const gets = [
    `/api/firmen/${firmaId}/personen`,
    `/api/firmen/${firmaId}/abteilungen`,
    `/api/personen?abteilungId=${abteilungId}`,
    '/api/personen/all',
    `/api/personen/all?abteilungId=${abteilungId}`,
    `/api/personen/${personId}`,
    '/api/abteilungen',
    '/api/abteilungen/all',
    `/api/abteilungen/firma/${firmaId}`,
    `/api/abteilungen/${abteilungId}`,
    `/api/abteilungen/${abteilungId}/personen`,
    '/api/adressen/all',
    '/api/chancen/all',
    `/api/chancen/${chanceId}`,
    '/api/dashboard',
  ];
  for (const url of gets) {
    await test.step(`GET ${url}`, async () => {
      expect((await admin.get(url)).status()).toBe(200);
    });
  }
});

test('firma tree: updates', async () => {
  await test.step('updateAbteilung', async () => {
    const resp = await admin.put(`/api/abteilungen/${abteilungId}`, { data: { name: 'Smoke Abteilung 2', firmaId } });
    expect(resp.status()).toBe(200);
  });
  await test.step('updatePerson', async () => {
    const resp = await admin.put(`/api/personen/${personId}`, {
      data: { firstName: 'Smoke', lastName: 'Test2', firmaId, abteilungId },
    });
    expect(resp.status()).toBe(200);
  });
  await test.step('updateChance', async () => {
    const resp = await admin.put(`/api/chancen/${chanceId}`, { data: { titel: 'Smoke Chance 2', firmaId } });
    expect(resp.status()).toBe(200);
  });
});

test('firma tree: delete', async () => {
  await test.step('deleteChance', async () => {
    expect((await admin.delete(`/api/chancen/${chanceId}`)).ok()).toBe(true);
    chanceId = undefined;
  });
  await test.step('deletePerson', async () => {
    expect((await admin.delete(`/api/personen/${personId}`)).ok()).toBe(true);
    personId = undefined;
  });
  await test.step('deleteAbteilung', async () => {
    expect((await admin.delete(`/api/abteilungen/${abteilungId}`)).ok()).toBe(true);
    abteilungId = undefined;
  });
  await test.step('delete firma', async () => {
    expect((await admin.delete(`/api/firmen/${firmaId}`)).ok()).toBe(true);
    firmaId = undefined;
  });
});

test('triggerGithubIssuesRun: GET /api/cron/github-issues (no network, empty token)', async () => {
  const resp = await admin.get('/api/cron/github-issues');
  expect(resp.status()).toBe(200);
});
