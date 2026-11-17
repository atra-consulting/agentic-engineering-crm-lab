import type { components } from '../api/api-types';
import { ProzessKey } from './prozess-defaults';

export type ProzessDauer = components['schemas']['ProzessDauer'];
export type Szenario = components['schemas']['Szenario'];
export type SzenarioCreate = components['schemas']['SzenarioInput'];
export type SzenarioUpdate = components['schemas']['SzenarioInput'];

/** The Szenario field name that stores a given process's step durations. */
export type SzenarioProzessFeld =
  | 'humanSteps'
  | 'agileKiSteps'
  | 'semiAutomatedSteps'
  | 'automatedSteps';

/** Bridges the component's ProzessKey to the Szenario/SzenarioCreate field that stores it. */
export const PROZESS_SZENARIO_FELD: Record<ProzessKey, SzenarioProzessFeld> = {
  menschlich: 'humanSteps',
  agileKi: 'agileKiSteps',
  halbautomatisch: 'semiAutomatedSteps',
  vollautomatisch: 'automatedSteps',
};
