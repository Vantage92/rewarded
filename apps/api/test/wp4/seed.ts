// Seed helpers for the WP-4 integration tests: completed sessions written straight into the table
// (the protocol itself is covered in wp4-sessions.test.ts) and booked through reconcileDay, plus a
// published catalog item with vouchers released today.
import { CURRENT_PARAMS, focusDayOf, isLateStart, weekKey } from '@rewarded/core';
import { isoWeekKey } from '@rewarded/core/catalog';
import { call, createUser, type Harness, type TestUser } from './harness.ts';

let seq = 0;
const nextId = (prefix: string) => {
  seq += 1;
  return `${prefix}${String(seq).padStart(26 - prefix.length, '0')}`;
};

/** A device row for the user (seeded sessions need one). */
export function seedDevice(h: Harness, userId: string, clientDeviceId = crypto.randomUUID()): string {
  const id = nextId('01JDEV');
  const at = h.clock.now().toISOString();
  h.db.run('INSERT INTO device (id, client_device_id, user_id, ua_class, standalone, wakelock_supported, first_seen_at, last_seen_at) VALUES (?, ?, ?, ?, 0, 1, ?, ?)', [id, clientDeviceId, userId, 'desktop', at, at]);
  return id;
}

/** A completed session that started at `startMs` (default: now − planned), booked like a session end. */
export function seedSession(h: Harness, userId: string, opts: { min?: 25 | 50 | 90; startMs?: number; deviceId?: string } = {}): string {
  const min = opts.min ?? 90;
  const start = opts.startMs ?? h.clock.now().getTime() - min * 60_000;
  const deviceId = opts.deviceId ?? h.db.get<{ id: string }>('SELECT id FROM device WHERE user_id = ? LIMIT 1', [userId])?.id ?? seedDevice(h, userId);
  const id = nextId('01JSES');
  h.db.transaction(() => {
    h.db.run(
      `INSERT INTO focus_session (id, user_id, device_id, planned_min, is_practice, status, server_start_at, planned_end_at, server_end_at, end_received_at,
         verified_min, focus_day, late_start, nonce_hash, mono_start_ms, last_heartbeat_at, ua_class, closed_by)
       VALUES (?, ?, ?, ?, 0, 'completed', ?, ?, ?, ?, ?, ?, ?, 'seed', 0, ?, 'desktop', 'end')`,
      [id, userId, deviceId, min, start, start + min * 60_000, start + min * 60_000, start + min * 60_000, min, focusDayOf(start, CURRENT_PARAMS), isLateStart(start, CURRENT_PARAMS) ? 1 : 0, start + min * 60_000],
    );
    h.services.ledger.reconcileDay(h.db, userId, focusDayOf(start, CURRENT_PARAMS), { type: 'session_end', sessionId: id });
  });
  return id;
}

/** Earns the 300 minutes of the earn-in period today (4 × 90, counted 300 under the daily cap). */
export function seedEarnIn(h: Harness, userId: string): void {
  const now = h.clock.now().getTime();
  for (let i = 4; i >= 1; i--) seedSession(h, userId, { min: 90, startMs: now - i * 91 * 60_000 });
}

/** Sets the phone as verified (the phone routes are tested in their own file). */
export function seedPhone(h: Harness, userId: string): void {
  h.db.run("UPDATE user SET phone_hash = ?, phone_line_type = 'mobile', phone_verified_at = ? WHERE id = ?", [`phone_${userId}`, h.clock.now().toISOString(), userId]);
}

/** A redeemer: earn-in reached, the 7-day hold over, phone verified. */
export function seedRedeemer(h: Harness, o: Parameters<typeof createUser>[1] = {}): TestUser {
  const u = createUser(h, o);
  seedEarnIn(h, u.id);
  h.db.run('UPDATE user SET first_redeem_after = ? WHERE id = ?', [new Date(h.clock.now().getTime() - 1000).toISOString(), u.id]);
  seedPhone(h, u.id);
  return u;
}

export interface SeededReward {
  admin: TestUser;
  partnerId: string;
  budgetId: string;
  rewardId: string;
}

/**
 * Partner, booked budget, reward, vouchers and a release for the current week with every voucher on
 * today (so they are available now), published.
 */
export async function seedReward(
  h: Harness,
  o: { admin?: TestUser; stock?: number; costCents?: number; price?: number; anchorOnly?: number; pool?: 'pilot' | 'research' | 'expansion'; minAge?: '16_17' | '18_plus'; budgetCents?: number } = {},
): Promise<SeededReward> {
  const admin = o.admin ?? createUser(h, { admin: true });
  const stock = o.stock ?? 10;
  const partner = await call(h, admin, 'POST', '/admin/partners', { name: 'Rewarded', kind: 'rewarded' });
  const budget = await call(h, admin, 'POST', `/admin/partners/${partner.body.partner.id}/budgets`, {
    kind: 'own_budget',
    booked_cents: o.budgetCents ?? 150_000,
    reward_pct: 100,
    document_ref: 'docs/pitch/ronde-1-founder-reactie.md',
    booked_at: '2026-11-05',
    pool: o.pool ?? 'pilot',
  });
  const reward = await call(h, admin, 'POST', '/admin/rewards', {
    partner_id: partner.body.partner.id,
    kind: 'in_kind',
    title_nl: 'Tentamentraining',
    title_en: 'Exam training',
    terms_nl: 'Eén plek bij de training.',
    terms_en: 'One seat at the training.',
    cost_cents: o.costCents ?? 300,
    points_price: o.price ?? 250,
    min_age_band: o.minAge ?? '16_17',
    declaration_ref: 'partner-verklaring-001',
    collective: true,
    budget_id: budget.body.budget.id,
    stock,
  });
  if (reward.status !== 201) throw new Error(`reward: ${reward.status} ${JSON.stringify(reward.body)}`);
  const rewardId = reward.body.reward.id as string;
  const csv = ['code', ...Array.from({ length: stock }, (_, i) => `CODE-${rewardId.slice(-6)}-${i}`)].join('\n');
  await call(h, admin, 'POST', `/admin/rewards/${rewardId}/vouchers`, { csv });
  const today = focusDayOf(h.clock.now().getTime(), CURRENT_PARAMS);
  const monday = weekKey(today, CURRENT_PARAMS.time.week_start_iso_weekday);
  const dayIndex = Math.round((Date.parse(today) - Date.parse(monday)) / 86_400_000);
  const perDay = [0, 0, 0, 0, 0, 0, 0];
  perDay[dayIndex] = stock;
  const rel = await call(h, admin, 'POST', `/admin/rewards/${rewardId}/releases`, { week: isoWeekKey(monday), per_day: perDay, anchor_only: o.anchorOnly ?? 0 });
  if (rel.status !== 200) throw new Error(`release: ${rel.status} ${JSON.stringify(rel.body)}`);
  const pub = await call(h, admin, 'POST', `/admin/rewards/${rewardId}/publish`, { cash_check: true });
  if (pub.status !== 200) throw new Error(`publish: ${pub.status} ${JSON.stringify(pub.body)}`);
  return { admin, partnerId: partner.body.partner.id, budgetId: budget.body.budget.id, rewardId };
}

let keySeq = 0;
export function redeemKey(): string {
  keySeq += 1;
  return `redeem-${String(keySeq).padStart(8, '0')}-xyz`;
}
