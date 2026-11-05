// core/catalog: points price, euro ceilings, budget coverage, release spread and the coverage alarm
// (spec §4.3, §5; architecture §5.2, §5.3).
import type { Params } from '../params/index.ts';
import { levelParams } from '../params/index.ts';
export * from './kinds.ts';

/** Points price = cost ÷ budget value per point, rounded to 50, at least 50 (spec §4.3). */
export function pointsPrice(params: Pick<Params, 'catalog'>, costCents: number, budgetValuePerPointCents: number): number {
  if (!(budgetValuePerPointCents > 0)) throw new RangeError('budget value per point must be positive');
  const step = params.catalog.points_price_rounding;
  return Math.max(step, Math.round(costCents / budgetValuePerPointCents / step) * step);
}

/** Item ceiling at publication (≤ €5 on level 1). */
export function itemCeilingOk(params: Params, level: number, costCents: number): boolean {
  return costCents > 0 && costCents <= levelParams(params, level).catalog_item_max_cents;
}

/** Monthly ceiling per person, catalog and individual prizes together (≤ €15 on level 1). */
export function monthCeilingOk(params: Params, level: number, spentCents: number, costCents: number): boolean {
  return spentCents + costCents <= levelParams(params, level).person_month_max_cents;
}

export interface BudgetLine {
  bookedCents: number;
  cancelledCents: number;
  rewardPct: number;
}

/** Coverable amount of one budget: (booked − cancelled) × reward_pct / 100 (architecture §3.3). */
export function coverableCents(b: BudgetLine): number {
  return Math.floor(((b.bookedCents - b.cancelledCents) * b.rewardPct) / 100);
}

/** Free budget = coverable − Σ allocations; never negative (architecture §5.3). */
export function freeCents(b: BudgetLine, allocatedCents: number): number {
  return coverableCents(b) - allocatedCents;
}

/** Whether an allocation fits: the free budget may never go negative. */
export function allocationFits(b: BudgetLine, allocatedCents: number, amountCents: number): boolean {
  return freeCents(b, allocatedCents) - amountCents >= 0;
}

/** Whether cancelling `cancelCents` keeps every allocation covered. */
export function cancelFits(b: BudgetLine, allocatedCents: number, cancelCents: number): boolean {
  return cancelCents > 0 && cancelCents <= b.bookedCents - b.cancelledCents && freeCents({ ...b, cancelledCents: b.cancelledCents + cancelCents }, allocatedCents) >= 0;
}

/**
 * Spreads a weekly stock over the days of the week (spec §4.3: daily one seventh) and reserves a
 * share for accounts with an institution anchor (working hypothesis: half). Deterministic: the
 * remainder goes to the first days, and anchor-only vouchers are spread the same way.
 */
export function spreadRelease(params: Pick<Params, 'catalog'>, total: number): { perDay: number[]; anchorPerDay: number[] } {
  const days = params.catalog.release_days_per_week;
  const split = (n: number) => Array.from({ length: days }, (_, i) => Math.floor(n / days) + (i < n % days ? 1 : 0));
  const perDay = split(total);
  const anchorTotal = Math.floor((total * params.catalog.anchor_reserved_pct) / 100);
  const anchorPerDay = split(anchorTotal).map((a, i) => Math.min(a, perDay[i] as number));
  return { perDay, anchorPerDay };
}

/** "Bijna op" only under 10% of the real weekly stock (spec §4.3). */
export function isLowStock(params: Pick<Params, 'catalog'>, left: number, weekTotal: number): boolean {
  return weekTotal > 0 && left > 0 && left * 100 < weekTotal * params.catalog.low_stock_pct;
}

/**
 * Weekly coverage alarm (spec §4.3): users past the earn-in period, times one redemption, against
 * the stock released for the coming week. Returns the shortfall in redemptions (0 = no alarm).
 */
export function coverageShortfall(eligibleUsers: number, releasedNextWeek: number, redemptionsPerWeek = 1): number {
  return Math.max(0, eligibleUsers * redemptionsPerWeek - releasedNextWeek);
}

/** A release schedule may never give less in a week once it is locked (SCHEDULE_LOCKED, architecture §5.3). */
export function scheduleChangeAllowed(locked: boolean, currentWeekTotal: number, newWeekTotal: number): boolean {
  return !locked || newWeekTotal >= currentWeekTotal;
}

/** ISO week key `YYYY-Www` of a Monday (contracts WeekKey); core week keys are the Monday date. */
export function isoWeekKey(monday: string): string {
  const [y, m, d] = monday.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  const dow = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dow); // Thursday of this ISO week
  const year = date.getUTCFullYear();
  const week = Math.ceil(((date.getTime() - Date.UTC(year, 0, 1)) / 86_400_000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** Monday date of an ISO week key `YYYY-Www`. */
export function mondayOfIsoWeek(key: string): string {
  const m = /^(\d{4})-W(\d{2})$/.exec(key);
  if (!m) throw new RangeError(`invalid ISO week ${key}`);
  const year = Number(m[1]);
  const week = Number(m[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const monday = new Date(jan4.getTime() + ((week - 1) * 7 - (dow - 1)) * 86_400_000);
  return monday.toISOString().slice(0, 10);
}
