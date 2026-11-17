import { client } from '../config/db.js';
import { CHANCE_PHASE, AKTIVITAET_TYP, type ChancePhase, type AktivitaetTyp } from '../db/schema/enums.js';
import type { Schema } from '../openapi/types.js';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export type DashboardData = Schema<'DashboardData'>;
type RecentChance = Schema<'RecentChance'>;
type RecentAktivitaet = Schema<'RecentAktivitaet'>;

// ─── Raw row shapes returned by libsql ────────────────────────────────────────

interface CountRow {
  cnt: number;
}

interface SumRow {
  total: number;
}

interface RecentChanceRow {
  id: number;
  titel: string;
  wert: number | null;
  currency: string;
  phase: string;
  firmaName: string;
  createdAt: string;
}

interface RecentAktivitaetRow {
  id: number;
  typ: string;
  subject: string;
  datum: string;
  firmaName: string | null;
  personName: string | null;
  createdAt: string;
}

function isChancePhase(value: string): value is ChancePhase {
  return (CHANCE_PHASE as readonly string[]).includes(value);
}

function isAktivitaetTyp(value: string): value is AktivitaetTyp {
  return (AKTIVITAET_TYP as readonly string[]).includes(value);
}

function toRecentChance(row: RecentChanceRow): RecentChance {
  if (!isChancePhase(row.phase)) {
    throw new Error(`Unexpected chance.phase in database: ${row.phase}`);
  }
  return {
    id: row.id,
    titel: row.titel,
    wert: row.wert,
    currency: row.currency,
    phase: row.phase,
    firmaName: row.firmaName,
    createdAt: row.createdAt,
  };
}

function toRecentAktivitaet(row: RecentAktivitaetRow): RecentAktivitaet {
  if (!isAktivitaetTyp(row.typ)) {
    throw new Error(`Unexpected aktivitaet.typ in database: ${row.typ}`);
  }
  return {
    id: row.id,
    typ: row.typ,
    subject: row.subject,
    datum: row.datum,
    // personName is NULL when no person is linked — LEFT JOIN miss returns null
    firmaName: row.firmaName,
    personName: row.personName,
    createdAt: row.createdAt,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function getDashboard(): Promise<DashboardData> {
  const firmenResult = await client.execute({
    sql: 'SELECT COUNT(*) AS cnt FROM firma',
    args: [],
  });
  const firmenRow = firmenResult.rows[0] as unknown as CountRow;

  const personenResult = await client.execute({
    sql: 'SELECT COUNT(*) AS cnt FROM person',
    args: [],
  });
  const personenRow = personenResult.rows[0] as unknown as CountRow;

  const offeneResult = await client.execute({
    sql: "SELECT COUNT(*) AS cnt FROM chance WHERE phase NOT IN ('GEWONNEN','VERLOREN')",
    args: [],
  });
  const offeneRow = offeneResult.rows[0] as unknown as CountRow;

  const sumResult = await client.execute({
    sql: "SELECT COALESCE(SUM(wert), 0) AS total FROM chance WHERE phase = 'GEWONNEN'",
    args: [],
  });
  const sumRow = sumResult.rows[0] as unknown as SumRow;

  const recentChancenResult = await client.execute({
    sql: `SELECT c.id, c.titel, c.wert, c.currency, c.phase, f.name AS firmaName, c.createdAt
          FROM chance c
          JOIN firma f ON f.id = c.firmaId
          ORDER BY c.createdAt DESC
          LIMIT 5`,
    args: [],
  });
  const recentChancenRows = recentChancenResult.rows as unknown as RecentChanceRow[];

  const recentAktivitaetenResult = await client.execute({
    sql: `SELECT a.id, a.typ, a.subject, a.datum,
                 f.name AS firmaName,
                 (p.firstName || ' ' || p.lastName) AS personName,
                 a.createdAt
          FROM aktivitaet a
          LEFT JOIN firma f ON f.id = a.firmaId
          LEFT JOIN person p ON p.id = a.personId
          ORDER BY a.createdAt DESC
          LIMIT 5`,
    args: [],
  });
  const recentAktivitaetenRows = recentAktivitaetenResult.rows as unknown as RecentAktivitaetRow[];

  return {
    firmenCount: Number(firmenRow.cnt),
    personenCount: Number(personenRow.cnt),
    offeneChancenCount: Number(offeneRow.cnt),
    gewonneneChancenSumme: sumRow.total,
    recentChancen: recentChancenRows.map(toRecentChance),
    recentAktivitaeten: recentAktivitaetenRows.map(toRecentAktivitaet),
  };
}
