// Day close step 6 (architecture §6.1; spec §4.12). Owner WP-5.
// Belofte day results, the end of a Belofte with the renewal offer in the early arm, and the offer
// rows per arm and calendar (visible from due_day). Skipped in the vacation pause: Belofte days do
// not count there (spec §4.12 Looptijd).
import { closeBelofteDay } from '../../modules/belofte/logic.ts';
import { hasSessionTables, hasSocialTables } from '../../modules/squads/lib/social.ts';
import type { DayCloseStep } from '../scheduler.ts';

export const step: DayCloseStep = {
  no: 6,
  name: 'belofte',
  owner: 'WP-5',
  run({ day, deps, vacation }) {
    if (vacation || !hasSocialTables(deps.db) || !hasSessionTables(deps.db)) return;
    deps.db.transaction(() => closeBelofteDay(deps.db, deps, day));
  },
};
