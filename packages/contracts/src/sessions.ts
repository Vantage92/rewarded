// /api/v1/devices and /api/v1/sessions, plus session admin routes (architecture §4, §8.2 "Sessies").
import { z } from 'zod';
import {
  AbortReason,
  FlagCode,
  FocusDay,
  Instant,
  Minutes,
  NextCursor,
  NonNegInt,
  PageQuery,
  PlannedMin,
  Points,
  PointsStatus,
  ReviewStatus,
  RestoreReason,
  SessionStatus,
  UaClass,
  Ulid,
  Visibility,
  VisibilityEventKind,
  WakelockState,
  IdParam,
  FreeText,
} from './common.ts';
import { defineRoutes } from './route.ts';

const MonoMs = z.number().nonnegative().max(1e10);
const ClientTs = z.number().int().nonnegative();
const Nonce = z.string().regex(/^[A-Za-z0-9_-]{16,128}$/);

export const DeviceRequest = z.strictObject({
  client_device_id: z.uuid(),
  ua_class: UaClass,
  standalone: z.boolean(),
  wakelock_supported: z.boolean(),
});
export const DeviceResponse = z.strictObject({ device_id: Ulid });

/** `practice` holds exactly when `planned_min` is 1 (architecture §4.3 step 5, contract test). */
export const StartSessionRequest = z
  .strictObject({
    planned_min: PlannedMin,
    device_id: Ulid,
    practice: z.boolean(),
    client_ts: ClientTs,
    mono_ms: MonoMs,
    webdriver: z.boolean(),
    standalone: z.boolean(),
  })
  .refine((v) => v.practice === (v.planned_min === 1), { message: 'INVALID_DURATION', path: ['practice'] });
export const StartSessionResponse = z.strictObject({
  session_id: Ulid,
  nonce: Nonce,
  server_start_at: Instant,
  planned_end_at: Instant,
  heartbeat_s: z.literal(30),
  resumed: z.literal(true).optional(),
});

/** One observation from the client log (architecture §4.2). */
export const VisibilityEvent = z.strictObject({
  type: z.literal('visibility'),
  ev_seq: NonNegInt,
  kind: VisibilityEventKind,
  mono_ms: MonoMs,
  client_ts: ClientTs,
  /** pagehide/pageshow `persisted`. */
  persisted: z.boolean().optional(),
  /** Navigation type after reload (open question 2). */
  nav_type: z.enum(['navigate', 'reload', 'back_forward', 'prerender']).optional(),
});
/** Heartbeat that could not be sent online and is replayed from the outbox. */
export const BufferedHeartbeat = z.strictObject({
  type: z.literal('heartbeat'),
  seq: NonNegInt,
  mono_ms: MonoMs,
  client_ts: ClientTs,
  visibility: Visibility,
  wakelock: WakelockState,
  last_nonce: Nonce,
});
export const OutboxItem = z.discriminatedUnion('type', [VisibilityEvent, BufferedHeartbeat]);
const OutboxBatch = z.array(OutboxItem).max(2000);

export const HeartbeatRequest = z.strictObject({
  nonce: Nonce,
  seq: NonNegInt,
  mono_ms: MonoMs,
  client_ts: ClientTs,
  rtt_ms: z.number().int().min(0).max(120_000).optional(),
  visibility: Visibility,
  wakelock: WakelockState,
  events: OutboxBatch,
});
export const HeartbeatResponse = z.strictObject({
  nonce: Nonce,
  server_now: Instant,
  status: SessionStatus,
  abort_reason: AbortReason.optional(),
});

/** Beacon batch; also accepted as text/plain, so the CSRF token may travel in the body (§8.1). */
export const SessionEventsRequest = z.strictObject({
  csrf: z.string().min(16).max(128).optional(),
  last_nonce: Nonce,
  events: OutboxBatch,
});
export const SessionEventsResponse = z.strictObject({ status: SessionStatus });

export const EndSessionRequest = z.strictObject({ nonce: Nonce, mono_ms: MonoMs, client_ts: ClientTs, events: OutboxBatch });
export const EndSessionResponse = z.strictObject({
  status: SessionStatus,
  verified_min: Minutes,
  counted_min: Minutes,
  points: Points,
  points_status: PointsStatus,
  flagged: z.boolean(),
  goal_met: z.boolean(),
  /** Squad streak after this session, null without a squad. */
  streak: NonNegInt.nullable(),
  earn_in_progress_min: Minutes,
});

export const StopSessionRequest = z.strictObject({ nonce: Nonce });
export const StopSessionResponse = z.strictObject({ status: z.literal('aborted'), abort_reason: z.literal('user_stop'), elapsed_s: NonNegInt });

/** `details.verdict` of SESSION_CLOSED (architecture §4.7). */
export const SessionVerdictDto = z.strictObject({
  status: z.enum(['completed', 'aborted']),
  abort_reason: AbortReason.optional(),
  verified_min: Minutes,
  elapsed_s: NonNegInt,
  flagged: z.boolean(),
});

export const SessionDto = z.strictObject({
  id: Ulid,
  planned_min: PlannedMin,
  is_practice: z.boolean(),
  status: SessionStatus,
  focus_day: FocusDay,
  server_start_at: Instant,
  planned_end_at: Instant,
  server_end_at: Instant.nullable(),
  verified_min: Minutes,
  counted_min: Minutes,
  late_start: z.boolean(),
  review_status: ReviewStatus,
});
export const ActiveSessionResponse = z.strictObject({ session: SessionDto.optional() });
export const SessionDetailResponse = z.strictObject({
  session: SessionDto,
  abort_reason: AbortReason.optional(),
  /** i18n key for the plain-language explanation (spec §4.1 "Uitleg"). */
  explanation_key: z.string().regex(/^[a-z][a-z0-9_.]+$/).max(120),
  review_status: ReviewStatus,
});
export const SessionListQuery = PageQuery.extend({ from: FocusDay.optional(), to: FocusDay.optional() });
export const SessionListResponse = z.strictObject({ items: z.array(SessionDto), next_cursor: NextCursor });
export const SessionReportRequest = z.strictObject({ text: FreeText(1000).optional() });
export const SessionReportResponse = z.strictObject({ flag_id: Ulid });

export const AdminRestoreRequest = z.strictObject({ reason_code: RestoreReason, note: FreeText(1000) });
export const AdminRestoreResponse = z.strictObject({ session: SessionDto, verdict: SessionVerdictDto, flag_codes: z.array(FlagCode) });
export const AdminOutageRequest = z
  .strictObject({ from: Instant, to: Instant, note: FreeText(1000) })
  .refine((v) => v.from < v.to, { message: 'from_before_to', path: ['to'] });
export const AdminOutageResponse = z.strictObject({
  outage: z.strictObject({ id: Ulid, from: Instant, to: Instant, note: z.string(), created_at: Instant }),
  restorable_sessions: z.array(z.strictObject({ session_id: Ulid, user_ref: z.string().max(64), focus_day: FocusDay, abort_reason: AbortReason })),
});

const SessionId = IdParam;
export const sessionRoutes = defineRoutes({
  'devices.register': {
    module: 'sessions', method: 'POST', path: '/devices', auth: ['student'],
    body: DeviceRequest, response: DeviceResponse, responseKind: 'json', status: [200, 201],
    errors: ['VALIDATION_FAILED'], spec: 'arch §8.2, §4.2',
  },
  'sessions.start': {
    module: 'sessions', method: 'POST', path: '/sessions', auth: ['student'],
    body: StartSessionRequest, response: StartSessionResponse, responseKind: 'json', status: [201, 200], idempotencyKey: 'required',
    errors: ['INVALID_DURATION', 'ACCOUNT_BLOCKED', 'IDEMPOTENCY_CONFLICT'], spec: 'arch §8.2, §4.7',
  },
  'sessions.heartbeat': {
    module: 'sessions', method: 'POST', path: '/sessions/:id/heartbeats', auth: ['owner'],
    params: SessionId, body: HeartbeatRequest, response: HeartbeatResponse, responseKind: 'json', status: [200],
    errors: ['NONCE_INVALID', 'SESSION_CLOSED', 'RATE_LIMITED'], spec: 'arch §8.2, §4.3, §4.7',
  },
  'sessions.events': {
    module: 'sessions', method: 'POST', path: '/sessions/:id/events', auth: ['owner'],
    params: SessionId, body: SessionEventsRequest, response: SessionEventsResponse, responseKind: 'json', status: [202],
    errors: ['SESSION_CLOSED', 'VALIDATION_FAILED'], spec: 'arch §8.1, §8.2, §4.2',
  },
  'sessions.end': {
    module: 'sessions', method: 'POST', path: '/sessions/:id/end', auth: ['owner'],
    params: SessionId, body: EndSessionRequest, response: EndSessionResponse, responseKind: 'json', status: [200],
    errors: ['NONCE_INVALID', 'SESSION_CLOSED'], spec: 'arch §8.2, §4.3',
  },
  'sessions.stop': {
    module: 'sessions', method: 'POST', path: '/sessions/:id/stop', auth: ['owner'],
    params: SessionId, body: StopSessionRequest, response: StopSessionResponse, responseKind: 'json', status: [200],
    errors: ['SESSION_CLOSED'], spec: 'arch §8.2',
  },
  'sessions.active': {
    module: 'sessions', method: 'GET', path: '/sessions/active', auth: ['student'],
    response: ActiveSessionResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2, §4.8',
  },
  'sessions.get': {
    module: 'sessions', method: 'GET', path: '/sessions/:id', auth: ['owner'],
    params: SessionId, response: SessionDetailResponse, responseKind: 'json', status: [200], errors: ['NOT_FOUND'], spec: 'arch §8.2',
  },
  'sessions.list': {
    module: 'sessions', method: 'GET', path: '/sessions', auth: ['student'],
    query: SessionListQuery, response: SessionListResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2',
  },
  'sessions.report': {
    module: 'sessions', method: 'POST', path: '/sessions/:id/report', auth: ['owner'],
    params: SessionId, body: SessionReportRequest, response: SessionReportResponse, responseKind: 'json', status: [201],
    errors: ['ALREADY_REPORTED', 'SESSION_NOT_ABORTED'], spec: 'arch §8.2, spec §6.4',
  },
  'admin.sessions.restore': {
    module: 'sessions', method: 'POST', path: '/admin/sessions/:id/restore', auth: ['admin'],
    params: SessionId, body: AdminRestoreRequest, response: AdminRestoreResponse, responseKind: 'json', status: [200],
    errors: ['SESSION_NOT_RESTORABLE', 'PERIOD_LOCKED', 'REASON_REQUIRED'], spec: 'arch §8.2 Beheer, §4.8',
  },
  'admin.outages.create': {
    module: 'sessions', method: 'POST', path: '/admin/outages', auth: ['admin'],
    body: AdminOutageRequest, response: AdminOutageResponse, responseKind: 'json', status: [201], errors: [], spec: 'arch §8.2 Beheer, §4.8',
  },
});

// Inferred types (output side) for every schema above.
export type DeviceRequest = z.output<typeof DeviceRequest>;
export type DeviceResponse = z.output<typeof DeviceResponse>;
export type StartSessionRequest = z.output<typeof StartSessionRequest>;
export type StartSessionResponse = z.output<typeof StartSessionResponse>;
export type VisibilityEvent = z.output<typeof VisibilityEvent>;
export type BufferedHeartbeat = z.output<typeof BufferedHeartbeat>;
export type OutboxItem = z.output<typeof OutboxItem>;
export type HeartbeatRequest = z.output<typeof HeartbeatRequest>;
export type HeartbeatResponse = z.output<typeof HeartbeatResponse>;
export type SessionEventsRequest = z.output<typeof SessionEventsRequest>;
export type SessionEventsResponse = z.output<typeof SessionEventsResponse>;
export type EndSessionRequest = z.output<typeof EndSessionRequest>;
export type EndSessionResponse = z.output<typeof EndSessionResponse>;
export type StopSessionRequest = z.output<typeof StopSessionRequest>;
export type StopSessionResponse = z.output<typeof StopSessionResponse>;
export type SessionVerdictDto = z.output<typeof SessionVerdictDto>;
export type SessionDto = z.output<typeof SessionDto>;
export type ActiveSessionResponse = z.output<typeof ActiveSessionResponse>;
export type SessionDetailResponse = z.output<typeof SessionDetailResponse>;
export type SessionListQuery = z.output<typeof SessionListQuery>;
export type SessionListResponse = z.output<typeof SessionListResponse>;
export type SessionReportRequest = z.output<typeof SessionReportRequest>;
export type SessionReportResponse = z.output<typeof SessionReportResponse>;
export type AdminRestoreRequest = z.output<typeof AdminRestoreRequest>;
export type AdminRestoreResponse = z.output<typeof AdminRestoreResponse>;
export type AdminOutageRequest = z.output<typeof AdminOutageRequest>;
export type AdminOutageResponse = z.output<typeof AdminOutageResponse>;
