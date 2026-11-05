// Scheduler and day close (architecture §6.1, §3.5 job_run): idempotent per run_key and restartable
// per step; steps 3 (age bands) and 9 (login statistics, clean-up); on both drivers.
import { describe, expect, it } from 'vitest';
import { createScheduler, loadJobs, type DayCloseStep, type Job } from '../../src/jobs/scheduler.ts';
import { buildManifest, dayCloseJob, dayCloseKey, lastClosableDay, loadDayCloseSteps } from '../../src/jobs/day_close/index.ts';
import { step as step03 } from '../../src/jobs/day_close/03-age-bands.ts';
import { step as step09 } from '../../src/jobs/day_close/09-auth-stats.ts';

// Only the WP-3 steps: the test database has only the WP-3 migrations.
const dayClose = dayCloseJob(async () => [step03, step09]);
import { DRIVERS, Client, lastLogin, register, seedInvite, wp3App } from './helpers.ts';

describe.each(DRIVERS)('scheduler on %s', (driver) => {
  it('§3.5: a job runs once per run_key; a second run is skipped', async () => {
    const t = wp3App(driver);
    let runs = 0;
    const s = createScheduler({ clock: t.clock, moduleDeps: t.deps });
    s.register({ name: 'count', schedule: 'test', run: () => void runs++ });
    expect((await s.runNow('count', 'count:1')).status).toBe('done');
    expect((await s.runNow('count', 'count:1')).status).toBe('skipped');
    expect((await s.runNow('count', 'count:2')).status).toBe('done');
    expect(runs).toBe(2);
    expect(t.db.all('SELECT job, run_key, status FROM job_run ORDER BY run_key')).toEqual([
      { job: 'count', run_key: 'count:1', status: 'done' },
      { job: 'count', run_key: 'count:2', status: 'done' },
    ]);
  });

  it('§6.1: a failed run restarts from the failed step; finished steps do not run again', async () => {
    const t = wp3App(driver);
    const calls: string[] = [];
    let failOnce = true;
    const job: Job = {
      name: 'steps',
      schedule: 'test',
      async run(ctx) {
        await ctx.step('01-a', () => void calls.push('a'));
        await ctx.step('02-b', () => {
          calls.push('b');
          if (failOnce) {
            failOnce = false;
            throw Object.assign(new Error('boom'), { code: 'STEP_BROKEN' });
          }
        });
        await ctx.step('03-c', () => void calls.push('c'));
      },
    };
    const s = createScheduler({ clock: t.clock, moduleDeps: t.deps });
    s.register(job);
    const first = await s.runNow('steps', 'steps:x');
    expect(first.status).toBe('failed');
    expect(first.steps['02-b']).toMatchObject({ status: 'failed', error: 'STEP_BROKEN' });
    const row = t.db.get<{ status: string; step_results: string }>('SELECT status, step_results FROM job_run')!;
    expect(row.status).toBe('failed');
    expect(Object.keys(JSON.parse(row.step_results) as object)).toEqual(['01-a', '02-b']);
    // A new scheduler (process restart) resumes from the stored step results.
    const s2 = createScheduler({ clock: t.clock, moduleDeps: t.deps });
    s2.register(job);
    expect((await s2.runNow('steps', 'steps:x')).status).toBe('done');
    expect(calls).toEqual(['a', 'b', 'b', 'c']);
    expect(t.db.get('SELECT status, attempts FROM job_run')).toEqual({ status: 'done', attempts: 2 });
    expect((await s2.runNow('steps', 'steps:x')).status).toBe('skipped');
  });

  it('tick runs a due job once; jobs are found in the jobs folder', async () => {
    const t = wp3App(driver);
    const names = (await loadJobs()).map((j) => j.name);
    expect(names).toContain('day_close');
    let runs = 0;
    const s = createScheduler({ clock: t.clock, moduleDeps: t.deps });
    s.register({ name: 'due', schedule: 'test', dueKey: () => 'due:today', run: () => void runs++ });
    await s.tick();
    await s.tick();
    expect(runs).toBe(1);
  });
});

describe('day close manifest (arch §6.1, §12.3)', () => {
  const step = (no: number, owner: string): { step: DayCloseStep } => ({ step: { no, name: 'x', owner, run: () => undefined } });
  it('orders steps by number and checks the owner of each step', () => {
    expect(buildManifest({ './09-a.ts': step(9, 'WP-3'), './03-b.ts': step(3, 'WP-3'), './index.ts': {} }).map((s) => s.no)).toEqual([3, 9]);
    expect(() => buildManifest({ './03-b.ts': step(3, 'WP-5') })).toThrow(/belongs to WP-3/);
    expect(() => buildManifest({ './04-b.ts': step(5, 'WP-5') })).toThrow(/number/);
  });
  it('loads the steps in the folder, including steps 3 and 9 of WP-3', async () => {
    const nos = (await loadDayCloseSteps()).map((s) => s.no);
    expect(nos).toEqual(expect.arrayContaining([3, 9]));
  });
  it('closes focus day D at 05:45 on D + 1 (closeAt)', () => {
    // 2026-11-06 05:44 Amsterdam (CET, UTC+1) = 04:44Z: D = 2026-11-05 not closable yet.
    expect(lastClosableDay(new Date('2026-11-06T04:44:00Z'))).toBe('2026-11-04');
    expect(lastClosableDay(new Date('2026-11-06T04:45:00Z'))).toBe('2026-11-05');
  });
});

describe.each(DRIVERS)('day close steps 3 and 9 on %s', (driver) => {
  it('step 3: the age band switches on turns_18_on; idempotent per run_key', async () => {
    const t = wp3App(driver, { start: '2026-11-05T09:00:00Z' });
    await register(t, 'minor@example.nl', '2008-11-06');
    expect(t.db.get('SELECT age_band, turns_18_on FROM user')).toEqual({ age_band: '16_17', turns_18_on: '2026-11-06' });
    const s = createScheduler({ clock: t.clock, moduleDeps: t.deps });
    s.register(dayClose);
    t.clock.set(new Date('2026-11-06T04:45:00Z'));
    const r = await s.runNow('day_close');
    expect(r).toMatchObject({ status: 'done', runKey: dayCloseKey('2026-11-05') });
    expect(Object.keys(r.steps)).toEqual(expect.arrayContaining(['03-age-bands', '09-auth-stats']));
    expect(t.db.get('SELECT age_band, turns_18_on FROM user')).toEqual({ age_band: '18_plus', turns_18_on: null });
    expect((await s.runNow('day_close')).status).toBe('skipped');
  });

  it('step 9: counts expired links for D and removes magic-link rows and pending events after 24 hours', async () => {
    const t = wp3App(driver, { start: '2026-11-05T09:00:00Z' });
    const c = new Client(t);
    await c.post('/auth/magic-link', { email: 'late@example.nl', locale: 'nl', invite_token: seedInvite(t) });
    await c.post('/auth/magic-link', { email: 'ok@example.nl', locale: 'nl', invite_token: seedInvite(t) });
    await c.post('/auth/confirm', { token: lastLogin(t, 'ok@example.nl').token });
    await c.post('/events', { name: 'squad_prompt_shown', props: { dag: 1 } });
    const s = createScheduler({ clock: t.clock, moduleDeps: t.deps });
    s.register(dayClose);
    t.clock.set(new Date('2026-11-06T04:45:00Z')); // 19h45 later: rows stay, stats are set
    await s.runNow('day_close');
    expect(t.db.get("SELECT requested, consumed_link, expired FROM auth_daily_stat WHERE day = '2026-11-05'")).toEqual({ requested: 2, consumed_link: 1, expired: 1 });
    expect(t.db.get('SELECT count(*) AS n FROM auth_magic_link')).toEqual({ n: 2 });
    t.clock.set(new Date('2026-11-07T04:45:00Z'));
    await s.runNow('day_close');
    expect(t.db.get('SELECT count(*) AS n FROM auth_magic_link')).toEqual({ n: 0 });
    expect(t.db.get('SELECT count(*) AS n FROM event_pending')).toEqual({ n: 0 });
    // The numbers of D did not change by the second close.
    expect(t.db.get("SELECT expired FROM auth_daily_stat WHERE day = '2026-11-05'")).toEqual({ expired: 1 });
  });
});
