// core/challenges (spec §4.6, §4.7; architecture §6.2, §6.3). Owner WP-5.
// Participation rate with the identity anchor in prize weeks, intensity, pools, ranking with the
// tie-break, threshold, prize-period score, the code cap and the performance-challenge predicate.
// Pure: the API passes links, user_day facts and sessions; nothing here knows a user beyond an id.
import { addDays, compareDays, dayRange, type FocusDay } from '../time/index.ts';

/** The challenges slice of the parameter set (params.challenges). */
export interface ChallengeParams {
  readonly min_linked_members: number;
  readonly participation_min_goal_days: number;
  readonly threshold_participation_pct: number;
  readonly intensity_cap_min: number;
  readonly pool_bounds: readonly number[];
  readonly pool_min_clubs: number;
  readonly code_cap_factor: number;
}

export type PoolKey = 'lt150' | '150_500' | 'gt500';
export const POOL_ORDER: readonly PoolKey[] = ['lt150', '150_500', 'gt500'];

/** A club link (club_membership) with its first and last linked focus day. */
export interface ClubLink {
  /** Null after the account was deleted: the link stays in the denominator (architecture §6.2). */
  userId: string | null;
  linkedFromDay: FocusDay;
  /** Last focus day the member was linked (inclusive), or null while linked. */
  linkedUntilDay: FocusDay | null;
  /** Instant (ms) the identity anchor was set (institution mail or phone), or null. */
  anchorAt: number | null;
}

/** Facts of one member day (from user_day and focus_session). */
export interface ChallengeMemberDay {
  userId: string;
  day: FocusDay;
  goalMetFinal: boolean;
  examDay: boolean;
  countedMinFinal: number;
  /** At least one completed session that was not rejected (architecture §6.2 Actief lid). */
  completedSession: boolean;
}

export interface WeekInput {
  /** Monday of the challenge week. */
  weekStart: FocusDay;
  links: readonly ClubLink[];
  days: readonly ChallengeMemberDay[];
  declaredMembers: number;
  /** Prize weeks count only members with an anchor set before the week end. */
  prizeWeek: boolean;
  /** Instant (ms) of the week end, Monday 04:00 after the week. */
  weekEndAt: number;
  /** Vacation days of the week; they are left out of the intensity denominator. */
  vacationDays?: readonly FocusDay[];
}

export interface WeekScore {
  weekStart: FocusDay;
  numerator: number;
  denominator: number;
  participationRate: number;
  intensityMin: number;
  /** Members linked at any point in the week. */
  linkedMembers: number;
  linkedAtWeekStart: number;
  activeMembers: number;
}

export function weekDays(weekStart: FocusDay): FocusDay[] {
  return dayRange(weekStart, addDays(weekStart, 6));
}

function linkedOn(l: ClubLink, day: FocusDay): boolean {
  return compareDays(l.linkedFromDay, day) <= 0 && (l.linkedUntilDay === null || compareDays(day, l.linkedUntilDay) <= 0);
}

/**
 * Participation rate and intensity of one club week (architecture §6.2):
 * numerator   = linked members with goal_met_final on ≥ 3 days of the week, only days they were
 *               linked; a joker or exam day does not count; in prize weeks only members whose
 *               anchor was set before the week end (it counts in the week of confirming too);
 * denominator = max(declared members, members linked at the start of the week);
 * intensity   = Σ min(counted_min_final, 300) over active members and their linked days, divided
 *               by active members × non-vacation days of the week.
 */
export function participationWeek(input: WeekInput, p: ChallengeParams): WeekScore {
  const days = weekDays(input.weekStart);
  const vacation = new Set(input.vacationDays ?? []);
  const byUser = new Map<string, ChallengeMemberDay[]>();
  for (const d of input.days) {
    const list = byUser.get(d.userId) ?? [];
    list.push(d);
    byUser.set(d.userId, list);
  }
  const linkedAtWeekStart = input.links.filter((l) => linkedOn(l, input.weekStart)).length;
  const inWeek = input.links.filter((l) => days.some((d) => linkedOn(l, d)));
  let numerator = 0;
  let active = 0;
  let minutes = 0;
  // A user may have several links in a week (left and rejoined); merge them per user.
  const seen = new Set<string>();
  for (const l of inWeek) {
    if (l.userId === null || seen.has(l.userId)) continue;
    seen.add(l.userId);
    const userLinks = inWeek.filter((x) => x.userId === l.userId);
    const linkedDay = (day: FocusDay) => userLinks.some((x) => linkedOn(x, day));
    const own = (byUser.get(l.userId) ?? []).filter((d) => days.includes(d.day) && linkedDay(d.day));
    const goalDays = own.filter((d) => d.goalMetFinal && !d.examDay).length;
    const anchor = userLinks.map((x) => x.anchorAt).find((a) => a !== null) ?? null;
    const anchored = !input.prizeWeek || (anchor !== null && anchor < input.weekEndAt);
    if (goalDays >= p.participation_min_goal_days && anchored) numerator += 1;
    if (own.some((d) => d.completedSession)) {
      active += 1;
      for (const d of own) if (!vacation.has(d.day)) minutes += Math.min(Math.max(d.countedMinFinal, 0), p.intensity_cap_min);
    }
  }
  const denominator = Math.max(input.declaredMembers, linkedAtWeekStart);
  const countedDays = days.filter((d) => !vacation.has(d)).length;
  return {
    weekStart: input.weekStart,
    numerator,
    denominator,
    participationRate: denominator > 0 ? numerator / denominator : 0,
    intensityMin: active > 0 && countedDays > 0 ? minutes / (active * countedDays) : 0,
    linkedMembers: inWeek.length,
    linkedAtWeekStart,
    activeMembers: active,
  };
}

/** Pool by declared members: < 150, 150–500, > 500 (spec §4.6 Poules, assumption). */
export function poolFor(declaredMembers: number, p: Pick<ChallengeParams, 'pool_bounds'>): PoolKey {
  const [low = 150, high = 500] = p.pool_bounds;
  if (declaredMembers < low) return 'lt150';
  if (declaredMembers <= high) return '150_500';
  return 'gt500';
}

/** Code cap: at most floor(1.1 × declared members) links; above it links go to the admin. */
export function codeCap(declaredMembers: number, p: Pick<ChallengeParams, 'code_cap_factor'>): number {
  return Math.floor(declaredMembers * p.code_cap_factor + 1e-9);
}

export interface RankInput {
  clubId: string;
  pool: PoolKey;
  linkedMembers: number;
  participationRate: number;
  intensityMin: number;
}

export interface RankedPool<T extends RankInput> {
  /** Label of the merged pool: the lowest original pool in it. */
  pool: PoolKey;
  members: PoolKey[];
  rows: (T & { rank: number })[];
}

/**
 * Pools with fewer than `pool_min_clubs` ranked clubs are merged with a neighbouring pool (the
 * smaller neighbour, ties to the lower one) until every pool is large enough or one is left.
 */
export function mergePools<T extends RankInput>(items: readonly T[], p: Pick<ChallengeParams, 'pool_min_clubs'>): { pool: PoolKey; members: PoolKey[]; items: T[] }[] {
  let groups = POOL_ORDER.map((k) => ({ pool: k, members: [k], items: items.filter((i) => i.pool === k) })).filter((g) => g.items.length > 0);
  for (;;) {
    if (groups.length <= 1) return groups;
    const idx = groups.findIndex((g) => g.items.length < p.pool_min_clubs);
    if (idx < 0) return groups;
    const left = idx > 0 ? groups[idx - 1] : undefined;
    const right = idx < groups.length - 1 ? groups[idx + 1] : undefined;
    const target = !left ? idx + 1 : !right ? idx - 1 : right.items.length < left.items.length ? idx + 1 : idx - 1;
    const [a, b] = [Math.min(idx, target), Math.max(idx, target)];
    const merged = { pool: groups[a]!.pool, members: [...groups[a]!.members, ...groups[b]!.members], items: [...groups[a]!.items, ...groups[b]!.items] };
    groups = [...groups.slice(0, a), merged, ...groups.slice(b + 1)];
  }
}

/**
 * Ranking per pool (architecture §6.2): only clubs with ≥ 15 linked members; by participation rate,
 * then intensity, then a shared place (1, 1, 3).
 */
export function rankPools<T extends RankInput>(items: readonly T[], p: Pick<ChallengeParams, 'min_linked_members' | 'pool_min_clubs'>): RankedPool<T>[] {
  const eligible = items.filter((i) => i.linkedMembers >= p.min_linked_members);
  return mergePools(eligible, p).map((g) => {
    const sorted = [...g.items].sort((a, b) => b.participationRate - a.participationRate || b.intensityMin - a.intensityMin || a.clubId.localeCompare(b.clubId));
    const rows: (T & { rank: number })[] = [];
    sorted.forEach((row, i) => {
      const prev = rows[i - 1];
      const tie = prev !== undefined && Math.abs(prev.participationRate - row.participationRate) < 1e-12 && Math.abs(prev.intensityMin - row.intensityMin) < 1e-12;
      rows.push({ ...row, rank: tie ? prev.rank : i + 1 });
    });
    return { pool: g.pool, members: g.members, rows };
  });
}

/** Prize-period score: mean of the participation rates of the prize weeks (spec §4.6). */
export function prizePeriodScore(weekRates: readonly number[]): number {
  if (weekRates.length === 0) return 0;
  return weekRates.reduce((a, b) => a + b, 0) / weekRates.length;
}

/** Threshold prize (spec §4.6): mean participation ≥ 25% (working hypothesis). */
export function meetsThreshold(score: number, p: Pick<ChallengeParams, 'threshold_participation_pct'>): boolean {
  return score * 100 >= p.threshold_participation_pct - 1e-9;
}

/** The two prize weeks that end on T of the calendar (Mondays T − 13 and T − 6, spec §4.6, §4.13). */
export function prizeWeeksFor(tDay: FocusDay): FocusDay[] {
  return [addDays(tDay, -13), addDays(tDay, -6)];
}

export interface PerformanceRules {
  /** Minutes per day (e.g. 120). */
  dayMinutes: number;
  /** Days that must be met; default: every day of the period. */
  requiredDays?: number;
}

/**
 * Performance challenge (spec §3.8, §4.7): a predicate over user_day of the enrolled participant;
 * fixed seats, no race. A day is met with counted_min_final ≥ dayMinutes.
 */
export function performanceProgress(
  period: { first_day: FocusDay; last_day: FocusDay },
  days: readonly { day: FocusDay; countedMinFinal: number }[],
  rules: PerformanceRules,
  today: FocusDay,
): { days: { day: FocusDay; minutes: number; met: boolean }[]; metDays: number; required: number; status: 'enrolled' | 'achieved' | 'failed' } {
  const all = dayRange(period.first_day, period.last_day);
  const byDay = new Map(days.map((d) => [d.day, d.countedMinFinal]));
  const out = all.filter((d) => compareDays(d, today) <= 0).map((d) => {
    const minutes = byDay.get(d) ?? 0;
    return { day: d, minutes, met: minutes >= rules.dayMinutes };
  });
  const required = Math.min(rules.requiredDays ?? all.length, all.length);
  const metDays = out.filter((d) => d.met).length;
  const missed = out.filter((d) => !d.met && compareDays(d.day, today) < 0).length;
  const status = metDays >= required ? 'achieved' : all.length - missed < required ? 'failed' : 'enrolled';
  return { days: out, metDays, required, status };
}

/** Seat for a new enrollment: the next free seat, or null when all seats are taken. */
export function nextSeat(taken: readonly number[], seats: number): number | null {
  const used = new Set(taken);
  for (let s = 1; s <= seats; s += 1) if (!used.has(s)) return s;
  return null;
}
