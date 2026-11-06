// Unsubscribe links from the mails (repair wave): /herinneringen/uit (reminder mail) and /afmelden
// (waiting list). Public, bare chrome.
import type { RouteObject } from 'react-router';
import type { ShellHandle } from '../../app/shell.tsx';
import { UnsubscribePage } from './UnsubscribePage.tsx';

const bare: ShellHandle = { chrome: 'bare' };

export const routes: RouteObject[] = [
  { path: 'herinneringen/uit', element: <UnsubscribePage kind="reminders" />, handle: bare },
  { path: 'afmelden', element: <UnsubscribePage kind="waitlist" />, handle: bare },
];
