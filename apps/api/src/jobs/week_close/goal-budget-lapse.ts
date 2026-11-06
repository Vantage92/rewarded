// Week close step: the rest of the arm B weekly budget lapses (spec §5 arm B, architecture §5.1).
// Safety net after the day closes of the week: whatever is still in pending_goal_budget, beyond the
// days that wait for a flag decision (`postponed`), lapses as goal_budget_lapse with reason week_end.
import { CURRENT_PARAMS, addDays, focusDayOf, weekKey } from '@rewarded/core';
import type { SqlLedgerService } from '../../modules/points/ledger.ts';
import { installWp4Services } from '../../modules/points/services.ts';
import { hasWp4Tables } from '../../modules/points/tables.ts';
import type { WeekCloseStep, WeekCloseStepContext } from './coverage-alarm.ts';

const P = CURRENT_PARAMS;

export function lapseWeekBudgets(ctx: WeekCloseStepContext): number {
  const { db } = ctx.deps;
  if (!hasWp4Tables(db)) return 0;
  installWp4Services(ctx.deps);
  const monday = ctx.week ?? weekKey(focusDayOf(ctx.now.getTime(), P), P.time.week_start_iso_weekday);
  const closedWeek = addDays(monday, -7);
  const ledger = ctx.deps.services.ledger as Partial<SqlLedgerService>;
  if (!ledger.lapseWeekRest) return 0;
  const users = db.all<{ user_id: string }>(
    `SELECT DISTINCT o.user_id FROM ledger_account_owner o JOIN posting p ON p.account_id = o.account_id WHERE o.kind = 'pending_goal_budget' AND o.user_id IS NOT NULL`,
  );
  let n = 0;
  for (const u of users) {
    db.transaction(() => {
      if (ledger.lapseWeekRest?.(db, u.user_id, closedWeek)) n += 1;
    });
  }
  return n;
}

export const step: WeekCloseStep = {
  name: 'goal_budget_lapse',
  owner: 'REPARATIE',
  run: (ctx) => {
    lapseWeekBudgets(ctx);
  },
};
