// Draws are not built (product plan §0c.3 and §7: "De trekkingsmodule valt eruit en blijft eruit";
// spec §3.9; architecture §7). The module registers no route at all, so nothing exists under /draws.
// The folder only stays because the WP-0 module list test still names it; the integration wave
// removes it together with packages/core/src/draws (architecture §12.5).
import type { ApiModule } from '../../module.ts';

export const module: ApiModule = {
  name: 'draws',
  owner: 'WP-6',
  register() {
    // Intentionally empty: no draw route, no beacon, no job.
  },
};
