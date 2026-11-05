// Stub (WP-0). Owner: WP-4 (architecture §12.1). Replace the health route with the real routes.
import type { ApiModule } from '../../module.ts';

export const module: ApiModule = {
  name: 'catalog',
  owner: 'WP-4',
  register(api) {
    api.get('/catalog/health', (c) => c.json({ module: 'catalog', status: 'stub' }));
  },
};
