// Duel (UX §3.4 Q4; architecture §9.1 /duel, R2). Owner: WP-9.
import type { RouteObject } from 'react-router';
import { DuelScreen } from './DuelScreen.tsx';

export const routes: RouteObject[] = [{ path: 'duel', element: <DuelScreen /> }];
