// Privacy module (WP-6; architecture §8.2, §10.7; spec §4.10). Owner WP-6.
// GET /me/export (one JSON file, a section per module), DELETE /me (one transaction over every
// registered eraser, then the WP-3 rows and the events) and DELETE /admin/users/:id (four eyes).
import { DomainError, routes, type RouteDef } from '@rewarded/contracts';
import { z } from 'zod';
import { mount, reply } from '../../middleware/route.ts';
import type { ApiModule } from '../../module.ts';
import { fourEyes } from '../admin/index.ts';
import { installWp6Services } from '../fraud/lib/install.ts';
import { deleteAccount, exportAccount } from '../fraud/lib/privacy.ts';
import { actorOf, ref, studentOf } from '../fraud/lib/util.ts';

// Local body schema so a wrong confirmation answers CONFIRMATION_REQUIRED instead of VALIDATION_FAILED;
// the wire format stays the one of contracts.
const deleteMe: RouteDef = { ...routes['privacy.deleteMe'], body: z.strictObject({ confirm: z.string().max(64) }) };

export const module: ApiModule = {
  name: 'privacy',
  owner: 'WP-6',
  register(api, deps) {
    installWp6Services(deps);
    const { db } = deps;

    mount(
      api,
      routes['privacy.export'],
      ({ auth, c }) => {
        const user = studentOf(auth);
        const body = { format: 'rewarded-export-v1' as const, generated_at: deps.platform.clock.now().toISOString(), modules: exportAccount(deps, user.id) };
        c.header('Content-Disposition', 'attachment; filename="rewarded-export.json"');
        return body;
      },
      { rateLimits: [{ bucket: 'privacy:export', limit: 5, windowSec: 3600, key: 'user' }] },
    );

    mount(api, deleteMe, ({ auth, body }) => {
      const user = studentOf(auth);
      if ((body as { confirm: string }).confirm !== 'VERWIJDER') throw new DomainError('CONFIRMATION_REQUIRED');
      const at = deps.platform.clock.now().toISOString();
      db.transaction(() => deleteAccount(deps, db, user.id, 'system'));
      return reply(202, { deleted_at: at });
    });

    mount(api, routes['admin.users.delete'], ({ auth, params }) => {
      const actor = actorOf(deps, auth);
      if (!db.get('SELECT 1 AS x FROM user WHERE id = ?', [params.id])) throw new DomainError('NOT_FOUND');
      // Deletion by an admin needs a second admin (architecture §8.2); the request is kept first.
      const target = ref(deps, params.id);
      let confirmed = false;
      db.transaction(() => {
        confirmed = fourEyes(deps, db, 'user_delete', target, 'delete', actor);
      });
      if (!confirmed) throw new DomainError('FOUR_EYES_REQUIRED', { pending: true });
      const at = deps.platform.clock.now().toISOString();
      db.transaction(() => deleteAccount(deps, db, params.id, actor));
      return reply(202, { deleted_at: at });
    });
  },
};
