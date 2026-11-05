// SQL implementations of the WP-3 services (architecture §12.2): AuditWriter, EventWriter and
// ExperimentService. createServices({ ...createSqlServices(db, platform, opts) }) wires them in.
import type { Platform } from '../../platform/types.ts';
import type { BaseServices } from '../../services/index.ts';
import { idsFor } from '../ids.ts';
import type { Db } from '../types.ts';
import { SqlAuditWriter } from './audit.ts';
import { SqlEventWriter } from './events.ts';
import { SqlExperimentService } from './experiments.ts';

export { SqlAuditWriter, adminActor, auditRef } from './audit.ts';
export { SqlEventWriter } from './events.ts';
export { SqlExperimentService, armAt, stratumFor } from './experiments.ts';

export interface SqlServicesOptions {
  /** Experiment seed (voorregistratie §9.2). */
  seed: string;
  seedVersion: string;
  release: string;
}

export type Wp3Services = Pick<BaseServices, 'audit' | 'events' | 'experiments'> & {
  audit: SqlAuditWriter;
  events: SqlEventWriter;
  experiments: SqlExperimentService;
};

export function createSqlServices(db: Db, platform: Pick<Platform, 'clock' | 'random'>, opts: SqlServicesOptions): Wp3Services {
  const ids = idsFor(platform);
  const experiments = new SqlExperimentService({ db, clock: platform.clock, ids, seed: opts.seed, seedVersion: opts.seedVersion });
  const events = new SqlEventWriter({ clock: platform.clock, ids, experiments, release: opts.release });
  experiments.bindEvents(events);
  return { audit: new SqlAuditWriter({ clock: platform.clock, ids }), events, experiments };
}
