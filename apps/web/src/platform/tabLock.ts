// One session per device across tabs (architecture §4.4 "Dubbele tabs", §9.5 tabLock.ts).
// The Web Locks API picks one owner tab; the others learn about it via a BroadcastChannel and show
// "Je sessie loopt in een ander tabblad" without starting or sending heartbeats. Without Web Locks a
// BroadcastChannel handshake stands in.

export const SESSION_LOCK = 'rw-session-owner';
const CHANNEL = 'rw-session';
const HANDSHAKE_MS = 150;

export type TabMessage = { type: 'owner' } | { type: 'released' } | { type: 'who' };

export interface TabLock {
  /** Tries to become the owner tab; false when another tab holds the session. */
  acquire(): Promise<boolean>;
  /** Gives up ownership (session over). */
  release(): void;
  owned(): boolean;
  /** True when another tab of this profile currently owns a session. */
  heldElsewhere(): Promise<boolean>;
  subscribe(listener: (msg: TabMessage) => void): () => void;
}

interface LocksLike {
  request(name: string, options: { ifAvailable: boolean }, cb: (lock: unknown) => Promise<unknown> | unknown): Promise<unknown>;
  query?(): Promise<{ held?: { name?: string }[] }>;
}

function locksApi(): LocksLike | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const l = (navigator as Navigator & { locks?: LocksLike }).locks;
  return l && typeof l.request === 'function' ? l : undefined;
}

function channel(): BroadcastChannel | null {
  try {
    return typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL);
  } catch {
    return null;
  }
}

export function createTabLock(): TabLock {
  const locks = locksApi();
  const bc = channel();
  const listeners = new Set<(m: TabMessage) => void>();
  let isOwner = false;
  let releaseLock: (() => void) | null = null;

  const post = (m: TabMessage) => {
    try {
      bc?.postMessage(m);
    } catch {
      // Channel closed: other tabs then rely on the lock query.
    }
  };
  if (bc) {
    bc.onmessage = (e: MessageEvent<TabMessage>) => {
      const m = e.data;
      if (m?.type === 'who' && isOwner) post({ type: 'owner' });
      for (const l of [...listeners]) l(m);
    };
  }

  /** Without Web Locks: ask the other tabs and wait briefly for an owner to answer. */
  const handshake = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (!bc) return resolve(false);
      let answered = false;
      const off = subscribe((m) => {
        if (m.type === 'owner') answered = true;
      });
      post({ type: 'who' });
      setTimeout(() => {
        off();
        resolve(answered);
      }, HANDSHAKE_MS);
    });

  function subscribe(listener: (m: TabMessage) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    async acquire() {
      if (isOwner) return true;
      if (!locks) {
        if (await handshake()) return false;
        isOwner = true;
        post({ type: 'owner' });
        return true;
      }
      return new Promise<boolean>((resolve) => {
        void locks
          .request(SESSION_LOCK, { ifAvailable: true }, (lock) => {
            if (!lock) {
              resolve(false);
              return undefined;
            }
            isOwner = true;
            post({ type: 'owner' });
            resolve(true);
            // Held until release(); closing or reloading the tab frees it too.
            return new Promise<void>((done) => {
              releaseLock = done;
            });
          })
          .catch(() => resolve(false));
      });
    },
    release() {
      if (!isOwner) return;
      isOwner = false;
      releaseLock?.();
      releaseLock = null;
      post({ type: 'released' });
    },
    owned: () => isOwner,
    async heldElsewhere() {
      if (isOwner) return false;
      if (locks?.query) {
        try {
          const state = await locks.query();
          return (state.held ?? []).some((l) => l.name === SESSION_LOCK);
        } catch {
          // Fall through to the handshake.
        }
      }
      return handshake();
    },
    subscribe,
  };
}
