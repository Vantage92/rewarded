// Day close step 2 (architecture §5.1, §6.1). Owner WP-4.
// reconcileDay(cause = day_close) for every user registered by the end of D: verified and counted
// minutes, goal, exam day, the safety net for the goal bonus, the arm B lapse of a missed goal, and
// earn_in_reached_at / first_redeem_after. Idempotent per user: journal keys and user_day.closed_at.
// In the vacation pause the context gives no season, so no goal postings are made (spec §4.4, §4.11).
import { focusDayEnd } from '@rewarded/core';
import { installWp4Services } from '../../modules/points/services.ts';
import { hasWp4Tables } from '../../modules/points/tables.ts';
import type { DayCloseStep } from '../scheduler.ts';

export const step: DayCloseStep = {
  no: 2,
  name: 'reconcile-days',
  owner: 'WP-4',
  run({ day, deps, params }) {
    if (!hasWp4Tables(deps.db)) return;
    installWp4Services(deps);
    const { db, services } = deps;
    const until = new Date(focusDayEnd(day, params)).toISOString();
    const users = db.all<{ id: string; pseudonym: string }>("SELECT id, pseudonym FROM user WHERE status = 'active' AND created_at < ? ORDER BY id", [until]);
    for (const u of users) {
      db.transaction(() => {
        const before = services.userDays.get(u.id, day);
        services.ledger.reconcileDay(db, u.id, day, { type: 'day_close' });
        if (before?.closedAt != null) return; // events only at the first close of the day
        const after = services.userDays.get(u.id, day);
        if (!after || after.vacation) return;
        const props = { datum: day, minuten: after.verifiedMin, joker_gebruikt: after.jokerUsed };
        if (after.goalMet) services.events.event(db, 'daily_goal_met', props, { pseudonym: u.pseudonym });
        else if (!after.examDay) services.events.event(db, 'daily_goal_missed', props, { pseudonym: u.pseudonym });
      });
    }
  },
};
