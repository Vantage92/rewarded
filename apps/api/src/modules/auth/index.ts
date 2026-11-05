// Stub (WP-0). Owner: WP-3 (architecture §12.1). Replace the health route with the real routes.
import type { ApiModule } from '../../module.ts';

export const module: ApiModule = {
  name: 'auth',
  owner: 'WP-3',
  register(api) {
    api.get('/auth/health', (c) => c.json({ module: 'auth', status: 'stub' }));
  },
};
