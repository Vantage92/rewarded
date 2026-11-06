// Redemptions module (spec §3.4 steps 3–6, §4.2, §4.3; architecture §5.2, §8.2). Owner WP-4.
// A redemption is one SQLite transaction (BEGIN IMMEDIATE = one writer, which replaces the row lock
// per account): active account, earn-in period and hold, phone, weekly and monthly ceiling, a released
// voucher of the user's pool (anchor-only vouchers only for an institution anchor), balance with at most
// half from referral points; then the journal entry, the voucher reservation and the redemption row.
// If one check fails nothing is written and a specific error code follows.
import { CURRENT_PARAMS, focusDayOf, monthKeyOf, weekKey } from '@rewarded/core';
import { monthCeilingOk } from '@rewarded/core/catalog';
import { keys, redeemSplit, type AccountRef } from '@rewarded/core/ledger';
import { DomainError, routes, type ErrorCode, type RedemptionDto } from '@rewarded/contracts';
import { idsFor } from '../../db/ids.ts';
import { adminActor } from '../../db/services/audit.ts';
import type { Db } from '../../db/types.ts';
import type { AuthState } from '../../middleware/context.ts';
import { enforceRateLimit, RATE_LIMITS } from '../../middleware/rateLimit.ts';
import { mount, reply } from '../../middleware/route.ts';
import type { ApiModule, ModuleDeps } from '../../module.ts';
import type { ActorRef } from '../../services/audit.ts';
import { releaseDue } from '../catalog/stock.ts';
import { earnInMinutes, type SqlLedgerService } from '../points/ledger.ts';
import { hasRedemptionInWeek } from '../points/index.ts';
import { installWp4Services } from '../points/services.ts';

const P = CURRENT_PARAMS;
const LEVEL = 1;

/** reden of the redemption_blocked event per error code (spec §7.1, contracts events). */
const BLOCK_REASON: Partial<Record<ErrorCode, 'inverdien' | 'week' | 'maand' | 'voorraad' | 'saldo' | 'dekking' | 'wachttijd' | 'telefoon' | 'referral_aandeel'>> = {
  EARN_IN_REQUIRED: 'inverdien',
  FIRST_REDEEM_HOLD: 'wachttijd',
  PHONE_NOT_VERIFIED: 'telefoon',
  WEEKLY_CAP: 'week',
  MONTHLY_CAP: 'maand',
  OUT_OF_STOCK: 'voorraad',
  INSUFFICIENT_POINTS: 'saldo',
  REFERRAL_SHARE_EXCEEDED: 'referral_aandeel',
};

interface RedemptionRow {
  id: string;
  user_id: string | null;
  reward_id: string;
  voucher_id: string;
  points: number;
  points_from_referral: number;
  cost_cents: number;
  week_key: string;
  month_key: string;
  entry_id: string;
  status: RedemptionDto['status'];
  broken_reported_at: string | null;
  created_at: string;
}

interface VoucherRow {
  id: string;
  reward_id: string;
  code: string;
  pool: string;
}

function userOf(auth: AuthState): { id: string; pseudonym: string; email: string; locale: 'nl' | 'en' } {
  if (auth.kind !== 'user') throw new DomainError('AUTH_REQUIRED');
  return { id: auth.user.id, pseudonym: auth.user.pseudonym, email: auth.user.email, locale: auth.user.locale };
}

/** Catalog spending of a month plus individual prizes of WP-6 when that table exists (≤ €15, spec §4.3). */
function monthSpentCents(db: Db, userId: string, month: string): number {
  const own = Number(db.get<{ t: number }>("SELECT COALESCE(SUM(cost_cents), 0) AS t FROM redemption WHERE user_id = ? AND month_key = ? AND status <> 'refunded'", [userId, month])?.t ?? 0);
  let prizes = 0;
  try {
    prizes = Number(db.get<{ t: number }>("SELECT COALESCE(SUM(value_cents), 0) AS t FROM prize WHERE user_id = ? AND month_key = ? AND status <> 'cancelled'", [userId, month])?.t ?? 0);
  } catch {
    prizes = 0; // prize table (WP-6, 0300 series) not there yet
  }
  return own + prizes;
}

/** Points back for a redemption ("Werkt niet", spec §4.3 Kapotte code): redeem_refund with the same split. */
export function refundRedemption(tx: Db, deps: ModuleDeps, redemptionId: string, actor: ActorRef): boolean {
  const r = tx.get<RedemptionRow>('SELECT * FROM redemption WHERE id = ?', [redemptionId]);
  if (!r || r.status === 'refunded' || !r.user_id) return false;
  const own = r.points - r.points_from_referral;
  const postings: { account: AccountRef; amount: number }[] = [{ account: 'system:redeemed', amount: -r.points }];
  if (own > 0) postings.push({ account: 'user:available_own', amount: own });
  if (r.points_from_referral > 0) postings.push({ account: 'user:available_referral', amount: r.points_from_referral });
  deps.services.ledger.post(tx, 'redeem_refund', keys.redeemRefund(r.id), { userId: r.user_id, postings, refType: 'redemption', refId: r.id, actor });
  tx.run("UPDATE redemption SET status = 'refunded' WHERE id = ?", [r.id]);
  tx.run("UPDATE reward_voucher SET status = 'broken' WHERE id = ? AND status IN ('reserved', 'delivered')", [r.voucher_id]);
  deps.services.audit.audit(tx, { actor, action: 'redemption_refunded', objectType: 'redemption', objectRef: r.id });
  return true;
}

export const module: ApiModule = {
  name: 'redemptions',
  owner: 'WP-4',
  register(api, deps) {
    installWp4Services(deps);
    const { db } = deps;
    const ids = idsFor(deps.platform);
    const ctx = deps.services.pointsContext;

    const dto = (r: RedemptionRow, locale: 'nl' | 'en'): RedemptionDto => {
      const info = db.get<{ title_nl: string; title_en: string; partner: string; code: string }>(
        'SELECT r.title_nl, r.title_en, pa.name AS partner, v.code FROM reward r JOIN partner pa ON pa.id = r.partner_id JOIN reward_voucher v ON v.id = ? WHERE r.id = ?',
        [r.voucher_id, r.reward_id],
      );
      return {
        id: r.id,
        reward_id: r.reward_id,
        title: ((locale === 'en' ? info?.title_en : info?.title_nl) ?? '-').slice(0, 120),
        partner: (info?.partner ?? '-').slice(0, 120),
        voucher_code: info?.code ?? '-',
        points: r.points,
        status: r.status,
        created_at: r.created_at,
      };
    };

    /** The checks and writes of one redemption; throws a DomainError and writes nothing on failure. */
    const redeem = (userId: string, rewardId: string) => {
      const now = deps.platform.clock.now();
      const today = focusDayOf(now.getTime(), P);
      const week = weekKey(today, P.time.week_start_iso_weekday);
      const month = monthKeyOf(now.getTime());
      releaseDue(db, today);
      let p = ctx.profile(db, userId);
      if (!p) throw new DomainError('NOT_FOUND');
      if (p.status !== 'active') throw new DomainError('ACCOUNT_BLOCKED');
      // Earn-in from sessions, not points: Σ counted_min of final sessions ≥ 300 (architecture §5.2).
      if (earnInMinutes(db, userId) < P.points.earn_in_min) throw new DomainError('EARN_IN_REQUIRED');
      if (p.earnInReachedAt === null) {
        (deps.services.ledger as Partial<SqlLedgerService>).updateEarnIn?.(db, userId);
        p = ctx.profile(db, userId) ?? p;
      }
      const first = db.get('SELECT 1 AS x FROM redemption WHERE user_id = ? LIMIT 1', [userId]) === undefined;
      if (first && (p.firstRedeemAfter === null || Date.parse(p.firstRedeemAfter) > now.getTime())) {
        throw new DomainError('FIRST_REDEEM_HOLD', p.firstRedeemAfter ? { from: new Date(Date.parse(p.firstRedeemAfter)).toISOString() } : undefined);
      }
      if (p.phoneVerifiedAt === null) throw new DomainError('PHONE_NOT_VERIFIED');
      if (hasRedemptionInWeek(db, userId, week)) throw new DomainError('WEEKLY_CAP');
      const reward = db.get<{ id: string; partner_id: string; cost_cents: number; points_price: number; min_age_band: string }>(
        "SELECT id, partner_id, cost_cents, points_price, min_age_band FROM reward WHERE id = ? AND status = 'published'",
        [rewardId],
      );
      if (!reward || (reward.min_age_band === '18_plus' && p.ageBand !== '18_plus')) throw new DomainError('NOT_FOUND');
      if (!monthCeilingOk(P, LEVEL, monthSpentCents(db, userId, month), reward.cost_cents)) throw new DomainError('MONTHLY_CAP');
      const anchored = p.institutionVerified;
      // Anchored accounts take reserved vouchers first, so the open stock stays for everyone else.
      const voucher = db.get<VoucherRow>(
        `SELECT id, reward_id, code, pool FROM reward_voucher WHERE reward_id = ? AND pool = ? AND status = 'available' AND redemption_id IS NULL
           AND release_day <= ? AND (anchor_only = 0 OR ? = 1) ORDER BY anchor_only * ? DESC, release_day, id LIMIT 1`,
        [reward.id, ctx.pool(p, today, db), today, anchored ? 1 : 0, anchored ? 1 : 0],
      );
      if (!voucher) throw new DomainError('OUT_OF_STOCK');
      const bal = deps.services.ledger.balances(userId).byKind;
      const split = redeemSplit(reward.points_price, bal.available_own, bal.available_referral, P.referral.max_price_share_pct);
      if (split === 'INSUFFICIENT_POINTS' || split === 'REFERRAL_SHARE_EXCEEDED') throw new DomainError(split);

      const id = ids.ulid();
      const postings: { account: AccountRef; amount: number }[] = [];
      if (split.own > 0) postings.push({ account: 'user:available_own', amount: -split.own });
      if (split.referral > 0) postings.push({ account: 'user:available_referral', amount: -split.referral });
      postings.push({ account: 'system:redeemed', amount: reward.points_price });
      const { entry } = deps.services.ledger.post(db, 'redeem', keys.redeem(id), { userId, postings, refType: 'redemption', refId: id, actor: 'system' });
      db.run(
        `INSERT INTO redemption (id, user_id, reward_id, voucher_id, points, points_from_referral, cost_cents, week_key, month_key, entry_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'reserved', ?)`,
        [id, userId, reward.id, voucher.id, reward.points_price, split.referral, reward.cost_cents, week, month, entry.id, now.toISOString()],
      );
      const taken = db.run("UPDATE reward_voucher SET status = 'reserved', redemption_id = ? WHERE id = ? AND status = 'available' AND redemption_id IS NULL", [id, voucher.id]);
      if (taken.changes !== 1) throw new DomainError('OUT_OF_STOCK');

      // H11 (spec §6.3): more than one redeeming account per browser profile in this week.
      const shared = db.all<{ user_id: string }>(
        `SELECT DISTINCT r.user_id FROM redemption r JOIN device d ON d.user_id = r.user_id
          WHERE r.week_key = ? AND r.status <> 'refunded' AND d.client_device_id IN (SELECT client_device_id FROM device WHERE user_id = ?)`,
        [week, userId],
      );
      if (shared.length > 1) {
        for (const u of shared) {
          deps.services.flags.raise(db, { code: 'H11', subject: { type: 'account', id: u.user_id ?? '' }, sessionIds: [], evidence: { accounts: shared.length, week } });
        }
      }
      deps.services.events.event(db, 'redemption_completed', { item_id: reward.id, punten: reward.points_price, kostprijs: reward.cost_cents, financier_id: reward.partner_id }, { pseudonym: p.pseudonym });
      return { id, code: voucher.code, points: reward.points_price, fromReferral: split.referral };
    };

    mount(
      api,
      routes['redemptions.create'],
      async ({ c, auth, body }) => {
        const user = userOf(auth);
        enforceRateLimit(c, RATE_LIMITS.redemptions);
        let res: ReturnType<typeof redeem>;
        try {
          res = db.transaction(() => redeem(user.id, body.reward_id));
        } catch (err) {
          const reden = err instanceof DomainError ? BLOCK_REASON[err.code] : undefined;
          // The refusal itself is the domain fact; nothing else was written (the transaction rolled back).
          if (reden) db.transaction(() => deps.services.events.event(db, 'redemption_blocked', { reden }, { pseudonym: user.pseudonym }));
          throw err;
        }
        // The code is in the app and by e-mail (spec §3.4 step 5); a mail failure does not undo the redemption.
        try {
          await deps.platform.mailer.send({
            to: user.email,
            subject: user.locale === 'en' ? 'Your Rewarded code' : 'Je Rewarded-code',
            text: user.locale === 'en' ? `Your code: ${res.code}` : `Je code: ${res.code}`,
          });
        } catch {
          deps.platform.logger?.log('warn', 'redemption_mail_failed', { route: 'POST /redemptions' });
        }
        return reply(201, { redemption_id: res.id, voucher_code: res.code, points: res.points, points_from_referral: res.fromReferral });
      },
      { noDefaultRateLimit: true },
    );

    mount(api, routes['redemptions.list'], ({ auth }) => {
      const user = userOf(auth);
      const rows = db.all<RedemptionRow>('SELECT * FROM redemption WHERE user_id = ? ORDER BY created_at DESC, id DESC', [user.id]);
      return { items: rows.map((r) => dto(r, user.locale)) };
    });

    mount(api, routes['redemptions.broken'], ({ auth, params, body }) => {
      const user = userOf(auth);
      return db.transaction(() => {
        const r = db.get<RedemptionRow>('SELECT * FROM redemption WHERE id = ?', [params.id]);
        if (!r || r.user_id !== user.id) throw new DomainError('NOT_FOUND');
        if (r.broken_reported_at !== null) throw new DomainError('ALREADY_REPORTED');
        const ticketId = ids.ulid();
        const at = deps.platform.clock.now().toISOString();
        db.run('UPDATE redemption SET broken_reported_at = ? WHERE id = ?', [at, r.id]);
        try {
          // support_ticket is WP-6's table (0300 series); without it the report stays on the redemption.
          db.run("INSERT INTO support_ticket (id, user_id, kind, ref_id, text, status, created_at) VALUES (?, ?, 'redemption_broken', ?, ?, 'open', ?)", [ticketId, user.id, r.id, body.text ?? null, at]);
        } catch {
          deps.platform.logger?.log('warn', 'support_ticket_unavailable', { route: 'POST /redemptions/:id/broken' });
        }
        return reply(201, { ticket_id: ticketId });
      });
    });

    mount(api, routes['admin.redemptions.replace'], ({ auth, params, body }) => {
      if (auth.kind !== 'user') throw new DomainError('AUTH_REQUIRED');
      const actor = adminActor(deps.platform.hasher, auth.user.id);
      return db.transaction(() => {
        const r = db.get<RedemptionRow>('SELECT * FROM redemption WHERE id = ?', [params.id]);
        if (!r || r.status === 'refunded') throw new DomainError('NOT_FOUND');
        const old = db.get<VoucherRow>('SELECT id, reward_id, code, pool FROM reward_voucher WHERE id = ?', [r.voucher_id]) as VoucherRow;
        const at = deps.platform.clock.now().toISOString();
        let newId: string;
        if (body.voucher_code) {
          if (db.get('SELECT 1 AS x FROM reward_voucher WHERE reward_id = ? AND code = ?', [r.reward_id, body.voucher_code])) throw new DomainError('VALIDATION_FAILED', { field: 'voucher_code' });
          newId = ids.ulid();
          db.run(
            "INSERT INTO reward_voucher (id, reward_id, code, pool, anchor_only, status, redemption_id, replaces_voucher_id, created_at) VALUES (?, ?, ?, ?, 0, 'reserved', ?, ?, ?)",
            [newId, r.reward_id, body.voucher_code, old.pool, r.id, old.id, at],
          );
        } else {
          const free = db.get<{ id: string }>("SELECT id FROM reward_voucher WHERE reward_id = ? AND pool = ? AND status = 'available' AND redemption_id IS NULL ORDER BY release_day, id LIMIT 1", [r.reward_id, old.pool]);
          if (!free) throw new DomainError('OUT_OF_STOCK');
          newId = free.id;
          db.run("UPDATE reward_voucher SET status = 'reserved', redemption_id = ?, replaces_voucher_id = ? WHERE id = ?", [r.id, old.id, newId]);
        }
        // A replacement is a new voucher on the same redemption, without a journal entry (architecture §5.2).
        db.run("UPDATE reward_voucher SET status = 'broken' WHERE id = ?", [old.id]);
        db.run("UPDATE redemption SET voucher_id = ?, status = 'replaced' WHERE id = ?", [newId, r.id]);
        deps.services.audit.audit(db, { actor, action: 'voucher_replaced', objectType: 'redemption', objectRef: r.id, reason: 'broken_code' });
        const locale = r.user_id ? (db.get<{ locale: 'nl' | 'en' }>('SELECT locale FROM user WHERE id = ?', [r.user_id])?.locale ?? 'nl') : 'nl';
        return { redemption: dto(db.get<RedemptionRow>('SELECT * FROM redemption WHERE id = ?', [r.id]) as RedemptionRow, locale) };
      });
    });
  },
};
