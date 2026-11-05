// Clock adapter (architecture §9.5 clock.ts): monotonic time for durations, wall time only for the
// clock-skew signal (H4). Durations never use Date.now().

export interface MonoClock {
  /** Monotonic milliseconds (performance.now()); the only source for elapsed and remaining time. */
  monoNow(): number;
  /** Wall-clock milliseconds since the epoch; only sent as `client_ts` for the skew check. */
  wallNow(): number;
}

export const systemClock: MonoClock = {
  monoNow: () => performance.now(),
  wallNow: () => Date.now(),
};

/** Timer surface the platform uses, so tests (and Playwright's page.clock) can drive it. */
export interface Timers {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

export const systemTimers: Timers = {
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};
