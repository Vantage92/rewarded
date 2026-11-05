// Reminders (architecture §6.3, §8.2). Owner WP-5. The unsubscribe page posts the signed token from
// the mail; it switches email_reminders off without logging in.
import { DomainError, routes } from '@rewarded/contracts';
import { mount } from '../../middleware/route.ts';
import type { ApiModule } from '../../module.ts';
import { userOfToken } from './logic.ts';

export const module: ApiModule = {
  name: 'reminders',
  owner: 'WP-5',
  register(api, deps) {
    const { db } = deps;
    mount(
      api,
      routes['reminders.unsubscribe'],
      ({ body }) => {
        const userId = userOfToken(deps, body.token);
        if (!userId) throw new DomainError('LINK_INVALID');
        const r = db.run('UPDATE user SET email_reminders = 0 WHERE id = ?', [userId]);
        if (r.changes === 0) throw new DomainError('LINK_INVALID');
        return undefined;
      },
      { rateLimits: [] },
    );
    api.get('/reminders/health', (c) => c.json({ module: 'reminders', status: 'ok' }));
  },
};
