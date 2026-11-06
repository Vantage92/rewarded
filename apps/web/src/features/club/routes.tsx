// Vereniging tab (UX §2.1 tab 3, §3.5; architecture §9.1 /vereniging, /vereniging/ranglijst). Owner: WP-9.
import type { RouteObject } from 'react-router';
import type { ShellHandle } from '../../app/shell.tsx';
import { ClubCodeRoute } from './ClubCode.tsx';
import { ClubScreen, JoinClubScreen } from './ClubScreen.tsx';

const bare: ShellHandle = { chrome: 'bare' };

export const routes: RouteObject[] = [
  { path: 'vereniging', element: <ClubScreen /> },
  { path: 'vereniging/ranglijst', element: <ClubScreen /> },
  { path: 'vereniging/koppelen', element: <JoinClubScreen /> },
  // The promo kit link (QR, poster, story; clubs promo-kit route).
  { path: 'c/:code', element: <ClubCodeRoute />, handle: bare },
];
