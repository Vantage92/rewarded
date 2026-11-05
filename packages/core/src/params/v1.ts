// Parameter set v1. Every value comes from spec §5 (docs/research/05-productspecificatie.md) or,
// where the spec leaves it to the architecture, from docs/research/07-architectuur.md. Nothing here
// is chosen anew; the reference next to each value says where it comes from.
import type { ParamSet } from './schema.ts';

/** Raw v1 values; use PARAMS_V1 (validated and frozen) from params/index.ts. */
export const PARAMS_V1_RAW: ParamSet = {
  version: 1,
  timezone: 'Europe/Amsterdam', // spec §4.2 Dagrand

  time: {
    day_boundary: '04:00', // spec §5 Dagrand (assumption)
    week_start_iso_weekday: 1, // spec §4.2 Weekplafond: Monday 04:00
    night_window: { from: '01:00', to: '04:00' }, // spec §5 Nachtregel
    sweep_interval_min: 1, // arch §4.3: sweep job every minute
    sweep_margin_min: 5, // arch §6.1: 04:00 + 90 + 10 + 5 = 05:45
    stock_release_at: '04:00', // spec §4.3 Weekvrijgave: daily at 04:00
    reminder_at: '19:30', // productplan §10, arch §6.3 (choice)
  },

  session: {
    lengths_min: [25, 50, 90], // spec §5 Sessielengtes
    practice_min: 1, // spec §5 Oefensessie
    heartbeat_interval_s: 30, // spec §4.1 Heartbeat
    gap_ok_s: 90, // spec §4.1 Heartbeatgaten: ≤ 90 s counts
    gap_covered_max_s: 300, // spec §4.1: covered gap up to 5 min (working hypothesis)
    covered_gap_flag_pct: 10, // spec §4.1 / §6.3 H3
    mono_tolerance_s: 5, // spec §4.1: monotonic clock within 5 s of server elapsed
    end_tolerance_s: 30, // spec §4.1 Einde: server elapsed ≥ duration − 30 s
    end_grace_min: 10, // spec §4.1 late_end; arch §4.3 end_grace_min
    clock_skew_flag_s: 300, // spec §6.3 H4: skew > 5 min
    one_active_per_account: true, // spec §4.1 Eén sessie tegelijk
    pause_allowed: false, // spec §4.1, §8 Won't
    return_window_s: 0, // spec §4.1: no return window
  },

  points: {
    points_per_verified_min: 1, // spec §5 Ratio (binding)
    daily_cap_min: 300, // spec §5 Puntenplafond per dag
    earn_in_min: 300, // spec §5 Inverdienperiode
    first_redeem_hold_days: 7, // spec §5 Wachttijd eerste verzilvering
    redemptions_per_week: 1, // spec §5 Weekplafond verzilvering
    practice_points: 0, // spec §5 Oefensessie: 0 points
    aborted_points: 0, // spec §5 Afgebroken sessie
  },

  goals: {
    options_min: [25, 50, 90, 120], // spec §5 Dagdoel
    default_min: 25, // spec §5 Dagdoel: default 25
    confirm_min: [90, 120], // spec §5 Dagdoel: confirmation at 90 or 120 in week 1
    confirm_window_days: 7, // spec §4.4 Overmoedrem: first 7 days
    suggestion_after_days: 7, // spec §5 Dagdoel: suggestion after 7 days
    suggestion_floor_min: 25, // spec §4.4 Overmoedrem: at least 25
    exam_days_per_week: 3, // spec §5 Tentamendag: max 3 per week (working hypothesis)
  },

  goal_bonus: {
    points_per_goal: 20, // spec §5 Doelbonus arm A
    arm_a_weekly_max: 140, // spec §5 Doelbonus arm A: max 140 per week
    arm_b_weekly_budget: 140, // spec §5 Doelbonus arm B: Monday 04:00 140 pending
    arm_b_points_per_remaining_day: 20, // spec §5 arm B: midweek entry 20 × remaining days
    season: { first_day: '2026-12-02', last_day: '2027-01-17' }, // spec §5 Seizoen; arch §5.1
    season_ends_at: '2027-01-18T04:00', // spec §4.2 Seizoen doelbonus
    joker_protects_bonus: false, // spec §5 Joker en doelbonus
    late_start_earns_bonus: false, // spec §5 Nachtregel
  },

  vacation_pause: { first_day: '2026-12-21', last_day: '2027-01-03' }, // spec §5 Vakantiepauze (working hypothesis)
  rest_period: { first_day: '2027-01-19', last_day: '2027-03-31' }, // spec §5 Rustperiode, §3.16

  squads: {
    min_size: 3, // spec §5 Squadomvang
    max_size: 6, // spec §5 Squadomvang
    streak_min_met: 2, // spec §5 Squadstreak: min. 2
    streak_share: 0.5, // spec §5 Squadstreak: half of active members, rounded up
    freeze_below_active: 3, // spec §4.4: under 3 active members the streak freezes
    jokers_per_week: 1, // spec §5 Rustdag-joker
    recovery_days: 2, // spec §5 Streakherstel: two successful days
    recoveries_per_break: 1, // spec §5 Streakherstel: once per break
    auto_pause_after_days: 7, // spec §5 Automatische pauze
    regroup_after_days: 7, // spec §5 Hersamenstellen
    regroup_below_active: 2, // spec §5 Hersamenstellen: < 2 active members
    archive_after_days: 14, // spec §4.4 Archief
    invite_max_uses: 5, // spec §4.4 Uitnodigingslink
    invite_valid_days: 7, // spec §4.4 Uitnodigingslink
    presence_poll_s: 30, // spec §4.4 Live aanwezigheid
    presence_default: { '16_17': false, '18_plus': true }, // spec §5 Live aanwezigheid
    memberships_per_user: 1, // spec §4.4 Lidmaatschap
  },

  duels: {
    length_days: 7, // spec §5 Duel
    invite_valid_h: 48, // spec §4.5
    invite_max_uses: 1, // spec §4.5
    outside_squad_age_band: '18_plus', // spec §5 Duel: outside the squad only 18+
    concurrent_per_player: 1, // spec §4.5
    points_at_stake: 0, // spec §4.5: no points in duels
  },

  referral: {
    starts_on: '2027-01-05', // spec §4.9 Start
    points_per_party: 150, // spec §5 Referral
    vest_sessions: 3, // spec §5 Referral: 3 × ≥ 25 min
    vest_session_min: 25, // spec §5 Referral
    vest_window_h: 168, // spec §4.9 Vesting: 7 × 24 hours
    max_vested_per_month: 5, // spec §5 Referral
    max_price_share_pct: 50, // spec §5 Referral: max 50% of a points price
  },

  expiry: {
    months_after_last_session: 12, // spec §5 Vervaldatum (not built)
    notice_days: 30, // spec §4.2 Vervaldatum
    built: false, // spec §4.2: not built
  },

  belofte: {
    early_offer_day: '2027-01-11', // spec §5 Belofte-aanbod
    days_per_week_min: 3, // spec §4.12 Keuzes
    days_per_week_max: 7, // spec §4.12 Keuzes
    minutes_options: [25, 50, 90, 120], // spec §4.12 Keuzes
    duration_days: 14, // spec §4.12 Looptijd
    suggestion_lookback_days: 14, // spec §4.12 Voorstel
    outside_experiment_offer_after_days: 14, // spec §4.12 Aanbod: registered after 17 January, day 14
    points: 0, // spec §4.12 Beloning: none
  },

  experiments: {
    factors: ['bonus', 'belofte', 'rest', 'prompt'], // spec §5 Toewijzing: four factors
    share_pct: 50, // spec §5 Toewijzing: 50/50
    block_size: 4, // spec §5 Toewijzing: blocks of 4
    registration_last_day: '2027-01-17', // spec §5 Toewijzing: registered after 17 January = outside
    squad_prompt_days: { from: 1, to: 3 }, // spec §5 Squadprompt: day 1–3
    minor_arms: { bonus: 'A', rest: 'continue' }, // spec §5 Toewijzing
  },

  catalog: {
    points_price_rounding: 50, // spec §5 Puntenprijs
    release_days_per_week: 7, // spec §5 Voorraad: daily one seventh (working hypothesis)
    anchor_reserved_pct: 50, // spec §5 Voorraad: half reserved (working hypothesis)
    low_stock_pct: 10, // spec §4.3 Weekvrijgave: "bijna op" under 10%
    broken_code_workdays: 2, // spec §4.3 Kapotte code
  },

  phone: {
    numbers_per_account: 1, // spec §5 Telefoonverificatie
    allowed_line_types: ['mobile'], // spec §5 Telefoonverificatie: line type check
    code_attempts: 5, // arch §3.3 phone_verification
  },

  challenges: {
    min_linked_members: 15, // spec §5 Minimum challenge
    participation_min_goal_days: 3, // spec §4.6 Deelnamegraad per week
    threshold_participation_pct: 25, // spec §5 Drempel collectieve prijs
    intensity_cap_min: 300, // spec §4.6 Plafond
    pool_bounds: [150, 500], // spec §4.6 Poules (assumption)
    pool_min_clubs: 3, // spec §4.6 Poules
    code_cap_factor: 1.1, // spec §4.6 Codeplafond
    prize_period_weeks: [
      { first_day: '2027-01-04', last_day: '2027-01-10' },
      { first_day: '2027-01-11', last_day: '2027-01-17' },
    ], // spec §4.6 Prijsperiode (working hypothesis)
    warmup_until: '2026-12-20', // spec §4.6 Aanloopklassement: until the vacation pause
    club_prize_mode: 'rank_and_threshold', // spec §4.6 Terugvalvariant; arch §6.2 club_prize_mode
    prize_sample_size: 20, // spec §4.6 Verplichte steekproef
    prize_delivery_after_days: 14, // spec §4.7 Levering na 14 dagen
  },

  board: {
    min_group: 5, // spec §4.6 Bestuursdashboard
    round_to: 5, // productplan §10 Bestuurscijfers; arch §6.4
    min_change: 5, // arch §6.4 rule 3
  },

  review: {
    decision_workdays: 3, // spec §6.4
    appeal_window_days: 14, // spec §6.5
    appeal_decision_workdays: 5, // spec §6.5
  },

  fraud: {
    h2_accounts_per_ip_24h: 3, // spec §6.3 H2: more than 3
    h2_shared_threshold: null, // spec §6.3 H2: from the red-team day
    h5_daily_min: 480, // spec §6.3 H5
    h5_consecutive_days: 3, // spec §6.3 H5
    h6_window: { from: '01:00', to: '06:00' }, // spec §6.3 H6
    h6_nights_per_week: 2, // spec §6.3 H6: more than 2 nights
    h7_window_min: 10, // spec §6.3 H7
    h7_shared_threshold: null, // spec §6.3 H7: from the red-team day
    h9_claim_delay_min: 15, // spec §6.3 H9
    h9_share_pct: 80, // spec §6.3 H9
    h10_new_members: 20, // spec §6.3 H10: more than 20
    h10_window_h: 48, // spec §6.3 H10
    h10_max_ip_hashes: 3, // spec §6.3 H10
    h10_share_pct: 50, // spec §6.3 H10: more than half
    h10_shared_threshold: null, // spec §6.3 H10: from the red-team day
    h11_accounts_per_device_week: 1, // spec §6.3 H11: more than one
  },

  sample: {
    weekly_size: 30, // spec §6.7
    min_stratum_actives: 5, // arch §6.5
    min_per_stratum: 1, // arch §6.5
    fraud_go_no_go_pct: 5, // spec §6.1, §6.7
  },

  harm: {
    s1_nights: 3, // spec §6.6 S1
    s1_window_days: 7, // spec §6.6 S1
    s2_daily_min: 360, // spec §6.6 S2
    s2_days: 3, // spec §6.6 S2
    s2_window_days: 7, // spec §6.6 S2
    s3_min_streak: 7, // spec §6.6 S3
    s3_inactive_days: 7, // spec §6.6 S3
    s3_prior_focus_days: 5, // spec §6.6 S3
    card_cooldown_days: 14, // spec §3.15
  },

  ambassadors: {
    eval_day: 14, // spec §4.9 Ambassadeurscodes
    min_sessions: 5, // spec §4.9
    fee_cents: 500, // spec §4.9 (working hypothesis)
    max_users_per_month: 40, // spec §4.9 (working hypothesis)
  },

  // CIDR ranges are not collected yet (arch §4.5, open question 17); no ranges are invented here.
  net_classes: [],

  levels: {
    '1': {
      cash_allowed: false, // businessplan besluit 5; arch §1
      free_credit_allowed: false, // spec §4.3
      allowed_reward_kinds: ['in_kind', 'service', 'partner_discount'], // arch §5.3
      allowed_prize_kinds: ['in_kind', 'service'], // arch §3.4 prize.reward_kind
      catalog_item_max_cents: 500, // spec §5 Europlafonds: item ≤ €5
      individual_prize_max_cents: 1000, // spec §5: individual prize ≤ €10
      person_month_max_cents: 1500, // spec §5: per person per month ≤ €15
      main_prize_max_cents: 15000, // spec §5: main prize ≤ €150
      threshold_prize_max_cents: 7500, // spec §5: threshold prize ≤ €75
    },
  },
};
