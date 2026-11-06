// Sweep (architecture §4.3): evaluates every active session without contact, every minute. Owner WP-4.
// Registered by jobs/sweep.ts (integration wave); the day close (step 1), GET /sessions/active and
// every session route settle sessions as well.
import type { Job } from '../../jobs/scheduler.ts';
import { installWp4Services } from '../points/services.ts';

export const job: Job = {
  name: 'sweep',
  schedule: 'every minute',
  dueKey: (now) => `sweep:${now.toISOString().slice(0, 16)}`,
  defaultKey: (now) => `sweep:${now.toISOString().slice(0, 16)}`,
  async run(ctx) {
    if (!ctx.deps) throw new Error('sweep needs module deps');
    const deps = ctx.deps;
    await ctx.step('sweep', () => installWp4Services(deps).sweep());
  },
};
