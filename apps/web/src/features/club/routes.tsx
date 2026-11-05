// Vereniging tab (UX §2.1 tab 3, §3.5; architecture §9.1 /vereniging, /vereniging/ranglijst). Owner: WP-9.
import type { RouteObject } from 'react-router';
import { ClubScreen, JoinClubScreen } from './ClubScreen.tsx';

export const routes: RouteObject[] = [
  { path: 'vereniging', element: <ClubScreen /> },
  { path: 'vereniging/ranglijst', element: <ClubScreen /> },
  { path: 'vereniging/koppelen', element: <JoinClubScreen /> },
];
