// WP-4 services on the shared Services object (architecture §12.2). Module augmentation adds the
// members without editing services/index.ts; installWp4Services puts the SQL implementations in
// unless the caller already passed one (a fake in another package's tests, for instance). Every
// WP-4 module calls it in `register`, so the order of the modules does not matter.
import type { LedgerService } from '../../services/ledger.ts';
import type { SessionRepository } from '../../services/sessions.ts';
import type { UserDayRepository } from '../../services/userDay.ts';
import type { ModuleDeps } from '../../module.ts';
import { SessionEngine } from '../sessions/engine.ts';
import { SqlSessionRepository } from '../sessions/repository.ts';
import { PointsContext } from './context.ts';
import { registerWp4Privacy } from './privacy.ts';
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

const ENGINE = Symbol.for('rewarded.wp4.sessionEngine');
type Holder = { [ENGINE]?: SessionEngine };

/** Installs ledger, user-day repository, day context and the session repository once per Services object. */
export function installWp4Services(deps: ModuleDeps): SessionEngine {
  const s = deps.services as Partial<ModuleDeps['services']> & Holder;
  s.pointsContext ??= new PointsContext(deps);
  s.userDays ??= s.userDay ?? new SqlUserDayRepository(deps.db);
  s.userDay ??= s.userDays;
  s.ledger ??= new SqlLedgerService(deps);
  if (!s[ENGINE]) {
    const engine = new SessionEngine(deps);
    s[ENGINE] = engine;
    s.sessions ??= new SqlSessionRepository(deps.db, (tx, id, reason, actor) => engine.restore(tx, id, reason, actor));
    registerWp4Privacy(deps);
  }
  return s[ENGINE];
}

/** Kept for callers of the first WP-4 drafts. */
export const installPointsServices = (deps: ModuleDeps): void => {
  installWp4Services(deps);
};
