/**
 * Golden corpus: invalid requests whose error answers are recorded TODAY
 * (before Zod is replaced). Every case must be rejected (4xx) so nothing
 * changes state. Consumed by ../golden-record.spec.ts.
 *
 * `expectGerman` annotates keys where the recorded text is English today and
 * the approved replacement rules demand a German text. Keys already German
 * carry no entry.
 */

export type GoldenCase = {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  path: string;
  auth: 'admin' | 'agent' | 'none';
  body?: unknown;
  rawBody?: string;
  query?: Record<string, string>;
  expectGerman?: Record<string, string>;
};

type Auth = GoldenCase['auth'];
type Body = Record<string, unknown>;

const DEFAULT_TEXT = 'Ungültiger Wert';
const NOT_WHOLE = 'Muss eine ganze Zahl sein';
const BAD_ID = 'Ungültige ID';

interface FieldDef {
  name: string;
  kind: 'string' | 'number' | 'boolean' | 'enum' | 'email' | 'url';
  required?: boolean;
  /** Value used in the valid base body when the field is required. */
  good?: unknown;
  /** String schema has min(1) with a German message (empty is German today). */
  nonEmpty?: boolean;
  /** Annotate the empty-string case (schema message is English today). */
  emptyText?: string;
  max?: number;
  /** German text for wrong type / invalid value. Default: Ungültiger Wert. */
  typeText?: string;
  /** German text for a missing field. Default: typeText. */
  missingText?: string;
  /** Schema carries a custom German message for every failure (no annotation). */
  native?: boolean;
  /** Number: not-whole text (annotation for 1.5). Omit for no 1.5 case. */
  intText?: string;
  /** Number: 0 is invalid; annotation text, or 'native' when German today. */
  zeroText?: string | 'native';
  /** Number: out-of-range values, with min and max for the text. */
  range?: { min: number; max: number; values: number[] };
  /** Number: -1 is invalid, annotated with this text. */
  negativeText?: string;
}

function slug(v: unknown): string {
  return String(v).replace(/^-/, 'minus-').replace(/\./g, '-');
}

function genCases(
  prefix: string,
  method: GoldenCase['method'],
  path: string,
  auth: Auth,
  fields: FieldDef[],
): GoldenCase[] {
  const base: Body = {};
  for (const f of fields) {
    if (f.required) base[f.name] = f.good;
  }
  const out: GoldenCase[] = [];
  const add = (
    id: string,
    body: Body | unknown[],
    expect?: Record<string, string>,
  ): void => {
    const c: GoldenCase = { id: `${prefix}-${id}`, method, path, auth, body };
    if (expect) c.expectGerman = expect;
    out.push(c);
  };
  const withField = (name: string, value: unknown): Body => ({ ...base, [name]: value });

  for (const f of fields) {
    const n = f.name;
    const typeText = f.typeText ?? DEFAULT_TEXT;
    const ann = (text: string): Record<string, string> | undefined =>
      f.native ? undefined : { [n]: text };

    if (f.required) {
      const missing: Body = { ...base };
      delete missing[n];
      add(`${n}-missing`, missing, ann(f.missingText ?? typeText));
    }
    if (f.kind === 'string' && f.nonEmpty) {
      add(`${n}-empty`, withField(n, ''), f.emptyText ? { [n]: f.emptyText } : undefined);
    }
    if (f.kind === 'string' || f.kind === 'email' || f.kind === 'url') {
      add(`${n}-wrong-type-number`, withField(n, 123), ann(typeText));
    }
    if (f.kind === 'number') {
      add(`${n}-wrong-type-string`, withField(n, 'x'), ann(typeText));
    }
    if (f.kind === 'boolean') {
      add(`${n}-wrong-type-string`, withField(n, 'yes'), ann(typeText));
    }
    if (f.kind === 'enum') {
      add(`${n}-invalid-enum`, withField(n, 'BOGUS'), ann(typeText));
    }
    if (f.kind === 'email') {
      add(`${n}-invalid-email`, withField(n, 'not-an-email'), ann(typeText));
    }
    if (f.kind === 'url') {
      add(`${n}-invalid-url`, withField(n, 'not a url'), ann(typeText));
    }
    if (f.max !== undefined) {
      add(`${n}-too-long`, withField(n, 'x'.repeat(f.max + 1)), {
        [n]: `Maximal ${f.max} Zeichen`,
      });
    }
    if (f.intText !== undefined) {
      add(`${n}-not-whole`, withField(n, 1.5), { [n]: f.intText });
    }
    if (f.zeroText !== undefined) {
      add(
        `${n}-zero`,
        withField(n, 0),
        f.zeroText === 'native' ? undefined : { [n]: f.zeroText },
      );
    }
    if (f.negativeText !== undefined) {
      add(`${n}-negative`, withField(n, -1), { [n]: f.negativeText });
    }
    if (f.range) {
      for (const v of f.range.values) {
        add(`${n}-out-of-range-${slug(v)}`, withField(n, v), {
          [n]: `Muss zwischen ${f.range.min} und ${f.range.max} liegen`,
        });
      }
    }
  }
  add('array-body', [], { _: 'Ungültige Anfrage' });
  return out;
}

function both(
  prefix: string,
  collection: string,
  fields: FieldDef[],
): GoldenCase[] {
  return [
    ...genCases(`${prefix}-post`, 'POST', collection, 'admin', fields),
    ...genCases(`${prefix}-put`, 'PUT', `${collection}/1`, 'admin', fields),
  ];
}

// ─── Field helpers ────────────────────────────────────────────────────────────

const optStr = (name: string, max?: number): FieldDef => ({ name, kind: 'string', max });
const optId = (name: string): FieldDef => ({
  name,
  kind: 'number',
  typeText: BAD_ID,
  intText: BAD_ID,
  zeroText: BAD_ID,
});
const optIdPlain = (name: string): FieldDef => ({
  name,
  kind: 'number',
  intText: NOT_WHOLE,
  zeroText: DEFAULT_TEXT,
});
const requiredFirmaId: FieldDef = {
  name: 'firmaId',
  kind: 'number',
  required: true,
  good: 1,
  typeText: 'Firma ist erforderlich',
  intText: NOT_WHOLE,
  zeroText: 'native',
};
const emailField: FieldDef = {
  name: 'email',
  kind: 'email',
  typeText: 'Ungültige E-Mail-Adresse',
};

// ─── CRM entities ─────────────────────────────────────────────────────────────

const firmaFields: FieldDef[] = [
  {
    name: 'name',
    kind: 'string',
    required: true,
    good: 'Golden Firma',
    nonEmpty: true,
    max: 255,
    typeText: 'Name ist erforderlich',
  },
  optStr('industry', 255),
  optStr('website', 500),
  optStr('phone', 50),
  emailField,
  optStr('notes'),
];

const personFields: FieldDef[] = [
  {
    name: 'firstName',
    kind: 'string',
    required: true,
    good: 'Golden',
    nonEmpty: true,
    max: 100,
    typeText: 'Vorname ist erforderlich',
  },
  {
    name: 'lastName',
    kind: 'string',
    required: true,
    good: 'Person',
    nonEmpty: true,
    max: 100,
    typeText: 'Nachname ist erforderlich',
  },
  emailField,
  optStr('phone', 50),
  optStr('position', 255),
  optStr('notes'),
  requiredFirmaId,
  optId('abteilungId'),
];

const abteilungFields: FieldDef[] = [
  {
    name: 'name',
    kind: 'string',
    required: true,
    good: 'Golden Abteilung',
    nonEmpty: true,
    max: 255,
    typeText: 'Name ist erforderlich',
  },
  optStr('description'),
  requiredFirmaId,
];

const adresseFields: FieldDef[] = [
  optStr('street', 255),
  optStr('houseNumber', 20),
  optStr('postalCode', 20),
  optStr('city', 100),
  optStr('country', 100),
  optStr('typ', 50),
  optIdPlain('firmaId'),
  optId('personId'),
  {
    name: 'latitude',
    kind: 'number',
    range: { min: -90, max: 90, values: [9999] },
  },
  {
    name: 'longitude',
    kind: 'number',
    range: { min: -180, max: 180, values: [-9999] },
  },
];

const aktivitaetFields: FieldDef[] = [
  {
    name: 'typ',
    kind: 'enum',
    required: true,
    good: 'NOTIZ',
    native: true,
  },
  {
    name: 'subject',
    kind: 'string',
    required: true,
    good: 'Golden Betreff',
    nonEmpty: true,
    max: 255,
    typeText: 'Betreff ist erforderlich',
  },
  optStr('description'),
  {
    name: 'datum',
    kind: 'string',
    required: true,
    good: '2026-01-01T10:00:00',
    nonEmpty: true,
    typeText: 'Datum ist erforderlich',
  },
  optIdPlain('firmaId'),
  optId('personId'),
];

const chanceFields: FieldDef[] = [
  {
    name: 'titel',
    kind: 'string',
    required: true,
    good: 'Golden Chance',
    nonEmpty: true,
    max: 255,
    typeText: 'Titel ist erforderlich',
  },
  optStr('beschreibung'),
  { name: 'wert', kind: 'number' },
  optStr('currency', 10),
  { name: 'phase', kind: 'enum', native: true },
  {
    name: 'wahrscheinlichkeit',
    kind: 'number',
    intText: NOT_WHOLE,
    range: { min: 0, max: 100, values: [101, -1] },
  },
  optStr('erwartetesDatum'),
  requiredFirmaId,
  optId('kontaktPersonId'),
];

// ─── Szenario ─────────────────────────────────────────────────────────────────

const PROCESSES = [
  { key: 'humanSteps', slug: 'human', count: 19 },
  { key: 'agileKiSteps', slug: 'agile-ki', count: 19 },
  { key: 'semiAutomatedSteps', slug: 'semi-automated', count: 11 },
  { key: 'automatedSteps', slug: 'automated', count: 2 },
] as const;

function validProcess(count: number): { works: number[]; waits: number[] } {
  return {
    works: Array.from({ length: count }, () => 60),
    waits: Array.from({ length: count - 1 }, () => 60),
  };
}

function validSzenario(): Body {
  const body: Body = { name: 'Golden Szenario' };
  for (const p of PROCESSES) body[p.key] = validProcess(p.count);
  return body;
}

function szenarioCases(prefix: string, method: 'POST' | 'PUT', path: string): GoldenCase[] {
  const out: GoldenCase[] = [];
  const add = (id: string, body: unknown, expect?: Record<string, string>): void => {
    const c: GoldenCase = { id: `${prefix}-${id}`, method, path, auth: 'admin', body };
    if (expect) c.expectGerman = expect;
    out.push(c);
  };
  const mutate = (fn: (b: Body) => void): Body => {
    const b = validSzenario();
    fn(b);
    return b;
  };

  // name
  add('name-missing', mutate((b) => { delete b['name']; }), { name: 'Name ist erforderlich' });
  add('name-empty', mutate((b) => { b['name'] = ''; }));
  add('name-wrong-type-number', mutate((b) => { b['name'] = 123; }), {
    name: 'Name ist erforderlich',
  });

  for (const p of PROCESSES) {
    const k = p.key;
    add(`${p.slug}-process-missing`, mutate((b) => { delete b[k]; }), { [k]: DEFAULT_TEXT });
    add(`${p.slug}-process-wrong-type-string`, mutate((b) => { b[k] = 'x'; }), {
      [k]: DEFAULT_TEXT,
    });
    add(
      `${p.slug}-works-missing`,
      mutate((b) => { b[k] = { waits: validProcess(p.count).waits }; }),
      { [`${k}.works`]: DEFAULT_TEXT },
    );
    add(
      `${p.slug}-waits-missing`,
      mutate((b) => { b[k] = { works: validProcess(p.count).works }; }),
      { [`${k}.waits`]: DEFAULT_TEXT },
    );
    add(
      `${p.slug}-works-too-few`,
      mutate((b) => {
        b[k] = { ...validProcess(p.count), works: validProcess(p.count).works.slice(1) };
      }),
    );
    add(
      `${p.slug}-works-too-many`,
      mutate((b) => {
        b[k] = { ...validProcess(p.count), works: [...validProcess(p.count).works, 60] };
      }),
    );
    add(
      `${p.slug}-waits-too-few`,
      mutate((b) => {
        b[k] = { ...validProcess(p.count), waits: validProcess(p.count).waits.slice(1) };
      }),
    );
    add(
      `${p.slug}-waits-too-many`,
      mutate((b) => {
        b[k] = { ...validProcess(p.count), waits: [...validProcess(p.count).waits, 60] };
      }),
    );
    add(
      `${p.slug}-works-wrong-type-string`,
      mutate((b) => { b[k] = { ...validProcess(p.count), works: 'x' }; }),
      { [`${k}.works`]: DEFAULT_TEXT },
    );

    const itemCases: Array<[string, unknown, Record<string, string> | undefined]> = [
      ['negative', -1, undefined],
      ['too-large', 479521, undefined],
      ['not-whole', 1.5, undefined],
      ['string', 'x', { [`${k}.works.0`]: DEFAULT_TEXT }],
    ];
    for (const [label, value, expect] of itemCases) {
      add(
        `${p.slug}-works-item-${label}`,
        mutate((b) => {
          const proc = validProcess(p.count);
          proc.works[0] = value as number;
          b[k] = proc;
        }),
        expect,
      );
    }
  }

  // Waits item variants once (human process)
  const waitItems: Array<[string, unknown, Record<string, string> | undefined]> = [
    ['negative', -1, undefined],
    ['too-large', 479521, undefined],
    ['not-whole', 1.5, undefined],
    ['string', 'x', { 'humanSteps.waits.0': DEFAULT_TEXT }],
  ];
  for (const [label, value, expect] of waitItems) {
    add(
      `human-waits-item-${label}`,
      mutate((b) => {
        const proc = validProcess(19);
        proc.waits[0] = value as number;
        b['humanSteps'] = proc;
      }),
      expect,
    );
  }

  // Dedicated shapes the issue statement names explicitly
  add(
    'human-works-18-items',
    mutate((b) => {
      b['humanSteps'] = { ...validProcess(19), works: validProcess(19).works.slice(0, 18) };
    }),
  );
  add(
    'human-waits-17-items',
    mutate((b) => {
      b['humanSteps'] = { ...validProcess(19), waits: validProcess(19).waits.slice(0, 17) };
    }),
  );
  add('array-body', [], { _: 'Ungültige Anfrage' });
  return out;
}

// ─── Tickets ──────────────────────────────────────────────────────────────────

const ticketCreateFields: FieldDef[] = [
  { name: 'type', kind: 'enum', required: true, good: 'FEATURE', native: true },
  {
    name: 'title',
    kind: 'string',
    required: true,
    good: 'Golden Titel',
    nonEmpty: true,
    typeText: 'Titel ist erforderlich',
  },
  {
    name: 'body',
    kind: 'string',
    required: true,
    good: 'Golden Beschreibung',
    nonEmpty: true,
    typeText: 'Beschreibung ist erforderlich',
  },
  optId('agentTaskId'),
  { name: 'fullyReady', kind: 'boolean', typeText: 'Muss true oder false sein' },
];

const ticketStatusFields: FieldDef[] = [
  { name: 'status', kind: 'enum', required: true, good: 'TODO', native: true },
];
const ticketOwnerFields: FieldDef[] = [
  { name: 'owner', kind: 'enum', required: true, good: 'AI', native: true },
];
const ticketAskFields: FieldDef[] = [
  {
    name: 'question',
    kind: 'string',
    required: true,
    good: 'Golden Frage?',
    nonEmpty: true,
    typeText: 'Frage ist erforderlich',
  },
];
const commentOnlyFields: FieldDef[] = [optStr('comment')];
const ticketCommentFields: FieldDef[] = [
  {
    name: 'body',
    kind: 'string',
    required: true,
    good: 'Golden Kommentar',
    nonEmpty: true,
    typeText: 'Kommentar-Text ist erforderlich',
  },
  { name: 'handBackToAi', kind: 'boolean', typeText: 'Muss true oder false sein' },
  { name: 'clearFullyReady', kind: 'boolean', typeText: 'Muss true oder false sein' },
  { name: 'author', kind: 'enum', native: true },
];

// ─── Agent tasks and cron ─────────────────────────────────────────────────────

const rejectFields: FieldDef[] = [
  {
    name: 'comment',
    kind: 'string',
    required: true,
    good: 'Golden Grund',
    nonEmpty: true,
    emptyText: 'Kommentar ist erforderlich',
    missingText: 'Kommentar ist erforderlich',
  },
];

const cronCompleteFields: FieldDef[] = [
  {
    name: 'status',
    kind: 'enum',
    required: true,
    good: 'SUCCESS',
    typeText: 'Ungültiger Status',
  },
  {
    name: 'tasksSolved',
    kind: 'number',
    required: true,
    good: 1,
    intText: NOT_WHOLE,
    negativeText: 'Darf nicht negativ sein',
  },
  {
    name: 'tasksRejected',
    kind: 'number',
    required: true,
    good: 0,
    intText: NOT_WHOLE,
    negativeText: 'Darf nicht negativ sein',
  },
  {
    name: 'githubRunUrl',
    kind: 'url',
    required: true,
    good: 'https://github.com/example/repo/actions/runs/1',
    typeText: 'Ungültige URL',
  },
];

// ─── Query cases ──────────────────────────────────────────────────────────────

const queryCases: GoldenCase[] = [
  {
    id: 'agent-tasks-next-source-missing',
    method: 'GET',
    path: '/api/agent-tasks/next',
    auth: 'agent',
  },
  {
    id: 'agent-tasks-next-source-bogus',
    method: 'GET',
    path: '/api/agent-tasks/next',
    auth: 'agent',
    query: { source: 'BOGUS' },
  },
  {
    id: 'agent-tasks-list-status-bogus',
    method: 'GET',
    path: '/api/agent-tasks',
    auth: 'admin',
    query: { status: 'BOGUS' },
  },
  {
    id: 'tickets-list-type-invalid',
    method: 'GET',
    path: '/api/tickets',
    auth: 'admin',
    query: { type: 'X' },
  },
  {
    id: 'tickets-list-status-invalid',
    method: 'GET',
    path: '/api/tickets',
    auth: 'admin',
    query: { status: 'X' },
  },
  {
    id: 'tickets-list-owner-invalid',
    method: 'GET',
    path: '/api/tickets',
    auth: 'admin',
    query: { owner: 'X' },
  },
  {
    id: 'tickets-next-type-invalid',
    method: 'GET',
    path: '/api/tickets/next',
    auth: 'agent',
    query: { type: 'X' },
  },
  {
    id: 'firmen-list-sort-bogus',
    method: 'GET',
    path: '/api/firmen',
    auth: 'admin',
    query: { sort: 'bogus,asc' },
  },
];

// ─── Corpus ───────────────────────────────────────────────────────────────────

export const goldenCorpus: GoldenCase[] = [
  ...both('firmen', '/api/firmen', firmaFields),
  ...both('personen', '/api/personen', personFields),
  ...both('abteilungen', '/api/abteilungen', abteilungFields),
  ...both('adressen', '/api/adressen', adresseFields),
  ...both('aktivitaeten', '/api/aktivitaeten', aktivitaetFields),
  ...both('chancen', '/api/chancen', chanceFields),
  ...szenarioCases('szenarien-post', 'POST', '/api/szenarien'),
  ...szenarioCases('szenarien-put', 'PUT', '/api/szenarien/1'),
  ...genCases('tickets-create', 'POST', '/api/tickets', 'admin', ticketCreateFields),
  ...genCases('tickets-status', 'PATCH', '/api/tickets/1/status', 'admin', ticketStatusFields),
  ...genCases('tickets-owner', 'PATCH', '/api/tickets/1/owner', 'admin', ticketOwnerFields),
  ...genCases('tickets-ask', 'POST', '/api/tickets/1/ask', 'admin', ticketAskFields),
  ...genCases('tickets-done', 'POST', '/api/tickets/1/done', 'admin', commentOnlyFields),
  ...genCases('tickets-wont-do', 'POST', '/api/tickets/1/wont-do', 'admin', commentOnlyFields),
  ...genCases('tickets-comments', 'POST', '/api/tickets/1/comments', 'admin', ticketCommentFields),
  ...genCases('agent-tasks-reject', 'POST', '/api/agent-tasks/1/reject', 'agent', rejectFields),
  ...genCases('agent-tasks-done', 'POST', '/api/agent-tasks/1/done', 'agent', commentOnlyFields),
  ...genCases('cron-complete', 'POST', '/api/cron/runs/1/complete', 'agent', cronCompleteFields),
  ...queryCases,
];
