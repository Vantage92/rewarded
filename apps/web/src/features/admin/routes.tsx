// Admin environment `/beheer/*` (WP-10; spec §4.11, architecture §8.2 Beheer, §9.1). Lazily loaded so
// the student bundle stays small; every section is a child route of the gated layout.
import type { RouteObject } from 'react-router';
import type { ShellHandle } from '../../app/shell.tsx';
import type * as Sections from './sections/index.ts';

type SectionName = keyof typeof Sections;

const section = (name: SectionName): NonNullable<RouteObject['lazy']> => async () => ({ Component: (await import('./sections/index.ts'))[name] });

/** Child path → section component; the order is the order of the navigation. */
export const ADMIN_SECTIONS: readonly (readonly [path: string, name: SectionName, navKey: string])[] = [
  ['wachtrij', 'Queue', 'queue'],
  ['beroepen', 'Appeals', 'appeals'],
  ['vier-ogen', 'FourEyes', 'four_eyes'],
  ['steekproef', 'Sample', 'sample'],
  ['eerste-verzilveringen', 'FirstRedemptions', 'first_redemptions'],
  ['storingen', 'Outages', 'outages'],
  ['verenigingen', 'Clubs', 'clubs'],
  ['tentamenkalenders', 'Calendars', 'calendars'],
  ['challenges', 'Challenges', 'challenges'],
  ['budget', 'BudgetSection', 'budget'],
  ['catalogus', 'Catalog', 'catalog'],
  ['wachtlijst', 'Waitlist', 'waitlist'],
  ['gebruikers', 'Users', 'users'],
  ['vakantiepauze', 'VacationPause', 'vacation'],
  ['experimenten', 'Experiments', 'experiments'],
  ['kpi', 'Kpi', 'kpi'],
  ['support', 'Support', 'support'],
  ['ambassadeurs', 'Ambassadors', 'ambassadors'],
  ['auditlog', 'Audit', 'audit'],
];

const bare: ShellHandle = { chrome: 'bare' };

export const routes: RouteObject[] = [
  {
    path: 'beheer',
    handle: bare,
    lazy: async () => ({ Component: (await import('./AdminLayout.tsx')).AdminLayout }),
    children: [
      { index: true, lazy: section('Overview') },
      ...ADMIN_SECTIONS.map(([path, name]) => ({ path: `${path}/*`, lazy: section(name) })),
      { path: '*', lazy: section('SectionNotFound') },
    ],
  },
];
