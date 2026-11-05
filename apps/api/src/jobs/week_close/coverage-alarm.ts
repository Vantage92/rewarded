// Week close step "dekkingsalarm" (spec §4.3 Verplichting naast budget; architecture §5.3, §6.1).
// Owner WP-4. Runs on Monday 05:45 after the day close of Sunday: per pool, the users past the
// earn-in period (times one redemption) against the stock released for the coming week. A shortfall
// becomes a coverage_alert row and event; prices and the release schedule do not change (founder G3).
import { CURRENT_PARAMS, focusDayOf, weekKey } from '@rewarded/core';
import { coverageShortfall, isoWeekKey } from '@rewarded/core/catalog';
import { eligibleUsers, releasedInWeek, type Pool } from '../../modules/catalog/stock.ts';
import type { ModuleDeps } from '../../module.ts';

const P = CURRENT_PARAMS;
const POOLS: readonly Pool[] = ['pilot', 'research', 'expansion'];

/** Context of a week close step; the orchestrator (jobs/week_close/index.ts, WP-6) passes it in. */
export interface WeekCloseStepContext {
  deps: ModuleDeps;
  now: Date;
  /** Monday (focus day) of the week that starts now; defaults to the week of `now`. */
  week?: string;
}

export interface WeekCloseStep {
  name: string;
  owner: string;
  run(ctx: WeekCloseStepContext): void | Promise<void>;
}

export interface CoverageResult {
  pool: Pool;
  eligible: number;
  released: number;
  shortfall: number;
}

export function coverageAlarm(ctx: WeekCloseStepContext): CoverageResult[] {
  const { db, services } = ctx.deps;
  const today = focusDayOf(ctx.now.getTime(), P);
  const monday = ctx.week ?? weekKey(today, P.time.week_start_iso_weekday);
  const out: CoverageResult[] = [];
  db.transaction(() => {
    for (const pool of POOLS) {
      const eligible = eligibleUsers(db, pool, today, ctx.now.toISOString());
      const released = releasedInWeek(db, pool, monday);
      const shortfall = coverageShortfall(eligible, released, P.points.redemptions_per_week);
      out.push({ pool, eligible, released, shortfall });
      if (shortfall === 0) continue;
      const created = db.run('INSERT OR IGNORE INTO coverage_alert (week, pool, eligible_users, released_next_week, shortfall, created_at) VALUES (?, ?, ?, ?, ?, ?)', [
        monday,
        pool,
        eligible,
        released,
        shortfall,
        ctx.now.toISOString(),
      ]).changes;
      if (created === 0) continue;
      // Shortfall in euros at the average cost of the pool's published items.
      const avg = db.get<{ c: number | null }>("SELECT AVG(r.cost_cents) AS c FROM reward r JOIN partner_budget b ON b.id = r.budget_id WHERE r.status = 'published' AND b.pool = ?", [pool])?.c ?? 0;
      try {
        // A system event without a pseudonym; the SQL writer of WP-3 only allows that for invite_link_opened.
        services.events.event(db, 'coverage_alert', { tekort_eur: Math.round(shortfall * Number(avg)) / 100, week: isoWeekKey(monday) });
      } catch {
        ctx.deps.platform.logger?.log('warn', 'coverage_alert_event_skipped', { route: '/jobs/week_close/coverage-alarm' });
      }
    }
  });
  return out;
}

export const step: WeekCloseStep = {
  name: 'coverage-alarm',
  owner: 'WP-4',
  run(ctx) {
    coverageAlarm(ctx);
  },
};
