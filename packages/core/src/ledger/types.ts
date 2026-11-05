// Ledger types (frozen layer "core-types", architecture §3.3 and §5.1). Types and constants only;
// booking rules and reconcileDay are WP-4's (core/ledger/{rules,reconcile}.ts).
//
// Sign convention: a posting amount is the change in that account's balance. Crediting a user
// account is positive, the matching debit on a system account is negative; every entry sums to 0.
import type { AgeBandValue } from '../params/index.ts';
import type { FocusDay, Instant, WeekKey } from '../time/index.ts';
import type { ReviewStatus, SessionStatus } from '../session/types.ts';

export const USER_ACCOUNT_KINDS = [
  'available_own',
  'available_referral',
  'pending_session',
  'pending_goal_budget',
  'referral_unvested',
] as const;
export type UserAccountKind = (typeof USER_ACCOUNT_KINDS)[number];

export const SYSTEM_ACCOUNT_KINDS = ['issuance', 'redeemed', 'lapsed', 'reversed', 'expired'] as const;
export type SystemAccountKind = (typeof SYSTEM_ACCOUNT_KINDS)[number];

export type AccountKind = UserAccountKind | SystemAccountKind;
/** Account reference in a rule or draft: the owning user's account of that kind, or a system account. */
export type AccountRef = `user:${UserAccountKind}` | `system:${SystemAccountKind}`;

/** Journal entry types, one per row in architecture table 5.1 (spec §4.2 mutation types). */
export const RULE_IDS = [
  'earn_session',
  'earn_topup',
  'release_flag',
  'reverse',
  'goal_bonus',
  'goal_bonus_release',
  'goal_bonus_reverse',
  'goal_budget_grant',
  'goal_budget_secure',
  'goal_budget_lapse',
  'goal_secure_reverse',
  'goal_lapse_reverse',
  'redeem',
  'redeem_refund',
  'adjust',
  'referral_pending',
  'referral_vest',
  'referral_lapse',
  'expire',
] as const;
export type RuleId = (typeof RULE_IDS)[number];
export type EntryType = RuleId;

/**
 * Accounts each rule may debit (balance goes down) and credit (balance goes up), from
 * architecture table 5.1. `null` means "by direction" (only `adjust`, which needs a reason code).
 */
export const RULE_ACCOUNTS: Readonly<Record<RuleId, { readonly debit: readonly AccountRef[]; readonly credit: readonly AccountRef[] } | null>> = {
  earn_session: { debit: ['system:issuance'], credit: ['user:available_own', 'user:pending_session'] },
  earn_topup: { debit: ['system:issuance'], credit: ['user:available_own', 'user:pending_session'] },
  release_flag: { debit: ['user:pending_session'], credit: ['user:available_own'] },
  reverse: { debit: ['user:pending_session', 'user:available_own'], credit: ['system:reversed'] },
  goal_bonus: { debit: ['system:issuance'], credit: ['user:available_own', 'user:pending_session'] },
  goal_bonus_release: { debit: ['user:pending_session'], credit: ['user:available_own'] },
  goal_bonus_reverse: { debit: ['user:available_own', 'user:pending_session'], credit: ['system:reversed'] },
  goal_budget_grant: { debit: ['system:issuance'], credit: ['user:pending_goal_budget'] },
  goal_budget_secure: { debit: ['user:pending_goal_budget'], credit: ['user:available_own'] },
  goal_budget_lapse: { debit: ['user:pending_goal_budget'], credit: ['system:lapsed'] },
  goal_secure_reverse: { debit: ['user:available_own'], credit: ['system:reversed'] },
  goal_lapse_reverse: { debit: ['system:lapsed'], credit: ['user:available_own'] },
  redeem: { debit: ['user:available_own', 'user:available_referral'], credit: ['system:redeemed'] },
  redeem_refund: { debit: ['system:redeemed'], credit: ['user:available_own', 'user:available_referral'] },
  adjust: null,
  referral_pending: { debit: ['system:issuance'], credit: ['user:referral_unvested'] },
  referral_vest: { debit: ['user:referral_unvested'], credit: ['user:available_referral'] },
  referral_lapse: { debit: ['user:referral_unvested'], credit: ['system:lapsed'] },
  // Expire zeroes every user balance. A negative balance (allowed after a reversal, spec §4.2) is
  // zeroed by the opposite line, so both sides may hold user accounts and system:expired.
  expire: {
    debit: ['user:available_own', 'user:available_referral', 'user:pending_session', 'user:pending_goal_budget', 'user:referral_unvested', 'system:expired'],
    credit: ['system:expired', 'user:available_own', 'user:available_referral', 'user:pending_session', 'user:pending_goal_budget', 'user:referral_unvested'],
  },
};

/** Status labels the app shows for points (spec §4.2). Derived from the account, never stored. */
export const POINT_STATUSES = ['pending', 'available', 'not_yet_free', 'redeemed', 'expired', 'reversed'] as const;
export type PointStatus = (typeof POINT_STATUSES)[number];

export const REF_TYPES = ['session', 'user_day', 'week', 'redemption', 'referral', 'appeal', 'admin_action', 'account'] as const;
export type RefType = (typeof REF_TYPES)[number];

export const CAUSE_TYPES = ['flag', 'decision', 'appeal', 'restore'] as const;
export type CauseType = (typeof CAUSE_TYPES)[number];

/** Who booked: the system, or an admin (opaque reference, never a raw user id in logs). */
export type Actor = 'system' | `admin:${string}`;

export const EXPIRE_REASONS = ['account_deleted', 'inactivity'] as const;
export type ExpireReason = (typeof EXPIRE_REASONS)[number];

/** Experiment arms (architecture §3.4, §3.5). */
export type BonusArm = 'A' | 'B';
export type BelofteArm = 'early' | 'late';
export type RestArm = 'rest' | 'continue';
export type PromptArm = 'strong' | 'standard';
/** Whether earn_session is booked on a day (architecture §5.1 `earnArm`). */
export type EarnArm = 'earn' | 'rest';
export type AgeBand = AgeBandValue;

/** What triggered a reconcileDay run (architecture §5.1). */
export type Cause =
  | { type: 'session_end'; sessionId: string }
  | { type: 'flag_decision'; flagId: string }
  | { type: 'restore'; sessionId: string }
  | { type: 'appeal'; appealId: string }
  | { type: 'day_close' };
export type CauseKind = Cause['type'];

/** One line of a draft entry. Amount ≠ 0; sign per the convention at the top of this file. */
export interface PostingDraft {
  account: AccountRef;
  amount: number;
}

/** A journal entry before it is written (architecture §3.3 `journal_entry`). */
export interface JournalEntryDraft {
  type: RuleId;
  idempotencyKey: string;
  refType: RefType;
  refId: string;
  causeType?: CauseType;
  causeId?: string;
  focusDay?: FocusDay;
  reasonCode?: string;
  actor: Actor;
  arm?: BonusArm;
  paramVersion: number;
  postings: readonly PostingDraft[];
}

/** A stored posting (architecture §3.3 `posting`). `accountId` is the ledger_account id. */
export interface Posting {
  id: string;
  entryId: string;
  accountId: string;
  amount: number;
}

/** A stored journal entry. It refers to an account set, never to a user (architecture §3.3). */
export interface Entry extends Omit<JournalEntryDraft, 'postings'> {
  id: string;
  accountSet: string;
  createdAt: Instant;
  postings: readonly Posting[];
}
export type JournalEntry = Entry;

/** Balances as the app shows them (architecture §5.1, spec §3.4): derived, never stored. */
export interface Balances {
  /** available_own + available_referral; may be negative after a reversal (spec §4.2). */
  available: number;
  /** pending_session + pending_goal_budget. */
  pending: number;
  /** referral_unvested. */
  referralUnvested: number;
  byKind: Readonly<Record<UserAccountKind, number>>;
}

/** Goal state of a user day (architecture §3.4 `user_day.goal_state`). */
export const GOAL_STATES = ['none', 'pending', 'available', 'secured', 'lapsed', 'postponed', 'exam'] as const;
export type GoalState = (typeof GOAL_STATES)[number];

/** One `user_day` row (architecture §3.4). Written only through UserDayRepository. */
export interface UserDay {
  userId: string;
  focusDay: FocusDay;
  rev: number;
  verifiedMin: number;
  countedMin: number;
  countedMinFinal: number;
  goalMin: number;
  goalMet: boolean;
  goalMetFinal: boolean;
  goalBonusEligible: boolean;
  examDay: boolean;
  goalState: GoalState;
  jokerUsed: boolean;
  vacation: boolean;
  closedAt: Instant | null;
}
/** What reconcileDay proposes for the user_day row; the repository assigns `rev` and `closedAt`. */
export type UserDayDraft = Omit<UserDay, 'rev' | 'closedAt'>;

/** A session as reconcileDay sees it (architecture §5.1 `DaySession`). */
export interface DaySession {
  sessionId: string;
  serverStartAt: Instant;
  status: SessionStatus;
  reviewStatus: ReviewStatus;
  verifiedMin: number;
  lateStart: boolean;
  isPractice: boolean;
  /** Open flags on this session; points sit in pending_session until all are released. */
  openFlagIds: readonly string[];
}

/** What the journal currently holds for one day (architecture §5.1 `BookedDay`). */
export interface BookedDay {
  /** Per session: points on available_own and pending_session from earn, topup, release and reverse. */
  sessions: Readonly<Record<string, { readonly available: number; readonly pending: number }>>;
  /** Goal bonus (arm A) or secured/lapsed budget (arm B) for this day. */
  goal: { readonly available: number; readonly pending: number; readonly lapsed: number };
  /** Idempotency keys already present, so a repeat yields no entries. */
  keys: readonly string[];
}

/** Params slice reconcileDay needs: daily cap and night rule (architecture §5.1 `LedgerParams`). */
export interface LedgerParams {
  dailyCapMin: number;
  pointsPerVerifiedMin: number;
  goalBonusPoints: number;
  paramVersion: number;
}

/** Input of reconcileDay (architecture §5.1). */
export interface ReconcileDayInput {
  userId: string;
  day: FocusDay;
  week: WeekKey;
  arm: BonusArm | null;
  inSeason: boolean;
  goalMin: number;
  sessions: readonly DaySession[];
  booked: BookedDay;
  cause: Cause;
  rev: number;
  params: LedgerParams;
  examDay: boolean;
  earnArm: EarnArm;
}

export interface ReconcileDayResult {
  userDay: UserDayDraft;
  entries: readonly JournalEntryDraft[];
}
