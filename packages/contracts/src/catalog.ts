// /api/v1/catalog and the partner, budget and reward admin routes (architecture §5.3, §8.2).
import { z } from 'zod';
import {
  AgeBand,
  BudgetKind,
  Cents,
  FocusDay,
  FreeText,
  IdParam,
  Instant,
  NonNegInt,
  PartnerKind,
  Points,
  ReasonCode,
  RewardKind,
  RewardStatus,
  ShortText,
  Ulid,
  WeekKey,
} from './common.ts';
import { defineRoutes } from './route.ts';

const DocumentRef = z.string().trim().min(1).max(200);

export const CatalogItem = z.strictObject({
  id: Ulid,
  kind: RewardKind,
  collective: z.boolean(),
  title: ShortText,
  partner: ShortText,
  points_price: Points,
  stock_today: NonNegInt,
  next_release: Instant.optional(),
  terms: z.string().max(2000),
});
export const CatalogResponse = z.strictObject({ items: z.array(CatalogItem) });

export const Partner = z.strictObject({ id: Ulid, name: ShortText, kind: PartnerKind, contact_ref: z.string().max(200).nullable() });
export const PartnerCreateRequest = z.strictObject({ name: ShortText, kind: PartnerKind, contact_ref: z.string().max(200).optional() });
export const PartnerListResponse = z.strictObject({ items: z.array(Partner) });

export const BudgetCreateRequest = z.strictObject({
  kind: BudgetKind,
  booked_cents: z.number().int().min(1),
  reward_pct: z.union([z.literal(20), z.literal(30), z.literal(100)]),
  document_ref: DocumentRef,
  booked_at: FocusDay,
});
export const BudgetCancelRequest = z.strictObject({ cancel_cents: z.number().int().min(1), reason_code: ReasonCode });
export const Budget = z.strictObject({
  id: Ulid,
  partner_id: Ulid,
  kind: BudgetKind,
  booked_cents: Cents,
  cancelled_cents: Cents,
  reward_pct: z.number().int().min(0).max(100),
  document_ref: DocumentRef,
  booked_at: FocusDay,
  status: z.enum(['booked', 'cancelled']),
  allocated_cents: Cents,
  free_cents: Cents,
});
export const BudgetResponse = z.strictObject({ budget: Budget });
export const BudgetOverviewResponse = z.strictObject({
  booked_cents: Cents,
  allocated_cents: Cents,
  free_cents: Cents,
  outstanding_points: Points,
  outstanding_value_cents: Cents,
  /** Coverage ratio (allocated value / outstanding value), null when nothing is outstanding. */
  coverage_ratio: z.number().nonnegative().nullable(),
});

export const RewardCreateRequest = z.strictObject({
  partner_id: Ulid,
  kind: RewardKind,
  title_nl: ShortText,
  title_en: ShortText,
  terms_nl: FreeText(2000),
  terms_en: FreeText(2000),
  cost_cents: z.number().int().min(1),
  points_price: z.number().int().min(50).multipleOf(50),
  min_age_band: AgeBand,
  declaration_ref: DocumentRef,
  collective: z.boolean(),
  budget_id: Ulid,
  stock: z.number().int().min(1).max(10_000),
});
export const AdminReward = z.strictObject({
  id: Ulid,
  partner_id: Ulid,
  kind: RewardKind,
  title_nl: ShortText,
  title_en: ShortText,
  cost_cents: Cents,
  points_price: Points,
  min_age_band: AgeBand,
  declaration_ref: DocumentRef.nullable(),
  collective: z.boolean(),
  status: RewardStatus,
  published_at: Instant.nullable(),
  allocation_cents: Cents,
  vouchers_total: NonNegInt,
  vouchers_available: NonNegInt,
});
export const AdminRewardResponse = z.strictObject({ reward: AdminReward });
/** Voucher codes as CSV text (one code per line, optional release_week,release_day,anchor_only). */
export const VoucherImportRequest = z.strictObject({ csv: z.string().min(1).max(1_000_000) });
export const VoucherImportResponse = z.strictObject({ imported: NonNegInt, duplicates: NonNegInt, reward: AdminReward });
export const RewardPublishRequest = z.strictObject({ cash_check: z.literal(true) });
export const RewardReleaseRequest = z.strictObject({
  week: WeekKey,
  /** Vouchers per weekday (Mon..Sun) to spread the release over the week (spec §4.3). */
  per_day: z.array(NonNegInt).length(7),
  anchor_only: NonNegInt.optional(),
});

export const catalogRoutes = defineRoutes({
  'catalog.list': {
    module: 'catalog', method: 'GET', path: '/catalog', auth: ['student'],
    response: CatalogResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2, spec §4.3',
  },
  'admin.partners.list': {
    module: 'catalog', method: 'GET', path: '/admin/partners', auth: ['admin'],
    response: PartnerListResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Beheer',
  },
  'admin.partners.create': {
    module: 'catalog', method: 'POST', path: '/admin/partners', auth: ['admin'],
    body: PartnerCreateRequest, response: z.strictObject({ partner: Partner }), responseKind: 'json', status: [201],
    errors: ['VALIDATION_FAILED'], spec: 'arch §8.2 Beheer',
  },
  'admin.budgets.create': {
    module: 'catalog', method: 'POST', path: '/admin/partners/:id/budgets', auth: ['admin'],
    params: IdParam, body: BudgetCreateRequest, response: BudgetResponse, responseKind: 'json', status: [201],
    errors: ['DOCUMENT_REQUIRED'], spec: 'arch §8.2 Beheer, §5.3',
  },
  'admin.budgets.cancel': {
    module: 'catalog', method: 'POST', path: '/admin/budgets/:id/cancel', auth: ['admin'],
    params: IdParam, body: BudgetCancelRequest, response: BudgetResponse, responseKind: 'json', status: [200],
    errors: ['COVERAGE_INSUFFICIENT', 'REASON_REQUIRED'], spec: 'arch §8.2 Beheer, §5.3',
  },
  'admin.budget.overview': {
    module: 'catalog', method: 'GET', path: '/admin/budget/overview', auth: ['admin'],
    response: BudgetOverviewResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Beheer, §5.5',
  },
  'admin.rewards.create': {
    module: 'catalog', method: 'POST', path: '/admin/rewards', auth: ['admin'],
    body: RewardCreateRequest, response: AdminRewardResponse, responseKind: 'json', status: [201],
    errors: ['CEILING_EXCEEDED', 'KIND_NOT_ALLOWED', 'DECLARATION_REQUIRED', 'COVERAGE_INSUFFICIENT'], spec: 'arch §8.2 Beheer, §5.3',
  },
  'admin.rewards.vouchers': {
    module: 'catalog', method: 'POST', path: '/admin/rewards/:id/vouchers', auth: ['admin'],
    params: IdParam, body: VoucherImportRequest, response: VoucherImportResponse, responseKind: 'json', status: [201],
    errors: ['VALIDATION_FAILED'], spec: 'arch §8.2 Beheer',
  },
  'admin.rewards.publish': {
    module: 'catalog', method: 'POST', path: '/admin/rewards/:id/publish', auth: ['admin'],
    params: IdParam, body: RewardPublishRequest, response: AdminRewardResponse, responseKind: 'json', status: [200],
    errors: ['DECLARATION_REQUIRED', 'CASH_CHECK_REQUIRED', 'COVERAGE_INSUFFICIENT', 'PRICE_IMMUTABLE'], spec: 'arch §8.2 Beheer, §5.3',
  },
  'admin.rewards.releases': {
    module: 'catalog', method: 'POST', path: '/admin/rewards/:id/releases', auth: ['admin'],
    params: IdParam, body: RewardReleaseRequest, response: AdminRewardResponse, responseKind: 'json', status: [200],
    errors: ['OUT_OF_STOCK'], spec: 'arch §8.2 Beheer, spec §4.3',
  },
});

// Inferred types (output side) for every schema above.
export type CatalogItem = z.output<typeof CatalogItem>;
export type CatalogResponse = z.output<typeof CatalogResponse>;
export type Partner = z.output<typeof Partner>;
export type PartnerCreateRequest = z.output<typeof PartnerCreateRequest>;
export type PartnerListResponse = z.output<typeof PartnerListResponse>;
export type BudgetCreateRequest = z.output<typeof BudgetCreateRequest>;
export type BudgetCancelRequest = z.output<typeof BudgetCancelRequest>;
export type Budget = z.output<typeof Budget>;
export type BudgetResponse = z.output<typeof BudgetResponse>;
export type BudgetOverviewResponse = z.output<typeof BudgetOverviewResponse>;
export type RewardCreateRequest = z.output<typeof RewardCreateRequest>;
export type AdminReward = z.output<typeof AdminReward>;
export type AdminRewardResponse = z.output<typeof AdminRewardResponse>;
export type VoucherImportRequest = z.output<typeof VoucherImportRequest>;
export type VoucherImportResponse = z.output<typeof VoucherImportResponse>;
export type RewardPublishRequest = z.output<typeof RewardPublishRequest>;
export type RewardReleaseRequest = z.output<typeof RewardReleaseRequest>;
