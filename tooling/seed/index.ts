// Seeds for dev and e2e (architecture §11 "Seeddata"): `demo` and `empty`. The dev route
// POST /dev/reset {"seed":"demo"} imports this file and calls seedDemo(deps); `pnpm seed:demo`
// runs the same code against .data/rewarded.sqlite. Both are deterministic (fixed clock, fixed
// PRNG seed) and idempotent (the database is emptied first).
import { createApp } from '../../apps/api/src/app.ts';
import type { Db } from '../../apps/api/src/db/types.ts';
import { createSqlServices } from '../../apps/api/src/db/services/index.ts';
import { createScheduler, loadJobs, type Scheduler } from '../../apps/api/src/jobs/scheduler.ts';
import type { ModuleDeps } from '../../apps/api/src/module.ts';
import { modules } from '../../apps/api/src/modules.gen.ts';
import { DEV_EXPERIMENT_SEED, DEV_TOTP_KEY, DevClock, DevInbox, DevMailer, DevSmsSender } from '../../apps/api/src/platform/dev.ts';
import type { Logger } from '../../apps/api/src/platform/log.ts';
import { DevNetClassifier } from '../../apps/api/src/platform/net.ts';
import type { Hasher, Platform } from '../../apps/api/src/platform/types.ts';
import { createServices } from '../../apps/api/src/services/index.ts';
import { DEMO_ADMINS, adminSecretBase32, seedAdmins } from './admins.ts';
import { DEMO_NOW, DEMO_SEED, runDemo, type DemoReport } from './demo.ts';
import { Actor, type InboxMessage, type Transport } from './driver.ts';
import type { World } from './flows.ts';
import { Prng } from './prng.ts';

export { DEMO_ADMINS, adminSecretBase32, adminTotp } from './admins.ts';
export { DEMO_NOW } from './demo.ts';

/** Quiet logger; SEED_DEBUG=1 prints errors (with the stack the allowlist keeps). */
const silent: Logger = {
  log: (level, msg, fields) => {
    if (process.env.SEED_DEBUG && level === 'error') console.error(`[seed] ${msg}`, fields);
  },
};

export interface SeedBase {
  db: Db;
  clock: DevClock;
  hasher: Hasher;
  totpKey?: string;
  experimentSeed?: string;
  log?: (msg: string) => void;
}

/** In-process API on the given database with a seeded platform; returns the world and a job tick. */
export async function seedContext(base: SeedBase, seed = DEMO_SEED) {
  const inbox = new DevInbox(base.clock);
  const random = new Prng(seed ^ 0x5eed);
  const platform: Platform = {
    clock: base.clock,
    random,
    mailer: new DevMailer(inbox, false),
    sms: new DevSmsSender(inbox, false),
    hasher: base.hasher,
    logger: silent,
    net: new DevNetClassifier(),
    totpKey: base.totpKey ?? DEV_TOTP_KEY,
  };
  const services = createServices(createSqlServices(base.db, platform, { seed: base.experimentSeed ?? DEV_EXPERIMENT_SEED, seedVersion: 'dev', release: 'demo' }));
  const deps: ModuleDeps = { db: base.db, platform, services };
  const app = createApp({ modules, deps });
  const transport: Transport = async (path, init, ip) => app.request(`http://localhost/api/v1${path}`, init, { incoming: { socket: { remoteAddress: ip } } });
  const world: World = {
    transport,
    inbox: async (to) => inbox.list(to.toLowerCase()) as InboxMessage[],
    clock: { now: () => base.clock.now().getTime(), set: async (ms) => base.clock.set(new Date(ms)) },
  };
  const scheduler: Scheduler = createScheduler({ clock: base.clock, moduleDeps: deps, logger: silent });
  for (const j of await loadJobs()) scheduler.register(j);
  // Labels from a counter of this context, so a second run in the same process is identical.
  let actors = 0;
  const newActor = (ip: string, ua?: string) => new Actor(transport, { ip, label: `a${++actors}`, ...(ua ? { userAgent: ua } : {}) });
  return { deps, platform, world, scheduler, inbox, newActor };
}

/** Seed `empty`: only the three admins. */
export function seedEmpty(base: SeedBase): Record<string, string> {
  return seedAdmins(base.db, { clock: base.clock, random: new Prng(DEMO_SEED ^ 0xad), hasher: base.hasher, totpKey: base.totpKey ?? DEV_TOTP_KEY });
}

/** Seed `demo` on an empty, migrated database. Leaves the clock at DEMO_NOW. */
export async function seedDemoOn(base: SeedBase): Promise<DemoReport> {
  seedEmpty(base);
  const ctx = await seedContext(base);
  const report = await runDemo({ world: ctx.world, newActor: ctx.newActor, tick: async () => ctx.scheduler.tick(), ...(base.log ? { log: base.log } : {}) });
  report.admins = DEMO_ADMINS.map((a) => ({ email: a.email, secret: adminSecretBase32(a.key) }));
  return report;
}

/**
 * Entry point for POST /dev/reset {"seed":"demo"} (modules/dev). The server clock must be a DevClock;
 * afterwards it runs on from DEMO_NOW instead of standing still, so sessions work in the demo.
 */
export async function seedDemo(deps: ModuleDeps): Promise<DemoReport> {
  const clock = deps.platform.clock;
  if (!(clock instanceof DevClock)) throw new Error('seedDemo needs the dev clock');
  const report = await seedDemoOn({ db: deps.db, clock, hasher: deps.platform.hasher, ...(deps.platform.totpKey ? { totpKey: deps.platform.totpKey } : {}) });
  resumeClock(clock, DEMO_NOW);
  return report;
}

/**
 * DevClock has no "run again" after set() (WP-3). Its fields are TypeScript-private, not #private,
 * so the seed puts it back into running mode at `at`. Only used on the dev server.
 */
export function resumeClock(clock: DevClock, at: number): void {
  const inner = clock as unknown as { fixed: Date | null; offsetMs: number };
  inner.fixed = null;
  inner.offsetMs = at - Date.now();
}
