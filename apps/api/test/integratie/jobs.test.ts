// Integration wave: the sweep job (architecture §4.3) and a retention job file (§10.6) are found by
// the glob loader of the scheduler, so POST /dev/jobs/:job/run knows every job of contracts.
import { DevJobParams } from '@rewarded/contracts/dev';
import { describe, expect, it } from 'vitest';
import { loadJobs } from '../../src/jobs/scheduler.ts';

describe('arch §4.3 / §10.6 jobs in de glob-lader', () => {
  it('§4.3 sweep and §10.6 retention are registered; every dev job name exists', async () => {
    const names = (await loadJobs()).map((j) => j.name);
    expect(names).toEqual(expect.arrayContaining(['sweep', 'retention']));
    for (const n of DevJobParams.shape.job.options) expect(names).toContain(n);
  });

  it('§4.3 the sweep is due every minute with its own run key; retention has no own schedule', async () => {
    const jobs = await loadJobs();
    const sweep = jobs.find((j) => j.name === 'sweep')!;
    expect(sweep.dueKey?.(new Date('2026-12-07T10:15:30Z'))).toBe('sweep:2026-12-07T10:15');
    expect(jobs.find((j) => j.name === 'retention')!.dueKey).toBeUndefined();
  });
});
