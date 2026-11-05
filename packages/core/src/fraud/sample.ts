// Reproducible samples (spec §6.7, §4.6, §4.9; architecture §6.5; voorregistratie §7.1–7.4).
// Weekly: 30 accounts with ≥ 1 completed session last week, stratified per club plus `no_club`
// (and `expansion` after the launch decision), proportional, at least one per stratum with ≥ 5
// actives. The order inside a stratum is HMAC-SHA256(seed, kind ‖ key ‖ stratum ‖ user), so anyone
// with the seed can redraw it.
import { hmacSha256Hex } from './sha256.ts';

export interface SampleCandidate {
  userId: string;
  stratum: string;
}

export interface Allocation {
  stratum: string;
  actives: number;
  size: number;
}

export const NO_CLUB_STRATUM = 'no_club';
export const EXPANSION_STRATUM = 'expansion';

/** Stratum of an account: the expansion cohort after the launch decision, else its club or `no_club`. */
export function stratumOf(u: { clubId: string | null; cohort: 'experiment' | 'expansion' }, expansionStratum: boolean): string {
  if (expansionStratum && u.cohort === 'expansion') return EXPANSION_STRATUM;
  return u.clubId ?? NO_CLUB_STRATUM;
}

/**
 * Proportional allocation with a guaranteed minimum for strata with ≥ minActives actives
 * (largest remainder, ties by stratum name). The total is min(size, all actives).
 */
export function allocate(counts: ReadonlyMap<string, number>, size: number, minPer: number, minActives: number): Allocation[] {
  const strata = [...counts].filter(([, n]) => n > 0).sort(([a], [b]) => a.localeCompare(b));
  const total = strata.reduce((s, [, n]) => s + n, 0);
  const target = Math.min(size, total);
  const alloc = new Map<string, number>(strata.map(([s]) => [s, 0]));
  // Guarantee first; if there are more eligible strata than places, the biggest go first.
  const eligible = strata.filter(([, n]) => n >= minActives).sort(([a, x], [b, y]) => y - x || a.localeCompare(b));
  let left = target;
  for (const [s, n] of eligible) {
    const g = Math.min(minPer, n, left);
    alloc.set(s, g);
    left -= g;
  }
  // Proportional rest over the remaining capacity, by largest remainder.
  while (left > 0) {
    const room = strata.filter(([s, n]) => (alloc.get(s) ?? 0) < n);
    if (room.length === 0) break;
    const ideal = room.map(([s, n]) => ({ s, want: (target * n) / total - (alloc.get(s) ?? 0), cap: n - (alloc.get(s) ?? 0) }));
    let given = 0;
    for (const r of ideal) {
      const add = Math.min(Math.max(0, Math.floor(r.want)), r.cap, left - given);
      if (add > 0) {
        alloc.set(r.s, (alloc.get(r.s) ?? 0) + add);
        given += add;
      }
    }
    if (given === 0) {
      const next = ideal.sort((a, b) => b.want - (b.want | 0) - (a.want - (a.want | 0)) || b.want - a.want || a.s.localeCompare(b.s))[0];
      if (!next) break;
      alloc.set(next.s, (alloc.get(next.s) ?? 0) + 1);
      given = 1;
    }
    left -= given;
  }
  return strata.map(([s, n]) => ({ stratum: s, actives: n, size: alloc.get(s) ?? 0 }));
}

export interface DrawInput {
  seed: string;
  /** weekly | prize | ambassador */
  kind: string;
  /** week key, `challenge:club` or `ambassador:month`. */
  key: string;
  candidates: readonly SampleCandidate[];
  size: number;
  minPerStratum: number;
  minStratumActives: number;
}

export interface DrawnItem {
  userId: string;
  stratum: string;
  /** HMAC that ordered the item; stored so the draw can be verified. */
  score: string;
}

export interface DrawResult {
  allocation: Allocation[];
  items: DrawnItem[];
}

export function sampleScore(seed: string, kind: string, key: string, stratum: string, userId: string): string {
  return hmacSha256Hex(seed, `${kind}|${key}|${stratum}|${userId}`);
}

/** Draws a stratified sample; the same input always gives the same items in the same order. */
export function drawSample(input: DrawInput): DrawResult {
  const byStratum = new Map<string, Set<string>>();
  for (const c of input.candidates) (byStratum.get(c.stratum) ?? byStratum.set(c.stratum, new Set()).get(c.stratum)!).add(c.userId);
  const allocation = allocate(new Map([...byStratum].map(([s, u]) => [s, u.size])), input.size, input.minPerStratum, input.minStratumActives);
  const items: DrawnItem[] = [];
  for (const a of allocation) {
    const users = [...(byStratum.get(a.stratum) ?? [])].map((u) => ({ userId: u, stratum: a.stratum, score: sampleScore(input.seed, input.kind, input.key, a.stratum, u) }));
    users.sort((x, y) => x.score.localeCompare(y.score) || x.userId.localeCompare(y.userId));
    items.push(...users.slice(0, a.size));
  }
  return { allocation, items };
}

/** Prize sample of 20 counted members (or all), ambassador sample of 5 (or all): one stratum. */
export function drawSimple(seed: string, kind: 'prize' | 'ambassador', key: string, userIds: readonly string[], size: number): DrawnItem[] {
  return drawSample({ seed, kind, key, candidates: userIds.map((u) => ({ userId: u, stratum: kind })), size, minPerStratum: 0, minStratumActives: Number.MAX_SAFE_INTEGER }).items;
}
