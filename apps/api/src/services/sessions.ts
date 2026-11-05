// SessionRepository: frozen interface between API modules (architecture §12.2), owner WP-4.
// Used by WP-6 for heuristics, review decisions and restore. Fake enforces the focus_session
// invariants from architecture §3.2.
import { PARAMS_V1 } from '@rewarded/core/params';
import type { Params } from '@rewarded/core/params';
import { focusDayOf, isLateStart } from '@rewarded/core/time';
import type { FocusDay, Instant } from '@rewarded/core/time';
// Core-type files are re-exported from core/session/index.ts by WP-4; until then, import directly.
import { RESTORE_REASONS } from '../../../../packages/core/src/session/types.ts';
import type {
  AbortReason,
  ClosedBy,
  PlannedMin,
  RestoreReason,
  ReviewStatus,
  SessionStatus,
  SessionVerdict,
  VerificationLevel,
} from '../../../../packages/core/src/session/types.ts';
import type { Actor, Tx } from './ledger.ts';

/** One `focus_session` row as other modules see it (architecture §3.2; heartbeat bookkeeping omitted). */
export interface FocusSession {
  id: string;
  userId: string;
  deviceId: string;
  plannedMin: PlannedMin;
  isPractice: boolean;
  status: SessionStatus;
  serverStartAt: Instant;
  plannedEndAt: Instant;
  serverEndAt: Instant | null;
  abortReason: AbortReason | null;
  abortAt: Instant | null;
  verifiedMin: number;
  countedMin: number;
  focusDay: FocusDay;
  lateStart: boolean;
  reviewStatus: ReviewStatus;
  flagCodes: readonly string[];
  verificationLevel: VerificationLevel;
  closedBy: ClosedBy | null;
  coveredGapS: number;
  clockSkewMs: number | null;
  claimDelayS: number | null;
  webdriver: boolean;
  standalone: boolean;
  uaClass: string;
  ipHash: string | null;
  netClass: 'campus' | 'mobile_cgnat' | 'other' | null;
  verdict: SessionVerdict | null;
  restoredBy: Actor | null;
  restoredReason: RestoreReason | null;
}

/** Time window for batch heuristics, on `server_start_at` (half-open: from ≤ t < to). */
export interface HeuristicsWindow {
  from: Instant;
  to: Instant;
  /** Optional filter, e.g. only completed sessions. */
  statuses?: readonly SessionStatus[];
}

export interface RestoreResult {
  /** false when the re-evaluation did not yield `completed`; the abort then stands (architecture §4.8). */
  restored: boolean;
  session: FocusSession;
}

export interface SessionRepository {
  get(sessionId: string): FocusSession | undefined;
  /** Sessions of a user on a focus day, ordered by `server_start_at`. */
  byDay(userId: string, day: FocusDay): FocusSession[];
  /** Sets the review status of completed sessions (flag raised, released, rejected). */
  setReviewStatus(tx: Tx, sessionIds: readonly string[], status: ReviewStatus): void;
  forHeuristics(window: HeuristicsWindow): FocusSession[];
  /** Re-runs evaluateSession with outage context or a late log; aborted → completed only here. */
  restore(tx: Tx, sessionId: string, reason: RestoreReason, actor: Actor): RestoreResult;
}

export class SessionInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionInvariantError';
  }
}

/** Invariants of one row (architecture §3.2 `focus_session`). */
export function assertValidSession(s: FocusSession, params: Params = PARAMS_V1): void {
  const fail = (m: string): never => {
    throw new SessionInvariantError(`${s.id}: ${m}`);
  };
  if (s.isPractice !== (s.plannedMin === params.session.practice_min)) fail('is_practice must equal (planned_min = 1)');
  if (!s.isPractice && !params.session.lengths_min.includes(s.plannedMin)) fail(`planned_min ${s.plannedMin} is not a session length`);
  const expectedVerified = s.status === 'completed' && !s.isPractice ? s.plannedMin : 0;
  if (s.verifiedMin !== expectedVerified) fail(`verified_min must be ${expectedVerified}`);
  if (s.countedMin < 0 || s.countedMin > s.verifiedMin) fail('counted_min must be within [0, verified_min]');
  if (s.focusDay !== focusDayOf(s.serverStartAt, params)) fail('focus_day must be the focus day of server_start_at');
  if (s.lateStart !== isLateStart(s.serverStartAt, params)) fail('late_start must match the night window');
  if (s.verificationLevel !== 1) fail('the web MVP only knows verification level 1');
  if (s.status === 'aborted' && s.abortReason === null) fail('aborted session needs an abort_reason');
  if (s.status !== 'aborted' && s.abortReason !== null) fail('abort_reason only on aborted sessions');
  if (s.status !== 'completed' && s.reviewStatus !== 'none') fail('review_status only applies to completed sessions');
}

export interface FakeSessionOptions {
  params?: Params;
  /** Outcome of the re-evaluation in restore; defaults to "completed". WP-4's verifier replaces this. */
  reevaluate?: (session: FocusSession, reason: RestoreReason) => boolean;
}

/** In-memory SessionRepository with the focus_session invariants (one active per user, daily cap, …). */
export class FakeSessionRepository implements SessionRepository {
  private readonly rows = new Map<string, FocusSession>();
  private readonly params: Params;
  private readonly reevaluate: (session: FocusSession, reason: RestoreReason) => boolean;

  constructor(options: FakeSessionOptions = {}) {
    this.params = options.params ?? PARAMS_V1;
    this.reevaluate = options.reevaluate ?? (() => true);
  }

  /** Test helper: inserts or replaces a row after checking every invariant. Status may not go aborted → completed. */
  save(session: FocusSession): void {
    assertValidSession(session, this.params);
    const prev = this.rows.get(session.id);
    if (prev && prev.status === 'aborted' && session.status === 'completed') {
      throw new SessionInvariantError(`${session.id}: aborted → completed only via restore`);
    }
    if (prev && prev.status !== 'active' && session.status === 'active') throw new SessionInvariantError(`${session.id}: a closed session cannot reopen`);
    this.assertCrossRow(session);
    this.rows.set(session.id, Object.freeze({ ...session }));
  }

  private assertCrossRow(session: FocusSession): void {
    const others = [...this.rows.values()].filter((r) => r.id !== session.id && r.userId === session.userId);
    if (session.status === 'active' && others.some((r) => r.status === 'active')) {
      throw new SessionInvariantError(`${session.id}: user ${session.userId} already has an active session`);
    }
    const dayTotal = others.filter((r) => r.focusDay === session.focusDay).reduce((s, r) => s + r.countedMin, 0) + session.countedMin;
    if (dayTotal > this.params.points.daily_cap_min) {
      throw new SessionInvariantError(`${session.id}: counted_min on ${session.focusDay} would exceed ${this.params.points.daily_cap_min}`);
    }
  }

  get(sessionId: string): FocusSession | undefined {
    return this.rows.get(sessionId);
  }

  byDay(userId: string, day: FocusDay): FocusSession[] {
    return [...this.rows.values()].filter((r) => r.userId === userId && r.focusDay === day).sort((a, b) => a.serverStartAt - b.serverStartAt);
  }

  setReviewStatus(_tx: Tx, sessionIds: readonly string[], status: ReviewStatus): void {
    const targets = sessionIds.map((id) => {
      const row = this.rows.get(id);
      if (!row) throw new SessionInvariantError(`${id}: unknown session`);
      if (row.status !== 'completed') throw new SessionInvariantError(`${id}: review status only on completed sessions`);
      if (status === 'none') throw new SessionInvariantError(`${id}: review status cannot return to none`);
      return row;
    });
    for (const row of targets) this.rows.set(row.id, Object.freeze({ ...row, reviewStatus: status }));
  }

  forHeuristics(window: HeuristicsWindow): FocusSession[] {
    return [...this.rows.values()]
      .filter((r) => r.serverStartAt >= window.from && r.serverStartAt < window.to && (!window.statuses || window.statuses.includes(r.status)))
      .sort((a, b) => a.serverStartAt - b.serverStartAt);
  }

  restore(_tx: Tx, sessionId: string, reason: RestoreReason, actor: Actor): RestoreResult {
    const row = this.rows.get(sessionId);
    if (!row) throw new SessionInvariantError(`${sessionId}: unknown session`);
    if (!RESTORE_REASONS.includes(reason)) throw new SessionInvariantError(`${sessionId}: unknown restore reason ${reason}`);
    if (row.status !== 'aborted') throw new SessionInvariantError(`${sessionId}: only aborted sessions can be restored`);
    if (row.isPractice || !this.reevaluate(row, reason)) return { restored: false, session: row };
    // counted_min stays 0 here: reconcileDay assigns it within the daily cap (architecture §4.8, §5.1).
    const restored: FocusSession = Object.freeze({
      ...row,
      status: 'completed',
      abortReason: null,
      abortAt: null,
      verifiedMin: row.plannedMin,
      countedMin: 0,
      serverEndAt: row.plannedEndAt,
      closedBy: 'restore',
      restoredBy: actor,
      restoredReason: reason,
    });
    assertValidSession(restored, this.params);
    this.rows.set(row.id, restored);
    return { restored: true, session: restored };
  }
}
