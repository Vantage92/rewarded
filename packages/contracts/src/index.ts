// Public surface of @rewarded/contracts: zod schemas per API module, error codes, event taxonomy,
// route registry, typed API client and mock client.
// The dev routes are not exported here: use '@rewarded/contracts/dev' (dev build and tests only). Owner: WP-2 (architecture §12.1); frozen as contracts-v1.
export * from './common.ts';
export * from './errors.ts';
export * from './route.ts';
export * from './events.ts';
export * from './auth.ts';
export * from './waitlist.ts';
export * from './sessions.ts';
export * from './points.ts';
export * from './catalog.ts';
export * from './redemptions.ts';
export * from './phone.ts';
export * from './squads.ts';
export * from './invites.ts';
export * from './duels.ts';
export * from './clubs.ts';
export * from './challenges.ts';
export * from './leaderboards.ts';
export * from './belofte.ts';
export * from './cards.ts';
export * from './referral.ts';
export * from './reminders.ts';
export * from './surveys.ts';
export * from './fraud.ts';
export * from './draws.ts';
export * from './privacy.ts';
export * from './kpi.ts';
export * from './support.ts';
export * from './admin.ts';
export * from './routes.ts';
export * from './client.ts';
export * from './mock.ts';
export * from './examples.ts';
