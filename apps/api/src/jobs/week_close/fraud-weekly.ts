// Week close steps of WP-6 (architecture §6.1, §6.5): H9 and H12 over the past week, the weekly
// sample of 30 accounts, and the harm evaluation (signals per code and arm, stop-rule count, guard
// rule of the rest arm, absolute harm threshold). Owner WP-6.
import { CURRENT_PARAMS, addDays, focusDayOf, weekKey } from '@rewarded/core';
import { runWeekBatch } from '../../modules/fraud/lib/batch.ts';
import { evaluateHarmWeek } from '../../modules/fraud/lib/harmweek.ts';
import { drawWeeklySample } from '../../modules/fraud/lib/sample.ts';
import type { WeekCloseStep, WeekCloseStepContext } from './coverage-alarm.ts';

/** Monday of the week that just ended. */
export function pastWeek(ctx: WeekCloseStepContext): string {
  const monday = ctx.week ?? weekKey(focusDayOf(ctx.now.getTime(), CURRENT_PARAMS), CURRENT_PARAMS.time.week_start_iso_weekday);
  return addDays(monday, -7);
}

export const step: WeekCloseStep = {
  name: 'fraud-weekly',
  owner: 'WP-6',
  run(ctx) {
    const week = pastWeek(ctx);
    runWeekBatch(ctx.deps, week, ctx.now);
    drawWeeklySample(ctx.deps, week);
    evaluateHarmWeek(ctx.deps, week);
  },
};
