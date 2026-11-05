// The Belofte (spec §3.12, §4.12; architecture §6.3, §8.2). Owner WP-5. Behind the flag `belofte`.
// No points, badges or prizes; the squad sees it only through squad_belofte_v. Before the own offer
// nobody can start a Belofte (otherwise the late arm leaks).
import { compareDays } from '@rewarded/core';
import { ratioToHistory } from '@rewarded/core/belofte';
import { DomainError, routes } from '@rewarded/contracts';
import type { Db } from '../../db/types.ts';
import { requireFeature } from '../../middleware/feature.ts';
import { mount, reply } from '../../middleware/route.ts';
import type { ApiModule } from '../../module.ts';
import { ids, nowIso, studentOf, today, userDays } from '../squads/lib/social.ts';
import { activeBelofte, createBelofte, ensureOffer, suggestionFor, type BelofteRow, type OfferRow } from './logic.ts';

function dto(b: BelofteRow) {
  return { id: b.id, days_per_week: b.days_per_week, min_per_day: b.min_per_day, witnesses: b.witnesses, start_day: b.start_day, end_day: b.end_day, status: b.status };
}

function owned(db: Db, id: string, userId: string): BelofteRow {
  const b = db.get<BelofteRow>('SELECT * FROM belofte WHERE id = ?', [id]);
  if (!b) throw new DomainError('NOT_FOUND');
  if (b.user_id !== userId) throw new DomainError('FORBIDDEN');
  return b;
}

const clampDays = (n: number): 3 | 4 | 5 | 6 | 7 => Math.min(7, Math.max(3, n)) as 3 | 4 | 5 | 6 | 7;
const asMinutes = (n: number): 25 | 50 | 90 | 120 => ([25, 50, 90, 120].includes(n) ? n : 25) as 25 | 50 | 90 | 120;

export const module: ApiModule = {
  name: 'belofte',
  owner: 'WP-5',
  register(api, deps) {
    const { db, services } = deps;
    api.use('/belofte/*', requireFeature('belofte'));
    api.use('/beloftes', requireFeature('belofte'));
    api.use('/beloftes/*', requireFeature('belofte'));

    mount(api, routes['belofte.offer'], ({ auth }) => {
      const me = studentOf(auth);
      const t = today(deps);
      const offer = db.transaction(() => ensureOffer(db, deps, me.id));
      if (!offer || compareDays(offer.due_day, t) > 0 || activeBelofte(db, me.id)) return {};
      if (!offer.offered_at) db.run('UPDATE belofte_offer SET offered_at = ? WHERE user_id = ? AND offered_at IS NULL', [nowIso(deps), me.id]);
      const s = suggestionFor(deps, me.id, t);
      return { offer: { suggested_days: clampDays(s.daysPerWeek), suggested_min: asMinutes(s.minPerDay), trigger: offer.trigger } };
    });

    mount(api, routes['beloftes.create'], ({ auth, body }) => {
      const me = studentOf(auth);
      const t = today(deps);
      const result = db.transaction(() => {
        const offer = ensureOffer(db, deps, me.id);
        if (!offer || compareDays(offer.due_day, t) > 0) throw new DomainError('OFFER_NOT_YET');
        if (activeBelofte(db, me.id)) throw new DomainError('BELOFTE_ACTIVE');
        if (!offer.offered_at) db.run('UPDATE belofte_offer SET offered_at = ? WHERE user_id = ?', [nowIso(deps), me.id]);
        const b = createBelofte(db, deps, { id: ids(deps).ulid(), userId: me.id, daysPerWeek: body.days_per_week, minPerDay: body.min_per_day, witnesses: body.witnesses, startDay: t });
        services.events.event(
          db,
          'belofte_made',
          { dagen_per_week: body.days_per_week, min_per_dag: body.min_per_day, getuigen: body.witnesses, verhouding_tot_historie: ratioToHistory(body.min_per_day, body.days_per_week, suggestionFor(deps, me.id, t)) },
          { pseudonym: me.pseudonym },
        );
        return b;
      });
      return reply(201, { belofte: dto(result) });
    });

    mount(api, routes['beloftes.current'], ({ auth }) => {
      const me = studentOf(auth);
      const b =
        activeBelofte(db, me.id) ??
        db.get<BelofteRow>("SELECT * FROM belofte WHERE user_id = ? AND status = 'completed' AND reflection_action IS NULL ORDER BY end_day DESC LIMIT 1", [me.id]);
      if (!b) throw new DomainError('NOT_FOUND');
      const days = db.all<{ focus_day: string; minutes: number; met: number }>('SELECT focus_day, minutes, met FROM belofte_day WHERE belofte_id = ? ORDER BY focus_day', [b.id]).map((d) => ({
        day: d.focus_day,
        minutes: d.minutes,
        met: d.met === 1,
      }));
      const t = today(deps);
      // Today is provisional until the day close (counted_min, flagged sessions count for now).
      if (b.status === 'active' && compareDays(t, b.end_day) <= 0 && !days.some((d) => d.day === t)) {
        const minutes = userDays(deps).get(me.id, t)?.countedMin ?? 0;
        days.push({ day: t, minutes, met: minutes >= b.min_per_day });
      }
      return { belofte: dto(b), days };
    });

    mount(api, routes['beloftes.stop'], ({ auth, params }) => {
      const me = studentOf(auth);
      const b = owned(db, params.id, me.id);
      if (b.status === 'active') {
        db.transaction(() => {
          db.run("UPDATE belofte SET status = 'stopped', stopped_day = ? WHERE id = ?", [today(deps), b.id]);
          services.events.event(db, 'belofte_stopped', { dag: today(deps) }, { pseudonym: me.pseudonym });
        });
      }
      return { status: 'stopped' as const };
    });

    mount(api, routes['beloftes.reflection'], ({ auth, params, body }) => {
      const me = studentOf(auth);
      const b = owned(db, params.id, me.id);
      // One voluntary question about a stake for a good cause, 18+ only (spec §3.12 step 5).
      if (body.stake_interest !== undefined && me.ageBand !== '18_plus') throw new DomainError('AGE_RESTRICTED');
      if (b.status === 'active' && compareDays(today(deps), b.end_day) <= 0) throw new DomainError('VALIDATION_FAILED', { issues: [{ path: 'status', code: 'not_finished' }] });
      return db.transaction(() => {
        db.run("UPDATE belofte SET status = CASE WHEN status = 'active' THEN 'completed' ELSE status END, reflection_action = ?, stake_interest = ? WHERE id = ?", [
          body.action,
          body.stake_interest ?? null,
          b.id,
        ]);
        services.events.event(db, 'belofte_reflection', { actie: body.action, ...(body.stake_interest ? { stake_interest: body.stake_interest } : {}) }, { pseudonym: me.pseudonym });
        if (body.action === 'stop') return { next: 'done' as const };
        if (body.action === 'adjust') return { next: 'adjust' as const };
        if (activeBelofte(db, me.id)) return { next: 'done' as const };
        const offer = db.get<OfferRow>('SELECT * FROM belofte_offer WHERE user_id = ?', [me.id]);
        // Early arm: the pre-registered renewal, once, with the same text for everybody (spec §4.12).
        if (offer?.trigger === 'early' && offer.renewal_used_at === null) db.run('UPDATE belofte_offer SET renewal_used_at = ? WHERE user_id = ?', [nowIso(deps), me.id]);
        createBelofte(db, deps, { id: ids(deps).ulid(), userId: me.id, daysPerWeek: b.days_per_week, minPerDay: b.min_per_day, witnesses: b.witnesses, startDay: today(deps), renewalOf: b.id });
        return { next: 'new_belofte' as const };
      });
    });
  },
};
