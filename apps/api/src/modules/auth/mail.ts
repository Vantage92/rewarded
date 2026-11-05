// Login and invitation mails in NL and EN. The link carries the token in the fragment, so a mail
// scanner that fetches the URL consumes nothing and the token reaches no access log (§10.1).
import type { Locale } from '@rewarded/contracts';
import type { MailMessage } from '../../platform/types.ts';

const TEXT = {
  nl: {
    loginSubject: 'Je inloglink voor Rewarded',
    loginBody: (link: string, code: string) =>
      `Tik op de link en daarna op "Inloggen":\n${link}\n\nOf vul deze code in op het scherm "Check je mail": ${code}\n\nDe link en de code werken 15 minuten en één keer. Heb je niets aangevraagd? Dan kun je deze mail negeren.`,
    inviteNeededSubject: 'Rewarded is nog op uitnodiging',
    inviteNeededBody: (waitlist: string) =>
      `Rewarded draait nu als gesloten pilot. Je komt binnen met een uitnodiging van je squad, je vereniging of de wachtlijst.\n\nZet je op de wachtlijst: ${waitlist}`,
  },
  en: {
    loginSubject: 'Your Rewarded sign-in link',
    loginBody: (link: string, code: string) =>
      `Tap the link, then "Sign in":\n${link}\n\nOr enter this code on the "Check your mail" screen: ${code}\n\nThe link and the code work for 15 minutes and once. Didn't ask for this? You can ignore this mail.`,
    inviteNeededSubject: 'Rewarded is invite-only for now',
    inviteNeededBody: (waitlist: string) =>
      `Rewarded is running as a closed pilot. You get in with an invite from your squad, your club or the waitlist.\n\nJoin the waitlist: ${waitlist}`,
  },
} as const;

export function loginMail(locale: Locale, to: string, appOrigin: string, token: string, code: string): MailMessage {
  const t = TEXT[locale];
  return { to, subject: t.loginSubject, text: t.loginBody(`${appOrigin}/auth/bevestig#t=${token}`, code) };
}

export function inviteNeededMail(locale: Locale, to: string, appOrigin: string): MailMessage {
  const t = TEXT[locale];
  return { to, subject: t.inviteNeededSubject, text: t.inviteNeededBody(`${appOrigin}/welkom`) };
}
