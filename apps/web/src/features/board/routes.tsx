// Stub (WP-0). Owner: WP-10 (architecture §12.1). Lazily loaded so the student bundle stays small (§9.1).
import type { RouteObject } from 'react-router';

export const routes: RouteObject[] = [
  { path: 'bestuur/:clubId/*', lazy: async () => ({ Component: (await import('./Screen.tsx')).Screen }) },
];
