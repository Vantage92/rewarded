// Day close step 4 (architecture §6.1; spec §4.4). Owner WP-5.
// Automatic pauses after 7 days without a completed session; squads with 7 days < 2 active members
// get low_activity_since_day and, only inside an exam period of their calendar, the regroup offer;
// archive after 14 days without active members. Skipped in the vacation pause (spec §4.4, §4.11).
import { closeSquadActivity } from '../../modules/squads/lib/dayclose.ts';
import { hasSessionTables, hasSocialTables } from '../../modules/squads/lib/social.ts';
import type { DayCloseStep } from '../scheduler.ts';

export const step: DayCloseStep = {
  no: 4,
  name: 'squad-activity',
  owner: 'WP-5',
  run({ day, deps, vacation }) {
    if (vacation || !hasSocialTables(deps.db) || !hasSessionTables(deps.db)) return;
    closeSquadActivity(deps.db, deps, day);
  },
};
