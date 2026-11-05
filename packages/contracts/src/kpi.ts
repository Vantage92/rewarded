// /api/v1/admin/kpi (architecture §8.2; spec §7.2 stored queries).
import { z } from 'zod';
import { FocusDay, Instant } from './common.ts';
import { defineRoutes } from './route.ts';

export const KpiParams = z.strictObject({ query: z.string().regex(/^[a-z][a-z0-9_]{1,63}$/) });
export const KpiQuery = z.strictObject({ from: FocusDay.optional(), to: FocusDay.optional() });
export const KpiResponse = z.strictObject({
  query: z.string().max(64),
  from: FocusDay.nullable(),
  to: FocusDay.nullable(),
  columns: z.array(z.string().max(64)).max(64),
  rows: z.array(z.array(z.union([z.string().max(256), z.number(), z.null()])).max(64)).max(10_000),
  computed_at: Instant,
});

export const kpiRoutes = defineRoutes({
  'admin.kpi.query': {
    module: 'kpi', method: 'GET', path: '/admin/kpi/:query', auth: ['admin'],
    params: KpiParams, query: KpiQuery, response: KpiResponse, responseKind: 'json', status: [200], errors: ['NOT_FOUND'], spec: 'arch §8.2 Beheer, spec §7.2',
  },
});

// Inferred types (output side) for every schema above.
export type KpiParams = z.output<typeof KpiParams>;
export type KpiQuery = z.output<typeof KpiQuery>;
export type KpiResponse = z.output<typeof KpiResponse>;
