// Booking rules as data (architecture table 5.1): idempotency keys and posting builders.
// Sign convention (ledger/types.ts): a posting is the change of that account's balance.
import type { FocusDay, WeekKey } from '../time/index.ts';
import { RULE_ACCOUNTS, USER_ACCOUNT_KINDS } from './types.ts';
import type { AccountRef, Balances, JournalEntryDraft, PostingDraft, RuleId, UserAccountKind } from './types.ts';

/** Deterministic idempotency keys, one per row of table 5.1. */
export const keys = {
  earn: (sessionId: string) => `earn:${sessionId}`,
  earnTopup: (sessionId: string, rev: number) => `earn_topup:${sessionId}:r${rev}`,
  release: (flagRef: string, sessionId: string) => `release:${flagRef}:${sessionId}`,
  reverse: (flagRef: string, sessionId: string) => `reverse:${flagRef}:${sessionId}`,
  goalBonus: (userId: string, day: FocusDay, rev?: number) => (rev === undefined ? `goal_bonus:${userId}:${day}` : `goal_bonus:${userId}:${day}:r${rev}`),
  goalBonusRelease: (userId: string, day: FocusDay, rev: number) => `goal_bonus_release:${userId}:${day}:r${rev}`,
  goalBonusReverse: (userId: string, day: FocusDay, rev: number) => `goal_bonus_reverse:${userId}:${day}:r${rev}`,
  goalGrant: (userId: string, week: WeekKey) => `goal_grant:${userId}:${week}`,
  goalSecure: (userId: string, day: FocusDay, rev?: number) => (rev === undefined ? `goal_secure:${userId}:${day}` : `goal_secure:${userId}:${day}:r${rev}`),
  goalLapse: (userId: string, day: FocusDay, rev?: number) => (rev === undefined ? `goal_lapse:${userId}:${day}` : `goal_lapse:${userId}:${day}:r${rev}`),
  goalSecureReverse: (userId: string, day: FocusDay, rev: number) => `goal_secure_reverse:${userId}:${day}:r${rev}`,
  goalLapseReverse: (userId: string, day: FocusDay, rev: number) => `goal_lapse_reverse:${userId}:${day}:r${rev}`,
  redeem: (redemptionId: string) => `redeem:${redemptionId}`,
  redeemRefund: (redemptionId: string) => `redeem_refund:${redemptionId}`,
  adjust: (ref: string) => `adjust:${ref}`,
  expire: (accountSet: string, reason: string, date: string) => `expire:${accountSet}:${reason}:${date}`,
} as const;

/** Goal entry types whose amounts belong to one user day (the weekly grant belongs to a week). */
export const GOAL_DAY_RULES: readonly RuleId[] = [
  'goal_bonus',
  'goal_bonus_release',
  'goal_bonus_reverse',
  'goal_budget_secure',
  'goal_budget_lapse',
  'goal_secure_reverse',
  'goal_lapse_reverse',
];

/** Session entry types (ref_type = session). */
export const SESSION_RULES: readonly RuleId[] = ['earn_session', 'earn_topup', 'release_flag', 'reverse'];

/** Credits `amount` from `from` to `to`: from goes down, to goes up. */
export function transfer(from: AccountRef, to: AccountRef, amount: number): PostingDraft[] {
  return [
    { account: from, amount: -amount },
    { account: to, amount },
  ];
}

/** Whether the postings respect the rule's account table and sum to zero (pure twin of assertValidDraft). */
export function isValidPosting(rule: RuleId, postings: readonly PostingDraft[]): boolean {
  if (postings.length < 2) return false;
  const allowed = RULE_ACCOUNTS[rule];
  let sum = 0;
  let debit = false;
  let credit = false;
  for (const p of postings) {
    if (!Number.isSafeInteger(p.amount) || p.amount === 0) return false;
    sum += p.amount;
    if (p.amount < 0) debit = true;
    else credit = true;
    if (allowed && !(p.amount < 0 ? allowed.debit : allowed.credit).includes(p.account)) return false;
  }
  return sum === 0 && debit && credit;
}

/** Sum of postings per user account kind over drafts (balances are derived, spec §4.2). */
export function balancesOf(entries: readonly Pick<JournalEntryDraft, 'postings'>[]): Balances {
  const byKind = Object.fromEntries(USER_ACCOUNT_KINDS.map((k) => [k, 0])) as Record<UserAccountKind, number>;
  for (const e of entries) {
    for (const p of e.postings) {
      if (p.account.startsWith('user:')) byKind[p.account.slice(5) as UserAccountKind] += p.amount;
    }
  }
  return {
    available: byKind.available_own + byKind.available_referral,
    pending: byKind.pending_session + byKind.pending_goal_budget,
    referralUnvested: byKind.referral_unvested,
    byKind,
  };
}

/**
 * Split of a points price over available_own and available_referral: at most
 * floor(price × maxSharePct / 100) from referral points (spec §4.9, architecture §5.2).
 */
export function redeemSplit(price: number, own: number, referral: number, maxSharePct: number): { own: number; referral: number } | 'INSUFFICIENT_POINTS' | 'REFERRAL_SHARE_EXCEEDED' {
  const maxReferral = Math.floor((price * maxSharePct) / 100);
  const fromReferral = Math.max(0, Math.min(referral, maxReferral, price));
  const fromOwn = price - fromReferral;
  if (fromOwn <= own) return { own: fromOwn, referral: fromReferral };
  if (own + referral >= price) return 'REFERRAL_SHARE_EXCEEDED';
  return 'INSUFFICIENT_POINTS';
}
