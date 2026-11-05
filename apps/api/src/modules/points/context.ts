// WP-4 day context (architecture §5.1): the inputs of reconcileDay that are not sessions or bookings.
// Arms come from the ExperimentService; the season, vacation pause and rest period from params and
// the WP-3 tables. `arms` is a replaceable field so tests and later packages can swap the lookup.
import { CURRENT_PARAMS, addDays, compareDays, focusDayOf, type Params } from '@rewarded/core';
import { earnArmFor, inGoalSeason, personalBonusArm } from '@rewarded/core/goals';
import type { BonusArm, EarnArm, RestArm } from '@rewarded/core/ledger';
import type { FocusDay } from '@rewarded/core/time';
import { isFeatureEnabled } from '../../db/flags.ts';
import type { Db } from '../../db/types.ts';
import type { ModuleDeps } from '../../module.ts';

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

export type Pool = 'pilot' | 'research' | 'expansion';

export class PointsContext {
  readonly params: Params = CURRENT_PARAMS;
  /** Bonus and rest arm of a user on a day. Replace in tests or when the squad lookup arrives (WP-5). */
  arms: (db: Db, userId: string, day: FocusDay) => { bonus: BonusArm | null; rest: RestArm };

  private readonly deps: ModuleDeps;
  constructor(deps: ModuleDeps) {
    this.deps = deps;
    this.arms = (db, userId) => this.defaultArms(db, userId);
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

  /** Squad of a user when WP-5's table exists; otherwise the user is a solo unit. */
  private squadOf(db: Db, userId: string): string | null {
    try {
      return db.get<{ squad_id: string }>('SELECT squad_id FROM squad_membership WHERE user_id = ? AND left_at IS NULL LIMIT 1', [userId])?.squad_id ?? null;
    } catch {
      return null;
    }
  }

  private defaultArms(db: Db, userId: string): { bonus: BonusArm | null; rest: RestArm } {
    const p = this.profile(db, userId);
    if (!p) return { bonus: null, rest: 'continue' };
    const squad = this.squadOf(db, userId);
    const unit = squad ? { type: 'squad' as const, id: squad, stratum: '' } : { type: 'solo' as const, id: userId, stratum: '' };
    try {
      const a = this.deps.services.experiments.armsFor({ userId, ageBand: p.ageBand, optedOut: p.optedOut, unit });
      // Arm B only runs while its flag is on (spec §5: without the lawyer's approval everybody gets A).
      const bonus = a.bonus === 'B' && !isFeatureEnabled(db, 'arm_b') ? 'A' : a.bonus;
      return { bonus: personalBonusArm(bonus, p.ageBand, p.optedOut), rest: a.rest };
    } catch {
      // No assignment (expansion cohort, or not assigned yet): no goal bonus.
      return { bonus: null, rest: 'continue' };
    }
  }

  isVacation(db: Db, day: FocusDay): boolean {
    if (db.get('SELECT 1 AS x FROM vacation_pause LIMIT 1') !== undefined) {
      return db.get('SELECT 1 AS x FROM vacation_pause WHERE first_day <= ? AND last_day >= ?', [day, day]) !== undefined;
    }
    return compareDays(day, this.params.vacation_pause.first_day) >= 0 && compareDays(day, this.params.vacation_pause.last_day) <= 0;
  }

  /** Goal of a day: the stored goal of a closed day, else the user's goal with a pending change (spec §4.4). */
  goalFor(db: Db, p: UserProfile, day: FocusDay): number {
    const row = db.get<{ goal_min: number; closed_at: string | null }>('SELECT goal_min, closed_at FROM user_day WHERE user_id = ? AND focus_day = ?', [p.id, day]);
    if (row && row.closed_at !== null) return row.goal_min;
    if (p.dailyGoalNext !== null && p.dailyGoalNextFrom !== null && compareDays(p.dailyGoalNextFrom, day) <= 0) return p.dailyGoalNext;
    return p.dailyGoalMin;
  }

  day(db: Db, userId: string, day: FocusDay): DayContext {
    const p = this.profile(db, userId);
    const row = db.get<{ exam_day: number; closed_at: string | null }>('SELECT exam_day, closed_at FROM user_day WHERE user_id = ? AND focus_day = ?', [userId, day]);
    const vacation = this.isVacation(db, day);
    const inSeason = !vacation && inGoalSeason({ goal_bonus: this.params.goal_bonus, vacation_pause: { first_day: '0000-01-01', last_day: '0000-01-01' } }, day);
    const arms = p ? this.arms(db, userId, day) : { bonus: null, rest: 'continue' as const };
    const restExitFromDay = p?.restExitAt ? addDays(focusDayOf(Date.parse(p.restExitAt), this.params), 1) : null;
    const earnArm = p
      ? earnArmFor(this.params, day, {
          ageBand: p.ageBand,
          optedOut: p.optedOut,
          restArm: arms.rest,
          restPeriodEnabled: isFeatureEnabled(db, 'rest_period'),
          restExitFromDay,
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
  pool(p: UserProfile, day: FocusDay): Pool {
    if (p.cohort === 'expansion') return 'expansion';
    return compareDays(day, this.params.goal_bonus.season.last_day) > 0 ? 'research' : 'pilot';
  }
}
