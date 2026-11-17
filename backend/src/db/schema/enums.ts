import type { Schema } from '../../openapi/types.js';

export const CHANCE_PHASE = [
  'NEU',
  'QUALIFIZIERT',
  'ANGEBOT',
  'VERHANDLUNG',
  'GEWONNEN',
  'VERLOREN',
] as const;
export type ChancePhase = (typeof CHANCE_PHASE)[number];

export const AKTIVITAET_TYP = [
  'ANRUF',
  'EMAIL',
  'MEETING',
  'NOTIZ',
  'AUFGABE',
] as const;
export type AktivitaetTyp = (typeof AKTIVITAET_TYP)[number];

export const AGENT_TASK_SOURCE = [
  'EMAIL',
  'GITHUB_ISSUE',
  'APP_LOG',
  'ERROR_REPORT',
] as const;
export type AgentTaskSource = (typeof AGENT_TASK_SOURCE)[number];

export const AGENT_TASK_STATUS = [
  'OPEN',
  'IN_PROGRESS',
  'DONE',
  'REJECTED',
] as const;
export type AgentTaskStatus = (typeof AGENT_TASK_STATUS)[number];

export const TICKET_OWNER = ['AI', 'HUMAN'] as const;
export type TicketOwner = (typeof TICKET_OWNER)[number];

export const TICKET_TYPE = ['FEATURE', 'BUG', 'CHORE'] as const;
export type TicketType = (typeof TICKET_TYPE)[number];

export const TICKET_STATUS = ['DEFINITION', 'TODO', 'IN_PROGRESS', 'ON_HOLD', 'DONE'] as const;
export type TicketStatus = (typeof TICKET_STATUS)[number];

export const TICKET_SOLUTION = ['DONE', 'WONT_DO'] as const;
export type TicketSolution = (typeof TICKET_SOLUTION)[number];

export const TICKET_COMMENT_AUTHOR = ['HUMAN', 'AGENT'] as const;
export type TicketCommentAuthor = (typeof TICKET_COMMENT_AUTHOR)[number];

export const CRON_RUN_STATUS = ['RUNNING', 'SUCCESS', 'FAILED', 'SKIPPED'] as const;
export type CronRunStatus = (typeof CRON_RUN_STATUS)[number];

export const CRON_TRIGGER = ['CRON', 'MANUAL'] as const;
export type CronTrigger = (typeof CRON_TRIGGER)[number];

// ─── Compile-time sync with the generated contract (both directions) ─────────

type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

export const ENUM_CONTRACT_SYNC = {
  chancePhase: true as Exact<ChancePhase, Schema<'ChancePhase'>>,
  aktivitaetTyp: true as Exact<AktivitaetTyp, Schema<'AktivitaetTyp'>>,
  agentTaskSource: true as Exact<AgentTaskSource, Schema<'AgentTaskSource'>>,
  agentTaskStatus: true as Exact<AgentTaskStatus, Schema<'AgentTaskStatus'>>,
  ticketOwner: true as Exact<TicketOwner, Schema<'TicketOwner'>>,
  ticketType: true as Exact<TicketType, Schema<'TicketType'>>,
  ticketStatus: true as Exact<TicketStatus, Schema<'TicketStatus'>>,
  ticketSolution: true as Exact<TicketSolution, Schema<'TicketSolution'>>,
  ticketCommentAuthor: true as Exact<TicketCommentAuthor, Schema<'TicketCommentAuthor'>>,
  cronRunStatus: true as Exact<CronRunStatus, Schema<'CronRunStatus'>>,
  cronTrigger: true as Exact<CronTrigger, Schema<'CronTrigger'>>,
};

// ─── Guards and tolerant reader ──────────────────────────────────────────────

/** Build a type guard for one enum list. */
export function isOneOf<T extends string>(list: readonly T[]): (value: string) => value is T {
  return (value: string): value is T => (list as readonly string[]).includes(value);
}

export const isTicketOwner = isOneOf(TICKET_OWNER);
export const isTicketType = isOneOf(TICKET_TYPE);
export const isTicketStatus = isOneOf(TICKET_STATUS);
export const isTicketSolution = isOneOf(TICKET_SOLUTION);
export const isAgentTaskSource = isOneOf(AGENT_TASK_SOURCE);

const warned = new Set<string>();

/** Log once per distinct value that a DB enum value lies outside the contract. */
export function warnEnumOnce(label: string, value: string): void {
  const key = `${label}=${value}`;
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[enum] ${label} has value outside the contract: ${value}`);
}

/**
 * Tolerant read of a DB enum column. Unknown values pass through unchanged
 * (pre-contract behavior) and are logged once; dev/test response checks flag them.
 */
export function asEnum<T extends string>(list: readonly T[], value: string, label: string): T {
  if (!(list as readonly string[]).includes(value)) warnEnumOnce(label, value);
  // The ONE allowed cast: the DB may hold values outside the contract; we keep old runtime behavior.
  return value as T;
}
