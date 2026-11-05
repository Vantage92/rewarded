// Reminder job (architecture §6.3, §12.3: owner WP-5). Daily at params.time.reminder_at (19:30
// Europe/Amsterdam); one run per focus day (job_run), one mail per user per day (reminder_log).
import { CURRENT_PARAMS, focusDayOf, parseLocalTime, toLocalParts } from '@rewarded/core';
import { sendReminders } from '../modules/reminders/logic.ts';
import { hasSocialTables } from '../modules/squads/lib/social.ts';
import type { Job } from './scheduler.ts';

function keyOf(now: Date): string {
  return `reminders:${focusDayOf(now.getTime(), CURRENT_PARAMS)}`;
}

export const job: Job = {
  name: 'reminders',
  schedule: `daily ${CURRENT_PARAMS.time.reminder_at} Europe/Amsterdam`,
  dueKey(now) {
    const p = toLocalParts(now.getTime());
    const minutes = p.hour * 60 + p.minute;
    // Between the reminder time and midnight; after midnight the focus day is still the same but too late.
    return minutes >= parseLocalTime(CURRENT_PARAMS.time.reminder_at) ? keyOf(now) : null;
  },
  defaultKey: keyOf,
  async run(ctx) {
    if (!ctx.deps || !hasSocialTables(ctx.deps.db)) return;
    const deps = ctx.deps;
    const day = ctx.runKey.replace(/^reminders:/, '');
    await ctx.step('send', () => sendReminders(deps, day));
  },
};
