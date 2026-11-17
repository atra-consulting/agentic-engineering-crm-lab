/** Compile-time only: `Page<T>` must match every generated page schema. No runtime effect. */
import type { Page } from '../models/page.model';
import type { components } from './api-types';
import type { AssertTrue, Equal } from './type-utils';

type Schemas = components['schemas'];

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
