// Stub (WP-0). Owner: WP-3 (architecture §12.1). Dev-only routes (/dev/clock, /dev/inbox, ...).
// Only server.dev.ts loads this module, via modules.dev.gen.ts; the production bundle never contains it.
import type { ApiModule } from '../../module.ts';

/** Marker used by the production-bundle test to prove this module is absent. */
export const DEV_MODULE_MARKER = 'rewarded:dev-module';

export const module: ApiModule = {
  name: 'dev',
  owner: 'WP-3',
  register(api) {
    api.get('/dev/health', (c) => c.json({ module: 'dev', status: 'stub', marker: DEV_MODULE_MARKER }));
  },
};
