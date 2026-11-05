// Retry rules for repeated requests and lost responses (architecture §4.7). Shared by client and server.

/** Client backoff in ms for attempt n (1-based): 1, 2, 4, 8 s, then every 10 s. */
export function retryDelayMs(attempt: number): number {
  const schedule = [1000, 2000, 4000, 8000];
  if (attempt < 1) return 0;
  return schedule[attempt - 1] ?? 10_000;
}

/** After this many failed attempts the client goes to running_offline (architecture §4.7). */
export const OFFLINE_AFTER_FAILURES = 3;

export function shouldGoOffline(failedAttempts: number): boolean {
  return failedAttempts >= OFFLINE_AFTER_FAILURES;
}

/** Server-side nonce state of a session: hashes only (architecture §4.3 step 1). */
export interface NonceState {
  nonceHash: string;
  prevNonceHash: string | null;
  lastSeq: number;
}

export type HeartbeatClass = 'new' | 'replay' | 'invalid';

/**
 * Classifies an online heartbeat (architecture §4.7 table): the current nonce with seq = last + 1 is
 * new; the previous nonce with seq = last_seq is a replay (cached answer); anything else is invalid.
 */
export function classifyHeartbeat(state: NonceState, nonceHash: string, seq: number): HeartbeatClass {
  if (nonceHash === state.nonceHash && seq === state.lastSeq + 1) return 'new';
  if (state.prevNonceHash !== null && nonceHash === state.prevNonceHash && seq === state.lastSeq) return 'replay';
  return 'invalid';
}

export type CloseRequestClass = 'first' | 'replay' | 'closed_by_other' | 'invalid';

/**
 * Classifies an end or stop request (architecture §4.7): on an active session with the current nonce
 * it is the first; on a session closed by this same kind of request it is a replay (stored verdict);
 * on a session closed by something else it is SESSION_CLOSED with the verdict in the details.
 */
export function classifyClose(
  session: { active: boolean; closedBy: string | null },
  kind: 'end' | 'stop',
  state: NonceState,
  nonceHash: string,
): CloseRequestClass {
  if (!session.active) {
    const sameKind = session.closedBy === kind;
    const knownNonce = nonceHash === state.nonceHash || nonceHash === state.prevNonceHash;
    return sameKind && knownNonce ? 'replay' : 'closed_by_other';
  }
  if (nonceHash === state.nonceHash || nonceHash === state.prevNonceHash) return 'first';
  return 'invalid';
}
