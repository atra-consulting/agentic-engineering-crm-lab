/**
 * Input completeness: create each entity with EVERY input field set to a
 * non-default value, then GET by id and check each sent field comes back. Catches
 * fields missing from input schemas (removeAdditional would drop them silently).
 */
import { test, expect, type APIRequestContext } from '@playwright/test';
import { request as playwrightRequest } from '@playwright/test';
import { loginCtx, resetDatabase } from './helpers.js';
import { TEST_AGENT_TOKEN } from './globalSetup.js';

const BASE_URL = 'http://localhost:7070';

type Json = Record<string, unknown>;

async function createAndFetch(
  ctx: APIRequestContext,
  collection: string,
  data: Json,
  cleanup: string[],
): Promise<{ created: Json; fetched: Json }> {
  const resp = await ctx.post(`/api/${collection}`, { data });
  expect(resp.status(), await resp.text()).toBe(201);
  const created = (await resp.json()) as Json & { id: number };
  cleanup.push(`/api/${collection}/${created.id}`);
  const get = await ctx.get(`/api/${collection}/${created.id}`);
  expect(get.status()).toBe(200);
  return { created, fetched: (await get.json()) as Json };
}

function expectFields(actual: Json, sent: Json): void {
  for (const [key, value] of Object.entries(sent)) {
    expect(actual[key], `field ${key}`).toEqual(value);
  }
}

test.describe('input completeness', () => {
  let admin: APIRequestContext;
  let agent: APIRequestContext;
  // Delete order: last created first (children before parents).
  const cleanup: string[] = [];
  let firmaId: number;
  let personId: number;

  test.beforeAll(async () => {
    admin = await loginCtx('admin', 'admin123');
    agent = await playwrightRequest.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${TEST_AGENT_TOKEN}` },
    });
  });

  test.afterAll(async () => {
    for (const path of cleanup.reverse()) await admin.delete(path);
    await admin.post('/api/tickets/reset');
    await resetDatabase();
    await admin.dispose();
    await agent.dispose();
  });

  test('Firma: all fields', async () => {
    const sent = {
      name: 'Complete Firma',
      industry: 'Software',
      website: 'https://complete.example.com',
      phone: '+49 30 123456',
      email: 'info@complete.example.com',
      notes: 'Alle Felder gesetzt',
    };
    const { created, fetched } = await createAndFetch(admin, 'firmen', sent, cleanup);
    firmaId = created['id'] as number;
    expectFields(fetched, sent);
  });

  test('Person: all fields', async () => {
    const abt = await createAndFetch(admin, 'abteilungen', { name: 'Complete Abt', description: 'Beschreibung', firmaId }, cleanup);
    const abteilungId = abt.created['id'] as number;
    const sent = {
      firstName: 'Erika',
      lastName: 'Mustermann',
      email: 'erika@complete.example.com',
      phone: '+49 40 987654',
      position: 'Leiterin',
      notes: 'Notiz zur Person',
      firmaId,
      abteilungId,
    };
    const { created, fetched } = await createAndFetch(admin, 'personen', sent, cleanup);
    personId = created['id'] as number;
    expectFields(fetched, sent);
  });

  test('Abteilung: all fields', async () => {
    const sent = { name: 'Vertrieb', description: 'Zuständig für den Vertrieb', firmaId };
    const { fetched } = await createAndFetch(admin, 'abteilungen', sent, cleanup);
    expectFields(fetched, sent);
  });

  test('Adresse: all fields including typ, latitude, longitude', async () => {
    const sent = {
      street: 'Hauptstrasse',
      houseNumber: '12a',
      postalCode: '10115',
      city: 'Berlin',
      country: 'Deutschland',
      typ: 'RECHNUNG',
      firmaId,
      personId,
      latitude: 52.52,
      longitude: 13.405,
    };
    const { fetched } = await createAndFetch(admin, 'adressen', sent, cleanup);
    expectFields(fetched, sent);
  });

  test('Aktivitaet: all fields', async () => {
    const sent = {
      typ: 'MEETING',
      subject: 'Kick-off',
      description: 'Erstes Treffen',
      datum: '2026-03-01T10:00:00.000Z',
      firmaId,
      personId,
    };
    const { fetched } = await createAndFetch(admin, 'aktivitaeten', sent, cleanup);
    expectFields(fetched, sent);
  });

  test('Chance: all fields', async () => {
    const sent = {
      titel: 'Rahmenvertrag',
      beschreibung: 'Grosses Projekt',
      wert: 12345.5,
      currency: 'USD',
      phase: 'VERHANDLUNG',
      wahrscheinlichkeit: 65,
      erwartetesDatum: '2026-06-30',
      firmaId,
      kontaktPersonId: personId,
    };
    const { fetched } = await createAndFetch(admin, 'chancen', sent, cleanup);
    expectFields(fetched, sent);
  });

  test('Szenario: all four processes', async () => {
    const sent = {
      name: `Complete Szenario ${Date.now()}`,
      humanSteps: { works: Array.from({ length: 19 }, (_, i) => i + 1), waits: Array.from({ length: 18 }, (_, i) => i + 101) },
      agileKiSteps: { works: Array.from({ length: 19 }, (_, i) => i + 201), waits: Array.from({ length: 18 }, (_, i) => i + 301) },
      semiAutomatedSteps: { works: Array.from({ length: 11 }, (_, i) => i + 401), waits: Array.from({ length: 10 }, (_, i) => i + 501) },
      automatedSteps: { works: [601, 602], waits: [701] },
    };
    const { fetched } = await createAndFetch(admin, 'szenarien', sent, cleanup);
    expectFields(fetched, sent);
  });

  test('Ticket: create with agentTaskId and fullyReady true', async () => {
    const sent = {
      type: 'BUG',
      title: 'Complete ticket',
      body: 'Alle Felder gesetzt',
      agentTaskId: 1,
      fullyReady: true,
    };
    const resp = await admin.post('/api/tickets', { data: sent });
    expect(resp.status(), await resp.text()).toBe(201);
    const created = (await resp.json()) as Json & { id: number };
    const get = await admin.get(`/api/tickets/${created.id}`);
    expect(get.status()).toBe(200);
    expectFields((await get.json()) as Json, sent);
  });

  test('agent-task reject stores the comment', async () => {
    const comment = 'Abgelehnt: außerhalb des Umfangs';
    const resp = await agent.post('/api/agent-tasks/1/reject', { data: { comment } });
    expect(resp.status(), await resp.text()).toBe(200);
    const get = await admin.get('/api/agent-tasks/1');
    expect(get.status()).toBe(200);
    expect(((await get.json()) as Json)['comment']).toBe(comment);
  });
});
