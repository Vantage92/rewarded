// Transport for session requests (architecture §4.7, §9.5 transport.ts). A request is repeated with
// exponential waiting (1, 2, 4, 8 s, then every 10 s) until it gets an answer. A network failure
// (no response) is retried; an API error is a definitive answer and ends the loop. The caller keeps
// `seq`, nonce and Idempotency-Key fixed across attempts, so the server can recognise a repeat.
import { ApiClientError } from '@rewarded/contracts/client';
import { retryDelayMs, shouldGoOffline } from '@rewarded/core/session';
import type { Timers } from './clock.ts';

/** True when the request got no answer at all (offline, connection reset, timeout). */
export function isNetworkError(e: unknown): boolean {
  return !(e instanceof ApiClientError);
}

export interface RetryHooks {
  /** Called after every failed attempt with the number of failures so far. */
  onFailure?(failures: number, error: unknown): void;
  /** Called when the failures reach the offline threshold (3, §4.7). */
  onOffline?(): void;
  /** Called on the first success after `onOffline`. */
  onRecovered?(): void;
}

export interface RetryHandle<T> {
  readonly promise: Promise<T>;
  /** Retry now instead of waiting (the browser reported `online`). */
  kick(): void;
  /** Stop retrying; the promise rejects with RetryCancelled. */
  cancel(): void;
  readonly failures: number;
  readonly settled: boolean;
}

export class RetryCancelled extends Error {
  constructor() {
    super('retry_cancelled');
    this.name = 'RetryCancelled';
  }
}

/** Codes that mean "try again later" rather than a definitive answer. */
const TRANSIENT = new Set(['RATE_LIMITED', 'INTERNAL', 'MAINTENANCE']);

export function isTransient(e: unknown): boolean {
  return isNetworkError(e) || (e instanceof ApiClientError && TRANSIENT.has(e.code));
}

export function retry<T>(attempt: (n: number) => Promise<T>, timers: Timers, hooks: RetryHooks = {}): RetryHandle<T> {
  let failures = 0;
  let timer: unknown = null;
  let cancelled = false;
  let settled = false;
  let running = false;
  let wentOffline = false;
  let resolveP!: (v: T) => void;
  let rejectP!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolveP = res;
    rejectP = rej;
  });
  // Unhandled rejections after cancel are expected.
  promise.catch(() => undefined);

  const run = async () => {
    if (cancelled || settled || running) return;
    running = true;
    timer = null;
    try {
      const value = await attempt(failures + 1);
      running = false;
      if (cancelled) return;
      settled = true;
      if (wentOffline) hooks.onRecovered?.();
      resolveP(value);
    } catch (e) {
      running = false;
      if (cancelled) return;
      if (!isTransient(e)) {
        settled = true;
        rejectP(e);
        return;
      }
      failures++;
      hooks.onFailure?.(failures, e);
      if (!wentOffline && isNetworkError(e) && shouldGoOffline(failures)) {
        wentOffline = true;
        hooks.onOffline?.();
      }
      timer = timers.setTimeout(() => void run(), retryDelayMs(failures));
    }
  };
  void run();

  return {
    promise,
    kick() {
      if (settled || cancelled || running) return;
      if (timer !== null) timers.clearTimeout(timer);
      void run();
    },
    cancel() {
      if (settled || cancelled) return;
      cancelled = true;
      if (timer !== null) timers.clearTimeout(timer);
      rejectP(new RetryCancelled());
    },
    get failures() {
      return failures;
    },
    get settled() {
      return settled;
    },
  };
}

/** A fresh Idempotency-Key (UUID v4). */
export function newIdempotencyKey(): string {
  return uuid();
}

export function uuid(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  const b = new Uint8Array(16);
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = ((b[6] as number) & 0x0f) | 0x40;
  b[8] = ((b[8] as number) & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
