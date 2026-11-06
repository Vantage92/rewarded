// Integration wave, round-3 build points (docs/pitch/ronde-3-founder-reactie.md G-MF3, G-S2; jurist
// should-fix 3; spec §3.16, §4.13; architecture §5.1, §12.5) through the real routes of all modules:
// (1) the exam calendar per club is the source of T, N and A; (4) the expansion cohort in a rest
// squad earns personally; (5) a switch from a rest squad to a continuing squad is a rest exit.
import { describe, expect, it } from 'vitest';
import { MIGRATIONS_DIR } from '../../apps/api/src/config.ts';
import { migrate } from '../../apps/api/src/db/migrate.ts';
import { openDb } from '../../apps/api/src/db/open.ts';
import type { Db } from '../../apps/api/src/db/types.ts';
import { DEV_PEPPERS, DevClock } from '../../apps/api/src/platform/dev.ts';
import { HmacHasher } from '../../apps/api/src/platform/system.ts';
import { DEMO_ADMINS } from '../seed/admins.ts';
import { UA, lastCode, lastToken, type Actor } from '../seed/driver.ts';
import { MIN, adminLogin, login, register, registerDevice, runAgenda, sessionTask } from '../seed/flows.ts';
import { seedContext, seedEmpty } from '../seed/index.ts';
import { Prng } from '../seed/prng.ts';

const hasher = new HmacHasher(DEV_PEPPERS);
/** 12:00 Europe/Amsterdam on a winter day (UTC+1). */
const noon = (day: string) => Date.parse(`${day}T11:00:00.000Z`);

async function world(start: string) {
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
  const student = async (o: { squadToken?: string; clubCode?: string; birthDate?: string } = {}) => {
    n += 1;
    const a = ctx.newActor(`198.18.${Math.floor(n / 200)}.${(n % 200) + 1}`);
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
  return { db, ctx, anna, bram, at, student, session25, calendar, club, restFlagOn, earnRows, bonusRows };
}

describe('spec §4.13 tentamenkalender per vereniging (integratie)', () => {
  it('§4.13 two clubs with a different T: GET /me shows the own calendar and the goal bonus stops at the own T', async () => {
    const w = await world('2026-12-07');
    const k1 = await w.calendar({ institution: 'Hogeschool Demostad (fictief)', t_day: '2027-01-24', a_start_day: '2027-04-05', a_end_day: '2027-04-18' });
    const k2 = await w.calendar({ institution: 'Universiteit Demostad (fictief)', t_day: '2027-02-07', a_start_day: '2027-04-12', a_end_day: '2027-04-25' });
    expect(k1.calendar.derived.bonus_stop_at).toBe('2027-01-25T04:00');
    expect(k2.calendar.derived.early_offer_day).toBe('2027-02-01');
    const c1 = await w.club('Kompas', k1.calendar.id);
    const c2 = await w.club('Ratio', k2.calendar.id);
    expect(c1.join_code).toMatch(/^[A-Z0-9]{6}$/);
    const x = await w.student({ clubCode: c1.join_code! });
    const y = await w.student({ clubCode: c2.join_code! });
    const solo = await w.student();
    expect((await x.a.api.call('me.get')).calendar).toMatchObject({ id: k1.calendar.id, t_day: '2027-01-24', bonus_stop_at: '2027-01-25T04:00' });
    expect((await y.a.api.call('me.get')).calendar).toMatchObject({ id: k2.calendar.id, t_day: '2027-02-07' });
    expect((await y.a.api.call('me.get')).club).toMatchObject({ id: c2.id, status: 'linked' });
    expect((await solo.a.api.call('me.get')).calendar).toMatchObject({ is_default: true });

    // 1 February 2027: after T of k1, inside the season of k2. Arm B is off, so everyone is in arm A.
    await w.at('2027-02-01', '10:00');
    await w.session25(x);
    await w.session25(y);
    expect(w.bonusRows(x.id)).toBe(0);
    expect(w.bonusRows(y.id)).toBe(1);

    // Cohort per calendar: registering on 1 February is expansion for k1, experiment for k2.
    // A squad link of a k1 squad gives the expansion cohort, of a k2 squad the experiment population.
    const s1 = await x.a.api.call('squads.create', { body: { name: 'Kompasgroep', club_id: c1.id } });
    const s2 = await y.a.api.call('squads.create', { body: { name: 'Ratiogroep', club_id: c2.id } });
    const late1 = await w.student({ squadToken: s1.invite.token });
    const late2 = await w.student({ squadToken: s2.invite.token });
    const cohort = (id: string) => w.db.get<{ cohort: string }>('SELECT cohort FROM user WHERE id = ?', [id])?.cohort;
    expect(cohort(late1.id)).toBe('expansion');
    expect(cohort(late2.id)).toBe('experiment');
  }, 120_000);

  it('§4.13 no code without a club calendar; the default calendar exists once and cannot be a club calendar', async () => {
    const w = await world('2026-12-07');
    const list = await w.anna.api.call('admin.examCalendars.list');
    const def = list.items.find((c) => c.is_default)!;
    expect(def.t_day).toBe('2027-01-17');
    const noCal = await w.anna.api.call('admin.clubs.create', { body: { name: 'Zonder', city: 'Demostad', declared_members: 40, members_source_kind: 'institution', members_source_ref: 'Fictief', agreement_ref: 'OVK-ZONDER' } });
    expect(noCal.club.join_code).toBeNull();
    expect(await w.anna.codeOf(w.anna.api.call('admin.clubs.patch', { params: { id: noCal.club.id }, body: { exam_calendar_id: def.id } }))).toBe('VALIDATION_FAILED');
    expect(await w.anna.codeOf(w.calendar({ institution: 'Tweede standaard', t_day: '2027-01-31', is_default: true }))).toBe('DEFAULT_CALENDAR_EXISTS');
    expect(await w.anna.codeOf(w.calendar({ institution: 'Maandag', t_day: '2027-01-25' }))).toBe('VALIDATION_FAILED');
    expect(await w.anna.codeOf(w.calendar({ institution: 'Geen bron', t_day: '2027-01-24', source_ref: ' ' }))).toBe('SOURCE_REQUIRED');
    // Fixed: a change needs a reason and a second admin.
    const k = await w.calendar({ institution: 'Vast', t_day: '2027-01-24' });
    await w.anna.api.call('admin.examCalendars.patch', { params: { id: k.calendar.id }, body: { fix: true } });
    expect(await w.anna.codeOf(w.anna.api.call('admin.examCalendars.patch', { params: { id: k.calendar.id }, body: { t_day: '2027-01-31' } }))).toBe('REASON_REQUIRED');
    const proposed = await w.anna.api.call('admin.examCalendars.patch', { params: { id: k.calendar.id }, body: { t_day: '2027-01-31', reason: 'Rooster gewijzigd door de instelling' } });
    expect(proposed.calendar).toMatchObject({ t_day: '2027-01-24', pending_four_eyes: true });
    expect(await w.anna.codeOf(w.anna.api.call('admin.examCalendars.patch', { params: { id: k.calendar.id }, body: { reason: 'Bevestigd' } }))).toBe('FOUR_EYES_REQUIRED');
    const confirmed = await w.bram.api.call('admin.examCalendars.patch', { params: { id: k.calendar.id }, body: { reason: 'Bevestigd' } });
    expect(confirmed.calendar.t_day).toBe('2027-01-31');
  }, 120_000);
});

describe('spec §3.16 rustperiode per persoon (integratie)', () => {
  /** Squads made by solo founders until one has arm_rest = rest (blocks of 4: within four squads). */
  async function restSquad(w: Awaited<ReturnType<typeof world>>, clubId: string | null, want: 'rest' | 'continue') {
    for (let i = 0; i < 6; i++) {
      const f = await w.student();
      const r = await f.a.api.call('squads.create', { body: { name: `Squad ${want} ${i}`, ...(clubId ? { club_id: clubId } : {}) } });
      const arm = w.db.get<{ arm_rest: string | null }>('SELECT arm_rest FROM squad WHERE id = ?', [r.squad.id])?.arm_rest;
      if (arm === want) return { founder: f, squadId: r.squad.id, token: r.invite.token };
      await f.a.api.call('squads.leave');
    }
    throw new Error(`no ${want} squad`);
  }

  it('§3.16 stap 3: an expansion member in a rest squad earns personally (jurist should-fix 3), an experiment member does not', async () => {
    const w = await world('2026-12-07');
    await w.restFlagOn();
    const sq = await restSquad(w, null, 'rest');
    // After T of the default calendar (17 January) a new member is in the expansion cohort.
    await w.at('2027-01-20', '09:00');
    const fresh = (await sq.founder.a.api.call('squads.invite')).invite.token;
    const late = await w.student({ squadToken: fresh });
    expect(w.db.get<{ cohort: string }>('SELECT cohort FROM user WHERE id = ?', [late.id])?.cohort).toBe('expansion');
    await w.at('2027-01-21', '10:00');
    await w.session25(late);
    await w.session25(sq.founder);
    expect(w.earnRows(late.id, '2027-01-21')).toBe(1);
    expect(w.earnRows(sq.founder.id, '2027-01-21')).toBe(0);
  }, 120_000);

  it('§3.16 stap 4 / §5 Overstap na T − 6: a rest member who switches to a continuing squad earns again from the next day (rest_period_exit, squad_switch)', async () => {
    const w = await world('2026-12-07');
    await w.restFlagOn();
    const rest = await restSquad(w, null, 'rest');
    const cont = await restSquad(w, null, 'continue');
    const member = await w.student({ squadToken: rest.token });
    // T − 6 of the default calendar is 11 January: from here the rest arm belongs to the person.
    await w.at('2027-01-19', '10:00');
    await w.session25(member);
    expect(w.earnRows(member.id, '2027-01-19')).toBe(0);
    await member.a.api.call('squads.leave');
    const token = (await cont.founder.a.api.call('squads.invite')).invite.token;
    await member.a.api.call('invites.accept', { params: { token } });
    const u = w.db.get<{ rest_exit_at: string | null; rest_exit_source: string | null; rest_arm_fixed: string | null }>('SELECT rest_exit_at, rest_exit_source, rest_arm_fixed FROM user WHERE id = ?', [member.id]);
    expect(u).toMatchObject({ rest_arm_fixed: 'rest', rest_exit_source: 'squad_switch' });
    expect(u?.rest_exit_at).not.toBeNull();
    expect(w.db.get<{ n: number }>("SELECT count(*) AS n FROM event WHERE name = 'rest_period_exit' AND json_extract(props, '$.bron') = 'squad_switch'")?.n).toBe(1);
    expect(w.db.get<{ n: number }>("SELECT count(*) AS n FROM arm_switch WHERE user_id = ? AND reason = 'squad_switch'", [member.id])?.n).toBe(1);
    // Same day: still rest; from the next focus day: earn_session again.
    await w.at('2027-01-19', '15:00');
    await w.session25(member);
    expect(w.earnRows(member.id, '2027-01-19')).toBe(0);
    await w.at('2027-01-20', '10:00');
    await w.session25(member);
    expect(w.earnRows(member.id, '2027-01-20')).toBe(1);
    // POST /me/rest-exit after that is ALREADY_EXITED.
    expect(await member.a.codeOf(member.a.api.call('me.restExit', { body: { confirm: true, source: 'profile' } }))).toBe('ALREADY_EXITED');
  }, 180_000);

  it('§3.16 stap 4: POST /me/rest-exit from the notice; a continuing member gets NOT_IN_REST_ARM', async () => {
    const w = await world('2026-12-07');
    await w.restFlagOn();
    const rest = await restSquad(w, null, 'rest');
    const cont = await restSquad(w, null, 'continue');
    await w.at('2027-01-19', '10:00');
    expect(await cont.founder.a.codeOf(cont.founder.a.api.call('me.restExit', { body: { confirm: true, source: 'notice' } }))).toBe('NOT_IN_REST_ARM');
    const r = await rest.founder.a.api.call('me.restExit', { body: { confirm: true, source: 'notice' } });
    expect(r.earns_from_day).toBe('2027-01-20');
    expect(w.db.get<{ n: number }>("SELECT count(*) AS n FROM event WHERE name = 'rest_period_exit' AND json_extract(props, '$.bron') = 'bericht'")?.n).toBe(1);
  }, 120_000);
});

describe('architecture §10.9 / §6.5 instellingsanker als HMAC (integratie)', () => {
  it('§6.5 the anchor is unique per address through HMAC with pepper_inst; only HMAC and domain are stored', async () => {
    const w = await world('2026-12-07');
    const a = await w.student();
    const b = await w.student();
    const addr = 'Noor.Visser+focus@Student.HogeschoolDemostad.test';
    await a.a.api.call('institution.start', { body: { email: addr } });
    const code = await lastCode(async () => w.ctx.inbox.list().filter((m) => m.to.toLowerCase() === addr.toLowerCase()) as never, addr);
    expect(code).toMatch(/^\d{6}$/);
    expect((await a.a.api.call('institution.confirm', { body: { code: code! } })).domain).toBe('student.hogeschooldemostad.test');
    const row = w.db.get<{ h: string; d: string }>('SELECT institution_email_hash AS h, institution_domain AS d FROM user WHERE id = ?', [a.id])!;
    const hasher = w.ctx.platform.hasher;
    expect(row.h).toBe(hasher.hash('inst', 'noor.visser@student.hogeschooldemostad.test'));
    expect(row.h).not.toBe(hasher.hash('email', 'inst|noor.visser@student.hogeschooldemostad.test'));
    expect(row.d).toBe('student.hogeschooldemostad.test');
    // Nowhere in the database: the local part of the address.
    const tables = w.db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'").map((t) => t.name);
    for (const t of tables) expect(JSON.stringify(w.db.all(`SELECT * FROM "${t}"`)).toLowerCase()).not.toContain('noor.visser');
    // The same address in other spelling for another account: refused, with institution_email_rejected.
    expect(await b.a.codeOf(b.a.api.call('institution.start', { body: { email: 'NOOR.VISSER@student.hogeschooldemostad.test' } }))).toBe('INSTITUTION_EMAIL_IN_USE');
    expect(w.db.get<{ n: number }>("SELECT count(*) AS n FROM event WHERE name = 'institution_email_rejected' AND json_extract(props, '$.reden') = 'in_use'")?.n).toBe(1);
    // Reconfirmation compares the HMAC: another address gives ADDRESS_MISMATCH.
    expect(await a.a.codeOf(a.a.api.call('institution.reconfirm', { body: { email: 'iemand.anders@student.hogeschooldemostad.test' } }))).toBe('ADDRESS_MISMATCH');
  }, 120_000);
});

describe('architecture §6.3 challenge met prijs (integratie, fout uit WP-11)', () => {
  it('§6.3 POST /admin/challenges with a prize no longer fails on the prize foreign key', async () => {
    const w = await world('2026-12-07');
    const partner = await w.anna.api.call('admin.partners.create', { body: { name: 'Boekhandel (fictief)', kind: 'sponsor', contact_ref: 'CRM-INT-1' } });
    const budget = await w.anna.api.call('admin.budgets.create', {
      params: { id: partner.partner.id },
      body: { kind: 'direct_reward', booked_cents: 10_000, reward_pct: 100, document_ref: 'OVK-INT-1 (fictief)', booked_at: '2026-12-01', pool: 'pilot' },
    });
    const r = await w.anna.api.call('admin.challenges.create', {
      body: {
        type: 'performance', title_nl: 'Vijf dagen', title_en: 'Five days', period_start_day: '2026-12-14', period_end_day: '2026-12-20',
        rules: { day_minutes: 50, required_days: 5, seats: 4 },
        prizes: [{ kind: 'earned_individual', reward_kind: 'in_kind', description_nl: 'Boekenbon', description_en: 'Book token', value_cents: 1000, partner_id: partner.partner.id, budget_id: budget.budget.id, declaration_ref: 'VERKL-INT-1', min_age_band: '18_plus' }],
      },
    });
    expect(r.challenge.prizes).toHaveLength(1);
    expect(w.db.get<{ n: number }>('SELECT count(*) AS n FROM prize WHERE challenge_id = ?', [r.challenge.id])?.n).toBe(1);
  }, 60_000);
});
