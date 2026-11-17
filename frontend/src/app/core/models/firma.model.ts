import type { components } from '../api/api-types';

export type FirmaAdresse = components['schemas']['FirmaAdresse'];
export type FirmaAdresseTyp = NonNullable<FirmaAdresse['typ']>;
export type Firma = components['schemas']['Firma'];
export type FirmaCreate = components['schemas']['FirmaInput'];
