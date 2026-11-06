// /api/v1/squads (architecture §6.3, §6.4, §8.2 "Squads, uitnodigingen en duels").
import { z } from 'zod';
import { FocusDay, GoalMinutes, IdParam, Instant, Minutes, NonNegInt, Ref, ShortText, SquadNameStatus, SquadStatus, Ulid } from './common.ts';
import { InviteDto } from './invites.ts';
import { defineRoutes } from './route.ts';

/** Squad names pass a word list and may become `pending` (architecture §10.3). */
export const SquadName = z.string().trim().min(2).max(40);
export const SquadDto = z.strictObject({
  id: Ulid,
  name: SquadName,
  name_status: SquadNameStatus,
  club_id: Ulid.nullable(),
  status: SquadStatus,
  is_admin: z.boolean(),
  created_at: Instant,
});
export const CreateSquadRequest = z.strictObject({ name: SquadName, club_id: Ulid.optional() });
export const CreateSquadResponse = z.strictObject({ squad: SquadDto, invite: InviteDto });
/** A member in silent mode shows only the first name and `status: 'silent'` (architecture §6.4; repair wave). */
export const SquadMember = z.strictObject({
  first_name: ShortText,
  paused: z.boolean().optional(),
  goal_met_today: z.boolean().optional(),
  status: z.enum(['silent']).optional(),
});
export const SquadMineResponse = z.strictObject({
  squad: SquadDto,
  members: z.array(SquadMember).max(6),
  streak: NonNegInt,
  status: SquadStatus,
  /** Squad day as an aggregate (spec §4.4): active members (not paused) and how many met the goal, silent members included. */
  today: z.strictObject({ active: NonNegInt, goal_met: NonNegInt }).optional(),
});
export const PresenceResponse = z.strictObject({
  members: z.array(z.strictObject({ member_ref: Ref, focusing: z.boolean(), remaining_min: Minutes.optional() })).max(6),
  polled_at: Instant,
  /** Denominator of "X van Y focussen nu": active members, not paused, silent ones included (spec §4.4). */
  active_count: NonNegInt.optional(),
});
export const CompareResponse = z.strictObject({
  members: z.array(z.strictObject({ first_name: ShortText, minutes_today: Minutes, minutes_week: Minutes })).max(6),
});
export const WitnessBelofte = z.strictObject({
  first_name: ShortText,
  days_per_week: z.number().int().min(3).max(7),
  min_per_day: GoalMinutes,
  start_day: FocusDay,
  end_day: FocusDay,
  status: z.enum(['active', 'completed', 'stopped']),
  days: z.array(z.strictObject({ day: FocusDay, met: z.boolean() })),
});
export const SquadBeloftesResponse = z.strictObject({ items: z.array(WitnessBelofte) });
export const SquadInviteResponse = z.strictObject({ invite: InviteDto });
export const PatchSquadRequest = z
  .strictObject({ name: SquadName.optional(), club_id: Ulid.nullable().optional() })
  .refine((v) => Object.keys(v).length > 0, { message: 'empty_patch' });
export const PatchSquadResponse = z.strictObject({ squad: SquadDto });
export const MergeRequestBody = z.strictObject({ target_squad_ref: Ref });
export const MergeRequestResponse = z.strictObject({ merge_request_id: Ulid, expires_at: Instant });
export const NameReportRequest = z.strictObject({ reason: z.enum(['offensive', 'personal_data', 'impersonation', 'other']).optional() });
export const NameReportResponse = z.strictObject({ flag_id: Ulid });

export const squadRoutes = defineRoutes({
  'squads.create': {
    module: 'squads', method: 'POST', path: '/squads', auth: ['student'],
    body: CreateSquadRequest, response: CreateSquadResponse, responseKind: 'json', status: [201], idempotencyKey: 'required',
    errors: ['ALREADY_IN_SQUAD', 'NAME_REJECTED', 'IDEMPOTENCY_CONFLICT'], spec: 'arch §8.2, spec §3.5',
  },
  'squads.mine': {
    module: 'squads', method: 'GET', path: '/squads/mine', auth: ['member'],
    response: SquadMineResponse, responseKind: 'json', status: [200], errors: ['NOT_IN_SQUAD'], spec: 'arch §8.2, spec §4.4',
  },
  'squads.presence': {
    module: 'squads', method: 'GET', path: '/squads/mine/presence', auth: ['member'],
    response: PresenceResponse, responseKind: 'json', status: [200], errors: ['NOT_IN_SQUAD'], spec: 'arch §8.2, §6.4',
  },
  'squads.compare': {
    module: 'squads', method: 'GET', path: '/squads/mine/compare', auth: ['member'],
    response: CompareResponse, responseKind: 'json', status: [200], errors: ['COMPARE_OPT_IN_REQUIRED', 'NOT_IN_SQUAD'], spec: 'arch §8.2, §6.4',
  },
  'squads.beloftes': {
    module: 'squads', method: 'GET', path: '/squads/mine/beloftes', auth: ['member'],
    response: SquadBeloftesResponse, responseKind: 'json', status: [200], errors: ['NOT_IN_SQUAD'], spec: 'arch §8.2, spec §4.12',
  },
  'squads.invite': {
    module: 'squads', method: 'POST', path: '/squads/mine/invites', auth: ['member'],
    response: SquadInviteResponse, responseKind: 'json', status: [201],
    errors: ['INVITE_MOMENT_NOT_ALLOWED', 'SQUAD_FULL', 'NOT_IN_SQUAD'], spec: 'arch §8.2, spec §3.5',
  },
  'squads.patch': {
    module: 'squads', method: 'PATCH', path: '/squads/mine', auth: ['member'],
    body: PatchSquadRequest, response: PatchSquadResponse, responseKind: 'json', status: [200],
    errors: ['NAME_REJECTED', 'FORBIDDEN', 'NOT_IN_SQUAD'], spec: 'arch §8.2',
  },
  'squads.leave': {
    module: 'squads', method: 'POST', path: '/squads/mine/leave', auth: ['member'],
    response: z.undefined(), responseKind: 'empty', status: [204], errors: ['NOT_IN_SQUAD'], spec: 'arch §8.2',
  },
  'squads.regroup': {
    module: 'squads', method: 'POST', path: '/squads/mine/regroup', auth: ['member'],
    response: SquadInviteResponse, responseKind: 'json', status: [201], errors: ['NOT_ELIGIBLE'], spec: 'arch §8.2, §6.3',
  },
  'squads.mergeRequest': {
    module: 'squads', method: 'POST', path: '/squads/mine/merge-requests', auth: ['member'],
    body: MergeRequestBody, response: MergeRequestResponse, responseKind: 'json', status: [201], errors: ['NOT_ELIGIBLE', 'MERGE_ARM_MISMATCH'], spec: 'arch §8.2, §6.3',
  },
  'squads.mergeAccept': {
    module: 'squads', method: 'POST', path: '/squads/merge-requests/:id/accept', auth: ['member'],
    params: IdParam, response: SquadMineResponse, responseKind: 'json', status: [200], errors: ['NOT_ELIGIBLE', 'SQUAD_FULL', 'MERGE_ARM_MISMATCH'], spec: 'arch §8.2, §6.3',
  },
  'squads.nameReport': {
    module: 'squads', method: 'POST', path: '/squads/:id/name-report', auth: ['student'],
    params: IdParam, body: NameReportRequest, response: NameReportResponse, responseKind: 'json', status: [201],
    errors: ['ALREADY_REPORTED'], spec: 'arch §8.2, spec §4.4 (DSA)',
  },
});

// Inferred types (output side) for every schema above.
export type SquadName = z.output<typeof SquadName>;
export type SquadDto = z.output<typeof SquadDto>;
export type CreateSquadRequest = z.output<typeof CreateSquadRequest>;
export type CreateSquadResponse = z.output<typeof CreateSquadResponse>;
export type SquadMember = z.output<typeof SquadMember>;
export type SquadMineResponse = z.output<typeof SquadMineResponse>;
export type PresenceResponse = z.output<typeof PresenceResponse>;
export type CompareResponse = z.output<typeof CompareResponse>;
export type WitnessBelofte = z.output<typeof WitnessBelofte>;
export type SquadBeloftesResponse = z.output<typeof SquadBeloftesResponse>;
export type SquadInviteResponse = z.output<typeof SquadInviteResponse>;
export type PatchSquadRequest = z.output<typeof PatchSquadRequest>;
export type PatchSquadResponse = z.output<typeof PatchSquadResponse>;
export type MergeRequestBody = z.output<typeof MergeRequestBody>;
export type MergeRequestResponse = z.output<typeof MergeRequestResponse>;
export type NameReportRequest = z.output<typeof NameReportRequest>;
export type NameReportResponse = z.output<typeof NameReportResponse>;
