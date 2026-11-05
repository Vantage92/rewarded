// Waiting list (WP-8, architecture §9.1): sign up alone or with friends, with the hook test.
import type { RouteObject } from 'react-router';
import type { ShellHandle } from '../../app/shell.tsx';
import { WaitlistPage } from './WaitlistPage.tsx';

const bare: ShellHandle = { chrome: 'bare' };

export const routes: RouteObject[] = [
  { path: 'wachtlijst', element: <WaitlistPage />, handle: bare },
  { path: 'wachtlijst/groep/:token', element: <WaitlistPage />, handle: bare },
];
