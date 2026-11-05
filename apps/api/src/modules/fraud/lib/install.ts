// WP-6 services on the shared Services object (architecture §12.2). createServices() starts with the
// fakes; installWp6Services swaps in the SQL FlagService and PrizeService when the fake is still the
// plain default (a test that passes its own fake or subclass keeps it), and registers the WP-6
// erasers and exporters once. The PrivacyService registry itself is kept: other modules already
// registered their erasers in it. Every WP-6 module and job calls this, so order does not matter.
import type { FraudRules } from '@rewarded/core/fraud';
import { FakeFlagService } from '../../../services/flags.ts';
import { FakePrizeService } from '../../../services/prizes.ts';
import type { ModuleDeps } from '../../../module.ts';
import { SqlFlagService } from './flags.ts';
import { SqlPrizeService } from './prizes.ts';
import { registerWp6Privacy } from './privacy.ts';
import { idsOf } from './util.ts';

declare module '../../../services/index.ts' {
  interface Services {
    /** Thresholds for the heuristics; tests and the red-team day put other values here. */
    fraudRules?: FraudRules;
    /** Seed for the samples (voorregistratie §9.2); see sampleSeedOf. */
    sampleSeed?: { seed: string; version: string };
  }
}

const INSTALLED = Symbol.for('rewarded.wp6.installed');
type Holder = { [INSTALLED]?: true };

export function installWp6Services(deps: ModuleDeps): void {
  const s = deps.services as ModuleDeps['services'] & Holder;
  if (s[INSTALLED]) return;
  s[INSTALLED] = true;
  const ids = idsOf(deps);
  if (s.flags.constructor === FakeFlagService) s.flags = new SqlFlagService({ db: deps.db, ids, clock: deps.platform.clock });
  if (s.prizes.constructor === FakePrizeService) s.prizes = new SqlPrizeService(deps);
  registerWp6Privacy(deps);
}

export { sampleSeedOf } from './seed.ts';
