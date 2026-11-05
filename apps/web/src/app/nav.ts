// The five tabs of UX §2.1, in order of importance. Paths follow architecture §9.1.
import type { TabIcon } from './icons.tsx';

export interface TabDef {
  id: TabIcon;
  to: string;
  labelKey: string;
  /** Path prefixes that make this tab current. */
  match: readonly string[];
}

export const TABS: readonly TabDef[] = [
  { id: 'focus', to: '/', labelKey: 'nav.focus', match: ['/', '/focus', '/hoe-we-tellen'] },
  { id: 'squad', to: '/squad', labelKey: 'nav.squad', match: ['/squad', '/duel', '/belofte'] },
  { id: 'club', to: '/vereniging', labelKey: 'nav.club', match: ['/vereniging', '/challenges'] },
  { id: 'rewards', to: '/punten', labelKey: 'nav.rewards', match: ['/punten'] },
  { id: 'me', to: '/profiel', labelKey: 'nav.me', match: ['/profiel', '/kaart'] },
];

/** The tab that is current for a pathname, or undefined (e.g. on a public page). */
export function currentTab(pathname: string): TabIcon | undefined {
  const hit = (prefix: string) => (prefix === '/' ? pathname === '/' : pathname === prefix || pathname.startsWith(`${prefix}/`));
  return TABS.find((tab) => tab.match.some(hit))?.id;
}

/** UX §2.1: in the no-points mode the Rewards tab disappears and the others move up. */
export function visibleTabs(opts: { noPointsMode: boolean }): readonly TabDef[] {
  return opts.noPointsMode ? TABS.filter((t) => t.id !== 'rewards') : TABS;
}
