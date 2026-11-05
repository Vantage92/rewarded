// Waitlist mails in NL and EN (architecture §3.1, §8.2): confirmation with the group link
// "Meld je vrienden aan" and an unsubscribe link; the invitation of a batch.
import type { Locale } from '@rewarded/contracts';
import type { MailMessage } from '../../platform/types.ts';

const TEXT = {
  nl: {
    confirmSubject: 'Je staat op de wachtlijst van Rewarded',
    confirmBody: (group: string, unsubscribe: string) =>
      `Je staat op de wachtlijst. Samen met vrienden kom je eerder binnen: wie zich via jouw link aanmeldt, krijgt samen met jou een uitnodiging.\n\nMeld je vrienden aan: ${group}\n\nWil je er toch af? ${unsubscribe}`,
    inviteSubject: 'Je uitnodiging voor Rewarded',
    inviteBody: (link: string, size: number) =>
      `Je bent uitgenodigd voor de pilot van Rewarded${size > 1 ? `, samen met ${size - 1} ${size - 1 === 1 ? 'vriend' : 'vrienden'}` : ''}.\n\nStart hier: ${link}\n\nDe uitnodiging is 14 dagen geldig.`,
  },
  en: {
    confirmSubject: "You're on the Rewarded waitlist",
    confirmBody: (group: string, unsubscribe: string) =>
      `You're on the waitlist. You get in sooner with friends: whoever signs up through your link gets an invite together with you.\n\nSign up your friends: ${group}\n\nWant off the list? ${unsubscribe}`,
    inviteSubject: 'Your invite to Rewarded',
    inviteBody: (link: string, size: number) =>
      `You're invited to the Rewarded pilot${size > 1 ? `, together with ${size - 1} ${size - 1 === 1 ? 'friend' : 'friends'}` : ''}.\n\nStart here: ${link}\n\nThe invite is valid for 14 days.`,
  },
} as const;

export function confirmMail(locale: Locale, to: string, appOrigin: string, groupToken: string, unsubscribeToken: string): MailMessage {
  const t = TEXT[locale];
  return {
    to,
    subject: t.confirmSubject,
    text: t.confirmBody(`${appOrigin}/welkom?groep=${groupToken}`, `${appOrigin}/afmelden#t=${unsubscribeToken}`),
  };
}

export function inviteMail(locale: Locale, to: string, appOrigin: string, inviteToken: string, groupSize: number): MailMessage {
  const t = TEXT[locale];
  return { to, subject: t.inviteSubject, text: t.inviteBody(`${appOrigin}/i/${inviteToken}`, groupSize) };
}
