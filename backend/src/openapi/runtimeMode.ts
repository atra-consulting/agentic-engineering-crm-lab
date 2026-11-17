/**
 * Contract mode of the running server, from `NODE_ENV`.
 *
 * - `development`: response check warns (`X-Contract-Violation`), test-login and /api/docs exist.
 * - `test`: response check fails the answer with a 500, test-login exists.
 * - `production`: no response check, no test-login, no docs.
 *
 * Fail-closed: only an exact `development` or `test` counts. Unset, empty and
 * every other value (also `Development`, `staging`) mean `production`.
 */
export const CONTRACT_MODES = ['development', 'test', 'production'] as const;

export type ContractMode = (typeof CONTRACT_MODES)[number];

/** Modes in which dev/test-only features exist (`x-environments` values). */
export type DevOrTestMode = Exclude<ContractMode, 'production'>;

export function getContractMode(env: Readonly<Record<string, string | undefined>> = process.env): ContractMode {
  const value = env['NODE_ENV'];
  return value === 'development' || value === 'test' ? value : 'production';
}

/** True only for `development` and `test`. */
export function isDevOrTest(mode: ContractMode): mode is DevOrTestMode {
  // Explicit comparison, not `!== 'production'`: a value cast from outside stays fail-closed.
  return mode === 'development' || mode === 'test';
}
