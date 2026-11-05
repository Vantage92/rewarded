// SQL SessionRepository (architecture §3.2, §12.2) plus the row loaders the engine needs.
import type { AbortReason, Heartbeat, OutageWindow, SessionHeader, SessionVerdict, VisibilityEvent } from '@rewarded/core/session';
import type { FocusDay } from '@rewarded/core/time';
import type { Db } from '../../db/types.ts';
import type { Actor, Tx } from '../../services/ledger.ts';
import type { FocusSession, HeuristicsWindow, RestoreResult, SessionRepository } from '../../services/sessions.ts';
import { SessionInvariantError } from '../../services/sessions.ts';

export interface SessionRow {
  id: string;
  user_id: string;
  device_id: string;
  planned_min: 1 | 25 | 50 | 90;
  is_practice: number;
  status: 'active' | 'completed' | 'aborted';
  server_start_at: number;
  planned_end_at: number;
  server_end_at: number | null;
  end_received_at: number | null;
  end_mono_ms: number | null;
  end_client_ts: number | null;
  abort_reason: AbortReason | null;
  abort_at: number | null;
  verified_min: number;
  counted_min: number;
  focus_day: string;
  late_start: number;
  review_status: FocusSession['reviewStatus'];
  flag_codes: string;
  verification_level: 1;
  nonce_hash: string;
  prev_nonce_hash: string | null;
  last_seq: number;
  last_response: string | null;
  mono_start_ms: number;
  verdict: string | null;
  closed_by: FocusSession['closedBy'];
  last_heartbeat_at: number;
  covered_gap_s: number;
  clock_skew_ms: number | null;
  claim_delay_s: number | null;
  webdriver: number;
  standalone: number;
  ua_class: string;
  ip_hash: string | null;
  net_class: FocusSession['netClass'];
  restored_by: Actor | null;
  restored_reason: FocusSession['restoredReason'];
  reported_at: number | null;
}

/** Stored verdict column: the core verdict plus the answers that replays return (architecture §4.7). */
export interface StoredVerdict {
  core: SessionVerdict;
  end?: unknown;
  stop?: unknown;
}

export function loadRow(db: Db, id: string): SessionRow | undefined {
  return db.get<SessionRow>('SELECT * FROM focus_session WHERE id = ?', [id]);
}

export function storedVerdict(row: SessionRow): StoredVerdict | null {
  return row.verdict ? (JSON.parse(row.verdict) as StoredVerdict) : null;
}

export function toFocusSession(r: SessionRow): FocusSession {
  return {
    id: r.id,
    userId: r.user_id,
    deviceId: r.device_id,
    plannedMin: r.planned_min,
    isPractice: r.is_practice === 1,
    status: r.status,
    serverStartAt: r.server_start_at,
    plannedEndAt: r.planned_end_at,
    serverEndAt: r.server_end_at,
    abortReason: r.abort_reason,
    abortAt: r.abort_at,
    verifiedMin: r.verified_min,
    countedMin: r.counted_min,
    focusDay: r.focus_day,
    lateStart: r.late_start === 1,
    reviewStatus: r.review_status,
    flagCodes: JSON.parse(r.flag_codes) as string[],
    verificationLevel: 1,
    closedBy: r.closed_by,
    coveredGapS: r.covered_gap_s,
    clockSkewMs: r.clock_skew_ms,
    claimDelayS: r.claim_delay_s,
    webdriver: r.webdriver === 1,
    standalone: r.standalone === 1,
    uaClass: r.ua_class,
    ipHash: r.ip_hash,
    netClass: r.net_class,
    verdict: storedVerdict(r)?.core ?? null,
    restoredBy: r.restored_by,
    restoredReason: r.restored_reason,
  };
}

export function headerOf(r: SessionRow): SessionHeader {
  return {
    sessionId: r.id,
    userId: r.user_id,
    deviceId: r.device_id,
    plannedMin: r.planned_min,
    isPractice: r.is_practice === 1,
    serverStartAt: r.server_start_at,
    plannedEndAt: r.planned_end_at,
    monoStartMs: r.mono_start_ms,
    focusDay: r.focus_day,
    lateStart: r.late_start === 1,
    verificationLevel: 1,
    webdriver: r.webdriver === 1,
    uaClass: r.ua_class,
  };
}

export function heartbeatsOf(db: Db, id: string): Heartbeat[] {
  return db
    .all<{ seq: number; kind: Heartbeat['kind']; server_recv_at: number; client_ts: number; mono_ms: number; visibility: Heartbeat['visibility']; wakelock: Heartbeat['wakelock']; nonce_ok: number; buffered: number }>(
      'SELECT * FROM session_heartbeat WHERE session_id = ? ORDER BY server_recv_at, seq',
      [id],
    )
    .map((h) => ({ seq: h.seq, kind: h.kind, serverRecvAt: h.server_recv_at, clientTs: h.client_ts, monoMs: h.mono_ms, visibility: h.visibility, wakelock: h.wakelock, nonceOk: h.nonce_ok === 1, buffered: h.buffered === 1 }));
}

export function eventsOf(db: Db, id: string): VisibilityEvent[] {
  return db
    .all<{ ev_seq: number; kind: VisibilityEvent['kind']; mono_ms: number; client_ts: number; server_recv_at: number; buffered: number }>(
      'SELECT ev_seq, kind, mono_ms, client_ts, server_recv_at, buffered FROM visibility_event WHERE session_id = ? ORDER BY ev_seq',
      [id],
    )
    .map((e) => ({ evSeq: e.ev_seq, kind: e.kind, monoMs: e.mono_ms, clientTs: e.client_ts, serverRecvAt: e.server_recv_at, buffered: e.buffered === 1 }));
}

/** Outages from the WP-3 table (ISO text) as instants. */
export function outagesOf(db: Db): OutageWindow[] {
  return db.all<{ from: string; to: string }>('SELECT "from", "to" FROM outage').map((o) => ({ from: Date.parse(o.from), to: Date.parse(o.to) }));
}

export type RestoreFn = (tx: Tx, sessionId: string, reason: FocusSession['restoredReason'] & string, actor: Actor) => RestoreResult;

export class SqlSessionRepository implements SessionRepository {
  private readonly db: Db;
  private readonly restoreFn: RestoreFn;
  constructor(db: Db, restoreFn: RestoreFn) {
    this.db = db;
    this.restoreFn = restoreFn;
  }

  get(sessionId: string): FocusSession | undefined {
    const r = loadRow(this.db, sessionId);
    return r ? toFocusSession(r) : undefined;
  }

  byDay(userId: string, day: FocusDay): FocusSession[] {
    return this.db.all<SessionRow>('SELECT * FROM focus_session WHERE user_id = ? AND focus_day = ? ORDER BY server_start_at, id', [userId, day]).map(toFocusSession);
  }

  setReviewStatus(tx: Tx, sessionIds: readonly string[], status: FocusSession['reviewStatus']): void {
    if (status === 'none') throw new SessionInvariantError('review status cannot return to none');
    for (const id of sessionIds) {
      const r = loadRow(tx, id);
      if (!r) throw new SessionInvariantError(`${id}: unknown session`);
      if (r.status !== 'completed') throw new SessionInvariantError(`${id}: review status only on completed sessions`);
    }
    for (const id of sessionIds) tx.run('UPDATE focus_session SET review_status = ? WHERE id = ?', [status, id]);
  }

  forHeuristics(window: HeuristicsWindow): FocusSession[] {
    const rows = this.db.all<SessionRow>('SELECT * FROM focus_session WHERE server_start_at >= ? AND server_start_at < ? ORDER BY server_start_at, id', [window.from, window.to]);
    return rows.filter((r) => !window.statuses || window.statuses.includes(r.status)).map(toFocusSession);
  }

  restore(tx: Tx, sessionId: string, reason: FocusSession['restoredReason'] & string, actor: Actor): RestoreResult {
    return this.restoreFn(tx, sessionId, reason, actor);
  }
}
