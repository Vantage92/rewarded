import { describe, expect, it } from 'vitest';
import { modules } from '../src/modules.gen.ts';
import { devModules } from '../src/modules.dev.gen.ts';

// The fixed module list: union of all modules in architecture §2 and §12.1.
const EXPECTED = [
  'admin', 'auth', 'belofte', 'cards', 'catalog', 'challenges', 'clubs', 'draws', 'duels', 'events',
  'fraud', 'invites', 'kpi', 'leaderboards', 'phone', 'points', 'privacy', 'redemptions', 'referral',
  'reminders', 'sessions', 'squads', 'support', 'waitlist',
];

describe('generated module registry', () => {
  it('contains every production module and nothing else', () => {
    expect(modules.map((m) => m.name)).toEqual(EXPECTED);
  });

  it('keeps dev out of the production list', () => {
    expect(devModules.map((m) => m.name)).toEqual(['dev']);
  });

  it('names an owning work package for each module', () => {
    for (const m of [...modules, ...devModules]) expect(m.owner).toMatch(/^WP-\d+$/);
  });
});
