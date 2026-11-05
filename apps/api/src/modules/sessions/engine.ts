// Session engine (architecture §4): applies evaluateSession to stored rows, closes sessions, books via
// the ledger, raises H1/H3/H4 through FlagService and writes the server events in the same transaction.
import { CURRENT_PARAMS, MS_PER_MINUTE } from '@rewarded/core';
import { elapsedSeconds, evaluateSession, type AbortReason, type EndReport, type SessionVerdict } from '@rewarded/core/session';
import { UaClass, type EndSessionResponse, type OutboxItem, type SessionDto, type SessionVerdictDto, type StopSessionResponse } from '@rewarded/contracts';
import { idsFor, randomToken, sha256 } from '../../db/ids.ts';
import type { Db } from '../../db/types.ts';
import type { ModuleDeps } from '../../module.ts';
import type { Actor, Tx } from '../../services/ledger.ts';
import type { RestoreResult } from '../../services/sessions.ts';
import { earnInMinutes } from '../points/ledger.ts';
import { eventsOf, headerOf, heartbeatsOf, loadRow, outagesOf, storedVerdict, toFocusSession, type SessionRow, type StoredVerdict } from './repository.ts';

const iso = (ms: number) => new Date(ms).toISOString();

export function newNonce(deps: ModuleDeps): { nonce: string; hash: string } {
  const nonce = randomToken(deps.platform.random, 24);
  return { nonce, hash: sha256(nonce) };
}

export function sessionDto(r: SessionRow): SessionDto {
  return {
    id: r.id,
    planned_min: r.planned_min,
    is_practice: r.is_practice === 1,
    status: r.status,
    focus_day: r.focus_day,
    server_start_at: iso(r.server_start_at),
    planned_end_at: iso(r.planned_end_at),
    server_end_at: r.server_end_at === null ? null : iso(r.server_end_at),
    verified_min: r.verified_min,
    counted_min: r.counted_min,
    late_start: r.late_start === 1,
    review_status: r.review_status,
  };
}

export function verdictDto(r: SessionRow): SessionVerdictDto {
  const until = r.abort_at ?? r.server_end_at ?? r.planned_end_at;
  return {
    status: r.status === 'completed' ? 'completed' : 'aborted',
    ...(r.abort_reason ? { abort_reason: r.abort_reason } : {}),
    verified_min: r.verified_min,
    elapsed_s: elapsedSeconds(r.server_start_at, until),
    flagged: r.review_status === 'pending' || (JSON.parse(r.flag_codes) as string[]).length > 0,
  };
}

export class SessionEngine {
  private readonly deps: ModuleDeps;
  private readonly ids;
  constructor(deps: ModuleDeps) {
    this.deps = deps;
    this.ids = idsFor(deps.platform);
  }

  now(): number {
    return this.deps.platform.clock.now().getTime();
  }

  endReportOf(r: SessionRow): EndReport | undefined {
    return r.end_received_at !== null && r.end_mono_ms !== null ? { monoMs: r.end_mono_ms, clientTs: r.end_client_ts ?? 0, serverRecvAt: r.end_received_at } : undefined;
  }

  evaluate(tx: Db, r: SessionRow, now: number, extraOutages = true): SessionVerdict {
    const endReport = this.endReportOf(r);
    return evaluateSession({
      session: headerOf(r),
      heartbeats: heartbeatsOf(tx, r.id),
      events: eventsOf(tx, r.id),
      ...(endReport ? { endReport } : {}),
      outages: extraOutages ? outagesOf(tx) : [],
      now,
      params: CURRENT_PARAMS.session,
    });
  }

  /** Stores outbox items: visibility events deduplicated on ev_seq, buffered heartbeats on (seq, kind). */
  ingest(tx: Db, r: SessionRow, items: readonly OutboxItem[], now: number): void {
    for (const it of items) {
      if (it.type === 'visibility') {
        tx.run(
          `INSERT OR IGNORE INTO visibility_event (id, session_id, ev_seq, kind, mono_ms, client_ts, server_recv_at, buffered, persisted, nav_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          [this.ids.ulid(), r.id, it.ev_seq, it.kind, it.mono_ms, it.client_ts, now, it.persisted === undefined ? null : it.persisted ? 1 : 0, it.nav_type ?? null],
        );
      } else {
        tx.run(
          `INSERT OR IGNORE INTO session_heartbeat (session_id, seq, kind, server_recv_at, client_ts, mono_ms, visibility, wakelock, nonce_ok, buffered)
           VALUES (?, ?, 'buffered', ?, ?, ?, ?, ?, 0, 1)`,
          [r.id, it.seq, now, it.client_ts, it.mono_ms, it.visibility, it.wakelock],
        );
      }
    }
  }

  /** Points of one session on user accounts (the earn, top-up, release and reverse postings). */
  sessionPoints(tx: Db, sessionId: string): { available: number; pending: number } {
    const rows = tx.all<{ kind: string; total: number }>(
      `SELECT a.kind AS kind, SUM(p.amount) AS total FROM journal_entry e JOIN posting p ON p.entry_id = e.id JOIN ledger_account a ON a.id = p.account_id
        WHERE e.ref_type = 'session' AND e.ref_id = ? AND a.owner_type = 'user' GROUP BY a.kind`,
      [sessionId],
    );
    const get = (k: string) => Number(rows.find((x) => x.kind === k)?.total ?? 0);
    return { available: get('available_own'), pending: get('pending_session') };
  }

  private pseudonym(tx: Db, userId: string): string {
    return tx.get<{ pseudonym: string }>('SELECT pseudonym FROM user WHERE id = ?', [userId])?.pseudonym ?? 'unknown_user';
  }

  private saveVerdict(tx: Db, id: string, patch: Partial<StoredVerdict>): void {
    const r = loadRow(tx, id) as SessionRow;
    const v = { ...(storedVerdict(r) ?? {}), ...patch } as StoredVerdict;
    tx.run('UPDATE focus_session SET verdict = ? WHERE id = ?', [JSON.stringify(v), id]);
  }

  /** Closes as aborted (spec §4.1 codes); no points, no goal. */
  abort(tx: Db, r: SessionRow, reason: AbortReason, at: number, closedBy: NonNullable<SessionRow['closed_by']>, verdict: SessionVerdict | null): SessionRow {
    const now = this.now();
    const core: SessionVerdict = verdict ?? { outcome: 'aborted', reason, at, flags: [], metrics: { coveredGapS: r.covered_gap_s, maxGapS: 0, hiddenCount: 0, clockSkewMs: r.clock_skew_ms, claimDelayS: null, lastValidContactAt: r.last_heartbeat_at } };
    tx.run(
      `UPDATE focus_session SET status = 'aborted', abort_reason = ?, abort_at = ?, server_end_at = ?, closed_by = ?, verified_min = 0, counted_min = 0,
         covered_gap_s = ?, clock_skew_ms = ?, verdict = ? WHERE id = ? AND status = 'active'`,
      [reason, at, now, closedBy, core.metrics.coveredGapS, core.metrics.clockSkewMs, JSON.stringify({ core }), r.id],
    );
    const pseudonym = this.pseudonym(tx, r.user_id);
    const elapsed = elapsedSeconds(r.server_start_at, at);
    const device = UaClass.safeParse(r.ua_class);
    this.deps.services.events.event(tx, 'session_aborted', { session_id: r.id, reden: reason, verstreken_s: elapsed, ...(device.success ? { device_class: device.data } : {}) }, { pseudonym });
    if (reason === 'heartbeat_gap') {
      const buffered = heartbeatsOf(tx, r.id).some((h) => h.buffered);
      this.deps.services.events.event(tx, 'heartbeat_gap', { session_id: r.id, gap_s: core.metrics.maxGapS, log_geleverd: buffered, log_geldig: false }, { pseudonym });
    }
    if (reason === 'hidden') this.deps.services.events.event(tx, 'visibility_hidden', { session_id: r.id, verstreken_s: elapsed }, { pseudonym });
    return loadRow(tx, r.id) as SessionRow;
  }

  /** Closes as completed: flags (H1/H3/H4, OUTAGE for review), then reconcileDay books points and goal. */
  complete(tx: Db, r: SessionRow, verdict: SessionVerdict, closedBy: NonNullable<SessionRow['closed_by']>): SessionRow {
    const practice = r.is_practice === 1;
    const codes: string[] = practice ? [] : [...verdict.flags, ...(verdict.outcome === 'review' ? ['OUTAGE'] : [])];
    const end = r.end_received_at ?? this.now();
    tx.run(
      `UPDATE focus_session SET status = 'completed', abort_reason = NULL, abort_at = NULL, verified_min = ?, server_end_at = ?, closed_by = ?,
         review_status = ?, flag_codes = ?, covered_gap_s = ?, clock_skew_ms = ?, claim_delay_s = ?, verdict = ? WHERE id = ? AND status = 'active'`,
      [practice ? 0 : r.planned_min, end, closedBy, codes.length > 0 ? 'pending' : 'none', JSON.stringify(codes), verdict.metrics.coveredGapS, verdict.metrics.clockSkewMs, verdict.metrics.claimDelayS, JSON.stringify({ core: verdict }), r.id],
    );
    for (const code of codes) {
      this.deps.services.flags.raise(tx, {
        code: code as 'H1' | 'H3' | 'H4' | 'OUTAGE',
        subject: { type: 'session', id: r.id },
        sessionIds: [r.id],
        evidence: { covered_gap_s: verdict.metrics.coveredGapS, clock_skew_ms: verdict.metrics.clockSkewMs, webdriver: r.webdriver === 1 },
      });
    }
    if (!practice) this.deps.services.ledger.reconcileDay(tx, r.user_id, r.focus_day, { type: 'session_end', sessionId: r.id });
    const after = loadRow(tx, r.id) as SessionRow;
    const pts = this.sessionPoints(tx, r.id);
    this.deps.services.events.event(
      tx,
      'session_completed',
      { session_id: r.id, minuten: after.verified_min, punten: pts.available + pts.pending, flagged: codes.length > 0, flag_codes: codes as never, claim_delay_s: verdict.metrics.claimDelayS },
      { pseudonym: this.pseudonym(tx, r.user_id) },
    );
    return after;
  }

  /** Applies a verdict if it is decisive. `final`: the end or the sweep moment has come (review settles then). */
  settle(tx: Db, r: SessionRow, now: number, closedBy: NonNullable<SessionRow['closed_by']>): SessionRow {
    if (r.status !== 'active') return r;
    const v = this.evaluate(tx, r, now);
    const graceEnd = r.planned_end_at + CURRENT_PARAMS.session.end_grace_min * MS_PER_MINUTE;
    if (v.outcome === 'aborted') return this.abort(tx, r, v.reason, v.at, closedBy, v);
    if (v.outcome === 'completed') return this.complete(tx, r, v, closedBy);
    if (v.outcome === 'review' && (r.end_received_at !== null || now >= graceEnd)) return this.complete(tx, r, v, closedBy);
    tx.run('UPDATE focus_session SET covered_gap_s = ?, clock_skew_ms = ? WHERE id = ?', [v.metrics.coveredGapS, v.metrics.clockSkewMs, r.id]);
    return loadRow(tx, r.id) as SessionRow;
  }

  /** End response (architecture §8.2), also stored for replays of the same end request (§4.7). */
  endResponse(tx: Db, r: SessionRow): EndSessionResponse {
    const pts = this.sessionPoints(tx, r.id);
    const day = this.deps.services.userDays.get(r.user_id, r.focus_day);
    const flagged = r.review_status === 'pending';
    const points = pts.available + pts.pending;
    return {
      status: r.status,
      verified_min: r.verified_min,
      counted_min: r.counted_min,
      points,
      points_status: r.status !== 'completed' || points === 0 ? 'none' : flagged || pts.pending > 0 ? 'pending' : 'available',
      flagged,
      goal_met: day?.goalMet ?? false,
      streak: null,
      earn_in_progress_min: Math.min(CURRENT_PARAMS.points.earn_in_min, earnInMinutes(tx, r.user_id)),
    };
  }

  storeEnd(tx: Db, r: SessionRow, res: EndSessionResponse): void {
    this.saveVerdict(tx, r.id, { end: res });
  }

  stop(tx: Db, r: SessionRow): StopSessionResponse {
    const now = this.now();
    const closed = this.abort(tx, r, 'user_stop', now, 'stop', null);
    const res: StopSessionResponse = { status: 'aborted', abort_reason: 'user_stop', elapsed_s: elapsedSeconds(closed.server_start_at, now) };
    this.saveVerdict(tx, r.id, { stop: res });
    return res;
  }

  /** Sweep (architecture §4.3): evaluates every active session; returns the number closed. */
  sweep(userId?: string): number {
    const now = this.now();
    const rows = userId
      ? this.deps.db.all<SessionRow>("SELECT * FROM focus_session WHERE status = 'active' AND user_id = ?", [userId])
      : this.deps.db.all<SessionRow>("SELECT * FROM focus_session WHERE status = 'active'");
    let closed = 0;
    for (const r of rows) {
      const after = this.deps.db.transaction(() => this.settle(this.deps.db, r, now, 'sweep'));
      if (after.status !== 'active') closed += 1;
    }
    return closed;
  }

  /** restore_session (architecture §4.8): aborted → completed only here, with a reason code. */
  restore(tx: Tx, sessionId: string, reason: 'outage' | 'late_log' | 'appeal_upheld', actor: Actor): RestoreResult {
    const r = loadRow(tx, sessionId);
    if (!r) throw new Error(`${sessionId}: unknown session`);
    if (r.status !== 'aborted' || r.is_practice === 1 || r.abort_reason === 'user_stop' || r.abort_reason === 'second_session') {
      return { restored: false, session: toFocusSession(r) };
    }
    const graceEnd = r.planned_end_at + CURRENT_PARAMS.session.end_grace_min * MS_PER_MINUTE;
    const v = this.evaluate(tx, { ...r, status: 'active' }, Math.max(this.now(), graceEnd));
    const ok =
      v.outcome === 'completed' ||
      (v.outcome === 'review' && reason === 'outage') ||
      (reason === 'appeal_upheld' && (r.abort_reason === 'heartbeat_gap' || r.abort_reason === 'late_end'));
    if (!ok) return { restored: false, session: toFocusSession(r) };
    const core: SessionVerdict = { outcome: 'completed', verifiedMin: r.planned_min, flags: [], metrics: v.metrics };
    tx.run(
      `UPDATE focus_session SET status = 'completed', abort_reason = NULL, abort_at = NULL, verified_min = ?, server_end_at = ?, closed_by = 'restore',
         restored_by = ?, restored_reason = ?, review_status = 'none', verdict = ? WHERE id = ?`,
      [r.planned_min, r.planned_end_at, actor, reason, JSON.stringify({ core }), r.id],
    );
    this.deps.services.ledger.reconcileDay(tx, r.user_id, r.focus_day, { type: 'restore', sessionId: r.id });
    const after = loadRow(tx, r.id) as SessionRow;
    const pts = this.sessionPoints(tx, r.id);
    this.deps.services.events.event(
      tx,
      'session_completed',
      { session_id: r.id, minuten: after.verified_min, punten: pts.available + pts.pending, flagged: false, flag_codes: [], claim_delay_s: after.claim_delay_s },
      { pseudonym: this.pseudonym(tx, r.user_id) },
    );
    return { restored: true, session: toFocusSession(after) };
  }
}
