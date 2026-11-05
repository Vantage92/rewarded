// WP-4 integration: catalog with coverage and kinds (spec §4.3, architecture §5.3), the redemption as
// one transaction (spec §3.4, architecture §5.2), phone verification at the first redemption, and the
// concurrency criterion of architecture §12.1 (50 parallel redemptions).
import { describe, expect, it } from 'vitest';
import { CURRENT_PARAMS, focusDayOf } from '@rewarded/core';
import { ledgerChecks } from '../src/jobs/day_close/10-ledger-checks.ts';
import { refundRedemption } from '../src/modules/redemptions/index.ts';
import { call, createUser, wp4Harness, type Harness, type TestUser } from './wp4/harness.ts';
import { redeemKey, seedEarnIn, seedPhone, seedRedeemer, seedReward } from './wp4/seed.ts';

const redeem = (h: Harness, u: TestUser, rewardId: string, key = redeemKey()) => call(h, u, 'POST', '/redemptions', { reward_id: rewardId }, { 'Idempotency-Key': key });
const zeroSum = (h: Harness) => h.db.all('SELECT entry_id FROM posting GROUP BY entry_id HAVING SUM(amount) <> 0');

describe('spec §4.3 catalog and coverage (admin routes)', () => {
  it('§4.3 Budgetdekking: an item needs cost × stock within the free booked budget (COVERAGE_INSUFFICIENT)', async () => {
    const h = wp4Harness();
    const admin = createUser(h, { admin: true });
    const partner = await call(h, admin, 'POST', '/admin/partners', { name: 'Studievereniging Demo', kind: 'vereniging' });
    const budget = await call(h, admin, 'POST', `/admin/partners/${partner.body.partner.id}/budgets`, { kind: 'direct_reward', booked_cents: 1000, reward_pct: 100, document_ref: 'factuur-2026-001', booked_at: '2026-11-05' });
    expect(budget.status).toBe(201);
    expect(budget.body.budget).toMatchObject({ free_cents: 1000, allocated_cents: 0 });
    const base = { partner_id: partner.body.partner.id, kind: 'in_kind', title_nl: 'Koffie', title_en: 'Coffee', terms_nl: 'x', terms_en: 'x', points_price: 250, min_age_band: '16_17', declaration_ref: 'verklaring-1', collective: false, budget_id: budget.body.budget.id };
    expect((await call(h, admin, 'POST', '/admin/rewards', { ...base, cost_cents: 300, stock: 4 })).body.error.code).toBe('COVERAGE_INSUFFICIENT');
    const ok = await call(h, admin, 'POST', '/admin/rewards', { ...base, cost_cents: 300, stock: 3 });
    expect(ok.status).toBe(201);
    expect(ok.body.reward).toMatchObject({ allocation_cents: 900, status: 'draft' });
    // Cancelling more than the free room is refused (architecture §5.3).
    expect((await call(h, admin, 'POST', `/admin/budgets/${budget.body.budget.id}/cancel`, { cancel_cents: 200, reason_code: 'partner_withdrew' })).body.error.code).toBe('COVERAGE_INSUFFICIENT');
    expect((await call(h, admin, 'POST', `/admin/budgets/${budget.body.budget.id}/cancel`, { cancel_cents: 100, reason_code: 'partner_withdrew' })).body.budget).toMatchObject({ cancelled_cents: 100, free_cents: 0 });
  });

  it('§4.3 Europlafonds: an item above €5 is refused (CEILING_EXCEEDED); money is not a kind', async () => {
    const h = wp4Harness();
    const admin = createUser(h, { admin: true });
    const partner = await call(h, admin, 'POST', '/admin/partners', { name: 'Rewarded', kind: 'rewarded' });
    const budget = await call(h, admin, 'POST', `/admin/partners/${partner.body.partner.id}/budgets`, { kind: 'own_budget', booked_cents: 150_000, reward_pct: 100, document_ref: 'founderbesluit', booked_at: '2026-11-05' });
    const base = { partner_id: partner.body.partner.id, title_nl: 'X', title_en: 'X', terms_nl: 'x', terms_en: 'x', points_price: 250, min_age_band: '16_17', declaration_ref: 'v', collective: true, budget_id: budget.body.budget.id, stock: 1 };
    expect((await call(h, admin, 'POST', '/admin/rewards', { ...base, kind: 'in_kind', cost_cents: 501 })).body.error.code).toBe('CEILING_EXCEEDED');
    for (const kind of ['store_credit', 'gift_card_open', 'cash_equivalent']) {
      expect((await call(h, admin, 'POST', '/admin/rewards', { ...base, kind, cost_cents: 100 })).status).toBe(422);
    }
    expect(() => h.db.run("UPDATE reward SET kind = 'gift_card_open'")).not.toThrow(); // no rows yet
    const ok = await call(h, admin, 'POST', '/admin/rewards', { ...base, kind: 'service', cost_cents: 500 });
    expect(() => h.db.run("UPDATE reward SET kind = 'gift_card_open' WHERE id = ?", [ok.body.reward.id])).toThrow(/constraint/i);
  });

  it('§4.3 / architecture §8.2: publishing needs vouchers and the cash tick (CASH_CHECK_REQUIRED); the price is immutable after publication', async () => {
    const h = wp4Harness();
    const { admin, rewardId } = await seedReward(h, { stock: 2 });
    const partner = await call(h, admin, 'POST', '/admin/partners', { name: 'P2', kind: 'rewarded' });
    const budget = await call(h, admin, 'POST', `/admin/partners/${partner.body.partner.id}/budgets`, { kind: 'own_budget', booked_cents: 5000, reward_pct: 100, document_ref: 'founderbesluit', booked_at: '2026-11-05' });
    const draft = await call(h, admin, 'POST', '/admin/rewards', { partner_id: partner.body.partner.id, kind: 'service', title_nl: 'W', title_en: 'W', terms_nl: 'x', terms_en: 'x', cost_cents: 100, points_price: 100, min_age_band: '16_17', declaration_ref: 'v', collective: true, budget_id: budget.body.budget.id, stock: 1 });
    await call(h, admin, 'POST', `/admin/rewards/${draft.body.reward.id}/vouchers`, { csv: 'ONE' });
    expect((await call(h, admin, 'POST', `/admin/rewards/${draft.body.reward.id}/publish`, {})).body.error.code).toBe('CASH_CHECK_REQUIRED');
    expect((await call(h, admin, 'POST', `/admin/rewards/${draft.body.reward.id}/publish`, { cash_check: true })).body.reward.status).toBe('published');
    expect(() => h.db.run('UPDATE reward SET points_price = 500 WHERE id = ?', [rewardId])).toThrow(/immutable/);
    // Import beyond the allocated stock is refused.
    expect((await call(h, admin, 'POST', `/admin/rewards/${draft.body.reward.id}/vouchers`, { csv: 'TWO' })).status).toBe(422);
  });

  it('§3.4 step 2: the catalog shows today’s stock and the weekly stock next to the students who may redeem', async () => {
    const h = wp4Harness();
    const { rewardId } = await seedReward(h, { stock: 4 });
    const student = seedRedeemer(h);
    createUser(h); // not past the earn-in period
    const r = await call(h, student, 'GET', '/catalog');
    expect(r.status).toBe(200);
    expect(r.body.items).toEqual([expect.objectContaining({ id: rewardId, stock_today: 4, points_price: 250, kind: 'in_kind', collective: true })]);
    expect(r.body.week).toMatchObject({ released: 4, eligible_users: 1 });
  });

  it('§4.3 Weekvrijgave: vouchers released later in the week are not in today’s stock', async () => {
    const h = wp4Harness(); // Thursday 3 December 2026
    const { admin, rewardId, partnerId, budgetId } = await seedReward(h, { stock: 2 });
    const later = await call(h, admin, 'POST', '/admin/rewards', {
      partner_id: partnerId, kind: 'in_kind', title_nl: 'Later', title_en: 'Later', terms_nl: 'x', terms_en: 'x',
      cost_cents: 100, points_price: 100, min_age_band: '16_17', declaration_ref: 'v', collective: false, budget_id: budgetId, stock: 7,
    });
    const id = later.body.reward.id;
    await call(h, admin, 'POST', `/admin/rewards/${id}/vouchers`, { csv: Array.from({ length: 7 }, (_, i) => `L${i}`).join('\n') });
    expect((await call(h, admin, 'POST', `/admin/rewards/${id}/releases`, { week: '2026-W49', per_day: [1, 1, 1, 1, 1, 1, 1] })).status).toBe(200);
    await call(h, admin, 'POST', `/admin/rewards/${id}/publish`, { cash_check: true });
    const student = seedRedeemer(h, { institution: true });
    const items = (await call(h, student, 'GET', '/catalog')).body.items as { id: string; stock_today: number; next_release?: string }[];
    // Monday to Thursday are released (4), Friday comes at 04:00 Amsterdam time.
    expect(items.find((i) => i.id === id)).toMatchObject({ stock_today: 4, next_release: '2026-12-04T03:00:00.000Z' });
    expect(items.find((i) => i.id === rewardId)?.stock_today).toBe(2);
    expect((await call(h, admin, 'POST', `/admin/rewards/${id}/releases`, { week: '2026-W50', per_day: [1, 0, 0, 0, 0, 0, 0] })).body.error.code).toBe('OUT_OF_STOCK');
  });
});

describe('spec §3.4 redemption flow (architecture §5.2, e2e table §11)', () => {
  it('§3.4: EARN_IN_REQUIRED, then FIRST_REDEEM_HOLD for 7 days, then PHONE_NOT_VERIFIED, then a voucher, then WEEKLY_CAP; a refund frees the week', async () => {
    const h = wp4Harness();
    const { rewardId } = await seedReward(h, { stock: 5 });
    const u = createUser(h);
    expect((await redeem(h, u, rewardId)).body.error.code).toBe('EARN_IN_REQUIRED');
    seedEarnIn(h, u.id);
    const hold = await redeem(h, u, rewardId);
    expect(hold.body.error.code).toBe('FIRST_REDEEM_HOLD');
    const bal = await call(h, u, 'GET', '/points/balance');
    expect(bal.body).toMatchObject({ available: 300, earn_in_min: 300, earn_in_required: 300 });
    expect(Date.parse(bal.body.first_redeem_after) - h.clock.now().getTime()).toBe(7 * 86_400_000);
    h.clock.advance(7 * 86_400_000);
    // The catalog stock was released last week; unredeemed vouchers stay available in the pool (spec §4.3).
    expect((await redeem(h, u, rewardId)).body.error.code).toBe('PHONE_NOT_VERIFIED');
    seedPhone(h, u.id);
    const ok = await redeem(h, u, rewardId);
    expect(ok.status).toBe(201);
    expect(ok.body).toMatchObject({ points: 250, points_from_referral: 0 });
    expect(ok.body.voucher_code).toMatch(/^CODE-/);
    expect(h.services.ledger.balances(u.id).available).toBe(50);
    expect(h.inbox.list().some((m) => m.channel === 'email' && m.text.includes(ok.body.voucher_code))).toBe(true);
    expect((await redeem(h, u, rewardId)).body.error.code).toBe('WEEKLY_CAP');
    expect(h.events.named('redemption_blocked').map((e) => (e.props as { reden: string }).reden)).toEqual(['inverdien', 'wachttijd', 'telefoon', 'week']);
    // "Werkt niet": a ticket, then the points back with redeem_refund; the week is free again.
    const broken = await call(h, u, 'POST', `/redemptions/${ok.body.redemption_id}/broken`, { text: 'Code werkt niet' });
    expect(broken.status).toBe(201);
    expect((await call(h, u, 'POST', `/redemptions/${ok.body.redemption_id}/broken`, {})).body.error.code).toBe('ALREADY_REPORTED');
    h.db.transaction(() => refundRedemption(h.db, h.deps, ok.body.redemption_id, 'system'));
    expect(h.services.ledger.balances(u.id).available).toBe(300);
    const again = await redeem(h, u, rewardId);
    expect(again.status).toBe(201);
    expect((await call(h, u, 'GET', '/redemptions')).body.items.map((r: { status: string }) => r.status).sort()).toEqual(['refunded', 'reserved']);
    expect(zeroSum(h)).toEqual([]);
  });

  it('§3.4 step 6: OUT_OF_STOCK writes nothing; INSUFFICIENT_POINTS; MONTHLY_CAP at €15 per month', async () => {
    const h = wp4Harness();
    const { rewardId } = await seedReward(h, { stock: 1 });
    const a = seedRedeemer(h);
    const b = seedRedeemer(h);
    expect((await redeem(h, a, rewardId)).status).toBe(201);
    const before = h.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM journal_entry')?.n;
    expect((await redeem(h, b, rewardId)).body.error.code).toBe('OUT_OF_STOCK');
    expect(h.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM journal_entry')?.n).toBe(before);
    expect(h.services.ledger.balances(b.id).available).toBe(300);

    const pricey = await seedReward(h, { stock: 2, price: 400 });
    expect((await redeem(h, b, pricey.rewardId)).body.error.code).toBe('INSUFFICIENT_POINTS');

    // Month ceiling: three earlier redemptions of €5 this month (earlier weeks of the same month).
    const c = seedRedeemer(h);
    const five = await seedReward(h, { stock: 4, costCents: 500, price: 50 });
    for (const week of ['2026-11-09', '2026-11-16', '2026-11-23']) {
      expect((await redeem(h, c, five.rewardId)).status).toBe(201);
      h.db.run("UPDATE redemption SET week_key = ? WHERE user_id = ? AND week_key = '2026-11-30'", [week, c.id]);
    }
    expect((await redeem(h, c, five.rewardId)).body.error.code).toBe('MONTHLY_CAP');
  });

  it('§4.3 the institution anchor: anchor-only vouchers go only to accounts with a confirmed institution mail', async () => {
    const h = wp4Harness();
    const { rewardId } = await seedReward(h, { stock: 2, anchorOnly: 2 });
    const plain = seedRedeemer(h);
    const anchored = seedRedeemer(h, { institution: true });
    expect((await redeem(h, plain, rewardId)).body.error.code).toBe('OUT_OF_STOCK');
    expect((await redeem(h, anchored, rewardId)).status).toBe(201);
  });

  it('§4.3 minors do not see or redeem 18+ items', async () => {
    const h = wp4Harness();
    const { rewardId } = await seedReward(h, { stock: 2, minAge: '18_plus' });
    const minor = seedRedeemer(h, { ageBand: '16_17' });
    expect((await call(h, minor, 'GET', '/catalog')).body.items).toEqual([]);
    expect((await redeem(h, minor, rewardId)).status).toBe(404);
  });

  it('§5.4 a repeated redemption with the same Idempotency-Key returns the stored answer, no second booking', async () => {
    const h = wp4Harness();
    const { rewardId } = await seedReward(h, { stock: 3 });
    const u = seedRedeemer(h);
    const key = redeemKey();
    const first = await redeem(h, u, rewardId, key);
    const second = await redeem(h, u, rewardId, key);
    expect(second.status).toBe(201);
    expect(second.body).toEqual(first.body);
    expect(h.db.get<{ n: number }>("SELECT COUNT(*) AS n FROM journal_entry WHERE type = 'redeem'")?.n).toBe(1);
  });

  it('architecture §5.2: a replacement code is a new voucher on the same redemption, without a journal entry', async () => {
    const h = wp4Harness();
    const { admin, rewardId } = await seedReward(h, { stock: 3 });
    const u = seedRedeemer(h);
    const ok = await redeem(h, u, rewardId);
    const entries = h.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM journal_entry')?.n;
    const rep = await call(h, admin, 'POST', `/admin/redemptions/${ok.body.redemption_id}/replace`, { note: 'Code werkte niet bij de partner' });
    expect(rep.status).toBe(200);
    expect(rep.body.redemption.status).toBe('replaced');
    expect(rep.body.redemption.voucher_code).not.toBe(ok.body.voucher_code);
    expect(h.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM journal_entry')?.n).toBe(entries);
    expect(h.db.get<{ status: string }>('SELECT status FROM reward_voucher WHERE code = ?', [ok.body.voucher_code])?.status).toBe('broken');
  });
});

describe('architecture §12.1 WP-4 acceptance: concurrency', () => {
  it('§5.2 50 concurrent redemptions give at most one per user per week and never more than the stock; the journal closes on zero', async () => {
    const h = wp4Harness();
    const { rewardId } = await seedReward(h, { stock: 7 });
    const users = Array.from({ length: 10 }, () => seedRedeemer(h));
    const requests = users.flatMap((u) => Array.from({ length: 5 }, () => redeem(h, u, rewardId)));
    const results = await Promise.all(requests);
    const ok = results.filter((r) => r.status === 201);
    expect(ok).toHaveLength(7);
    const perUser = h.db.all<{ user_id: string; n: number }>("SELECT user_id, COUNT(*) AS n FROM redemption WHERE status <> 'refunded' GROUP BY user_id, week_key");
    expect(perUser.every((r) => r.n === 1)).toBe(true);
    expect(h.db.get<{ n: number }>("SELECT COUNT(*) AS n FROM reward_voucher WHERE status = 'reserved'")?.n).toBe(7);
    expect(new Set(ok.map((r) => r.body.voucher_code)).size).toBe(7);
    const codes = results.filter((r) => r.status !== 201).map((r) => r.body.error.code);
    expect(new Set(codes)).toEqual(new Set(['WEEKLY_CAP', 'OUT_OF_STOCK']));
    for (const u of users) {
      const redeemed = h.db.get<{ n: number }>("SELECT COUNT(*) AS n FROM redemption WHERE user_id = ? AND status = 'reserved'", [u.id])?.n ?? 0;
      expect(h.services.ledger.balances(u.id).available).toBe(300 - 250 * redeemed);
    }
    expect(zeroSum(h)).toEqual([]);
    expect(ledgerChecks(h.db, focusDayOf(h.clock.now().getTime(), CURRENT_PARAMS))).toEqual([]);
  });
});

describe('spec §3.4 step 4 phone verification (architecture §5.2 Telefoon)', () => {
  it('§3.4 a VoIP or landline number is refused (PHONE_TYPE_NOT_ALLOWED); a mobile number gets a code by SMS', async () => {
    const h = wp4Harness();
    const u = createUser(h);
    expect((await call(h, u, 'POST', '/me/phone/start', { phone: '+31851234567' })).body.error.code).toBe('PHONE_TYPE_NOT_ALLOWED');
    expect((await call(h, u, 'POST', '/me/phone/start', { phone: '+31201234567' })).body.error.code).toBe('PHONE_TYPE_NOT_ALLOWED');
    const start = await call(h, u, 'POST', '/me/phone/start', { phone: '+31612345678' });
    expect(start.status).toBe(202);
    const text = h.inbox.list('+31612345678').at(-1)?.text ?? '';
    const code = /\b(\d{6})\b/.exec(text)?.[1] as string;
    expect(code).toMatch(/^\d{6}$/);
    expect((await call(h, u, 'POST', '/me/phone/confirm', { code: code === '000000' ? '111111' : '000000' })).body.error.code).toBe('CODE_INVALID');
    expect((await call(h, u, 'POST', '/me/phone/confirm', { code })).body).toEqual({ verified: true });
    const row = h.db.get<{ phone_hash: string; phone_line_type: string; phone_verified_at: string }>('SELECT phone_hash, phone_line_type, phone_verified_at FROM user WHERE id = ?', [u.id]);
    expect(row?.phone_line_type).toBe('mobile');
    expect(row?.phone_hash).not.toContain('612345678'); // only an HMAC is stored
    // One number per account: another account cannot take it.
    const other = createUser(h);
    expect((await call(h, other, 'POST', '/me/phone/start', { phone: '+31612345678' })).body.error.code).toBe('PHONE_IN_USE');
  });

  it('§3.3 phone_verification: five wrong codes end the code (TOO_MANY_ATTEMPTS); an old code expires', async () => {
    const h = wp4Harness();
    const u = createUser(h);
    await call(h, u, 'POST', '/me/phone/start', { phone: '+31687654321' });
    const real = h.db.get<{ code_hash: string }>('SELECT code_hash FROM phone_verification WHERE user_id = ?', [u.id]);
    expect(real).toBeDefined();
    const codes: string[] = [];
    for (let i = 0; i < 5; i++) codes.push((await call(h, u, 'POST', '/me/phone/confirm', { code: `99999${i}` })).body.error.code);
    expect(codes.slice(0, 4).every((c) => c === 'CODE_INVALID' || c === 'TOO_MANY_ATTEMPTS')).toBe(true);
    expect(codes[4]).toBe('TOO_MANY_ATTEMPTS');
    expect((await call(h, u, 'POST', '/me/phone/confirm', { code: '123456' })).body.error.code).toBe('TOO_MANY_ATTEMPTS');
    h.clock.advance(3600_000); // the rate limit window and the code both pass
    await call(h, u, 'POST', '/me/phone/start', { phone: '+31687654321' });
    h.clock.advance(16 * 60_000);
    expect((await call(h, u, 'POST', '/me/phone/confirm', { code: '123456' })).body.error.code).toBe('CODE_EXPIRED');
  });
});
