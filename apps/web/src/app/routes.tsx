// Route registry (WP-0 glob loader, WP-7 shell). Every feature exports `routes` from
// features/<name>/routes.tsx; they are collected with import.meta.glob, so no work package edits
// this file (architecture §2, §9.1). Routes of §9.1 that no feature claims yet get a placeholder
// after the feature routes; React Router ranks equal paths by order, so a feature route wins.
import type { RouteObject } from 'react-router';
import { Layout, NotFound } from './Layout.tsx';
import { Placeholder } from './Placeholder.tsx';
import type { ShellHandle } from './shell.tsx';

export interface FeatureRoutes {
  routes: RouteObject[];
}

const featureModules = import.meta.glob<FeatureRoutes>('../features/*/routes.tsx', { eager: true });

/** Feature names found on disk, for tests. */
export const featureNames = Object.keys(featureModules)
  .map((path) => path.split('/')[2]!)
  .sort();

const bare: ShellHandle = { chrome: 'bare' };

/** Architecture §9.1 routes without a feature folder yet: [path, i18n feature key, owner, handle]. */
export const shellPlaceholders: readonly [path: string, feature: string, owner: string, handle?: ShellHandle][] = [
  ['welkom', 'welcome', 'WP-8', bare],
  ['i/:token', 'invite', 'WP-8', bare],
  ['c/:code', 'club_code', 'WP-8', bare],
  ['login', 'login', 'WP-8', bare],
  ['auth/*', 'auth', 'WP-8', bare],
  ['hoe-we-tellen', 'how_we_count', 'WP-8'],
  ['vragen/:moment', 'survey', 'WP-9'],
  ['hulp', 'help', 'WP-9'],
  ['afmelden', 'unsubscribe', 'WP-9', bare],
  ['v/:token', 'verify', 'WP-9', bare],
];

const placeholderRoutes: RouteObject[] = shellPlaceholders.map(([path, feature, owner, handle]) => ({
  path,
  element: <Placeholder feature={feature} owner={owner} />,
  ...(handle ? { handle } : {}),
}));

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      ...Object.keys(featureModules)
        .sort()
        .flatMap((path) => featureModules[path]!.routes),
      // Home ("Vandaag", F1) stays a placeholder until a feature exports `{ index: true }`; being
      // listed after the feature routes, the feature's index route wins.
      { index: true, element: <Placeholder feature="home" owner="WP-8" /> },
      ...placeholderRoutes,
      { path: '*', element: <NotFound /> },
    ],
  },
];
