// Sweep (architecture §4.3): evaluates every active session without contact, every minute. Owner WP-4.
// The job file itself would live in jobs/ (not a WP-4 path in this build); wire it with
//   export { job } from '../modules/sessions/sweep.ts';
// Until then the day close (step 1), GET /sessions/active and every session route settle sessions.
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
