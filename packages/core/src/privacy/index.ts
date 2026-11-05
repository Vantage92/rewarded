// core/privacy (architecture §6.4; spec §4.6 Bestuursdashboard). Owner WP-5.
// Small-group suppression, rounding to fives and the difference rule for the board dashboard.
// Pure functions: the API applies them to every board number before it leaves the server.

export interface PrivacyRules {
  /** A number is only shown for groups of at least this many members (spec §4.6: 5). */
  readonly min_group: number;
  /** Counts are rounded to multiples of this (productplan §10: fives). */
  readonly round_to: number;
  /** A count that moved less than this since the last shown week is hidden (arch §6.4 rule 3). */
  readonly min_change: number;
}

/** A board number: `null` with `suppressed: true` when a rule hides it (contracts `Metric`). */
export interface Metric {
  value: number | null;
  suppressed: boolean;
}

export type SuppressReason = 'small_group' | 'small_change';

export interface SuppressedMetric extends Metric {
  reason?: SuppressReason;
}

export const SUPPRESSED: Readonly<Metric> = Object.freeze({ value: null, suppressed: true });

/** Rounds to the nearest multiple of `step`, halves up (22 → 20, 23 → 25). */
export function roundTo(n: number, step: number): number {
  if (step <= 1) return Math.round(n);
  return Math.floor(n / step + 0.5) * step;
}

export function shown(value: number): Metric {
  return { value, suppressed: false };
}

/** Rule 2: a count of a group, rounded; below the minimum group size it is suppressed. */
export function suppressCount(count: number, groupSize: number, rules: PrivacyRules): SuppressedMetric {
  if (groupSize < rules.min_group || count < 0) return { value: null, suppressed: true, reason: 'small_group' };
  return { value: roundTo(count, rules.round_to), suppressed: false };
}

/**
 * Rule 2 for shares: computed from the rounded counts, never from the raw ones, so a share
 * cannot reveal what the rounding hides. Suppressed when the group is small or the rounded
 * denominator is zero.
 */
export function shareFromRounded(numerator: number, denominator: number, rules: PrivacyRules): SuppressedMetric {
  if (denominator < rules.min_group) return { value: null, suppressed: true, reason: 'small_group' };
  const n = roundTo(numerator, rules.round_to);
  const d = roundTo(denominator, rules.round_to);
  if (d <= 0) return { value: null, suppressed: true, reason: 'small_group' };
  return { value: Math.round((Math.min(n, d) / d) * 1000) / 1000, suppressed: false };
}

/** A metric value for a group that is itself an aggregate at club level (rate, intensity). */
export function groupMetric(value: number | null, groupSize: number, rules: PrivacyRules): SuppressedMetric {
  if (value === null || groupSize < rules.min_group) return { value: null, suppressed: true, reason: 'small_group' };
  return { value, suppressed: false };
}

/**
 * Rules 1–3 over a weekly series of raw counts (oldest first), each with its group size.
 * A week is shown only when the group is large enough and the count differs from the last shown
 * week by 0 or at least `min_change` (raw counts). Comparing with the last *shown* week, not the
 * previous one, stops a board from summing several small hidden changes.
 */
export function weeklyCountSeries(points: readonly { count: number; groupSize: number }[], rules: PrivacyRules): SuppressedMetric[] {
  const out: SuppressedMetric[] = [];
  let lastShownRaw: number | null = null;
  for (const p of points) {
    const base = suppressCount(p.count, p.groupSize, rules);
    if (base.suppressed) {
      out.push(base);
      continue;
    }
    if (lastShownRaw !== null) {
      const diff = Math.abs(p.count - lastShownRaw);
      if (diff > 0 && diff < rules.min_change) {
        out.push({ value: null, suppressed: true, reason: 'small_change' });
        continue;
      }
    }
    lastShownRaw = p.count;
    out.push(base);
  }
  return out;
}

/** Strips the internal reason so the value matches the contracts `Metric`. */
export function toMetric(m: SuppressedMetric): Metric {
  return { value: m.value, suppressed: m.suppressed };
}
