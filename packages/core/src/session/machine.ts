// Client state machine (architecture §4.1): a pure reducer (state, event) → [state, effects].
// Effects are executed by the web app (heartbeats, Wake Lock, outbox). There is no pause state.
import type { AbortReason, PlannedMin, SessionState } from './types.ts';

export interface MachineContext {
  state: SessionState;
  plannedMin: PlannedMin | null;
  sessionId: string | null;
  nonce: string | null;
  /** Monotonic reading at start; elapsed = performance.now() − monoStart. */
  monoStart: number | null;
  /** Monotonic time of the last confirmed heartbeat. */
  lastAckMono: number | null;
  idempotencyKey: string | null;
  result: { status: 'completed' | 'aborted'; abortReason?: AbortReason } | null;
  error: string | null;
}

export type MachineEvent =
  | { type: 'START_REQUESTED'; plannedMin: PlannedMin; idempotencyKey: string; mono: number }
  | { type: 'STARTED'; sessionId: string; nonce: string; mono: number }
  | { type: 'RESUMED'; sessionId: string; nonce: string; mono: number }
  | { type: 'START_FAILED'; error: string }
  | { type: 'HIDDEN'; mono: number }
  | { type: 'NET_LOST' }
  | { type: 'NET_BACK' }
  | { type: 'HEARTBEAT_ACK'; nonce: string; mono: number }
  | { type: 'DURATION_REACHED'; mono: number }
  | { type: 'USER_STOP' }
  | { type: 'SERVER_ABORT'; reason: AbortReason }
  | { type: 'GAP_LIMIT' }
  | { type: 'RESULT'; status: 'completed' | 'aborted'; abortReason?: AbortReason }
  | { type: 'RESET' };

export type MachineEffect =
  | { type: 'request_start'; idempotencyKey: string; plannedMin: PlannedMin }
  | { type: 'request_wakelock' }
  | { type: 'start_heartbeats' }
  | { type: 'stop_heartbeats' }
  | { type: 'retry_pending_heartbeat' }
  | { type: 'flush_outbox' }
  | { type: 'buffer_to_outbox' }
  | { type: 'send_beacon_hidden' }
  | { type: 'send_end' }
  | { type: 'send_stop' }
  | { type: 'show_result' };

export const INITIAL_CONTEXT: MachineContext = Object.freeze({
  state: 'idle',
  plannedMin: null,
  sessionId: null,
  nonce: null,
  monoStart: null,
  lastAckMono: null,
  idempotencyKey: null,
  result: null,
  error: null,
});

/** Offline limit in ms: 5 minutes since the last confirmed heartbeat (architecture §4.1 GAP_LIMIT). */
export function gapLimitReached(ctx: MachineContext, mono: number, gapCoveredMaxS: number): boolean {
  return ctx.lastAckMono !== null && mono - ctx.lastAckMono > gapCoveredMaxS * 1000;
}

/** Remaining ms shown to the student, from the monotonic clock only (architecture §4.2). */
export function remainingMs(ctx: MachineContext, mono: number): number {
  if (ctx.monoStart === null || ctx.plannedMin === null) return 0;
  return Math.max(0, ctx.plannedMin * 60_000 - (mono - ctx.monoStart));
}

type Step = [MachineContext, MachineEffect[]];

const same = (ctx: MachineContext): Step => [ctx, []];

/** The reducer. Unknown transitions leave the state unchanged and produce no effects. */
export function reduce(ctx: MachineContext, ev: MachineEvent): Step {
  const s = ctx.state;
  if (ev.type === 'RESET') return s === 'completed' || s === 'aborted' ? [INITIAL_CONTEXT, []] : same(ctx);
  switch (s) {
    case 'idle':
      if (ev.type === 'START_REQUESTED') {
        return [
          { ...INITIAL_CONTEXT, state: 'starting', plannedMin: ev.plannedMin, idempotencyKey: ev.idempotencyKey },
          [{ type: 'request_start', idempotencyKey: ev.idempotencyKey, plannedMin: ev.plannedMin }],
        ];
      }
      return same(ctx);
    case 'starting':
      if (ev.type === 'STARTED' || ev.type === 'RESUMED') {
        return [
          { ...ctx, state: 'running', sessionId: ev.sessionId, nonce: ev.nonce, monoStart: ctx.monoStart ?? ev.mono, lastAckMono: ev.mono },
          [{ type: 'request_wakelock' }, { type: 'start_heartbeats' }],
        ];
      }
      if (ev.type === 'START_FAILED') return [{ ...INITIAL_CONTEXT, error: ev.error }, []];
      return same(ctx);
    case 'running':
    case 'running_offline': {
      const offline = s === 'running_offline';
      switch (ev.type) {
        case 'HIDDEN':
          return [{ ...ctx, state: 'aborted_local' }, [{ type: 'stop_heartbeats' }, { type: 'send_beacon_hidden' }]];
        case 'NET_LOST':
          return offline ? same(ctx) : [{ ...ctx, state: 'running_offline' }, [{ type: 'buffer_to_outbox' }]];
        case 'NET_BACK':
          // First repeat the open heartbeat to get the valid nonce, then flush the outbox (§4.7).
          return offline ? [{ ...ctx, state: 'running' }, [{ type: 'retry_pending_heartbeat' }, { type: 'flush_outbox' }]] : same(ctx);
        case 'HEARTBEAT_ACK':
          return [{ ...ctx, nonce: ev.nonce, lastAckMono: ev.mono }, []];
        case 'DURATION_REACHED':
          return [{ ...ctx, state: 'ending' }, [{ type: 'stop_heartbeats' }, { type: 'send_end' }]];
        case 'USER_STOP':
          return offline ? same(ctx) : [{ ...ctx, state: 'stopping' }, [{ type: 'stop_heartbeats' }, { type: 'send_stop' }]];
        case 'SERVER_ABORT':
          return offline ? same(ctx) : [{ ...ctx, state: 'aborted', result: { status: 'aborted', abortReason: ev.reason } }, [{ type: 'stop_heartbeats' }, { type: 'show_result' }]];
        case 'GAP_LIMIT':
          return offline ? [{ ...ctx, state: 'aborted_local' }, [{ type: 'stop_heartbeats' }, { type: 'show_result' }]] : same(ctx);
        default:
          return same(ctx);
      }
    }
    case 'ending':
    case 'stopping':
    case 'aborted_local':
      if (ev.type === 'RESULT') {
        const status = s === 'stopping' || s === 'aborted_local' ? 'aborted' : ev.status;
        const abortReason = s === 'stopping' ? 'user_stop' : ev.abortReason;
        return [
          { ...ctx, state: status, result: abortReason ? { status, abortReason } : { status } },
          [{ type: 'show_result' }],
        ];
      }
      return same(ctx);
    default:
      return same(ctx);
  }
}
