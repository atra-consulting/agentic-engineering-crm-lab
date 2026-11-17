/**
 * Operations that no test can call successfully. Goal: keep this list empty.
 * Every entry needs a real reason.
 */
export interface CoverageExemption {
  operationId: string;
  reason: string;
}

export const COVERAGE_EXEMPTIONS: CoverageExemption[] = [];
