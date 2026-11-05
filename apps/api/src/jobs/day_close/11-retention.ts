// Day close step 11 (architecture §6.1, §10.6): retention periods. Owner WP-6. Idempotent.
import { runRetention } from '../../modules/fraud/lib/retention.ts';
import type { DayCloseStep } from '../scheduler.ts';

export const step: DayCloseStep = {
  no: 11,
  name: 'retention',
  owner: 'WP-6',
  run(ctx) {
    runRetention(ctx.deps, ctx.now);
  },
};
