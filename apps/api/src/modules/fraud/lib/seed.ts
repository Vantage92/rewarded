// Seed of the samples (voorregistratie §7.1, §9.2).
import type { ModuleDeps } from '../../../module.ts';

/**
 * Seed of the samples: the experiment seed (voorregistratie §7.1 "met de randomisatieseed"). WP-3
 * keeps it private in SqlExperimentService; until it exposes it, it is read structurally from there.
 * Without it the seed is derived from the audit pepper (outside the database, §10.9), version `derived`.
 */
export function sampleSeedOf(deps: ModuleDeps): { seed: string; version: string } {
  if (deps.services.sampleSeed) return deps.services.sampleSeed;
  const exp = deps.services.experiments as unknown as { seed?: unknown; seedVersion?: unknown };
  if (typeof exp.seed === 'string' && exp.seed.length > 0) return { seed: exp.seed, version: typeof exp.seedVersion === 'string' ? exp.seedVersion : 'experiment' };
  return { seed: deps.platform.hasher.hash('audit', 'rewarded-sample-seed'), version: 'derived' };
}
