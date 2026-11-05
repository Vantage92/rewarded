// WP-4 integration: points routes (architecture §8.2), the day close steps 1, 2 and 10 (§6.1, §5.5),
// the week opening with the arm B grant and the spread release (§5.3, §6.1), and the coverage alarm.
import { describe, expect, it } from 'vitest';
import { CURRENT_PARAMS, focusDayOf } from '@rewarded/core';
import { createScheduler } from '../src/jobs/scheduler.ts';
import { dayCloseJob } from '../src/jobs/day_close/index.ts';
import { step as step1 } from '../src/jobs/day_close/01-sessions-closed.ts';
import { step as step2 } from '../src/jobs/day_close/02-reconcile-days.ts';
import { ledgerChecks, step as step10 } from '../src/jobs/day_close/10-ledger-checks.ts';
import { coverageAlarm } from '../src/jobs/week_close/coverage-alarm.ts';
import { job as weekOpen, runWeekOpen } from '../src/jobs/week_open.ts';
import { call, createUser, device, wp4Harness, type Harness } from './wp4/harness.ts';
import { FocusClient } from './wp4/client.ts';
import { seedRedeemer, seedReward, seedSession } from './wp4/seed.ts';

const P = CURRENT_PARAMS;
const today = (h: Harness) => focusDayOf(h.clock.now().getTime(), P);
const entries = (h: Harness, type: string) => h.db.all<{ idempotency_key: string; reason_code: string | null; focus_day: string | null }>('SELECT idempotency_key, reason_code, focus_day FROM journal_entry WHERE type = ?', [type]);

async function closeDay(h: Harness, day: string) {
  const s = createScheduler({ clock: h.clock, moduleDeps: h.deps });
  s.register(dayCloseJob(async () => [step1, step2, step10]));
  return s.runNow('day_close', `day_close:${day}`);
}

describe('architecture §8.2 points routes', () => {
  it('§3.4 the balance in three parts: available, pending (flagged session), referral not yet free', async () => {
    const h = wp4Harness();
    const u = createUser(h);
    const c = new FocusClient(h, u, await device(h, u));
    await c.complete(25); // available
    await c.complete(25, { webdriver: true }); // H1: points pending
    const b = await call(h, u, 'GET', '/points/balance');
    expect(b.body).toMatchObject({ available: 25, pending: 25, referral_unvested: 0, earn_in_min: 25, earn_in_required: 300 });
    const l = await call(h, u, 'GET', '/points/ledger');
    expect(l.body.items.map((i: { type: string; status: string; amount: number }) => [i.type, i.status, i.amount])).toEqual([
      ['earn_session', 'pending', 25],
      ['earn_session', 'available', 25],
    ]);
    // Only an admin decision releases them (spec §6.4); the flag fake reports the affected sessions.
    const page = await call(h, u, 'GET', '/points/ledger?limit=1');
    expect(page.body.items).toHaveLength(1);
    expect((await call(h, u, 'GET', `/points/ledger?limit=1&cursor=${page.body.next_cursor}`)).body.items[0].status).toBe('available');
  });

  it('§4.4 Overmoedrem: 90 or 120 in the first week needs a confirmation; a goal applies from the next focus day', async () => {
    const h = wp4Harness();
    const u = createUser(h, { createdAt: h.clock.now().toISOString() });
    expect((await call(h, u, 'PUT', '/me/daily-goal', { minutes: 90 })).body.error.code).toBe('OVERREACH_CONFIRM_REQUIRED');
    const ok = await call(h, u, 'PUT', '/me/daily-goal', { minutes: 90, confirm_overreach: true });
    expect(ok.body).toEqual({ goal_min: 90, effective_from_day: '2026-12-04' });
    expect((await call(h, u, 'GET', '/me/today')).body.goal_min).toBe(25);
    h.clock.advance(86_400_000);
    expect((await call(h, u, 'GET', '/me/today')).body.goal_min).toBe(90);
    expect(h.events.named('daily_goal_set')[0]?.props).toMatchObject({ minuten: 90, bron: 'zelf', overmoed_bevestigd: true });
  });

  it('§3.13 tentamendag: at most 3 per calendar week (EXAM_DAY_LIMIT), never for a past day (PERIOD_LOCKED)', async () => {
    const h = wp4Harness(); // Thursday 3 December 2026
    const u = createUser(h);
    for (const d of ['2026-12-03', '2026-12-04', '2026-12-05']) expect((await call(h, u, 'PUT', `/me/exam-days/${d}`)).status).toBe(200);
    expect((await call(h, u, 'PUT', '/me/exam-days/2026-12-06')).body.error.code).toBe('EXAM_DAY_LIMIT');
    expect((await call(h, u, 'PUT', '/me/exam-days/2026-12-02')).body.error.code).toBe('PERIOD_LOCKED');
    expect((await call(h, u, 'DELETE', '/me/exam-days/2026-12-05')).body.exam_days_this_week).toEqual(['2026-12-03', '2026-12-04']);
    expect((await call(h, u, 'PUT', '/me/exam-days/2026-12-07')).status).toBe(200); // next week
    expect((await call(h, u, 'GET', '/me/today')).body.exam_day).toBe(true);
  });

  it('§3.2 /me/today: goal first, goal days of the week, the bonus rule of the arm', async () => {
    const h = wp4Harness();
    const u = createUser(h);
    h.setArm(u.id, 'B');
    const c = new FocusClient(h, u, await device(h, u));
    await c.complete(25);
    const t = await call(h, u, 'GET', '/me/today');
    expect(t.body).toMatchObject({ focus_day: '2026-12-03', counted_min: 25, goal_min: 25, goal_met: true, goal_days_this_week: 1, bonus_rule: 'B', earn_arm: 'earn', streak: null });
    // Arm B: the weekly budget is 20 × the bonus days of the week (the season starts on Wednesday
    // 2 December: 5 days = 100), and today's 20 is secured.
    expect(h.services.ledger.balances(u.id)).toMatchObject({ available: 45, pending: 80 });
  });
});

describe('architecture §6.1 day close steps 1, 2 and 10', () => {
  it('§6.1 a 90-minute session from 03:55 belongs to the previous focus day; the close at 05:45 finds the goal met and no lapse', async () => {
    const h = wp4Harness({ start: '2026-12-08T04:45:00Z' }); // 05:45 Amsterdam on Tuesday
    const u = createUser(h);
    h.setArm(u.id, 'A');
    const id = seedSession(h, u.id, { min: 90, startMs: Date.parse('2026-12-08T02:55:00Z') });
    expect(h.db.get<{ focus_day: string; late_start: number }>('SELECT focus_day, late_start FROM focus_session WHERE id = ?', [id])).toEqual({ focus_day: '2026-12-07', late_start: 1 });
    const res = await closeDay(h, '2026-12-07');
    expect(res.status).toBe('done');
    const day = h.services.userDays.get(u.id, '2026-12-07');
    expect(day).toMatchObject({ goalMet: true, verifiedMin: 90, countedMin: 90 });
    expect(day?.closedAt).not.toBeNull();
    // Night rule: points and goal count, but no goal bonus (spec §4.2 Nachtregel).
    expect(entries(h, 'goal_bonus')).toEqual([]);
    expect(entries(h, 'goal_budget_lapse')).toEqual([]);
    expect(h.events.named('daily_goal_met')).toHaveLength(1);
    expect(h.db.all('SELECT * FROM ledger_alert')).toEqual([]);
    // Idempotent: a second run is skipped, a forced re-run of step 2 books nothing new.
    expect((await closeDay(h, '2026-12-07')).status).toBe('skipped');
    const before = h.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM journal_entry')?.n;
    await step2.run({ day: '2026-12-07', runKey: 'x', now: h.clock.now(), deps: h.deps, params: P, vacation: false });
    expect(h.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM journal_entry')?.n).toBe(before);
    expect(h.events.named('daily_goal_met')).toHaveLength(1);
  });

  it('§4.2 arm B: a missed goal lapses 20 at the close; a goal met only by a night session lapses too; an exam day lapses silently', async () => {
    const h = wp4Harness({ start: '2026-12-10T04:45:00Z' }); // Thursday 05:45: closes Wednesday 9 December
    const missed = createUser(h);
    const night = createUser(h);
    const exam = createUser(h);
    for (const u of [missed, night, exam]) h.setArm(u.id, 'B');
    h.db.run("INSERT INTO user_day (user_id, focus_day, rev, goal_min, exam_day) VALUES (?, '2026-12-09', 1, 25, 1)", [exam.id]);
    seedSession(h, night.id, { min: 25, startMs: Date.parse('2026-12-10T00:30:00Z') }); // 01:30 Amsterdam
    await closeDay(h, '2026-12-09');
    const lapses = entries(h, 'goal_budget_lapse');
    expect(lapses.map((e) => e.idempotency_key).sort()).toEqual([`goal_lapse:${exam.id}:2026-12-09`, `goal_lapse:${missed.id}:2026-12-09`, `goal_lapse:${night.id}:2026-12-09`].sort());
    expect(lapses.find((e) => e.idempotency_key.includes(exam.id))?.reason_code).toBe('exam_day');
    expect(h.services.userDays.get(night.id, '2026-12-09')).toMatchObject({ goalMet: true, goalBonusEligible: false });
    // No "missed" for the exam day (spec §3.13: no message), and no secure for the night session.
    expect(h.events.named('daily_goal_missed').map((e) => e.pseudonym).sort()).toEqual([missed.pseudonym].sort());
    expect(entries(h, 'goal_budget_secure')).toEqual([]);
    expect(h.db.all('SELECT * FROM ledger_alert')).toEqual([]);
  });

  it('§6.1 step 1: an active session of D is closed by the sweep first (battery dead), then the day is reconciled', async () => {
    const h = wp4Harness({ start: '2026-12-09T20:00:00Z' });
    const u = createUser(h);
    const c = new FocusClient(h, u, await device(h, u));
    await c.start(25);
    await c.run(5 * 60_000);
    h.clock.set(new Date('2026-12-10T04:45:00Z'));
    expect((await closeDay(h, '2026-12-09')).status).toBe('done');
    expect(h.db.get<{ status: string; abort_reason: string }>('SELECT status, abort_reason FROM focus_session WHERE id = ?', [c.sessionId])).toEqual({ status: 'aborted', abort_reason: 'heartbeat_gap' });
  });

  it('§5.5 step 10: an entry that does not close on zero becomes a ledger_alert', async () => {
    const h = wp4Harness();
    const u = createUser(h);
    seedSession(h, u.id, { min: 25 });
    expect(ledgerChecks(h.db, today(h))).toEqual([]);
    // Simulate a broken writer: one unbalanced entry straight into the tables.
    h.db.run(
      "INSERT INTO journal_entry (id, type, idempotency_key, account_set, ref_type, ref_id, actor, param_version, created_at, content_hash) VALUES ('01JBR0KEN0000000000000000A', 'earn_session', 'earn:broken', 'x', 'session', 'x', 'system', 1, 0, 'x')",
    );
    h.db.run("INSERT INTO posting (id, entry_id, account_id, amount) VALUES ('p1', '01JBR0KEN0000000000000000A', 'system:issuance', 5)");
    await step10.run({ day: today(h), runKey: 'x', now: h.clock.now(), deps: h.deps, params: P, vacation: false });
    expect(h.db.all<{ check_name: string; ref: string }>('SELECT check_name, ref FROM ledger_alert')).toEqual([{ check_name: 'zero_sum', ref: '01JBR0KEN0000000000000000A' }]);
  });
});

describe('architecture §6.1 week opening and §5.3 coverage alarm', () => {
  it('§5 arm B: Monday 04:00 books 140 pending once; a mid-week entry gets 20 × remaining days', async () => {
    const h = wp4Harness({ start: '2026-12-07T03:00:00Z' }); // Monday 04:00 Amsterdam
    const b = createUser(h);
    const a = createUser(h);
    h.setArm(b.id, 'B');
    h.setArm(a.id, 'A');
    const r = runWeekOpen(h.deps, today(h));
    expect(r.grants).toBe(1);
    expect(h.services.ledger.balances(b.id).pending).toBe(140);
    expect(h.services.ledger.balances(a.id).pending).toBe(0);
    expect(runWeekOpen(h.deps, today(h)).grants).toBe(0); // idempotent per user and week
    const late = createUser(h, { createdAt: '2026-12-09T12:00:00Z' });
    h.setArm(late.id, 'B');
    h.clock.advance(2 * 86_400_000 + 9 * 3_600_000);
    seedSession(h, late.id, { min: 25 });
    expect(h.services.ledger.balances(late.id).byKind.pending_goal_budget + 20).toBe(100); // Wed–Sun = 5 days, 20 secured
    // The scheduler job runs once per focus day.
    const s = createScheduler({ clock: h.clock, moduleDeps: h.deps });
    s.register(weekOpen);
    expect((await s.runNow('week_open')).status).toBe('done');
    expect((await s.runNow('week_open')).status).toBe('skipped');
  });

  it('§4.3 the spread release: the daily job sets the vouchers of that day to available', async () => {
    const h = wp4Harness({ start: '2026-12-07T03:30:00Z' }); // Monday
    const admin = createUser(h, { admin: true });
    const seeded = await seedReward(h, { admin, stock: 1 });
    const reward = await call(h, admin, 'POST', '/admin/rewards', { partner_id: seeded.partnerId, kind: 'service', title_nl: 'W', title_en: 'W', terms_nl: 'x', terms_en: 'x', cost_cents: 100, points_price: 100, min_age_band: '16_17', declaration_ref: 'v', collective: true, budget_id: seeded.budgetId, stock: 7 });
    const id = reward.body.reward.id;
    await call(h, admin, 'POST', `/admin/rewards/${id}/vouchers`, { csv: Array.from({ length: 7 }, (_, i) => `D${i}`).join('\n') });
    await call(h, admin, 'POST', `/admin/rewards/${id}/releases`, { week: '2026-W50', per_day: [1, 1, 1, 1, 1, 1, 1], anchor_only: 0 });
    await call(h, admin, 'POST', `/admin/rewards/${id}/publish`, { cash_check: true });
    const avail = () => h.db.get<{ n: number }>("SELECT COUNT(*) AS n FROM reward_voucher WHERE reward_id = ? AND status = 'available'", [id])?.n;
    expect(avail()).toBe(1);
    h.clock.advance(2 * 86_400_000);
    expect(runWeekOpen(h.deps, today(h)).released).toBe(2);
    expect(avail()).toBe(3);
  });

  it('§4.3 dekkingsalarm: users past the earn-in period × 1 against next week’s released stock', async () => {
    const h = wp4Harness({ start: '2026-12-07T04:45:00Z' }); // Monday 05:45
    await seedReward(h, { stock: 1 });
    for (let i = 0; i < 3; i++) seedRedeemer(h);
    const res = coverageAlarm({ deps: h.deps, now: h.clock.now() });
    expect(res.find((r) => r.pool === 'pilot')).toEqual({ pool: 'pilot', eligible: 3, released: 1, shortfall: 2 });
    expect(h.db.all('SELECT week, pool, shortfall FROM coverage_alert')).toEqual([{ week: '2026-12-07', pool: 'pilot', shortfall: 2 }]);
    // The event writers of WP-3 refuse a server event without a pseudonym, so the alarm lives in the
    // coverage_alert table (admin overview) until a system event is allowed (see the WP-4 report).
    coverageAlarm({ deps: h.deps, now: h.clock.now() });
    expect(h.db.all('SELECT week FROM coverage_alert')).toHaveLength(1);
  });
});
