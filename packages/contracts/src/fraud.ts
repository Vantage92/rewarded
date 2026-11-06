// Fraud queue, reports, appeals, samples and the institution anchor (architecture §4.5, §6.5, §8.2, §10.8; spec §6).
import { z } from 'zod';
import {
  AbortReason,
  AppealObjectType,
  AppealOutcome,
  Email,
  FlagCode,
  FlagDecision,
  FlagStatus,
  FlagSubjectType,
  FocusDay,
  FreeText,
  IdParam,
  Instant,
  NetClass,
  NonNegInt,
  PlannedMin,
  ReasonCode,
  Ref,
  ReviewStatus,
  SampleJudgement,
  SessionStatus,
  Ulid,
  WeekKey,
} from './common.ts';
import { defineRoutes } from './route.ts';

export const AppealRequest = z.strictObject({ object_type: AppealObjectType, object_id: Ulid, text: FreeText(2000) });
export const AppealResponse = z.strictObject({ appeal_id: Ulid });

/** A decision about the student's own sessions or account (F8, P4 Meldingen; repair wave). */
export const MyDecision = z.strictObject({
  flag_id: Ulid,
  /** `review`: a flag on sessions; `block`: the account is blocked. */
  kind: z.enum(['review', 'block']),
  status: FlagStatus,
  /** Reason code of the decision (UX §6.2 F8 list), null while open. */
  reason_code: ReasonCode.nullable(),
  decided_at: Instant.nullable(),
  /** Appeal possible until (14 days after the decision), null when nothing can be appealed. */
  appeal_until: Instant.nullable(),
  appeal: z.strictObject({ id: Ulid, status: z.enum(['open', 'decided', 'closed']), outcome: AppealOutcome.nullable(), motivation: z.string().max(2000).nullable() }).nullable(),
});
export const MyDecisionsResponse = z.strictObject({ items: z.array(MyDecision).max(200) });

export const InstitutionStartRequest = z.strictObject({ email: Email });
export const InstitutionConfirmRequest = z.strictObject({ code: z.string().regex(/^\d{6}$/) });
export const InstitutionConfirmResponse = z.strictObject({ domain: z.string().max(253), verified: z.literal(true) });

export const FlagSessionEvidence = z.strictObject({
  session_id: Ulid,
  user_ref: Ref,
  focus_day: FocusDay,
  planned_min: PlannedMin,
  status: SessionStatus,
  abort_reason: AbortReason.nullable(),
  review_status: ReviewStatus,
  net_class: NetClass,
  server_start_at: Instant,
});
export const AdminFlag = z.strictObject({
  id: Ulid,
  code: FlagCode,
  subject_type: FlagSubjectType,
  subject_ref: Ref.nullable(),
  status: FlagStatus,
  /** Heuristic evidence as produced by core/fraud; shape per code. */
  evidence: z.record(z.string(), z.unknown()),
  sessions: z.array(FlagSessionEvidence),
  created_at: Instant,
  decided_by_ref: Ref.nullable(),
  decided_at: Instant.nullable(),
  block_confirmed_by_ref: Ref.nullable(),
  reason_code: ReasonCode.nullable(),
});
export const FlagListQuery = z.strictObject({ status: FlagStatus.optional(), cursor: z.string().max(256).optional() });
export const FlagListResponse = z.strictObject({ items: z.array(AdminFlag), next_cursor: z.string().max(256).nullable() });
export const FlagDecisionRequest = z.strictObject({ decision: FlagDecision, reason_code: ReasonCode, note: z.string().trim().max(2000) });
export const FlagDecisionResponse = z.strictObject({
  flag: AdminFlag,
  /** Journal entries booked by reconcileDay as a consequence (architecture §5.1). */
  postings: z.array(z.strictObject({ type: z.string().max(32), amount: z.number().int(), idempotency_key: z.string().max(128) })),
  block_pending_confirmation: z.boolean(),
});
export const BlockConfirmRequest = z.strictObject({ note: FreeText(2000) });
export const BlockConfirmResponse = z.strictObject({ flag: AdminFlag, phone_hash_blocked: z.boolean() });

export const AdminAppeal = z.strictObject({
  id: Ulid,
  object_type: AppealObjectType,
  object_id: Ulid,
  user_ref: Ref.nullable(),
  text: z.string().max(2000).nullable(),
  status: z.enum(['open', 'decided']),
  submitted_at: Instant,
  due_at: Instant,
  waiting_for_third: z.boolean(),
  outcome: AppealOutcome.nullable(),
  motivation: z.string().max(4000).nullable(),
});
export const AppealListResponse = z.strictObject({ items: z.array(AdminAppeal) });
export const AppealDecisionRequest = z.strictObject({ outcome: AppealOutcome, motivation: FreeText(4000) });
export const AppealDecisionResponse = z.strictObject({ appeal: AdminAppeal });

export const FirstRedemptionsResponse = z.strictObject({
  items: z.array(
    z.strictObject({
      user_ref: Ref,
      first_redeem_after: Instant,
      sessions_7d: NonNegInt,
      pattern: z.record(z.string(), z.number()),
      anchor: z.enum(['none', 'institution', 'phone', 'both']),
      phone_line_type: z.enum(['mobile', 'none']),
      h11: z.boolean(),
    }),
  ),
});

export const SampleItem = z.strictObject({
  id: Ulid,
  user_ref: Ref,
  stratum: z.string().max(32),
  checks: z.record(z.string(), z.unknown()),
  judgement: SampleJudgement,
  reason_code: ReasonCode.nullable(),
  judged_at: Instant.nullable(),
});
export const CurrentSampleResponse = z.strictObject({
  sample: z
    .strictObject({ id: Ulid, week_key: WeekKey, kind: z.enum(['weekly', 'prize']), seed_version: z.string().max(32), drawn_at: Instant, items: z.array(SampleItem) })
    .nullable(),
});
export const SampleItemParams = z.strictObject({ id: Ulid, item: Ulid });
export const SampleJudgementRequest = z.strictObject({
  checks: z.strictObject({ anchor: z.boolean(), line_type: z.boolean(), pattern: z.boolean(), contact: z.boolean() }),
  judgement: SampleJudgement,
  reason_code: ReasonCode,
});
export const SampleJudgementResponse = z.strictObject({ item: SampleItem, flag_id: Ulid.nullable() });

export const fraudRoutes = defineRoutes({
  'appeals.mine': {
    module: 'fraud', method: 'GET', path: '/appeals/mine', auth: ['student'],
    response: MyDecisionsResponse, responseKind: 'json', status: [200], errors: [], spec: 'spec §6.4, §6.5; UX §6.2 F8 (repair wave)',
  },
  'appeals.create': {
    module: 'fraud', method: 'POST', path: '/appeals', auth: ['student'],
    body: AppealRequest, response: AppealResponse, responseKind: 'json', status: [201],
    errors: ['APPEAL_WINDOW_CLOSED', 'ALREADY_APPEALED'], spec: 'arch §8.2, spec §6.5',
  },
  'institution.start': {
    module: 'fraud', method: 'POST', path: '/me/institution-email/start', auth: ['student'],
    body: InstitutionStartRequest, response: z.strictObject({}), responseKind: 'json', status: [202],
    errors: ['DOMAIN_NOT_ALLOWED', 'INSTITUTION_EMAIL_IN_USE', 'RATE_LIMITED'], spec: 'arch §8.2 (instellingsanker)',
  },
  'institution.confirm': {
    module: 'fraud', method: 'POST', path: '/me/institution-email/confirm', auth: ['student'],
    body: InstitutionConfirmRequest, response: InstitutionConfirmResponse, responseKind: 'json', status: [200],
    errors: ['CODE_INVALID', 'CODE_EXPIRED', 'TOO_MANY_ATTEMPTS'], spec: 'arch §8.2',
  },
  'admin.flags.list': {
    module: 'fraud', method: 'GET', path: '/admin/flags', auth: ['admin'],
    query: FlagListQuery, response: FlagListResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Beheer (audit per view)',
  },
  'admin.flags.decide': {
    module: 'fraud', method: 'POST', path: '/admin/flags/:id/decision', auth: ['admin'],
    params: IdParam, body: FlagDecisionRequest, response: FlagDecisionResponse, responseKind: 'json', status: [200],
    errors: ['REASON_REQUIRED', 'FOUR_EYES_REQUIRED', 'NOT_FOUND', 'SAME_REVIEWER'], spec: 'arch §8.2 Beheer, §5.1, §10.8',
  },
  'admin.blocks.confirm': {
    module: 'fraud', method: 'POST', path: '/admin/blocks/:id/confirm', auth: ['admin'],
    params: IdParam, body: BlockConfirmRequest, response: BlockConfirmResponse, responseKind: 'json', status: [200],
    errors: ['SAME_REVIEWER'], spec: 'arch §8.2 Beheer, §10.8',
  },
  'admin.appeals.list': {
    module: 'fraud', method: 'GET', path: '/admin/appeals', auth: ['admin'],
    response: AppealListResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Beheer',
  },
  'admin.appeals.decide': {
    module: 'fraud', method: 'POST', path: '/admin/appeals/:id/decision', auth: ['admin'],
    params: IdParam, body: AppealDecisionRequest, response: AppealDecisionResponse, responseKind: 'json', status: [200],
    errors: ['SAME_REVIEWER', 'NO_ELIGIBLE_REVIEWER', 'REASON_REQUIRED'], spec: 'arch §8.2 Beheer, §10.8',
  },
  'admin.firstRedemptions': {
    module: 'fraud', method: 'GET', path: '/admin/first-redemptions', auth: ['admin'],
    response: FirstRedemptionsResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Beheer, §5.2',
  },
  'admin.samples.current': {
    module: 'fraud', method: 'GET', path: '/admin/samples/current', auth: ['admin'],
    response: CurrentSampleResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Beheer, §6.5',
  },
  'admin.samples.judge': {
    module: 'fraud', method: 'POST', path: '/admin/samples/:id/items/:item/judgement', auth: ['admin'],
    params: SampleItemParams, body: SampleJudgementRequest, response: SampleJudgementResponse, responseKind: 'json', status: [200],
    errors: ['REASON_REQUIRED', 'SAME_REVIEWER'], spec: 'arch §8.2 Beheer, §6.5',
  },
});

// Inferred types (output side) for every schema above.
export type AppealRequest = z.output<typeof AppealRequest>;
export type AppealResponse = z.output<typeof AppealResponse>;
export type InstitutionStartRequest = z.output<typeof InstitutionStartRequest>;
export type InstitutionConfirmRequest = z.output<typeof InstitutionConfirmRequest>;
export type InstitutionConfirmResponse = z.output<typeof InstitutionConfirmResponse>;
export type FlagSessionEvidence = z.output<typeof FlagSessionEvidence>;
export type AdminFlag = z.output<typeof AdminFlag>;
export type FlagListQuery = z.output<typeof FlagListQuery>;
export type FlagListResponse = z.output<typeof FlagListResponse>;
export type FlagDecisionRequest = z.output<typeof FlagDecisionRequest>;
export type FlagDecisionResponse = z.output<typeof FlagDecisionResponse>;
export type BlockConfirmRequest = z.output<typeof BlockConfirmRequest>;
export type BlockConfirmResponse = z.output<typeof BlockConfirmResponse>;
export type AdminAppeal = z.output<typeof AdminAppeal>;
export type AppealListResponse = z.output<typeof AppealListResponse>;
export type AppealDecisionRequest = z.output<typeof AppealDecisionRequest>;
export type AppealDecisionResponse = z.output<typeof AppealDecisionResponse>;
export type FirstRedemptionsResponse = z.output<typeof FirstRedemptionsResponse>;
export type SampleItem = z.output<typeof SampleItem>;
export type CurrentSampleResponse = z.output<typeof CurrentSampleResponse>;
export type SampleItemParams = z.output<typeof SampleItemParams>;
export type SampleJudgementRequest = z.output<typeof SampleJudgementRequest>;
export type SampleJudgementResponse = z.output<typeof SampleJudgementResponse>;

export type MyDecision = z.output<typeof MyDecision>;
export type MyDecisionsResponse = z.output<typeof MyDecisionsResponse>;
