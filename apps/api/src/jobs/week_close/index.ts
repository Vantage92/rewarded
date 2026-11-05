// Week close orchestrator (architecture §6.1): Monday 05:45 Europe/Amsterdam, after the day close of
// Sunday. Steps are the files of this folder that export `step` (WeekCloseStep), run in file-name
// order: the coverage alarm (WP-4) and fraud-weekly (WP-6). WP-4 left this orchestrator to WP-6.
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CURRENT_PARAMS, addDays, closeAt, focusDayOf, isoWeekday, weekKey, type FocusDay } from '@rewarded/core';
import type { Job } from '../scheduler.ts';
import type { WeekCloseStep } from './coverage-alarm.ts';

const STEP_FILE = /(?:^|\/)([a-z0-9-]+)\.ts$/;

export function buildWeekManifest(mods: Record<string, { step?: WeekCloseStep }>): WeekCloseStep[] {
  return Object.entries(mods)
    .filter(([path, m]) => STEP_FILE.test(path) && !path.endsWith('/index.ts') && m.step !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, m]) => m.step as WeekCloseStep);
}

let cached: Promise<WeekCloseStep[]> | undefined;
export function loadWeekCloseSteps(): Promise<WeekCloseStep[]> {
  cached ??= (async () => {
    try {
      return buildWeekManifest({ ...import.meta.glob<{ step?: WeekCloseStep }>(['./*.ts', '!./index.ts'], { eager: true }) });
    } catch (err) {
      if (!(err instanceof TypeError)) throw err;
      const dir = dirname(fileURLToPath(import.meta.url));
      const mods: Record<string, { step?: WeekCloseStep }> = {};
      for (const f of readdirSync(dir).filter((n) => n.endsWith('.ts') && n !== 'index.ts' && !n.endsWith('.d.ts'))) {
        const file = join(dir, f);
        if (existsSync(file)) mods[`./${f}`] = (await import(pathToFileURL(file).href)) as { step?: WeekCloseStep };
      }
      return buildWeekManifest(mods);
    }
  })();
  return cached;
}

/** Run key of the week close that starts the week `monday`. */
export function weekCloseKey(monday: FocusDay): string {
  return `week_close:${monday}`;
}

/** Due once the day close of Sunday can have run (closeAt of Sunday, 05:45 on Monday). */
export function dueWeekClose(now: Date): string | null {
  const today = focusDayOf(now.getTime(), CURRENT_PARAMS);
  const monday = weekKey(today, CURRENT_PARAMS.time.week_start_iso_weekday);
  const sunday = addDays(monday, -1);
  if (isoWeekday(today) === CURRENT_PARAMS.time.week_start_iso_weekday && now.getTime() < closeAt(sunday, CURRENT_PARAMS)) return null;
  return weekCloseKey(monday);
}

export function weekCloseJob(load: () => Promise<WeekCloseStep[]> = loadWeekCloseSteps): Job {
  return {
    name: 'week_close',
    schedule: 'Monday 05:45 Europe/Amsterdam, after the day close of Sunday',
    dueKey: dueWeekClose,
    defaultKey: (now) => weekCloseKey(weekKey(focusDayOf(now.getTime(), CURRENT_PARAMS), CURRENT_PARAMS.time.week_start_iso_weekday)),
    async run(ctx) {
      if (!ctx.deps) throw new Error('week_close needs module deps');
      const monday = ctx.runKey.replace(/^week_close:/, '');
      // The day close of Sunday goes first (its H12 and harm signals feed the week close).
      const sunday = ctx.deps.db.get<{ status: string }>("SELECT status FROM job_run WHERE job = 'day_close' AND run_key = ?", [`day_close:${addDays(monday, -1)}`]);
      if (sunday && sunday.status !== 'done') throw Object.assign(new Error('day close of Sunday not done'), { code: 'DAY_CLOSE_PENDING' });
      for (const s of await load()) await ctx.step(s.name, () => s.run({ deps: ctx.deps!, now: ctx.now, week: monday }));
    },
  };
}

export const job: Job = weekCloseJob();
