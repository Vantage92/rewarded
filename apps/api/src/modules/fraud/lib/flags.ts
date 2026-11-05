// SQL FlagService (architecture §3.2, §10.8, §12.2). A flag is raised by a heuristic or a report and
// closed only by a human; a block needs a second admin. The only automatic close is `closed` with
// `account_deleted` (§10.7). Consequences of a decision (review status, reconcileDay, block) are
// applied by decisions.ts, so this class stays the plain store of the frozen interface.
import { DomainError, type FlagCode, type FlagDecision, type FlagStatus, type FlagSubjectType } from '@rewarded/contracts';
import type { Db } from '../../../db/types.ts';
import type { Ids } from '../../../db/ids.ts';
import type { Clock } from '../../../platform/types.ts';
import type { AdminActor, FlagDecisionResult, FlagRecord, FlagService, RaiseFlagInput } from '../../../services/flags.ts';
import { parseJson } from './util.ts';

export interface FlagRow {
  id: string;
  subject_type: FlagSubjectType;
  subject_id: string | null;
  code: FlagCode;
  evidence: string;
  evidence_reduced_at: string | null;
  status: FlagStatus;
  dedup_key: string | null;
  created_at: string;
  decision: FlagDecision | null;
  decided_by: AdminActor | null;
  decided_at: string | null;
  reason_code: string | null;
  note: string | null;
  block_confirmed_by: AdminActor | null;
  block_confirmed_at: string | null;
}

/** RaiseFlagInput plus the WP-6 batch fields (accounts without a session, idempotency key). */
export interface RaiseFlagInputExt extends RaiseFlagInput {
  userIds?: readonly string[];
  dedupKey?: string;
}

export function loadFlag(db: Db, id: string): FlagRow | undefined {
  return db.get<FlagRow>('SELECT * FROM fraud_flag WHERE id = ?', [id]);
}

export function flagSessionIds(db: Db, id: string): string[] {
  return db.all<{ session_id: string }>('SELECT session_id FROM fraud_flag_session WHERE flag_id = ? AND session_id IS NOT NULL ORDER BY session_id', [id]).map((r) => r.session_id);
}

/** Accounts a flag touches: the subject account, linked accounts and the owners of its sessions. */
export function flagUserIds(db: Db, flag: Pick<FlagRow, 'id' | 'subject_type' | 'subject_id'>): string[] {
  const rows = db.all<{ u: string }>(
    `SELECT user_id AS u FROM fraud_flag_session WHERE flag_id = ? AND user_id IS NOT NULL
     UNION SELECT s.user_id AS u FROM fraud_flag_session l JOIN focus_session s ON s.id = l.session_id WHERE l.flag_id = ?`,
    [flag.id, flag.id],
  );
  const out = new Set(rows.map((r) => r.u));
  if (flag.subject_type === 'account' && flag.subject_id) out.add(flag.subject_id);
  return [...out].sort();
}

export function toRecord(db: Db, r: FlagRow): FlagRecord {
  return {
    id: r.id,
    code: r.code,
    subject: r.subject_id === null ? { type: r.subject_type } : { type: r.subject_type, id: r.subject_id },
    sessionIds: flagSessionIds(db, r.id),
    evidence: parseJson<Record<string, unknown>>(r.evidence, {}),
    status: r.status,
    decidedBy: r.decided_by,
    blockConfirmedBy: r.block_confirmed_by,
    reasonCode: r.reason_code,
    blockPending: r.status === 'open' && r.decision === 'block',
  };
}

export class SqlFlagService implements FlagService {
  private readonly db: Db;
  private readonly ids: Ids;
  private readonly clock: Clock;
  constructor(deps: { db: Db; ids: Ids; clock: Clock }) {
    this.db = deps.db;
    this.ids = deps.ids;
    this.clock = deps.clock;
  }

  raise(tx: Db, input: RaiseFlagInputExt): string {
    if (input.subject.type === 'session' && input.sessionIds.length === 0) throw new Error('A session flag needs at least one session');
    if (input.dedupKey) {
      const existing = tx.get<{ id: string }>('SELECT id FROM fraud_flag WHERE dedup_key = ?', [input.dedupKey]);
      if (existing) return existing.id;
    }
    const id = this.ids.ulid();
    const at = this.clock.now().toISOString();
    tx.run('INSERT INTO fraud_flag (id, subject_type, subject_id, code, evidence, status, dedup_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
      id,
      input.subject.type,
      input.subject.id ?? null,
      input.code,
      JSON.stringify(input.evidence ?? {}),
      'open',
      input.dedupKey ?? null,
      at,
    ]);
    for (const sid of new Set(input.sessionIds)) {
      const owner = tx.get<{ user_id: string }>('SELECT user_id FROM focus_session WHERE id = ?', [sid]);
      if (!owner) continue;
      tx.run('INSERT OR IGNORE INTO fraud_flag_session (flag_id, session_id, user_id) VALUES (?, ?, ?)', [id, sid, owner.user_id]);
    }
    const accounts = new Set(input.userIds ?? []);
    if (input.subject.type === 'account' && input.subject.id) accounts.add(input.subject.id);
    for (const u of accounts) {
      if (tx.get('SELECT 1 AS x FROM fraud_flag_session WHERE flag_id = ? AND user_id = ?', [id, u])) continue;
      if (!tx.get('SELECT 1 AS x FROM user WHERE id = ?', [u])) continue;
      tx.run('INSERT INTO fraud_flag_session (flag_id, session_id, user_id) VALUES (?, NULL, ?)', [id, u]);
    }
    return id;
  }

  decide(tx: Db, flagId: string, decision: FlagDecision, actor: AdminActor, reasonCode: string): FlagDecisionResult {
    // Architecture §10.8: no automated negative decision; only an admin decides.
    if (typeof actor !== 'string' || !actor.startsWith('admin:')) throw new Error('Only an admin can decide a flag (architecture §10.8)');
    if (!reasonCode) throw new DomainError('REASON_REQUIRED');
    const r = loadFlag(tx, flagId);
    if (!r) throw new DomainError('NOT_FOUND');
    if (r.status !== 'open' || r.decision !== null) throw new DomainError('NOT_FOUND', { reason: 'flag_not_open' });
    const at = this.clock.now().toISOString();
    const status: FlagStatus = decision === 'release' ? 'released' : decision === 'reject' ? 'rejected' : 'open';
    tx.run('UPDATE fraud_flag SET decision = ?, decided_by = ?, decided_at = ?, reason_code = ?, status = ? WHERE id = ?', [decision, actor, at, reasonCode, status, flagId]);
    const after = loadFlag(tx, flagId) as FlagRow;
    return { flag: toRecord(tx, after), affectedSessionIds: decision === 'block' ? [] : flagSessionIds(tx, flagId) };
  }

  confirmBlock(tx: Db, flagId: string, actor: AdminActor): FlagRecord {
    if (typeof actor !== 'string' || !actor.startsWith('admin:')) throw new Error('Only an admin can confirm a block (architecture §10.8)');
    const r = loadFlag(tx, flagId);
    if (!r) throw new DomainError('NOT_FOUND');
    if (r.status !== 'open' || r.decision !== 'block') throw new DomainError('FOUR_EYES_REQUIRED', { reason: 'no_pending_block' });
    if (r.decided_by === actor) throw new DomainError('SAME_REVIEWER');
    tx.run("UPDATE fraud_flag SET status = 'blocked', block_confirmed_by = ?, block_confirmed_at = ? WHERE id = ?", [actor, this.clock.now().toISOString(), flagId]);
    return toRecord(tx, loadFlag(tx, flagId) as FlagRow);
  }

  closeForDeletedAccount(tx: Db, sessionIds: readonly string[]): number {
    let n = 0;
    for (const sid of new Set(sessionIds)) {
      const flags = tx.all<{ id: string }>("SELECT f.id FROM fraud_flag f JOIN fraud_flag_session l ON l.flag_id = f.id WHERE l.session_id = ? AND f.status = 'open'", [sid]);
      for (const f of flags) n += tx.run("UPDATE fraud_flag SET status = 'closed', reason_code = 'account_deleted' WHERE id = ? AND status = 'open'", [f.id]).changes;
    }
    return n;
  }

  /** Same as closeForDeletedAccount, found through the account (used by the privacy eraser). */
  closeForUser(tx: Db, userId: string): number {
    const flags = tx.all<{ id: string }>(
      `SELECT DISTINCT f.id FROM fraud_flag f LEFT JOIN fraud_flag_session l ON l.flag_id = f.id
        WHERE f.status = 'open' AND (l.user_id = ? OR (f.subject_type = 'account' AND f.subject_id = ?))`,
      [userId, userId],
    );
    let n = 0;
    for (const f of flags) n += tx.run("UPDATE fraud_flag SET status = 'closed', reason_code = 'account_deleted' WHERE id = ? AND status = 'open'", [f.id]).changes;
    return n;
  }

  openForSessions(sessionIds: readonly string[]): ReadonlyMap<string, readonly FlagRecord[]> {
    const out = new Map<string, FlagRecord[]>();
    for (const sid of sessionIds) out.set(sid, []);
    if (sessionIds.length === 0) return out;
    for (const sid of sessionIds) {
      const rows = this.db.all<FlagRow>("SELECT f.* FROM fraud_flag f JOIN fraud_flag_session l ON l.flag_id = f.id WHERE l.session_id = ? AND f.status = 'open' ORDER BY f.created_at, f.id", [sid]);
      out.set(sid, rows.map((r) => toRecord(this.db, r)));
    }
    return out;
  }

  get(flagId: string): FlagRecord | undefined {
    const r = loadFlag(this.db, flagId);
    return r ? toRecord(this.db, r) : undefined;
  }
}
