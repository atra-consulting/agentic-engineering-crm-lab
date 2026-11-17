/**
 * Contract lists: enums, sort fields, default sorts and roles/permissions in
 * the bundle equal their sources in code.
 */
import { test, expect } from '@playwright/test';
import {
  CHANCE_PHASE,
  AKTIVITAET_TYP,
  AGENT_TASK_SOURCE,
  AGENT_TASK_STATUS,
  TICKET_OWNER,
  TICKET_TYPE,
  TICKET_STATUS,
  TICKET_SOLUTION,
  TICKET_COMMENT_AUTHOR,
} from '../db/schema/enums.js';
import { ALLOWED_SORT_FIELDS } from '../utils/pagination.js';
import { USERS } from '../config/users.js';
import { bundle, getOp, operations, resolveParameters, resolveSchema, sameSet } from './contract-helpers.js';

const SCHEMA_ENUMS: Record<string, readonly string[]> = {
  ChancePhase: CHANCE_PHASE,
  AktivitaetTyp: AKTIVITAET_TYP,
  AgentTaskSource: AGENT_TASK_SOURCE,
  AgentTaskStatus: AGENT_TASK_STATUS,
  TicketOwner: TICKET_OWNER,
  TicketType: TICKET_TYPE,
  TicketStatus: TICKET_STATUS,
  TicketSolution: TICKET_SOLUTION,
  TicketCommentAuthor: TICKET_COMMENT_AUTHOR,
};

// operationId -> query param name -> expected values
const QUERY_ENUMS: Record<string, Record<string, readonly string[]>> = {
  listChancen: { phase: CHANCE_PHASE },
  claimNextAgentTask: { source: AGENT_TASK_SOURCE },
  listAgentTasks: { source: AGENT_TASK_SOURCE, status: AGENT_TASK_STATUS },
  claimNextTicket: { type: TICKET_TYPE },
  listTickets: { type: TICKET_TYPE, status: TICKET_STATUS, owner: TICKET_OWNER },
};

const SORT_ENTITY: Record<string, string> = {
  listFirmen: 'firma',
  listPersonen: 'person',
  listAbteilungen: 'abteilung',
  listAdressen: 'adresse',
  listAktivitaeten: 'aktivitaet',
  listChancen: 'chance',
  listAgentTasks: 'agentTask',
  listCronRuns: 'cronRun',
  listTickets: 'ticket',
};

const DEFAULT_SORT: Record<string, string> = {
  firma: 'name,ASC',
  person: 'lastName,ASC',
  abteilung: 'name,ASC',
  adresse: 'city,ASC',
  aktivitaet: 'datum,DESC',
  chance: 'createdAt,DESC',
  agentTask: 'createdAt,DESC',
  cronRun: 'startedAt,DESC',
  ticket: 'createdAt,DESC',
};

test.describe('contract lists: enums', () => {
  for (const [name, expected] of Object.entries(SCHEMA_ENUMS)) {
    test(`schema ${name} equals enums.ts`, () => {
      const schema = bundle.components.schemas[name];
      expect(schema, `schema ${name} missing`).toBeDefined();
      expect(sameSet(schema?.enum ?? [], expected), `${name}: ${JSON.stringify(schema?.enum)} vs ${JSON.stringify(expected)}`).toBe(true);
    });
  }

  for (const [operationId, params] of Object.entries(QUERY_ENUMS)) {
    for (const [paramName, expected] of Object.entries(params)) {
      test(`${operationId} query ${paramName} enum equals enums.ts`, () => {
        const param = resolveParameters(getOp(operationId)).find((p) => p.name === paramName && p.in === 'query');
        expect(param, `${operationId}.${paramName} missing`).toBeDefined();
        const schema = param?.schema ? resolveSchema(param.schema) : undefined;
        expect(sameSet(schema?.enum ?? [], expected)).toBe(true);
      });
    }
  }
});

test.describe('contract lists: sort', () => {
  for (const [operationId, entity] of Object.entries(SORT_ENTITY)) {
    test(`${operationId} x-sort-fields equals ALLOWED_SORT_FIELDS.${entity}`, () => {
      const fields = getOp(operationId).raw['x-sort-fields'] ?? [];
      expect(sameSet(fields, Object.keys(ALLOWED_SORT_FIELDS[entity] ?? {}))).toBe(true);
    });

    test(`${operationId} x-default-sort is ${DEFAULT_SORT[entity]}`, () => {
      expect(getOp(operationId).raw['x-default-sort']).toBe(DEFAULT_SORT[entity]);
    });
  }

  test('every operation that declares sort is in the map', () => {
    const withSort = operations
      .filter((o) => resolveParameters(o).some((p) => p.name === 'sort' && p.in === 'query'))
      .map((o) => o.operationId);
    const unmapped = withSort.filter((id) => !(id in SORT_ENTITY));
    expect(unmapped).toEqual([]);
  });

  test('every mapped operation declares sort', () => {
    const noSort = Object.keys(SORT_ENTITY).filter(
      (id) => !resolveParameters(getOp(id)).some((p) => p.name === 'sort' && p.in === 'query'),
    );
    expect(noSort).toEqual([]);
  });
});

test.describe('contract lists: users', () => {
  test('Rolle equals ROLE_ + roles in USERS', () => {
    const expected = [...new Set(USERS.flatMap((u) => u.roles))].map((r) => `ROLE_${r}`);
    expect(sameSet(bundle.components.schemas['Rolle']?.enum ?? [], expected)).toBe(true);
  });

  test('Permission equals union of USERS permissions', () => {
    const expected = [...new Set(USERS.flatMap((u) => u.permissions))];
    expect(sameSet(bundle.components.schemas['Permission']?.enum ?? [], expected)).toBe(true);
  });
});
