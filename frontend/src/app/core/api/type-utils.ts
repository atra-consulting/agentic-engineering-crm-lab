/**
 * Mutual assignability. Gaps: optional extra props compare equal, `readonly` is ignored,
 * and `any` on either side gives true. Good enough for contract checks and `allOf` intersections.
 */
export type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

/** Compile-time assertion: only `true` satisfies the constraint. */
export type AssertTrue<_T extends true> = void;
