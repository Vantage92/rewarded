// Day close step 3 (architecture §6.1; spec §4.10). Owner WP-3.
// The age band switches on `turns_18_on`: the close of D runs at 05:45 on D + 1, so everybody who
// turns 18 on or before D + 1 becomes 18_plus. Idempotent: a second run finds nobody left.
// The personal arm exceptions of a former minor stay as logged at registration (arm_switch `minor`).
import { addDays } from '@rewarded/core';
import type { DayCloseStep } from '../scheduler.ts';

export const step: DayCloseStep = {
  no: 3,
  name: 'age-bands',
  owner: 'WP-3',
  run({ day, deps }) {
    const until = addDays(day, 1);
    deps.db.transaction(() => {
      deps.db.run("UPDATE user SET age_band = '18_plus', turns_18_on = NULL WHERE age_band = '16_17' AND turns_18_on IS NOT NULL AND turns_18_on <= ?", [until]);
    });
  },
};
