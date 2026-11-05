// Thresholds of the heuristics, harm signals, sample and review rules (spec §6.3–6.7, voorregistratie
// §7–§8). Most come from params v1 (WP-1). The values that params v1 does not carry yet are kept
// here as WP-6 defaults with their source; a change still needs a founder decision and a new
// parameter version (architecture §4.5), so they move into params when WP-1 adds them.
import type { NetClassName as NetClass, Params } from '../params/index.ts';

/** Net classes where many honest people share one address (architecture §4.5). */
export const SHARED_NET_CLASSES: readonly NetClass[] = ['campus', 'mobile_cgnat'];
export function isSharedNet(c: NetClass | null | undefined): boolean {
  return c === 'campus' || c === 'mobile_cgnat';
}

export interface FraudRules {
  h1HeadlessUaClasses: readonly string[];
  h2AccountsPerIp24h: number;
  /** null until the red-team day (spec §6.3): shared-net groups are then not flagged, only reported. */
  h2SharedThreshold: number | null;
  h3CoveredGapPct: number;
  h4ClockSkewS: number;
  h5DailyMin: number;
  h5ConsecutiveDays: number;
  h6Window: { from: string; to: string };
  h6NightsPerWeek: number;
  /** Largest break between two sessions that still counts as "zonder onderbreking" (end grace, §4.1). */
  h6MaxBreakMin: number;
  h7WindowMin: number;
  /** For shared nets: least number of members registered together from one address. null until red-team day. */
  h7SharedThreshold: number | null;
  h9ClaimDelayMin: number;
  h9SharePct: number;
  h10NewMembers: number;
  h10WindowH: number;
  h10MaxIpHashes: number;
  h10SharePct: number;
  h10SharedThreshold: number | null;
  h11AccountsPerDeviceWeek: number;
  h12MinAccounts: number;
  h12MinOverlapMin: number;
  h12MinDays: number;
  /** H12 for non-desktop classes on shared nets (spec §6.3: from the red-team day). */
  h12SharedThreshold: number | null;
}

/** H12 working hypothesis of spec §6.3 / voorregistratie §7.6 (not yet in params v1). */
export const H12_DEFAULTS = { min_accounts: 3, min_overlap_min: 40, min_days: 2, shared_threshold: null } as const;

export function fraudRules(params: Params, overrides: Partial<FraudRules> = {}): FraudRules {
  const f = params.fraud;
  return {
    h1HeadlessUaClasses: ['headless'],
    h2AccountsPerIp24h: f.h2_accounts_per_ip_24h,
    h2SharedThreshold: f.h2_shared_threshold,
    h3CoveredGapPct: params.session.covered_gap_flag_pct,
    h4ClockSkewS: params.session.clock_skew_flag_s,
    h5DailyMin: f.h5_daily_min,
    h5ConsecutiveDays: f.h5_consecutive_days,
    h6Window: { from: f.h6_window.from, to: f.h6_window.to },
    h6NightsPerWeek: f.h6_nights_per_week,
    h6MaxBreakMin: params.session.end_grace_min,
    h7WindowMin: f.h7_window_min,
    h7SharedThreshold: f.h7_shared_threshold,
    h9ClaimDelayMin: f.h9_claim_delay_min,
    h9SharePct: f.h9_share_pct,
    h10NewMembers: f.h10_new_members,
    h10WindowH: f.h10_window_h,
    h10MaxIpHashes: f.h10_max_ip_hashes,
    h10SharePct: f.h10_share_pct,
    h10SharedThreshold: f.h10_shared_threshold,
    h11AccountsPerDeviceWeek: f.h11_accounts_per_device_week,
    h12MinAccounts: H12_DEFAULTS.min_accounts,
    h12MinOverlapMin: H12_DEFAULTS.min_overlap_min,
    h12MinDays: H12_DEFAULTS.min_days,
    h12SharedThreshold: H12_DEFAULTS.shared_threshold,
    ...overrides,
  };
}

/**
 * Parameters that must be set before the release (spec §6.3: from the red-team day, fixed on the
 * seed before 2 December). An empty list means the heuristics run with every threshold.
 */
export function fraudReleaseBlockers(rules: FraudRules): string[] {
  const out: string[] = [];
  if (rules.h2SharedThreshold === null) out.push('h2_shared_threshold');
  if (rules.h7SharedThreshold === null) out.push('h7_shared_threshold');
  if (rules.h10SharedThreshold === null) out.push('h10_shared_threshold');
  if (rules.h12SharedThreshold === null) out.push('h12_shared_threshold');
  return out;
}

/** Harm signals, stop rule, guard rule and harm threshold (spec §6.6; voorregistratie §8.3). */
export interface HarmRules {
  s1Nights: number;
  s1WindowDays: number;
  s2DailyMin: number;
  s2Days: number;
  s2WindowDays: number;
  s3MinStreak: number;
  s3InactiveDays: number;
  s3PriorFocusDays: number;
  /** At most one signal per code per this many days (spec §3.15, architecture §3.4). */
  cooldownDays: number;
  /** Absolute harm threshold over all arms: share of weekly actives (working hypothesis 2%, G-S7). */
  absoluteThresholdPct: number;
  /** Stop rule criterion 2 and the guard rule: ratio of the shares between arms (voorregistratie §8.3). */
  armRatio: number;
  /** Stop rule criterion 1: half a standard deviation, two weeks in a row, ≥ 40 answers per arm. */
  wellbeingSdDiff: number;
  wellbeingWeeks: number;
  wellbeingMinPerArm: number;
}

export function harmRules(params: Params, overrides: Partial<HarmRules> = {}): HarmRules {
  const h = params.harm;
  return {
    s1Nights: h.s1_nights,
    s1WindowDays: h.s1_window_days,
    s2DailyMin: h.s2_daily_min,
    s2Days: h.s2_days,
    s2WindowDays: h.s2_window_days,
    s3MinStreak: h.s3_min_streak,
    s3InactiveDays: h.s3_inactive_days,
    s3PriorFocusDays: h.s3_prior_focus_days,
    cooldownDays: h.card_cooldown_days,
    absoluteThresholdPct: 2,
    armRatio: 2,
    wellbeingSdDiff: 0.5,
    wellbeingWeeks: 2,
    wellbeingMinPerArm: 40,
    ...overrides,
  };
}

/** Sample sizes (spec §6.7, §4.6, §4.9; voorregistratie §7). */
export function sampleRules(params: Params) {
  return {
    weeklySize: params.sample.weekly_size,
    minStratumActives: params.sample.min_stratum_actives,
    minPerStratum: params.sample.min_per_stratum,
    prizeSize: params.challenges.prize_sample_size,
    /** Voorregistratie §7.4: five counted accounts per ambassador before each payout. */
    ambassadorSize: 5,
    fraudGoNoGoPct: params.sample.fraud_go_no_go_pct,
  } as const;
}
