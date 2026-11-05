// Focus feature (WP-8, architecture §9.1): home "Vandaag" (F1), /focus (F2–F7) and "Hoe we tellen" (F9).
import type { RouteObject } from 'react-router';
import { FocusPage } from './FocusPage.tsx';
import { HomeScreen } from './HomeScreen.tsx';
import { HowWeCount } from './HowWeCount.tsx';

export const routes: RouteObject[] = [
  { index: true, element: <HomeScreen /> },
  { path: 'focus/*', element: <FocusPage /> },
  { path: 'hoe-we-tellen', element: <HowWeCount /> },
];
