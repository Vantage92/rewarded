// WP-5 test harness: migrated in-memory database, the ten WP-5 modules, fakes for the services of
// other packages (events, flags, audit, ledger, prizes, experiments), and fixtures for user_day and
// focus_session rows (WP-4's tables, written here directly as test data).
import { createApp } from '../../src/app.ts';
import { MIGRATIONS_DIR } from '../../src/config.ts';
import { openDb } from '../../src/db/open.ts';
import { migrate } from '../../src/db/migrate.ts';
import type { Db, DriverName } from '../../src/db/types.ts';
import { createSession } from '../../src/middleware/auth.ts';
import type { ApiModule, ModuleDeps } from '../../src/module.ts';
import { DEV_PEPPERS, DevClock, DevInbox, DevMailer, DevSmsSender, SeededRandom } from '../../src/platform/dev.ts';
import { MemoryLogger } from '../../src/platform/log.ts';
import { DevNetClassifier } from '../../src/platform/net.ts';
import { HmacHasher } from '../../src/platform/system.ts';
import { FakeAuditWriter } from '../../src/services/audit.ts';
import { FakeEventWriter } from '../../src/services/events.ts';
import { FakeExperimentService } from '../../src/services/experiments.ts';
import { FakeFlagService } from '../../src/services/flags.ts';
import { createServices, type Services } from '../../src/services/index.ts';
import { FakeLedgerService } from '../../src/services/ledger.ts';
import { FakePrizeService } from '../../src/services/prizes.ts';
import { FakePrivacyService } from '../../src/services/privacy.ts';
import { module as belofte } from '../../src/modules/belofte/index.ts';
import { module as cards } from '../../src/modules/cards/index.ts';
import { module as challenges } from '../../src/modules/challenges/index.ts';
import { module as clubs } from '../../src/modules/clubs/index.ts';
import { module as duels } from '../../src/modules/duels/index.ts';
import { module as invites } from '../../src/modules/invites/index.ts';
import { module as leaderboards } from '../../src/modules/leaderboards/index.ts';
import { module as referral } from '../../src/modules/referral/index.ts';
import { module as reminders } from '../../src/modules/reminders/index.ts';
import { module as squads } from '../../src/modules/squads/index.ts';
import { step as step4 } from '../../src/jobs/day_close/04-squad-activity.ts';
import { step as step5 } from '../../src/jobs/day_close/05-squad-days.ts';
import { step as step6 } from '../../src/jobs/day_close/06-belofte.ts';
import { step as step8 } from '../../src/jobs/day_close/08-challenge-scores.ts';
import { isVacation } from '../../src/jobs/day_close/index.ts';
import { CURRENT_PARAMS, closeAt, type FocusDay } from '@rewarded/core';

export const DRIVERS: DriverName[] = ['better-sqlite3', 'node:sqlite'];
export const ORIGIN = 'http://localhost:5173';
export const WP5_MODULES: readonly ApiModule[] = [squads, invites, duels, clubs, challenges, leaderboards, belofte, cards, referral, reminders];
const CSRF = 'csrf-token-for-tests-000000000000';
/** A visitor without a session but with the CSRF cookie (public POST routes). */
export const ANON: TestUser = { id: 'anon', pseudonym: 'anon', firstName: 'anon', email: 'anon', cookie: `rw_csrf=${CSRF}` };

/** FakeFlagService with ULID-shaped ids (contracts expect ULIDs; the fake numbers its flags). */
export class UlidFlagService extends FakeFlagService {
  private static toUlid(id: string): string {
    return `01JFFFFF${id.replace(/\D/g, '').padStart(18, '0')}`;
  }
  override raise(tx: Parameters<FakeFlagService['raise']>[0], input: Parameters<FakeFlagService['raise']>[1]): string {
    return UlidFlagService.toUlid(super.raise(tx, input));
  }
}

/** FakePrizeService with ULID-shaped ids. */
export class UlidPrizeService extends FakePrizeService {
  override createForChallenge(...args: Parameters<FakePrizeService['createForChallenge']>): string[] {
    return super.createForChallenge(...args).map((id) => `01JPPPPP${id.replace(/\D/g, '').padStart(18, '0')}`);
  }
  override proposeWinner(...args: Parameters<FakePrizeService['proposeWinner']>): ReturnType<FakePrizeService['proposeWinner']> {
    const [tx, c] = args;
    return super.proposeWinner(tx, { ...c, prizeId: `prize_${Number(c.prizeId.slice(8))}` });
  }
}

export interface Harness {
  app: ReturnType<typeof createApp>;
  db: Db;
  clock: DevClock;
  inbox: DevInbox;
  deps: ModuleDeps;
  services: Services;
  events: FakeEventWriter;
  flags: UlidFlagService;
  ledger: FakeLedgerService;
  privacy: FakePrivacyService;
}

export function wp5Harness(opts: { start?: string; driver?: DriverName } = {}): Harness {
  const clock = new DevClock(new Date(opts.start ?? '2026-12-03T10:00:00Z'));
  const inbox = new DevInbox(clock);
  const db = openDb({ path: ':memory:', driver: opts.driver ?? 'better-sqlite3' });
  migrate(db, { dir: MIGRATIONS_DIR, clock });
  const events = new FakeEventWriter();
  const flags = new UlidFlagService();
  const ledger = new FakeLedgerService();
  const privacy = new FakePrivacyService();
  const services = createServices({
    events,
    flags,
    privacy,
    audit: new FakeAuditWriter(() => clock.now()),
    experiments: new FakeExperimentService(),
    prizes: new UlidPrizeService(),
  });
  (services as unknown as { ledger: FakeLedgerService }).ledger = ledger;
  const deps: ModuleDeps = {
    db,
    platform: {
      clock,
      random: new SeededRandom(11),
      mailer: new DevMailer(inbox, false),
      sms: new DevSmsSender(inbox, false),
      hasher: new HmacHasher(DEV_PEPPERS),
      logger: new MemoryLogger(),
      net: new DevNetClassifier(),
    } as ModuleDeps['platform'],
    services,
    http: { appOrigin: ORIGIN, trustProxy: true, secureCookies: false, release: 'test' },
  };
  const app = createApp({ modules: WP5_MODULES, deps });
  return { app, db, clock, inbox, deps, services, events, flags, ledger, privacy };
}

let seq = 0;
export interface TestUser {
  id: string;
  pseudonym: string;
  firstName: string;
  email: string;
  cookie: string;
}

export function createUser(
  h: Harness,
  o: {
    ageBand?: '16_17' | '18_plus';
    cohort?: 'experiment' | 'expansion';
    firstName?: string;
    compare?: boolean;
    silent?: boolean;
    institution?: boolean;
    phone?: boolean;
    admin?: boolean;
    createdAt?: string;
    squadNameOnCards?: boolean;
    locale?: 'nl' | 'en';
  } = {},
): TestUser {
  seq += 1;
  const id = `01JWP5MEMB${String(seq).padStart(16, '0')}`;
  const pseudonym = `p5_${String(seq).padStart(8, '0')}`;
  const firstName = o.firstName ?? `Lid${seq}`;
  const email = `user${seq}@example.test`;
  const created = o.createdAt ?? new Date(h.clock.now().getTime() - 30 * 86_400_000).toISOString();
  h.db.run(
    `INSERT INTO user (id, email, email_norm_hash, first_name, locale, age_band, turns_18_on, status, pseudonym, registration_source, daily_goal_min, cohort,
       registration_channel, terms_version, privacy_version, research_info_version, created_at, compare_opt_in, silent_mode, squad_name_on_cards,
       institution_domain, institution_verified_at, phone_hash, phone_verified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, 'personal', 25, ?, 'other', 'v1', 'v1', 'v1', ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      email,
      `hash_${id}`,
      firstName,
      o.locale ?? 'nl',
      o.ageBand ?? '18_plus',
      o.ageBand === '16_17' ? '2027-09-01' : null,
      pseudonym,
      o.cohort ?? 'experiment',
      created,
      o.compare ? 1 : 0,
      o.silent ? 1 : 0,
      o.squadNameOnCards ? 1 : 0,
      o.institution ? 'uu.nl' : null,
      o.institution ? created : null,
      o.phone ? `phone_${id}` : null,
      o.phone ? created : null,
    ],
  );
  h.db.run("INSERT INTO device (id, client_device_id, user_id, ua_class, first_seen_at, last_seen_at) VALUES (?, ?, ?, 'android_chrome', ?, ?)", [`dev_${id}`, `cd_${id}`, id, created, created]);
  if (o.admin) h.db.run("INSERT INTO admin (user_id, role, created_at, created_by) VALUES (?, 'admin', ?, 'seed')", [id, created]);
  const value = createSession(h.db, { clock: h.clock, random: h.deps.platform.random }, { userId: id }, 'desktop');
  if (o.admin) h.db.run('UPDATE auth_session SET mfa_at = ? WHERE user_id = ?', [h.clock.now().toISOString(), id]);
  return { id, pseudonym, firstName, email, cookie: `rw_sid=${value}; rw_csrf=${CSRF}` };
}

export interface CallResult<T = unknown> {
  status: number;
  body: T;
  headers: Headers;
  text: string;
}

let idem = 0;
// oxlint-disable-next-line typescript/no-explicit-any -- test responses are inspected ad hoc
export async function call<T = any>(h: Harness, user: TestUser | null, method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<CallResult<T>> {
  idem += 1;
  const res = await h.app.request(`/api/v1${path}`, {
    method,
    headers: {
      ...(user ? { Cookie: user.cookie } : {}),
      Origin: ORIGIN,
      'X-CSRF-Token': CSRF,
      'Idempotency-Key': `idem-key-${String(idem).padStart(8, '0')}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let parsed: unknown = undefined;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    parsed = undefined;
  }
  return { status: res.status, body: parsed as T, headers: res.headers, text };
}

/** A user_day row as WP-4's reconcileDay would leave it. */
export function putDay(
  h: Harness,
  userId: string,
  day: FocusDay,
  o: { goalMet?: boolean; goalMetFinal?: boolean; examDay?: boolean; countedMin?: number; countedMinFinal?: number; verifiedMin?: number; goalMin?: number } = {},
): void {
  const counted = o.countedMin ?? (o.goalMet ? 30 : 0);
  const verified = Math.max(o.verifiedMin ?? counted, counted);
  const goalMet = o.goalMet ?? false;
  h.db.run(
    `INSERT INTO user_day (user_id, focus_day, rev, verified_min, counted_min, counted_min_final, goal_min, goal_met, goal_met_final, exam_day, goal_state)
     VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, 'none')
     ON CONFLICT (user_id, focus_day) DO UPDATE SET verified_min = excluded.verified_min, counted_min = excluded.counted_min, counted_min_final = excluded.counted_min_final,
       goal_met = excluded.goal_met, goal_met_final = excluded.goal_met_final, exam_day = excluded.exam_day, rev = rev + 1`,
    [userId, day, verified, Math.min(counted, 300), Math.min(o.countedMinFinal ?? counted, counted, 300), o.goalMin ?? 25, goalMet ? 1 : 0, (o.goalMetFinal ?? goalMet) && goalMet ? 1 : 0, o.examDay ? 1 : 0],
  );
}

let sessionSeq = 0;
/** A focus_session row (completed by default) on a focus day. */
export function putSession(
  h: Harness,
  userId: string,
  day: FocusDay,
  o: { status?: 'completed' | 'active' | 'aborted'; minutes?: number; review?: 'none' | 'pending' | 'released' | 'rejected'; startAt?: number; plannedEndAt?: number; ipHash?: string } = {},
): string {
  sessionSeq += 1;
  const id = `01JWP5SESS${String(sessionSeq).padStart(16, '0')}`;
  const minutes = o.minutes ?? 25;
  const start = o.startAt ?? Date.parse(`${day}T10:00:00Z`);
  const status = o.status ?? 'completed';
  h.db.run(
    `INSERT INTO focus_session (id, user_id, device_id, planned_min, is_practice, status, server_start_at, planned_end_at, verified_min, counted_min, focus_day, late_start,
       review_status, nonce_hash, mono_start_ms, last_heartbeat_at, ua_class, ip_hash)
     VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 0, ?, 'n', 0, ?, 'android_chrome', ?)`,
    [
      id,
      userId,
      `dev_${userId}`,
      [25, 50, 90].includes(minutes) ? minutes : 25,
      status,
      start,
      o.plannedEndAt ?? start + minutes * 60_000,
      status === 'completed' ? minutes : 0,
      0,
      day,
      o.review ?? 'none',
      start,
      o.ipHash ?? null,
    ],
  );
  return id;
}

/** Runs one WP-5 day-close step for focus day `day` at its close moment. */
export async function closeDay(h: Harness, day: FocusDay, steps: (4 | 5 | 6 | 8)[] = [4, 5, 6, 8]): Promise<void> {
  const map = { 4: step4, 5: step5, 6: step6, 8: step8 } as const;
  h.clock.set(new Date(closeAt(day, CURRENT_PARAMS)));
  for (const n of steps) {
    await map[n].run({ day, runKey: `day_close:${day}`, now: h.clock.now(), deps: h.deps, params: CURRENT_PARAMS, vacation: isVacation(h.db, day) });
  }
}

export function setFlag(h: Harness, key: string, on = true): void {
  h.db.run('INSERT INTO feature_flag (key, enabled, updated_at, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT (key) DO UPDATE SET enabled = excluded.enabled', [
    key,
    on ? 1 : 0,
    h.clock.now().toISOString(),
    'test',
  ]);
}

/** Creates an active club with a code (spec §4.11). */
export function createClub(h: Harness, o: { declared?: number; name?: string; pool?: 'lt150' | '150_500' | 'gt500'; kind?: 'institution' | 'self'; calendarId?: string } = {}): { id: string; code: string } {
  seq += 1;
  const id = `01JWP5CXBB${String(seq).padStart(16, '0')}`;
  const code = `CLUB${String(seq).padStart(4, '0')}`;
  h.db.run(
    `INSERT INTO club (id, name, city, exam_calendar_id, declared_members, members_source_kind, members_source_ref, prize_eligible, agreement_ref, pool, join_code, status, created_by, created_at)
     VALUES (?, ?, 'Demostad', ?, ?, ?, 'doc-1', ?, 'agreement-1', ?, ?, 'active', 'seed', ?)`,
    [id, o.name ?? `Vereniging ${seq}`, o.calendarId ?? null, o.declared ?? 40, o.kind ?? 'institution', o.kind === 'self' ? 0 : 1, o.pool ?? 'lt150', code, h.clock.now().toISOString()],
  );
  return { id, code };
}

export function linkMember(h: Harness, clubId: string, userId: string, day: FocusDay, qr: string | null = null): void {
  seq += 1;
  h.db.run('INSERT INTO club_membership (id, user_id, club_id, linked_at, linked_day, qr_source) VALUES (?, ?, ?, ?, ?, ?)', [
    `01JWP5MKNK${String(seq).padStart(16, '0')}`,
    userId,
    clubId,
    `${day}T12:00:00.000Z`,
    day,
    qr,
  ]);
}

/** Builds a squad of `n` members through the API (create + invite accept); returns the users. */
export async function squadOf(h: Harness, n: number, o: { name?: string; club?: string } = {}): Promise<{ users: TestUser[]; squadId: string; token: string }> {
  const users = Array.from({ length: n }, () => createUser(h));
  const created = await call(h, users[0]!, 'POST', '/squads', { name: o.name ?? 'Studiegenoten', ...(o.club ? { club_id: o.club } : {}) });
  if (created.status !== 201) throw new Error(`squad create ${created.status} ${created.text}`);
  const token = created.body.invite.token as string;
  for (const u of users.slice(1)) {
    const r = await call(h, u, 'POST', `/invites/${token}/accept`);
    if (r.status !== 200) throw new Error(`accept ${r.status} ${r.text}`);
  }
  return { users, squadId: created.body.squad.id as string, token };
}
