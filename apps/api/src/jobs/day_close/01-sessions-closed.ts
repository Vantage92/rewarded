// Day close step 1 (architecture §6.1). Owner WP-4.
// No session of focus day D may still be active: the sweep closes every session whose planned end
// plus end_grace_min has passed; if one of D is still open the step fails and the run restarts here.
import { installWp4Services } from '../../modules/points/services.ts';
import { hasWp4Tables } from '../../modules/points/tables.ts';
import type { DayCloseStep } from '../scheduler.ts';

export const step: DayCloseStep = {
  no: 1,
  name: 'sessions-closed',
  owner: 'WP-4',
  run({ day, deps }) {
    if (!hasWp4Tables(deps.db)) return;
    const engine = installWp4Services(deps);
    engine.sweep();
    const open = deps.db.get<{ n: number }>("SELECT COUNT(*) AS n FROM focus_session WHERE status = 'active' AND focus_day <= ?", [day])?.n ?? 0;
    if (open > 0) throw Object.assign(new Error(`${open} session(s) of ${day} still active`), { code: 'SESSIONS_STILL_ACTIVE' });
  },
};
