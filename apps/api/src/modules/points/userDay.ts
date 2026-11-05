// SQL UserDayRepository (architecture §3.4, §12.2): one row per user and focus day, rev bumps per decision.
import type { FocusDay } from '@rewarded/core/time';
import type { Db } from '../../db/types.ts';
import type { Tx } from '../../services/ledger.ts';
import { assertValidUserDay, UserDayInvariantError, type FinalMinutesDay, type UserDay, type UserDayRepository } from '../../services/userDay.ts';

interface Row {
  user_id: string;
  focus_day: string;
  rev: number;
  verified_min: number;
  counted_min: number;
  counted_min_final: number;
  goal_min: number;
  goal_met: number;
  goal_met_final: number;
  goal_bonus_eligible: number;
  exam_day: number;
  goal_state: UserDay['goalState'];
  joker_used: number;
  vacation: number;
  closed_at: string | null;
}

function toUserDay(r: Row): UserDay {
  return {
    userId: r.user_id,
    focusDay: r.focus_day,
    rev: r.rev,
    verifiedMin: r.verified_min,
    countedMin: r.counted_min,
    countedMinFinal: r.counted_min_final,
    goalMin: r.goal_min,
    goalMet: r.goal_met === 1,
    goalMetFinal: r.goal_met_final === 1,
    goalBonusEligible: r.goal_bonus_eligible === 1,
    examDay: r.exam_day === 1,
    goalState: r.goal_state,
    jokerUsed: r.joker_used === 1,
    vacation: r.vacation === 1,
    closedAt: r.closed_at === null ? null : Date.parse(r.closed_at),
  };
}

const b = (v: boolean) => (v ? 1 : 0);

export class SqlUserDayRepository implements UserDayRepository {
  private readonly db: Db;
  constructor(db: Db) {
    this.db = db;
  }

  get(userId: string, day: FocusDay): UserDay | undefined {
    const r = this.db.get<Row>('SELECT * FROM user_day WHERE user_id = ? AND focus_day = ?', [userId, day]);
    return r ? toUserDay(r) : undefined;
  }

  range(userIds: readonly string[], from: FocusDay, to: FocusDay): UserDay[] {
    if (userIds.length === 0) return [];
    const marks = userIds.map(() => '?').join(',');
    return this.db
      .all<Row>(`SELECT * FROM user_day WHERE user_id IN (${marks}) AND focus_day >= ? AND focus_day <= ? ORDER BY user_id, focus_day`, [...userIds, from, to])
      .map(toUserDay);
  }

  bumpRev(tx: Tx, userId: string, day: FocusDay): number {
    const r = tx.run('UPDATE user_day SET rev = rev + 1 WHERE user_id = ? AND focus_day = ?', [userId, day]);
    if (r.changes === 0) throw new UserDayInvariantError(`${userId}/${day}: no user_day row to bump`);
    return (tx.get<{ rev: number }>('SELECT rev FROM user_day WHERE user_id = ? AND focus_day = ?', [userId, day]) as { rev: number }).rev;
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

  put(tx: Tx, row: UserDay): void {
    assertValidUserDay(row);
    const current = tx.get<{ rev: number }>('SELECT rev FROM user_day WHERE user_id = ? AND focus_day = ?', [row.userId, row.focusDay]);
    if (!current && row.rev !== 1) throw new UserDayInvariantError(`${row.userId}/${row.focusDay}: a new row starts at rev 1`);
    if (current && current.rev !== row.rev) throw new UserDayInvariantError(`${row.userId}/${row.focusDay}: rev ${row.rev} does not match stored rev ${current.rev}`);
    const values = [
      row.userId, row.focusDay, row.rev, row.verifiedMin, row.countedMin, row.countedMinFinal, row.goalMin, b(row.goalMet), b(row.goalMetFinal),
      b(row.goalBonusEligible), b(row.examDay), row.goalState, b(row.jokerUsed), b(row.vacation), row.closedAt === null ? null : new Date(row.closedAt).toISOString(),
    ];
    tx.run(
      `INSERT INTO user_day (user_id, focus_day, rev, verified_min, counted_min, counted_min_final, goal_min, goal_met, goal_met_final,
         goal_bonus_eligible, exam_day, goal_state, joker_used, vacation, closed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id, focus_day) DO UPDATE SET rev = excluded.rev, verified_min = excluded.verified_min, counted_min = excluded.counted_min,
         counted_min_final = excluded.counted_min_final, goal_min = excluded.goal_min, goal_met = excluded.goal_met, goal_met_final = excluded.goal_met_final,
         goal_bonus_eligible = excluded.goal_bonus_eligible, exam_day = excluded.exam_day, goal_state = excluded.goal_state, joker_used = excluded.joker_used,
         vacation = excluded.vacation, closed_at = excluded.closed_at`,
      values,
    );
  }
}
