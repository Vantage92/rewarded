// Week opening and daily release (architecture §5.3, §6.1). Owner WP-4.
// Runs once per focus day at 04:00 Europe/Amsterdam (run key week_open:<day>):
// - every day: the vouchers of that release day go from `unreleased` to `available` (spread release);
// - on the first day of the week: goal_budget_grant for every user in arm B (Monday 04:00, 140
//   pending, or 20 × remaining bonus days at a mid-week entry; spec §5).
// The daily release lives here because the architecture names week_open as the "grant, vrijgave" job
// and a job file has one owner; both parts are idempotent (status update and journal keys).
import { CURRENT_PARAMS, focusDayOf, isDay, isoWeekday, type FocusDay } from '@rewarded/core';
import { releaseDue } from '../modules/catalog/stock.ts';
import type { SqlLedgerService } from '../modules/points/ledger.ts';
import { installWp4Services } from '../modules/points/services.ts';
import { hasWp4Tables } from '../modules/points/tables.ts';
import type { ModuleDeps } from '../module.ts';
import type { Job } from './scheduler.ts';

const P = CURRENT_PARAMS;

export function weekOpenKey(day: FocusDay): string {
  return `week_open:${day}`;
}

/** Releases today's vouchers and, on the week start, books the arm B weekly budgets. */
export function runWeekOpen(deps: ModuleDeps, day: FocusDay): { released: number; grants: number } {
  if (!hasWp4Tables(deps.db)) return { released: 0, grants: 0 };
  installWp4Services(deps);
  const { db, services } = deps;
  const released = db.transaction(() => releaseDue(db, day));
  let grants = 0;
  if (isoWeekday(day) === P.time.week_start_iso_weekday) {
    const users = db.all<{ id: string }>("SELECT id FROM user WHERE status = 'active' ORDER BY id");
    const ledger = services.ledger as Partial<SqlLedgerService>;
    for (const u of users) {
      db.transaction(() => {
        if (services.pointsContext.day(db, u.id, day).arm !== 'B') return;
        if (ledger.ensureWeekGrant?.(db, u.id, day)) grants += 1;
      });
    }
  }
  return { released, grants };
}

export const job: Job = {
  name: 'week_open',
  schedule: 'daily 04:00 Europe/Amsterdam (release; grant on Monday)',
  dueKey: (now) => weekOpenKey(focusDayOf(now.getTime(), P)),
  defaultKey: (now) => weekOpenKey(focusDayOf(now.getTime(), P)),
  async run(ctx) {
    if (!ctx.deps) throw new Error('week_open needs module deps');
    const deps = ctx.deps;
    const day = ctx.runKey.replace(/^week_open:/, '');
    if (!isDay(day)) throw new Error(`Invalid week_open run key ${ctx.runKey}`);
    await ctx.step('release-and-grant', () => runWeekOpen(deps, day));
  },
};
