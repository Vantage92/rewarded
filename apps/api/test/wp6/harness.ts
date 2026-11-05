// WP-6 test harness: every migration, every production module, the real WP-3 services (audit,
// events, experiments) and the WP-6 SQL services installed by the modules. Shaped like the WP-4
// harness so its helpers (createUser, call, device, FocusClient) can be reused unchanged.
import { CURRENT_PARAMS, focusDayOf, fromLocal } from '@rewarded/core';
import { createApp } from '../../src/app.ts';
import { MIGRATIONS_DIR } from '../../src/config.ts';
import { createSqlServices } from '../../src/db/services/index.ts';
import { auditRef, adminActor } from '../../src/db/services/audit.ts';
import { migrate } from '../../src/db/migrate.ts';
import { openDb } from '../../src/db/open.ts';
import type { Db, DriverName } from '../../src/db/types.ts';
import type { ModuleDeps } from '../../src/module.ts';
import { modules } from '../../src/modules.gen.ts';
import { installWp6Services } from '../../src/modules/fraud/lib/install.ts';
import { DEV_PEPPERS, DEV_TOTP_KEY, DevClock, DevInbox, DevMailer, DevSmsSender, SeededRandom } from '../../src/platform/dev.ts';
import { MemoryLogger } from '../../src/platform/log.ts';
import { DevNetClassifier } from '../../src/platform/net.ts';
import { HmacHasher } from '../../src/platform/system.ts';
import { createServices, type Services } from '../../src/services/index.ts';
import type { Harness as Wp4Harness, TestUser } from '../wp4/harness.ts';
import { CSRF_TOKEN, type createUser as wp4CreateUser } from '../wp4/harness.ts';
import { createSession } from '../../src/middleware/auth.ts';

export { call, device, idemKey } from '../wp4/harness.ts';
export type { TestUser } from '../wp4/harness.ts';

export interface Wp6Harness extends Omit<Wp4Harness, 'events' | 'flags'> {
  logger: MemoryLogger;
  /** Raw insert helpers for heuristics scenarios. */
  seq: { n: number };
}

export function wp6Harness(opts: { start?: string; driver?: DriverName } = {}): Wp6Harness {
  const clock = new DevClock(new Date(opts.start ?? '2026-12-03T10:00:00Z'));
  const inbox = new DevInbox(clock);
  const db = openDb({ path: ':memory:', driver: opts.driver ?? 'better-sqlite3' });
  migrate(db, { dir: MIGRATIONS_DIR, clock });
  const logger = new MemoryLogger(() => clock.now());
  const platform = {
    clock,
    random: new SeededRandom(11),
    mailer: new DevMailer(inbox, false),
    sms: new DevSmsSender(inbox, false),
    hasher: new HmacHasher(DEV_PEPPERS),
    logger,
    net: new DevNetClassifier(),
    totpKey: DEV_TOTP_KEY,
  };
  const services: Services = createServices(createSqlServices(db, platform, { seed: 'wp6-test-seed-000000000000000000000000', seedVersion: 'test', release: 'test' }));
  const deps: ModuleDeps = { db, platform, services, http: { appOrigin: 'http://localhost:5173', trustProxy: true, secureCookies: false, release: 'test' } };
  const app = createApp({ modules, deps });
  installWp6Services(deps);
  return { app, db, clock, inbox, deps, services, logger, seq: { n: 0 }, setArm: () => undefined } as Wp6Harness;
}

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
let userSeq = 0;

/** Like the WP-4 helper, but with Crockford-valid ULIDs, so admin routes (Ulid params) accept them. */
export function createUser(h: Wp6Harness, o: Parameters<typeof wp4CreateUser>[1] = {}): TestUser {
  userSeq += 1;
  let n = userSeq;
  let tail = '';
  for (let i = 0; i < 10; i++) {
    tail = CROCKFORD[n % 32] + tail;
    n = Math.floor(n / 32);
  }
  const id = `01JWP6USER${'0'.repeat(6)}${tail}`.replace('USER', '5ER0').slice(0, 26);
  const pseudonym = `pseudo_wp6_${String(userSeq).padStart(6, '0')}`;
  const created = o.createdAt ?? new Date(h.clock.now().getTime() - 30 * 86_400_000).toISOString();
  h.db.run(
    `INSERT INTO user (id, email, email_norm_hash, first_name, locale, age_band, turns_18_on, status, pseudonym, registration_source, daily_goal_min, cohort,
       registration_channel, terms_version, privacy_version, research_info_version, created_at, institution_domain, institution_verified_at)
     VALUES (?, ?, ?, 'Test', 'nl', ?, ?, 'active', ?, 'personal', ?, 'experiment', 'other', 'v1', 'v1', 'v1', ?, ?, ?)`,
    [id, `wp6user${userSeq}@example.test`, `hash_${id}`, o.ageBand ?? '18_plus', o.ageBand === '16_17' ? '2027-06-01' : null, pseudonym, o.goal ?? 25, created,
      o.institution ? 'uu.nl' : null, o.institution ? created : null],
  );
  if (o.admin) h.db.run("INSERT INTO admin (user_id, role, created_at, created_by) VALUES (?, 'admin', ?, 'seed')", [id, created]);
  const value = createSession(h.db, { clock: h.clock, random: h.deps.platform.random }, { userId: id }, 'desktop');
  if (o.admin) h.db.run('UPDATE auth_session SET mfa_at = ? WHERE user_id = ?', [h.clock.now().toISOString(), id]);
  return { id, pseudonym, cookie: `rw_sid=${value}; rw_csrf=${CSRF_TOKEN}` };
}

export function actor(h: Wp6Harness, userId: string): `admin:${string}` {
  return adminActor(h.deps.platform.hasher, userId);
}
export function uref(h: Wp6Harness, userId: string): string {
  return auditRef(h.deps.platform.hasher, userId);
}

export interface RawSessionOpts {
  start: number;
  minutes?: 25 | 50 | 90;
  status?: 'completed' | 'aborted';
  ipHash?: string | null;
  netClass?: 'campus' | 'mobile_cgnat' | 'other' | null;
  uaClass?: string;
  claimDelayS?: number;
  reviewStatus?: 'none' | 'pending' | 'released' | 'rejected';
  focusDay?: string;
  lateStart?: boolean;
}

function ulidLike(prefix: string, n: number): string {
  return `${prefix}${String(n).padStart(26 - prefix.length, '0')}`;
}

/** Inserts a session row (and a device) directly, for batch heuristics scenarios. */
export function rawSession(h: Wp6Harness, userId: string, o: RawSessionOpts): string {
  h.seq.n += 1;
  const id = ulidLike('01JS', h.seq.n);
  const dev = ulidLike('01JD', h.seq.n);
  const minutes = o.minutes ?? 50;
  const status = o.status ?? 'completed';
  const iso = new Date(o.start).toISOString();
  h.db.run('INSERT INTO device (id, client_device_id, user_id, ua_class, first_seen_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)', [dev, `cd-${dev}`, userId, o.uaClass ?? 'android_chrome', iso, iso]);
  const end = o.start + minutes * 60_000;
  const focusDay = o.focusDay ?? focusDayOfTest(o.start);
  h.db.run(
    `INSERT INTO focus_session (id, user_id, device_id, planned_min, is_practice, status, server_start_at, planned_end_at, server_end_at, abort_reason, verified_min, counted_min,
       focus_day, late_start, review_status, nonce_hash, mono_start_ms, last_heartbeat_at, ua_class, ip_hash, net_class, claim_delay_s, closed_by)
     VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 'n', 0, ?, ?, ?, ?, ?, 'end')`,
    [id, userId, dev, minutes, status, o.start, end, end, status === 'aborted' ? 'hidden' : null, status === 'completed' ? minutes : 0, focusDay, o.lateStart ? 1 : 0,
      status === 'completed' ? (o.reviewStatus ?? 'none') : 'none', end, o.uaClass ?? 'android_chrome', o.ipHash === undefined ? 'ip_default' : o.ipHash, o.netClass === undefined ? 'other' : o.netClass, o.claimDelayS ?? 5],
  );
  return id;
}

export function focusDayOfTest(t: number): string {
  return focusDayOf(t, CURRENT_PARAMS);
}
export function local(day: string, hh: number, mm = 0): number {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return fromLocal(y, m, d, hh, mm);
}

/** Sets the registration network of a user (H7 input). */
export function setRegistration(db: Db, userId: string, at: string, ipHash: string, net: 'campus' | 'mobile_cgnat' | 'other'): void {
  db.run('UPDATE user SET created_at = ?, registration_ip_hash = ?, registration_net_class = ? WHERE id = ?', [at, ipHash, net, userId]);
}

/** Makes an admin (user row, admin role, session with a second factor). */
export function createAdmin(h: Wp6Harness): TestUser {
  return createUser(h, { admin: true });
}

import { call as wp4Call } from '../wp4/harness.ts';
import { FocusClient } from '../wp4/client.ts';

/** HTTP call as `user` through the app (CSRF and Origin set). */
// oxlint-disable-next-line typescript/no-explicit-any -- test bodies are free-form JSON read with toMatchObject
export function api<T = any>(h: Wp6Harness, user: TestUser | null, method: string, path: string, body?: unknown) {
  return wp4Call<T>(h as unknown as Wp4Harness, user, method, path, body);
}

/** A real session through the WP-4 protocol (start, heartbeats, end). */
export async function realSession(h: Wp6Harness, user: TestUser, minutes: 25 | 50 | 90 = 25): Promise<string> {
  const { device } = await import('../wp4/harness.ts');
  const dev = await device(h as unknown as Wp4Harness, user, `${user.id.slice(-8)}-1111-4111-8111-111111111111`.padStart(36, '1').slice(-36).replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5').replace(/[^0-9a-f-]/g, '1'));
  const fc = new FocusClient(h as unknown as Wp4Harness, user, dev);
  const r = await fc.complete(minutes);
  if (r.status !== 200) throw new Error(`session end ${r.status} ${JSON.stringify(r.body)}`);
  return fc.sessionId;
}

let socialSeq = 0;
/** Inserts an active squad with the given members (WP-5 tables). */
export function rawSquad(h: Wp6Harness, members: readonly string[], at: string): string {
  socialSeq += 1;
  const id = `01JQ${String(socialSeq).padStart(22, '0')}`;
  h.db.run("INSERT INTO squad (id, name, cohort, status, created_at, created_day, became_active_at) VALUES (?, ?, 'experiment', 'active', ?, ?, ?)", [id, `Squad ${socialSeq}`, at, at.slice(0, 10), at]);
  members.forEach((u, i) => {
    h.db.run("INSERT INTO squad_membership (id, squad_id, user_id, role, joined_at, active_from_day) VALUES (?, ?, ?, ?, ?, ?)", [`01JM${String(socialSeq).padStart(16, '0')}${String(i).padStart(6, '0')}`, id, u, i === 0 ? 'maker' : 'member', at, at.slice(0, 10)]);
  });
  return id;
}

/** Inserts a club (WP-5 table). */
export function rawClub(h: Wp6Harness, name = 'Vereniging'): string {
  socialSeq += 1;
  const id = `01JK${String(socialSeq).padStart(22, '0')}`;
  h.db.run("INSERT INTO club (id, name, city, declared_members, members_source_kind, members_source_ref, prize_eligible, pool, status, created_by, created_at) VALUES (?, ?, 'Utrecht', 200, 'institution', 'doc', 1, '150_500', 'active', 'seed', ?)", [
    id,
    name,
    h.clock.now().toISOString(),
  ]);
  return id;
}

export function rawLink(h: Wp6Harness, clubId: string, userId: string, at: string, ipHash: string, net: 'campus' | 'mobile_cgnat' | 'other'): void {
  socialSeq += 1;
  h.db.run('INSERT INTO club_membership (id, user_id, club_id, linked_at, linked_day, ip_hash, net_class) VALUES (?, ?, ?, ?, ?, ?, ?)', [`01JL${String(socialSeq).padStart(22, '0')}`, userId, clubId, at, at.slice(0, 10), ipHash, net]);
}
