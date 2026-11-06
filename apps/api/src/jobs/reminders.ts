// Reminder job (architecture §6.3, §12.3; repair wave). Every quarter hour: the mails of the users
// whose chosen time (P5) has passed today; one run per quarter hour (job_run), one mail per user per
// focus day (reminder_log).
import { CURRENT_PARAMS, focusDayOf, toLocalParts } from '@rewarded/core';
import { sendReminders } from '../modules/reminders/logic.ts';
import { hasSocialTables } from '../modules/squads/lib/social.ts';
import type { Job } from './scheduler.ts';

function keyOf(now: Date): string {
  const p = toLocalParts(now.getTime());
  const q = Math.floor(p.minute / 15) * 15;
  return `reminders:${focusDayOf(now.getTime(), CURRENT_PARAMS)}T${String(p.hour).padStart(2, '0')}:${String(q).padStart(2, '0')}`;
}

export const job: Job = {
  name: 'reminders',
  schedule: 'every quarter hour (chosen time per user, Europe/Amsterdam)',
  dueKey: keyOf,
  defaultKey: keyOf,
  async run(ctx) {
    if (!ctx.deps || !hasSocialTables(ctx.deps.db)) return;
    const deps = ctx.deps;
    const day = ctx.runKey.replace(/^reminders:/, '').slice(0, 10);
    await ctx.step('send', () => sendReminders(deps, day, ctx.now));
  },
};
