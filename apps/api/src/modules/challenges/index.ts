// Challenges (spec §3.7, §3.8, §4.6, §4.7; architecture §6.2, §6.3, §8.2). Owner WP-5.
// Performance challenges have fixed seats given at enrollment: no race, no draw. Prizes go through
// the PrizeService (WP-6) within the euro ceilings; the result needs the prize sample (SAMPLE_REQUIRED)
// and four eyes (FOUR_EYES_REQUIRED). No individual prize challenge for the research cohort during
// the rest period (spec §4.6; challenge terms B7, proposal).
import { calendarDatesOfUser } from '../../db/calendar.ts';
import { addDays, compareDays } from '@rewarded/core';
import { nextSeat, performanceProgress } from '@rewarded/core/challenges';
import { DomainError, routes, type AdminChallenge, type ChallengeRules, type PrizeSpec } from '@rewarded/contracts';
import { adminActor } from '../../db/services/audit.ts';
import type { Db } from '../../db/types.ts';
import { mount, reply } from '../../middleware/route.ts';
import type { ApiModule, ModuleDeps } from '../../module.ts';
import { prizeCeiling, type PrizeSpec as ServicePrizeSpec } from '../../services/prizes.ts';
import { P, ids, nowIso, studentOf, today, userById, userDays } from '../squads/lib/social.ts';
import type { ChallengeRow } from './scores.ts';

type StoredPrize = PrizeSpec & { prize_id: string };

function prizesOf(c: ChallengeRow): StoredPrize[] {
  try {
    return JSON.parse(c.prizes) as StoredPrize[];
  } catch {
    return [];
  }
}

function rulesOf(c: ChallengeRow): ChallengeRules {
  try {
    return JSON.parse(c.rules) as ChallengeRules;
  } catch {
    return {};
  }
}

function toAdmin(c: ChallengeRow): AdminChallenge {
  return {
    id: c.id,
    type: c.type,
    title_nl: c.title_nl,
    title_en: c.title_en,
    period_start_day: c.period_start_day,
    period_end_day: c.period_end_day,
    pool: c.pool,
    rules: rulesOf(c),
    status: c.status,
    prizes: prizesOf(c),
    proposed_by_ref: c.proposed_by,
    final_by_ref: c.final_by,
    final_confirmed_by_ref: c.final_confirmed_by,
  };
}

function challengeById(db: Db, id: string): ChallengeRow | undefined {
  return db.get<ChallengeRow>('SELECT * FROM challenge WHERE id = ?', [id]);
}

/** Euro ceilings and kinds (spec §4.3, §4.7): individual ≤ €10, main ≤ €150, threshold ≤ €75. */
function checkPrizes(type: ChallengeRow['type'], prizes: readonly PrizeSpec[]): void {
  for (const p of prizes) {
    if (type === 'performance' && p.kind !== 'earned_individual') throw new DomainError('KIND_NOT_ALLOWED', { reason: 'collective_prize_on_performance' });
    if (type !== 'performance' && p.kind !== 'earned_collective') throw new DomainError('KIND_NOT_ALLOWED', { reason: 'individual_prize_on_club_challenge' });
    if (type === 'club_warmup') throw new DomainError('KIND_NOT_ALLOWED', { reason: 'warmup_has_no_prize' });
    const tier = p.kind === 'earned_collective' ? (p.rank !== undefined ? 'main' : 'threshold') : undefined;
    if (tier === 'main' && P.challenges.club_prize_mode === 'threshold_only') throw new DomainError('VALIDATION_FAILED', { issues: [{ path: 'prizes.rank', code: 'threshold_only' }] });
    if (p.value_cents > prizeCeiling({ kind: p.kind, ...(tier ? { tier } : {}) })) throw new DomainError('CEILING_EXCEEDED');
  }
}

function toServiceSpec(p: PrizeSpec): ServicePrizeSpec {
  return {
    kind: p.kind,
    ...(p.kind === 'earned_collective' ? { tier: p.rank !== undefined ? ('main' as const) : ('threshold' as const) } : {}),
    rewardKind: p.reward_kind,
    valueCents: p.value_cents,
    partnerId: p.partner_id,
    allocationId: p.budget_id,
    declarationRef: p.declaration_ref,
    minAgeBand: p.min_age_band,
  };
}

/** The research cohort has no individual prize challenges from T + 1 to the end of A (spec §4.6, §3.16 step 6). */
function blockedByRestPeriod(db: Db, userId: string, c: ChallengeRow): boolean {
  const u = userById(db, userId);
  if (!u || u.cohort !== 'experiment' || c.type !== 'performance') return false;
  // The user's unit calendar: squad, else own club, else the default (spec §4.13).
  const rp = calendarDatesOfUser(db, userId, P).restPeriod;
  const first = rp.first_day;
  const last = rp.last_day;
  return compareDays(c.period_start_day, last) <= 0 && compareDays(c.period_end_day, first) >= 0;
}

/** SAMPLE_REQUIRED unless a prize sample of WP-6 exists for the club and every item is judged. */
function sampleJudged(db: Db, challengeId: string, clubId: string): boolean {
  try {
    const s = db.get<{ id: string }>("SELECT id FROM fraud_sample WHERE kind = 'prize' AND challenge_id = ? AND club_id = ? ORDER BY drawn_at DESC LIMIT 1", [challengeId, clubId]);
    if (!s) return false;
    const open = db.get<{ n: number }>("SELECT count(*) AS n FROM fraud_sample_item WHERE sample_id = ? AND (judged_at IS NULL OR judgement IS NULL)", [s.id]);
    return (open?.n ?? 1) === 0;
  } catch {
    return false;
  }
}

function seatsLeft(db: Db, c: ChallengeRow): number | undefined {
  const seats = rulesOf(c).seats;
  if (c.type !== 'performance' || seats === undefined) return undefined;
  const taken = db.get<{ n: number }>("SELECT count(*) AS n FROM challenge_enrollment WHERE challenge_id = ? AND seat_no IS NOT NULL AND status <> 'withdrawn'", [c.id])!.n;
  return Math.max(0, seats - taken);
}

function admin(deps: ModuleDeps, userId: string): `admin:${string}` {
  return adminActor(deps.platform.hasher, userId);
}

export const module: ApiModule = {
  name: 'challenges',
  owner: 'WP-5',
  register(api, deps) {
    const { db, services } = deps;

    mount(api, routes['challenges.list'], ({ auth }) => {
      const me = studentOf(auth);
      const locale = auth.kind === 'user' ? auth.user.locale : 'nl';
      const rows = db.all<ChallengeRow>("SELECT * FROM challenge WHERE status IN ('published', 'running', 'review', 'final') AND period_end_day >= ? ORDER BY period_start_day", [
        addDays(today(deps), -14),
      ]);
      return {
        items: rows
          .filter((c) => !blockedByRestPeriod(db, me.id, c))
          // No 18+ prize, title or description for a minor (UX principle P10).
          .filter((c) => me.ageBand === '18_plus' || !prizesOf(c).some((p) => p.min_age_band === '18_plus'))
          .map((c) => {
            const prize = prizesOf(c)[0];
            const left = seatsLeft(db, c);
            return {
              id: c.id,
              type: c.type,
              title: locale === 'en' ? c.title_en : c.title_nl,
              period: { start_day: c.period_start_day, end_day: c.period_end_day },
              ...(left !== undefined ? { seats_left: left } : {}),
              prize: prize ? { kind: prize.kind, description: locale === 'en' ? prize.description_en : prize.description_nl } : null,
            };
          }),
      };
    });

    mount(api, routes['challenges.enroll'], ({ auth, params }) => {
      const me = studentOf(auth);
      const c = challengeById(db, params.id);
      if (!c || c.type !== 'performance') throw new DomainError('NOT_FOUND');
      // Enrolling is only possible before the start (spec §3.8 step 2).
      if (c.status !== 'published' || compareDays(today(deps), c.period_start_day) >= 0) throw new DomainError('ENROLLMENT_CLOSED');
      if (blockedByRestPeriod(db, me.id, c)) throw new DomainError('ENROLLMENT_CLOSED', { reason: 'rest_period' });
      if (prizesOf(c).some((p) => p.min_age_band === '18_plus') && me.ageBand !== '18_plus') throw new DomainError('AGE_RESTRICTED');
      const seats = rulesOf(c).seats ?? 0;
      const result = db.transaction(() => {
        const existing = db.get<{ id: string; seat_no: number | null; enrolled_at: string; status: 'enrolled' }>('SELECT id, seat_no, enrolled_at, status FROM challenge_enrollment WHERE challenge_id = ? AND user_id = ?', [
          c.id,
          me.id,
        ]);
        if (existing) return { enrollment: { id: existing.id, challenge_id: c.id, status: existing.status, enrolled_at: existing.enrolled_at }, seat_no: existing.seat_no };
        const taken = db.all<{ seat_no: number }>('SELECT seat_no FROM challenge_enrollment WHERE challenge_id = ? AND seat_no IS NOT NULL', [c.id]).map((r) => r.seat_no);
        const seat = nextSeat(taken, seats);
        if (seat === null) throw new DomainError('SEATS_FULL');
        const id = ids(deps).ulid();
        const at = nowIso(deps);
        db.run("INSERT INTO challenge_enrollment (id, challenge_id, user_id, seat_no, enrolled_at, status) VALUES (?, ?, ?, ?, ?, 'enrolled')", [id, c.id, me.id, seat, at]);
        services.events.event(db, 'challenge_enrolled', { challenge_id: c.id }, { pseudonym: me.pseudonym });
        return { enrollment: { id, challenge_id: c.id, status: 'enrolled' as const, enrolled_at: at }, seat_no: seat };
      });
      return reply(201, result);
    });

    mount(api, routes['challenges.progress'], ({ auth, params }) => {
      const me = studentOf(auth);
      const c = challengeById(db, params.id);
      const e = c ? db.get<{ status: 'enrolled' | 'achieved' | 'failed' | 'verified' | 'rejected' | 'withdrawn' }>('SELECT status FROM challenge_enrollment WHERE challenge_id = ? AND user_id = ?', [c.id, me.id]) : undefined;
      if (!c || !e) throw new DomainError('NOT_ENROLLED');
      const rules = rulesOf(c);
      const t = today(deps);
      // counted_min_final: open and rejected flags do not count for challenges (architecture §6.1).
      const rows = userDays(deps).range([me.id], c.period_start_day, c.period_end_day).map((r) => ({ day: r.focusDay, countedMinFinal: r.countedMinFinal }));
      const p = performanceProgress({ first_day: c.period_start_day, last_day: c.period_end_day }, rows, { dayMinutes: rules.day_minutes ?? 120, ...(rules.required_days ? { requiredDays: rules.required_days } : {}) }, addDays(t, -1));
      const status = e.status === 'enrolled' && compareDays(t, c.period_end_day) > 0 ? p.status : e.status;
      return { days: p.days, status };
    });

    // ---- Admin (architecture §8.2 Beheer; spec §4.11 Challenges) ----

    mount(api, routes['admin.challenges.create'], ({ auth, body }) => {
      const actor = admin(deps, studentOf(auth).id);
      if (compareDays(body.period_start_day, body.period_end_day) > 0) throw new DomainError('VALIDATION_FAILED', { issues: [{ path: 'period_end_day', code: 'before_start' }] });
      if (body.type === 'performance' && (body.rules.day_minutes === undefined || body.rules.seats === undefined)) {
        throw new DomainError('VALIDATION_FAILED', { issues: [{ path: 'rules', code: 'day_minutes_and_seats_required' }] });
      }
      checkPrizes(body.type, body.prizes);
      const c = db.transaction(() => {
        const id = ids(deps).ulid();
        // The challenge row first: prize.challenge_id refers to it (integration fix of the 500 in WP-11).
        db.run(
          `INSERT INTO challenge (id, type, title_nl, title_en, period_start_day, period_end_day, pool, rules, prizes, status, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]', 'draft', ?, ?)`,
          [id, body.type, body.title_nl, body.title_en, body.period_start_day, body.period_end_day, body.pool ?? null, JSON.stringify(body.rules), actor, nowIso(deps)],
        );
        const prizeIds = body.prizes.length > 0 ? services.prizes.createForChallenge(db, id, body.prizes.map(toServiceSpec)) : [];
        const stored: StoredPrize[] = body.prizes.map((p, i) => ({ ...p, prize_id: prizeIds[i] ?? ids(deps).ulid() }));
        db.run('UPDATE challenge SET prizes = ? WHERE id = ?', [JSON.stringify(stored), id]);
        services.audit.audit(db, { actor, action: 'challenge_created', objectType: 'challenge', objectRef: id });
        return challengeById(db, id)!;
      });
      return reply(201, { challenge: toAdmin(c) });
    });

    mount(api, routes['admin.challenges.publish'], ({ auth, params }) => {
      const actor = admin(deps, studentOf(auth).id);
      const c = challengeById(db, params.id);
      if (!c) throw new DomainError('NOT_FOUND');
      checkPrizes(c.type, prizesOf(c));
      db.transaction(() => {
        db.run("UPDATE challenge SET status = 'published', published_by = ? WHERE id = ? AND status = 'draft'", [actor, c.id]);
        services.audit.audit(db, { actor, action: 'challenge_published', objectType: 'challenge', objectRef: c.id });
      });
      return { challenge: toAdmin(challengeById(db, c.id)!) };
    });

    mount(api, routes['admin.challenges.propose'], ({ auth, params, body }) => {
      const actor = admin(deps, studentOf(auth).id);
      const c = challengeById(db, params.id);
      if (!c) throw new DomainError('NOT_FOUND');
      if (c.status === 'final' || c.status === 'draft') throw new DomainError('VALIDATION_FAILED', { issues: [{ path: 'status', code: c.status }] });
      // Every collective winner needs a judged prize sample of 20 counted members (architecture §6.2).
      for (const w of body.winners) if (w.club_id && !sampleJudged(db, c.id, w.club_id)) throw new DomainError('SAMPLE_REQUIRED', { club_id: w.club_id });
      db.transaction(() => {
        for (const w of body.winners) {
          let userId: string | undefined;
          if (w.user_ref) {
            const e = db.get<{ user_id: string | null }>("SELECT user_id FROM challenge_enrollment WHERE id = ? AND challenge_id = ?", [w.user_ref, c.id]);
            if (!e?.user_id) throw new DomainError('VALIDATION_FAILED', { issues: [{ path: 'winners.user_ref', code: 'unknown_enrollment' }] });
            userId = e.user_id;
          }
          services.prizes.proposeWinner(db, { prizeId: w.prize_id, ...(userId ? { userId } : {}), ...(w.club_id ? { clubId: w.club_id } : {}) });
        }
        db.run("UPDATE challenge SET status = 'review', proposed_by = ?, final_by = ?, final_confirmed_by = NULL, proposal = ? WHERE id = ?", [actor, actor, JSON.stringify(body), c.id]);
        services.audit.audit(db, { actor, action: 'challenge_result_proposed', objectType: 'challenge', objectRef: c.id, ...(body.note ? { reason: body.note.slice(0, 200) } : {}) });
      });
      return { challenge: toAdmin(challengeById(db, c.id)!) };
    });

    mount(api, routes['admin.challenges.confirm'], ({ auth, params }) => {
      const actor = admin(deps, studentOf(auth).id);
      const c = challengeById(db, params.id);
      if (!c) throw new DomainError('NOT_FOUND');
      if (c.status !== 'review' || !c.final_by) throw new DomainError('SAMPLE_REQUIRED');
      if (c.final_by === actor) throw new DomainError('FOUR_EYES_REQUIRED');
      db.transaction(() => {
        db.run("UPDATE challenge SET status = 'final', final_confirmed_by = ? WHERE id = ?", [actor, c.id]);
        db.run('UPDATE challenge_score SET is_final = 1 WHERE challenge_id = ?', [c.id]);
        services.audit.audit(db, { actor, action: 'challenge_result_confirmed', objectType: 'challenge', objectRef: c.id });
      });
      return { challenge: toAdmin(challengeById(db, c.id)!) };
    });
  },
};
