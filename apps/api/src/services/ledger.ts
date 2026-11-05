// LedgerService: frozen interface between API modules (architecture §12.2), owner WP-4.
// The real implementation lives in modules/points; this file holds the interface, its types and an
// in-memory fake that enforces the same invariants (zero sum, unique idempotency keys, rule accounts).
import { PARAMS_V1 } from '@rewarded/core/params';
import type { FocusDay, Instant } from '@rewarded/core/time';
// Core-type files are re-exported from core/{ledger,session}/index.ts by WP-4; until then, import directly.
import { RULE_ACCOUNTS, USER_ACCOUNT_KINDS } from '../../../../packages/core/src/ledger/types.ts';
import type {
  AccountRef,
  Actor,
  Balances,
  BonusArm,
  Cause,
  CauseType,
  Entry,
  ExpireReason,
  JournalEntryDraft,
  Posting,
  PostingDraft,
  RefType,
  RuleId,
  UserAccountKind,
} from '../../../../packages/core/src/ledger/types.ts';
import type { Db } from '../db/types.ts';

export type { AccountRef, Actor, Balances, Cause, Entry, ExpireReason, JournalEntryDraft, Posting, PostingDraft, RuleId };

/**
 * Transaction handle. Services are called inside `db.transaction(() => …)` with the same Db, so the
 * booking commits or rolls back together with the change that caused it (architecture §5.1).
 */
export type Tx = Db;

/** Everything `post` needs besides the rule and the key. Postings follow the sign convention in core. */
export interface PostArgs {
  userId: string;
  postings: readonly PostingDraft[];
  refType: RefType;
  refId: string;
  causeType?: CauseType;
  causeId?: string;
  focusDay?: FocusDay;
  /** Required for `adjust` and `expire` (architecture §5.1). */
  reasonCode?: string;
  actor: Actor;
  arm?: BonusArm;
}

export interface PostResult {
  entry: Entry;
  /** false when the key already existed with the same content: the booking counts as "already done". */
  created: boolean;
}

export interface LedgerService {
  /** Writes one journal entry. Same key and same content → `{ created: false }`; same key, other content → error. */
  post(tx: Tx, rule: RuleId, key: string, args: PostArgs): PostResult;
  /** Recomputes one user day with core reconcileDay and books the difference. Returns the new entries. */
  reconcileDay(tx: Tx, userId: string, day: FocusDay, cause: Cause): Entry[];
  /** Derived balances; never stored (spec §4.2). */
  balances(userId: string): Balances;
  /** Books every non-zero user balance to system:expired (account deletion, architecture §5.2). */
  expireAll(tx: Tx, userId: string, reason: ExpireReason): Entry | null;
}

export const LEDGER_ERROR_CODES = [
  'ZERO_SUM',
  'ZERO_AMOUNT',
  'ONE_SIDED',
  'ACCOUNT_NOT_ALLOWED',
  'KEY_CONFLICT',
  'EMPTY_KEY',
  'REASON_REQUIRED',
] as const;
export type LedgerErrorCode = (typeof LEDGER_ERROR_CODES)[number];

/** Invariant violation. Never caught to "fix" a booking: the transaction must roll back. */
export class LedgerInvariantError extends Error {
  readonly code: LedgerErrorCode;
  constructor(code: LedgerErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = 'LedgerInvariantError';
    this.code = code;
  }
}

/**
 * Checks a draft against the ledger invariants (architecture §3.3, §5.1). Shared by the fake and
 * available to the real implementation, so both reject exactly the same drafts.
 */
export function assertValidDraft(rule: RuleId, key: string, postings: readonly PostingDraft[], reasonCode?: string): void {
  if (key.length === 0) throw new LedgerInvariantError('EMPTY_KEY', 'idempotency key is empty');
  if (postings.length < 2) throw new LedgerInvariantError('ONE_SIDED', `${key}: needs at least two postings`);
  let sum = 0;
  let hasDebit = false;
  let hasCredit = false;
  const allowed = RULE_ACCOUNTS[rule];
  for (const p of postings) {
    if (!Number.isSafeInteger(p.amount) || p.amount === 0) throw new LedgerInvariantError('ZERO_AMOUNT', `${key}: amount must be a non-zero integer`);
    sum += p.amount;
    if (p.amount < 0) hasDebit = true;
    else hasCredit = true;
    if (allowed) {
      const side = p.amount < 0 ? allowed.debit : allowed.credit;
      if (!side.includes(p.account)) {
        throw new LedgerInvariantError('ACCOUNT_NOT_ALLOWED', `${key}: ${rule} may not ${p.amount < 0 ? 'debit' : 'credit'} ${p.account}`);
      }
    }
  }
  if (sum !== 0) throw new LedgerInvariantError('ZERO_SUM', `${key}: postings sum to ${sum}`);
  if (!hasDebit || !hasCredit) throw new LedgerInvariantError('ONE_SIDED', `${key}: needs a debit and a credit`);
  if ((rule === 'adjust' || rule === 'expire') && !reasonCode) throw new LedgerInvariantError('REASON_REQUIRED', `${key}: ${rule} needs a reason code`);
}

/** Balances from per-kind sums. */
export function balancesFromKinds(byKind: Readonly<Record<UserAccountKind, number>>): Balances {
  return {
    available: byKind.available_own + byKind.available_referral,
    pending: byKind.pending_session + byKind.pending_goal_budget,
    referralUnvested: byKind.referral_unvested,
    byKind,
  };
}

/** Computes the entries reconcileDay should book. The fake has no real reconciler until WP-4 ships one. */
export type FakeReconciler = (userId: string, day: FocusDay, cause: Cause) => readonly (Omit<JournalEntryDraft, 'paramVersion'> & { paramVersion?: number })[];

export interface FakeLedgerOptions {
  /** Time source for `createdAt`; defaults to 0 so tests stay deterministic. */
  now?: () => Instant;
  reconciler?: FakeReconciler;
  paramVersion?: number;
}

/** Throws on any use: fakes ignore the transaction handle, and tests can pass this one. */
export function fakeTx(): Tx {
  const fail = (): never => {
    throw new Error('fakeTx is a placeholder and cannot run SQL');
  };
  return { driver: 'node:sqlite', exec: fail, run: fail, get: fail, all: fail, transaction: <T>(fn: () => T): T => fn(), close: fail };
}

/** In-memory LedgerService with the same invariants as the real one (architecture §12.2). */
export class FakeLedgerService implements LedgerService {
  private readonly entriesByKey = new Map<string, Entry>();
  private readonly order: Entry[] = [];
  /** account id per (accountSet, kind); system accounts are `system:<kind>`. */
  private readonly accountSets = new Map<string, string>();
  private nextId = 1;
  private readonly now: () => Instant;
  private readonly reconciler: FakeReconciler;
  private readonly paramVersion: number;

  constructor(options: FakeLedgerOptions = {}) {
    this.now = options.now ?? (() => 0);
    this.reconciler = options.reconciler ?? (() => []);
    this.paramVersion = options.paramVersion ?? PARAMS_V1.version;
  }

  private accountSetOf(userId: string): string {
    let set = this.accountSets.get(userId);
    if (!set) {
      set = `set${this.nextId++}`;
      this.accountSets.set(userId, set);
    }
    return set;
  }

  private accountId(userId: string, ref: AccountRef): string {
    return ref.startsWith('system:') ? ref : `${this.accountSetOf(userId)}:${ref.slice('user:'.length)}`;
  }

  post(_tx: Tx, rule: RuleId, key: string, args: PostArgs): PostResult {
    assertValidDraft(rule, key, args.postings, args.reasonCode);
    const accountSet = this.accountSetOf(args.userId);
    const existing = this.entriesByKey.get(key);
    if (existing) {
      if (!this.sameContent(existing, rule, accountSet, args)) {
        throw new LedgerInvariantError('KEY_CONFLICT', `${key}: key exists with different content`);
      }
      return { entry: existing, created: false };
    }
    const id = `e${this.nextId++}`;
    const postings: Posting[] = args.postings.map((p, i) => ({ id: `${id}.${i}`, entryId: id, accountId: this.accountId(args.userId, p.account), amount: p.amount }));
    const entry: Entry = {
      id,
      type: rule,
      idempotencyKey: key,
      accountSet,
      refType: args.refType,
      refId: args.refId,
      ...(args.causeType !== undefined ? { causeType: args.causeType } : {}),
      ...(args.causeId !== undefined ? { causeId: args.causeId } : {}),
      ...(args.focusDay !== undefined ? { focusDay: args.focusDay } : {}),
      ...(args.reasonCode !== undefined ? { reasonCode: args.reasonCode } : {}),
      ...(args.arm !== undefined ? { arm: args.arm } : {}),
      actor: args.actor,
      paramVersion: this.paramVersion,
      createdAt: this.now(),
      postings: Object.freeze(postings),
    };
    Object.freeze(entry);
    this.entriesByKey.set(key, entry);
    this.order.push(entry);
    return { entry, created: true };
  }

  private sameContent(e: Entry, rule: RuleId, accountSet: string, args: PostArgs): boolean {
    if (e.type !== rule || e.accountSet !== accountSet || e.refType !== args.refType || e.refId !== args.refId) return false;
    if (e.postings.length !== args.postings.length) return false;
    return args.postings.every((p, i) => {
      const q = e.postings[i];
      return q !== undefined && q.amount === p.amount && q.accountId === this.accountId(args.userId, p.account);
    });
  }

  reconcileDay(tx: Tx, userId: string, day: FocusDay, cause: Cause): Entry[] {
    const out: Entry[] = [];
    for (const draft of this.reconciler(userId, day, cause)) {
      const res = this.post(tx, draft.type, draft.idempotencyKey, {
        userId,
        postings: draft.postings,
        refType: draft.refType,
        refId: draft.refId,
        actor: draft.actor,
        focusDay: draft.focusDay ?? day,
        ...(draft.causeType !== undefined ? { causeType: draft.causeType } : {}),
        ...(draft.causeId !== undefined ? { causeId: draft.causeId } : {}),
        ...(draft.reasonCode !== undefined ? { reasonCode: draft.reasonCode } : {}),
        ...(draft.arm !== undefined ? { arm: draft.arm } : {}),
      });
      if (res.created) out.push(res.entry);
    }
    return out;
  }

  balances(userId: string): Balances {
    const set = this.accountSets.get(userId);
    const byKind = Object.fromEntries(USER_ACCOUNT_KINDS.map((k) => [k, 0])) as Record<UserAccountKind, number>;
    if (!set) return balancesFromKinds(byKind);
    for (const e of this.order) {
      for (const p of e.postings) {
        const [s, kind] = splitAccountId(p.accountId);
        if (s === set && kind) byKind[kind] += p.amount;
      }
    }
    return balancesFromKinds(byKind);
  }

  expireAll(tx: Tx, userId: string, reason: ExpireReason): Entry | null {
    const { byKind } = this.balances(userId);
    const postings: PostingDraft[] = [];
    let total = 0;
    for (const kind of USER_ACCOUNT_KINDS) {
      const amount = byKind[kind];
      if (amount !== 0) {
        postings.push({ account: `user:${kind}`, amount: -amount });
        total += amount;
      }
    }
    if (postings.length === 0) return null;
    if (total !== 0) postings.push({ account: 'system:expired', amount: total });
    const set = this.accountSetOf(userId);
    const date = new Date(this.now()).toISOString().slice(0, 10);
    return this.post(tx, 'expire', `expire:${set}:${reason}:${date}`, {
      userId,
      postings,
      refType: 'account',
      refId: set,
      reasonCode: reason,
      actor: 'system',
    }).entry;
  }

  // Test helpers (not part of the interface).

  entries(): readonly Entry[] {
    return this.order;
  }

  /** Nightly check 1 (architecture §5.5): ids of entries whose postings do not sum to zero. */
  unbalancedEntryIds(): string[] {
    return this.order.filter((e) => e.postings.reduce((s, p) => s + p.amount, 0) !== 0).map((e) => e.id);
  }

  /** Sum over all postings of all accounts; always 0 when every entry is balanced. */
  totalSum(): number {
    return this.order.reduce((s, e) => s + e.postings.reduce((t, p) => t + p.amount, 0), 0);
  }

  systemBalance(kind: AccountRef & `system:${string}`): number {
    return this.order.reduce((s, e) => s + e.postings.filter((p) => p.accountId === kind).reduce((t, p) => t + p.amount, 0), 0);
  }
}

function splitAccountId(accountId: string): [string, UserAccountKind | undefined] {
  const i = accountId.indexOf(':');
  const set = accountId.slice(0, i);
  const kind = accountId.slice(i + 1);
  return [set, (USER_ACCOUNT_KINDS as readonly string[]).includes(kind) ? (kind as UserAccountKind) : undefined];
}
