// Fake API for the WP-8 session specs (e2e/focus) and the web store tests. It follows the session
// protocol of architecture §4 with the real verifier from core (evaluateSession), the nonce chain and
// the repeat rules of §4.7, so the web app can be tested end to end while the real API is being
// built in parallel. It runs in Node (Playwright side) or in Vitest; there is no DOM here.
//
// What real integration still needs is listed in docs/build/WP-8.md: the same scenarios against
// `apps/api` with POST /dev/clock instead of `advance()`.
import { CURRENT_PARAMS } from '../../packages/core/src/params/index.ts';
import { evaluateSession } from '../../packages/core/src/session/verify.ts';
import { classifyClose, classifyHeartbeat } from '../../packages/core/src/session/retry.ts';
import type { Heartbeat, SessionVerdict, VisibilityEvent as CoreEvent } from '../../packages/core/src/session/types.ts';
import { focusDayOf, isLateStart } from '../../packages/core/src/time/index.ts';
import { matchRoute, routes, type RouteId } from '../../packages/contracts/src/routes.ts';
import { ERROR_CODES, errorBody, type ErrorCode } from '../../packages/contracts/src/errors.ts';
import { FeatureFlagKey } from '../../packages/contracts/src/common.ts';

const P = CURRENT_PARAMS;

export class FakeApiError extends Error {
  readonly code: ErrorCode;
  readonly details: Record<string, unknown> | undefined;
  constructor(code: ErrorCode, details?: Record<string, unknown>) {
    super(code);
    this.code = code;
    this.details = details;
  }
  get status(): number {
    return ERROR_CODES[this.code].http;
  }
}

interface OutboxIn {
  type: 'visibility' | 'heartbeat';
  ev_seq?: number;
  kind?: string;
  seq?: number;
  mono_ms: number;
  client_ts: number;
  visibility?: 'visible' | 'hidden';
  wakelock?: 'acquired' | 'denied' | 'released' | 'unsupported';
}

interface FakeSession {
  id: string;
  deviceId: string;
  plannedMin: 1 | 25 | 50 | 90;
  practice: boolean;
  status: 'active' | 'completed' | 'aborted';
  abortReason?: 'hidden' | 'heartbeat_gap' | 'user_stop' | 'second_session' | 'late_end';
  closedBy: 'end' | 'stop' | 'events' | 'second_session' | 'sweep' | null;
  serverStartAt: number;
  plannedEndAt: number;
  serverEndAt: number | null;
  monoStart: number;
  nonce: string;
  prevNonce: string | null;
  lastSeq: number;
  lastResponse: unknown;
  heartbeats: Heartbeat[];
  events: CoreEvent[];
  endReport?: { monoMs: number; clientTs: number; serverRecvAt: number };
  flags: string[];
  verifiedMin: number;
  idempotencyKey: string | null;
  startResponse: unknown;
  storedEnd?: unknown;
  storedStop?: unknown;
  webdriver: boolean;
  reported: boolean;
}

export interface FakeMail {
  to: string;
  code: string;
  token: string;
}

export interface FakeApiOptions {
  /** Server time at the start (ms since epoch). */
  now?: number;
  /** Signed-in state: 'student' (default), 'pre' (after login, before onboarding) or 'none'. */
  auth?: 'student' | 'pre' | 'none';
  squad?: boolean;
}

/** In-memory server; call `handle(routeId, input)`. */
export class FakeApi {
  now: number;
  auth: 'student' | 'pre' | 'none';
  squad: boolean;
  readonly sessions: FakeSession[] = [];
  readonly calls: { id: RouteId; body: unknown; at: number; idempotencyKey?: string | undefined }[] = [];
  readonly clientEvents: { name: string; props: unknown }[] = [];
  readonly inbox: FakeMail[] = [];
  readonly waitlist: unknown[] = [];
  private devices = new Map<string, string>();
  private counter = 0;
  private codes = new Map<string, { code: string; token: string; used: boolean }>();
  private onboarded: { first_name: string; daily_goal_min: number } | null = null;
  private waitlistKeys = new Set<string>();

  constructor(opts: FakeApiOptions = {}) {
    this.now = opts.now ?? Date.parse('2026-12-02T09:00:00.000Z');
    this.auth = opts.auth ?? 'student';
    this.squad = opts.squad ?? false;
  }

  advance(ms: number): void {
    this.now += ms;
  }

  private id(prefix = '01J'): string {
    this.counter++;
    // ULID-shaped (26 Crockford base32 characters).
    return `${prefix}${String(this.counter).padStart(23, '0')}`.slice(0, 26).toUpperCase();
  }

  private nonce(): string {
    this.counter++;
    return `nonce_${this.counter}_${Math.random().toString(36).slice(2, 12)}`.padEnd(20, 'x');
  }

  callsOf(id: RouteId) {
    return this.calls.filter((c) => c.id === id);
  }

  session(): FakeSession | undefined {
    return this.sessions[this.sessions.length - 1];
  }

  /** Dispatches one request. Throws FakeApiError for contract errors. */
  handle(id: RouteId, input: { params?: Record<string, string>; body?: unknown; query?: Record<string, unknown>; idempotencyKey?: string | undefined }): unknown {
    this.calls.push({ id, body: input.body, at: this.now, idempotencyKey: input.idempotencyKey });
    const body = (input.body ?? {}) as Record<string, unknown>;
    const params = input.params ?? {};
    switch (id) {
      case 'me.get':
        return this.me();
      case 'me.today':
        return this.today();
      case 'squads.presence':
        if (!this.squad) throw new FakeApiError('NOT_IN_SQUAD');
        return { members: [{ member_ref: 'mref-0001', focusing: true, remaining_min: 12 }, { member_ref: 'mref-0002', focusing: false }], polled_at: new Date(this.now).toISOString() };
      case 'events.track':
        this.clientEvents.push(body as { name: string; props: unknown });
        return undefined;
      case 'devices.register': {
        const client = String(body.client_device_id);
        let dev = this.devices.get(client);
        if (!dev) {
          dev = this.id('01D');
          this.devices.set(client, dev);
        }
        return { device_id: dev };
      }
      case 'sessions.start':
        return this.start(body, input.idempotencyKey ?? null);
      case 'sessions.heartbeat':
        return this.heartbeat(this.own(params.id), body);
      case 'sessions.events':
        return this.eventsBatch(this.own(params.id), body);
      case 'sessions.end':
        return this.end(this.own(params.id), body);
      case 'sessions.stop':
        return this.stop(this.own(params.id), body);
      case 'sessions.get': {
        const s = this.own(params.id);
        this.settle(s, 'events');
        return { session: this.dto(s), ...(s.abortReason ? { abort_reason: s.abortReason } : {}), explanation_key: `focus.result.${s.abortReason ?? s.status}`, review_status: s.flags.length ? 'pending' : 'none' };
      }
      case 'sessions.list':
        return { items: this.sessions.map((s) => this.dto(s)).reverse(), next_cursor: null };
      case 'sessions.active': {
        const s = this.sessions.find((x) => x.status === 'active');
        return s ? { session: this.dto(s) } : {};
      }
      case 'sessions.report': {
        const s = this.own(params.id);
        if (s.status !== 'aborted') throw new FakeApiError('SESSION_NOT_ABORTED');
        if (s.reported) throw new FakeApiError('ALREADY_REPORTED');
        s.reported = true;
        return { flag_id: this.id('01F') };
      }
      case 'auth.magicLink': {
        const email = String(body.email).toLowerCase();
        const code = String(100000 + ((this.counter * 7919) % 900000));
        const token = `tok_${this.nonce()}`.slice(0, 40);
        this.codes.set(email, { code, token, used: false });
        this.inbox.push({ to: email, code, token });
        this.counter++;
        return {};
      }
      case 'auth.code': {
        const entry = this.codes.get(String(body.email).toLowerCase());
        if (!entry || entry.used || entry.code !== body.code) throw new FakeApiError('CODE_INVALID');
        entry.used = true;
        if (this.auth === 'none') this.auth = this.onboarded ? 'student' : 'pre';
        return { next: this.auth === 'student' ? '/' : '/onboarding' };
      }
      case 'auth.confirm': {
        const entry = [...this.codes.values()].find((e) => e.token === body.token);
        if (!entry || entry.used) throw new FakeApiError('LINK_INVALID');
        entry.used = true;
        if (this.auth === 'none') this.auth = this.onboarded ? 'student' : 'pre';
        return { next: this.auth === 'student' ? '/' : '/onboarding' };
      }
      case 'me.onboarding': {
        const birth = String(body.birth_date);
        const age = ageAt(birth, this.now);
        if (age < 16) {
          this.auth = 'none';
          throw new FakeApiError('AGE_BELOW_MINIMUM');
        }
        const goal = Number(body.daily_goal_min);
        if ((goal === 90 || goal === 120) && body.confirm_overreach !== true) throw new FakeApiError('OVERREACH_CONFIRM_REQUIRED', { minutes: goal });
        this.onboarded = { first_name: String(body.first_name), daily_goal_min: goal };
        this.auth = 'student';
        return { user: this.user(), assignment: { unit: 'solo', arm_bonus: 'A', arm_belofte: 'early', arm_rest: 'continue', arm_prompt: 'standard', block: 'b1' } };
      }
      case 'waitlist.join': {
        if (input.idempotencyKey && this.waitlistKeys.has(input.idempotencyKey)) return {};
        if (input.idempotencyKey) this.waitlistKeys.add(input.idempotencyKey);
        this.waitlist.push(body);
        return {};
      }
      case 'invites.accept':
        return {};
      default:
        throw new FakeApiError('NOT_FOUND', { fake: 'no_handler', route: id });
    }
  }

  // ---- Auth and today ------------------------------------------------------------------------------

  private user() {
    return {
      id: '01J00000000000000000000001',
      first_name: this.onboarded?.first_name ?? 'Mila',
      last_name: null,
      email: 'mila@example.org',
      locale: 'nl' as const,
      is_team: false,
      is_admin: false,
      daily_goal_min: (this.onboarded?.daily_goal_min ?? 25) as 25,
      phone_verified: false,
      institution_domain: null,
      research_opted_out: false,
      created_at: '2026-12-01T10:00:00.000Z',
    };
  }

  private me() {
    if (this.auth === 'none') throw new FakeApiError('AUTH_REQUIRED');
    const flags = Object.fromEntries(FeatureFlagKey.options.map((k) => [k, false]));
    if (this.auth === 'pre') return { user: null, age_band: null, settings: null, flags, onboarding_complete: false };
    return {
      user: this.user(),
      age_band: '18_plus',
      settings: { compare_opt_in: false, silent_mode: false, squad_name_on_cards: false, no_points_mode: false, email_reminders: false, locale: 'nl' },
      ...(this.squad ? { squad: { id: '01J00000000000000000000002', name: 'UB-ochtendploeg', status: 'active' } } : {}),
      flags,
      onboarding_complete: true,
    };
  }

  private countedToday(): number {
    const day = focusDayOf(this.now, P);
    return this.sessions.filter((s) => s.status === 'completed' && !s.practice && focusDayOf(s.serverStartAt, P) === day).reduce((n, s) => n + s.verifiedMin, 0);
  }

  private today() {
    if (this.auth !== 'student') throw new FakeApiError('AUTH_REQUIRED');
    const counted = Math.min(P.points.daily_cap_min, this.countedToday());
    const goal = this.onboarded?.daily_goal_min ?? 25;
    return {
      focus_day: focusDayOf(this.now, P),
      counted_min: counted,
      goal_min: goal,
      goal_met: counted >= goal,
      goal_days_this_week: counted >= goal ? 3 : 2,
      exam_day: false,
      joker_available: true,
      bonus_rule: 'A',
      earn_arm: 'continue',
      streak: null,
    };
  }

  // ---- Sessions (architecture §4) -------------------------------------------------------------

  private own(id: string | undefined): FakeSession {
    const s = this.sessions.find((x) => x.id === id);
    if (!s) throw new FakeApiError('NOT_FOUND');
    return s;
  }

  private dto(s: FakeSession) {
    return {
      id: s.id,
      planned_min: s.plannedMin,
      is_practice: s.practice,
      status: s.status,
      focus_day: focusDayOf(s.serverStartAt, P),
      server_start_at: new Date(s.serverStartAt).toISOString(),
      planned_end_at: new Date(s.plannedEndAt).toISOString(),
      server_end_at: s.serverEndAt === null ? null : new Date(s.serverEndAt).toISOString(),
      verified_min: s.verifiedMin,
      counted_min: s.practice ? 0 : s.verifiedMin,
      late_start: isLateStart(s.serverStartAt, P),
      review_status: s.flags.length ? 'pending' : 'none',
    };
  }

  private verdictDto(s: FakeSession) {
    const until = s.serverEndAt ?? s.plannedEndAt;
    return {
      status: s.status === 'completed' ? 'completed' : 'aborted',
      ...(s.abortReason ? { abort_reason: s.abortReason } : {}),
      verified_min: s.verifiedMin,
      elapsed_s: Math.max(0, Math.floor((until - s.serverStartAt) / 1000)),
      flagged: s.flags.length > 0,
    };
  }

  private closed(s: FakeSession): FakeApiError {
    return new FakeApiError('SESSION_CLOSED', { verdict: this.verdictDto(s) });
  }

  private start(body: Record<string, unknown>, key: string | null) {
    if (key) {
      const same = this.sessions.find((s) => s.idempotencyKey === key);
      if (same) return same.startResponse;
    }
    const deviceId = String(body.device_id);
    const active = this.sessions.find((s) => s.status === 'active');
    if (active) {
      this.settle(active, 'sweep');
    }
    if (active && active.status === 'active' && active.deviceId === deviceId) {
      // Resume on the same device (§4.7): new nonce, a resume contact.
      active.heartbeats.push({ seq: active.heartbeats.filter((h) => h.kind === 'resume').length + 1, kind: 'resume', serverRecvAt: this.now, clientTs: Number(body.client_ts), monoMs: Number(body.mono_ms), visibility: 'visible', wakelock: 'unsupported', nonceOk: true, buffered: false });
      active.prevNonce = active.nonce;
      active.nonce = this.nonce();
      active.lastSeq = 0;
      return { session_id: active.id, nonce: active.nonce, server_start_at: new Date(active.serverStartAt).toISOString(), planned_end_at: new Date(active.plannedEndAt).toISOString(), heartbeat_s: 30, resumed: true };
    }
    if (active && active.status === 'active') this.close(active, 'aborted', 'second_session', this.now, 'second_session');
    const plannedMin = Number(body.planned_min) as FakeSession['plannedMin'];
    const s: FakeSession = {
      id: this.id('01S'),
      deviceId,
      plannedMin,
      practice: body.practice === true,
      status: 'active',
      closedBy: null,
      serverStartAt: this.now,
      plannedEndAt: this.now + plannedMin * 60_000,
      serverEndAt: null,
      monoStart: Number(body.mono_ms),
      nonce: this.nonce(),
      prevNonce: null,
      lastSeq: 0,
      lastResponse: null,
      heartbeats: [],
      events: [],
      flags: [],
      verifiedMin: 0,
      idempotencyKey: key,
      startResponse: null,
      webdriver: body.webdriver === true,
      reported: false,
    };
    s.startResponse = { session_id: s.id, nonce: s.nonce, server_start_at: new Date(s.serverStartAt).toISOString(), planned_end_at: new Date(s.plannedEndAt).toISOString(), heartbeat_s: 30 };
    this.sessions.push(s);
    return s.startResponse;
  }

  private ingest(s: FakeSession, items: readonly OutboxIn[]): void {
    for (const i of items) {
      if (i.type === 'visibility') {
        if (s.events.some((e) => e.evSeq === i.ev_seq)) continue;
        s.events.push({ evSeq: Number(i.ev_seq), kind: i.kind as CoreEvent['kind'], monoMs: i.mono_ms, clientTs: i.client_ts, serverRecvAt: this.now, buffered: true });
      } else {
        if (s.heartbeats.some((h) => h.kind === 'buffered' && h.seq === i.seq)) continue;
        s.heartbeats.push({ seq: Number(i.seq), kind: 'buffered', serverRecvAt: this.now, clientTs: i.client_ts, monoMs: i.mono_ms, visibility: i.visibility ?? 'visible', wakelock: i.wakelock ?? 'unsupported', nonceOk: false, buffered: true });
      }
    }
  }

  private evaluate(s: FakeSession): SessionVerdict {
    return evaluateSession({
      session: {
        sessionId: s.id,
        userId: 'u',
        deviceId: s.deviceId,
        plannedMin: s.plannedMin,
        isPractice: s.practice,
        serverStartAt: s.serverStartAt,
        plannedEndAt: s.plannedEndAt,
        monoStartMs: s.monoStart,
        focusDay: focusDayOf(s.serverStartAt, P),
        lateStart: isLateStart(s.serverStartAt, P),
        verificationLevel: 1,
        webdriver: s.webdriver,
        uaClass: 'other',
      },
      heartbeats: s.heartbeats,
      events: s.events,
      ...(s.endReport ? { endReport: s.endReport } : {}),
      outages: [],
      now: this.now,
      params: P.session,
    });
  }

  private close(s: FakeSession, status: 'completed' | 'aborted', reason: FakeSession['abortReason'] | undefined, at: number, by: FakeSession['closedBy'], flags: readonly string[] = []): void {
    s.status = status;
    if (reason) s.abortReason = reason;
    s.serverEndAt = at;
    s.closedBy = by;
    s.flags = [...flags];
    s.verifiedMin = status === 'completed' && !s.practice ? s.plannedMin : 0;
  }

  /** Re-evaluates an active session and closes it when the verdict is final. */
  private settle(s: FakeSession, by: FakeSession['closedBy']): void {
    if (s.status !== 'active') return;
    const v = this.evaluate(s);
    if (v.outcome === 'aborted') this.close(s, 'aborted', v.reason, v.at, by === 'end' ? 'events' : by);
    else if (v.outcome === 'completed' && by === 'end') this.close(s, 'completed', undefined, this.now, 'end', v.flags);
  }

  private heartbeat(s: FakeSession, body: Record<string, unknown>) {
    const cls = classifyHeartbeat({ nonceHash: s.nonce, prevNonceHash: s.prevNonce, lastSeq: s.lastSeq }, String(body.nonce), Number(body.seq));
    if (cls === 'replay' && s.lastResponse) return s.lastResponse;
    if (s.status !== 'active') throw this.closed(s);
    if (cls !== 'new') throw new FakeApiError('NONCE_INVALID');
    this.ingest(s, (body.events as OutboxIn[]) ?? []);
    s.heartbeats.push({ seq: Number(body.seq), kind: 'online', serverRecvAt: this.now, clientTs: Number(body.client_ts), monoMs: Number(body.mono_ms), visibility: body.visibility as 'visible', wakelock: body.wakelock as 'acquired', nonceOk: true, buffered: false });
    s.prevNonce = s.nonce;
    s.nonce = this.nonce();
    s.lastSeq = Number(body.seq);
    this.settle(s, 'events');
    const res = { nonce: s.nonce, server_now: new Date(this.now).toISOString(), status: s.status, ...(s.abortReason ? { abort_reason: s.abortReason } : {}) };
    s.lastResponse = res;
    return res;
  }

  private eventsBatch(s: FakeSession, body: Record<string, unknown>) {
    const n = String(body.last_nonce);
    if (n !== s.nonce && n !== s.prevNonce) throw new FakeApiError('VALIDATION_FAILED', { field: 'last_nonce' });
    this.ingest(s, (body.events as OutboxIn[]) ?? []);
    this.settle(s, 'events');
    return { status: s.status };
  }

  private endResponse(s: FakeSession) {
    const counted = s.practice ? 0 : s.verifiedMin;
    const flagged = s.flags.length > 0;
    return {
      status: s.status,
      verified_min: s.verifiedMin,
      counted_min: counted,
      points: counted,
      points_status: s.status !== 'completed' || counted === 0 ? 'none' : flagged ? 'pending' : 'available',
      flagged,
      goal_met: this.countedToday() >= (this.onboarded?.daily_goal_min ?? 25),
      streak: null,
      earn_in_progress_min: Math.min(P.points.earn_in_min, this.countedToday()),
    };
  }

  private end(s: FakeSession, body: Record<string, unknown>) {
    const cls = classifyClose({ active: s.status === 'active', closedBy: s.closedBy }, 'end', { nonceHash: s.nonce, prevNonceHash: s.prevNonce, lastSeq: s.lastSeq }, String(body.nonce));
    if (cls === 'replay') return s.storedEnd ?? this.endResponse(s);
    if (cls === 'closed_by_other') throw this.closed(s);
    if (cls === 'invalid') throw new FakeApiError('NONCE_INVALID');
    this.ingest(s, (body.events as OutboxIn[]) ?? []);
    s.endReport = { monoMs: Number(body.mono_ms), clientTs: Number(body.client_ts), serverRecvAt: this.now };
    this.settle(s, 'end');
    const res = this.endResponse(s);
    if (s.status !== 'active') s.storedEnd = res;
    return res;
  }

  private stop(s: FakeSession, body: Record<string, unknown>) {
    const cls = classifyClose({ active: s.status === 'active', closedBy: s.closedBy }, 'stop', { nonceHash: s.nonce, prevNonceHash: s.prevNonce, lastSeq: s.lastSeq }, String(body.nonce));
    if (cls === 'replay') {
      if (s.storedStop) return s.storedStop;
      throw this.closed(s);
    }
    if (cls === 'closed_by_other') throw this.closed(s);
    if (cls === 'invalid') throw new FakeApiError('NONCE_INVALID');
    this.close(s, 'aborted', 'user_stop', this.now, 'stop');
    s.storedStop = { status: 'aborted', abort_reason: 'user_stop', elapsed_s: Math.floor((this.now - s.serverStartAt) / 1000) };
    return s.storedStop;
  }

  // ---- HTTP adapter (Playwright) ------------------------------------------------------------------

  /** Handles a raw HTTP request; returns status and JSON body (or null for 204/202 empty). */
  http(method: string, url: string, rawBody: string | null, headers: Record<string, string>): { status: number; body: unknown } {
    const u = new URL(url);
    const path = u.pathname.replace(/^\/api\/v1/, '');
    const match = matchRoute(method as 'GET', path);
    if (!match) return { status: 404, body: errorBody('NOT_FOUND') };
    let body: unknown;
    try {
      body = rawBody ? (JSON.parse(rawBody) as unknown) : undefined;
    } catch {
      body = undefined;
    }
    const query: Record<string, unknown> = Object.fromEntries(u.searchParams.entries());
    const route = routes[match.id];
    try {
      const out = this.handle(match.id, { params: match.params, body, query, idempotencyKey: headers['idempotency-key'] });
      const status = route.status[0] ?? 200;
      return { status, body: route.responseKind === 'empty' ? null : out };
    } catch (e) {
      if (e instanceof FakeApiError) return { status: e.status, body: errorBody(e.code, e.details) };
      return { status: 500, body: errorBody('INTERNAL') };
    }
  }
}

function ageAt(birth: string, now: number): number {
  const [y, m, d] = birth.split('-').map(Number) as [number, number, number];
  const t = new Date(now);
  let age = t.getUTCFullYear() - y;
  if (t.getUTCMonth() + 1 < m || (t.getUTCMonth() + 1 === m && t.getUTCDate() < d)) age--;
  return age;
}
