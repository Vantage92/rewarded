// De Belofte (UX §3.4 Q5/Q6, §4.10; architecture §9.1 /belofte, R2). Owner: WP-9.
import type { RouteObject } from 'react-router';
import { BelofteScreen } from './BelofteScreen.tsx';

export const routes: RouteObject[] = [{ path: 'belofte', element: <BelofteScreen /> }];
