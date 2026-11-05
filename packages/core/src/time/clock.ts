// Clock interface for core consumers (architecture §2: core never calls Date.now()).
// Structurally identical to apps/api/src/platform Clock, so the platform clock satisfies it.
import type { Instant } from './zone.ts';

export interface Clock {
  /** Current server time. */
  now(): Date;
}

export function nowInstant(clock: Clock): Instant {
  return clock.now().getTime();
}

/** Deterministic clock for tests and simulations. Starts at a given instant and only moves when told. */
export class FixedClock implements Clock {
  private at: Instant;
  constructor(start: Instant | Date) {
    this.at = typeof start === 'number' ? start : start.getTime();
  }
  now(): Date {
    return new Date(this.at);
  }
  set(at: Instant | Date): void {
    this.at = typeof at === 'number' ? at : at.getTime();
  }
  advance(ms: number): void {
    this.at += ms;
  }
}
