// FlagService (architecture §12.2; implementation WP-6). Flags are raised by heuristics or reports and
// only closed by a human (§10.8: no automated negative decision). Block needs a second admin.
import { DomainError, type FlagCode, type FlagDecision, type FlagStatus, type FlagSubjectType } from '@rewarded/contracts';
import type { Db } from '../db/types.ts';
import type { ActorRef } from './audit.ts';

export interface FlagSubject {
  type: FlagSubjectType;
  id?: string;
}
export interface RaiseFlagInput {
  code: FlagCode;
  subject: FlagSubject;
  sessionIds: readonly string[];
  /** Evidence as produced by core/fraud; no raw IP, phone or e-mail. */
  evidence: Readonly<Record<string, unknown>>;
}
export type AdminActor = `admin:${string}`;

export interface FlagRecord {
  id: string;
  code: FlagCode;
  subject: FlagSubject;
  sessionIds: readonly string[];
  evidence: Readonly<Record<string, unknown>>;
  status: FlagStatus;
  decidedBy: AdminActor | null;
  blockConfirmedBy: AdminActor | null;
  reasonCode: string | null;
  /** True after a `block` decision until a second admin confirms it. */
  blockPending: boolean;
}

export interface FlagDecisionResult {
  flag: FlagRecord;
  /** Sessions whose review_status the owner must update and whose user_day needs reconcileDay. */
  affectedSessionIds: readonly string[];
}

export interface FlagService {
  raise(tx: Db, input: RaiseFlagInput): string;
  /** Human decision; `actor` must be an admin. `block` stays pending until confirmBlock. */
  decide(tx: Db, flagId: string, decision: FlagDecision, actor: AdminActor, reasonCode: string): FlagDecisionResult;
  /** Second admin confirms a block (SAME_REVIEWER when it is the deciding admin). */
  confirmBlock(tx: Db, flagId: string, actor: AdminActor): FlagRecord;
  /** Closes open flags of a deleted account (`closed` with account_deleted, §10.7); the only non-human close. */
  closeForDeletedAccount(tx: Db, sessionIds: readonly string[]): number;
  /** Open flags per session id, for cards (SESSION_UNDER_REVIEW) and reconcileDay. */
  openForSessions(sessionIds: readonly string[]): ReadonlyMap<string, readonly FlagRecord[]>;
  get(flagId: string): FlagRecord | undefined;
}

const DECISION_STATUS: Record<FlagDecision, FlagStatus> = { release: 'released', reject: 'rejected', block: 'blocked' };

export class FakeFlagService implements FlagService {
  private readonly flags = new Map<string, FlagRecord>();
  private seq = 0;

  raise(_tx: Db, input: RaiseFlagInput): string {
    if (input.subject.type === 'session' && input.sessionIds.length === 0) throw new Error('A session flag needs at least one session');
    const id = `flag_${++this.seq}`;
    this.flags.set(id, {
      id,
      code: input.code,
      subject: { ...input.subject },
      sessionIds: [...new Set(input.sessionIds)],
      evidence: { ...input.evidence },
      status: 'open',
      decidedBy: null,
      blockConfirmedBy: null,
      reasonCode: null,
      blockPending: false,
    });
    return id;
  }

  decide(_tx: Db, flagId: string, decision: FlagDecision, actor: AdminActor, reasonCode: string): FlagDecisionResult {
    if (!actor.startsWith('admin:')) throw new Error('Only an admin can decide a flag (architecture §10.8)');
    if (!reasonCode) throw new DomainError('REASON_REQUIRED');
    const flag = this.require(flagId);
    if (flag.status !== 'open') throw new DomainError('NOT_FOUND', { reason: 'flag_not_open' });
    flag.decidedBy = actor;
    flag.reasonCode = reasonCode;
    if (decision === 'block') flag.blockPending = true;
    else flag.status = DECISION_STATUS[decision];
    return { flag: { ...flag }, affectedSessionIds: decision === 'block' ? [] : flag.sessionIds };
  }

  confirmBlock(_tx: Db, flagId: string, actor: AdminActor): FlagRecord {
    const flag = this.require(flagId);
    if (!flag.blockPending) throw new DomainError('FOUR_EYES_REQUIRED', { reason: 'no_pending_block' });
    if (flag.decidedBy === actor) throw new DomainError('SAME_REVIEWER');
    flag.blockConfirmedBy = actor;
    flag.blockPending = false;
    flag.status = 'blocked';
    return { ...flag };
  }

  closeForDeletedAccount(_tx: Db, sessionIds: readonly string[]): number {
    const ids = new Set(sessionIds);
    let n = 0;
    for (const flag of this.flags.values())
      if (flag.status === 'open' && flag.sessionIds.some((s) => ids.has(s))) {
        flag.status = 'closed';
        flag.reasonCode = 'account_deleted';
        n++;
      }
    return n;
  }

  openForSessions(sessionIds: readonly string[]): ReadonlyMap<string, readonly FlagRecord[]> {
    const out = new Map<string, FlagRecord[]>();
    for (const sid of sessionIds) out.set(sid, []);
    for (const flag of this.flags.values()) {
      if (flag.status !== 'open') continue;
      for (const sid of flag.sessionIds) out.get(sid)?.push({ ...flag });
    }
    return out;
  }

  get(flagId: string): FlagRecord | undefined {
    const f = this.flags.get(flagId);
    return f ? { ...f } : undefined;
  }

  private require(flagId: string): FlagRecord {
    const f = this.flags.get(flagId);
    if (!f) throw new DomainError('NOT_FOUND');
    return f;
  }
}

/** Helper for the API layer: is this ActorRef an admin? */
export function isAdminActor(actor: ActorRef): actor is AdminActor {
  return actor.startsWith('admin:');
}
