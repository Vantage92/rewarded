// Zod schema for a parameter set (architecture §2: params/ holds parameter set v1 from spec §5).
// The schema checks shape and internal consistency; the values themselves live in v1.ts and are
// never re-chosen here. Every object is strict, so a typo in a stored param_set row fails loudly.
import { z } from 'zod';

/** Calendar date `YYYY-MM-DD` (a focus day, or a plain date in Europe/Amsterdam). */
export const DayString = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'expected YYYY-MM-DD');
/** Local wall-clock time `HH:MM` in Europe/Amsterdam. */
export const LocalTimeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'expected HH:MM');
/** Local date-time `YYYY-MM-DDTHH:MM` in Europe/Amsterdam. */
export const LocalDateTimeString = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d$/, 'expected YYYY-MM-DDTHH:MM');

const posInt = z.number().int().positive();
const nonNegInt = z.number().int().nonnegative();
const pct = z.number().min(0).max(100);
const cents = z.number().int().nonnegative();

/** Inclusive range of focus days. */
export const DayRange = z
  .strictObject({ first_day: DayString, last_day: DayString })
  .refine((r) => r.first_day <= r.last_day, { message: 'first_day must not be after last_day' });

export const AGE_BANDS = ['16_17', '18_plus'] as const;
export const AgeBand = z.enum(AGE_BANDS);

/** Reward kinds that exist at all (architecture §5.3). Money-like kinds have no value here on purpose. */
export const REWARD_KINDS = ['in_kind', 'service', 'partner_discount'] as const;
export const RewardKind = z.enum(REWARD_KINDS);
export const PRIZE_REWARD_KINDS = ['in_kind', 'service'] as const;
export const PrizeRewardKind = z.enum(PRIZE_REWARD_KINDS);

export const NET_CLASS_VALUES = ['campus', 'mobile_cgnat', 'other'] as const;
export const NetClass = z.enum(NET_CLASS_VALUES);

/** One CIDR line with its source (architecture §4.5). Ranges are collected before 25 November (open question 17). */
export const NetClassEntry = z.strictObject({
  cidr: z.string().regex(/^[0-9a-fA-F:.]+\/\d{1,3}$/, 'expected an IPv4 or IPv6 CIDR'),
  class: z.enum(['campus', 'mobile_cgnat']),
  source: z.string().min(1),
  checked_at: DayString,
});

/**
 * Threshold that the red-team day fixes before 2 December (spec §6.3). `null` means "not fixed yet";
 * WP-6 must treat a null threshold as a blocker for release, not as "skip".
 */
const redTeamThreshold = posInt.nullable();

/** Caps per verification level (architecture §1, §4.6, §5.3). Level 1 = web session. */
export const LevelParams = z.strictObject({
  /** Points are the only thing a session at this level earns directly. */
  cash_allowed: z.literal(false),
  free_credit_allowed: z.literal(false),
  allowed_reward_kinds: z.array(RewardKind).min(1),
  allowed_prize_kinds: z.array(PrizeRewardKind).min(1),
  catalog_item_max_cents: cents,
  individual_prize_max_cents: cents,
  person_month_max_cents: cents,
  main_prize_max_cents: cents,
  threshold_prize_max_cents: cents,
});

export const ParamSetSchema = z
  .strictObject({
    version: posInt,
    timezone: z.literal('Europe/Amsterdam'),

    time: z.strictObject({
      day_boundary: LocalTimeString,
      /** ISO weekday the focus week starts on (1 = Monday). */
      week_start_iso_weekday: z.number().int().min(1).max(7),
      night_window: z.strictObject({ from: LocalTimeString, to: LocalTimeString }),
      sweep_interval_min: posInt,
      sweep_margin_min: nonNegInt,
      stock_release_at: LocalTimeString,
      reminder_at: LocalTimeString,
    }),

    session: z.strictObject({
      lengths_min: z.array(posInt).min(1),
      practice_min: posInt,
      heartbeat_interval_s: posInt,
      gap_ok_s: posInt,
      gap_covered_max_s: posInt,
      covered_gap_flag_pct: pct,
      mono_tolerance_s: nonNegInt,
      end_tolerance_s: nonNegInt,
      end_grace_min: posInt,
      clock_skew_flag_s: posInt,
      one_active_per_account: z.literal(true),
      pause_allowed: z.literal(false),
      return_window_s: z.literal(0),
    }),

    points: z.strictObject({
      points_per_verified_min: posInt,
      daily_cap_min: posInt,
      earn_in_min: posInt,
      first_redeem_hold_days: nonNegInt,
      redemptions_per_week: posInt,
      practice_points: z.literal(0),
      aborted_points: z.literal(0),
    }),

    goals: z.strictObject({
      options_min: z.array(posInt).min(1),
      default_min: posInt,
      confirm_min: z.array(posInt),
      confirm_window_days: posInt,
      suggestion_after_days: posInt,
      suggestion_floor_min: posInt,
      exam_days_per_week: nonNegInt,
    }),

    goal_bonus: z.strictObject({
      points_per_goal: posInt,
      arm_a_weekly_max: posInt,
      arm_b_weekly_budget: posInt,
      arm_b_points_per_remaining_day: posInt,
      season: DayRange,
      /** Local instant at which the season ends (spec §4.2: Monday 18 January 2027 04:00). */
      season_ends_at: LocalDateTimeString,
      joker_protects_bonus: z.literal(false),
      late_start_earns_bonus: z.literal(false),
    }),

    vacation_pause: DayRange,
    rest_period: DayRange,

    squads: z.strictObject({
      min_size: posInt,
      max_size: posInt,
      streak_min_met: posInt,
      streak_share: z.number().gt(0).lte(1),
      freeze_below_active: posInt,
      jokers_per_week: nonNegInt,
      recovery_days: posInt,
      recoveries_per_break: posInt,
      auto_pause_after_days: posInt,
      regroup_after_days: posInt,
      regroup_below_active: posInt,
      archive_after_days: posInt,
      invite_max_uses: posInt,
      invite_valid_days: posInt,
      presence_poll_s: posInt,
      /** Live presence on by default per age band (spec §4.4; silent_mode is the inverse). */
      presence_default: z.strictObject({ '16_17': z.boolean(), '18_plus': z.boolean() }),
      memberships_per_user: z.literal(1),
    }),

    duels: z.strictObject({
      length_days: posInt,
      invite_valid_h: posInt,
      invite_max_uses: posInt,
      outside_squad_age_band: AgeBand,
      concurrent_per_player: posInt,
      points_at_stake: z.literal(0),
    }),

    referral: z.strictObject({
      starts_on: DayString,
      points_per_party: posInt,
      vest_sessions: posInt,
      vest_session_min: posInt,
      vest_window_h: posInt,
      max_vested_per_month: posInt,
      max_price_share_pct: pct,
    }),

    expiry: z.strictObject({
      months_after_last_session: posInt,
      notice_days: posInt,
      built: z.literal(false),
    }),

    belofte: z.strictObject({
      early_offer_day: DayString,
      days_per_week_min: posInt,
      days_per_week_max: posInt,
      minutes_options: z.array(posInt).min(1),
      duration_days: posInt,
      suggestion_lookback_days: posInt,
      outside_experiment_offer_after_days: posInt,
      points: z.literal(0),
    }),

    experiments: z.strictObject({
      factors: z.array(z.enum(['bonus', 'belofte', 'rest', 'prompt'])).length(4),
      share_pct: pct,
      block_size: posInt,
      registration_last_day: DayString,
      squad_prompt_days: z.strictObject({ from: posInt, to: posInt }),
      /** Minors always get these arms (spec §5 Toewijzing). */
      minor_arms: z.strictObject({ bonus: z.literal('A'), rest: z.literal('continue') }),
    }),

    catalog: z.strictObject({
      points_price_rounding: posInt,
      release_days_per_week: posInt,
      anchor_reserved_pct: pct,
      low_stock_pct: pct,
      broken_code_workdays: posInt,
    }),

    phone: z.strictObject({
      numbers_per_account: posInt,
      allowed_line_types: z.array(z.enum(['mobile'])).min(1),
      code_attempts: posInt,
    }),

    challenges: z.strictObject({
      min_linked_members: posInt,
      participation_min_goal_days: posInt,
      threshold_participation_pct: pct,
      intensity_cap_min: posInt,
      pool_bounds: z.tuple([posInt, posInt]),
      pool_min_clubs: posInt,
      code_cap_factor: z.number().gte(1),
      prize_period_weeks: z.array(DayRange).min(1),
      warmup_until: DayString,
      club_prize_mode: z.enum(['rank_and_threshold', 'threshold_only']),
      prize_sample_size: posInt,
      prize_delivery_after_days: posInt,
    }),

    board: z.strictObject({
      min_group: posInt,
      round_to: posInt,
      min_change: posInt,
    }),

    review: z.strictObject({
      decision_workdays: posInt,
      appeal_window_days: posInt,
      appeal_decision_workdays: posInt,
    }),

    fraud: z.strictObject({
      h2_accounts_per_ip_24h: posInt,
      h2_shared_threshold: redTeamThreshold,
      h5_daily_min: posInt,
      h5_consecutive_days: posInt,
      h6_window: z.strictObject({ from: LocalTimeString, to: LocalTimeString }),
      h6_nights_per_week: posInt,
      h7_window_min: posInt,
      h7_shared_threshold: redTeamThreshold,
      h9_claim_delay_min: posInt,
      h9_share_pct: pct,
      h10_new_members: posInt,
      h10_window_h: posInt,
      h10_max_ip_hashes: posInt,
      h10_share_pct: pct,
      h10_shared_threshold: redTeamThreshold,
      h11_accounts_per_device_week: posInt,
    }),

    sample: z.strictObject({
      weekly_size: posInt,
      min_stratum_actives: posInt,
      min_per_stratum: posInt,
      fraud_go_no_go_pct: pct,
    }),

    harm: z.strictObject({
      s1_nights: posInt,
      s1_window_days: posInt,
      s2_daily_min: posInt,
      s2_days: posInt,
      s2_window_days: posInt,
      s3_min_streak: posInt,
      s3_inactive_days: posInt,
      s3_prior_focus_days: posInt,
      card_cooldown_days: posInt,
    }),

    ambassadors: z.strictObject({
      eval_day: posInt,
      min_sessions: posInt,
      fee_cents: cents,
      max_users_per_month: posInt,
    }),

    net_classes: z.array(NetClassEntry),

    levels: z.strictObject({ '1': LevelParams }),
  })
  .superRefine((p, ctx) => {
    const issue = (path: (string | number)[], message: string): void => {
      ctx.addIssue({ code: 'custom', path, message });
    };
    const maxLen = Math.max(...p.session.lengths_min);
    if (p.session.lengths_min.includes(p.session.practice_min)) issue(['session', 'practice_min'], 'practice length must differ from real lengths');
    if (p.session.end_tolerance_s >= Math.min(...p.session.lengths_min) * 60) issue(['session', 'end_tolerance_s'], 'end tolerance must be shorter than the shortest session');
    if (p.session.gap_ok_s <= p.session.heartbeat_interval_s) issue(['session', 'gap_ok_s'], 'gap limit must exceed the heartbeat interval');
    if (p.session.gap_covered_max_s < p.session.gap_ok_s) issue(['session', 'gap_covered_max_s'], 'covered gap max below the ok gap');
    if (!p.goals.options_min.includes(p.goals.default_min)) issue(['goals', 'default_min'], 'default goal must be one of the options');
    for (const g of p.goals.confirm_min) if (!p.goals.options_min.includes(g)) issue(['goals', 'confirm_min'], `confirm goal ${g} is not an option`);
    if (Math.max(...p.goals.options_min) > p.points.daily_cap_min) issue(['goals', 'options_min'], 'a goal above the daily cap is unreachable for points');
    // Founder JS2: no bonus arm may yield a higher maximum than the other.
    if (p.goal_bonus.arm_a_weekly_max !== p.goal_bonus.arm_b_weekly_budget) issue(['goal_bonus', 'arm_b_weekly_budget'], 'arm A and arm B must have the same weekly maximum');
    if (p.goal_bonus.arm_a_weekly_max !== 7 * p.goal_bonus.points_per_goal) issue(['goal_bonus', 'arm_a_weekly_max'], 'weekly max must be 7 × points per goal');
    if (p.goal_bonus.arm_b_points_per_remaining_day !== p.goal_bonus.points_per_goal) issue(['goal_bonus', 'arm_b_points_per_remaining_day'], 'midweek budget per day must equal points per goal');
    if (p.squads.min_size > p.squads.max_size) issue(['squads', 'min_size'], 'min size above max size');
    if (p.belofte.days_per_week_min > p.belofte.days_per_week_max || p.belofte.days_per_week_max > 7) issue(['belofte', 'days_per_week_max'], 'invalid days per week range');
    if (p.experiments.squad_prompt_days.from > p.experiments.squad_prompt_days.to) issue(['experiments', 'squad_prompt_days'], 'invalid prompt day range');
    if (p.challenges.pool_bounds[0] >= p.challenges.pool_bounds[1]) issue(['challenges', 'pool_bounds'], 'pool bounds must increase');
    if (p.challenges.intensity_cap_min !== p.points.daily_cap_min) issue(['challenges', 'intensity_cap_min'], 'intensity cap must equal the daily points cap (spec §4.6)');
    if (maxLen > 24 * 60) issue(['session', 'lengths_min'], 'session longer than a day');
    const lvl = p.levels['1'];
    if (lvl.catalog_item_max_cents > lvl.person_month_max_cents) issue(['levels', '1', 'catalog_item_max_cents'], 'item cap above monthly cap');
    if (lvl.individual_prize_max_cents > lvl.person_month_max_cents) issue(['levels', '1', 'individual_prize_max_cents'], 'prize cap above monthly cap');
  });

export type ParamSet = z.infer<typeof ParamSetSchema>;
export type LevelParamSet = z.infer<typeof LevelParams>;
export type NetClassLine = z.infer<typeof NetClassEntry>;
export type NetClassName = z.infer<typeof NetClass>;
export type AgeBandValue = z.infer<typeof AgeBand>;
export type RewardKindValue = z.infer<typeof RewardKind>;
export type DayRangeValue = z.infer<typeof DayRange>;
