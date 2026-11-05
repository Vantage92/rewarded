// Onboarding and access (WP-8, architecture §9.1, spec §3.1, UX §3.2 O1–O10): landing with an
// invitation, login with magic link or code, age check, consent, daily goal, Do Not Disturb,
// practice session and the first session. Public pages use the bare chrome.
import type { RouteObject } from 'react-router';
import type { ShellHandle } from '../../app/shell.tsx';
import { AgeStep } from './steps/AgeStep.tsx';
import { CheckInbox } from './steps/CheckInbox.tsx';
import { Confirm } from './steps/Confirm.tsx';
import { ConsentStep } from './steps/ConsentStep.tsx';
import { DndStep } from './steps/DndStep.tsx';
import { EmailStep, LoginPage } from './steps/EmailStep.tsx';
import { FirstSession } from './steps/FirstSession.tsx';
import { GoalStep } from './steps/GoalStep.tsx';
import { HowShort } from './steps/HowShort.tsx';
import { PracticeStep } from './steps/PracticeStep.tsx';
import { SilentStep } from './steps/SilentStep.tsx';
import { Welcome } from './steps/Welcome.tsx';
import './onboarding.css';

const bare: ShellHandle = { chrome: 'bare' };

export const routes: RouteObject[] = [
  { path: 'welkom', element: <Welcome />, handle: bare },
  { path: 'i/:token', element: <Welcome />, handle: bare },
  { path: 'login', element: <LoginPage />, handle: bare },
  { path: 'auth/check-inbox', element: <CheckInbox />, handle: bare },
  { path: 'auth/code', element: <CheckInbox />, handle: bare },
  { path: 'auth/bevestig', element: <Confirm />, handle: bare },
  {
    path: 'onboarding',
    handle: bare,
    children: [
      { index: true, element: <Welcome />, handle: bare },
      { path: 'start', element: <Welcome />, handle: bare },
      { path: 'hoe', element: <HowShort />, handle: bare },
      { path: 'email', element: <EmailStep />, handle: bare },
      { path: 'leeftijd', element: <AgeStep />, handle: bare },
      { path: 'squad-zicht', element: <SilentStep />, handle: bare },
      { path: 'akkoord', element: <ConsentStep />, handle: bare },
      { path: 'dagdoel', element: <GoalStep />, handle: bare },
      { path: 'niet-storen', element: <DndStep />, handle: bare },
      { path: 'oefenen', element: <PracticeStep />, handle: bare },
      { path: 'eerste-sessie', element: <FirstSession />, handle: bare },
      { path: '*', element: <Welcome />, handle: bare },
    ],
  },
];
