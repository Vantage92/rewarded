// Stub (WP-0). Owner: WP-8 (architecture §12.1). Replace the placeholder with the real screens.
import type { RouteObject } from 'react-router';
import { Placeholder } from '../../app/Placeholder.tsx';

export const routes: RouteObject[] = [{ path: 'focus/*', element: <Placeholder feature="focus" owner="WP-8" /> }];
