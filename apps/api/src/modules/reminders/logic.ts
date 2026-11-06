// E-mail reminder (spec §8 Should R1; architecture §6.3; UX §4.9, §6.2). Opt-in (P5), at the time
// and on the days the student chose, at most one per user per focus day (reminder_log), never in the
// vacation pause, behind the flag `reminders`, and only while the own daily goal is still open.
// The copy is UX §6.2 (mail.json, NL and EN): no streak pressure, no points, a footer with the reason.
import { memberCountsOn } from '@rewarded/core/squads';
import { isoWeekday, parseLocalTime, toLocalParts, type FocusDay } from '@rewarded/core';
import { randomToken } from '../../db/ids.ts';
import { isFeatureEnabled } from '../../db/flags.ts';
import type { Db } from '../../db/types.ts';
import type { ModuleDeps } from '../../module.ts';
import MAIL from './mail.json' with { type: 'json' };
import { P, isVacation, membershipsOnDay, nowIso, openMembership, today, userDays } from '../squads/lib/social.ts';

/** Goal mail or squad mail (UX §6.2); stored in reminder_log as goal_at_risk / streak_at_risk. */
export type ReminderKind = 'goal_open' | 'squad_active';

/** Random unsubscribe token per user, kept in a lookup column (no user id in mail, URL or logs). */
export function unsubscribeToken(deps: ModuleDeps, userId: string): string {
  const row = deps.db.get<{ t: string | null }>('SELECT reminder_unsub_token AS t FROM user WHERE id = ?', [userId]);
  if (row?.t) return row.t;
  const t = randomToken(deps.platform.random, 24);
  deps.db.run('UPDATE user SET reminder_unsub_token = ? WHERE id = ? AND reminder_unsub_token IS NULL', [t, userId]);
  return deps.db.get<{ t: string }>('SELECT reminder_unsub_token AS t FROM user WHERE id = ?', [userId])?.t ?? t;
}

export function userOfToken(deps: ModuleDeps, token: string): string | null {
  return deps.db.get<{ id: string }>('SELECT id FROM user WHERE reminder_unsub_token = ?', [token])?.id ?? null;
}

/** First names of squad members (not in silent mode) who already reached today's goal. */
function squadFriendsDone(deps: ModuleDeps, userId: string, day: FocusDay): string[] {
  const m = openMembership(deps.db, userId);
  if (!m) return [];
  const reader = userDays(deps);
  const members = membershipsOnDay(deps.db, m.squad_id, day).filter(
    (x) => x.user_id !== userId && x.user_id !== null && memberCountsOn({ activeFromDay: x.active_from_day, leftDay: x.left_day, pausedSinceDay: x.paused_since_day }, day),
  );
  const out: string[] = [];
  for (const x of members) {
    if (reader.get(x.user_id!, day)?.goalMet !== true) continue;
    const u = deps.db.get<{ first_name: string; silent_mode: number }>('SELECT first_name, silent_mode FROM user WHERE id = ?', [x.user_id]);
    if (u && u.silent_mode === 0) out.push(u.first_name);
  }
  return out.slice(0, 3);
}

const fill = (t: string, v: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ''));

export function mailText(
  locale: 'nl' | 'en',
  kind: ReminderKind,
  o: { time: string; goal: number; names: string[]; startUrl: string; unsubscribeUrl: string },
): { subject: string; text: string } {
  const m = MAIL[locale];
  const names = o.names.length <= 1 ? (o.names[0] ?? '') : `${o.names.slice(0, -1).join(', ')} ${m.and} ${o.names.at(-1)}`;
  const body =
    kind === 'squad_active'
      ? fill(o.names.length === 1 ? m.squad_text_one : m.squad_text, { names })
      : fill(m.goal_text, { time: o.time, goal: o.goal });
  return {
    subject: kind === 'squad_active' ? m.squad_subject : m.goal_subject,
    text: `${body}\n\n${m.start}: ${o.startUrl}\n\n--\n${m.footer}\n${m.unsubscribe}: ${o.unsubscribeUrl}`,
  };
}

/** Local minutes of the focus day (00:00–03:59 count after 23:59, the day runs until 04:00). */
function focusMinutes(hhmm: string): number {
  const m = parseLocalTime(hhmm);
  return m < 4 * 60 ? m + 24 * 60 : m;
}

/**
 * Sends the reminders that are due at `now` on `day`: users whose chosen time has passed and whose
 * chosen days include the weekday. Idempotent through reminder_log (unique per user and focus day).
 */
export async function sendReminders(deps: ModuleDeps, day: FocusDay = today(deps), now: Date = deps.platform.clock.now()): Promise<{ sent: number }> {
  const db: Db = deps.db;
  if (!isFeatureEnabled(db, 'reminders') || isVacation(db, day)) return { sent: 0 };
  const parts = toLocalParts(now.getTime());
  const nowMin = focusMinutes(`${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`);
  const weekday = String(isoWeekday(day));
  const users = db.all<{ id: string; email: string; locale: 'nl' | 'en'; pseudonym: string; reminder_time: string; reminder_days: string }>(
    "SELECT id, email, locale, pseudonym, reminder_time, reminder_days FROM user WHERE status = 'active' AND email_reminders = 1 AND is_team = 0 ORDER BY id",
  );
  const reader = userDays(deps);
  const pc = deps.services.pointsContext;
  let sent = 0;
  for (const u of users) {
    if (!u.reminder_days.includes(weekday) || focusMinutes(u.reminder_time) > nowMin) continue;
    const d = reader.get(u.id, day);
    // Only while the own goal is still open (UX §6.2 "alleen als je dagdoel nog open staat").
    if (d?.examDay || d?.goalMet) continue;
    const names = squadFriendsDone(deps, u.id, day);
    const kind: ReminderKind = names.length > 0 ? 'squad_active' : 'goal_open';
    const p = pc?.profile(db, u.id);
    const goal = d?.goalMin ?? (p && pc ? pc.goalFor(db, p, day) : P.goals.default_min);
    const inserted = db.transaction(() => {
      const r = db.run('INSERT OR IGNORE INTO reminder_log (user_id, focus_day, kind, sent_at) VALUES (?, ?, ?, ?)', [u.id, day, kind === 'squad_active' ? 'streak_at_risk' : 'goal_at_risk', nowIso(deps)]);
      if (r.changes === 0) return false;
      deps.services.events.event(db, 'reminder_sent', { soort: kind === 'squad_active' ? 'streak_at_risk' : 'goal_at_risk', dag: day }, { pseudonym: u.pseudonym });
      return true;
    });
    if (!inserted) continue;
    const origin = deps.http?.appOrigin ?? '';
    const token = db.transaction(() => unsubscribeToken(deps, u.id));
    await deps.platform.mailer.send({
      to: u.email,
      ...mailText(u.locale, kind, { time: u.reminder_time, goal, names, startUrl: `${origin}/`, unsubscribeUrl: `${origin}/herinneringen/uit#t=${token}` }),
    });
    sent += 1;
  }
  return { sent };
}
