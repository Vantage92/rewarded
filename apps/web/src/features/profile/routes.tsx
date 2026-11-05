// Ik (UX §2.1 tab 5, §3.7; architecture §9.1 /profiel, /profiel/privacy). Owner: WP-9.
import type { RouteObject } from 'react-router';
import { ProfileScreen } from './ProfileScreen.tsx';
import { PlusScreen, PrivacyScreen, ReferralScreen, TermsScreen } from './SubScreens.tsx';

export const routes: RouteObject[] = [
  { path: 'profiel', element: <ProfileScreen /> },
  { path: 'profiel/privacy', element: <PrivacyScreen /> },
  { path: 'profiel/voorwaarden', element: <TermsScreen /> },
  { path: 'profiel/link', element: <ReferralScreen /> },
  { path: 'profiel/plus', element: <PlusScreen /> },
];
