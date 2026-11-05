// WP-9 screens with mock data: axe without serious or critical violations and one h1 per screen
// (UX §5.8; architecture §9.6). Colour contrast is covered by the token test and Chromium (WP-7).
import { cleanup, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';
import { handlers as beloftes } from '../src/features/belofte/mock.ts';
import { handlers as club } from '../src/features/club/mock.ts';
import { handlers as points } from '../src/features/points/mock.ts';
import { handlers as squads } from '../src/features/squads/mock.ts';
import { renderAt } from './wp9/helpers.tsx';

afterEach(cleanup);

const handlers = { ...points, ...squads, ...club, ...beloftes };

const violations = async () => {
  const result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } }, resultTypes: ['violations'] });
  return result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

describe('WP-9 accessibility (UX §5.8)', () => {
  it.each(['/punten', '/punten/geschiedenis', '/punten/bonusregel', '/squad', '/squad/nieuw', '/duel', '/vereniging', '/vereniging/koppelen', '/belofte', '/profiel', '/profiel/privacy', '/profiel/voorwaarden', '/v/tok_AAAAAAAAAAAAAAAAAAAAAA'])(
    'axe finds no serious or critical violations on %s once loaded',
    async (path) => {
      renderAt(path, { handlers, me: { club: { id: '01JC0000000000000000000100', name: 'SV Delta', status: 'linked' } } });
      await waitFor(() => expect(document.querySelector('.wp9-skeleton')).toBeNull());
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(await violations()).toEqual([]);
    },
  );
});
