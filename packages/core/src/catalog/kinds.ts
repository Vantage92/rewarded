// Reward kinds per verification level (architecture §5.3, §4.6). Money and freely spendable credit
// do not exist as a kind: there is no value for them and no way to create one.
import type { Params } from '../params/index.ts';
import { levelParams, REWARD_KINDS } from '../params/index.ts';
import type { RewardKindValue } from '../params/index.ts';

/** Kinds that are excluded on every level of the web MVP (spec §4.3 "geen geld of vrij besteedbaar tegoed"). */
export const EXCLUDED_KINDS = ['store_credit', 'gift_card_open', 'cash_equivalent', 'cash', 'voucher_open'] as const;

export function isRewardKind(value: string): value is RewardKindValue {
  return (REWARD_KINDS as readonly string[]).includes(value);
}

/** Whether a kind may be published on this verification level. */
export function isKindAllowed(params: Params, level: number, kind: string): boolean {
  const lp = levelParams(params, level);
  if (lp.cash_allowed === false && (EXCLUDED_KINDS as readonly string[]).includes(kind)) return false;
  return isRewardKind(kind) && (lp.allowed_reward_kinds as readonly string[]).includes(kind);
}
