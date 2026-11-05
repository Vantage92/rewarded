// Prestatiechallenge (UX §3.5 V3; architecture §9.1 /challenges/:id, R3). Owner: WP-9.
import type { RouteObject } from 'react-router';
import { ChallengeScreen } from './ChallengeScreen.tsx';

export const routes: RouteObject[] = [{ path: 'challenges/:id', element: <ChallengeScreen /> }];
