// Sessions module (architecture §4, §8.2 "Sessies"): devices, idempotent session routes with the
// nonce chain, replays and resume, "Klopt dit niet?", restore and outages. Owner WP-4.
import { CURRENT_PARAMS, focusDayOf, isLateStart } from '@rewarded/core';
import { classifyClose, classifyHeartbeat } from '@rewarded/core/session';
import { DomainError, StartSessionRequest, routes, type HeartbeatResponse, type RouteDef } from '@rewarded/contracts';
import { z } from 'zod';
import { idsFor, sha256 } from '../../db/ids.ts';
import { adminActor } from '../../db/services/audit.ts';
import type { Db } from '../../db/types.ts';
import type { AuthState } from '../../middleware/context.ts';
import { csrfValueMatches } from '../../middleware/csrf.ts';
import { enforceRateLimit } from '../../middleware/rateLimit.ts';
import { mount, reply } from '../../middleware/route.ts';
import type { ApiModule, ModuleDeps } from '../../module.ts';
import { installWp4Services } from '../points/services.ts';
import { type SessionEngine, newNonce, sessionDto, verdictDto } from './engine.ts';
import { loadRow, storedVerdict, type SessionRow } from './repository.ts';

const P = CURRENT_PARAMS;

function userOf(auth: AuthState): { id: string; pseudonym: string } {
  if (auth.kind !== 'user') throw new DomainError('AUTH_REQUIRED');
  return { id: auth.user.id, pseudonym: auth.user.pseudonym };
}

/** The session of the caller, or NOT_FOUND (owner check, architecture §8.2). */
function ownSession(db: Db, id: string, userId: string): SessionRow {
  const r = loadRow(db, id);
  if (!r || r.user_id !== userId) throw new DomainError('NOT_FOUND');
  return r;
}

function closedError(r: SessionRow): DomainError {
  return new DomainError('SESSION_CLOSED', { verdict: verdictDto(r) });
}

/** Contract body without the refine, so practice ≠ (planned_min = 1) answers INVALID_DURATION (§8.2). */
const StartBody = z.strictObject((StartSessionRequest as unknown as z.ZodObject<z.ZodRawShape>).shape) as unknown as z.ZodType<StartSessionRequest>;
const startDef = { ...routes['sessions.start'], body: StartBody } satisfies RouteDef;

/** Installs the WP-4 services (ledger, user days, sessions) and returns the session engine. */
export function installSessionServices(deps: ModuleDeps): SessionEngine {
  return installWp4Services(deps);
}

export const module: ApiModule = {
  name: 'sessions',
  owner: 'WP-4',
  register(api, deps) {
    const engine = installSessionServices(deps);
    const { db } = deps;
    const ids = idsFor(deps.platform);

    mount(api, routes['devices.register'], ({ auth, body }) => {
      const user = userOf(auth);
      const now = deps.platform.clock.now().toISOString();
      return db.transaction(() => {
        const existing = db.get<{ id: string }>('SELECT id FROM device WHERE client_device_id = ? AND user_id = ?', [body.client_device_id, user.id]);
        if (existing) {
          db.run('UPDATE device SET last_seen_at = ?, ua_class = ?, standalone = ?, wakelock_supported = ? WHERE id = ?', [now, body.ua_class, body.standalone ? 1 : 0, body.wakelock_supported ? 1 : 0, existing.id]);
          return reply(200, { device_id: existing.id });
        }
        const id = ids.ulid();
        db.run(
          'INSERT INTO device (id, client_device_id, user_id, ua_class, standalone, wakelock_supported, first_seen_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [id, body.client_device_id, user.id, body.ua_class, body.standalone ? 1 : 0, body.wakelock_supported ? 1 : 0, now, now],
        );
        return reply(201, { device_id: id });
      });
    });

    mount(
      api,
      startDef,
      ({ c, auth, body }) => {
        const user = userOf(auth);
        if (auth.kind === 'user' && auth.user.status === 'blocked') throw new DomainError('ACCOUNT_BLOCKED');
        if (body.practice !== (body.planned_min === P.session.practice_min)) throw new DomainError('INVALID_DURATION');
        enforceRateLimit(c, { bucket: 'sessions:start', limit: 12, windowSec: 3600, key: 'user' });
        const device = db.get<{ id: string; ua_class: string }>('SELECT id, ua_class FROM device WHERE id = ? AND user_id = ?', [body.device_id, user.id]);
        if (!device) throw new DomainError('VALIDATION_FAILED', { field: 'device_id' });
        const now = engine.now();
        return db.transaction(() => {
          let active = db.get<SessionRow>("SELECT * FROM focus_session WHERE user_id = ? AND status = 'active'", [user.id]);
          if (active && active.device_id === body.device_id) {
            // Resume on the same device (§4.7): a resume contact, then the usual gap rules.
            const n = db.get<{ n: number }>("SELECT COUNT(*) AS n FROM session_heartbeat WHERE session_id = ? AND kind = 'resume'", [active.id])?.n ?? 0;
            db.run(
              "INSERT INTO session_heartbeat (session_id, seq, kind, server_recv_at, client_ts, mono_ms, visibility, wakelock, nonce_ok, buffered) VALUES (?, ?, 'resume', ?, ?, ?, 'visible', 'unsupported', 1, 0)",
              [active.id, n + 1, now, body.client_ts, body.mono_ms],
            );
            active = engine.settle(db, active, now, 'sweep');
            if (active.status === 'active') {
              const { nonce, hash } = newNonce(deps);
              // The protocol seq restarts at 1; stored rows continue after the highest seq so far (§4.7).
              db.run(
                `UPDATE focus_session SET prev_nonce_hash = nonce_hash, nonce_hash = ?, last_seq = 0, last_heartbeat_at = ?,
                   seq_offset = (SELECT coalesce(MAX(seq), 0) FROM session_heartbeat WHERE session_id = focus_session.id AND kind IN ('online', 'buffered'))
                 WHERE id = ?`,
                [hash, now, active.id],
              );
              return reply(200, { session_id: active.id, nonce, server_start_at: new Date(active.server_start_at).toISOString(), planned_end_at: new Date(active.planned_end_at).toISOString(), heartbeat_s: 30 as const, resumed: true as const });
            }
          } else if (active) {
            // A start on another device ends the running session (spec §4.1 second_session).
            engine.abort(db, active, 'second_session', now, 'second_session', null);
          }
          const id = ids.ulid();
          const { nonce, hash } = newNonce(deps);
          const plannedEnd = now + body.planned_min * 60_000;
          db.run(
            `INSERT INTO focus_session (id, user_id, device_id, planned_min, is_practice, status, server_start_at, planned_end_at, focus_day, late_start,
               nonce_hash, last_seq, start_idempotency_key, mono_start_ms, last_heartbeat_at, webdriver, standalone, ua_class, ip_hash, net_class)
             VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id, user.id, device.id, body.planned_min, body.practice ? 1 : 0, now, plannedEnd, focusDayOf(now, P), isLateStart(now, P) ? 1 : 0,
              hash, c.req.header('Idempotency-Key') ?? null, body.mono_ms, now, body.webdriver ? 1 : 0, body.standalone ? 1 : 0, device.ua_class, c.var.ipHash ?? null, c.var.netClass ?? null,
            ],
          );
          const dev = db.get<{ wakelock_supported: number }>('SELECT wakelock_supported FROM device WHERE id = ?', [device.id]);
          const uaClass = z.enum(['ios_safari', 'ios_webview', 'android_chrome', 'android_webview', 'desktop', 'other']).catch('other').parse(device.ua_class);
          deps.services.events.event(db, 'session_started', { session_id: id, duur_gepland: body.planned_min, device_class: uaClass, standalone: body.standalone, wakelock_supported: dev?.wakelock_supported === 1 }, { pseudonym: user.pseudonym });
          return reply(201, { session_id: id, nonce, server_start_at: new Date(now).toISOString(), planned_end_at: new Date(plannedEnd).toISOString(), heartbeat_s: 30 as const });
        });
      },
      { noDefaultRateLimit: true },
    );

    mount(
      api,
      routes['sessions.heartbeat'],
      ({ c, auth, params, body }) => {
        const user = userOf(auth);
        const now = engine.now();
        return db.transaction(() => {
          const r = ownSession(db, params.id, user.id);
          const cls = classifyHeartbeat({ nonceHash: r.nonce_hash, prevNonceHash: r.prev_nonce_hash, lastSeq: r.last_seq }, sha256(body.nonce), body.seq);
          // A repeat of the last seq gets the cached answer; it is no new contact (§4.7).
          if (cls === 'replay' && r.last_response) return JSON.parse(r.last_response) as HeartbeatResponse;
          if (r.status !== 'active') throw closedError(r);
          if (cls !== 'new') throw new DomainError('NONCE_INVALID');
          // Rate limit on a new seq only: one per 10 s (§4.7, §10.2).
          enforceRateLimit(c, { bucket: 'sessions:heartbeat', limit: 2, windowSec: 20, key: 'session' }, r.id);
          engine.ingest(db, r, body.events, now);
          db.run(
            `INSERT OR IGNORE INTO session_heartbeat (session_id, seq, kind, server_recv_at, client_ts, mono_ms, visibility, wakelock, nonce_ok, buffered)
             VALUES (?, ?, 'online', ?, ?, ?, ?, ?, 1, 0)`,
            [r.id, body.seq + (r.seq_offset ?? 0), now, body.client_ts, body.mono_ms, body.visibility, body.wakelock],
          );
          const { nonce, hash } = newNonce(deps);
          db.run('UPDATE focus_session SET prev_nonce_hash = nonce_hash, nonce_hash = ?, last_seq = ?, last_heartbeat_at = ? WHERE id = ?', [hash, body.seq, now, r.id]);
          const after = loadRow(db, r.id) as SessionRow;
          const v = engine.evaluate(db, after, now);
          let status: HeartbeatResponse['status'] = 'active';
          let abortReason: HeartbeatResponse['abort_reason'];
          if (v.outcome === 'aborted') {
            const closed = engine.abort(db, after, v.reason, v.at, 'events', v);
            status = closed.status;
            abortReason = v.reason;
          }
          const res: HeartbeatResponse = { nonce, server_now: new Date(now).toISOString(), status, ...(abortReason ? { abort_reason: abortReason } : {}) };
          db.run('UPDATE focus_session SET last_response = ? WHERE id = ?', [JSON.stringify(res), r.id]);
          return res;
        });
      },
      { noDefaultRateLimit: true },
    );

    mount(
      api,
      routes['sessions.events'],
      ({ c, auth, params, body }) => {
        const user = userOf(auth);
        // sendBeacon sends no headers: the CSRF token travels in the body (architecture §8.1).
        if (!csrfValueMatches(c, body.csrf ?? c.req.header('X-CSRF-Token'))) throw new DomainError('CSRF_INVALID', { reason: 'token' });
        const now = engine.now();
        return db.transaction(() => {
          const r = ownSession(db, params.id, user.id);
          const h = sha256(body.last_nonce);
          if (h !== r.nonce_hash && h !== r.prev_nonce_hash) throw new DomainError('VALIDATION_FAILED', { field: 'last_nonce' });
          // Events are deduplicated on ev_seq, so every repeat is a 202 (§4.7). A closed session still
          // stores them: a late log is what restore_session re-evaluates (§4.8).
          engine.ingest(db, r, body.events, now);
          const after = r.status === 'active' ? engine.settle(db, r, now, 'events') : r;
          // H9 (spec §6.3): the first touch after the end signal often arrives later, by beacon. The
          // claim delay of a completed session is filled from it when the end report had none.
          if (after.status === 'completed' && after.claim_delay_s === null) {
            const monoEnd = r.mono_start_ms + r.planned_min * 60_000;
            const first = body.events
              .filter((e): e is Extract<(typeof body.events)[number], { type: 'visibility' }> => e.type === 'visibility' && (e.kind === 'first_interaction_after_end' || e.kind === 'visible') && e.mono_ms >= monoEnd)
              .sort((a, b) => a.mono_ms - b.mono_ms)[0];
            if (first) db.run('UPDATE focus_session SET claim_delay_s = ? WHERE id = ? AND claim_delay_s IS NULL', [Math.round((first.mono_ms - monoEnd) / 1000), r.id]);
          }
          return reply(202, { status: after.status });
        });
      },
      { noDefaultRateLimit: true, rateLimits: [{ bucket: 'events', limit: 120, windowSec: 3600, key: 'session' }] },
    );

    mount(api, routes['sessions.end'], ({ auth, params, body }) => {
      const user = userOf(auth);
      const now = engine.now();
      return db.transaction(() => {
        const r = ownSession(db, params.id, user.id);
        const cls = classifyClose({ active: r.status === 'active', closedBy: r.closed_by }, 'end', { nonceHash: r.nonce_hash, prevNonceHash: r.prev_nonce_hash, lastSeq: r.last_seq }, sha256(body.nonce));
        if (cls === 'replay') {
          const stored = storedVerdict(r)?.end;
          if (stored) return stored as ReturnType<SessionEngine['endResponse']>;
          return engine.endResponse(db, r);
        }
        if (cls === 'closed_by_other') throw closedError(r);
        if (cls === 'invalid') throw new DomainError('NONCE_INVALID');
        engine.ingest(db, r, body.events, now);
        db.run('UPDATE focus_session SET end_received_at = ?, end_mono_ms = ?, end_client_ts = ? WHERE id = ?', [now, body.mono_ms, body.client_ts, r.id]);
        const after = engine.settle(db, loadRow(db, r.id) as SessionRow, now, 'end');
        const res = engine.endResponse(db, after);
        if (after.status !== 'active') engine.storeEnd(db, after, res);
        return res;
      });
    });

    mount(api, routes['sessions.stop'], ({ auth, params, body }) => {
      const user = userOf(auth);
      return db.transaction(() => {
        const r = ownSession(db, params.id, user.id);
        const cls = classifyClose({ active: r.status === 'active', closedBy: r.closed_by }, 'stop', { nonceHash: r.nonce_hash, prevNonceHash: r.prev_nonce_hash, lastSeq: r.last_seq }, sha256(body.nonce));
        if (cls === 'replay') {
          const stored = storedVerdict(r)?.stop;
          if (stored) return stored as ReturnType<SessionEngine['stop']>;
          throw closedError(r);
        }
        if (cls === 'closed_by_other') throw closedError(r);
        if (cls === 'invalid') throw new DomainError('NONCE_INVALID');
        return engine.stop(db, r);
      });
    });

    mount(api, routes['sessions.active'], ({ auth }) => {
      const user = userOf(auth);
      engine.sweep(user.id);
      const r = db.get<SessionRow>("SELECT * FROM focus_session WHERE user_id = ? AND status = 'active'", [user.id]);
      return r ? { session: sessionDto(r) } : {};
    });

    mount(api, routes['sessions.list'], ({ auth, query }) => {
      const user = userOf(auth);
      const limit = query.limit ?? 50;
      const cursor = query.cursor ? Number(query.cursor) : Number.MAX_SAFE_INTEGER;
      const rows = db.all<SessionRow>(
        'SELECT * FROM focus_session WHERE user_id = ? AND server_start_at < ? AND focus_day >= ? AND focus_day <= ? ORDER BY server_start_at DESC LIMIT ?',
        [user.id, Number.isFinite(cursor) ? cursor : Number.MAX_SAFE_INTEGER, query.from ?? '0000-01-01', query.to ?? '9999-12-31', limit + 1],
      );
      const page = rows.slice(0, limit);
      return { items: page.map(sessionDto), next_cursor: rows.length > limit ? String((page[page.length - 1] as SessionRow).server_start_at) : null };
    });

    mount(api, routes['sessions.get'], ({ auth, params }) => {
      const user = userOf(auth);
      const r = ownSession(db, params.id, user.id);
      const key = r.status === 'aborted' ? `sessions.abort.${r.abort_reason}` : r.review_status === 'pending' ? 'sessions.review.pending' : `sessions.status.${r.status}`;
      return { session: sessionDto(r), ...(r.abort_reason ? { abort_reason: r.abort_reason } : {}), explanation_key: key, review_status: r.review_status };
    });

    mount(api, routes['sessions.report'], ({ auth, params, body }) => {
      const user = userOf(auth);
      return db.transaction(() => {
        const r = ownSession(db, params.id, user.id);
        if (r.status !== 'aborted') throw new DomainError('SESSION_NOT_ABORTED');
        if (r.reported_at !== null) throw new DomainError('ALREADY_REPORTED');
        // "Klopt dit niet?" puts a report in the review queue (spec §3.3, §6.4); text stays in the flag.
        const flagId = deps.services.flags.raise(db, {
          code: 'USER_REPORT',
          subject: { type: 'session', id: r.id },
          sessionIds: [r.id],
          evidence: { abort_reason: r.abort_reason, ...(body.text ? { text: body.text } : {}) },
        });
        db.run('UPDATE focus_session SET reported_at = ? WHERE id = ?', [engine.now(), r.id]);
        deps.services.events.event(db, 'abort_report_submitted', { session_id: r.id, reden_gebruiker: body.text ? 'met_tekst' : 'zonder_tekst' }, { pseudonym: user.pseudonym });
        return reply(201, { flag_id: flagId });
      });
    });

    mount(api, routes['admin.sessions.restore'], ({ auth, params, body }) => {
      if (auth.kind !== 'user') throw new DomainError('AUTH_REQUIRED');
      const actor = adminActor(deps.platform.hasher, auth.user.id);
      return db.transaction(() => {
        const r = loadRow(db, params.id);
        if (!r) throw new DomainError('NOT_FOUND');
        const res = deps.services.sessions.restore(db, r.id, body.reason_code, actor);
        if (!res.restored) throw new DomainError('SESSION_NOT_RESTORABLE');
        deps.services.audit.audit(db, { actor, action: 'session_restored', objectType: 'session', objectRef: r.id, reason: body.reason_code });
        const after = loadRow(db, r.id) as SessionRow;
        return { session: sessionDto(after), verdict: verdictDto(after), flag_codes: JSON.parse(after.flag_codes) as never };
      });
    });

    mount(api, routes['admin.outages.create'], ({ auth, body }) => {
      if (auth.kind !== 'user') throw new DomainError('AUTH_REQUIRED');
      const actor = adminActor(deps.platform.hasher, auth.user.id);
      return db.transaction(() => {
        const id = ids.ulid();
        const createdAt = deps.platform.clock.now().toISOString();
        db.run('INSERT INTO outage (id, "from", "to", note, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)', [id, body.from, body.to, body.note, actor, createdAt]);
        deps.services.audit.audit(db, { actor, action: 'outage_registered', objectType: 'outage', objectRef: id });
        const from = Date.parse(body.from);
        const to = Date.parse(body.to);
        const rows = db.all<SessionRow>(
          "SELECT * FROM focus_session WHERE status = 'aborted' AND abort_reason IN ('heartbeat_gap', 'late_end') AND is_practice = 0 AND server_start_at < ? AND COALESCE(server_end_at, planned_end_at) > ?",
          [to, from],
        );
        return reply(201, {
          outage: { id, from: body.from, to: body.to, note: body.note, created_at: createdAt },
          restorable_sessions: rows.map((r) => ({ session_id: r.id, user_ref: deps.platform.hasher.hash('audit', r.user_id).slice(0, 32), focus_day: r.focus_day, abort_reason: r.abort_reason as 'heartbeat_gap' })),
        });
      });
    });
  },
};
