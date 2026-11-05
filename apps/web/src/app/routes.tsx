// Route registry (WP-0). Every feature exports `routes` from features/<name>/routes.tsx; they are
// collected with import.meta.glob, so no work package edits this file (architecture §2, §9.1).
import type { RouteObject } from 'react-router';
import { Layout, NotFound } from './Layout.tsx';
import { Placeholder } from './Placeholder.tsx';

export interface FeatureRoutes {
  routes: RouteObject[];
}

const featureModules = import.meta.glob<FeatureRoutes>('../features/*/routes.tsx', { eager: true });

/** Feature names found on disk, for tests. */
export const featureNames = Object.keys(featureModules)
  .map((path) => path.split('/')[2]!)
  .sort();

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      // Home ("Vandaag") is part of the shell until its owner is assigned.
      { index: true, element: <Placeholder feature="home" owner="WP-9" /> },
      ...Object.keys(featureModules)
        .sort()
        .flatMap((path) => featureModules[path]!.routes),
      { path: '*', element: <NotFound /> },
    ],
  },
];
