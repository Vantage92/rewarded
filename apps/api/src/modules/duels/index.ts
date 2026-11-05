// Stub (WP-0). Owner: WP-5 (architecture §12.1). Replace the health route with the real routes.
import type { ApiModule } from '../../module.ts';

export const module: ApiModule = {
  name: 'duels',
  owner: 'WP-5',
  register(api) {
    api.get('/duels/health', (c) => c.json({ module: 'duels', status: 'stub' }));
  },
};
