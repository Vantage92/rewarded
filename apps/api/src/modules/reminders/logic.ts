// E-mail reminder (spec §8 Should R1; productplan §10: one per day, 19:30, can be switched off;
// architecture §6.3). Only when the goal is not met yet or the squad streak is at risk, never in the
// vacation pause, at most one per user per focus day (reminder_log), behind the flag `reminders`.
// The text is about focus and the squad, never about points.
import { neededForSuccess, memberCountsOn } from '@rewarded/core/squads';
import type { FocusDay } from '@rewarded/core';
import { timingSafeEqual } from 'node:crypto';
import { isFeatureEnabled } from '../../db/flags.ts';
import type { Db } from '../../db/types.ts';
import type { ModuleDeps } from '../../module.ts';
import { P, isVacation, membershipsOnDay, nowIso, openMembership, squadById, today, userDays } from '../squads/lib/social.ts';

export type ReminderKind = 'goal_at_risk' | 'streak_at_risk';

/** Signed unsubscribe token: `<user id>_<32 hex of HMAC>`; works without logging in. */
export function unsubscribeToken(deps: ModuleDeps, userId: string): string {
  return `${userId}_${deps.platform.hasher.hash('audit', `reminders-unsubscribe:${userId}`).slice(0, 32)}`;
}

export function userOfToken(deps: ModuleDeps, token: string): string | null {
  const i = token.lastIndexOf('_');
  if (i <= 0) return null;
  const userId = token.slice(0, i);
  const expected = Buffer.from(unsubscribeToken(deps, userId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given) ? userId : null;
}

/** Whether the squad still needs members today for its streak (spec §4.4 Squadstreak). */
function streakAtRisk(deps: ModuleDeps, userId: string, day: FocusDay): boolean {
  const m = openMembership(deps.db, userId);
  if (!m) return false;
  const squad = squadById(deps.db, m.squad_id);
  if (!squad || squad.streak === 0) return false;
  const members = membershipsOnDay(deps.db, squad.id, day).filter((x) => memberCountsOn({ activeFromDay: x.active_from_day, leftDay: x.left_day, pausedSinceDay: x.paused_since_day }, day));
  if (members.length < P.squads.freeze_below_active) return false;
  const reader = userDays(deps);
  const ok = members.filter((x) => {
    const d = reader.get(x.user_id!, day);
    return d?.goalMet === true || d?.examDay === true;
  }).length;
  return ok < neededForSuccess(members.length, P.squads);
}

function mailText(locale: 'nl' | 'en', kind: ReminderKind, unsubscribeUrl: string): { subject: string; text: string } {
  if (locale === 'en') {
    return kind === 'streak_at_risk'
      ? { subject: 'Your squad is focusing today', text: `Your squad's streak needs a few more goals today. One focus session keeps it going.\n\nNo more reminders: ${unsubscribeUrl}` }
      : { subject: 'Still time for your daily goal', text: `You have not reached your daily goal yet. Phones down, one session is enough.\n\nNo more reminders: ${unsubscribeUrl}` };
  }
  return kind === 'streak_at_risk'
    ? { subject: 'Je squad focust vandaag', text: `De streak van je squad heeft vandaag nog een paar gehaalde doelen nodig. Eén focussessie houdt hem vast.\n\nGeen herinneringen meer: ${unsubscribeUrl}` }
    : { subject: 'Nog tijd voor je dagdoel', text: `Je hebt je dagdoel vandaag nog niet gehaald. Telefoon weg, één sessie is genoeg.\n\nGeen herinneringen meer: ${unsubscribeUrl}` };
}

/** Sends today's reminders; idempotent through reminder_log (unique per user and focus day). */
export async function sendReminders(deps: ModuleDeps, day: FocusDay = today(deps)): Promise<{ sent: number }> {
  const db: Db = deps.db;
  if (!isFeatureEnabled(db, 'reminders') || isVacation(db, day)) return { sent: 0 };
  const users = db.all<{ id: string; email: string; locale: 'nl' | 'en'; pseudonym: string }>(
    "SELECT id, email, locale, pseudonym FROM user WHERE status = 'active' AND email_reminders = 1 AND is_team = 0 ORDER BY id",
  );
  const reader = userDays(deps);
  let sent = 0;
  for (const u of users) {
    const d = reader.get(u.id, day);
    if (d?.examDay) continue;
    const kind: ReminderKind | null = streakAtRisk(deps, u.id, day) ? 'streak_at_risk' : d?.goalMet ? null : 'goal_at_risk';
    if (!kind) continue;
    const inserted = db.transaction(() => {
      const r = db.run('INSERT OR IGNORE INTO reminder_log (user_id, focus_day, kind, sent_at) VALUES (?, ?, ?, ?)', [u.id, day, kind, nowIso(deps)]);
      if (r.changes === 0) return false;
      deps.services.events.event(db, 'reminder_sent', { soort: kind, dag: day }, { pseudonym: u.pseudonym });
      return true;
    });
    if (!inserted) continue;
    const url = `${deps.http?.appOrigin ?? ''}/herinneringen/uit#t=${unsubscribeToken(deps, u.id)}`;
    await deps.platform.mailer.send({ to: u.email, ...mailText(u.locale, kind, url) });
    sent += 1;
  }
  return { sent };
}
