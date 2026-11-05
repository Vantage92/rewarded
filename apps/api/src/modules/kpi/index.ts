// KPI module (WP-6; spec §7.2, §4.11 KPI-overzicht; architecture §8.2 GET /admin/kpi/:query). Owner WP-6.
// Runs a stored query by name; every query also exists as `<name>_clean`, without the accounts the
// sample judged suspect or fraud. Team accounts never count. The fraud estimate is computed in core
// from the judged samples (stratified, 95% interval, reported as a lower bound).
import { DomainError, routes } from '@rewarded/contracts';
import { CURRENT_PARAMS } from '@rewarded/core';
import { sampleRules, stratifiedEstimate, type StratumObservation } from '@rewarded/core/fraud';
import type { Db } from '../../db/types.ts';
import { mount } from '../../middleware/route.ts';
import type { ApiModule } from '../../module.ts';
import { installWp6Services } from '../fraud/lib/install.ts';
import { actorOf, hasTables, parseJson } from '../fraud/lib/util.ts';
import { KPI_QUERIES, kpiSql } from './queries.ts';

type Cell = string | number | null;
export interface KpiTable {
  columns: string[];
  rows: Cell[][];
}

const cell = (v: unknown): Cell => (v === null || v === undefined ? null : typeof v === 'number' ? v : typeof v === 'bigint' ? Number(v) : String(v).slice(0, 256));

/** Fraud estimate per week and cumulative, "fraud" and "fraud or suspect" (voorregistratie §7.1). */
export function fraudEstimateTable(db: Db, from: string | null, to: string | null): KpiTable {
  const columns = ['week', 'series', 'judged', 'estimate_pct', 'lower_pct', 'upper_pct', 'below_limit', 'is_lower_bound'];
  if (!hasTables(db, 'fraud_sample', 'fraud_sample_item')) return { columns, rows: [] };
  const samples = db.all<{ id: string; week_key: string; allocation: string }>("SELECT id, week_key, allocation FROM fraud_sample WHERE kind = 'weekly' AND week_key >= ? AND week_key <= ? ORDER BY week_key", [
    from ?? '0000-01-01',
    to ?? '9999-12-31',
  ]);
  const limit = sampleRules(CURRENT_PARAMS).fraudGoNoGoPct;
  const rows: Cell[][] = [];
  const cumulative: Record<'fraud' | 'fraud_or_suspect', StratumObservation[]> = { fraud: [], fraud_or_suspect: [] };
  const pct = (x: number) => Math.round(x * 10_000) / 100;
  for (const s of samples) {
    const pop = new Map(parseJson<{ stratum: string; actives: number }[]>(s.allocation, []).map((a) => [a.stratum, a.actives]));
    const items = db.all<{ stratum: string; judgement: string; judged_at: string | null }>('SELECT stratum, judgement, judged_at FROM fraud_sample_item WHERE sample_id = ?', [s.id]);
    for (const series of ['fraud', 'fraud_or_suspect'] as const) {
      const by = new Map<string, StratumObservation>();
      for (const it of items) {
        if (!it.judged_at) continue;
        const o = by.get(it.stratum) ?? { stratum: `${s.week_key}:${it.stratum}`, population: pop.get(it.stratum) ?? 0, judged: 0, positive: 0 };
        o.judged += 1;
        if (it.judgement === 'fraud' || (series === 'fraud_or_suspect' && it.judgement === 'suspect')) o.positive += 1;
        by.set(it.stratum, o);
      }
      const obs = [...by.values()];
      cumulative[series].push(...obs);
      const e = stratifiedEstimate(obs, limit);
      rows.push([s.week_key, series, e.judged, pct(e.estimate), pct(e.lower), pct(e.upper), e.belowLimit ? 1 : 0, 1]);
    }
  }
  for (const series of ['fraud', 'fraud_or_suspect'] as const) {
    const e = stratifiedEstimate(cumulative[series], limit);
    rows.push(['cumulative', series, e.judged, pct(e.estimate), pct(e.lower), pct(e.upper), e.belowLimit ? 1 : 0, 1]);
  }
  return { columns, rows };
}

/** Runs a stored query; unknown names are NOT_FOUND. */
export function runKpi(db: Db, name: string, from: string | null, to: string | null): KpiTable {
  if (name === 'fraud_estimate' || name === 'fraud_estimate_clean') return fraudEstimateTable(db, from, to);
  const clean = name.endsWith('_clean');
  const def = KPI_QUERIES.find((q) => q.name === (clean ? name.slice(0, -'_clean'.length) : name));
  if (!def) throw new DomainError('NOT_FOUND');
  const needs = [...def.needs, 'event', 'focus_session', ...(clean ? ['fraud_sample_item'] : [])];
  const sql = kpiSql(def, clean);
  if (!hasTables(db, ...needs)) return { columns: [], rows: [] };
  const rows = db.all<Record<string, unknown>>(sql, [from, to]);
  const columns = rows.length > 0 ? Object.keys(rows[0] as object) : [];
  return { columns, rows: rows.map((r) => columns.map((c) => cell(r[c]))) };
}

export const KPI_NAMES: readonly string[] = ['fraud_estimate', ...KPI_QUERIES.map((q) => q.name)];

export const module: ApiModule = {
  name: 'kpi',
  owner: 'WP-6',
  register(api, deps) {
    installWp6Services(deps);
    const { db } = deps;
    mount(api, routes['admin.kpi.query'], ({ auth, params, query }) => {
      const actor = actorOf(deps, auth);
      const t = runKpi(db, params.query, query.from ?? null, query.to ?? null);
      db.transaction(() => deps.services.audit.audit(db, { actor, action: 'kpi_viewed', objectType: 'kpi', objectRef: params.query }));
      return { query: params.query, from: query.from ?? null, to: query.to ?? null, columns: t.columns.slice(0, 64), rows: t.rows.slice(0, 10_000).map((r) => r.slice(0, 64)), computed_at: deps.platform.clock.now().toISOString() };
    });
  },
};
