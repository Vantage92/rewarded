// Catalog module (spec §3.4, §4.3; architecture §5.3, §8.2): the student catalog with today's stock
// and the weekly stock next to the students who may redeem, plus the admin routes for partners,
// booked budgets, coverage, rewards, voucher import, publication and the spread weekly release.
// Owner WP-4. Money and freely spendable credit do not exist as a kind (core/catalog/kinds.ts).
import { CURRENT_PARAMS, addDays, focusDayOf, focusDayStart, weekKey } from '@rewarded/core';
import { allocationFits, cancelFits, coverableCents, isKindAllowed, isoWeekKey, itemCeilingOk, mondayOfIsoWeek, spreadRelease } from '@rewarded/core/catalog';
import { DomainError, routes, type AdminReward, type Budget, type CatalogItem, type RouteDef } from '@rewarded/contracts';
import { z } from 'zod';
import { idsFor } from '../../db/ids.ts';
import { adminActor } from '../../db/services/audit.ts';
import type { Db } from '../../db/types.ts';
import type { AuthState } from '../../middleware/context.ts';
import { mount, reply } from '../../middleware/route.ts';
import type { ApiModule } from '../../module.ts';
import { installWp4Services } from '../points/services.ts';
import { allocatedCents, eligibleUsers, freeBudgetCents, nextReleaseDay, poolOf, releaseDue, releasedInWeek, stockToday, type BudgetRow, type Pool } from './stock.ts';

const P = CURRENT_PARAMS;
const LEVEL = 1; // every web session has verification level 1 (architecture §4.6)

interface RewardRow {
  id: string;
  partner_id: string;
  budget_id: string;
  kind: AdminReward['kind'];
  title_nl: string;
  title_en: string;
  terms_nl: string;
  terms_en: string;
  cost_cents: number;
  points_price: number;
  min_age_band: '16_17' | '18_plus';
  declaration_ref: string | null;
  collective: number;
  stock: number;
  status: AdminReward['status'];
  published_at: string | null;
}

function adminOf(auth: AuthState, hasher: Parameters<typeof adminActor>[0]): `admin:${string}` {
  if (auth.kind !== 'user') throw new DomainError('AUTH_REQUIRED');
  return adminActor(hasher, auth.user.id);
}

export function loadReward(db: Db, id: string): RewardRow | undefined {
  return db.get<RewardRow>('SELECT * FROM reward WHERE id = ?', [id]);
}

function rewardAllocation(db: Db, id: string): number {
  return Number(db.get<{ t: number }>("SELECT COALESCE(SUM(amount_cents), 0) AS t FROM budget_allocation WHERE target_type = 'reward_stock' AND target_id = ?", [id])?.t ?? 0);
}

function adminReward(db: Db, r: RewardRow): AdminReward {
  const counts = db.get<{ total: number; avail: number }>(
    "SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN status IN ('unreleased', 'available') AND redemption_id IS NULL THEN 1 ELSE 0 END), 0) AS avail FROM reward_voucher WHERE reward_id = ? AND replaces_voucher_id IS NULL",
    [r.id],
  );
  return {
    id: r.id,
    partner_id: r.partner_id,
    kind: r.kind,
    title_nl: r.title_nl,
    title_en: r.title_en,
    cost_cents: r.cost_cents,
    points_price: r.points_price,
    min_age_band: r.min_age_band,
    declaration_ref: r.declaration_ref,
    collective: r.collective === 1,
    status: r.status,
    published_at: r.published_at,
    allocation_cents: rewardAllocation(db, r.id),
    vouchers_total: Number(counts?.total ?? 0),
    vouchers_available: Number(counts?.avail ?? 0),
  };
}

function budgetDto(db: Db, b: BudgetRow): Budget {
  const allocated = allocatedCents(db, b.id);
  return {
    id: b.id,
    partner_id: b.partner_id,
    kind: b.kind,
    booked_cents: b.booked_cents,
    cancelled_cents: b.cancelled_cents,
    reward_pct: b.reward_pct,
    document_ref: b.document_ref,
    booked_at: b.booked_at,
    status: b.status,
    allocated_cents: allocated,
    free_cents: Math.max(0, freeBudgetCents(db, b)),
    pool: b.pool,
  };
}

/** Publish body without the literal, so a missing tick answers CASH_CHECK_REQUIRED (architecture §8.2). */
const PublishBody = z.strictObject({ cash_check: z.boolean().optional() });
const publishDef = { ...routes['admin.rewards.publish'], body: PublishBody } satisfies RouteDef;

/** One CSV line: code[,release_week,release_day,anchor_only]; release_day is 1–7 (Mon–Sun) or a date. */
function parseVoucherLine(line: string): { code: string; week: string | null; day: string | null; anchor: boolean } | null {
  const cells = line.split(',').map((c) => c.trim());
  const code = cells[0] ?? '';
  if (code === '' || /^code$/i.test(code)) return null;
  if (code.length > 128) throw new DomainError('VALIDATION_FAILED', { reason: 'code_too_long' });
  const rawWeek = cells[1] ?? '';
  const rawDay = cells[2] ?? '';
  let week: string | null = null;
  let day: string | null = null;
  if (rawWeek !== '') {
    week = /^\d{4}-W\d{2}$/.test(rawWeek) ? mondayOfIsoWeek(rawWeek) : /^\d{4}-\d{2}-\d{2}$/.test(rawWeek) ? weekKey(rawWeek, P.time.week_start_iso_weekday) : null;
    if (week === null) throw new DomainError('VALIDATION_FAILED', { reason: 'release_week' });
    if (/^[1-7]$/.test(rawDay)) day = addDays(week, Number(rawDay) - 1);
    else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDay) && weekKey(rawDay, P.time.week_start_iso_weekday) === week) day = rawDay;
    else throw new DomainError('VALIDATION_FAILED', { reason: 'release_day' });
  }
  return { code, week, day, anchor: /^(1|true|ja|yes)$/i.test(cells[3] ?? '') };
}

export const module: ApiModule = {
  name: 'catalog',
  owner: 'WP-4',
  register(api, deps) {
    installWp4Services(deps);
    const { db } = deps;
    const ids = idsFor(deps.platform);
    const ctx = deps.services.pointsContext;
    const nowDate = () => deps.platform.clock.now();
    const today = () => focusDayOf(nowDate().getTime(), P);

    mount(api, routes['catalog.list'], ({ auth }) => {
      if (auth.kind !== 'user') throw new DomainError('AUTH_REQUIRED');
      const p = ctx.profile(db, auth.user.id);
      if (!p) throw new DomainError('NOT_FOUND');
      const t = today();
      db.transaction(() => releaseDue(db, t));
      const pool = poolOf(p.cohort, t);
      const en = auth.user.locale === 'en';
      const rows = db.all<RewardRow & { partner_name: string }>(
        `SELECT r.*, pa.name AS partner_name FROM reward r JOIN partner pa ON pa.id = r.partner_id
          WHERE r.status = 'published' AND (r.min_age_band = '16_17' OR ? = '18_plus') ORDER BY r.collective DESC, r.points_price, r.id`,
        [p.ageBand],
      );
      const items: CatalogItem[] = rows.map((r) => {
        const next = nextReleaseDay(db, r.id, pool, t);
        return {
          id: r.id,
          kind: r.kind,
          collective: r.collective === 1,
          title: (en ? r.title_en : r.title_nl).slice(0, 120),
          partner: r.partner_name.slice(0, 120),
          points_price: r.points_price,
          stock_today: stockToday(db, r.id, pool, t, p.institutionVerified),
          ...(next ? { next_release: new Date(focusDayStart(next, P)).toISOString() } : {}),
          terms: (en ? r.terms_en : r.terms_nl).slice(0, 2000),
        };
      });
      const monday = weekKey(t, P.time.week_start_iso_weekday);
      return {
        items,
        week: { week: isoWeekKey(monday), released: releasedInWeek(db, pool, monday), eligible_users: eligibleUsers(db, pool, t, nowDate().toISOString()) },
      };
    });

    mount(api, routes['admin.partners.list'], () => ({
      items: db.all<{ id: string; name: string; kind: 'vereniging' | 'faculteit' | 'sponsor' | 'werkgever' | 'rewarded'; contact_ref: string | null }>('SELECT id, name, kind, contact_ref FROM partner ORDER BY name, id'),
    }));

    mount(api, routes['admin.partners.create'], ({ auth, body }) => {
      const actor = adminOf(auth, deps.platform.hasher);
      return db.transaction(() => {
        const id = ids.ulid();
        db.run('INSERT INTO partner (id, name, kind, contact_ref, created_at) VALUES (?, ?, ?, ?, ?)', [id, body.name, body.kind, body.contact_ref ?? null, nowDate().toISOString()]);
        deps.services.audit.audit(db, { actor, action: 'partner_created', objectType: 'partner', objectRef: id });
        return reply(201, { partner: { id, name: body.name, kind: body.kind, contact_ref: body.contact_ref ?? null } });
      });
    });

    mount(api, routes['admin.budgets.create'], ({ auth, params, body }) => {
      const actor = adminOf(auth, deps.platform.hasher);
      // Booked = invoiced or a signed contract with amount and date; without a document no row (spec §4.3).
      if (body.document_ref.trim() === '') throw new DomainError('DOCUMENT_REQUIRED');
      if ((body.kind === 'revenue') !== (body.reward_pct !== 100)) throw new DomainError('VALIDATION_FAILED', { field: 'reward_pct' });
      return db.transaction(() => {
        const partner = db.get<{ id: string; kind: string }>('SELECT id, kind FROM partner WHERE id = ?', [params.id]);
        if (!partner) throw new DomainError('NOT_FOUND');
        if ((body.kind === 'own_budget') !== (partner.kind === 'rewarded')) throw new DomainError('VALIDATION_FAILED', { field: 'kind' });
        const id = ids.ulid();
        db.run(
          `INSERT INTO partner_budget (id, partner_id, kind, pool, booked_cents, reward_pct, document_ref, booked_at, status, cancelled_cents, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'booked', 0, ?, ?)`,
          [id, partner.id, body.kind, body.pool ?? 'pilot', body.booked_cents, body.reward_pct, body.document_ref.trim(), body.booked_at, actor, nowDate().toISOString()],
        );
        deps.services.audit.audit(db, { actor, action: 'budget_booked', objectType: 'partner_budget', objectRef: id });
        return reply(201, { budget: budgetDto(db, db.get<BudgetRow>('SELECT * FROM partner_budget WHERE id = ?', [id]) as BudgetRow) });
      });
    });

    mount(api, routes['admin.budgets.cancel'], ({ auth, params, body }) => {
      const actor = adminOf(auth, deps.platform.hasher);
      return db.transaction(() => {
        const b = db.get<BudgetRow>('SELECT * FROM partner_budget WHERE id = ?', [params.id]);
        if (!b) throw new DomainError('NOT_FOUND');
        // Cancelling needs free room for the cancelled part; otherwise take items offline first (§5.3).
        if (!cancelFits({ bookedCents: b.booked_cents, cancelledCents: b.cancelled_cents, rewardPct: b.reward_pct }, allocatedCents(db, b.id), body.cancel_cents)) {
          throw new DomainError('COVERAGE_INSUFFICIENT');
        }
        const cancelled = b.cancelled_cents + body.cancel_cents;
        db.run('UPDATE partner_budget SET cancelled_cents = ?, status = ? WHERE id = ?', [cancelled, cancelled >= b.booked_cents ? 'cancelled' : 'booked', b.id]);
        deps.services.audit.audit(db, { actor, action: 'budget_cancelled', objectType: 'partner_budget', objectRef: b.id, reason: body.reason_code });
        return { budget: budgetDto(db, db.get<BudgetRow>('SELECT * FROM partner_budget WHERE id = ?', [b.id]) as BudgetRow) };
      });
    });

    mount(api, routes['admin.budget.overview'], () => {
      const budgets = db.all<BudgetRow>('SELECT * FROM partner_budget');
      const booked = budgets.reduce((t, b) => t + coverableCents({ bookedCents: b.booked_cents, cancelledCents: b.cancelled_cents, rewardPct: b.reward_pct }), 0);
      const allocated = Number(db.get<{ t: number }>('SELECT COALESCE(SUM(amount_cents), 0) AS t FROM budget_allocation')?.t ?? 0);
      const outstanding = Number(
        db.get<{ t: number }>(
          "SELECT COALESCE(SUM(p.amount), 0) AS t FROM posting p JOIN ledger_account a ON a.id = p.account_id WHERE a.owner_type = 'user' AND a.kind IN ('available_own', 'available_referral')",
        )?.t ?? 0,
      );
      // Budget value per point: the implied value of the published price list (spec §4.3, published internally).
      const price = db.get<{ cents: number; points: number }>("SELECT COALESCE(SUM(cost_cents), 0) AS cents, COALESCE(SUM(points_price), 0) AS points FROM reward WHERE status = 'published'");
      const valuePerPoint = price && price.points > 0 ? price.cents / price.points : 0;
      const outstandingValue = Math.round(Math.max(0, outstanding) * valuePerPoint);
      return {
        booked_cents: booked,
        allocated_cents: allocated,
        free_cents: booked - allocated,
        outstanding_points: outstanding,
        outstanding_value_cents: outstandingValue,
        coverage_ratio: outstandingValue > 0 ? allocated / outstandingValue : null,
      };
    });

    mount(api, routes['admin.rewards.create'], ({ auth, body }) => {
      const actor = adminOf(auth, deps.platform.hasher);
      if (!isKindAllowed(P, LEVEL, body.kind)) throw new DomainError('KIND_NOT_ALLOWED');
      if (!itemCeilingOk(P, LEVEL, body.cost_cents)) throw new DomainError('CEILING_EXCEEDED', { max_cents: 500 });
      if (body.declaration_ref.trim() === '') throw new DomainError('DECLARATION_REQUIRED');
      return db.transaction(() => {
        if (!db.get('SELECT 1 AS x FROM partner WHERE id = ?', [body.partner_id])) throw new DomainError('NOT_FOUND');
        const b = db.get<BudgetRow>("SELECT * FROM partner_budget WHERE id = ? AND status = 'booked'", [body.budget_id]);
        if (!b) throw new DomainError('NOT_FOUND');
        const amount = body.cost_cents * body.stock;
        // Coverage on booked revenue: cost × stock must fit the free budget (spec §4.3).
        if (!allocationFits({ bookedCents: b.booked_cents, cancelledCents: b.cancelled_cents, rewardPct: b.reward_pct }, allocatedCents(db, b.id), amount)) {
          throw new DomainError('COVERAGE_INSUFFICIENT', { free_cents: Math.max(0, freeBudgetCents(db, b)) });
        }
        const id = ids.ulid();
        const at = nowDate().toISOString();
        db.run(
          `INSERT INTO reward (id, partner_id, budget_id, kind, title_nl, title_en, terms_nl, terms_en, cost_cents, points_price, min_age_band, declaration_ref, collective, stock, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
          [id, body.partner_id, b.id, body.kind, body.title_nl, body.title_en, body.terms_nl, body.terms_en, body.cost_cents, body.points_price, body.min_age_band, body.declaration_ref.trim(), body.collective ? 1 : 0, body.stock, at],
        );
        const allocId = ids.ulid();
        db.run(
          "INSERT INTO budget_allocation (id, budget_id, target_type, target_id, amount_cents, reason_code, created_at, created_by) VALUES (?, ?, 'reward_stock', ?, ?, 'reward_stock', ?, ?)",
          [allocId, b.id, id, amount, at, actor],
        );
        deps.services.audit.audit(db, { actor, action: 'reward_created', objectType: 'reward', objectRef: id });
        deps.services.audit.audit(db, { actor, action: 'budget_allocated', objectType: 'budget_allocation', objectRef: allocId });
        return reply(201, { reward: adminReward(db, loadReward(db, id) as RewardRow) });
      });
    });

    mount(api, routes['admin.rewards.vouchers'], ({ auth, params, body }) => {
      const actor = adminOf(auth, deps.platform.hasher);
      return db.transaction(() => {
        const r = loadReward(db, params.id);
        if (!r) throw new DomainError('NOT_FOUND');
        const pool = (db.get<{ pool: Pool }>('SELECT pool FROM partner_budget WHERE id = ?', [r.budget_id]) as { pool: Pool }).pool;
        const lines = body.csv.split(/\r?\n/).map(parseVoucherLine).filter((l): l is NonNullable<typeof l> => l !== null);
        const existing = Number(db.get<{ n: number }>('SELECT COUNT(*) AS n FROM reward_voucher WHERE reward_id = ? AND replaces_voucher_id IS NULL', [r.id])?.n ?? 0);
        let imported = 0;
        let duplicates = 0;
        const at = nowDate().toISOString();
        for (const l of lines) {
          if (db.get('SELECT 1 AS x FROM reward_voucher WHERE reward_id = ? AND code = ?', [r.id, l.code])) {
            duplicates += 1;
            continue;
          }
          // Stock beyond the allocation is not covered (cost × stock was allocated at creation).
          if (existing + imported >= r.stock) throw new DomainError('VALIDATION_FAILED', { reason: 'stock_exceeded', stock: r.stock });
          db.run(
            "INSERT INTO reward_voucher (id, reward_id, code, pool, release_week, release_day, anchor_only, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'unreleased', ?)",
            [ids.ulid(), r.id, l.code, pool, l.week, l.day, l.anchor ? 1 : 0, at],
          );
          imported += 1;
        }
        deps.services.audit.audit(db, { actor, action: 'vouchers_imported', objectType: 'reward', objectRef: r.id });
        return reply(201, { imported, duplicates, reward: adminReward(db, r) });
      });
    });

    mount(api, publishDef, ({ auth, params, body }) => {
      const actor = adminOf(auth, deps.platform.hasher);
      return db.transaction(() => {
        const r = loadReward(db, params.id);
        if (!r) throw new DomainError('NOT_FOUND');
        if (!r.declaration_ref) throw new DomainError('DECLARATION_REQUIRED');
        if (body.cash_check !== true) throw new DomainError('CASH_CHECK_REQUIRED');
        if (!isKindAllowed(P, LEVEL, r.kind)) throw new DomainError('KIND_NOT_ALLOWED');
        if (r.status === 'published') return { reward: adminReward(db, r) };
        const vouchers = Number(db.get<{ n: number }>("SELECT COUNT(*) AS n FROM reward_voucher WHERE reward_id = ? AND status IN ('unreleased', 'available')", [r.id])?.n ?? 0);
        if (vouchers === 0) throw new DomainError('VALIDATION_FAILED', { reason: 'no_vouchers' });
        if (rewardAllocation(db, r.id) < r.cost_cents * vouchers) throw new DomainError('COVERAGE_INSUFFICIENT');
        const at = nowDate().toISOString();
        db.run("UPDATE reward SET status = 'published', cash_check_by = ?, cash_check_at = ?, published_at = ?, published_by = ? WHERE id = ?", [actor, at, at, actor, r.id]);
        releaseDue(db, today());
        deps.services.audit.audit(db, { actor, action: 'reward_published', objectType: 'reward', objectRef: r.id });
        return { reward: adminReward(db, loadReward(db, r.id) as RewardRow) };
      });
    });

    mount(api, routes['admin.rewards.releases'], ({ auth, params, body }) => {
      const actor = adminOf(auth, deps.platform.hasher);
      return db.transaction(() => {
        const r = loadReward(db, params.id);
        if (!r) throw new DomainError('NOT_FOUND');
        const monday = mondayOfIsoWeek(body.week);
        const total = body.per_day.reduce((a, b) => a + b, 0);
        const free = db.all<{ id: string }>("SELECT id FROM reward_voucher WHERE reward_id = ? AND status = 'unreleased' AND release_week IS NULL AND redemption_id IS NULL ORDER BY id LIMIT ?", [r.id, total]);
        if (free.length < total) throw new DomainError('OUT_OF_STOCK', { unscheduled: free.length });
        // Spread over the week; a share is reserved for accounts with an institution anchor (spec §4.3).
        const anchorTotal = body.anchor_only ?? spreadRelease(P, total).anchorPerDay.reduce((a, b) => a + b, 0);
        if (anchorTotal > total) throw new DomainError('VALIDATION_FAILED', { field: 'anchor_only' });
        let next = 0;
        let anchorLeft = anchorTotal;
        body.per_day.forEach((n, i) => {
          const day = addDays(monday, i);
          const anchorToday = Math.min(n, Math.ceil((anchorLeft * n) / Math.max(1, total - next)));
          for (let k = 0; k < n; k++) {
            const v = free[next] as { id: string };
            const anchor = k < anchorToday ? 1 : 0;
            db.run('UPDATE reward_voucher SET release_week = ?, release_day = ?, anchor_only = ? WHERE id = ?', [monday, day, anchor, v.id]);
            next += 1;
          }
          anchorLeft -= anchorToday;
        });
        if (r.status === 'published') releaseDue(db, today());
        deps.services.audit.audit(db, { actor, action: 'release_scheduled', objectType: 'reward', objectRef: r.id });
        return { reward: adminReward(db, loadReward(db, r.id) as RewardRow) };
      });
    });
  },
};
