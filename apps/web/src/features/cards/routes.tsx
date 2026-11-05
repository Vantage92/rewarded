// Deelbare kaart (UX §3.7 K1, K2; architecture §9.1 /kaart/:id and the public /v/:token, R2). Owner: WP-9.
import type { RouteObject } from 'react-router';
import type { ShellHandle } from '../../app/shell.tsx';
import { CardMakerScreen, VerifyScreen } from './CardScreens.tsx';

const bare: ShellHandle = { chrome: 'bare' };

export const routes: RouteObject[] = [
  { path: 'kaart/:id', element: <CardMakerScreen /> },
  { path: 'v/:token', element: <VerifyScreen />, handle: bare },
];
