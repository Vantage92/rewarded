// Rest arm per person and the rest exit (spec §3.16 steps 2–4, §5 "Overstap na T − 6";
// architecture §5.1 rule 5, §8.2 POST /me/rest-exit). Integration wave.
// - From T − 6 of the unit's calendar the rest arm belongs to the person (user.rest_arm_fixed): a
//   later switch to another squad does not change it.
// - A member of the rest group who switches to a continuing squad after T − 6 leaves the rest
//   period (rest_exit_at, source squad_switch, event rest_period_exit): points from the next day.
// - POST /me/rest-exit is the same choice from a notice or the profile.
import { addDays, focusDayOf, restArmFixedOn } from '@rewarded/core';
import { DomainError, routes, type RestExitRequest } from '@rewarded/contracts';
import type { Hono } from 'hono';
import { calendarDatesOfUser } from '../../db/calendar.ts';
import type { Db } from '../../db/types.ts';
import { mount } from '../../middleware/route.ts';
import type { AppEnv, ModuleDeps } from '../../module.ts';

type RestArm = 'rest' | 'continue';

interface RestUser {
  id: string;
  pseudonym: string;
  age_band: '16_17' | '18_plus';
  cohort: 'experiment' | 'expansion';
  research_opt_out_at: string | null;
  rest_exit_at: string | null;
  rest_arm_fixed: RestArm | null;
}

function restUser(db: Db, userId: string): RestUser | undefined {
  return db.get<RestUser>('SELECT id, pseudonym, age_band, cohort, research_opt_out_at, rest_exit_at, rest_arm_fixed FROM user WHERE id = ?', [userId]);
}

function todayOf(deps: ModuleDeps): string {
  return focusDayOf(deps.platform.clock.now().getTime(), deps.services.pointsContext.params);
}

/** Arm of the current unit (squad, else solo), without the fixed arm. */
function unitRestArm(db: Db, deps: ModuleDeps, userId: string, day: string): RestArm {
  try {
    return deps.services.pointsContext.unitArms(db, userId, day).rest;
  } catch {
    return 'continue';
  }
}

/** The personal rest arm on `day`: the fixed arm from T − 6, else the arm of the current unit. */
export function personalRestArm(db: Db, deps: ModuleDeps, userId: string, day: string): RestArm {
  const u = restUser(db, userId);
  if (!u) return 'continue';
  if (u.age_band === '16_17' || u.cohort === 'expansion' || u.research_opt_out_at !== null) return 'continue';
  if (u.rest_arm_fixed && restArmFixedOn(calendarDatesOfUser(db, userId), day)) return u.rest_arm_fixed;
  return unitRestArm(db, deps, userId, day);
}

/** Fixes the rest arm to the person once T − 6 of the unit's calendar is reached (idempotent). */
export function fixRestArm(db: Db, deps: ModuleDeps, userId: string, day: string): RestArm | null {
  const u = restUser(db, userId);
  if (!u || u.cohort !== 'experiment' || u.rest_arm_fixed !== null) return u?.rest_arm_fixed ?? null;
  if (!restArmFixedOn(calendarDatesOfUser(db, userId), day)) return null;
  const arm = unitRestArm(db, deps, userId, day);
  db.run('UPDATE user SET rest_arm_fixed = ? WHERE id = ? AND rest_arm_fixed IS NULL', [arm, userId]);
  return arm;
}

/** Day close (step 6): fixes the rest arm of every experiment user whose calendar reached T − 6. */
export function fixRestArmsForDay(db: Db, deps: ModuleDeps, day: string): number {
  let n = 0;
  for (const r of db.all<{ id: string }>("SELECT id FROM user WHERE cohort = 'experiment' AND status = 'active' AND rest_arm_fixed IS NULL")) {
    if (fixRestArm(db, deps, r.id, day) !== null) n += 1;
  }
  return n;
}

function recordExit(db: Db, deps: ModuleDeps, u: RestUser, source: 'notice' | 'april_notice' | 'profile' | 'squad_switch', day: string): { at: string; from: string } {
  const at = deps.platform.clock.now().toISOString();
  db.run('UPDATE user SET rest_exit_at = ?, rest_exit_source = ? WHERE id = ? AND rest_exit_at IS NULL', [at, source, u.id]);
  const bron = ({ notice: 'bericht', april_notice: 'herhaalbericht', profile: 'profiel', squad_switch: 'squad_switch' } as const)[source];
  deps.services.events.event(db, 'rest_period_exit', { dag: day, bron }, { pseudonym: u.pseudonym });
  if (source === 'squad_switch') deps.services.experiments.switchArm(db, { userId: u.id, factor: 'rest', from: 'rest', to: 'continue', reason: 'squad_switch' });
  return { at, from: addDays(day, 1) };
}

/**
 * Called when a user is about to leave a squad: after T − 6 the arm is fixed first, so the switch
 * cannot change it (spec §3.16 step 2).
 */
export function beforeLeaveSquad(db: Db, deps: ModuleDeps, userId: string): void {
  fixRestArm(db, deps, userId, todayOf(deps));
}

/**
 * Called after a user joined a squad. A rest-group member who joins a continuing squad after T − 6
 * leaves the rest period (source squad_switch). Returns whether that happened.
 */
export function afterJoinSquad(db: Db, deps: ModuleDeps, userId: string, squadArmRest: RestArm | null): boolean {
  const day = todayOf(deps);
  const u = restUser(db, userId);
  if (!u || u.cohort !== 'experiment' || u.rest_exit_at !== null || u.age_band === '16_17' || u.research_opt_out_at !== null) return false;
  if (u.rest_arm_fixed !== 'rest' || !restArmFixedOn(calendarDatesOfUser(db, userId), day)) return false;
  if (squadArmRest === 'rest') return false;
  recordExit(db, deps, u, 'squad_switch', day);
  return true;
}

/** Whether joining a squad with `squadArmRest` now would count as a rest exit (notice before joining). */
export function joinWouldExitRest(db: Db, deps: ModuleDeps, userId: string, squadArmRest: RestArm | null): boolean {
  const day = todayOf(deps);
  if (squadArmRest === 'rest') return false;
  const u = restUser(db, userId);
  if (!u || u.cohort !== 'experiment' || u.rest_exit_at !== null) return false;
  const fixedNow = restArmFixedOn(calendarDatesOfUser(db, userId), day);
  return fixedNow && personalRestArm(db, deps, userId, day) === 'rest';
}

export function registerRestExit(api: Hono<AppEnv>, deps: ModuleDeps): void {
  mount(api, routes['me.restExit'], ({ auth, body }) => {
    if (auth.kind !== 'user') throw new DomainError('AUTH_REQUIRED');
    const userId = auth.user.id;
    return deps.db.transaction(() => {
      const u = restUser(deps.db, userId);
      if (!u) throw new DomainError('NOT_FOUND');
      if (u.rest_exit_at !== null) throw new DomainError('ALREADY_EXITED');
      const day = todayOf(deps);
      if (personalRestArm(deps.db, deps, userId, day) !== 'rest') throw new DomainError('NOT_IN_REST_ARM');
      fixRestArm(deps.db, deps, userId, day);
      const r = recordExit(deps.db, deps, u, (body as RestExitRequest).source, day);
      return { rest_exit_at: r.at, earns_from_day: r.from };
    });
  });
}
