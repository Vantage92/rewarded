// Client events and the Plus fake door (architecture §8.1, §8.2; spec §7.1). Owner WP-3.
// POST /events accepts only active client events of the taxonomy (the route schema refuses the
// rest); events of pre users go to event_pending under the pre pseudonym.
import { DomainError, isClientEventName, routes, type ActiveEventName, type EventProps } from '@rewarded/contracts';
import { isFeatureEnabled } from '../../db/flags.ts';
import { RATE_LIMITS } from '../../middleware/rateLimit.ts';
import { mount } from '../../middleware/route.ts';
import type { ApiModule } from '../../module.ts';

export const module: ApiModule = {
  name: 'events',
  owner: 'WP-3',
  register(api, deps) {
    const { db, services } = deps;

    api.get('/events/health', (c) => c.json({ module: 'events', status: 'ok' }));

    // Unknown names fail the discriminated union; this hook turns that into UNKNOWN_EVENT.
    api.post('/events', async (c, next) => {
      if (c.var.auth.kind === 'none') return next();
      const raw = (await c.req.raw.clone().json().catch(() => null)) as { name?: unknown } | null;
      if (raw && typeof raw.name === 'string' && !isClientEventName(raw.name)) throw new DomainError('UNKNOWN_EVENT');
      await next();
    });

    mount(
      api,
      routes['events.track'],
      ({ auth, body }) => {
        const name = body.name as ActiveEventName;
        const props = body.props as EventProps<typeof name>;
        db.transaction(() => {
          if (auth.kind === 'pre') services.events.clientEvent(db, name, props, { pseudonym: auth.prePseudonym, pre: true });
          else if (auth.kind === 'user') services.events.clientEvent(db, name, props, { pseudonym: auth.user.pseudonym });
        });
        return undefined;
      },
      { rateLimits: [RATE_LIMITS.events], noDefaultRateLimit: true },
    );

    mount(api, routes['me.plusInterest'], ({ auth }) => {
      // Fake door, web build only (founder J12); off unless the flag is on.
      if (!isFeatureEnabled(db, 'plus_door')) throw new DomainError('FEATURE_DISABLED', { flag: 'plus_door' });
      if (auth.kind !== 'user') throw new DomainError('AUTH_REQUIRED');
      db.transaction(() => services.events.event(db, 'plus_interest', {}, { pseudonym: auth.user.pseudonym }));
      return undefined;
    });
  },
};
