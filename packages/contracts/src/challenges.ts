// /api/v1/challenges and the challenge admin routes (architecture §6.2, §6.3, §8.2; spec §4.6, §4.7).
import { z } from 'zod';
import {
  AgeBand,
  ChallengeStatus,
  ChallengeType,
  ClubPool,
  EnrollmentStatus,
  FocusDay,
  IdParam,
  Minutes,
  NonNegInt,
  PosInt,
  PrizeKind,
  ShortText,
  Ulid,
} from './common.ts';
import { defineRoutes } from './route.ts';

// value_cents is no longer sent to students (UX principle P7: no euro amounts); optional for old clients.
export const PrizeSummary = z.strictObject({ kind: PrizeKind, description: ShortText, value_cents: NonNegInt.optional() });
export const ChallengeListItem = z.strictObject({
  id: Ulid,
  type: ChallengeType,
  title: ShortText,
  period: z.strictObject({ start_day: FocusDay, end_day: FocusDay }),
  seats_left: NonNegInt.optional(),
  prize: PrizeSummary.nullable(),
});
export const ChallengeListResponse = z.strictObject({ items: z.array(ChallengeListItem) });
export const EnrollmentDto = z.strictObject({ id: Ulid, challenge_id: Ulid, status: EnrollmentStatus, enrolled_at: z.iso.datetime({ offset: false }) });
export const EnrollResponse = z.strictObject({ enrollment: EnrollmentDto, seat_no: PosInt.nullable() });
export const ProgressResponse = z.strictObject({
  days: z.array(z.strictObject({ day: FocusDay, minutes: Minutes, met: z.boolean() })),
  status: EnrollmentStatus,
});

export const ChallengeRules = z.strictObject({
  threshold_rate: z.number().min(0).max(1).optional(),
  day_minutes: z.number().int().min(1).max(600).optional(),
  required_days: z.number().int().min(1).max(60).optional(),
  seats: z.number().int().min(1).max(10_000).optional(),
});
export const PrizeSpec = z.strictObject({
  kind: PrizeKind,
  reward_kind: z.enum(['in_kind', 'service']),
  description_nl: ShortText,
  description_en: ShortText,
  value_cents: z.number().int().min(1),
  partner_id: Ulid,
  budget_id: Ulid,
  declaration_ref: z.string().trim().min(1).max(200),
  min_age_band: AgeBand,
  rank: PosInt.optional(),
});
export const AdminChallengeCreate = z.strictObject({
  type: ChallengeType,
  title_nl: ShortText,
  title_en: ShortText,
  period_start_day: FocusDay,
  period_end_day: FocusDay,
  pool: ClubPool.optional(),
  rules: ChallengeRules,
  prizes: z.array(PrizeSpec).max(20),
});
export const AdminChallenge = z.strictObject({
  id: Ulid,
  type: ChallengeType,
  title_nl: ShortText,
  title_en: ShortText,
  period_start_day: FocusDay,
  period_end_day: FocusDay,
  pool: ClubPool.nullable(),
  rules: ChallengeRules,
  status: ChallengeStatus,
  prizes: z.array(PrizeSpec.extend({ prize_id: Ulid })),
  proposed_by_ref: z.string().max(64).nullable(),
  final_by_ref: z.string().max(64).nullable(),
  final_confirmed_by_ref: z.string().max(64).nullable(),
});
export const AdminChallengeResponse = z.strictObject({ challenge: AdminChallenge });
export const ResultsProposeRequest = z.strictObject({
  winners: z.array(z.strictObject({ prize_id: Ulid, club_id: Ulid.optional(), user_ref: z.string().max(64).optional() })).max(200),
  note: z.string().trim().max(1000).optional(),
});
export const ResultsConfirmRequest = z.strictObject({ note: z.string().trim().max(1000).optional() });

export const challengeRoutes = defineRoutes({
  'challenges.list': {
    module: 'challenges', method: 'GET', path: '/challenges', auth: ['student'],
    response: ChallengeListResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2',
  },
  'challenges.enroll': {
    module: 'challenges', method: 'POST', path: '/challenges/:id/enroll', auth: ['student'],
    params: IdParam, response: EnrollResponse, responseKind: 'json', status: [201], idempotencyKey: 'required',
    errors: ['SEATS_FULL', 'ENROLLMENT_CLOSED', 'AGE_RESTRICTED', 'IDEMPOTENCY_CONFLICT'], spec: 'arch §8.2, spec §4.7',
  },
  'challenges.progress': {
    module: 'challenges', method: 'GET', path: '/challenges/:id/progress', auth: ['student'],
    params: IdParam, response: ProgressResponse, responseKind: 'json', status: [200], errors: ['NOT_ENROLLED'], spec: 'arch §8.2',
  },
  'admin.challenges.create': {
    module: 'challenges', method: 'POST', path: '/admin/challenges', auth: ['admin'],
    body: AdminChallengeCreate, response: AdminChallengeResponse, responseKind: 'json', status: [201],
    errors: ['CEILING_EXCEEDED', 'KIND_NOT_ALLOWED', 'COVERAGE_INSUFFICIENT', 'VALIDATION_FAILED'], spec: 'arch §8.2 Beheer',
  },
  'admin.challenges.publish': {
    module: 'challenges', method: 'POST', path: '/admin/challenges/:id/publish', auth: ['admin'],
    params: IdParam, response: AdminChallengeResponse, responseKind: 'json', status: [200],
    errors: ['CEILING_EXCEEDED', 'KIND_NOT_ALLOWED', 'COVERAGE_INSUFFICIENT'], spec: 'arch §8.2 Beheer',
  },
  'admin.challenges.propose': {
    module: 'challenges', method: 'POST', path: '/admin/challenges/:id/results/propose', auth: ['admin'],
    params: IdParam, body: ResultsProposeRequest, response: AdminChallengeResponse, responseKind: 'json', status: [200],
    errors: ['SAMPLE_REQUIRED'], spec: 'arch §8.2 Beheer, §6.5',
  },
  'admin.challenges.confirm': {
    module: 'challenges', method: 'POST', path: '/admin/challenges/:id/results/confirm', auth: ['admin'],
    params: IdParam, body: ResultsConfirmRequest, response: AdminChallengeResponse, responseKind: 'json', status: [200],
    errors: ['FOUR_EYES_REQUIRED', 'SAMPLE_REQUIRED'], spec: 'arch §8.2 Beheer, §10.8',
  },
});

// Inferred types (output side) for every schema above.
export type PrizeSummary = z.output<typeof PrizeSummary>;
export type ChallengeListItem = z.output<typeof ChallengeListItem>;
export type ChallengeListResponse = z.output<typeof ChallengeListResponse>;
export type EnrollmentDto = z.output<typeof EnrollmentDto>;
export type EnrollResponse = z.output<typeof EnrollResponse>;
export type ProgressResponse = z.output<typeof ProgressResponse>;
export type ChallengeRules = z.output<typeof ChallengeRules>;
export type PrizeSpec = z.output<typeof PrizeSpec>;
export type AdminChallengeCreate = z.output<typeof AdminChallengeCreate>;
export type AdminChallenge = z.output<typeof AdminChallenge>;
export type AdminChallengeResponse = z.output<typeof AdminChallengeResponse>;
export type ResultsProposeRequest = z.output<typeof ResultsProposeRequest>;
export type ResultsConfirmRequest = z.output<typeof ResultsConfirmRequest>;
