// /api/v1/points plus the goal routes under /me (daily goal, exam days, today), architecture §5, §8.2.
import { z } from 'zod';
import {
  ArmBonus,
  ArmRest,
  EarnArm,
  FocusDay,
  HarmCode,
  Instant,
  LedgerEntryType,
  LedgerLineStatus,
  Minutes,
  NextCursor,
  NonNegInt,
  PageQuery,
  Points,
  ShortText,
  SurveyMoment,
  Url,
} from './common.ts';
import { DailyGoalMin } from './auth.ts';
import { defineRoutes } from './route.ts';

export const BalanceResponse = z.strictObject({
  available: Points,
  pending: Points,
  referral_unvested: Points,
  earn_in_min: Minutes,
  earn_in_required: z.literal(300),
  first_redeem_after: Instant.optional(),
  next_redeem_from: Instant.optional(),
});
export const LedgerItem = z.strictObject({
  type: LedgerEntryType,
  amount: Points,
  status: LedgerLineStatus,
  ref: z.string().max(64),
  rule_key: z.string().max(64).optional(),
  created_at: Instant,
});
export const LedgerResponse = z.strictObject({ items: z.array(LedgerItem), next_cursor: NextCursor });

export const DailyGoalRequest = z.strictObject({ minutes: DailyGoalMin, confirm_overreach: z.boolean().optional(), from_suggestion: z.boolean().optional() });
export const DailyGoalResponse = z.strictObject({ goal_min: DailyGoalMin, effective_from_day: FocusDay });

export const ExamDayParams = z.strictObject({ day: FocusDay });
export const ExamDaysResponse = z.strictObject({ exam_days_this_week: z.array(FocusDay).max(3) });

export const TodayResponse = z.strictObject({
  focus_day: FocusDay,
  counted_min: Minutes,
  goal_min: DailyGoalMin,
  goal_met: z.boolean(),
  goal_days_this_week: z.number().int().min(0).max(7),
  exam_day: z.boolean(),
  joker_available: z.boolean(),
  /** Goal bonus rule of the day: arm A, arm B, or none (outside the season, vacation, practice). */
  bonus_rule: z.union([ArmBonus, z.literal('none')]),
  earn_arm: EarnArm,
  /** Squad streak in days; null without a squad. */
  streak: NonNegInt.nullable(),
  recovery: z.strictObject({ until_day: FocusDay, streak_before_break: NonNegInt }).optional(),
  goal_suggestion: z.strictObject({ suggested_min: DailyGoalMin }).optional(),
  squad_prompt: z.strictObject({ invite_url: Url, share_text: z.string().max(500) }).optional(),
  harm_card: z
    .strictObject({ code: HarmCode, help: z.array(z.strictObject({ label: ShortText, url: Url })).max(10) })
    .optional(),
  survey_due: SurveyMoment.optional(),
  rest_notice: z.strictObject({ arm_rest: ArmRest }).optional(),
  /** Arm B: what is still in the weekly budget (pending_goal_budget) for the Bonusregel (UX §6.2; repair wave). */
  week_budget: z.strictObject({ remaining: NonNegInt, per_day: NonNegInt, first_day_of_week: z.boolean() }).optional(),
});

export const pointsRoutes = defineRoutes({
  'points.balance': {
    module: 'points', method: 'GET', path: '/points/balance', auth: ['student'],
    response: BalanceResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2, §5.1, spec §3.4',
  },
  'points.ledger': {
    module: 'points', method: 'GET', path: '/points/ledger', auth: ['student'],
    query: PageQuery, response: LedgerResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2, §5.1',
  },
  'me.dailyGoal': {
    module: 'points', method: 'PUT', path: '/me/daily-goal', auth: ['student'],
    body: DailyGoalRequest, response: DailyGoalResponse, responseKind: 'json', status: [200],
    errors: ['OVERREACH_CONFIRM_REQUIRED'], spec: 'arch §8.2, spec §4.2',
  },
  'me.examDays.put': {
    module: 'points', method: 'PUT', path: '/me/exam-days/:day', auth: ['student'],
    params: ExamDayParams, response: ExamDaysResponse, responseKind: 'json', status: [200],
    errors: ['EXAM_DAY_LIMIT', 'PERIOD_LOCKED'], spec: 'arch §8.2, spec §3.13',
  },
  'me.examDays.delete': {
    module: 'points', method: 'DELETE', path: '/me/exam-days/:day', auth: ['student'],
    params: ExamDayParams, response: ExamDaysResponse, responseKind: 'json', status: [200],
    errors: ['PERIOD_LOCKED'], spec: 'arch §8.2, spec §3.13',
  },
  'me.today': {
    module: 'points', method: 'GET', path: '/me/today', auth: ['student'],
    response: TodayResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2',
  },
});

// Inferred types (output side) for every schema above.
export type BalanceResponse = z.output<typeof BalanceResponse>;
export type LedgerItem = z.output<typeof LedgerItem>;
export type LedgerResponse = z.output<typeof LedgerResponse>;
export type DailyGoalRequest = z.output<typeof DailyGoalRequest>;
export type DailyGoalResponse = z.output<typeof DailyGoalResponse>;
export type ExamDayParams = z.output<typeof ExamDayParams>;
export type ExamDaysResponse = z.output<typeof ExamDaysResponse>;
export type TodayResponse = z.output<typeof TodayResponse>;
