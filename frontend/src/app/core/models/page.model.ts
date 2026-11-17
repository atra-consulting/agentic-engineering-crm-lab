export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// --- Contract check (type-only, no runtime effect) ---
import type { components } from '../api/api-types';

type Schemas = components['schemas'];

/** Mutual assignability. Works for `allOf` intersections, which are not identical types. */
export type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

type AssertTrue<_T extends true> = void;

export type PageContractChecks = [
  AssertTrue<Equal<Page<Schemas['Firma']>, Schemas['FirmaPage']>>,
  AssertTrue<Equal<Page<Schemas['Person']>, Schemas['PersonPage']>>,
  AssertTrue<Equal<Page<Schemas['Abteilung']>, Schemas['AbteilungPage']>>,
  AssertTrue<Equal<Page<Schemas['Adresse']>, Schemas['AdressePage']>>,
  AssertTrue<Equal<Page<Schemas['Aktivitaet']>, Schemas['AktivitaetPage']>>,
  AssertTrue<Equal<Page<Schemas['Chance']>, Schemas['ChancePage']>>,
  AssertTrue<Equal<Page<Schemas['AgentTask']>, Schemas['AgentTaskPage']>>,
  AssertTrue<Equal<Page<Schemas['CronRun']>, Schemas['CronRunPage']>>,
  AssertTrue<Equal<Page<Schemas['TicketListItem']>, Schemas['TicketListItemPage']>>,
];
