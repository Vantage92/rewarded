// UserDayRepository: frozen interface between API modules (architecture §12.2), owner WP-4.
// `user_day` is written only through this repository; every recomputation bumps `rev` (§3.4, §5.1).
import { PARAMS_V1 } from '@rewarded/core/params';
import { isDay } from '@rewarded/core/time';
import type { FocusDay } from '@rewarded/core/time';
// Core-type files are re-exported from core/ledger/index.ts by WP-4; until then, import directly.
import type { UserDay } from '../../../../packages/core/src/ledger/types.ts';
import type { Tx } from './ledger.ts';

export type { UserDay };

/** Final minutes and goal of one day (open and rejected flags left out, architecture §6.1). */
export interface FinalMinutesDay {
  focusDay: FocusDay;
  verifiedMin: number;
  countedMinFinal: number;
  goalMetFinal: boolean;
  examDay: boolean;
  vacation: boolean;
}

export interface UserDayRepository {
  get(userId: string, day: FocusDay): UserDay | undefined;
  /** Rows for these users with `from ≤ focus_day ≤ to`, ordered by user, then day. */
  range(userIds: readonly string[], from: FocusDay, to: FocusDay): UserDay[];
  /** Raises `rev` by one for an existing row and returns the new revision. */
  bumpRev(tx: Tx, userId: string, day: FocusDay): number;
  /** Per-day final minutes for one user in `[from, to]`, ordered by day; days without a row are absent. */
  finalMinutes(userId: string, from: FocusDay, to: FocusDay): FinalMinutesDay[];
  /**
   * Inserts (rev must be 1) or replaces the row at its current revision (rev must equal the stored
   * rev; call bumpRev first for a new revision). Owned by WP-4 (sessions, points, day close).
   */
  put(tx: Tx, row: UserDay): void;
}

export class UserDayInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserDayInvariantError';
  }
}

/** Row-level invariants from architecture §3.2 and §3.4. */
export function assertValidUserDay(row: UserDay, dailyCapMin = PARAMS_V1.points.daily_cap_min): void {
  const fail = (m: string): never => {
    throw new UserDayInvariantError(`${row.userId}/${row.focusDay}: ${m}`);
  };
  if (!isDay(row.focusDay)) fail('focus_day is not YYYY-MM-DD');
  if (!Number.isInteger(row.rev) || row.rev < 1) fail('rev must be an integer ≥ 1');
  for (const k of ['verifiedMin', 'countedMin', 'countedMinFinal', 'goalMin'] as const) {
    if (!Number.isInteger(row[k]) || row[k] < 0) fail(`${k} must be a non-negative integer`);
  }
  if (row.countedMin > row.verifiedMin) fail('counted_min above verified_min');
  if (row.countedMin > dailyCapMin) fail(`counted_min above the daily cap of ${dailyCapMin}`);
  if (row.countedMinFinal > row.countedMin) fail('counted_min_final above counted_min');
  if (row.goalMetFinal && !row.goalMet) fail('goal_met_final without goal_met');
  if (row.goalBonusEligible && !row.goalMet) fail('goal_bonus_eligible without goal_met');
}

/** In-memory UserDayRepository enforcing unique (user, day), monotonic rev and the row invariants. */
export class FakeUserDayRepository implements UserDayRepository {
  private readonly rows = new Map<string, UserDay>();
  private readonly dailyCapMin: number;

  constructor(options: { dailyCapMin?: number } = {}) {
    this.dailyCapMin = options.dailyCapMin ?? PARAMS_V1.points.daily_cap_min;
  }

  private key(userId: string, day: FocusDay): string {
    return `${userId}\u0000${day}`;
  }

  get(userId: string, day: FocusDay): UserDay | undefined {
    return this.rows.get(this.key(userId, day));
  }

  range(userIds: readonly string[], from: FocusDay, to: FocusDay): UserDay[] {
    const wanted = new Set(userIds);
    return [...this.rows.values()]
      .filter((r) => wanted.has(r.userId) && r.focusDay >= from && r.focusDay <= to)
      .sort((a, b) => (a.userId === b.userId ? a.focusDay.localeCompare(b.focusDay) : a.userId.localeCompare(b.userId)));
  }

  bumpRev(_tx: Tx, userId: string, day: FocusDay): number {
    const row = this.get(userId, day);
    if (!row) throw new UserDayInvariantError(`${userId}/${day}: no user_day row to bump`);
    const next: UserDay = Object.freeze({ ...row, rev: row.rev + 1 });
    this.rows.set(this.key(userId, day), next);
    return next.rev;
  }

  finalMinutes(userId: string, from: FocusDay, to: FocusDay): FinalMinutesDay[] {
    return this.range([userId], from, to).map((r) => ({
      focusDay: r.focusDay,
      verifiedMin: r.verifiedMin,
      countedMinFinal: r.countedMinFinal,
      goalMetFinal: r.goalMetFinal,
      examDay: r.examDay,
      vacation: r.vacation,
    }));
  }

  put(_tx: Tx, row: UserDay): void {
    assertValidUserDay(row, this.dailyCapMin);
    const current = this.get(row.userId, row.focusDay);
    if (!current && row.rev !== 1) throw new UserDayInvariantError(`${row.userId}/${row.focusDay}: a new row starts at rev 1`);
    if (current && row.rev !== current.rev) {
      throw new UserDayInvariantError(`${row.userId}/${row.focusDay}: rev ${row.rev} does not match stored rev ${current.rev}`);
    }
    this.rows.set(this.key(row.userId, row.focusDay), Object.freeze({ ...row }));
  }
}
