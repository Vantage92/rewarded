// SQL LedgerService (architecture §5.1, §12.2): double-entry journal with unique keys, derived
// balances and reconcileDay. Every booking runs inside the caller's transaction.
import { createHash } from 'node:crypto';
import { CURRENT_PARAMS, addDays, compareDays, focusDayOf, weekKey } from '@rewarded/core';
import { armBWeeklyGrant } from '@rewarded/core/goals';
import { isoWeekKey } from '@rewarded/core/catalog';
import {
  USER_ACCOUNT_KINDS,
  bookedDayFrom,
  keys,
  reconcileDay as coreReconcileDay,
  type AccountRef,
  type DaySession,
  type JournalEntryDraft,
  type UserAccountKind,
} from '@rewarded/core/ledger';
import type { FocusDay } from '@rewarded/core/time';
import { idsFor } from '../../db/ids.ts';
import type { Db } from '../../db/types.ts';
import type { ModuleDeps } from '../../module.ts';
import {
  LedgerInvariantError,
  assertValidDraft,
  balancesFromKinds,
  type Balances,
  type Cause,
  type Entry,
  type ExpireReason,
  type LedgerService,
  type PostArgs,
  type PostResult,
  type RuleId,
  type Tx,
} from '../../services/ledger.ts';

interface EntryRow {
  id: string;
  type: RuleId;
  idempotency_key: string;
  account_set: string;
  ref_type: JournalEntryDraft['refType'];
  ref_id: string;
  cause_type: JournalEntryDraft['causeType'] | null;
  cause_id: string | null;
  focus_day: string | null;
  reason_code: string | null;
  actor: JournalEntryDraft['actor'];
  arm: 'A' | 'B' | null;
  param_version: number;
  created_at: number;
  content_hash: string;
}

const GOAL_EVENT_TYPES = new Set<RuleId>(['goal_bonus', 'goal_bonus_release', 'goal_bonus_reverse', 'goal_budget_grant', 'goal_budget_secure', 'goal_budget_lapse', 'goal_secure_reverse', 'goal_lapse_reverse']);

function contentHash(rule: RuleId, accountSet: string, args: PostArgs): string {
  const body = JSON.stringify([rule, accountSet, args.refType, args.refId, args.postings.map((p) => [p.account, p.amount])]);
  return createHash('sha256').update(body).digest('hex');
}

export class SqlLedgerService implements LedgerService {
  private readonly ids;
  private readonly deps: ModuleDeps;
  constructor(deps: ModuleDeps) {
    this.deps = deps;
    this.ids = idsFor(deps.platform);
  }

  private get db(): Db {
    return this.deps.db;
  }

  /** Account set of a user; created on first use (five user accounts, one owner row each). */
  accountSet(tx: Db, userId: string, create = true): string | null {
    const row = tx.get<{ account_set: string }>(
      'SELECT a.account_set FROM ledger_account_owner o JOIN ledger_account a ON a.id = o.account_id WHERE o.user_id = ? LIMIT 1',
      [userId],
    );
    if (row) return row.account_set;
    if (!create) return null;
    const set = this.ids.ulid();
    for (const kind of USER_ACCOUNT_KINDS) {
      const id = this.ids.ulid();
      tx.run("INSERT INTO ledger_account (id, owner_type, kind, account_set) VALUES (?, 'user', ?, ?)", [id, kind, set]);
      tx.run('INSERT INTO ledger_account_owner (account_id, user_id, kind) VALUES (?, ?, ?)', [id, userId, kind]);
    }
    return set;
  }

  private accountIds(tx: Db, set: string): Map<UserAccountKind, string> {
    const rows = tx.all<{ id: string; kind: UserAccountKind }>("SELECT id, kind FROM ledger_account WHERE owner_type = 'user' AND account_set = ?", [set]);
    return new Map(rows.map((r) => [r.kind, r.id]));
  }

  private loadEntry(tx: Db, row: EntryRow): Entry {
    const postings = tx.all<{ id: string; entry_id: string; account_id: string; amount: number }>('SELECT id, entry_id, account_id, amount FROM posting WHERE entry_id = ? ORDER BY id', [row.id]);
    return {
      id: row.id,
      type: row.type,
      idempotencyKey: row.idempotency_key,
      accountSet: row.account_set,
      refType: row.ref_type,
      refId: row.ref_id,
      ...(row.cause_type ? { causeType: row.cause_type } : {}),
      ...(row.cause_id ? { causeId: row.cause_id } : {}),
      ...(row.focus_day ? { focusDay: row.focus_day } : {}),
      ...(row.reason_code ? { reasonCode: row.reason_code } : {}),
      ...(row.arm ? { arm: row.arm } : {}),
      actor: row.actor,
      paramVersion: row.param_version,
      createdAt: row.created_at,
      postings: postings.map((p) => ({ id: p.id, entryId: p.entry_id, accountId: p.account_id, amount: p.amount })),
    };
  }

  post(tx: Tx, rule: RuleId, key: string, args: PostArgs): PostResult {
    assertValidDraft(rule, key, args.postings, args.reasonCode);
    const set = this.accountSet(tx, args.userId) as string;
    const hash = contentHash(rule, set, args);
    const existing = tx.get<EntryRow>('SELECT * FROM journal_entry WHERE idempotency_key = ?', [key]);
    if (existing) {
      if (existing.content_hash !== hash) throw new LedgerInvariantError('KEY_CONFLICT', `${key}: key exists with different content`);
      return { entry: this.loadEntry(tx, existing), created: false };
    }
    const accounts = this.accountIds(tx, set);
    const id = this.ids.ulid();
    const now = this.deps.platform.clock.now().getTime();
    tx.run(
      `INSERT INTO journal_entry (id, type, idempotency_key, account_set, ref_type, ref_id, cause_type, cause_id, focus_day, reason_code, actor, arm, param_version, created_at, content_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, rule, key, set, args.refType, args.refId, args.causeType ?? null, args.causeId ?? null, args.focusDay ?? null, args.reasonCode ?? null, args.actor, args.arm ?? null, CURRENT_PARAMS.version, now, hash],
    );
    args.postings.forEach((p, i) => {
      const accountId = p.account.startsWith('system:') ? p.account : accounts.get(p.account.slice(5) as UserAccountKind);
      if (!accountId) throw new LedgerInvariantError('ACCOUNT_NOT_ALLOWED', `${key}: unknown account ${p.account}`);
      tx.run('INSERT INTO posting (id, entry_id, account_id, amount) VALUES (?, ?, ?, ?)', [`${id}.${i}`, id, accountId, p.amount]);
    });
    return { entry: this.loadEntry(tx, tx.get<EntryRow>('SELECT * FROM journal_entry WHERE id = ?', [id]) as EntryRow), created: true };
  }

  balances(userId: string): Balances {
    return this.balancesIn(this.db, userId);
  }

  balancesIn(tx: Db, userId: string): Balances {
    const byKind = Object.fromEntries(USER_ACCOUNT_KINDS.map((k) => [k, 0])) as Record<UserAccountKind, number>;
    const rows = tx.all<{ kind: UserAccountKind; total: number }>(
      'SELECT o.kind AS kind, COALESCE(SUM(p.amount), 0) AS total FROM ledger_account_owner o LEFT JOIN posting p ON p.account_id = o.account_id WHERE o.user_id = ? GROUP BY o.kind',
      [userId],
    );
    for (const r of rows) byKind[r.kind] = Number(r.total);
    return balancesFromKinds(byKind);
  }

  /** Entries of one account set and focus day as drafts with account refs (input of BookedDay). */
  private dayDrafts(tx: Db, set: string, day: FocusDay): JournalEntryDraft[] {
    const entries = tx.all<EntryRow>('SELECT * FROM journal_entry WHERE account_set = ? AND focus_day = ? ORDER BY created_at, id', [set, day]);
    return entries.map((e) => {
      const postings = tx.all<{ amount: number; owner_type: string; kind: string }>(
        'SELECT p.amount, a.owner_type, a.kind FROM posting p JOIN ledger_account a ON a.id = p.account_id WHERE p.entry_id = ?',
        [e.id],
      );
      return {
        type: e.type,
        idempotencyKey: e.idempotency_key,
        refType: e.ref_type,
        refId: e.ref_id,
        actor: e.actor,
        paramVersion: e.param_version,
        postings: postings.map((p) => ({ account: `${p.owner_type}:${p.kind}` as AccountRef, amount: p.amount })),
      };
    });
  }

  /** Arm B weekly budget (goal_budget_grant), idempotent per user and week (architecture §5.1, §6.1). */
  ensureWeekGrant(tx: Db, userId: string, day: FocusDay): Entry | null {
    const params = CURRENT_PARAMS;
    const week = weekKey(day, params.time.week_start_iso_weekday);
    const ctx = this.deps.services.pointsContext;
    const p = ctx.profile(tx, userId);
    if (!p) return null;
    const regDay = focusDayOf(Date.parse(p.createdAt), params);
    const from = compareDays(regDay, week) > 0 ? regDay : week;
    // Vacation days from the table count like the params pause.
    let amount = armBWeeklyGrant(params, week, from);
    for (let d = from; compareDays(d, addDays(week, 6)) <= 0; d = addDays(d, 1)) {
      if (ctx.isVacation(tx, d) && !(compareDays(d, params.vacation_pause.first_day) >= 0 && compareDays(d, params.vacation_pause.last_day) <= 0)) amount -= params.goal_bonus.arm_b_points_per_remaining_day;
    }
    if (amount <= 0) return null;
    const res = this.post(tx, 'goal_budget_grant', keys.goalGrant(userId, week), {
      userId,
      postings: [{ account: 'system:issuance', amount: -amount }, { account: 'user:pending_goal_budget', amount }],
      refType: 'week',
      refId: week,
      actor: 'system',
      arm: 'B',
    });
    if (res.created) this.goalEvent(tx, userId, 'goal_budget_grant', 'B', week);
    return res.created ? res.entry : null;
  }

  private goalEvent(tx: Db, userId: string, type: RuleId, arm: 'A' | 'B', week: string): void {
    const p = this.deps.services.pointsContext.profile(tx, userId);
    if (!p) return;
    this.deps.services.events.event(tx, 'goal_bonus_booked', { arm, mutatie: type as never, week: isoWeekKey(week) }, { pseudonym: p.pseudonym });
  }

  /** Sessions of the day as reconcileDay sees them, with the open flags from FlagService. */
  private daySessions(userId: string, day: FocusDay): DaySession[] {
    const sessions = this.deps.services.sessions.byDay(userId, day);
    const open = this.deps.services.flags.openForSessions(sessions.map((s) => s.id));
    return sessions.map((s) => ({
      sessionId: s.id,
      serverStartAt: s.serverStartAt,
      status: s.status,
      reviewStatus: s.reviewStatus,
      verifiedMin: s.verifiedMin,
      lateStart: s.lateStart,
      isPractice: s.isPractice,
      openFlagIds: (open.get(s.id) ?? []).filter((f) => f.status === 'open').map((f) => f.id),
    }));
  }

  reconcileDay(tx: Tx, userId: string, day: FocusDay, cause: Cause): Entry[] {
    const params = CURRENT_PARAMS;
    const ctx = this.deps.services.pointsContext;
    const dc = ctx.day(tx, userId, day);
    const set = this.accountSet(tx, userId) as string;
    if (dc.arm === 'B') this.ensureWeekGrant(tx, userId, day);
    const userDays = this.deps.services.userDays;
    const existing = userDays.get(userId, day);
    const decision = cause.type === 'flag_decision' || cause.type === 'restore' || cause.type === 'appeal';
    const rev = existing ? (decision ? userDays.bumpRev(tx, userId, day) : existing.rev) : 1;
    const sessions = this.daySessions(userId, day);
    const result = coreReconcileDay({
      userId,
      day,
      week: weekKey(day, params.time.week_start_iso_weekday),
      arm: dc.arm,
      inSeason: dc.inSeason,
      goalMin: dc.goalMin,
      sessions,
      booked: bookedDayFrom(this.dayDrafts(tx, set, day)),
      cause,
      rev,
      params: { dailyCapMin: params.points.daily_cap_min, pointsPerVerifiedMin: params.points.points_per_verified_min, goalBonusPoints: params.goal_bonus.points_per_goal, paramVersion: params.version },
      examDay: dc.examDay,
      earnArm: dc.earnArm,
      dayClosed: dc.dayClosed || cause.type === 'day_close',
    });
    const created: Entry[] = [];
    for (const d of result.entries) {
      const res = this.post(tx, d.type, d.idempotencyKey, {
        userId,
        postings: d.postings,
        refType: d.refType,
        refId: d.refId,
        actor: d.actor,
        ...(d.causeType ? { causeType: d.causeType } : {}),
        ...(d.causeId ? { causeId: d.causeId } : {}),
        ...(d.focusDay ? { focusDay: d.focusDay } : {}),
        ...(d.reasonCode ? { reasonCode: d.reasonCode } : {}),
        ...(d.arm ? { arm: d.arm } : {}),
      });
      if (res.created) {
        created.push(res.entry);
        if (GOAL_EVENT_TYPES.has(d.type) && d.arm) this.goalEvent(tx, userId, d.type, d.arm, weekKey(day, params.time.week_start_iso_weekday));
      }
    }
    const now = this.deps.platform.clock.now().getTime();
    userDays.put(tx, {
      ...result.userDay,
      vacation: dc.vacation,
      rev,
      closedAt: cause.type === 'day_close' ? (existing?.closedAt ?? now) : (existing?.closedAt ?? null),
    });
    this.syncCountedMinutes(tx, set, sessions.map((s) => s.sessionId));
    this.updateEarnIn(tx, userId);
    return created;
  }

  /** focus_session.counted_min = session points on user accounts (nightly check 3, §5.5); decreases first. */
  private syncCountedMinutes(tx: Db, set: string, sessionIds: readonly string[]): void {
    const next = sessionIds.map((id) => {
      const row = tx.get<{ total: number }>(
        `SELECT COALESCE(SUM(p.amount), 0) AS total FROM journal_entry e JOIN posting p ON p.entry_id = e.id JOIN ledger_account a ON a.id = p.account_id
          WHERE e.ref_type = 'session' AND e.ref_id = ? AND e.account_set = ? AND a.owner_type = 'user'`,
        [id, set],
      );
      const cur = tx.get<{ counted_min: number }>('SELECT counted_min FROM focus_session WHERE id = ?', [id]);
      return { id, total: Number(row?.total ?? 0), cur: cur?.counted_min ?? 0 };
    });
    next.sort((a, b) => a.total - a.cur - (b.total - b.cur));
    for (const n of next) if (n.total !== n.cur) tx.run('UPDATE focus_session SET counted_min = ? WHERE id = ?', [n.total, n.id]);
  }

  /** Earn-in period (architecture §5.2): Σ counted_min of final sessions ≥ 300 sets the 7-day hold once. */
  updateEarnIn(tx: Db, userId: string): void {
    const params = CURRENT_PARAMS;
    const u = tx.get<{ earn_in_reached_at: string | null; pseudonym: string }>('SELECT earn_in_reached_at, pseudonym FROM user WHERE id = ?', [userId]);
    if (!u || u.earn_in_reached_at !== null) return;
    const total = earnInMinutes(tx, userId);
    if (total < params.points.earn_in_min) return;
    const now = this.deps.platform.clock.now();
    const after = new Date(now.getTime() + params.points.first_redeem_hold_days * 86_400_000);
    tx.run('UPDATE user SET earn_in_reached_at = ?, first_redeem_after = ? WHERE id = ? AND earn_in_reached_at IS NULL', [now.toISOString(), after.toISOString(), userId]);
    this.deps.services.events.event(tx, 'first_redemption_hold_started', { dagen: params.points.first_redeem_hold_days }, { pseudonym: u.pseudonym });
  }

  expireAll(tx: Tx, userId: string, reason: ExpireReason): Entry | null {
    const set = this.accountSet(tx, userId, false);
    if (!set) return null;
    const { byKind } = this.balancesIn(tx, userId);
    const postings = USER_ACCOUNT_KINDS.filter((k) => byKind[k] !== 0).map((k) => ({ account: `user:${k}` as AccountRef, amount: -byKind[k] }));
    if (postings.length === 0) return null;
    const total = USER_ACCOUNT_KINDS.reduce((t, k) => t + byKind[k], 0);
    if (total !== 0) postings.push({ account: 'system:expired', amount: total });
    const date = this.deps.platform.clock.now().toISOString().slice(0, 10);
    return this.post(tx, 'expire', keys.expire(set, reason, date), { userId, postings, refType: 'account', refId: set, reasonCode: reason, actor: 'system' }).entry;
  }
}

/** Minutes toward the earn-in period: counted_min of completed sessions without open or rejected flags. */
export function earnInMinutes(db: Db, userId: string): number {
  const row = db.get<{ total: number }>(
    "SELECT COALESCE(SUM(counted_min), 0) AS total FROM focus_session WHERE user_id = ? AND status = 'completed' AND review_status IN ('none', 'released')",
    [userId],
  );
  return Number(row?.total ?? 0);
}
