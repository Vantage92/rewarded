// Frozen service interfaces between API modules, plus fakes (architecture §12.2).
// Implementations live in the owning module and are put into `Services` at start-up; every module
// gets the object in `register`. A module never imports another module directly.
//
// WP-4 owns LedgerService, UserDayRepository and SessionRepository (services/{ledger,userDay,sessions}.ts).
// Without editing this file it adds them by module augmentation in its own file:
//   declare module './index.ts' { interface Services { ledger: LedgerService } }
// and passes the implementation (or its fake) to createServices({ ledger }).
import type { Db } from '../db/types.ts';
import { FakeAuditWriter, type AuditWriter } from './audit.ts';
import { FakeEventWriter, type EventWriter } from './events.ts';
import { FakeExperimentService, type ExperimentService } from './experiments.ts';
import { FakeFlagService, type FlagService } from './flags.ts';
import { FakePrizeService, type PrizeService } from './prizes.ts';
import { FakePrivacyService, type PrivacyService } from './privacy.ts';

/** A transaction handle: the Db inside `db.transaction(...)` (synchronous SQLite, architecture §2.1). */
export type Tx = Db;

export interface Services {
  audit: AuditWriter;
  events: EventWriter;
  experiments: ExperimentService;
  flags: FlagService;
  prizes: PrizeService;
  privacy: PrivacyService;
}

/** The services defined in this folder; Services may be augmented with more. */
export type BaseServices = Pick<Services, 'audit' | 'events' | 'experiments' | 'flags' | 'prizes' | 'privacy'>;

/** In-memory fakes for every base service (tests, dev until the owners deliver). */
export function createFakeServices(): BaseServices {
  return {
    audit: new FakeAuditWriter(),
    events: new FakeEventWriter(),
    experiments: new FakeExperimentService(),
    flags: new FakeFlagService(),
    prizes: new FakePrizeService(),
    privacy: new FakePrivacyService(),
  };
}

/**
 * Services object for the app. Owners pass their real implementations as overrides; whatever is not
 * passed falls back to the fake. Augmented members must be passed by their owner.
 */
export function createServices(overrides: Partial<Services> = {}): Services {
  return { ...createFakeServices(), ...overrides } as Services;
}

export * from './audit.ts';
export * from './events.ts';
export * from './experiments.ts';
export * from './flags.ts';
export * from './prizes.ts';
export * from './privacy.ts';
