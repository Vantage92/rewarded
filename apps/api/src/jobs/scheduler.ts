// Scheduler (architecture §6.1, §3.5 job_run). Owner WP-3.
// A job runs at most once successfully per (job, run_key); a failed run restarts from the failed
// step (`ctx.step`). Jobs are files `jobs/<name>.ts` or `jobs/<name>/index.ts` exporting `job`,
// loaded by `loadJobs()` (glob under Vite/Vitest, directory scan under plain Node), so no job edits
// a shared list. The tick only decides *when*; idempotency comes from job_run.
import { readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Params } from '@rewarded/core';
import type { FocusDay } from '@rewarded/core';
import type { Db } from '../db/types.ts';
import type { Logger } from '../platform/log.ts';
import type { ModuleDeps } from '../module.ts';
import type { Clock } from '../platform/types.ts';

export interface JobContext {
  /** Idempotency key of this run, e.g. 'day_close:2026-11-05'. */
  runKey: string;
  now: Date;
  /** Present when the scheduler was created with module deps (always in the servers). */
  deps?: ModuleDeps;
  /** Runs `fn` once per run: a step that finished in an earlier attempt is skipped. */
  step<T>(name: string, fn: () => T | Promise<T>): Promise<T | undefined>;
}

export interface Job {
  name: string;
  /** Human-readable schedule in Europe/Amsterdam, e.g. 'daily 05:45' (documentation). */
  schedule: string;
  /** Run key that is due at `now`, or null. The scheduler runs it once; job_run makes it idempotent. */
  dueKey?(now: Date): string | null;
  /** Default run key for POST /dev/jobs/:job/run without run_key. */
  defaultKey?(now: Date): string;
  run(ctx: JobContext): void | Promise<void>;
}

export type JobRunStatus = 'done' | 'skipped' | 'failed';
export interface JobRunResult {
  status: JobRunStatus;
  runKey: string;
  steps: Record<string, StepResult>;
}
export interface StepResult {
  status: 'done' | 'failed';
  at: string;
  error?: string;
}

export interface Scheduler {
  register(job: Job): void;
  runNow(name: string, runKey?: string): Promise<JobRunResult>;
  /** Runs every due job once (called by the timer, and by tests). */
  tick(): Promise<void>;
  start(intervalMs?: number): void;
  stop(): void;
  jobNames(): string[];
}

/** Steps of the day close (architecture §6.1): files jobs/day_close/<nn>-<name>.ts exporting `step`. */
export interface DayCloseContext {
  /** Focus day D being closed. */
  day: FocusDay;
  runKey: string;
  now: Date;
  deps: ModuleDeps;
  params: Params;
  /** D lies in a vacation pause: goal postings and steps 4–6 are skipped (spec §4.4, §4.11). */
  vacation: boolean;
}
export interface DayCloseStep {
  /** Step number of §6.1 (1–11). */
  no: number;
  name: string;
  owner: string;
  run(ctx: DayCloseContext): void | Promise<void>;
}

export interface SchedulerDeps {
  clock: Clock;
  /** Without db the scheduler keeps no job_run (WP-0 behaviour, for unit tests). */
  db?: Db;
  moduleDeps?: ModuleDeps;
  logger?: Logger;
}

interface JobRunRow {
  status: 'running' | 'done' | 'failed';
  step_results: string;
}

export function createScheduler(deps: SchedulerDeps): Scheduler {
  const jobs = new Map<string, Job>();
  const running = new Set<string>();
  let timer: ReturnType<typeof setInterval> | undefined;
  const db = deps.db ?? deps.moduleDeps?.db;

  async function runNow(name: string, runKey?: string): Promise<JobRunResult> {
    const job = jobs.get(name);
    if (!job) throw new Error(`Unknown job ${name}`);
    const now = deps.clock.now();
    const key = runKey ?? job.defaultKey?.(now) ?? `${name}:${now.toISOString()}`;
    const lock = `${name}|${key}`;
    if (running.has(lock)) return { status: 'skipped', runKey: key, steps: {} };

    let steps: Record<string, StepResult> = {};
    if (db) {
      const row = db.get<JobRunRow>('SELECT status, step_results FROM job_run WHERE job = ? AND run_key = ?', [name, key]);
      if (row?.status === 'done') return { status: 'skipped', runKey: key, steps: JSON.parse(row.step_results) as Record<string, StepResult> };
      steps = row ? (JSON.parse(row.step_results) as Record<string, StepResult>) : {};
      db.run(
        `INSERT INTO job_run (job, run_key, status, started_at, attempts, step_results) VALUES (?, ?, 'running', ?, 1, ?)
         ON CONFLICT (job, run_key) DO UPDATE SET status = 'running', started_at = excluded.started_at, finished_at = NULL, attempts = attempts + 1`,
        [name, key, now.toISOString(), JSON.stringify(steps)],
      );
    }
    const persist = () => {
      if (db) db.run('UPDATE job_run SET step_results = ? WHERE job = ? AND run_key = ?', [JSON.stringify(steps), name, key]);
    };
    running.add(lock);
    try {
      await job.run({
        runKey: key,
        now,
        ...(deps.moduleDeps ? { deps: deps.moduleDeps } : {}),
        async step(stepName, fn) {
          if (steps[stepName]?.status === 'done') return undefined;
          try {
            const r = await fn();
            steps[stepName] = { status: 'done', at: deps.clock.now().toISOString() };
            persist();
            return r;
          } catch (err) {
            steps[stepName] = { status: 'failed', at: deps.clock.now().toISOString(), error: errorCode(err) };
            persist();
            throw err;
          }
        },
      });
      if (db) db.run("UPDATE job_run SET status = 'done', finished_at = ? WHERE job = ? AND run_key = ?", [deps.clock.now().toISOString(), name, key]);
      deps.logger?.log('info', 'job_done', { route: `/jobs/${name}` });
      return { status: 'done', runKey: key, steps };
    } catch (err) {
      if (db) db.run("UPDATE job_run SET status = 'failed', finished_at = ? WHERE job = ? AND run_key = ?", [deps.clock.now().toISOString(), name, key]);
      deps.logger?.log('error', 'job_failed', { route: `/jobs/${name}`, error_code: errorCode(err), stack: err instanceof Error ? (err.stack ?? '') : '' });
      return { status: 'failed', runKey: key, steps };
    } finally {
      running.delete(lock);
    }
  }

  return {
    register(job) {
      if (jobs.has(job.name)) throw new Error(`Job ${job.name} already registered`);
      jobs.set(job.name, job);
    },
    runNow,
    async tick() {
      const now = deps.clock.now();
      for (const job of jobs.values()) {
        const key = job.dueKey?.(now);
        if (key) await runNow(job.name, key);
      }
    },
    start(intervalMs = 30_000) {
      if (timer) return;
      timer = setInterval(() => void this.tick(), intervalMs);
      timer.unref?.();
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = undefined;
    },
    jobNames() {
      return [...jobs.keys()].sort();
    },
  };
}

function errorCode(err: unknown): string {
  const code = (err as { code?: unknown })?.code;
  if (typeof code === 'string' && /^[A-Z][A-Z0-9_]{1,63}$/.test(code)) return code;
  return 'JOB_STEP_FAILED';
}

/**
 * Loads every job module of this folder: `jobs/<name>.ts` (except this file) and
 * `jobs/<name>/index.ts`, each exporting `job`.
 */
export async function loadJobs(): Promise<Job[]> {
  let mods: Record<string, { job?: Job }>;
  try {
    mods = { ...import.meta.glob<{ job?: Job }>(['./*.ts', '!./scheduler.ts', '!./*.test.ts', './*/index.ts'], { eager: true }) };
  } catch {
    mods = await importDir(dirname(fileURLToPath(import.meta.url)));
  }
  return Object.entries(mods)
    .filter(([path]) => !path.endsWith('/scheduler.ts') && !path.endsWith('.d.ts') && !path.endsWith('.test.ts'))
    .map(([, m]) => m.job)
    .filter((j): j is Job => j !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function importDir(dir: string): Promise<Record<string, { job?: Job }>> {
  const out: Record<string, { job?: Job }> = {};
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    let file: string | undefined;
    if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts') && entry.name !== 'scheduler.ts') file = join(dir, entry.name);
    if (entry.isDirectory() && existsSync(join(dir, entry.name, 'index.ts'))) file = join(dir, entry.name, 'index.ts');
    if (file) out[`./${file.slice(dir.length + 1)}`] = (await import(pathToFileURL(file).href)) as { job?: Job };
  }
  return out;
}

/** Scheduler with every job of this folder registered, ticking every 30 s (used by the servers). */
export async function startScheduler(moduleDeps: ModuleDeps, logger?: Logger): Promise<Scheduler> {
  const s = createScheduler({ clock: moduleDeps.platform.clock, moduleDeps, ...(logger ? { logger } : {}) });
  for (const j of await loadJobs()) s.register(j);
  s.start();
  return s;
}
