// Wake Lock adapter (architecture §9.5 wakelock.ts, spec §4.1 "Wake Lock en tijd"). Requested at the
// start and after every return to `visible`. When the lock is released while the page is visible
// (low battery, power saving) the app warns and tries again, once per 10 seconds.
import type { Timers } from './clock.ts';

export type WakeLockState = 'acquired' | 'denied' | 'released' | 'unsupported';
/** `idle`: not requested (no session). */
export type WakeLockStatus = WakeLockState | 'idle';

export const WAKELOCK_RETRY_MS = 10_000;

/** The part of `navigator.wakeLock` we use; the test hook supplies a fake with the same shape. */
export interface WakeLockApi {
  request(type: 'screen'): Promise<WakeLockSentinelLike>;
}
export interface WakeLockSentinelLike {
  readonly released: boolean;
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
}

export interface WakeLockController {
  readonly supported: boolean;
  status(): WakeLockStatus;
  /** Ask for the lock (start of a session, return to visible). */
  request(): Promise<WakeLockStatus>;
  /** Release on purpose (session over); no retry follows. */
  release(): Promise<void>;
  subscribe(listener: (status: WakeLockStatus) => void): () => void;
}

export interface WakeLockOptions {
  api: () => WakeLockApi | undefined;
  isVisible: () => boolean;
  timers: Timers;
}

export function browserWakeLockApi(): WakeLockApi | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const wl = (navigator as Navigator & { wakeLock?: WakeLockApi }).wakeLock;
  return wl && typeof wl.request === 'function' ? wl : undefined;
}

export function createWakeLock({ api, isVisible, timers }: WakeLockOptions): WakeLockController {
  let status: WakeLockStatus = 'idle';
  let sentinel: WakeLockSentinelLike | null = null;
  let wanted = false;
  let retry: unknown = null;
  let pending: Promise<WakeLockStatus> | null = null;
  const listeners = new Set<(s: WakeLockStatus) => void>();

  const set = (next: WakeLockStatus) => {
    if (next === status) return;
    status = next;
    for (const l of [...listeners]) l(next);
  };
  const clearRetry = () => {
    if (retry !== null) timers.clearTimeout(retry);
    retry = null;
  };
  const scheduleRetry = () => {
    clearRetry();
    retry = timers.setTimeout(() => {
      retry = null;
      if (wanted && isVisible() && status !== 'acquired') void request();
      else if (wanted && status !== 'acquired') scheduleRetry();
    }, WAKELOCK_RETRY_MS);
  };

  async function attempt(): Promise<WakeLockStatus> {
    const wl = api();
    if (!wl) {
      set('unsupported');
      return status;
    }
    try {
      const s = await wl.request('screen');
      if (!wanted) {
        await s.release().catch(() => undefined);
        return status;
      }
      sentinel = s;
      s.addEventListener('release', () => {
        if (sentinel !== s) return;
        sentinel = null;
        if (!wanted) return;
        set('released');
        // Released while visible: warn (UI reads the status) and try again every 10 s.
        scheduleRetry();
      });
      clearRetry();
      set('acquired');
    } catch {
      set(status === 'released' ? 'released' : 'denied');
      if (status === 'released') scheduleRetry();
    }
    return status;
  }

  function request(): Promise<WakeLockStatus> {
    wanted = true;
    if (status === 'acquired' && sentinel && !sentinel.released) return Promise.resolve(status);
    pending ??= attempt().finally(() => {
      pending = null;
    });
    return pending;
  }

  return {
    get supported() {
      return api() !== undefined;
    },
    status: () => status,
    request,
    async release() {
      wanted = false;
      clearRetry();
      const s = sentinel;
      sentinel = null;
      set('idle');
      if (s && !s.released) await s.release().catch(() => undefined);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
