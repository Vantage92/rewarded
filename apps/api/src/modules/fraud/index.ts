// Stub (WP-0). Owner: WP-6 (architecture §12.1). Replace the health route with the real routes.
import type { ApiModule } from '../../module.ts';

export const module: ApiModule = {
  name: 'fraud',
  owner: 'WP-6',
  register(api) {
    api.get('/fraud/health', (c) => c.json({ module: 'fraud', status: 'stub' }));
  },
};
