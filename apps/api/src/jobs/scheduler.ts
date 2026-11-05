// Stub (WP-0). Owner WP-3. Runs day_close (05:45), week_open, hourly and retention jobs.
import type { Clock } from '../platform/types.ts';

export interface JobContext {
  /** Idempotency key of this run, e.g. 'day_close:2026-11-05'. */
  runKey: string;
  now: Date;
}

export interface Job {
  name: string;
  /** Cron-like schedule in Europe/Amsterdam; interpreted by WP-3. */
  schedule: string;
  run(ctx: JobContext): void | Promise<void>;
}

export interface Scheduler {
  register(job: Job): void;
  runNow(name: string, runKey?: string): Promise<void>;
  start(): void;
  stop(): void;
}

export function createScheduler(deps: { clock: Clock }): Scheduler {
  const jobs = new Map<string, Job>();
  return {
    register(job) {
      if (jobs.has(job.name)) throw new Error(`Job ${job.name} already registered`);
      jobs.set(job.name, job);
    },
    async runNow(name, runKey) {
      const job = jobs.get(name);
      if (!job) throw new Error(`Unknown job ${name}`);
      const now = deps.clock.now();
      await job.run({ runKey: runKey ?? `${name}:${now.toISOString()}`, now });
    },
    start() {
      // No timers yet: WP-3 adds the schedule loop.
    },
    stop() {},
  };
}
