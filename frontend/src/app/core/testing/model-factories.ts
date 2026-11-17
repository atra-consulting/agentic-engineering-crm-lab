/**
 * Typed model factories for Karma specs.
 *
 * Each factory returns a complete object typed directly against the
 * generated OpenAPI schemas (not the files in core/models), so specs
 * compile before and after the model alias switch. Pass Partial overrides
 * to change single fields.
 */
import type { components } from '../api/api-types';

type Schemas = components['schemas'];

const TS = '2025-01-15T10:00:00.000Z';

export function makeFirma(overrides: Partial<Schemas['Firma']> = {}): Schemas['Firma'] {
  return {
    id: 1,
    name: 'Muster GmbH',
    industry: 'Maschinenbau',
    website: 'https://www.muster.example',
    phone: '+49 30 1234567',
    email: 'info@muster.example',
    notes: 'Langjaehriger Kunde',
    personenCount: 3,
    abteilungenCount: 2,
    adressen: [],
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}

export function makePerson(overrides: Partial<Schemas['Person']> = {}): Schemas['Person'] {
  return {
    id: 1,
    firstName: 'Erika',
    lastName: 'Mustermann',
    email: 'erika.mustermann@muster.example',
    phone: '+49 30 7654321',
    position: 'Einkaufsleiterin',
    notes: 'Bevorzugt Kontakt per E-Mail',
    firmaId: 1,
    firmaName: 'Muster GmbH',
    abteilungId: 1,
    abteilungName: 'Einkauf',
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}

export function makeAbteilung(
  overrides: Partial<Schemas['Abteilung']> = {},
): Schemas['Abteilung'] {
  return {
    id: 1,
    name: 'Einkauf',
    description: 'Zustaendig fuer Beschaffung',
    firmaId: 1,
    firmaName: 'Muster GmbH',
    personenCount: 2,
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}

export function makeAdresse(overrides: Partial<Schemas['Adresse']> = {}): Schemas['Adresse'] {
  return {
    id: 1,
    street: 'Hauptstrasse',
    houseNumber: '12',
    postalCode: '10115',
    city: 'Berlin',
    country: 'Deutschland',
    typ: 'BUERO',
    firmaId: 1,
    firmaName: 'Muster GmbH',
    personId: null,
    personName: null,
    latitude: 52.532,
    longitude: 13.384,
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}

export function makeAktivitaet(
  overrides: Partial<Schemas['Aktivitaet']> = {},
): Schemas['Aktivitaet'] {
  return {
    id: 1,
    typ: 'ANRUF',
    subject: 'Angebot besprechen',
    description: 'Telefonat zum Angebot',
    datum: TS,
    firmaId: 1,
    firmaName: 'Muster GmbH',
    personId: 1,
    personName: 'Erika Mustermann',
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}

export function makeChance(overrides: Partial<Schemas['Chance']> = {}): Schemas['Chance'] {
  return {
    id: 1,
    titel: 'Rahmenvertrag Wartung',
    beschreibung: 'Jaehrlicher Wartungsvertrag',
    wert: 25000,
    currency: 'EUR',
    phase: 'ANGEBOT',
    wahrscheinlichkeit: 60,
    erwartetesDatum: '2025-06-30',
    firmaId: 1,
    firmaName: 'Muster GmbH',
    kontaktPersonId: 1,
    kontaktPersonName: 'Erika Mustermann',
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}

export function makeBenutzerInfo(
  overrides: Partial<Schemas['BenutzerInfo']> = {},
): Schemas['BenutzerInfo'] {
  return {
    id: 1,
    benutzername: 'admin',
    vorname: 'Anna',
    nachname: 'Admin',
    email: 'admin@crm.example',
    rollen: ['ROLE_ADMIN'],
    permissions: ['FIRMEN', 'PERSONEN', 'ABTEILUNGEN', 'ADRESSEN', 'AKTIVITAETEN', 'CHANCEN'],
    ...overrides,
  };
}

export function makeAgentTask(
  overrides: Partial<Schemas['AgentTask']> = {},
): Schemas['AgentTask'] {
  return {
    id: 1,
    source: 'GITHUB_ISSUE',
    title: 'Firmenliste sortierbar machen',
    body: 'Die Firmenliste soll nach Name sortierbar sein.',
    status: 'OPEN',
    comment: null,
    metadata: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: TS,
    updatedAt: TS,
    ticketId: null,
    ...overrides,
  };
}

export function makeCronRun(overrides: Partial<Schemas['CronRun']> = {}): Schemas['CronRun'] {
  return {
    id: 1,
    job: 'solve-agent-tasks',
    status: 'SUCCESS',
    trigger: 'MANUAL',
    startedAt: TS,
    finishedAt: '2025-01-15T10:01:00.000Z',
    durationMs: 60000,
    result: '2 solved, 0 rejected',
    githubRunUrl: 'https://github.com/example/crm/actions/runs/1',
    error: null,
    ...overrides,
  };
}

export function makeCronJob(overrides: Partial<Schemas['CronJob']> = {}): Schemas['CronJob'] {
  return {
    name: 'solve-agent-tasks',
    schedule: '0 * * * *',
    description: 'Arbeitet offene Agent-Tasks ab',
    dispatchEventType: 'agent-task-runner',
    lastRun: makeCronRun(),
    ...overrides,
  };
}

export function makeTicketDetail(
  overrides: Partial<Schemas['TicketDetail']> = {},
): Schemas['TicketDetail'] {
  return {
    id: 1,
    owner: 'HUMAN',
    type: 'FEATURE',
    title: 'Export als CSV',
    body: 'Firmenliste als CSV exportieren.',
    status: 'DEFINITION',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: TS,
    updatedAt: TS,
    fullyReady: false,
    agentTaskId: null,
    comments: [],
    ...overrides,
  };
}

export function makeTicketListItem(
  overrides: Partial<Schemas['TicketListItem']> = {},
): Schemas['TicketListItem'] {
  return {
    id: 1,
    owner: 'HUMAN',
    type: 'FEATURE',
    title: 'Export als CSV',
    body: 'Firmenliste als CSV exportieren.',
    status: 'DEFINITION',
    solution: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: TS,
    updatedAt: TS,
    fullyReady: false,
    agentTaskId: null,
    commentCount: 0,
    ...overrides,
  };
}

/** Array lengths follow the contract: works has one more entry than waits. */
export function makeSzenario(overrides: Partial<Schemas['Szenario']> = {}): Schemas['Szenario'] {
  const steps = (workCount: number, waitCount: number): Schemas['ProzessDauer'] => ({
    works: Array.from({ length: workCount }, (_, i) => i + 1),
    waits: Array.from({ length: waitCount }, (_, i) => (i + 1) * 2),
  });
  return {
    id: 1,
    name: 'Neukunden-Onboarding',
    humanSteps: steps(19, 18),
    agileKiSteps: steps(19, 18),
    semiAutomatedSteps: steps(11, 10),
    automatedSteps: steps(2, 1),
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}

/** Spring-style page (0-indexed `number`), consistent with the given items. */
export function makePage<T>(
  items: T[],
  overrides: Partial<Schemas['PageMeta']> = {},
): Schemas['PageMeta'] & { content: T[] } {
  const size = overrides.size ?? Math.max(items.length, 20);
  const totalElements = overrides.totalElements ?? items.length;
  const totalPages = overrides.totalPages ?? Math.max(1, Math.ceil(totalElements / size));
  const number = overrides.number ?? 0;
  return {
    content: items,
    totalElements,
    totalPages,
    size,
    number,
    first: number === 0,
    last: number >= totalPages - 1,
    ...overrides,
  };
}
