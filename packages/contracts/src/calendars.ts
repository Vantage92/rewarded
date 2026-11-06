// Exam calendars per club (spec §4.13, architecture §3.4, §8.2 "GET/POST/PATCH /admin/exam-calendars")
// and the other round-3 routes that contracts-v1 lacked. Added in the integration wave; additive only.
import { z } from 'zod';
import { FocusDay, IdParam, Instant, NonNegInt, PosInt, ShortText, Ulid } from './common.ts';
import { defineRoutes } from './route.ts';

const Range = z.strictObject({ first_day: FocusDay, last_day: FocusDay });
/** Source of a calendar or member count: free reference (URL or document); blank gives SOURCE_REQUIRED. */
const SourceRef = z.string().trim().max(300);

/** Input of an admin for one calendar (per club, or per faculty where it differs). */
export const ExamCalendarInput = z.strictObject({
  institution: ShortText,
  faculty: ShortText.nullable().optional(),
  is_default: z.boolean().optional(),
  t_day: FocusDay,
  n_start_day: FocusDay.nullable().optional(),
  n_end_day: FocusDay.nullable().optional(),
  a_start_day: FocusDay.nullable().optional(),
  a_end_day: FocusDay.nullable().optional(),
  a_resit_days: z.array(FocusDay).max(60).optional(),
  exam_periods: z.array(Range).max(8).optional(),
  source_ref: SourceRef,
  checked_at: FocusDay,
  club_confirmation_ref: SourceRef.nullable().optional(),
});
export const ExamCalendarPatch = ExamCalendarInput.partial().extend({
  /** After fixed_at a change needs a reason and a second admin (four eyes). */
  reason: z.string().min(3).max(500).optional(),
  fix: z.literal(true).optional(),
});

/** Derived dates of core/calendar (spec §4.13 "Moment"). */
export const CalendarDerived = z.strictObject({
  season: Range,
  bonus_stop_at: z.string().max(20),
  prize_weeks: z.array(Range).length(2),
  january_actives: Range,
  early_offer_day: FocusDay,
  rest_period: Range,
  reflection_window: Range,
  n: Range,
  a: Range.nullable(),
  early_2_offer_day: FocusDay.nullable(),
  rest_repeat_notice_day: FocusDay.nullable(),
  late_offer_day: FocusDay,
  registration_last_day: FocusDay,
  exam_periods: z.array(Range),
});

export const ExamCalendar = z.strictObject({
  id: Ulid,
  institution: ShortText,
  faculty: ShortText.nullable(),
  is_default: z.boolean(),
  t_day: FocusDay,
  n_start_day: FocusDay.nullable(),
  n_end_day: FocusDay.nullable(),
  a_start_day: FocusDay.nullable(),
  a_end_day: FocusDay.nullable(),
  a_resit_days: z.array(FocusDay),
  exam_periods: z.array(Range),
  source_ref: SourceRef,
  checked_at: FocusDay,
  club_confirmation_ref: SourceRef.nullable(),
  fixed_at: Instant.nullable(),
  /** Clubs on this calendar. */
  club_ids: z.array(Ulid),
  derived: CalendarDerived,
  /** Set when a change after fixed_at waits for a second admin. */
  pending_four_eyes: z.boolean().optional(),
});
export const ExamCalendarResponse = z.strictObject({ calendar: ExamCalendar });
export const ExamCalendarListResponse = z.strictObject({ items: z.array(ExamCalendar) });

/** Calendar of the current user (GET /me `calendar`). */
export const MeCalendar = z.strictObject({
  id: Ulid.nullable(),
  is_default: z.boolean(),
  t_day: FocusDay,
  bonus_stop_at: z.string().max(20),
  early_offer_day: FocusDay,
  rest_period: Range,
  a: Range.nullable(),
});

export const AprilMembersRequest = z.strictObject({ april_members: PosInt, source_ref: SourceRef });
export const AprilMembersResponse = z.strictObject({ club_id: Ulid, april_members: PosInt, source_ref: SourceRef, recorded_at: Instant });

export const RestExitRequest = z.strictObject({ confirm: z.literal(true), source: z.enum(['notice', 'april_notice', 'profile']) });
export const RestExitResponse = z.strictObject({ rest_exit_at: Instant, earns_from_day: FocusDay });

export const InstitutionReconfirmRequest = z.union([z.strictObject({ email: z.email().max(254) }), z.strictObject({ code: z.string().regex(/^\d{6}$/) })]);
export const InstitutionReconfirmResponse = z.strictObject({ status: z.enum(['code_sent', 'reconfirmed']) });

export const SampleInterestResponse = z.strictObject({ item_id: Ulid, second_reviewer_required: z.literal(true) });

export const AmbassadorPayoutRequest = z.strictObject({ month_key: z.string().regex(/^\d{4}-\d{2}$/) });
export const AmbassadorPayoutResponse = z.strictObject({
  status: z.enum(['sample_drawn', 'pending_four_eyes', 'recorded']),
  sample_size: NonNegInt,
  payable_registrations: NonNegInt,
});

export const calendarRoutes = defineRoutes({
  'admin.examCalendars.list': {
    module: 'clubs', method: 'GET', path: '/admin/exam-calendars', auth: ['admin'],
    response: ExamCalendarListResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Beheer, spec §4.13',
  },
  'admin.examCalendars.get': {
    module: 'clubs', method: 'GET', path: '/admin/exam-calendars/:id', auth: ['admin'],
    params: IdParam, response: ExamCalendarResponse, responseKind: 'json', status: [200], errors: ['NOT_FOUND'], spec: 'arch §8.2 Beheer, spec §4.13',
  },
  'admin.examCalendars.create': {
    module: 'clubs', method: 'POST', path: '/admin/exam-calendars', auth: ['admin'],
    body: ExamCalendarInput, response: ExamCalendarResponse, responseKind: 'json', status: [201],
    errors: ['VALIDATION_FAILED', 'DEFAULT_CALENDAR_EXISTS', 'SOURCE_REQUIRED'], spec: 'arch §8.2 Beheer, spec §4.13',
  },
  'admin.examCalendars.patch': {
    module: 'clubs', method: 'PATCH', path: '/admin/exam-calendars/:id', auth: ['admin'],
    params: IdParam, body: ExamCalendarPatch, response: ExamCalendarResponse, responseKind: 'json', status: [200, 202],
    errors: ['VALIDATION_FAILED', 'CALENDAR_FIXED', 'FOUR_EYES_REQUIRED', 'DEFAULT_CALENDAR_EXISTS', 'REASON_REQUIRED', 'NOT_FOUND'], spec: 'arch §8.2 Beheer, spec §4.13',
  },
  'admin.clubs.aprilMembers': {
    module: 'clubs', method: 'POST', path: '/admin/clubs/:id/april-members', auth: ['admin'],
    params: IdParam, body: AprilMembersRequest, response: AprilMembersResponse, responseKind: 'json', status: [200],
    errors: ['SOURCE_REQUIRED', 'MEMBERS_FIXED', 'NOT_FOUND'], spec: 'arch §8.2 Beheer, challengevoorwaarden A14.3',
  },
  'me.restExit': {
    module: 'points', method: 'POST', path: '/me/rest-exit', auth: ['student'],
    body: RestExitRequest, response: RestExitResponse, responseKind: 'json', status: [200],
    errors: ['NOT_IN_REST_ARM', 'ALREADY_EXITED'], spec: 'arch §8.2, spec §3.16 stap 4',
  },
  'institution.reconfirm': {
    module: 'fraud', method: 'POST', path: '/me/institution-email/reconfirm', auth: ['student'],
    body: InstitutionReconfirmRequest, response: InstitutionReconfirmResponse, responseKind: 'json', status: [200, 202],
    errors: ['ADDRESS_MISMATCH', 'INSTITUTION_EMAIL_IN_USE', 'CODE_INVALID', 'CODE_EXPIRED'], spec: 'arch §8.2, §6.5',
  },
  'admin.samples.interest': {
    module: 'fraud', method: 'POST', path: '/admin/samples/:id/items/:item/interest', auth: ['admin'],
    params: z.strictObject({ id: Ulid, item: Ulid }), response: SampleInterestResponse, responseKind: 'json', status: [200],
    errors: ['INTEREST_DECLARED', 'NOT_FOUND'], spec: 'arch §8.2 Beheer, §6.5',
  },
  'admin.ambassadors.payout': {
    module: 'admin', method: 'POST', path: '/admin/ambassadors/:id/payouts', auth: ['admin'],
    params: IdParam, body: AmbassadorPayoutRequest, response: AmbassadorPayoutResponse, responseKind: 'json', status: [200, 202],
    errors: ['AMBASSADOR_SAMPLE_REQUIRED', 'ANCHOR_NOT_UNIQUE', 'FOUR_EYES_REQUIRED', 'NOT_FOUND'], spec: 'arch §8.2 Beheer, §6.5',
  },
});

export type ExamCalendarInput = z.output<typeof ExamCalendarInput>;
export type ExamCalendarPatch = z.output<typeof ExamCalendarPatch>;
export type ExamCalendar = z.output<typeof ExamCalendar>;
export type CalendarDerived = z.output<typeof CalendarDerived>;
export type ExamCalendarResponse = z.output<typeof ExamCalendarResponse>;
export type ExamCalendarListResponse = z.output<typeof ExamCalendarListResponse>;
export type MeCalendar = z.output<typeof MeCalendar>;
export type AprilMembersRequest = z.output<typeof AprilMembersRequest>;
export type RestExitRequest = z.output<typeof RestExitRequest>;
export type RestExitResponse = z.output<typeof RestExitResponse>;
export type InstitutionReconfirmRequest = z.output<typeof InstitutionReconfirmRequest>;
export type AmbassadorPayoutResponse = z.output<typeof AmbassadorPayoutResponse>;
