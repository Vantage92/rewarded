import { describe, expect, it } from 'vitest';
import {
  CURRENT_PARAMS,
  PARAMS_V1,
  ParamsError,
  clubCodeCap,
  clubPool,
  dayCloseOffsetMin,
  isSessionLength,
  levelParams,
  maxSessionMin,
  paramsByVersion,
  parseParams,
  streakRequiredMet,
} from '../src/params/index.ts';
import { PARAMS_V1_RAW } from '../src/params/v1.ts';

// One row per parameter leaf: [path, expected value, source paragraph]. The coverage test below
// fails when a parameter is added to v1 without a row here.
const ROWS: readonly [string, unknown, string][] = [
  ['version', 1, 'arch §3.3 param_version'],
  ['timezone', 'Europe/Amsterdam', 'spec §4.2 Dagrand'],
  ['time.day_boundary', '04:00', 'spec §5 Dagrand'],
  ['time.week_start_iso_weekday', 1, 'spec §4.2 Weekplafond'],
  ['time.night_window.from', '01:00', 'spec §5 Nachtregel'],
  ['time.night_window.to', '04:00', 'spec §5 Nachtregel'],
  ['time.sweep_interval_min', 1, 'arch §4.3 sweep'],
  ['time.sweep_margin_min', 5, 'arch §6.1 dagafsluiting'],
  ['time.stock_release_at', '04:00', 'spec §4.3 Weekvrijgave'],
  ['time.reminder_at', '19:30', 'arch §6.3 herinnering'],
  ['session.lengths_min', [25, 50, 90], 'spec §5 Sessielengtes'],
  ['session.practice_min', 1, 'spec §5 Oefensessie'],
  ['session.heartbeat_interval_s', 30, 'spec §4.1 Heartbeat'],
  ['session.gap_ok_s', 90, 'spec §4.1 Heartbeatgaten'],
  ['session.gap_covered_max_s', 300, 'spec §4.1 Heartbeatgaten'],
  ['session.covered_gap_flag_pct', 10, 'spec §4.1 Heartbeatgaten (H3)'],
  ['session.mono_tolerance_s', 5, 'spec §4.1 Heartbeatgaten'],
  ['session.end_tolerance_s', 30, 'spec §4.1 Einde'],
  ['session.end_grace_min', 10, 'spec §4.1 late_end, arch §4.3 end_grace_min'],
  ['session.clock_skew_flag_s', 300, 'spec §6.3 H4'],
  ['session.one_active_per_account', true, 'spec §4.1 Eén sessie tegelijk'],
  ['session.pause_allowed', false, 'spec §4.1 Zichtbaarheid en pauze'],
  ['session.return_window_s', 0, 'spec §4.1 Zichtbaarheid en pauze'],
  ['points.points_per_verified_min', 1, 'spec §5 Ratio'],
  ['points.daily_cap_min', 300, 'spec §5 Puntenplafond per dag'],
  ['points.earn_in_min', 300, 'spec §5 Inverdienperiode'],
  ['points.first_redeem_hold_days', 7, 'spec §5 Wachttijd eerste verzilvering'],
  ['points.redemptions_per_week', 1, 'spec §5 Weekplafond verzilvering'],
  ['points.practice_points', 0, 'spec §5 Oefensessie'],
  ['points.aborted_points', 0, 'spec §5 Afgebroken sessie'],
  ['goals.options_min', [25, 50, 90, 120], 'spec §5 Dagdoel'],
  ['goals.default_min', 25, 'spec §5 Dagdoel'],
  ['goals.confirm_min', [90, 120], 'spec §5 Dagdoel'],
  ['goals.confirm_window_days', 7, 'spec §4.4 Overmoedrem'],
  ['goals.suggestion_after_days', 7, 'spec §5 Dagdoel'],
  ['goals.suggestion_floor_min', 25, 'spec §4.4 Overmoedrem'],
  ['goals.exam_days_per_week', 3, 'spec §5 Tentamendag'],
  ['goal_bonus.points_per_goal', 20, 'spec §5 Doelbonus arm A'],
  ['goal_bonus.arm_a_weekly_max', 140, 'spec §5 Doelbonus arm A'],
  ['goal_bonus.arm_b_weekly_budget', 140, 'spec §5 Doelbonus arm B'],
  ['goal_bonus.arm_b_points_per_remaining_day', 20, 'spec §5 Doelbonus arm B'],
  ['goal_bonus.season.first_day', '2026-12-02', 'spec §5 Seizoen doelbonus'],
  ['goal_bonus.season.last_day', '2027-01-17', 'spec §5 Seizoen doelbonus, arch §5.1'],
  ['goal_bonus.season_ends_at', '2027-01-18T04:00', 'spec §4.2 Seizoen doelbonus'],
  ['goal_bonus.joker_protects_bonus', false, 'spec §5 Joker en doelbonus'],
  ['goal_bonus.late_start_earns_bonus', false, 'spec §5 Nachtregel'],
  ['vacation_pause.first_day', '2026-12-21', 'spec §5 Vakantiepauze'],
  ['vacation_pause.last_day', '2027-01-03', 'spec §5 Vakantiepauze'],
  ['rest_period.first_day', '2027-01-19', 'spec §5 Rustperiode'],
  ['rest_period.last_day', '2027-03-31', 'spec §5 Rustperiode'],
  ['squads.min_size', 3, 'spec §5 Squadomvang'],
  ['squads.max_size', 6, 'spec §5 Squadomvang'],
  ['squads.streak_min_met', 2, 'spec §5 Squadstreak'],
  ['squads.streak_share', 0.5, 'spec §5 Squadstreak'],
  ['squads.freeze_below_active', 3, 'spec §4.4 Onder 3 actieve leden'],
  ['squads.jokers_per_week', 1, 'spec §5 Rustdag-joker'],
  ['squads.recovery_days', 2, 'spec §5 Streakherstel'],
  ['squads.recoveries_per_break', 1, 'spec §5 Streakherstel'],
  ['squads.auto_pause_after_days', 7, 'spec §5 Automatische pauze'],
  ['squads.regroup_after_days', 7, 'spec §5 Hersamenstellen'],
  ['squads.regroup_below_active', 2, 'spec §5 Hersamenstellen'],
  ['squads.archive_after_days', 14, 'spec §4.4 Archief'],
  ['squads.invite_max_uses', 5, 'spec §4.4 Uitnodigingslink'],
  ['squads.invite_valid_days', 7, 'spec §4.4 Uitnodigingslink'],
  ['squads.presence_poll_s', 30, 'spec §4.4 Live aanwezigheid'],
  ['squads.presence_default.16_17', false, 'spec §5 Live aanwezigheid'],
  ['squads.presence_default.18_plus', true, 'spec §5 Live aanwezigheid'],
  ['squads.memberships_per_user', 1, 'spec §4.4 Lidmaatschap'],
  ['duels.length_days', 7, 'spec §5 Duel'],
  ['duels.invite_valid_h', 48, 'spec §4.5'],
  ['duels.invite_max_uses', 1, 'spec §4.5'],
  ['duels.outside_squad_age_band', '18_plus', 'spec §5 Duel'],
  ['duels.concurrent_per_player', 1, 'spec §4.5'],
  ['duels.points_at_stake', 0, 'spec §4.5'],
  ['referral.starts_on', '2027-01-05', 'spec §4.9 Start'],
  ['referral.points_per_party', 150, 'spec §5 Referral'],
  ['referral.vest_sessions', 3, 'spec §5 Referral'],
  ['referral.vest_session_min', 25, 'spec §5 Referral'],
  ['referral.vest_window_h', 168, 'spec §4.9 Vesting'],
  ['referral.max_vested_per_month', 5, 'spec §5 Referral'],
  ['referral.max_price_share_pct', 50, 'spec §5 Referral'],
  ['expiry.months_after_last_session', 12, 'spec §5 Vervaldatum'],
  ['expiry.notice_days', 30, 'spec §4.2 Vervaldatum'],
  ['expiry.built', false, 'spec §4.2 Vervaldatum'],
  ['belofte.early_offer_day', '2027-01-11', 'spec §5 Belofte-aanbod'],
  ['belofte.days_per_week_min', 3, 'spec §4.12 Keuzes'],
  ['belofte.days_per_week_max', 7, 'spec §4.12 Keuzes'],
  ['belofte.minutes_options', [25, 50, 90, 120], 'spec §4.12 Keuzes'],
  ['belofte.duration_days', 14, 'spec §4.12 Looptijd'],
  ['belofte.suggestion_lookback_days', 14, 'spec §4.12 Voorstel'],
  ['belofte.outside_experiment_offer_after_days', 14, 'spec §4.12 Aanbod'],
  ['belofte.points', 0, 'spec §4.12 Beloning'],
  ['experiments.factors', ['bonus', 'belofte', 'rest', 'prompt'], 'spec §5 Toewijzing'],
  ['experiments.share_pct', 50, 'spec §5 Toewijzing'],
  ['experiments.block_size', 4, 'spec §5 Toewijzing'],
  ['experiments.registration_last_day', '2027-01-17', 'spec §5 Toewijzing'],
  ['experiments.squad_prompt_days.from', 1, 'spec §5 Squadprompt'],
  ['experiments.squad_prompt_days.to', 3, 'spec §5 Squadprompt'],
  ['experiments.minor_arms.bonus', 'A', 'spec §5 Toewijzing'],
  ['experiments.minor_arms.rest', 'continue', 'spec §5 Rustperiode'],
  ['catalog.points_price_rounding', 50, 'spec §5 Puntenprijs'],
  ['catalog.release_days_per_week', 7, 'spec §5 Voorraad'],
  ['catalog.anchor_reserved_pct', 50, 'spec §5 Voorraad'],
  ['catalog.low_stock_pct', 10, 'spec §4.3 Weekvrijgave'],
  ['catalog.broken_code_workdays', 2, 'spec §4.3 Kapotte code'],
  ['phone.numbers_per_account', 1, 'spec §5 Telefoonverificatie'],
  ['phone.allowed_line_types', ['mobile'], 'spec §5 Telefoonverificatie'],
  ['phone.code_attempts', 5, 'arch §3.3 phone_verification'],
  ['challenges.min_linked_members', 15, 'spec §5 Minimum challenge'],
  ['challenges.participation_min_goal_days', 3, 'spec §4.6 Deelnamegraad per week'],
  ['challenges.threshold_participation_pct', 25, 'spec §5 Drempel collectieve prijs'],
  ['challenges.intensity_cap_min', 300, 'spec §4.6 Plafond'],
  ['challenges.pool_bounds', [150, 500], 'spec §4.6 Poules'],
  ['challenges.pool_min_clubs', 3, 'spec §4.6 Poules'],
  ['challenges.code_cap_factor', 1.1, 'spec §4.6 Codeplafond'],
  [
    'challenges.prize_period_weeks',
    [
      { first_day: '2027-01-04', last_day: '2027-01-10' },
      { first_day: '2027-01-11', last_day: '2027-01-17' },
    ],
    'spec §4.6 Prijsperiode',
  ],
  ['challenges.warmup_until', '2026-12-20', 'spec §4.6 Aanloopklassement'],
  ['challenges.club_prize_mode', 'rank_and_threshold', 'spec §4.6 Terugvalvariant'],
  ['challenges.prize_sample_size', 20, 'spec §4.6 Verplichte steekproef'],
  ['challenges.prize_delivery_after_days', 14, 'spec §4.7 Winnaarsverificatie'],
  ['board.min_group', 5, 'spec §4.6 Bestuursdashboard'],
  ['board.round_to', 5, 'arch §6.4 afronding'],
  ['board.min_change', 5, 'arch §6.4 verschilonderdrukking'],
  ['review.decision_workdays', 3, 'spec §6.4'],
  ['review.appeal_window_days', 14, 'spec §6.5'],
  ['review.appeal_decision_workdays', 5, 'spec §6.5'],
  ['fraud.h2_accounts_per_ip_24h', 3, 'spec §6.3 H2'],
  ['fraud.h2_shared_threshold', null, 'spec §6.3 H2 (red-team day)'],
  ['fraud.h5_daily_min', 480, 'spec §6.3 H5'],
  ['fraud.h5_consecutive_days', 3, 'spec §6.3 H5'],
  ['fraud.h6_window.from', '01:00', 'spec §6.3 H6'],
  ['fraud.h6_window.to', '06:00', 'spec §6.3 H6'],
  ['fraud.h6_nights_per_week', 2, 'spec §6.3 H6'],
  ['fraud.h7_window_min', 10, 'spec §6.3 H7'],
  ['fraud.h7_shared_threshold', null, 'spec §6.3 H7 (red-team day)'],
  ['fraud.h9_claim_delay_min', 15, 'spec §6.3 H9'],
  ['fraud.h9_share_pct', 80, 'spec §6.3 H9'],
  ['fraud.h10_new_members', 20, 'spec §6.3 H10'],
  ['fraud.h10_window_h', 48, 'spec §6.3 H10'],
  ['fraud.h10_max_ip_hashes', 3, 'spec §6.3 H10'],
  ['fraud.h10_share_pct', 50, 'spec §6.3 H10'],
  ['fraud.h10_shared_threshold', null, 'spec §6.3 H10 (red-team day)'],
  ['fraud.h11_accounts_per_device_week', 1, 'spec §6.3 H11'],
  ['sample.weekly_size', 30, 'spec §6.7'],
  ['sample.min_stratum_actives', 5, 'arch §6.5'],
  ['sample.min_per_stratum', 1, 'arch §6.5'],
  ['sample.fraud_go_no_go_pct', 5, 'spec §6.1'],
  ['harm.s1_nights', 3, 'spec §6.6 S1'],
  ['harm.s1_window_days', 7, 'spec §6.6 S1'],
  ['harm.s2_daily_min', 360, 'spec §6.6 S2'],
  ['harm.s2_days', 3, 'spec §6.6 S2'],
  ['harm.s2_window_days', 7, 'spec §6.6 S2'],
  ['harm.s3_min_streak', 7, 'spec §6.6 S3'],
  ['harm.s3_inactive_days', 7, 'spec §6.6 S3'],
  ['harm.s3_prior_focus_days', 5, 'spec §6.6 S3'],
  ['harm.card_cooldown_days', 14, 'spec §3.15'],
  ['ambassadors.eval_day', 14, 'spec §4.9 Ambassadeurscodes'],
  ['ambassadors.min_sessions', 5, 'spec §4.9 Ambassadeurscodes'],
  ['ambassadors.fee_cents', 500, 'spec §4.9 Ambassadeurscodes'],
  ['ambassadors.max_users_per_month', 40, 'spec §4.9 Ambassadeurscodes'],
  ['net_classes', [], 'arch §4.5 netklassen (open question 17)'],
  ['levels.1.cash_allowed', false, 'arch §1 verificatieniveau'],
  ['levels.1.free_credit_allowed', false, 'spec §4.3 Europlafonds op trede 1'],
  ['levels.1.allowed_reward_kinds', ['in_kind', 'service', 'partner_discount'], 'arch §5.3 soorten'],
  ['levels.1.allowed_prize_kinds', ['in_kind', 'service'], 'arch §3.4 prize'],
  ['levels.1.catalog_item_max_cents', 500, 'spec §5 Europlafonds'],
  ['levels.1.individual_prize_max_cents', 1000, 'spec §5 Europlafonds'],
  ['levels.1.person_month_max_cents', 1500, 'spec §5 Europlafonds'],
  ['levels.1.main_prize_max_cents', 15000, 'spec §5 Europlafonds'],
  ['levels.1.threshold_prize_max_cents', 7500, 'spec §5 Europlafonds'],
];

function at(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o !== null && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);
}

/** Leaf paths: arrays count as one leaf (a list parameter), objects recurse. */
function leaves(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return [prefix];
  return Object.entries(obj).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

describe('parameter set v1, one test per parameter', () => {
  for (const [path, expected, ref] of ROWS) {
    it(`${ref}: ${path} = ${JSON.stringify(expected)}`, () => {
      expect(at(PARAMS_V1, path)).toEqual(expected);
    });
  }

  it('arch §12.1 WP-1: every parameter leaf in v1 has a row in this test', () => {
    const covered = new Set(ROWS.map(([p]) => p));
    expect(leaves(PARAMS_V1).filter((p) => !covered.has(p))).toEqual([]);
    expect([...covered].filter((p) => at(PARAMS_V1, p) === undefined)).toEqual([]);
  });
});

describe('parameter set validation (zod)', () => {
  it('arch §2 params: v1 parses, is frozen and is the current set', () => {
    expect(parseParams(clone(PARAMS_V1_RAW))).toEqual(PARAMS_V1);
    expect(Object.isFrozen(PARAMS_V1)).toBe(true);
    expect(Object.isFrozen(PARAMS_V1.session.lengths_min)).toBe(true);
    expect(CURRENT_PARAMS).toBe(PARAMS_V1);
    expect(paramsByVersion(1)).toBe(PARAMS_V1);
    expect(() => paramsByVersion(2)).toThrow(ParamsError);
  });

  it('arch §2 params: unknown keys are rejected (strict objects)', () => {
    const bad = clone(PARAMS_V1_RAW) as unknown as Record<string, Record<string, unknown>>;
    (bad.points as Record<string, unknown>).bonus_multiplier = 2;
    expect(() => parseParams(bad)).toThrow(/bonus_multiplier|Unrecognized/);
  });

  it('spec §5 Doelbonus (founder JS2): arm A and arm B must have the same weekly maximum', () => {
    const bad = clone(PARAMS_V1_RAW);
    bad.goal_bonus.arm_b_weekly_budget = 160;
    expect(() => parseParams(bad)).toThrow(/same weekly maximum/);
  });

  it('spec §5 Dagdoel: the default goal must be one of the options', () => {
    const bad = clone(PARAMS_V1_RAW);
    bad.goals.default_min = 30;
    expect(() => parseParams(bad)).toThrow(/default goal/);
  });

  it('spec §5 Seizoen doelbonus: a date range may not run backwards', () => {
    const bad = clone(PARAMS_V1_RAW);
    bad.goal_bonus.season = { first_day: '2027-01-17', last_day: '2026-12-02' };
    expect(() => parseParams(bad)).toThrow(/first_day/);
  });

  it('spec §5 Europlafonds: level 1 can never allow cash or open credit', () => {
    const bad = clone(PARAMS_V1_RAW) as unknown as { levels: { '1': Record<string, unknown> } };
    bad.levels['1'].cash_allowed = true;
    expect(() => parseParams(bad)).toThrow(ParamsError);
    const bad2 = clone(PARAMS_V1_RAW) as unknown as { levels: { '1': { allowed_reward_kinds: string[] } } };
    bad2.levels['1'].allowed_reward_kinds.push('gift_card_open');
    expect(() => parseParams(bad2)).toThrow(ParamsError);
  });

  it('spec §6.3 H2/H7/H10: a red-team threshold accepts a positive number once fixed', () => {
    const fixed = clone(PARAMS_V1_RAW);
    fixed.fraud.h2_shared_threshold = 12;
    expect(parseParams(fixed).fraud.h2_shared_threshold).toBe(12);
    fixed.fraud.h7_shared_threshold = 0;
    expect(() => parseParams(fixed)).toThrow(ParamsError);
  });

  it('arch §4.5 netklassen: a CIDR line needs class, source and check date', () => {
    const p = clone(PARAMS_V1_RAW);
    p.net_classes = [{ cidr: '192.0.2.0/24', class: 'campus', source: 'documentation range (RFC 5737)', checked_at: '2026-11-05' }];
    expect(parseParams(p).net_classes).toHaveLength(1);
    const bad = clone(p) as unknown as { net_classes: Record<string, unknown>[] };
    (bad.net_classes[0] as Record<string, unknown>).class = 'other';
    expect(() => parseParams(bad)).toThrow(ParamsError);
  });

  it('spec §4.1 Einde: end tolerance must stay below the shortest session', () => {
    const bad = clone(PARAMS_V1_RAW);
    bad.session.end_tolerance_s = 25 * 60;
    expect(() => parseParams(bad)).toThrow(/end tolerance/);
  });
});

describe('derived parameters', () => {
  it('arch §6.1: day close offset is 90 + 10 + 5 = 105 minutes after 04:00', () => {
    expect(maxSessionMin(PARAMS_V1)).toBe(90);
    expect(dayCloseOffsetMin(PARAMS_V1)).toBe(105);
  });

  it('arch §1 verificatieniveau: caps exist for level 1 only', () => {
    expect(levelParams(PARAMS_V1, 1).catalog_item_max_cents).toBe(500);
    expect(() => levelParams(PARAMS_V1, 2)).toThrow(ParamsError);
    expect(() => levelParams(PARAMS_V1, 0)).toThrow(ParamsError);
  });

  it('spec §5 Sessielengtes: practice is not a selectable length', () => {
    expect(isSessionLength(PARAMS_V1, 25)).toBe(true);
    expect(isSessionLength(PARAMS_V1, 1)).toBe(false);
    expect(isSessionLength(PARAMS_V1, 45)).toBe(false);
  });

  it('spec §5 Squadstreak: half of active members rounded up, at least 2', () => {
    expect([2, 3, 4, 5, 6].map((n) => streakRequiredMet(PARAMS_V1, n))).toEqual([2, 2, 2, 3, 3]);
  });

  it('spec §4.6 Codeplafond: floor(1.1 × declared members) without float drift', () => {
    expect(clubCodeCap(PARAMS_V1, 100)).toBe(110);
    expect(clubCodeCap(PARAMS_V1, 10)).toBe(11);
    expect(clubCodeCap(PARAMS_V1, 9)).toBe(9);
  });

  it('spec §4.6 Poules: < 150, 150–500, > 500', () => {
    expect([149, 150, 500, 501].map((n) => clubPool(PARAMS_V1, n))).toEqual(['lt150', '150_500', '150_500', 'gt500']);
  });
});
