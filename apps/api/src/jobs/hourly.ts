// Hourly job (architecture §4.5, §12.3): H10 over the club links of the last 48 hours. Owner WP-6.
import { runHourlyBatch } from '../modules/fraud/lib/batch.ts';
import type { Job } from './scheduler.ts';

export function hourlyKey(now: Date): string {
  return `hourly:${now.toISOString().slice(0, 13)}`;
}

export const job: Job = {
  name: 'hourly',
  schedule: 'every hour',
  dueKey: hourlyKey,
  defaultKey: hourlyKey,
  run(ctx) {
    if (!ctx.deps) throw new Error('hourly needs module deps');
    runHourlyBatch(ctx.deps, ctx.now);
  },
};
