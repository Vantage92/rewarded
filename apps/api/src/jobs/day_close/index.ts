// Day close orchestrator (architecture §6.1). Owner WP-3. Runs at closeAt(D) = 05:45 Europe/Amsterdam
// on D + 1 for focus day D. The steps are files `jobs/day_close/<nn>-<name>.ts` exporting `step`
// (the manifest is built from the folder, so a new step never edits this file); each step has one
// owner, is idempotent per day and runs through `ctx.step`, so a failed run restarts at that step.
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CURRENT_PARAMS, addDays, closeAt, focusDayOf, isVacationDay, isDay, type FocusDay } from '@rewarded/core';
import type { DayCloseContext, DayCloseStep, Job } from '../scheduler.ts';
import type { Db } from '../../db/types.ts';

/** Step owners of architecture §6.1; a step file with another owner is refused. */
export const DAY_CLOSE_OWNERS: Readonly<Record<number, string>> = {
  1: 'WP-4',
  2: 'WP-4',
  3: 'WP-3',
  4: 'WP-5',
  5: 'WP-5',
  6: 'WP-5',
  7: 'WP-6',
  8: 'WP-5',
  9: 'WP-3',
  10: 'WP-4',
  11: 'WP-6',
};

const STEP_FILE = /(?:^|\/)(\d{2})-([a-z0-9_-]+)\.ts$/;

/** Validates and orders the step modules (exported for the manifest test). */
export function buildManifest(mods: Record<string, { step?: DayCloseStep }>): DayCloseStep[] {
  const steps: DayCloseStep[] = [];
  const seen = new Set<number>();
  for (const [path, mod] of Object.entries(mods)) {
    const m = STEP_FILE.exec(path);
    if (!m) continue;
    const step = mod.step;
    if (!step) throw new Error(`Day close step ${path} exports no 'step'`);
    if (step.no !== Number(m[1])) throw new Error(`Day close step ${path} has number ${step.no}`);
    if (DAY_CLOSE_OWNERS[step.no] !== step.owner) throw new Error(`Day close step ${step.no} belongs to ${DAY_CLOSE_OWNERS[step.no] ?? 'nobody'}, not ${step.owner}`);
    if (seen.has(step.no)) throw new Error(`Duplicate day close step ${step.no}`);
    seen.add(step.no);
    steps.push(step);
  }
  return steps.sort((a, b) => a.no - b.no);
}

let cached: Promise<DayCloseStep[]> | undefined;

/** The manifest: glob under Vite/Vitest (and in the production bundle), directory scan under Node. */
export function loadDayCloseSteps(): Promise<DayCloseStep[]> {
  cached ??= (async () => {
    try {
      return buildManifest({ ...import.meta.glob<{ step?: DayCloseStep }>('./[0-9][0-9]-*.ts', { eager: true }) });
    } catch (err) {
      if (!(err instanceof TypeError)) throw err;
      const dir = dirname(fileURLToPath(import.meta.url));
      const mods: Record<string, { step?: DayCloseStep }> = {};
      for (const f of readdirSync(dir).filter((n) => STEP_FILE.test(n))) {
        const file = join(dir, f);
        if (existsSync(file)) mods[`./${f}`] = (await import(pathToFileURL(file).href)) as { step?: DayCloseStep };
      }
      return buildManifest(mods);
    }
  })();
  return cached;
}

export function dayCloseKey(day: FocusDay): string {
  return `day_close:${day}`;
}

export function dayOfKey(runKey: string): FocusDay {
  const day = runKey.replace(/^day_close:/, '');
  if (!isDay(day)) throw new Error(`Invalid day close run key ${runKey}`);
  return day;
}

/** The last focus day whose close moment has passed at `now`. */
export function lastClosableDay(now: Date): FocusDay {
  const today = focusDayOf(now.getTime(), CURRENT_PARAMS);
  const yesterday = addDays(today, -1);
  return now.getTime() >= closeAt(yesterday, CURRENT_PARAMS) ? yesterday : addDays(today, -2);
}

/** A vacation pause from params or from the vacation_pause table (set by the admin, spec §4.11). */
export function isVacation(db: Db, day: FocusDay): boolean {
  if (isVacationDay(day, CURRENT_PARAMS)) return true;
  return db.get('SELECT 1 AS x FROM vacation_pause WHERE first_day <= ? AND last_day >= ?', [day, day]) !== undefined;
}

/** The day close job; `load` is replaceable so a test can run a subset of the steps. */
export function dayCloseJob(load: () => Promise<DayCloseStep[]> = loadDayCloseSteps): Job {
  return {
    name: 'day_close',
    schedule: 'daily 05:45 Europe/Amsterdam (closeAt)',
    dueKey: (now) => dayCloseKey(lastClosableDay(now)),
    defaultKey: (now) => dayCloseKey(lastClosableDay(now)),
    async run(ctx) {
      if (!ctx.deps) throw new Error('day_close needs module deps');
      const deps = ctx.deps;
      const day = dayOfKey(ctx.runKey);
      const steps = await load();
      const dc: DayCloseContext = { day, runKey: ctx.runKey, now: ctx.now, deps, params: CURRENT_PARAMS, vacation: isVacation(deps.db, day) };
      for (const s of steps) {
        await ctx.step(`${String(s.no).padStart(2, '0')}-${s.name}`, () => s.run(dc));
      }
    },
  };
}

export const job: Job = dayCloseJob();
