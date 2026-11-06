// /api/v1/auth and the profile routes under /me (architecture §8.2 "Wachtlijst, auth, onboarding en profiel").
import { z } from 'zod';
import {
  AgeBand,
  ArmBelofte,
  ArmBonus,
  ArmPrompt,
  ArmRest,
  Email,
  Empty,
  ExperimentUnit,
  FeatureFlags,
  FocusDay,
  GoalMinutes,
  Instant,
  Locale,
  NoContent,
  ShortText,
  SquadStatus,
  Token,
  Ulid,
  VersionTag,
} from './common.ts';
import { MeCalendar } from './calendars.ts';
import { defineRoutes } from './route.ts';

const SixDigitCode = z.string().regex(/^\d{6}$/);
/** Daily goal in minutes (spec §4.4: 25 / 50 / 90 / 120; overreach brake asks for confirmation). */
export const DailyGoalMin = GoalMinutes;

export const MagicLinkRequest = z.strictObject({ email: Email, locale: Locale, invite_token: Token.optional() });
export const ConfirmLinkRequest = z.strictObject({ token: Token });
export const LoginCodeRequest = z.strictObject({ email: Email, code: SixDigitCode });
export const LoginResponse = z.strictObject({ next: z.enum(['/onboarding', '/']) });

/** HH:MM on a quarter hour. */
export const ReminderTime = z.string().regex(/^(?:[01]\d|2[0-3]):(?:00|15|30|45)$/);
/** ISO weekdays 1–7, unique, at least one. */
export const ReminderDays = z.array(z.number().int().min(1).max(7)).min(1).max(7).refine((d) => new Set(d).size === d.length, { message: 'duplicate_day' });
export const UserSettings = z.strictObject({
  compare_opt_in: z.boolean(),
  silent_mode: z.boolean(),
  squad_name_on_cards: z.boolean(),
  no_points_mode: z.boolean(),
  email_reminders: z.boolean(),
  locale: Locale,
  /** Reminder time (HH:MM, quarter hours, Europe/Amsterdam) and ISO weekdays (P5; repair wave). */
  reminder_time: ReminderTime.optional(),
  reminder_days: ReminderDays.optional(),
});
export const MeUser = z.strictObject({
  id: Ulid,
  first_name: ShortText,
  last_name: ShortText.nullable(),
  email: Email,
  locale: Locale,
  is_team: z.boolean(),
  is_admin: z.boolean(),
  daily_goal_min: DailyGoalMin,
  phone_verified: z.boolean(),
  institution_domain: z.string().max(253).nullable(),
  research_opted_out: z.boolean(),
  created_at: Instant,
  /** True while the account is blocked: only appeal, export and delete work (spec §6.5). */
  blocked: z.boolean().optional(),
});
export const MeSquad = z.strictObject({ id: Ulid, name: ShortText, status: SquadStatus });
export const MeClub = z.strictObject({ id: Ulid, name: ShortText, status: z.enum(['linked', 'pending_admin']) });
export const MeResponse = z.strictObject({
  /** null while the session is `pre` (login confirmed, onboarding not done). */
  user: MeUser.nullable(),
  age_band: AgeBand.nullable(),
  settings: UserSettings.nullable(),
  squad: MeSquad.optional(),
  club: MeClub.optional(),
  /** Exam calendar of the user's unit (spec §4.13); added in the integration wave. */
  calendar: MeCalendar.optional(),
  flags: FeatureFlags,
  onboarding_complete: z.boolean(),
});

export const OnboardingRequest = z.strictObject({
  first_name: ShortText,
  last_name: ShortText.optional(),
  /** Used for the age check only; never stored (architecture §3.1). */
  birth_date: z.iso.date(),
  terms_version: VersionTag,
  privacy_version: VersionTag,
  research_info_version: VersionTag,
  daily_goal_min: DailyGoalMin,
  confirm_overreach: z.boolean().optional(),
  silent_mode: z.boolean().optional(),
});
export const ExperimentAssignmentDto = z.strictObject({
  unit: ExperimentUnit,
  arm_bonus: ArmBonus,
  arm_belofte: ArmBelofte,
  arm_rest: ArmRest,
  arm_prompt: ArmPrompt,
  block: z.string().max(64),
});
export const OnboardingResponse = z.strictObject({ user: MeUser, assignment: ExperimentAssignmentDto });

export const SettingsPatch = z
  .strictObject({
    compare_opt_in: z.boolean().optional(),
    silent_mode: z.boolean().optional(),
    squad_name_on_cards: z.boolean().optional(),
    no_points_mode: z.boolean().optional(),
    email_reminders: z.boolean().optional(),
    locale: Locale.optional(),
    reminder_time: ReminderTime.optional(),
    reminder_days: ReminderDays.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'empty_patch' });
export const SettingsResponse = z.strictObject({ settings: UserSettings });

export const ResearchOptOutRequest = z.strictObject({ confirm: z.literal(true) });
export const ResearchOptOutResponse = z.strictObject({ opted_out_at: Instant, effective_from_day: FocusDay });

export const authRoutes = defineRoutes({
  'auth.magicLink': {
    module: 'auth', method: 'POST', path: '/auth/magic-link', auth: ['public'],
    body: MagicLinkRequest, response: Empty, responseKind: 'json', status: [202],
    errors: ['VALIDATION_FAILED', 'RATE_LIMITED', 'INVITE_REQUIRED'], spec: 'arch §8.2, §10.1',
  },
  'auth.confirm': {
    module: 'auth', method: 'POST', path: '/auth/confirm', auth: ['public'],
    body: ConfirmLinkRequest, response: LoginResponse, responseKind: 'json', status: [200],
    errors: ['LINK_INVALID', 'LINK_EXPIRED'], spec: 'arch §8.2, §10.1',
  },
  'auth.code': {
    module: 'auth', method: 'POST', path: '/auth/code', auth: ['public'],
    body: LoginCodeRequest, response: LoginResponse, responseKind: 'json', status: [200],
    errors: ['CODE_INVALID', 'CODE_EXPIRED', 'TOO_MANY_ATTEMPTS'], spec: 'arch §8.2, §10.1',
  },
  'auth.logout': {
    module: 'auth', method: 'POST', path: '/auth/logout', auth: ['student', 'pre'],
    response: NoContent, responseKind: 'empty', status: [204], errors: [], spec: 'arch §8.2',
  },
  'me.get': {
    module: 'auth', method: 'GET', path: '/me', auth: ['student', 'pre'],
    response: MeResponse, responseKind: 'json', status: [200], errors: ['AUTH_REQUIRED'], spec: 'arch §8.2',
  },
  'me.onboarding': {
    module: 'auth', method: 'POST', path: '/onboarding', auth: ['pre'],
    body: OnboardingRequest, response: OnboardingResponse, responseKind: 'json', status: [201],
    errors: ['AGE_BELOW_MINIMUM', 'TERMS_OUTDATED', 'VALIDATION_FAILED', 'OVERREACH_CONFIRM_REQUIRED', 'EXPANSION_CAP_REACHED'], spec: 'arch §8.2, spec §3.1',
  },
  'me.settings': {
    module: 'auth', method: 'PATCH', path: '/me/settings', auth: ['student'],
    body: SettingsPatch, response: SettingsResponse, responseKind: 'json', status: [200],
    errors: ['VALIDATION_FAILED'], spec: 'arch §8.2, spec §4.10',
  },
  'me.researchOptOut': {
    module: 'auth', method: 'POST', path: '/me/research-opt-out', auth: ['student'],
    body: ResearchOptOutRequest, response: ResearchOptOutResponse, responseKind: 'json', status: [200],
    errors: ['ALREADY_OPTED_OUT'], spec: 'arch §8.2, spec §7.3',
  },
});

// Inferred types (output side) for every schema above.
export type DailyGoalMin = z.output<typeof DailyGoalMin>;
export type MagicLinkRequest = z.output<typeof MagicLinkRequest>;
export type ConfirmLinkRequest = z.output<typeof ConfirmLinkRequest>;
export type LoginCodeRequest = z.output<typeof LoginCodeRequest>;
export type LoginResponse = z.output<typeof LoginResponse>;
export type UserSettings = z.output<typeof UserSettings>;
export type MeUser = z.output<typeof MeUser>;
export type MeSquad = z.output<typeof MeSquad>;
export type MeClub = z.output<typeof MeClub>;
export type MeResponse = z.output<typeof MeResponse>;
export type OnboardingRequest = z.output<typeof OnboardingRequest>;
export type ExperimentAssignmentDto = z.output<typeof ExperimentAssignmentDto>;
export type OnboardingResponse = z.output<typeof OnboardingResponse>;
export type SettingsPatch = z.output<typeof SettingsPatch>;
export type SettingsResponse = z.output<typeof SettingsResponse>;
export type ResearchOptOutRequest = z.output<typeof ResearchOptOutRequest>;
export type ResearchOptOutResponse = z.output<typeof ResearchOptOutResponse>;
