// Onboarding steps (spec §3.1, UX §3.2 O1–O10) and their paths.
export const STEP = {
  welcome: '/onboarding/start',
  how: '/onboarding/hoe',
  email: '/onboarding/email',
  inbox: '/auth/check-inbox',
  age: '/onboarding/leeftijd',
  silent: '/onboarding/squad-zicht',
  consent: '/onboarding/akkoord',
  goal: '/onboarding/dagdoel',
  dnd: '/onboarding/niet-storen',
  practice: '/onboarding/oefenen',
  first: '/onboarding/eerste-sessie',
} as const;
