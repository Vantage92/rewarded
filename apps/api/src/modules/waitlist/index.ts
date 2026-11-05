// Stub (WP-0). Owner: WP-3 (architecture §12.1). Replace the health route with the real routes.
import type { ApiModule } from '../../module.ts';

export const module: ApiModule = {
  name: 'waitlist',
  owner: 'WP-3',
  register(api) {
    api.get('/waitlist/health', (c) => c.json({ module: 'waitlist', status: 'stub' }));
  },
};
