// Building blocks of the chain specs on top of the shared flows (tooling/seed/flows.ts): admins
// with TOTP, students invited through the waitlist or a squad link, sessions on the server clock.
import { DEMO_ADMINS } from '../../tooling/seed/admins.ts';
import { UA, lastToken, type Actor } from '../../tooling/seed/driver.ts';
import { MIN, adminLogin, register, registerDevice, runAgenda, sessionTask, type Registration, type SessionPlan } from '../../tooling/seed/flows.ts';
import { Prng } from '../../tooling/seed/prng.ts';
import type { WorkerApi } from './api.ts';

export { MIN };
export const HOUR = 60 * MIN;
/** Wednesday 2 December 2026, 09:00 in Amsterdam: first day of the season. */
export const SEASON_START = Date.parse('2026-12-02T08:00:00Z');
export const local = (day: string, hhmm: string) => Date.parse(`${day}T${hhmm}:00+01:00`);

let ipSeq = 0;
/** A fresh "home" address (TEST-NET-3, class other) per actor. */
export const homeIp = () => `203.0.113.${(ipSeq++ % 200) + 20}`;

export class Chain {
  readonly api: WorkerApi;
  readonly rng: Prng;
  private n = 0;
  constructor(api: WorkerApi, seed = 7) {
    this.api = api;
    this.rng = new Prng(seed);
  }

  get world() {
    return this.api.world;
  }

  async at(ms: number): Promise<void> {
    await this.api.setClock(ms);
  }

  async advance(ms: number): Promise<void> {
    await this.api.setClock((await this.api.now()) + ms);
  }

  private admins = new Map<string, { actor: Actor; at: number }>();

  /** Admin with a confirmed second factor (anna, bram or chris); one login per 10 hours of server time. */
  async admin(key: 'anna' | 'bram' | 'chris' = 'anna'): Promise<Actor> {
    const now = await this.api.now();
    const known = this.admins.get(key);
    if (known && now - known.at < 10 * HOUR) return known.actor;
    const a = known?.actor ?? this.api.newActor(homeIp(), UA.desktop);
    await adminLogin(this.world, a, DEMO_ADMINS.find((x) => x.key === key)!);
    this.admins.set(key, { actor: a, at: now });
    return a;
  }

  email(prefix = 'student'): string {
    return `${prefix}.${++this.n}.${Date.now() % 100000}@student.demostad.test`;
  }

  /** Waitlist entry, a batch invite by an admin and the invite token from the mail. */
  async waitlistInvite(email: string, admin?: Actor): Promise<string> {
    const visitor = this.api.newActor(homeIp());
    await visitor.api.call('waitlist.join', { body: { email, locale: 'nl', source: 'landing', consent_version: 'privacy-0.3' } });
    const a = admin ?? (await this.admin());
    await a.api.call('admin.waitlist.inviteBatch', { body: { count: 50 } });
    return lastToken(this.api.inbox, email, /\/i\/([A-Za-z0-9_-]{16,128})/);
  }

  /** A registered student with a device; via the waitlist unless an invite token is given. */
  async student(opts: Partial<Registration> & { ip?: string; ua?: keyof typeof UA; uaClass?: 'android_chrome' | 'ios_safari' | 'desktop' } = {}) {
    const email = opts.email ?? this.email();
    const invite = opts.invite ?? (await this.waitlistInvite(email));
    const actor = this.api.newActor(opts.ip ?? homeIp(), UA[opts.ua ?? 'android']);
    const onboarding = await register(this.world, actor, {
      email,
      firstName: opts.firstName ?? 'Test',
      birthDate: opts.birthDate ?? '2003-05-17',
      goal: opts.goal ?? 25,
      invite,
      ...(opts.silent !== undefined ? { silent: opts.silent } : {}),
    });
    const deviceId = await registerDevice(actor, this.rng, opts.uaClass ?? 'android_chrome');
    return { actor, email, deviceId, onboarding };
  }

  /** Runs sessions to their end on the server clock (heartbeats every 80 s). */
  async sessions(...plans: SessionPlan[]): Promise<{ sessionId: string; status: string }[]> {
    const out: { sessionId: string; status: string }[] = [];
    const tasks = plans.map((p) => sessionTask({ ...p, done: (r) => out.push(r) }, this.rng, this.world.clock));
    await this.api.now();
    await runAgenda(this.world.clock, tasks);
    return out;
  }

  /** Day close of focus day D (runs at 05:45 on D + 1). */
  async closeDay(day: string): Promise<void> {
    const next = new Date(Date.parse(`${day}T12:00:00Z`) + 24 * HOUR).toISOString().slice(0, 10);
    const at = local(next, '05:46');
    if ((await this.api.now()) < at) await this.at(at);
    const status = await this.api.runJob('day_close', `day_close:${day}`);
    if (status === 'failed') throw new Error(`day_close ${day} failed`);
  }
}

export type ChainStudent = Awaited<ReturnType<Chain['student']>>;

/** Feature flag on; flags with four eyes (arm_b, rest_period) are confirmed by a second admin. */
export async function enableFlag(c: Chain, key: 'arm_b' | 'duels' | 'cards' | 'belofte' | 'squad_prompt' | 'reminders' | 'no_points_mode'): Promise<void> {
  const anna = await c.admin('anna');
  const r = await anna.api.call('admin.featureFlags.put', { params: { key }, body: { enabled: true } });
  if (r.pending_confirmation) await (await c.admin('bram')).api.call('admin.featureFlags.put', { params: { key }, body: { enabled: true } });
}

/** Registers solo students until one lands in the wanted bonus arm (blocks of four, spec §5 Toewijzing). */
export async function studentInArm(c: Chain, arm: 'A' | 'B', opts: Parameters<Chain['student']>[0] = {}): Promise<ChainStudent> {
  for (let i = 0; i < 8; i++) {
    const s = await c.student(opts);
    if (s.onboarding.assignment.arm_bonus === arm) return s;
  }
  throw new Error(`no student in arm ${arm} after 8 registrations`);
}

/** Journal entries of a session or a user day (types and keys), straight from the ledger. */
export function entriesFor(api: WorkerApi, refOrKeyPart: string): { type: string; idempotency_key: string }[] {
  return api.sql('SELECT type, idempotency_key FROM journal_entry WHERE ref_id = ? OR idempotency_key LIKE ? ORDER BY created_at, id', [refOrKeyPart, `%${refOrKeyPart}%`]);
}

/** Partner, booked budget and one published reward with vouchers released for the given weeks. */
export async function catalogItem(c: Chain, opts: { weeks: string[]; points?: number; stock?: number } ) {
  const admin = await c.admin('anna');
  const partner = await admin.api.call('admin.partners.create', { body: { name: 'Lunchroom Het Plein (fictief)', kind: 'sponsor' } });
  const budget = await admin.api.call('admin.budgets.create', {
    params: { id: partner.partner.id },
    body: { kind: 'direct_reward', booked_cents: 20_000, reward_pct: 100, document_ref: 'DEMO-OVK-E2E (fictief)', booked_at: '2026-11-30', pool: 'pilot' },
  });
  const stock = opts.stock ?? 21;
  const reward = await admin.api.call('admin.rewards.create', {
    body: {
      partner_id: partner.partner.id,
      kind: 'in_kind',
      title_nl: 'Koffie met koek',
      title_en: 'Coffee and a biscuit',
      terms_nl: 'Fictief, alleen voor tests.',
      terms_en: 'Fictitious, tests only.',
      cost_cents: 250,
      points_price: opts.points ?? 300,
      min_age_band: '16_17',
      declaration_ref: 'DEMO-VERKL-E2E (fictief)',
      collective: false,
      budget_id: budget.budget.id,
      stock,
    },
  });
  const id = reward.reward.id;
  await admin.api.call('admin.rewards.vouchers', { params: { id }, body: { csv: Array.from({ length: stock }, (_, i) => `E2E-${String(i + 1).padStart(4, '0')}`).join('\n') } });
  await admin.api.call('admin.rewards.publish', { params: { id }, body: { cash_check: true } });
  const perWeek = Math.floor(stock / opts.weeks.length);
  for (const week of opts.weeks) {
    await admin.api.call('admin.rewards.releases', { params: { id }, body: { week, per_day: Array.from({ length: 7 }, (_, d) => Math.floor(perWeek / 7) + (d < perWeek % 7 ? 1 : 0)), anchor_only: 0 } });
  }
  return { admin, rewardId: id, partnerId: partner.partner.id, budgetId: budget.budget.id };
}

/** 320 planned minutes on one day (90 + 90 + 90 + 50): 300 counted, the daily cap (spec §4.2). */
export function earnInDay(s: ChainStudent, day: string): SessionPlan[] {
  return [
    { actor: s.actor, deviceId: s.deviceId, start: local(day, '08:00'), plannedMin: 90, outcome: { kind: 'complete' } },
    { actor: s.actor, deviceId: s.deviceId, start: local(day, '10:00'), plannedMin: 90, outcome: { kind: 'complete' } },
    { actor: s.actor, deviceId: s.deviceId, start: local(day, '12:00'), plannedMin: 90, outcome: { kind: 'complete' } },
    { actor: s.actor, deviceId: s.deviceId, start: local(day, '14:00'), plannedMin: 50, outcome: { kind: 'complete' } },
  ];
}

/** Verifies a mobile number with the SMS code from the dev inbox (spec §3.4 B3). */
export async function verifyPhone(c: Chain, s: ChainStudent, phone: string): Promise<void> {
  const { lastCode } = await import('../../tooling/seed/driver.ts');
  await s.actor.api.call('phone.start', { body: { phone } });
  await s.actor.api.call('phone.confirm', { body: { code: await lastCode(c.api.inbox, phone, 'sms') } });
}

/** A fictitious exam calendar for a club (spec §4.13: no club code without a calendar; integration wave). */
export async function clubCalendar(c: Chain, tDay = '2027-01-24'): Promise<string> {
  const admin = await c.admin('anna');
  const r = await admin.api.call('admin.examCalendars.create', { body: { institution: 'Hogeschool Demostad (fictief)', t_day: tDay, source_ref: 'Jaarrooster (fictief)', checked_at: '2026-11-05' } });
  return r.calendar.id;
}
