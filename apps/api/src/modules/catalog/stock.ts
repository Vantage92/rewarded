// Voucher stock, pools and budget coverage (architecture §3.3, §5.2, §5.3). Shared by the catalog,
// redemption and job code of WP-4. Week keys in the database are the Monday date of the focus week
// (core `weekKey`); the contracts use ISO week keys (`isoWeekKey` converts).
import { CURRENT_PARAMS, addDays, compareDays } from '@rewarded/core';
import { coverableCents } from '@rewarded/core/catalog';
import type { FocusDay } from '@rewarded/core/time';
import type { Db } from '../../db/types.ts';

export type Pool = 'pilot' | 'research' | 'expansion';
const P = CURRENT_PARAMS;

export interface BudgetRow {
  id: string;
  partner_id: string;
  kind: 'direct_reward' | 'revenue' | 'own_budget';
  pool: Pool;
  booked_cents: number;
  reward_pct: number;
  document_ref: string;
  booked_at: string;
  status: 'booked' | 'cancelled';
  cancelled_cents: number;
}

export function allocatedCents(db: Db, budgetId: string): number {
  return Number(db.get<{ total: number }>('SELECT COALESCE(SUM(amount_cents), 0) AS total FROM budget_allocation WHERE budget_id = ?', [budgetId])?.total ?? 0);
}

export function budgetLine(b: BudgetRow): { bookedCents: number; cancelledCents: number; rewardPct: number } {
  return { bookedCents: b.booked_cents, cancelledCents: b.cancelled_cents, rewardPct: b.reward_pct };
}

/** Free budget = coverable − Σ allocations (architecture §5.3); never negative by construction. */
export function freeBudgetCents(db: Db, b: BudgetRow): number {
  return coverableCents(budgetLine(b)) - allocatedCents(db, b.id);
}

/**
 * Releases the vouchers whose release day has come (architecture §5.3: the daily job at 04:00 sets
 * `unreleased` → `available`). Idempotent; the catalog and the redemption call it too, so the stock
 * never depends on when the job ran.
 */
export function releaseDue(db: Db, today: FocusDay): number {
  return db.run(
    "UPDATE reward_voucher SET status = 'available' WHERE status = 'unreleased' AND redemption_id IS NULL AND release_day IS NOT NULL AND release_day <= ?",
    [today],
  ).changes;
}

/** Voucher pool of a user on a focus day: experiment until the bonus stop, then research; expansion. */
export function poolOf(cohort: 'experiment' | 'expansion', day: FocusDay): Pool {
  if (cohort === 'expansion') return 'expansion';
  return compareDays(day, P.goal_bonus.season.last_day) > 0 ? 'research' : 'pilot';
}

/** SQL condition on `user u` for the users of a pool on `day` (same rule as poolOf). */
function poolCondition(pool: Pool, day: FocusDay): { sql: string; params: string[] } {
  if (pool === 'expansion') return { sql: "u.cohort = 'expansion'", params: [] };
  const after = compareDays(day, P.goal_bonus.season.last_day) > 0;
  if ((pool === 'research') !== after) return { sql: '0', params: [] };
  return { sql: "u.cohort = 'experiment'", params: [] };
}

/**
 * Users who may redeem in a pool (architecture §5.3 `eligible_users`): active, not a team account,
 * past the earn-in period and past the first-redemption hold at `nowIso`.
 */
export function eligibleUsers(db: Db, pool: Pool, day: FocusDay, nowIso: string): number {
  const c = poolCondition(pool, day);
  return Number(
    db.get<{ n: number }>(
      `SELECT COUNT(*) AS n FROM user u WHERE u.status = 'active' AND u.is_team = 0 AND u.earn_in_reached_at IS NOT NULL
         AND u.first_redeem_after IS NOT NULL AND u.first_redeem_after <= ? AND ${c.sql}`,
      [nowIso, ...c.params],
    )?.n ?? 0,
  );
}

/** Vouchers scheduled for release in a week (Monday date), per pool. */
export function releasedInWeek(db: Db, pool: Pool, monday: FocusDay): number {
  return Number(
    db.get<{ n: number }>("SELECT COUNT(*) AS n FROM reward_voucher v JOIN reward r ON r.id = v.reward_id WHERE r.status = 'published' AND v.pool = ? AND v.release_week = ?", [pool, monday])?.n ?? 0,
  );
}

/** Vouchers that a user can take today (status available, released, matching pool and anchor). */
export function stockToday(db: Db, rewardId: string, pool: Pool, today: FocusDay, anchored: boolean): number {
  return Number(
    db.get<{ n: number }>(
      `SELECT COUNT(*) AS n FROM reward_voucher WHERE reward_id = ? AND pool = ? AND status = 'available' AND redemption_id IS NULL
         AND release_day <= ? AND (anchor_only = 0 OR ? = 1)`,
      [rewardId, pool, today, anchored ? 1 : 0],
    )?.n ?? 0,
  );
}

/** First future release day of a reward in a pool, or null. */
export function nextReleaseDay(db: Db, rewardId: string, pool: Pool, today: FocusDay): FocusDay | null {
  return (
    db.get<{ d: string | null }>("SELECT MIN(release_day) AS d FROM reward_voucher WHERE reward_id = ? AND pool = ? AND status = 'unreleased' AND release_day > ?", [rewardId, pool, today])?.d ?? null
  );
}

/** Weekday dates Monday..Sunday of a week. */
export function weekDays(monday: FocusDay): FocusDay[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}
