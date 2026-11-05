// The Belofte (spec §3.12, §4.12; architecture §3.4, §6.1 step 6). Offer per arm and calendar of the
// assignment unit, day results without points, the reflection with one renewal offer in the early
// arm. No ledger entry hangs on a Belofte.
import { addDays, compareDays, type FocusDay } from '@rewarded/core';
import { belofteDayMet, belofteEndDay, offerDueDay, suggestBelofte, type BelofteOfferTrigger } from '@rewarded/core/belofte';
import type { Db } from '../../db/types.ts';
import type { ModuleDeps } from '../../module.ts';
import { P, calendarById, calendarOfClub, clubOfUser, focusDayOfIso, isVacation, nowIso, openMembership, squadById, userById, userDays } from '../squads/lib/social.ts';

export interface OfferRow {
  user_id: string;
  arm: 'early' | 'late' | null;
  trigger: BelofteOfferTrigger;
  due_day: string;
  offered_at: string | null;
  renewal_offered_at: string | null;
  renewal_used_at: string | null;
}

export interface BelofteRow {
  id: string;
  user_id: string;
  days_per_week: number;
  min_per_day: 25 | 50 | 90 | 120;
  witnesses: 'squad' | 'none';
  start_day: string;
  end_day: string;
  status: 'active' | 'completed' | 'stopped';
  stopped_day: string | null;
  reflection_action: 'extend' | 'adjust' | 'stop' | null;
  stake_interest: 'yes' | 'no' | 'unsure' | null;
  renewal_of: string | null;
  created_at: string;
}

/** Belofte arm and calendar of the user's assignment unit (spec §4.13 Welke kalender iemand volgt). */
function unitOf(db: Db, deps: ModuleDeps, userId: string): { arm: 'early' | 'late' | null; calendarId: string | null } {
  const m = openMembership(db, userId);
  const squad = m ? squadById(db, m.squad_id) : undefined;
  if (squad && squad.cohort === 'experiment' && squad.arm_belofte) return { arm: squad.arm_belofte, calendarId: squad.calendar_id };
  let arm: 'early' | 'late' | null = null;
  try {
    arm = deps.services.experiments.get({ type: 'solo', id: userId, stratum: '' })?.arms.belofte ?? null;
  } catch {
    arm = null;
  }
  return { arm, calendarId: squad?.calendar_id ?? calendarOfClub(db, clubOfUser(db, userId)) };
}

/** Creates or refreshes the offer row; once shown, an offer never moves (spec §4.12 Aanbod). */
export function ensureOffer(tx: Db, deps: ModuleDeps, userId: string): OfferRow | undefined {
  const existing = tx.get<OfferRow>('SELECT * FROM belofte_offer WHERE user_id = ?', [userId]);
  if (existing?.offered_at) return existing;
  const u = userById(tx, userId);
  if (!u) return undefined;
  const unit = unitOf(tx, deps, userId);
  const cal = calendarById(tx, unit.calendarId);
  const due = offerDueDay(
    { cohort: u.cohort, arm: u.cohort === 'experiment' ? unit.arm : null, optedOut: u.research_opt_out_at !== null, registeredDay: focusDayOfIso(u.created_at), calendar: { tDay: cal.tDay, aEndDay: cal.aEndDay } },
    P.belofte,
  );
  if (!due) return existing;
  if (existing && existing.due_day === due.dueDay && existing.trigger === due.trigger) return existing;
  tx.run(
    `INSERT INTO belofte_offer (user_id, arm, trigger, due_day) VALUES (?, ?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET arm = excluded.arm, trigger = excluded.trigger, due_day = excluded.due_day WHERE belofte_offer.offered_at IS NULL`,
    [userId, unit.arm, due.trigger, due.dueDay],
  );
  return tx.get<OfferRow>('SELECT * FROM belofte_offer WHERE user_id = ?', [userId]);
}

export function activeBelofte(db: Db, userId: string): BelofteRow | undefined {
  return db.get<BelofteRow>("SELECT * FROM belofte WHERE user_id = ? AND status = 'active'", [userId]);
}

/** Suggestion from the last 14 days (spec §4.12 Voorstel). */
export function suggestionFor(deps: ModuleDeps, userId: string, day: FocusDay): { daysPerWeek: number; minPerDay: number } {
  const rows = userDays(deps).range([userId], addDays(day, -P.belofte.suggestion_lookback_days), addDays(day, -1));
  return suggestBelofte(rows.map((r) => ({ verifiedMin: r.verifiedMin })), P.belofte);
}

export function createBelofte(tx: Db, deps: ModuleDeps, o: { id: string; userId: string; daysPerWeek: number; minPerDay: number; witnesses: 'squad' | 'none'; startDay: FocusDay; renewalOf?: string }): BelofteRow {
  const end = belofteEndDay(o.startDay, (d) => isVacation(tx, d), P.belofte);
  tx.run(
    `INSERT INTO belofte (id, user_id, days_per_week, min_per_day, witnesses, start_day, end_day, status, renewal_of, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
    [o.id, o.userId, o.daysPerWeek, o.minPerDay, o.witnesses, o.startDay, end, o.renewalOf ?? null, nowIso(deps)],
  );
  return tx.get<BelofteRow>('SELECT * FROM belofte WHERE id = ?', [o.id])!;
}

/**
 * Day close step 6 for focus day `day`: Belofte day results (vacation days do not count), the end
 * of a Belofte (reflection due, renewal offer in the early arm), and offer rows for the due day.
 */
export function closeBelofteDay(tx: Db, deps: ModuleDeps, day: FocusDay): { results: number; completed: number; offers: number } {
  const out = { results: 0, completed: 0, offers: 0 };
  const running = tx.all<BelofteRow>("SELECT * FROM belofte WHERE status = 'active' AND start_day <= ?", [day]);
  const reader = userDays(deps);
  const vacation = isVacation(tx, day);
  for (const b of running) {
    if (!vacation && compareDays(day, b.end_day) <= 0) {
      // counted_min: a flagged session counts provisionally, a rejected one not (spec §4.12).
      const minutes = reader.get(b.user_id, day)?.countedMin ?? 0;
      const met = belofteDayMet(minutes, b.min_per_day);
      const existed = tx.get('SELECT 1 AS x FROM belofte_day WHERE belofte_id = ? AND focus_day = ?', [b.id, day]) !== undefined;
      tx.run(
        `INSERT INTO belofte_day (belofte_id, focus_day, minutes, met, computed_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (belofte_id, focus_day) DO UPDATE SET minutes = excluded.minutes, met = excluded.met, computed_at = excluded.computed_at`,
        [b.id, day, minutes, met ? 1 : 0, nowIso(deps)],
      );
      if (!existed) {
        const u = userById(tx, b.user_id);
        deps.services.events.event(tx, 'belofte_day_result', { gehaald: met }, u ? { pseudonym: u.pseudonym } : {});
        out.results += 1;
      }
    }
    if (compareDays(day, b.end_day) >= 0) {
      tx.run("UPDATE belofte SET status = 'completed' WHERE id = ? AND status = 'active'", [b.id]);
      // The renewal offer is fixed in advance: once, early arm only (spec §4.12 Reflectie, founder G-S4).
      tx.run("UPDATE belofte_offer SET renewal_offered_at = ? WHERE user_id = ? AND trigger = 'early' AND renewal_offered_at IS NULL", [nowIso(deps), b.user_id]);
      out.completed += 1;
    }
  }
  const users = tx.all<{ id: string }>(
    "SELECT u.id FROM user u LEFT JOIN belofte_offer o ON o.user_id = u.id WHERE u.status = 'active' AND (o.user_id IS NULL OR o.offered_at IS NULL)",
  );
  for (const u of users) {
    const before = tx.get<{ due_day: string }>('SELECT due_day FROM belofte_offer WHERE user_id = ?', [u.id]);
    const after = ensureOffer(tx, deps, u.id);
    if (after && after.due_day !== before?.due_day) out.offers += 1;
  }
  return out;
}
