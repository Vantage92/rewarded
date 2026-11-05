// WP-4 test harness: migrated in-memory database, the WP-4 modules, fakes for the other services,
// and helpers to create students and admins with a real session cookie and CSRF token.
import { createApp } from '../../src/app.ts';
import { MIGRATIONS_DIR } from '../../src/config.ts';
import { openDb } from '../../src/db/open.ts';
import { migrate } from '../../src/db/migrate.ts';
import type { Db, DriverName } from '../../src/db/types.ts';
import { createSession } from '../../src/middleware/auth.ts';
import { DEV_PEPPERS, DevClock, DevInbox, DevMailer, DevSmsSender, SeededRandom } from '../../src/platform/dev.ts';
import { MemoryLogger } from '../../src/platform/log.ts';
import { HmacHasher } from '../../src/platform/system.ts';
import { createServices, type Services } from '../../src/services/index.ts';
import { FakeEventWriter } from '../../src/services/events.ts';
import { FakeFlagService } from '../../src/services/flags.ts';
import { FakeAuditWriter } from '../../src/services/audit.ts';
import { module as catalog } from '../../src/modules/catalog/index.ts';
import { module as phone } from '../../src/modules/phone/index.ts';
import { module as points } from '../../src/modules/points/index.ts';
import { module as redemptions } from '../../src/modules/redemptions/index.ts';
import { module as sessions } from '../../src/modules/sessions/index.ts';
import type { ModuleDeps } from '../../src/module.ts';
import type { BonusArm } from '@rewarded/core/ledger';

export const ORIGIN = 'http://localhost:5173';

/** FakeFlagService with ULID-shaped ids (the contracts expect ULIDs; the fake numbers its flags). */
export class UlidFlagService extends FakeFlagService {
  private static toUlid(id: string): string {
    return `01JFLAG${id.replace(/\D/g, '').padStart(19, '0')}`;
  }
  private static fromUlid(id: string): string {
    return id.startsWith('01JFLAG') ? `flag_${Number(id.slice(7))}` : id;
  }
  override raise(tx: Parameters<FakeFlagService['raise']>[0], input: Parameters<FakeFlagService['raise']>[1]): string {
    return UlidFlagService.toUlid(super.raise(tx, input));
  }
  override decide(...args: Parameters<FakeFlagService['decide']>): ReturnType<FakeFlagService['decide']> {
    const [tx, id, ...rest] = args;
    return super.decide(tx, UlidFlagService.fromUlid(id), ...rest);
  }
  override get(id: string): ReturnType<FakeFlagService['get']> {
    return super.get(UlidFlagService.fromUlid(id));
  }
}
const CSRF = 'csrf-token-for-tests-000000000000';

export interface Harness {
  app: ReturnType<typeof createApp>;
  db: Db;
  clock: DevClock;
  inbox: DevInbox;
  deps: ModuleDeps;
  services: Services;
  events: FakeEventWriter;
  flags: FakeFlagService;
  setArm(userId: string, bonus: BonusArm | null, rest?: 'rest' | 'continue'): void;
}

export function wp4Harness(opts: { start?: string; driver?: DriverName } = {}): Harness {
  const clock = new DevClock(new Date(opts.start ?? '2026-12-03T10:00:00Z'));
  const inbox = new DevInbox(clock);
  const db = openDb({ path: ':memory:', driver: opts.driver ?? 'better-sqlite3' });
  migrate(db, { dir: MIGRATIONS_DIR, clock });
  const events = new FakeEventWriter();
  const flags = new UlidFlagService();
  const services = createServices({ events, flags, audit: new FakeAuditWriter(() => clock.now()) });
  const deps: ModuleDeps = {
    db,
    platform: {
      clock,
      random: new SeededRandom(7),
      mailer: new DevMailer(inbox, false),
      sms: new DevSmsSender(inbox, false),
      hasher: new HmacHasher(DEV_PEPPERS),
      logger: new MemoryLogger(),
    } as ModuleDeps['platform'],
    services,
  };
  const app = createApp({ modules: [catalog, phone, points, redemptions, sessions], deps });
  const arms = new Map<string, { bonus: BonusArm | null; rest: 'rest' | 'continue' }>();
  services.pointsContext.arms = (_db, userId) => arms.get(userId) ?? { bonus: null, rest: 'continue' };
  return { app, db, clock, inbox, deps, services, events, flags, setArm: (u, bonus, rest = 'continue') => arms.set(u, { bonus, rest }) };
}

let userSeq = 0;
export interface TestUser {
  id: string;
  pseudonym: string;
  cookie: string;
}

/** Inserts a student (WP-3 user table) and a logged-in session. */
export function createUser(h: Harness, o: { ageBand?: '16_17' | '18_plus'; goal?: 25 | 50 | 90 | 120; createdAt?: string; admin?: boolean; institution?: boolean } = {}): TestUser {
  userSeq += 1;
  const id = `01JTESTUSER${String(userSeq).padStart(15, '0')}`;
  const pseudonym = `pseudo_${String(userSeq).padStart(6, '0')}`;
  const created = o.createdAt ?? new Date(h.clock.now().getTime() - 30 * 86_400_000).toISOString();
  h.db.run(
    `INSERT INTO user (id, email, email_norm_hash, first_name, locale, age_band, turns_18_on, status, pseudonym, registration_source, daily_goal_min, cohort,
       registration_channel, terms_version, privacy_version, research_info_version, created_at, institution_domain, institution_verified_at)
     VALUES (?, ?, ?, 'Test', 'nl', ?, ?, 'active', ?, 'personal', ?, 'experiment', 'other', 'v1', 'v1', 'v1', ?, ?, ?)`,
    [id, `${id}@example.test`, `hash_${id}`, o.ageBand ?? '18_plus', o.ageBand === '16_17' ? '2027-06-01' : null, pseudonym, o.goal ?? 25, created,
      o.institution ? 'uu.nl' : null, o.institution ? created : null],
  );
  if (o.admin) h.db.run("INSERT INTO admin (user_id, role, created_at, created_by) VALUES (?, 'admin', ?, 'seed')", [id, created]);
  const value = createSession(h.db, { clock: h.clock, random: h.deps.platform.random }, { userId: id }, 'desktop');
  if (o.admin) h.db.run('UPDATE auth_session SET mfa_at = ? WHERE user_id = ?', [h.clock.now().toISOString(), id]);
  return { id, pseudonym, cookie: `rw_sid=${value}; rw_csrf=${CSRF}` };
}

export interface CallResult<T = unknown> {
  status: number;
  body: T;
}

/** Calls the API as `user` with CSRF header and Origin. */
export async function call<T = any>(h: Harness, user: TestUser | null, method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<CallResult<T>> {
  const res = await h.app.request(`/api/v1${path}`, {
    method,
    headers: {
      ...(user ? { Cookie: user.cookie } : {}),
      Origin: ORIGIN,
      'X-CSRF-Token': CSRF,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  return { status: res.status, body: (text ? JSON.parse(text) : undefined) as T };
}

export const CSRF_TOKEN = CSRF;

/** Registers a device and returns its id. */
export async function device(h: Harness, user: TestUser, clientId = '11111111-1111-4111-8111-111111111111'): Promise<string> {
  const r = await call<{ device_id: string }>(h, user, 'POST', '/devices', { client_device_id: clientId, ua_class: 'android_chrome', standalone: false, wakelock_supported: true });
  if (r.status >= 300) throw new Error(`device: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.device_id;
}

let keySeq = 0;
export function idemKey(): string {
  keySeq += 1;
  return `key-${String(keySeq).padStart(8, '0')}-abcdefgh`;
}
