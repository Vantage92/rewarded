// WP-4 day context (architecture §5.1): the inputs of reconcileDay that are not sessions or bookings.
// Arms come from the ExperimentService; the season, vacation pause and rest period from params and
// the WP-3 tables. `arms` is a replaceable field so tests and later packages can swap the lookup.
import { CURRENT_PARAMS, addDays, compareDays, focusDayOf, type Params } from '@rewarded/core';
import { earnArmFor, goalForDay, personalBonusArm } from '@rewarded/core/goals';
import { isSeasonDay } from '@rewarded/core/calendar';
import { calendarDatesOfUser } from '../../db/calendar.ts';
import type { BonusArm, EarnArm, RestArm } from '@rewarded/core/ledger';
import type { FocusDay } from '@rewarded/core/time';
import { isFeatureEnabled } from '../../db/flags.ts';
import type { Db } from '../../db/types.ts';
import type { ModuleDeps } from '../../module.ts';
import { poolOf, type Pool } from '../catalog/stock.ts';

export interface UserProfile {
  id: string;
  pseudonym: string;
  ageBand: '16_17' | '18_plus';
  status: 'active' | 'blocked' | 'deleted';
  optedOut: boolean;
  restExitAt: string | null;
  cohort: 'experiment' | 'expansion';
  createdAt: string;
  institutionVerified: boolean;
  dailyGoalMin: number;
  dailyGoalNext: number | null;
  dailyGoalNextFrom: string | null;
  earnInReachedAt: string | null;
  firstRedeemAfter: string | null;
  phoneVerifiedAt: string | null;
}

interface UserRow {
  id: string;
  pseudonym: string;
  age_band: '16_17' | '18_plus';
  status: 'active' | 'blocked' | 'deleted';
  research_opt_out_at: string | null;
  rest_exit_at: string | null;
  cohort: 'experiment' | 'expansion';
  created_at: string;
  institution_verified_at: string | null;
  daily_goal_min: number;
  daily_goal_next: number | null;
  daily_goal_next_from: string | null;
  earn_in_reached_at: string | null;
  first_redeem_after: string | null;
  phone_verified_at: string | null;
}

export interface DayContext {
  arm: BonusArm | null;
  inSeason: boolean;
  vacation: boolean;
  goalMin: number;
  examDay: boolean;
  earnArm: EarnArm;
  dayClosed: boolean;
}

export type { Pool } from '../catalog/stock.ts';

export class PointsContext {
  readonly params: Params = CURRENT_PARAMS;
  /** Bonus and rest arm of a user on a day. Replace in tests or when the squad lookup arrives (WP-5). */
  arms: (db: Db, userId: string, day: FocusDay) => { bonus: BonusArm | null; rest: RestArm };

  private readonly deps: ModuleDeps;
  constructor(deps: ModuleDeps) {
    this.deps = deps;
    this.arms = (db, userId, day) => this.personalArms(db, userId, day);
  }

  /** Arms of the user's current unit (squad, else solo), before the fixed rest arm. */
  unitArms(db: Db, userId: string, day: FocusDay): { bonus: BonusArm | null; rest: RestArm } {
    return this.defaultArms(db, userId, day);
  }

  /** Unit arms, with the rest arm fixed to the person from T − 6 of the calendar (spec §3.16 step 2). */
  private personalArms(db: Db, userId: string, day: FocusDay): { bonus: BonusArm | null; rest: RestArm } {
    const a = this.defaultArms(db, userId, day);
    const fixed = db.get<{ rest_arm_fixed: RestArm | null }>('SELECT rest_arm_fixed FROM user WHERE id = ?', [userId])?.rest_arm_fixed ?? null;
    if (fixed && compareDays(day, calendarDatesOfUser(db, userId, this.params).restArmFixedFrom) >= 0) return { ...a, rest: fixed };
    return a;
  }

  profile(db: Db, userId: string): UserProfile | undefined {
    const r = db.get<UserRow>(
      `SELECT id, pseudonym, age_band, status, research_opt_out_at, rest_exit_at, cohort, created_at, institution_verified_at, daily_goal_min,
              daily_goal_next, daily_goal_next_from, earn_in_reached_at, first_redeem_after, phone_verified_at FROM user WHERE id = ?`,
      [userId],
    );
    if (!r) return undefined;
    return {
      id: r.id,
      pseudonym: r.pseudonym,
      ageBand: r.age_band,
      status: r.status,
      optedOut: r.research_opt_out_at !== null,
      restExitAt: r.rest_exit_at,
      cohort: r.cohort,
      createdAt: r.created_at,
      institutionVerified: r.institution_verified_at !== null,
      dailyGoalMin: r.daily_goal_min,
      dailyGoalNext: r.daily_goal_next,
      dailyGoalNextFrom: r.daily_goal_next_from,
      earnInReachedAt: r.earn_in_reached_at,
      firstRedeemAfter: r.first_redeem_after,
      phoneVerifiedAt: r.phone_verified_at,
    };
  }

  /** Squad whose membership covers `day` (left_day counts in full), else null: a solo unit. */
  private squadOn(db: Db, userId: string, day: FocusDay): string | null {
    try {
      const rows = db.all<{ squad_id: string; joined_at: string; left_day: string | null }>(
        'SELECT squad_id, joined_at, left_day FROM squad_membership WHERE user_id = ? ORDER BY joined_at DESC',
        [userId],
      );
      for (const r of rows) {
        const from = focusDayOf(Date.parse(r.joined_at), this.params);
        if (compareDays(from, day) <= 0 && (r.left_day === null || compareDays(r.left_day, day) >= 0)) return r.squad_id;
      }
      return null;
    } catch {
      return null;
    }
  }

  private defaultArms(db: Db, userId: string, day: FocusDay): { bonus: BonusArm | null; rest: RestArm } {
    const p = this.profile(db, userId);
    if (!p) return { bonus: null, rest: 'continue' };
    const squad = this.squadOn(db, userId, day);
    const unit = squad ? { type: 'squad' as const, id: squad, stratum: '' } : { type: 'solo' as const, id: userId, stratum: '' };
    try {
      const a = this.deps.services.experiments.armsFor({ userId, ageBand: p.ageBand, optedOut: p.optedOut, unit, day });
      // Arm B only runs while its flag is on (spec §5: without the lawyer's approval everybody gets A).
      // A day before the flag went on stays A, so a re-evaluation does not book B retroactively.
      const bonus = a.bonus === 'B' && !this.armBOnDay(db, day) ? 'A' : a.bonus;
      return { bonus: personalBonusArm(bonus, p.ageBand, p.optedOut), rest: a.rest };
    } catch {
      // No assignment (expansion cohort, or not assigned yet): no goal bonus.
      return { bonus: null, rest: 'continue' };
    }
  }

  /** Whether arm B runs on `day`: the flag is on and was switched on before or on that focus day. */
  armBOnDay(db: Db, day: FocusDay): boolean {
    if (!isFeatureEnabled(db, 'arm_b')) return false;
    const at = db.get<{ updated_at: string }>("SELECT updated_at FROM feature_flag WHERE key = 'arm_b'")?.updated_at;
    const t = at ? Date.parse(at) : Number.NaN;
    return Number.isNaN(t) || compareDays(focusDayOf(t, this.params), day) <= 0;
  }

  isVacation(db: Db, day: FocusDay): boolean {
    if (db.get('SELECT 1 AS x FROM vacation_pause LIMIT 1') !== undefined) {
      return db.get('SELECT 1 AS x FROM vacation_pause WHERE first_day <= ? AND last_day >= ?', [day, day]) !== undefined;
    }
    return compareDays(day, this.params.vacation_pause.first_day) >= 0 && compareDays(day, this.params.vacation_pause.last_day) <= 0;
  }

  /** Goal of a day: the stored goal of a closed day, else the user's goal with a pending change (spec §4.4). */
  /** Records a goal change in the history (with the goals before it on the first change). */
  recordGoalChange(db: Db, p: UserProfile, goalMin: number, effectiveFrom: FocusDay, at: string, newId: () => string): void {
    const has = db.get('SELECT 1 AS x FROM user_goal_change WHERE user_id = ? LIMIT 1', [p.id]) !== undefined;
    const ins = (g: number, from: string) => db.run('INSERT INTO user_goal_change (id, user_id, goal_min, effective_from, at) VALUES (?, ?, ?, ?, ?)', [newId(), p.id, g, from, at]);
    if (!has) {
      ins(p.dailyGoalMin, '0000-01-01');
      if (p.dailyGoalNext !== null && p.dailyGoalNextFrom !== null) ins(p.dailyGoalNext, p.dailyGoalNextFrom);
    }
    ins(goalMin, effectiveFrom);
  }

  goalFor(db: Db, p: UserProfile, day: FocusDay): number {
    const row = db.get<{ goal_min: number; closed_at: string | null }>('SELECT goal_min, closed_at FROM user_day WHERE user_id = ? AND focus_day = ?', [p.id, day]);
    if (row && row.closed_at !== null) return row.goal_min;
    // The goal history decides, so a second change before the day close cannot reach back (spec §4.4).
    const changes = db.all<{ goal_min: number; effective_from: string }>('SELECT goal_min, effective_from FROM user_goal_change WHERE user_id = ? ORDER BY at, id', [p.id]);
    if (changes.length > 0) return goalForDay(changes.map((c) => ({ goalMin: c.goal_min, effectiveFrom: c.effective_from })), day, p.dailyGoalMin);
    if (p.dailyGoalNext !== null && p.dailyGoalNextFrom !== null && compareDays(p.dailyGoalNextFrom, day) <= 0) return p.dailyGoalNext;
    return p.dailyGoalMin;
  }

  day(db: Db, userId: string, day: FocusDay): DayContext {
    const p = this.profile(db, userId);
    const row = db.get<{ exam_day: number; closed_at: string | null }>('SELECT exam_day, closed_at FROM user_day WHERE user_id = ? AND focus_day = ?', [userId, day]);
    const vacation = this.isVacation(db, day);
    // Season and rest period follow the exam calendar of the user's unit (spec §4.13, integration wave).
    const cal = calendarDatesOfUser(db, userId, this.params);
    const inSeason = !vacation && isSeasonDay(cal, { vacation_pause: { first_day: '0000-01-01', last_day: '0000-01-01' } }, day);
    const arms = p ? this.arms(db, userId, day) : { bonus: null, rest: 'continue' as const };
    const restExitFromDay = p?.restExitAt ? addDays(focusDayOf(Date.parse(p.restExitAt), this.params), 1) : null;
    const earnArm = p
      ? earnArmFor(this.params, day, {
          ageBand: p.ageBand,
          optedOut: p.optedOut,
          restArm: arms.rest,
          restPeriodEnabled: isFeatureEnabled(db, 'rest_period'),
          restExitFromDay,
          cohort: p.cohort,
          restPeriod: cal.restPeriod,
        })
      : 'earn';
    return {
      arm: inSeason ? arms.bonus : null,
      inSeason,
      vacation,
      goalMin: p ? this.goalFor(db, p, day) : this.params.goals.default_min,
      examDay: row?.exam_day === 1,
      earnArm,
      dayClosed: row?.closed_at != null,
    };
  }

  /** Voucher pool of a user (architecture §5.3): experiment until the bonus stop, then research; expansion. */
  pool(p: UserProfile, day: FocusDay, db?: Db): Pool {
    return poolOf(p.cohort, day, db ? calendarDatesOfUser(db, p.id, this.params).tDay : undefined);
  }
}
