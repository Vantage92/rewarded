// Admin routes that belong to no other domain module (architecture §8.2 "Beheer", §10.8).
import { z } from 'zod';
import {
  AgeBand,
  ArmSwitchReason,
  ExperimentFactor,
  ExperimentUnit,
  FeatureFlagKey,
  FocusDay,
  FreeText,
  HarmCode,
  IdParam,
  Instant,
  NetClass,
  NonNegInt,
  PosInt,
  PrizeKind,
  PrizeStatus,
  Ref,
  ShortText,
  Ulid,
  UserStatus,
} from './common.ts';
import { SessionDto } from './sessions.ts';
import { defineRoutes } from './route.ts';

const TotpCode = z.string().regex(/^\d{6}$/);
export const MfaEnrollResponse = z.strictObject({ otpauth_uri: z.string().startsWith('otpauth://totp/').max(512), secret_base32: z.string().regex(/^[A-Z2-7]{16,64}$/) });
export const MfaVerifyRequest = z.strictObject({ code: TotpCode });
export const MfaVerifyResponse = z.strictObject({ mfa_at: Instant });

/** `reason` is mandatory for every lookup of personal data (audit line, §10.8). */
export const UserSearchQuery = z.strictObject({ q: z.string().trim().min(2).max(120), reason: FreeText(200) });
export const UserGetQuery = z.strictObject({ reason: FreeText(200) });
export const AdminUserSummary = z.strictObject({
  id: Ulid,
  first_name: ShortText,
  email: z.email().max(254),
  age_band: AgeBand,
  status: UserStatus,
  is_team: z.boolean(),
  created_at: Instant,
});
export const UserSearchResponse = z.strictObject({ items: z.array(AdminUserSummary).max(50) });
export const AdminUserDetail = z.strictObject({ user: AdminUserSummary, sessions: z.array(SessionDto), open_flags: NonNegInt });
export const TeamFlagResponse = z.strictObject({ user_id: Ulid, is_team: z.literal(true) });

export const AdminPrize = z.strictObject({
  id: Ulid,
  kind: PrizeKind,
  challenge_id: Ulid.nullable(),
  value_cents: NonNegInt,
  min_age_band: AgeBand,
  winner_ref: Ref.nullable(),
  winner_club_id: Ulid.nullable(),
  status: PrizeStatus,
  verified_by_ref: Ref.nullable(),
  age_check_outcome: z.enum(['ok', 'failed']).nullable(),
  deliver_after: Instant.nullable(),
});
export const PrizeResponse = z.strictObject({ prize: AdminPrize });
export const PrizeVerifyRequest = z.strictObject({ checks: z.strictObject({ sample_done: z.boolean(), anchor: z.boolean(), minutes: z.boolean() }), note: z.string().trim().max(1000).optional() });
/** Outcome only; never a copy of the identity document (§8.2). */
export const PrizeAgeCheckRequest = z.strictObject({ outcome: z.enum(['ok', 'failed']), document_kind: z.enum(['passport', 'id_card', 'drivers_license', 'student_card']) });
export const PrizeDeliveryContactRequest = z.strictObject({ full_name: z.string().trim().min(2).max(120), address: z.string().trim().min(5).max(300) });

export const VacationPauseRequest = z
  .strictObject({ start_day: FocusDay, end_day: FocusDay })
  .refine((v) => v.start_day <= v.end_day, { message: 'start_before_end', path: ['end_day'] });
export const VacationPauseResponse = z.strictObject({ start_day: FocusDay, end_day: FocusDay, updated_at: Instant });

export const ExperimentsResponse = z.strictObject({
  assignments: z.array(
    z.strictObject({ unit_type: ExperimentUnit, unit_ref: Ref, factor: ExperimentFactor, arm: z.string().max(16), stratum: z.string().max(32), block: z.string().max(64), assigned_at: Instant }),
  ),
  switches: z.array(z.strictObject({ user_ref: Ref, factor: ExperimentFactor, from: z.string().max(16), to: z.string().max(16), reason: ArmSwitchReason, at: Instant })),
});
export const FeatureFlagParams = z.strictObject({ key: FeatureFlagKey });
export const FeatureFlagRequest = z.strictObject({ enabled: z.boolean() });
export const FeatureFlagResponse = z.strictObject({
  key: FeatureFlagKey,
  enabled: z.boolean(),
  /** True when a second admin still has to confirm (rest_period, arm_b). */
  pending_confirmation: z.boolean(),
});

export const WellbeingSummaryResponse = z.strictObject({
  signals: z.array(z.strictObject({ code: HarmCode, arm: z.string().max(16), count: NonNegInt })),
  stop_rule: z.strictObject({ count: NonNegInt, threshold: PosInt, triggered: z.boolean() }),
});
export const ArmBStopRequest = z.strictObject({ reason: FreeText(1000) });
export const ArmBStopResponse = z.strictObject({ effective_from_day: FocusDay, pending_confirmation: z.boolean() });

export const Ambassador = z.strictObject({ id: Ulid, code_invite_id: Ulid, name_ref: z.string().max(120), is_board_member_of: Ulid.nullable(), cap_users: PosInt, registered: NonNegInt });
export const AmbassadorCreate = z.strictObject({ name_ref: z.string().trim().min(1).max(120), is_board_member_of: Ulid.optional(), cap_users: z.number().int().min(1).max(1000) });
export const AmbassadorListResponse = z.strictObject({ items: z.array(Ambassador) });

export const AuditQuery = z.strictObject({ object: z.string().max(64).optional(), actor: z.string().max(64).optional(), cursor: z.string().max(256).optional() });
export const AuditEntryDto = z.strictObject({
  id: Ulid,
  actor_ref: z.string().max(64),
  action: z.string().max(64),
  object_type: z.string().max(64),
  object_ref: z.string().max(64),
  reason: z.string().max(2000).nullable(),
  at: Instant,
  net_class: NetClass.nullable(),
});
export const AuditResponse = z.strictObject({ items: z.array(AuditEntryDto), next_cursor: z.string().max(256).nullable() });

export const adminRoutes = defineRoutes({
  'admin.mfa.enroll': {
    module: 'admin', method: 'POST', path: '/admin/mfa/enroll', auth: ['admin'],
    response: MfaEnrollResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Beheer, §10.8',
  },
  'admin.mfa.verify': {
    module: 'admin', method: 'POST', path: '/admin/mfa/verify', auth: ['admin'],
    body: MfaVerifyRequest, response: MfaVerifyResponse, responseKind: 'json', status: [200], errors: ['MFA_INVALID'], spec: 'arch §8.2 Beheer, §10.8',
  },
  'admin.users.search': {
    module: 'admin', method: 'GET', path: '/admin/users', auth: ['admin'],
    query: UserSearchQuery, response: UserSearchResponse, responseKind: 'json', status: [200], errors: ['REASON_REQUIRED'], spec: 'arch §8.2 Beheer',
  },
  'admin.users.get': {
    module: 'admin', method: 'GET', path: '/admin/users/:id', auth: ['admin'],
    params: IdParam, query: UserGetQuery, response: AdminUserDetail, responseKind: 'json', status: [200], errors: ['REASON_REQUIRED', 'NOT_FOUND'], spec: 'arch §8.2 Beheer',
  },
  'admin.users.teamFlag': {
    module: 'admin', method: 'POST', path: '/admin/users/:id/team-flag', auth: ['admin'],
    params: IdParam, response: TeamFlagResponse, responseKind: 'json', status: [200], errors: ['NOT_FOUND'], spec: 'arch §8.2 Beheer',
  },
  'admin.prizes.verify': {
    module: 'admin', method: 'POST', path: '/admin/prizes/:id/verify', auth: ['admin'],
    params: IdParam, body: PrizeVerifyRequest, response: PrizeResponse, responseKind: 'json', status: [200],
    errors: ['AGE_CHECK_REQUIRED', 'FOUR_EYES_REQUIRED', 'SAMPLE_REQUIRED'], spec: 'arch §8.2 Beheer, spec §4.7',
  },
  'admin.prizes.ageCheck': {
    module: 'admin', method: 'POST', path: '/admin/prizes/:id/age-check', auth: ['admin'],
    params: IdParam, body: PrizeAgeCheckRequest, response: PrizeResponse, responseKind: 'json', status: [200], errors: ['FOUR_EYES_REQUIRED'], spec: 'arch §8.2 Beheer',
  },
  'admin.prizes.deliveryContact': {
    module: 'admin', method: 'POST', path: '/admin/prizes/:id/delivery-contact', auth: ['admin'],
    params: IdParam, body: PrizeDeliveryContactRequest, response: PrizeResponse, responseKind: 'json', status: [200], errors: ['AGE_CHECK_REQUIRED'], spec: 'arch §8.2 Beheer',
  },
  'admin.vacationPause': {
    module: 'admin', method: 'PUT', path: '/admin/vacation-pause', auth: ['admin'],
    body: VacationPauseRequest, response: VacationPauseResponse, responseKind: 'json', status: [200], errors: ['PERIOD_LOCKED'], spec: 'arch §8.2 Beheer',
  },
  'admin.experiments': {
    module: 'admin', method: 'GET', path: '/admin/experiments', auth: ['admin'],
    response: ExperimentsResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Beheer',
  },
  'admin.featureFlags.put': {
    module: 'admin', method: 'PUT', path: '/admin/feature-flags/:key', auth: ['admin'],
    params: FeatureFlagParams, body: FeatureFlagRequest, response: FeatureFlagResponse, responseKind: 'json', status: [200],
    errors: ['FOUR_EYES_REQUIRED', 'FEATURE_DISABLED'], spec: 'arch §8.2 Beheer (draws can never be enabled)',
  },
  'admin.wellbeing.summary': {
    module: 'admin', method: 'GET', path: '/admin/wellbeing/summary', auth: ['admin'],
    response: WellbeingSummaryResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Beheer, spec §6.6',
  },
  'admin.experiments.stopArmB': {
    module: 'admin', method: 'POST', path: '/admin/experiments/arm-b/stop', auth: ['admin'],
    body: ArmBStopRequest, response: ArmBStopResponse, responseKind: 'json', status: [200], errors: ['FOUR_EYES_REQUIRED'], spec: 'arch §8.2 Beheer, spec §6.6',
  },
  'admin.ambassadors.list': {
    module: 'admin', method: 'GET', path: '/admin/ambassadors', auth: ['admin'],
    response: AmbassadorListResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Beheer, spec §4.9',
  },
  'admin.ambassadors.create': {
    module: 'admin', method: 'POST', path: '/admin/ambassadors', auth: ['admin'],
    body: AmbassadorCreate, response: z.strictObject({ ambassador: Ambassador }), responseKind: 'json', status: [201], errors: ['BOARD_MEMBER_CONFLICT'], spec: 'arch §8.2 Beheer',
  },
  'admin.audit': {
    module: 'admin', method: 'GET', path: '/admin/audit', auth: ['admin'],
    query: AuditQuery, response: AuditResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Beheer, §10.8',
  },
});
