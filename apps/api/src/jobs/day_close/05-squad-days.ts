// Day close step 5 (architecture §6.1, §6.3; spec §4.4, §4.5). Owner WP-5.
// squad_day with the streak, the joker, the freeze below 3 active members and the recovery to the
// old length; then the duels whose last day is closed. In the vacation pause the squad day is
// recorded as `vacation` and changes nothing (spec §4.4 Vakantiepauze).
import { finishDuels, expireOpenDuels } from '../../modules/duels/logic.ts';
import { closeSquadDays } from '../../modules/squads/lib/dayclose.ts';
import { hasSessionTables, hasSocialTables } from '../../modules/squads/lib/social.ts';
import type { DayCloseStep } from '../scheduler.ts';

export const step: DayCloseStep = {
  no: 5,
  name: 'squad-days',
  owner: 'WP-5',
  run({ day, deps }) {
    if (!hasSocialTables(deps.db) || !hasSessionTables(deps.db)) return;
    closeSquadDays(deps.db, deps, day);
    deps.db.transaction(() => {
      expireOpenDuels(deps.db, deps);
      finishDuels(deps.db, deps, day);
    });
  },
};
