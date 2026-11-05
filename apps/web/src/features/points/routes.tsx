// Beloningen (UX §2.1 tab 4, §3.6; architecture §9.1 /punten, /punten/catalogus, /punten/geschiedenis). Owner: WP-9.
import type { RouteObject } from 'react-router';
import { BonusRuleScreen, LedgerScreen } from './OtherScreens.tsx';
import { PointsScreen } from './PointsScreen.tsx';

export const routes: RouteObject[] = [
  { path: 'punten', element: <PointsScreen /> },
  { path: 'punten/catalogus', element: <PointsScreen /> },
  { path: 'punten/geschiedenis', element: <LedgerScreen /> },
  { path: 'punten/bonusregel', element: <BonusRuleScreen /> },
];
