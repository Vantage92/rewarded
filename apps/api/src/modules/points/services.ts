// WP-4 services on the shared Services object (architecture §12.2). Module augmentation adds the
// members without editing services/index.ts; installWp4Services puts the SQL implementations in
// unless the caller already passed one (a fake in another package's tests, for instance).
import type { LedgerService } from '../../services/ledger.ts';
import type { SessionRepository } from '../../services/sessions.ts';
import type { UserDayRepository } from '../../services/userDay.ts';
import type { ModuleDeps } from '../../module.ts';
import { PointsContext } from './context.ts';
import { SqlLedgerService } from './ledger.ts';
import { SqlUserDayRepository } from './userDay.ts';

declare module '../../services/index.ts' {
  interface Services {
    ledger: LedgerService;
    /** UserDayRepository; `userDay` is the same object (both names appear in the WP-1/WP-2 notes). */
    userDays: UserDayRepository;
    userDay: UserDayRepository;
    sessions: SessionRepository;
    /** WP-4 day context (arms, season, goal, earnArm); replaceable in tests. */
    pointsContext: PointsContext;
  }
}

/** Installs ledger, user-day repository and day context once per Services object. */
export function installPointsServices(deps: ModuleDeps): void {
  const s = deps.services as Partial<ModuleDeps['services']>;
  s.pointsContext ??= new PointsContext(deps);
  s.userDays ??= s.userDay ?? new SqlUserDayRepository(deps.db);
  s.userDay ??= s.userDays;
  s.ledger ??= new SqlLedgerService(deps);
}
