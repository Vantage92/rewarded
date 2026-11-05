// Board dashboard `/bestuur/:clubId/*` (WP-10; spec §4.6, UX §3.8, §4.5, architecture §6.4, §9.1).
// A separate environment for laptop width, lazily loaded so the student bundle stays small.
import type { RouteObject } from 'react-router';
import type { ShellHandle } from '../../app/shell.tsx';

const bare: ShellHandle = { chrome: 'bare' };

export const routes: RouteObject[] = [
  { path: 'bestuur', handle: bare, lazy: async () => ({ Component: (await import('./BoardScreen.tsx')).BoardHome }) },
  { path: 'bestuur/:clubId/*', handle: bare, lazy: async () => ({ Component: (await import('./BoardScreen.tsx')).BoardScreen }) },
];
