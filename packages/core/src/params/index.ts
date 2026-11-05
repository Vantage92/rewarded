// Parameter sets (owner WP-1, architecture §2 and §12.1). Pure: no I/O.
import { ParamSetSchema } from './schema.ts';
import type { LevelParamSet, ParamSet } from './schema.ts';
import { PARAMS_V1_RAW } from './v1.ts';

export * from './schema.ts';

type DeepReadonly<T> = T extends readonly [infer A, infer B]
  ? readonly [DeepReadonly<A>, DeepReadonly<B>]
  : T extends (infer U)[]
    ? readonly DeepReadonly<U>[]
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

/** A validated, frozen parameter set as the rest of core consumes it. */
export type Params = DeepReadonly<ParamSet>;
export type LevelParams = DeepReadonly<LevelParamSet>;
export type SessionParams = Params['session'];
export type TimeParams = Params['time'];

/** Verification levels known to this parameter set. The web MVP has only level 1 (architecture §1). */
export type VerificationLevel = 1;
export const VERIFICATION_LEVELS: readonly VerificationLevel[] = [1];

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const v of Object.values(value)) deepFreeze(v);
    Object.freeze(value);
  }
  return value;
}

export class ParamsError extends Error {
  readonly issues: readonly string[];
  constructor(issues: readonly string[]) {
    super(`Invalid parameter set: ${issues.join('; ')}`);
    this.name = 'ParamsError';
    this.issues = issues;
  }
}

/** Validates unknown input (e.g. a stored `param_set` row) and returns a frozen copy. */
export function parseParams(input: unknown): Params {
  const result = ParamSetSchema.safeParse(input);
  if (!result.success) {
    throw new ParamsError(result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`));
  }
  return deepFreeze(result.data);
}

/** Parameter set v1 (spec §5), validated at module load. */
export const PARAMS_V1: Params = parseParams(PARAMS_V1_RAW);

/** Every known parameter set by version; `param_version` on a journal entry points here. */
export const PARAM_SETS: Readonly<Record<number, Params>> = Object.freeze({ 1: PARAMS_V1 });

export const CURRENT_PARAMS: Params = PARAMS_V1;

export function paramsByVersion(version: number): Params {
  const p = PARAM_SETS[version];
  if (!p) throw new ParamsError([`unknown parameter version ${version}`]);
  return p;
}

/** Caps for one verification level. Unknown levels throw: there is no default that could mean money. */
export function levelParams(params: Params, level: number): LevelParams {
  const key = String(level);
  if (key !== '1') throw new ParamsError([`no caps defined for verification level ${level}`]);
  return params.levels[key];
}

/** Longest session length; drives the day-close moment (architecture §6.1). */
export function maxSessionMin(params: Pick<Params, 'session'>): number {
  return Math.max(...params.session.lengths_min);
}

/** Minutes after the day boundary at which the day close runs: max session + end grace + sweep margin. */
export function dayCloseOffsetMin(params: Pick<Params, 'session' | 'time'>): number {
  return maxSessionMin(params) + params.session.end_grace_min + params.time.sweep_margin_min;
}

/** True for lengths a student can pick (practice excluded). */
export function isSessionLength(params: Params, min: number): boolean {
  return params.session.lengths_min.includes(min);
}

/** Members needed for a successful squad day: ceil(share × active), at least streak_min_met (spec §4.4). */
export function streakRequiredMet(params: Params, activeMembers: number): number {
  return Math.max(params.squads.streak_min_met, Math.ceil(activeMembers * params.squads.streak_share));
}

/** Club join-code cap: floor(1.1 × declared members) (architecture §3.4). Integer maths avoids 1.1 float drift. */
export function clubCodeCap(params: Params, declaredMembers: number): number {
  const factorTenths = Math.round(params.challenges.code_cap_factor * 10);
  return Math.floor((declaredMembers * factorTenths) / 10);
}

/** Pool for a club by declared members: < 150, 150–500, > 500 (spec §4.6). */
export function clubPool(params: Params, declaredMembers: number): 'lt150' | '150_500' | 'gt500' {
  const [low, high] = params.challenges.pool_bounds;
  if (declaredMembers < low) return 'lt150';
  if (declaredMembers <= high) return '150_500';
  return 'gt500';
}
