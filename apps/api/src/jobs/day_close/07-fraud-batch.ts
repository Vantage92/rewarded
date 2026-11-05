// Day close step 7 (architecture §6.1): batch heuristics H2, H5, H6, H7 and H12 (overlap over the
// week so far) and harm signals S1–S3. Owner WP-6. Flags only; no booking (§4.5, §10.8).
import { runDayBatch } from '../../modules/fraud/lib/batch.ts';
import type { DayCloseStep } from '../scheduler.ts';

export const step: DayCloseStep = {
  no: 7,
  name: 'fraud-batch',
  owner: 'WP-6',
  run(ctx) {
    runDayBatch(ctx.deps, ctx.day, ctx.now, ctx.params);
  },
};
