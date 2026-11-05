// Client-side view of the redemption rules (spec §3.4, §4.3; UX §3.6 B1/B2, §6.2). The server
// decides in one transaction; these helpers only choose the copy and disable buttons with a reason.
import type { BalanceResponse, CatalogItem } from '@rewarded/contracts';
import { TIME_ZONE } from '../../i18n/index.tsx';

export type RedeemGate =
  | { kind: 'earn_in'; minutes: number }
  | { kind: 'hold'; from: string }
  | { kind: 'weekly' }
  | null;

/** Account-wide reason why no item can be redeemed right now, in the order of the server checks. */
export function redeemGate(balance: BalanceResponse, now: number): RedeemGate {
  if (balance.earn_in_min < balance.earn_in_required) return { kind: 'earn_in', minutes: balance.earn_in_required - balance.earn_in_min };
  if (balance.first_redeem_after && Date.parse(balance.first_redeem_after) > now) return { kind: 'hold', from: balance.first_redeem_after };
  if (balance.next_redeem_from && Date.parse(balance.next_redeem_from) > now) return { kind: 'weekly' };
  return null;
}

export type ItemBlock = { kind: 'sold_out_today' } | { kind: 'sold_out_week' } | { kind: 'not_enough'; available: number; price: number } | null;

/** Per-item reason (stock, balance) once the account may redeem. */
export function itemBlock(item: CatalogItem, balance: BalanceResponse): ItemBlock {
  if (item.stock_today === 0) return item.next_release ? { kind: 'sold_out_today' } : { kind: 'sold_out_week' };
  if (balance.available < item.points_price) return { kind: 'not_enough', available: balance.available, price: item.points_price };
  return null;
}

/** Collective and symbolic rewards first (UX §3.6 B1), then by price. */
export function sortCatalog(items: readonly CatalogItem[]): CatalogItem[] {
  return [...items].sort((a, b) => Number(b.collective) - Number(a.collective) || a.points_price - b.points_price);
}

/** First day of the next calendar month in Europe/Amsterdam, as an ISO date (monthly cap copy). */
export function nextMonthStart(now: number): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit' }).formatToParts(new Date(now));
  const year = Number(parts.find((p) => p.type === 'year')!.value);
  const month = Number(parts.find((p) => p.type === 'month')!.value);
  const y = month === 12 ? year + 1 : year;
  const m = month === 12 ? 1 : month + 1;
  return `${y}-${String(m).padStart(2, '0')}-01`;
}
