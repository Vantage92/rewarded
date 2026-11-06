// Shared world for the repair tests: the real API of all modules on an in-memory database, the
// seed flows as client, and two admins (copied from integratie-ronde3.test.ts).
import { MIGRATIONS_DIR } from '../../apps/api/src/config.ts';
import { migrate } from '../../apps/api/src/db/migrate.ts';
import { openDb } from '../../apps/api/src/db/open.ts';
import type { Db } from '../../apps/api/src/db/types.ts';
import { DEV_PEPPERS, DevClock } from '../../apps/api/src/platform/dev.ts';
import { HmacHasher } from '../../apps/api/src/platform/system.ts';
import { DEMO_ADMINS } from '../seed/admins.ts';
import { UA, lastToken, type Actor } from '../seed/driver.ts';
import { MIN, adminLogin, login, register, registerDevice, runAgenda, sessionTask } from '../seed/flows.ts';
import { seedContext, seedEmpty } from '../seed/index.ts';
import { Prng } from '../seed/prng.ts';

const hasher = new HmacHasher(DEV_PEPPERS);
/** 12:00 Europe/Amsterdam on a winter day (UTC+1). */
const noon = (day: string) => Date.parse(`${day}T11:00:00.000Z`);

export async function world(start: string) {
  const clock = new DevClock(new Date(noon(start)));
  const db: Db = openDb({ path: ':memory:', driver: 'better-sqlite3' });
  migrate(db, { dir: MIGRATIONS_DIR, clock });
  seedEmpty({ db, clock, hasher });
  const ctx = await seedContext({ db, clock, hasher });
  const rng = new Prng(42);
  const anna = ctx.newActor('203.0.113.220', UA.desktop);
  const bram = ctx.newActor('203.0.113.221', UA.desktop);
  await adminLogin(ctx.world, anna, DEMO_ADMINS[0]!);
  await adminLogin(ctx.world, bram, DEMO_ADMINS[1]!);
  let n = 0;
  const known: { a: Actor; email: string }[] = [];
  /** Moves the clock (Europe/Amsterdam winter time) and logs everyone in again (sessions expire). */
  const at = async (day: string, hhmm = '12:00') => {
    const [h, m] = hhmm.split(':').map(Number) as [number, number];
    await ctx.world.clock.set(Date.parse(`${day}T00:00:00.000Z`) + (h - 1) * 60 * MIN + m * MIN);
    for (const k of known) await login(ctx.world, k.a, k.email);
    await adminLogin(ctx.world, anna, DEMO_ADMINS[0]!);
    await adminLogin(ctx.world, bram, DEMO_ADMINS[1]!);
  };
  /** A student through the waitlist (or a squad link): register, device, optional club code. */
  const student = async (o: { squadToken?: string; clubCode?: string; birthDate?: string; ua?: string } = {}) => {
    n += 1;
    const a = ctx.newActor(`198.18.${Math.floor(n / 200)}.${(n % 200) + 1}`, o.ua);
    const email = `student${n}@student.demostad.test`;
    let invite = o.squadToken;
    if (!invite) {
      await a.api.call('waitlist.join', { body: { email, locale: 'nl', source: 'landing', consent_version: 'privacy-0.3' } });
      await anna.api.call('admin.waitlist.inviteBatch', { body: { count: 1 } });
      invite = await lastToken(ctx.world.inbox, email, /\/i\/([A-Za-z0-9_-]{16,128})/);
    }
    const ob = await register(ctx.world, a, { email, firstName: `Student${n}`, birthDate: o.birthDate ?? '2004-05-05', goal: 25, invite });
    const deviceId = await registerDevice(a, rng);
    known.push({ a, email });
    if (o.clubCode) await a.api.call('clubs.join', { body: { code: o.clubCode } });
    if (o.squadToken) await a.api.call('invites.accept', { params: { token: o.squadToken } });
    return { a, email, ob, deviceId, id: ob.user.id };
  };
  /** One completed 25-minute session now; returns the end verdict's points. */
  const session25 = async (s: { a: Actor; deviceId: string }) => {
    let status = '';
    await runAgenda(ctx.world.clock, [sessionTask({ actor: s.a, deviceId: s.deviceId, start: ctx.world.clock.now() + 1_000, plannedMin: 25, outcome: { kind: 'complete' }, intervalS: 30, done: (r) => (status = r.status) }, rng, ctx.world.clock)]);
    return status;
  };
  const calendar = (body: Record<string, unknown>) => anna.api.call('admin.examCalendars.create', { body: { source_ref: 'https://example.test/rooster (fictief)', checked_at: '2026-11-05', ...body } as never });
  const club = async (name: string, calendarId: string) =>
    (await anna.api.call('admin.clubs.create', {
      body: { name, city: 'Demostad', declared_members: 60, members_source_kind: 'institution', members_source_ref: 'Fictief', agreement_ref: `OVK-${name}`, exam_calendar_id: calendarId },
    })).club;
  const restFlagOn = async () => {
    await anna.api.call('admin.featureFlags.put', { params: { key: 'rest_period' }, body: { enabled: true } });
    await bram.api.call('admin.featureFlags.put', { params: { key: 'rest_period' }, body: { enabled: true } });
  };
  const earnRows = (userId: string, day: string) =>
    Number(db.get<{ n: number }>("SELECT count(*) AS n FROM journal_entry e JOIN focus_session s ON s.id = e.ref_id WHERE e.type = 'earn_session' AND s.user_id = ? AND s.focus_day = ? AND s.is_practice = 0", [userId, day])?.n ?? 0);
  const bonusRows = (userId: string) =>
    Number(db.get<{ n: number }>("SELECT count(DISTINCT e.id) AS n FROM journal_entry e JOIN posting p ON p.entry_id = e.id JOIN ledger_account_owner o ON o.account_id = p.account_id WHERE e.type = 'goal_bonus' AND o.user_id = ?", [userId])?.n ?? 0);
    const armBOn = async () => {
    await anna.api.call('admin.featureFlags.put', { params: { key: 'arm_b' }, body: { enabled: true } });
    await bram.api.call('admin.featureFlags.put', { params: { key: 'arm_b' }, body: { enabled: true } });
  };
  return { db, clock, hasher, ctx, anna, bram, at, student, session25, calendar, club, restFlagOn, armBOn, earnRows, bonusRows, rng };
}

