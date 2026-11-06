// The demo plan (architecture §11 "Seeddata"): a fictitious city "Demostad" with three fictitious
// study associations in one pool, 45 students (36 in nine squads of three to five, nine solo),
// 14 focus days of sessions with every abort code and a handful of flagged sessions in the queue,
// a simulated campus NAT and mobile CGNAT, the red-team hotspot, one partner with a booked budget,
// three catalogue items, a warm-up leaderboard, a performance challenge, a duel, twenty waitlist
// entries in four priority classes, three admins with TOTP and one board member per club.
// Everything runs through the real routes on a fixed clock with a fixed PRNG seed. All names,
// addresses, IP ranges (RFC 5737 documentation ranges) and codes are fictitious.
import type { PlannedMin, UaClass } from '../../packages/contracts/src/common.ts';
import { DEMO_ADMINS } from './admins.ts';
import { UA, lastCode, lastToken, type Actor } from './driver.ts';
import { DAY, HOUR, MIN, adminLogin, register, registerDevice, runAgenda, sessionTask, type SessionOutcome, type SessionPlan, type Task, type World } from './flows.ts';
import { Prng } from './prng.ts';

export const DEMO_SEED = 20261130;
/** Monday 30 November 2026, 09:00 in Demostad (UTC+1): setup day. */
export const DEMO_SETUP_AT = Date.parse('2026-11-30T08:00:00Z');
/** First and last seeded focus day (14 days, season start 2 December). */
export const DEMO_FIRST_DAY = '2026-12-02';
export const DEMO_LAST_DAY = '2026-12-15';
/** Where the clock stands after the seed: Wednesday 16 December, 10:00 local. */
export const DEMO_NOW = Date.parse('2026-12-16T09:00:00Z');

export const IP = {
  /** Simulated UB-NAT of the fictitious university library (TEST-NET-1 is campus in dev). */
  campus: '192.0.2.10',
  /** Simulated mobile CGNAT address (TEST-NET-2 is CGNAT in dev). */
  cgnat: '198.51.100.7',
  /** Hotspot of the red-team scenario (class `other`). */
  hotspot: '203.0.113.250',
  home: (i: number) => `203.0.113.${20 + i}`,
} as const;

export interface DemoClub {
  key: 'kompas' | 'prisma' | 'ratio';
  name: string;
  declared: number;
  sourceKind: 'institution' | 'board_grant' | 'self';
  sourceRef: string;
}

/**
 * Two fictitious exam calendars with a different T (spec §4.13, founder G-MF3): Kompas and Prisma
 * follow the hogeschool, Ratio the university. Next to them the default calendar of migration 0211.
 */
export const DEMO_CALENDARS = [
  { key: 'hogeschool', institution: 'Hogeschool Demostad (fictief)', t_day: '2027-01-24', a_start_day: '2027-04-05', a_end_day: '2027-04-18', a_resit_days: ['2027-04-16'] },
  { key: 'universiteit', institution: 'Universiteit Demostad (fictief)', t_day: '2027-02-07', a_start_day: '2027-04-12', a_end_day: '2027-04-25', a_resit_days: [] },
] as const;
const CLUB_CALENDAR: Record<string, (typeof DEMO_CALENDARS)[number]['key']> = { kompas: 'hogeschool', prisma: 'hogeschool', ratio: 'universiteit' };

export const DEMO_CLUBS: readonly DemoClub[] = [
  { key: 'kompas', name: 'Studievereniging Kompas', declared: 120, sourceKind: 'institution', sourceRef: 'Ledental opgevraagd bij Hogeschool Demostad (fictief), 20-11-2026' },
  { key: 'prisma', name: 'Studievereniging Prisma', declared: 140, sourceKind: 'board_grant', sourceRef: 'Subsidiebesluit faculteit Demostad (fictief), 2026' },
  // No external member source: no main prize (spec §4.6).
  { key: 'ratio', name: 'Studievereniging Ratio', declared: 95, sourceKind: 'self', sourceRef: 'Opgave bestuur Ratio (fictief)' },
];

const FIRST = ['Sanne', 'Daan', 'Noor', 'Milan', 'Lotte', 'Jesse', 'Fleur', 'Thijs', 'Eva', 'Bram', 'Iris', 'Luuk', 'Femke', 'Ruben', 'Anouk', 'Sem', 'Lisa', 'Niels', 'Julia', 'Tim', 'Roos', 'Koen', 'Maud', 'Stijn', 'Esmee', 'Lars', 'Yara', 'Gijs', 'Lieke', 'Jens', 'Fenna', 'Joep', 'Merel', 'Wout', 'Isa', 'Hidde', 'Elif', 'Mees', 'Zoë', 'Teun', 'Amira', 'Pim', 'Nina', 'Sven', 'Tess'];
const LAST = ['de Vries', 'Jansen', 'Bakker', 'Visser', 'Smit', 'Meijer', 'Mulder', 'Bos', 'Vos', 'Peters', 'Hendriks', 'Dekker', 'Brouwer', 'de Wit', 'Dijkstra', 'Kok', 'Jacobs', 'van Dam', 'Schouten', 'Hoekstra', 'Koster', 'Prins', 'Huisman', 'Kuipers', 'Postma', 'Willems', 'Kramer', 'Verbeek', 'Groen', 'Sanders', 'Bosman', 'Boer', 'Maas', 'Wolters', 'Kroon', 'Sedney', 'Yilmaz', 'Haddou', 'Tjon', 'Lie', 'Bouzid', 'Kaya', 'Nguyen', 'Pinas', 'Lam'];

export const SQUAD_NAMES = ['De Uilen', 'Bibliotheekploeg', 'Koffie & Kennis', 'Tentamentijgers', 'Stille Kracht', 'De Doorzetters', 'Blokbrigade', 'Focusfabriek', 'Het Hoekje'];
/** Nine squads of five to three (36 students), with their club. */
const SQUADS: readonly { size: number; club: DemoClub['key'] }[] = [
  { size: 5, club: 'kompas' }, { size: 5, club: 'kompas' }, { size: 4, club: 'kompas' }, { size: 4, club: 'kompas' },
  { size: 4, club: 'prisma' }, { size: 4, club: 'prisma' }, { size: 4, club: 'prisma' }, { size: 3, club: 'prisma' },
  { size: 3, club: 'ratio' },
];
/** Nine solo students: club or none. */
const SOLO_CLUBS: readonly (DemoClub['key'] | null)[] = ['prisma', 'ratio', 'ratio', 'ratio', 'ratio', 'ratio', 'ratio', null, null];

export type Role = 'founder' | 'member' | 'solo';
export interface DemoStudent {
  i: number;
  key: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  goal: 25 | 50 | 90 | 120;
  role: Role;
  squad: number | null;
  club: DemoClub['key'] | null;
  uaClass: UaClass;
  /** Daily probability of focusing on a weekday. */
  activity: number;
  /** Where the sessions come from. */
  net: 'campus' | 'cgnat' | 'home';
  tags: Set<string>;
}

const emailOf = (first: string, last: string) =>
  `${first}.${last}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z.]/g, '') + '@student.demostad.test';

/** The 45 students, deterministic from the seed. */
export function demoStudents(rng: Prng): DemoStudent[] {
  const out: DemoStudent[] = [];
  let i = 0;
  const add = (role: Role, squad: number | null, club: DemoClub['key'] | null) => {
    const firstName = FIRST[i]!;
    const lastName = LAST[i]!;
    const year = 2002 + rng.int(6);
    const goal = rng.pick([25, 25, 50, 50, 50, 90] as const);
    out.push({
      i,
      key: `s${String(i + 1).padStart(2, '0')}`,
      email: emailOf(firstName, lastName),
      firstName,
      lastName,
      birthDate: `${year}-${String(1 + rng.int(12)).padStart(2, '0')}-${String(1 + rng.int(28)).padStart(2, '0')}`,
      goal,
      role,
      squad,
      club,
      uaClass: rng.pick(['ios_safari', 'ios_safari', 'android_chrome', 'android_chrome', 'desktop'] as const),
      activity: rng.pick([0.9, 0.8, 0.7, 0.55, 0.4]),
      net: 'home',
      tags: new Set(),
    });
    i += 1;
  };
  SQUADS.forEach((s, k) => {
    add('founder', k, s.club);
    for (let m = 1; m < s.size; m++) add('member', k, s.club);
  });
  for (const c of SOLO_CLUBS) add('solo', null, c);
  // Fixed roles for the scenarios of architecture §11.
  const byKey = (k: string) => out.find((s) => s.key === k)!;
  // Two 16-year-olds, both squad members (arm A and `continue` personally, silent mode by default).
  for (const k of ['s13', 's24']) {
    const s = byKey(k);
    s.birthDate = k === 's13' ? '2010-03-14' : '2010-08-02';
    s.tags.add('minor');
  }
  // UB-NAT: the 18 Kompas students plus two of Prisma focus in the library on weekdays, on phones.
  for (const s of out.filter((x) => x.club === 'kompas').concat([byKey('s19'), byKey('s20')])) {
    s.net = 'campus';
    if (s.uaClass === 'desktop') s.uaClass = 'android_chrome';
  }
  // Mobile CGNAT: five Prisma students on mobile data.
  for (const k of ['s23', 's25', 's26', 's27', 's28']) byKey(k).net = 'cgnat';
  // Squad 9 (Ratio, three members): two members stop after the first days, the squad falls below two actives.
  byKey('s35').tags.add('fades');
  byKey('s36').tags.add('fades');
  // Scenario owners.
  byKey('s40').tags.add('opt_out');
  byKey('s41').tags.add('overreach'); // six sessions of 90 minutes on three days (H5, S2)
  byKey('s41').goal = 120;
  byKey('s38').tags.add('skew'); // client clock 7 minutes off on two days (H4)
  byKey('s30').tags.add('claim_delay'); // claims 16 minutes late in week 50 (H9)
  byKey('s08').tags.add('offline'); // three minutes offline in a 25-minute session (H3)
  byKey('s17').tags.add('offline');
  byKey('s21').tags.add('webdriver'); // one session from an automated browser (H1)
  byKey('s22').tags.add('exam_day');
  byKey('s06').tags.add('two_devices');
  for (const k of ['s02', 's03', 's07', 's15', 's29']) byKey(k).tags.add('redeem');
  for (const s of out) if (['overreach', 'redeem', 'claim_delay', 'offline', 'skew', 'webdriver'].some((t) => s.tags.has(t))) s.activity = 0.95;
  return out;
}

export interface DemoReport {
  students: number;
  squads: number;
  clubs: Record<string, { id: string; code: string }>;
  sessions: number;
  redTeam: number;
  waitlistWaiting: number;
  admins: { email: string; secret: string }[];
  boardMembers: string[];
}

/** Context the demo runs in: the world (routes, inbox, clock) and how to tick the jobs. */
export interface DemoEnv {
  world: World;
  newActor(ip: string, ua?: string): Actor;
  /** Runs every job that is due at the current server time (the scheduler tick). */
  tick(): Promise<void>;
  log?(msg: string): void;
}

const GROUP_LINK = /[?&]groep=([A-Za-z0-9_-]{8,64})/;
const local = (day: string, hhmm: string) => Date.parse(`${day}T${hhmm}:00+01:00`);
const addDay = (day: string, n: number) => new Date(Date.parse(`${day}T12:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const weekday = (day: string) => new Date(`${day}T12:00:00Z`).getUTCDay(); // 0 = Sunday

export async function runDemo(env: DemoEnv, rng = new Prng(DEMO_SEED)): Promise<DemoReport> {
  const { world } = env;
  const clock = world.clock;
  const log = env.log ?? (() => undefined);
  const step = async (ms: number) => clock.set(clock.now() + ms);

  await clock.set(DEMO_SETUP_AT);
  // ---- Admins (seeded by seedAdmins before this runs) and their sessions ----
  const admins = DEMO_ADMINS.map((a, k) => ({ a, actor: env.newActor(IP.home(200 + k), UA.desktop) }));
  for (const { a, actor } of admins) await adminLogin(world, actor, a);
  const anna = admins[0]!.actor;
  const bram = admins[1]!.actor;
  // Admin sessions last 12 hours (architecture §10.1); log in again before a later admin step.
  const annaAgain = () => adminLogin(world, anna, DEMO_ADMINS[0]!);

  // Feature flags for the pilot; arm B needs four eyes (spec §8.2).
  for (const key of ['cards', 'duels', 'belofte', 'reminders', 'no_points_mode', 'squad_prompt'] as const) {
    await anna.api.call('admin.featureFlags.put', { params: { key }, body: { enabled: true } });
    await step(2_000);
  }
  await anna.api.call('admin.featureFlags.put', { params: { key: 'arm_b' }, body: { enabled: true } });
  await bram.api.call('admin.featureFlags.put', { params: { key: 'arm_b' }, body: { enabled: true } });

  // ---- Clubs (all in pool lt150, so the warm-up leaderboard is one valid pool) ----
  const calendars: Record<string, string> = {};
  for (const cal of DEMO_CALENDARS) {
    const r = await anna.api.call('admin.examCalendars.create', {
      body: {
        institution: cal.institution,
        t_day: cal.t_day,
        a_start_day: cal.a_start_day,
        a_end_day: cal.a_end_day,
        a_resit_days: [...cal.a_resit_days],
        source_ref: `Jaarrooster ${cal.institution}, geraadpleegd 05-11-2026`,
        checked_at: '2026-11-05',
        club_confirmation_ref: 'Bevestiging bestuur per mail (fictief)',
      },
    });
    calendars[cal.key] = r.calendar.id;
    await step(10_000);
  }
  const clubs: Record<string, { id: string; code: string }> = {};
  for (const [k, c] of DEMO_CLUBS.entries()) {
    const r = await anna.api.call('admin.clubs.create', {
      body: {
        exam_calendar_id: calendars[CLUB_CALENDAR[c.key]!]!,
        name: c.name,
        city: 'Demostad',
        declared_members: c.declared,
        members_source_kind: c.sourceKind,
        members_source_ref: c.sourceRef,
        agreement_ref: `OVK-DEMO-00${k + 1} (fictief)`,
        pool: 'lt150',
        help_resources: [{ label: 'Studentenpsycholoog Demostad (fictief)', url: 'https://example.org/hulp' }],
      },
    });
    clubs[c.key] = { id: r.club.id, code: r.club.join_code ?? '' };
    await step(20_000);
  }

  // ---- Partner, budget and catalogue (spec §4.3) ----
  const partner = await anna.api.call('admin.partners.create', { body: { name: 'Lunchroom Het Plein (fictief)', kind: 'sponsor', contact_ref: 'DEMO-CRM-17' } });
  const budget = await anna.api.call('admin.budgets.create', {
    params: { id: partner.partner.id },
    body: { kind: 'direct_reward', booked_cents: 40_000, reward_pct: 100, document_ref: 'DEMO-OVK-2026-001 (fictief)', booked_at: '2026-11-30', pool: 'pilot' },
  });
  const items = [
    { kind: 'in_kind' as const, title_nl: 'Koffie met koek', title_en: 'Coffee and a biscuit', cost: 250, points: 300, stock: 42, collective: false, prefix: 'KOF' },
    { kind: 'service' as const, title_nl: 'Halfuur met de schrijfcoach', title_en: 'Half an hour with the writing coach', cost: 450, points: 600, stock: 14, collective: false, prefix: 'SCH' },
    { kind: 'partner_discount' as const, title_nl: 'Lunch voor je squad met korting', title_en: 'Discounted squad lunch', cost: 500, points: 1000, stock: 7, collective: true, prefix: 'SQL' },
  ];
  const rewardIds: string[] = [];
  for (const it of items) {
    const r = await anna.api.call('admin.rewards.create', {
      body: {
        partner_id: partner.partner.id,
        kind: it.kind,
        title_nl: it.title_nl,
        title_en: it.title_en,
        terms_nl: 'Geldig bij Lunchroom Het Plein in Demostad (fictief), op vertoon van de code. Niet inwisselbaar voor geld.',
        terms_en: 'Valid at Lunchroom Het Plein in Demostad (fictitious) on showing the code. Not exchangeable for money.',
        cost_cents: it.cost,
        points_price: it.points,
        min_age_band: '16_17',
        declaration_ref: `DEMO-VERKL-${it.prefix} (fictief)`,
        collective: it.collective,
        budget_id: budget.budget.id,
        stock: it.stock,
      },
    });
    const id = r.reward.id;
    rewardIds.push(id);
    const csv = Array.from({ length: it.stock }, (_, n) => `DEMO-${it.prefix}-${String(n + 1).padStart(4, '0')}`).join('\n');
    await anna.api.call('admin.rewards.vouchers', { params: { id }, body: { csv } });
    await anna.api.call('admin.rewards.publish', { params: { id }, body: { cash_check: true } });
    // Fixed weekly release, spread over the days (spec §4.3); three weeks of the season.
    const perWeek = Math.floor(it.stock / 3);
    for (const week of ['2026-W49', '2026-W50', '2026-W51']) {
      const perDay = Array.from({ length: 7 }, (_, d) => Math.floor(perWeek / 7) + (d < perWeek % 7 ? 1 : 0));
      await anna.api.call('admin.rewards.releases', { params: { id }, body: { week, per_day: perDay } });
    }
    await step(30_000);
  }

  // ---- Challenges: warm-up leaderboard and a performance challenge (spec §4.6, §4.7) ----
  const warm = await anna.api.call('admin.challenges.create', {
    body: { type: 'club_warmup', title_nl: 'Aanloopklassement Demostad', title_en: 'Demostad warm-up leaderboard', period_start_day: DEMO_FIRST_DAY, period_end_day: '2026-12-20', pool: 'lt150', rules: {}, prizes: [] },
  });
  await anna.api.call('admin.challenges.publish', { params: { id: warm.challenge.id } });
  const perf = await anna.api.call('admin.challenges.create', {
    body: {
      type: 'performance',
      title_nl: 'Vijf dagen vijftig minuten',
      title_en: 'Five days of fifty minutes',
      period_start_day: '2026-12-07',
      period_end_day: '2026-12-13',
      rules: { day_minutes: 50, required_days: 5, seats: 12 },
      // Without a prize, so the demo needs no prize sample; prizes work since the integration fix.
      prizes: [],
    },
  });
  await anna.api.call('admin.challenges.publish', { params: { id: perf.challenge.id } });

  // ---- Waitlist: founders and solos join, the admin invites one batch (architecture §3.1) ----
  const students = demoStudents(rng);
  const actors = new Map<string, Actor>();
  const deviceOf = new Map<string, string>();
  const ua = (s: DemoStudent) => (s.uaClass === 'ios_safari' ? UA.iphone : s.uaClass === 'desktop' ? UA.desktop : UA.android);
  for (const s of students) actors.set(s.key, env.newActor(IP.home(s.i), ua(s)));
  const firstWave = students.filter((s) => s.role !== 'member');
  for (const s of firstWave) {
    const a = actors.get(s.key)!;
    await a.api.call('waitlist.join', {
      body: { email: s.email, locale: 'nl', source: s.club ? 'club_qr' : 'landing', ...(s.club ? { club_hint: DEMO_CLUBS.find((c) => c.key === s.club)!.name } : {}), consent_version: 'privacy-0.3' },
    });
    await step(90_000);
  }
  await anna.api.call('admin.waitlist.inviteBatch', { body: { count: firstWave.length } });

  // ---- Registrations: founders and solos via their waitlist invite, members via the squad link ----
  const squadIds: string[] = [];
  const squadInvites: string[] = [];
  const onboard = async (s: DemoStudent, invite: string) => {
    const a = actors.get(s.key)!;
    await register(world, a, { email: s.email, firstName: s.firstName, lastName: s.lastName, birthDate: s.birthDate, goal: s.goal, invite });
    deviceOf.set(s.key, await registerDevice(a, rng, s.uaClass));
    if (s.club) await a.api.call('clubs.join', { body: { code: clubs[s.club]!.code, qr_source: rng.pick(['poster', 'story', 'qr']) } });
    // The practice session of the onboarding (spec §3.1 O9): one minute, same protocol.
    await runAgenda(clock, [sessionTask({ actor: a, deviceId: deviceOf.get(s.key)!, start: clock.now() + 5_000, plannedMin: 1, outcome: { kind: 'complete' }, intervalS: 30 }, rng, clock)]);
    await step(60_000 + rng.int(240_000));
  };
  for (const s of firstWave) {
    const token = await lastToken(world.inbox, s.email, /\/i\/([A-Za-z0-9_-]{16,128})/);
    await onboard(s, token);
    if (s.role === 'founder') {
      const r = await actors.get(s.key)!.api.call('squads.create', { body: { name: SQUAD_NAMES[s.squad!]!, ...(s.club ? { club_id: clubs[s.club]!.id } : {}) } });
      squadIds[s.squad!] = r.squad.id;
      squadInvites[s.squad!] = r.invite.token;
    }
  }
  // Members join on 30 November and 1 December (the squad invite lasts seven days).
  await clock.set(Math.max(clock.now(), local('2026-12-01', '10:00')));
  for (const s of students.filter((x) => x.role === 'member')) {
    const token = squadInvites[s.squad!]!;
    await onboard(s, token);
    await actors.get(s.key)!.api.call('invites.accept', { params: { token } });
  }

  // Board members: the founder of the first squad of each club (spec §4.11).
  const boardMembers: string[] = [];
  await annaAgain();
  for (const c of DEMO_CLUBS) {
    const founder = students.find((s) => s.club === c.key && s.role === 'founder')!;
    boardMembers.push(founder.email);
    await anna.api.call('admin.clubs.patch', { params: { id: clubs[c.key]!.id }, body: { board_member_emails: [founder.email] } });
  }
  // Settings: a few opt into comparing minutes; one shows the squad name on cards.
  for (const s of students) {
    if (rng.chance(0.4)) await actors.get(s.key)!.api.call('me.settings', { body: { compare_opt_in: true } });
  }
  await actors.get('s01')!.api.call('me.settings', { body: { squad_name_on_cards: true } });
  // A second device for the second_session scenario.
  const secondDevice = await registerDevice(actors.get('s06')!, rng, 'desktop');

  // ---- Before the season: enrolments, the duel ----
  await clock.set(local('2026-12-01', '18:00'));
  const enrolled = students.filter((s) => s.activity >= 0.8 && !s.tags.has('minor')).slice(0, 10);
  for (const s of enrolled) await actors.get(s.key)!.api.call('challenges.enroll', { params: { id: perf.challenge.id } });
  // Duel between two adult squad members of squad 2 (spec §3.6): link from the challenger, accepted by a squad mate.
  const duelBy = students.find((s) => s.squad === 1 && s.role === 'founder')!;
  const duelWith = students.find((s) => s.squad === 1 && s.role === 'member' && !s.tags.has('minor'))!;
  const duel = await actors.get(duelBy.key)!.api.call('duels.create', { body: {} });
  await actors.get(duelWith.key)!.api.call('invites.accept', { params: { token: duel.invite.token } });

  // ---- 14 focus days ----
  const plans: SessionPlan[] = [];
  const extra: Task[] = [];
  const days = Array.from({ length: 14 }, (_, d) => addDay(DEMO_FIRST_DAY, d));
  for (const s of students) {
    const a = actors.get(s.key)!;
    const dev = deviceOf.get(s.key)!;
    for (const [d, day] of days.entries()) {
      const wd = weekday(day);
      const weekend = wd === 0 || wd === 6;
      let p = s.activity * (weekend ? 0.55 : 1);
      if (s.tags.has('fades') && d >= 3) p = 0;
      if (s.tags.has('overreach') && d >= 8 && d <= 10) p = 1;
      if (!rng.chance(p)) continue;
      const ip = s.net === 'campus' && !weekend ? IP.campus : s.net === 'cgnat' ? IP.cgnat : IP.home(s.i);
      // Six sessions of 90 minutes on three days in a row (H5 and S2).
      if (s.tags.has('overreach') && d >= 8 && d <= 10) {
        for (let k = 0; k < 6; k++) plans.push({ actor: a, deviceId: dev, start: local(day, '07:00') + k * 105 * MIN, plannedMin: 90, outcome: { kind: 'complete' }, ip });
        continue;
      }
      const count = rng.chance(0.65) ? 1 : rng.chance(0.75) ? 2 : 3;
      let t = local(day, rng.pick(['09:15', '10:30', '13:05', '14:40', '16:20', '19:10', '20:45']));
      // A late session now and then: after 01:00 the night rule applies (spec §4.2).
      if (rng.chance(0.03)) t = local(addDay(day, 1), '01:30');
      for (let k = 0; k < count; k++) {
        const planned: PlannedMin = s.goal >= 90 ? rng.pick([50, 90] as const) : s.goal === 50 ? rng.pick([25, 50, 50] as const) : rng.pick([25, 25, 50] as const);
        const roll = rng.next();
        let outcome: SessionOutcome = { kind: 'complete' };
        if (roll < 0.07) outcome = { kind: 'hidden', atMin: 3 + rng.int(planned - 5) };
        else if (roll < 0.1) outcome = { kind: 'gap', atMin: 4 + rng.int(planned - 6) };
        else if (roll < 0.15) outcome = { kind: 'stop', atMin: 2 + rng.int(planned - 3) };
        else if (roll < 0.17) outcome = { kind: 'late_end' };
        const plan: SessionPlan = { actor: a, deviceId: dev, start: t + rng.int(10) * MIN, plannedMin: planned, outcome, ip };
        // Scenario sessions always complete, so their flag shows up in the queue.
        if (s.tags.has('skew') && (d === 2 || d === 3)) Object.assign(plan, { skewMs: 7 * MIN, outcome: { kind: 'complete' } });
        if (s.tags.has('claim_delay') && d >= 5 && d <= 11) Object.assign(plan, { claimDelayMin: 16, outcome: { kind: 'complete' } });
        plans.push(plan);
        t = plan.start + (plan.plannedMin + 20 + rng.int(90)) * MIN;
      }
    }
  }
  // Fixed scenario sessions (they win over generated ones at the same time, see the overlap filter).
  const scenario = (key: string, day: string, hhmm: string, extraPlan: Partial<SessionPlan>) => {
    const s = students.find((x) => x.key === key)!;
    plans.push({ actor: actors.get(key)!, deviceId: deviceOf.get(key)!, start: local(day, hhmm), plannedMin: 25, outcome: { kind: 'complete' }, ip: IP.home(s.i), fixed: true, ...extraPlan } as SessionPlan);
  };
  // Three minutes offline in a 25-minute session, covered by buffered heartbeats (H3).
  scenario('s08', '2026-12-06', '08:30', { offline: { fromMin: 8.5, toMin: 11 } });
  scenario('s17', '2026-12-06', '08:40', { offline: { fromMin: 8.5, toMin: 11 } });
  scenario('s17', '2026-12-11', '08:40', { offline: { fromMin: 8.5, toMin: 11 } });
  // A session from an automated browser (H1, architecture §4.6).
  scenario('s21', '2026-12-08', '08:15', { webdriver: true });
  // second_session: a session on the laptop while the phone session runs (spec §4.1).
  {
    const a = actors.get('s06')!;
    plans.push({ actor: a, deviceId: deviceOf.get('s06')!, start: local('2026-12-05', '11:00'), plannedMin: 50, outcome: { kind: 'complete' } });
    plans.push({ actor: a, deviceId: secondDevice, start: local('2026-12-05', '11:20'), plannedMin: 25, outcome: { kind: 'complete' }, ip: IP.home(6) });
  }
  // Drop overlapping sessions of one user (the generator above may produce them across midnight).
  plans.sort((x, y) => Number(y.fixed ?? false) - Number(x.fixed ?? false) || x.start - y.start);
  const taken = new Map<Actor, [number, number][]>();
  const kept = plans.filter((p) => {
    const span: [number, number] = [p.start, p.start + (p.plannedMin + 15) * MIN];
    const mine = taken.get(p.actor) ?? [];
    if (p.deviceId !== secondDevice && mine.some(([a, b]) => span[0] < b && a < span[1])) return false;
    taken.set(p.actor, [...mine, span]);
    return true;
  });
  kept.sort((x, y) => x.start - y.start);
  const tasks: Task[] = kept.map((p) => sessionTask(p, rng, clock));

  // Job ticks: every hour, plus 04:01 (week open) and 05:46 (day close) local (architecture §6.1).
  const tickTimes: number[] = [];
  for (let t = local(DEMO_FIRST_DAY, '00:00'); t <= DEMO_NOW; t += HOUR) tickTimes.push(t + 30_000);
  for (const day of [...days, addDay(DEMO_LAST_DAY, 1)]) tickTimes.push(local(day, '04:01'), local(day, '05:46'));
  tickTimes.sort((x, y) => x - y);
  let ti = 0;
  extra.push({ at: tickTimes[0]!, run: async () => (await env.tick(), ++ti < tickTimes.length ? tickTimes[ti]! : null) });

  // Single scenario moments.
  const at = (when: number, fn: () => Promise<unknown>): Task => ({ at: when, run: async () => (await fn(), null) });
  extra.push(at(local('2026-12-04', '12:00'), () => actors.get('s40')!.api.call('me.researchOptOut', { body: { confirm: true } })));
  const examStudent = actors.get('s22')!;
  extra.push(at(local('2026-12-10', '08:00'), () => examStudent.api.call('me.examDays.put', { params: { day: '2026-12-10' } })));
  // "Klopt dit niet?" on the first aborted session of s12 (spec §4.1): goes to the review queue.
  extra.push(
    at(local('2026-12-12', '21:00'), async () => {
      const a = actors.get('s12')!;
      const list = await a.api.call('sessions.list', { query: { from: DEMO_FIRST_DAY, to: '2026-12-12' } });
      const aborted = list.items.find((x) => x.status === 'aborted');
      if (aborted) await a.api.call('sessions.report', { params: { id: aborted.id }, body: { text: 'Mijn wifi viel weg in de bieb.' } });
    }),
  );

  // Red team (architecture §11): ten accounts behind one hotspot within an hour, one club, aliases.
  const red = Array.from({ length: 10 }, (_, k) => ({
    email: `rood.test${k + 1}@hotspot-mail.test`.replace('rood.test', k % 2 === 0 ? 'rood.test' : 'r.o.o.d.test'),
    first: `Rood${k + 1}`,
    actor: env.newActor(IP.hotspot, UA.desktop),
    device: '',
  }));
  extra.push(
    at(local('2026-12-08', '21:00'), async () => {
      // The first one shares the group link from the confirmation mail (spec §3.1 groepslink).
      let group: string | undefined;
      for (const r of red) {
        await r.actor.api.call('waitlist.join', { body: { email: r.email, locale: 'nl', source: 'landing', ...(group ? { group_token: group } : {}), consent_version: 'privacy-0.3' } });
        group ??= await lastToken(world.inbox, r.email, GROUP_LINK);
        await step(20_000);
      }
    }),
  );
  extra.push(
    at(local('2026-12-09', '19:00'), async () => {
      await annaAgain();
      await anna.api.call('admin.waitlist.inviteBatch', { body: { count: 10 } });
      const token = await lastToken(world.inbox, red[0]!.email, /\/i\/([A-Za-z0-9_-]{16,128})/);
      let squadToken = '';
      for (const [k, r] of red.entries()) {
        await register(world, r.actor, { email: r.email, firstName: r.first, birthDate: '2001-01-01', goal: 25, invite: token });
        r.device = await registerDevice(r.actor, rng, 'desktop');
        await r.actor.api.call('clubs.join', { body: { code: clubs.ratio!.code } });
        if (k === 0) squadToken = (await r.actor.api.call('squads.create', { body: { name: 'Nachtploeg', club_id: clubs.ratio!.id } })).invite.token;
        else if (k < 5) await r.actor.api.call('invites.accept', { params: { token: squadToken } });
        await step(60_000);
      }
    }),
  );
  // Concurrent 50-minute sessions from the hotspot on two evenings (H2, H12; H7 from the squad).
  for (const evening of ['2026-12-09', '2026-12-10']) {
    extra.push(
      at(local(evening, '20:05'), async () => {
        const runs = red.map((r, k) => sessionTask({ actor: r.actor, deviceId: r.device, start: clock.now() + k * 30_000, plannedMin: 50, outcome: { kind: 'complete' }, ip: IP.hotspot }, rng, clock));
        await runAgenda(clock, runs);
      }),
    );
  }
  // Twenty waitlist entries in four priority classes that stay waiting (spec §3.1 toegangspoort).
  const waiting: { email: string; source: 'landing' | 'card' | 'club_qr'; group?: string; club?: string }[] = [];
  for (let k = 0; k < 6; k++) waiting.push({ email: `wacht.groep${k + 1}@mail.demostad.test`, source: 'landing', ...(k % 3 !== 0 ? { group: `wacht.groep${k - (k % 3) + 1}@mail.demostad.test` } : {}) });
  for (let k = 0; k < 5; k++) waiting.push({ email: `wacht.vereniging${k + 1}@mail.demostad.test`, source: 'club_qr', club: 'Studievereniging Kompas' });
  for (let k = 0; k < 4; k++) waiting.push({ email: `wacht.kaart${k + 1}@mail.demostad.test`, source: 'card' });
  for (let k = 0; k < 5; k++) waiting.push({ email: `wacht.site${k + 1}@mail.demostad.test`, source: 'landing' });
  waiting.forEach((w, k) => {
    const visitor = env.newActor(IP.home(100 + k), UA.iphone);
    extra.push(
      at(local(addDay('2026-12-10', Math.floor(k / 4)), '12:00') + k * 7 * MIN, () =>
        (async () => {
          // A group member joins with the link from the confirmation mail of the first one.
          const group = w.group ? await lastToken(world.inbox, w.group, GROUP_LINK) : undefined;
          await visitor.api.call('waitlist.join', {
            body: { email: w.email, locale: k % 7 === 0 ? 'en' : 'nl', source: w.source, ...(group ? { group_token: group } : {}), ...(w.club ? { club_hint: w.club } : {}), consent_version: 'privacy-0.3' },
          });
        })(),
      ),
    );
  });
  // Redemptions on the last evening (spec §4.3, architecture §5.2): the most active students try;
  // blocked attempts stay as `redemption_blocked`, a missing phone is verified first. Three vouchers.
  extra.push(
    at(local(DEMO_LAST_DAY, '18:00'), async () => {
      let ok = 0;
      const candidates = students.filter((s) => s.tags.has('redeem')).concat(students.filter((s) => !s.tags.has('redeem') && s.activity >= 0.9));
      for (const [k, s] of candidates.entries()) {
        if (ok >= 3) break;
        const a = actors.get(s.key)!;
        const redeem = () => a.codeOf(a.api.call('redemptions.create', { body: { reward_id: rewardIds[0]! } }));
        let code = await redeem();
        if (code === 'PHONE_NOT_VERIFIED') {
          const phone = `+3161234${String(5600 + k).padStart(4, '0')}`;
          await a.api.call('phone.start', { body: { phone } });
          await a.api.call('phone.confirm', { body: { code: await lastCode(world.inbox, phone, 'sms') } });
          code = await redeem();
        }
        if (code === 'OK') ok += 1;
        log(`redemption ${s.key}: ${code}`);
        await step(4 * MIN);
      }
    }),
  );

  log(`sessions planned: ${kept.length}`);
  await runAgenda(clock, [...tasks, ...extra], DEMO_NOW);
  await clock.set(DEMO_NOW);
  await env.tick();

  return {
    students: students.length,
    squads: squadIds.length,
    clubs,
    sessions: kept.length,
    redTeam: red.length,
    waitlistWaiting: waiting.length,
    admins: [],
    boardMembers,
  };
}

export const _test = { local, addDay, weekday };
