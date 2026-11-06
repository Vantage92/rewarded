// Retention job (architecture §10.6). The periods run nightly as day close step 11; this job file
// makes the same run available on demand (POST /dev/jobs/retention/run) and in the job list.
// It has no own schedule, so the scheduler never runs it twice a night. Integration wave.
import { runRetention } from '../modules/fraud/lib/retention.ts';
import type { Job } from './scheduler.ts';

export const job: Job = {
  name: 'retention',
  schedule: 'nightly as day close step 11; on demand',
  defaultKey: (now) => `retention:${now.toISOString().slice(0, 16)}`,
  async run(ctx) {
    if (!ctx.deps) throw new Error('retention needs module deps');
    const deps = ctx.deps;
    await ctx.step('retention', () => runRetention(deps, ctx.now));
  },
};
