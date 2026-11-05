// Session types (frozen layer "core-types", architecture §3.2, §4.1–§4.3). Types and constants only;
// the machine, verifier and retry rules are WP-4's (core/session/{machine,verify,retry}.ts).
import type { SessionParams, VerificationLevel } from '../params/index.ts';
import type { FocusDay, Instant } from '../time/index.ts';

export type { SessionParams, VerificationLevel };

/** Planned length: 1 is the practice session, the others are spec §4.1 lengths. */
export type PlannedMin = 1 | 25 | 50 | 90;
export type SessionLengthMin = Exclude<PlannedMin, 1>;

export const SESSION_STATUSES = ['active', 'completed', 'aborted'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

/** Fixed abort codes with fixed copy (spec §4.1 "Wat telt als afgebroken"). */
export const ABORT_REASONS = ['hidden', 'heartbeat_gap', 'user_stop', 'second_session', 'late_end'] as const;
export type AbortReason = (typeof ABORT_REASONS)[number];

export const REVIEW_STATUSES = ['none', 'pending', 'released', 'rejected'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** What closed the session (architecture §3.2 `closed_by`). */
export const CLOSED_BY = ['end', 'stop', 'sweep', 'events', 'second_session', 'restore'] as const;
export type ClosedBy = (typeof CLOSED_BY)[number];

/** Reason codes for `restore_session` (architecture §4.8). */
export const RESTORE_REASONS = ['outage', 'late_log', 'appeal_upheld'] as const;
export type RestoreReason = (typeof RESTORE_REASONS)[number];

/** Client state machine states (architecture §4.1). There is no pause state, on purpose. */
export const SESSION_STATES = [
  'idle',
  'starting',
  'running',
  'running_offline',
  'ending',
  'stopping',
  'aborted_local',
  'completed',
  'aborted',
] as const;
export type SessionState = (typeof SESSION_STATES)[number];

/** Events the client state machine reacts to (architecture §4.1). Payloads are WP-4's. */
export const SESSION_MACHINE_EVENTS = [
  'START_REQUESTED',
  'STARTED',
  'RESUMED',
  'START_FAILED',
  'HIDDEN',
  'NET_LOST',
  'NET_BACK',
  'DURATION_REACHED',
  'USER_STOP',
  'SERVER_ABORT',
  'GAP_LIMIT',
  'RESULT',
  'RESET',
] as const;
export type SessionMachineEventType = (typeof SESSION_MACHINE_EVENTS)[number];

export const VISIBILITY_STATES = ['visible', 'hidden'] as const;
export type Visibility = (typeof VISIBILITY_STATES)[number];

export const WAKELOCK_STATES = ['acquired', 'denied', 'released', 'unsupported'] as const;
export type WakeLockState = (typeof WAKELOCK_STATES)[number];

export const HEARTBEAT_KINDS = ['online', 'buffered', 'resume'] as const;
export type HeartbeatKind = (typeof HEARTBEAT_KINDS)[number];

/** Kinds of `visibility_event` rows (architecture §3.2). */
export const VISIBILITY_EVENT_KINDS = [
  'visible',
  'hidden',
  'pagehide',
  'pageshow',
  'blur',
  'focus',
  'wakelock_acquired',
  'wakelock_denied',
  'wakelock_released',
  'online',
  'offline',
  'first_interaction_after_end',
] as const;
export type VisibilityEventKind = (typeof VISIBILITY_EVENT_KINDS)[number];

/** Kinds that abort a running session (spec §4.1: `hidden` or `pagehide` before the end). */
export const ABORTING_EVENT_KINDS: readonly VisibilityEventKind[] = ['hidden', 'pagehide'];

/** Heuristics evaluated at verdict time (architecture §4.3 step 6). */
export const SESSION_FLAG_CODES = ['H1', 'H3', 'H4'] as const;
export type SessionFlagCode = (typeof SESSION_FLAG_CODES)[number];

/** Fixed part of a session the verifier needs (architecture §4.3 `SessionHeader`). */
export interface SessionHeader {
  sessionId: string;
  userId: string;
  deviceId: string;
  plannedMin: PlannedMin;
  isPractice: boolean;
  serverStartAt: Instant;
  plannedEndAt: Instant;
  /** Monotonic clock reading at start (`performance.now()`), as reported by the client. */
  monoStartMs: number;
  focusDay: FocusDay;
  lateStart: boolean;
  verificationLevel: VerificationLevel;
  webdriver: boolean;
  uaClass: string;
}

/** One heartbeat as stored in `session_heartbeat` (architecture §3.2, §4.2). */
export interface Heartbeat {
  seq: number;
  kind: HeartbeatKind;
  serverRecvAt: Instant;
  /** Client wall clock; only used for skew (H4), never for points. */
  clientTs: number;
  monoMs: number;
  visibility: Visibility;
  wakelock: WakeLockState;
  /** Whether the heartbeat carried the last issued nonce; buffered heartbeats never prove contact. */
  nonceOk: boolean;
  buffered: boolean;
}

/** One `visibility_event` row (architecture §3.2). Deduplicated on (`session_id`, `evSeq`). */
export interface VisibilityEvent {
  evSeq: number;
  kind: VisibilityEventKind;
  monoMs: number;
  clientTs: number;
  serverRecvAt: Instant;
  buffered: boolean;
}

/** End report sent by the client when its monotonic clock reaches the duration (architecture §4.3). */
export interface EndReport {
  monoMs: number;
  clientTs: number;
  serverRecvAt: Instant;
}

/** Outage on our side (architecture §3.2 `outage`); gaps inside it go to review instead of aborting. */
export interface OutageWindow {
  from: Instant;
  to: Instant;
}

/** Input of `evaluateSession` (architecture §4.3). */
export interface EvaluateSessionInput {
  session: SessionHeader;
  heartbeats: readonly Heartbeat[];
  events: readonly VisibilityEvent[];
  endReport?: EndReport;
  outages: readonly OutageWindow[];
  now: Instant;
  params: SessionParams;
}

/** Measurements the verifier derives; stored on the session and in `session_summary`. */
export interface SessionMetrics {
  coveredGapS: number;
  maxGapS: number;
  hiddenCount: number;
  /** Median client − server skew; null when there were no usable heartbeats. */
  clockSkewMs: number | null;
  claimDelayS: number | null;
  /** Last valid online contact (start or heartbeat). */
  lastValidContactAt: Instant;
}

interface VerdictBase {
  flags: readonly SessionFlagCode[];
  metrics: SessionMetrics;
}

/** Outcome of `evaluateSession` (architecture §4.3): pending | completed | aborted | review(outage). */
export type SessionVerdict =
  | (VerdictBase & { outcome: 'pending' })
  | (VerdictBase & { outcome: 'completed'; verifiedMin: number })
  | (VerdictBase & { outcome: 'aborted'; reason: AbortReason; at: Instant })
  | (VerdictBase & { outcome: 'review'; cause: 'outage' });
export type Verdict = SessionVerdict;
export type VerdictOutcome = SessionVerdict['outcome'];
