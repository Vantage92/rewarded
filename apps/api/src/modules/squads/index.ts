// Squads (spec §3.5, §4.4; architecture §6.3, §6.4, §8.2). Owner WP-5.
// Live presence without minutes and without silent members, mutual opt-in for minute comparison
// (view squad_compare_v), witnesses only through squad_belofte_v, invite moments, regroup and merge
// within the same rest-period arm, and the name report button (art. 16 DSA).
import { addDays, weekKey } from '@rewarded/core';
import { inviteMomentAllowed, mergeAllowed, regroupOpen } from '@rewarded/core/squads';
import { DomainError, routes, type SquadDto, type SquadMineResponse } from '@rewarded/contracts';
import type { Db } from '../../db/types.ts';
import { mount, reply } from '../../middleware/route.ts';
import type { ApiModule, ModuleDeps } from '../../module.ts';
import { addMember, leaveSquad, logJoinSwitches } from './lib/membership.ts';
import { nameAllowed } from './lib/names.ts';
import { registerSocialPrivacy } from './lib/privacy.ts';
import { installSocialService } from './lib/service.ts';
import {
  DAY_MS,
  P,
  activeSession,
  calendarById,
  calendarOfClub,
  clubOfUser,
  createInvite,
  ids,
  inviteDto,
  memberRef,
  mySquad,
  nowIso,
  openMembers,
  squadById,
  studentOf,
  today,
  userById,
  userDays,
  type SquadRow,
} from './lib/social.ts';

function squadDto(s: SquadRow, userId: string): SquadDto {
  return {
    id: s.id,
    name: s.name,
    name_status: s.name_status,
    club_id: s.club_id,
    status: s.status,
    is_admin: s.admin_user_id === userId,
    created_at: s.created_at,
  };
}

/** GET /squads/mine: first names, pause and today's goal; no minutes (architecture §6.4). */
export function squadMine(deps: ModuleDeps, userId: string): SquadMineResponse {
  const { squad } = mySquad(deps.db, userId);
  const day = today(deps);
  const members = openMembers(deps.db, squad.id).filter((m) => m.user_id !== null);
  const reader = userDays(deps);
  const isPaused = (m: (typeof members)[number]) => m.paused_since_day !== null && m.paused_since_day <= day;
  const active = members.filter((m) => !isPaused(m));
  return {
    squad: squadDto(squad, userId),
    members: members.map((m) => {
      const u = userById(deps.db, m.user_id!);
      // Silent mode hides the status of the member (architecture §6.4, UX §146); the own row stays complete.
      if (u && u.silent_mode === 1 && m.user_id !== userId) return { first_name: u.first_name, status: 'silent' as const };
      return {
        first_name: u?.first_name ?? '—',
        paused: isPaused(m),
        goal_met_today: reader.get(m.user_id!, day)?.goalMet ?? false,
      };
    }),
    streak: squad.streak,
    status: squad.status,
    today: { active: active.length, goal_met: active.filter((m) => reader.get(m.user_id!, day)?.goalMet === true).length },
  };
}

function squadInviteRow(db: Db, squadId: string): { created_at: string } | undefined {
  return db.get<{ created_at: string }>("SELECT created_at FROM invite WHERE squad_id = ? AND source = 'squad' ORDER BY created_at DESC LIMIT 1", [squadId]);
}

function squadInvite(tx: Db, deps: ModuleDeps, squad: SquadRow, user: { id: string; pseudonym: string }) {
  return createInvite(tx, deps, {
    source: 'squad',
    creator: user,
    squadId: squad.id,
    ...(squad.club_id ? { clubId: squad.club_id } : {}),
    maxUses: P.squads.invite_max_uses,
    validMs: P.squads.invite_valid_days * DAY_MS,
  });
}

function canRegroup(deps: ModuleDeps, squad: SquadRow): boolean {
  if (squad.low_activity_since_day === null) return false;
  return regroupOpen(today(deps), calendarById(deps.db, squad.calendar_id).examPeriods);
}

export const module: ApiModule = {
  name: 'squads',
  owner: 'WP-5',
  register(api, deps) {
    const { db, services } = deps;
    registerSocialPrivacy(deps);
    installSocialService(deps);

    mount(api, routes['squads.create'], ({ auth, body }) => {
      const me = studentOf(auth);
      if (!nameAllowed(body.name)) throw new DomainError('NAME_REJECTED');
      const user = userById(db, me.id);
      if (!user) throw new DomainError('AUTH_REQUIRED');
      const clubId = body.club_id ?? clubOfUser(db, me.id);
      if (body.club_id && !db.get("SELECT 1 AS x FROM club WHERE id = ? AND status = 'active'", [body.club_id])) {
        throw new DomainError('VALIDATION_FAILED', { issues: [{ path: 'club_id', code: 'unknown_club' }] });
      }
      const result = db.transaction(() => {
        const id = ids(deps).ulid();
        const day = today(deps);
        // Arms per squad at creation (spec §5 Toewijzing); the expansion cohort has none (§4.13).
        let arms: { bonus: 'A' | 'B'; belofte: 'early' | 'late'; rest: 'rest' | 'continue' } | null = null;
        let block: string | null = null;
        if (user.cohort === 'experiment') {
          const a = services.experiments.assign(db, { type: 'squad', id, stratum: `${clubId ?? 'none'}|${user.registration_channel}` }, ['bonus', 'belofte', 'rest']);
          arms = { bonus: a.arms.bonus, belofte: a.arms.belofte, rest: a.arms.rest };
          block = a.block.slice(0, 64);
        }
        db.run(
          `INSERT INTO squad (id, name, name_status, club_id, calendar_id, cohort, admin_user_id, status, arm_bonus, arm_belofte, arm_rest, assignment_block, created_at, created_day)
           VALUES (?, ?, 'ok', ?, ?, ?, ?, 'building', ?, ?, ?, ?, ?, ?)`,
          [id, body.name, clubId, calendarOfClub(db, clubId), user.cohort, me.id, arms?.bonus ?? null, arms?.belofte ?? null, arms?.rest ?? null, block, nowIso(deps), day],
        );
        const squad = squadById(db, id)!;
        const invite = squadInvite(db, deps, squad, me);
        addMember(db, deps, squad, me, { role: 'maker', inviteId: invite.id, event: 'squad_created', switchReason: 'join' });
        if (arms) {
          services.events.event(
            db,
            'experiment_assigned',
            { arm_bonus: arms.bonus, arm_belofte: arms.belofte, arm_rest: arms.rest, arm_prompt: 'na', eenheid: 'squad', blok: block ?? '', age_band: user.age_band },
            { pseudonym: me.pseudonym, squadId: id },
          );
        }
        return { squad: squadDto(squadById(db, id)!, me.id), invite: inviteDto(deps, invite) };
      });
      return reply(201, result);
    });

    mount(api, routes['squads.mine'], ({ auth }) => squadMine(deps, studentOf(auth).id));

    mount(api, routes['squads.presence'], ({ auth }) => {
      const me = studentOf(auth);
      const { squad } = mySquad(db, me.id);
      const now = deps.platform.clock.now().getTime();
      const members = openMembers(db, squad.id).filter((m) => m.user_id !== null);
      const out: { member_ref: string; focusing: boolean; remaining_min?: number }[] = [];
      for (const m of members) {
        const u = userById(db, m.user_id!);
        // Silent members are left out completely; they still count for the streak (spec §4.4).
        if (!u || u.silent_mode === 1) continue;
        const s = activeSession(db, m.user_id!);
        const ref = memberRef(deps, squad.id, m.user_id!);
        if (s && s.planned_end_at > now) out.push({ member_ref: ref, focusing: true, remaining_min: Math.max(0, Math.ceil((s.planned_end_at - now) / 60_000)) });
        else out.push({ member_ref: ref, focusing: false });
      }
      const day = today(deps);
      const activeCount = members.filter((m) => !(m.paused_since_day !== null && m.paused_since_day <= day)).length;
      return { members: out, polled_at: new Date(now).toISOString(), active_count: activeCount };
    });

    mount(api, routes['squads.compare'], ({ auth }) => {
      const me = studentOf(auth);
      const { squad } = mySquad(db, me.id);
      const self = userById(db, me.id);
      if (!self || self.compare_opt_in !== 1) throw new DomainError('COMPARE_OPT_IN_REQUIRED');
      const day = today(deps);
      const week = weekKey(day, P.time.week_start_iso_weekday);
      // The view carries both opt-in conditions; this endpoint reads nothing else about members.
      const rows = db.all<{ member_id: string; first_name: string }>('SELECT member_id, first_name FROM squad_compare_v WHERE viewer_id = ? AND squad_id = ? ORDER BY first_name', [
        me.id,
        squad.id,
      ]);
      const reader = userDays(deps);
      return {
        members: rows.map((r) => {
          const days = reader.range([r.member_id], week, day);
          return {
            first_name: r.first_name,
            minutes_today: days.find((d) => d.focusDay === day)?.countedMin ?? 0,
            minutes_week: days.reduce((a, d) => a + d.countedMin, 0),
          };
        }),
      };
    });

    mount(api, routes['squads.beloftes'], ({ auth }) => {
      const me = studentOf(auth);
      mySquad(db, me.id);
      const rows = db.all<{ belofte_id: string; first_name: string; days_per_week: number; min_per_day: 25 | 50 | 90 | 120; start_day: string; end_day: string; status: 'active' | 'completed' | 'stopped' }>(
        "SELECT * FROM squad_belofte_v WHERE viewer_id = ? AND status <> 'stopped' OR (viewer_id = ? AND status = 'stopped' AND end_day >= ?) ORDER BY start_day",
        [me.id, me.id, addDays(today(deps), -14)],
      );
      return {
        items: rows.map((r) => ({
          first_name: r.first_name,
          days_per_week: r.days_per_week,
          min_per_day: r.min_per_day,
          start_day: r.start_day,
          end_day: r.end_day,
          status: r.status,
          days: db.all<{ focus_day: string; met: number }>('SELECT focus_day, met FROM belofte_day WHERE belofte_id = ? ORDER BY focus_day', [r.belofte_id]).map((d) => ({ day: d.focus_day, met: d.met === 1 })),
        })),
      };
    });

    mount(api, routes['squads.invite'], ({ auth }) => {
      const me = studentOf(auth);
      const { squad } = mySquad(db, me.id);
      const open = P.squads.max_size - openMembers(db, squad.id).length;
      if (open <= 0) throw new DomainError('SQUAD_FULL');
      const last = squadInviteRow(db, squad.id);
      const allowed = inviteMomentAllowed({ openSpots: open, lastInviteAt: last ? Date.parse(last.created_at) : null, now: deps.platform.clock.now().getTime() }, P.squads);
      if (!allowed) throw new DomainError('INVITE_MOMENT_NOT_ALLOWED');
      const invite = db.transaction(() => squadInvite(db, deps, squad, me));
      return reply(201, { invite: inviteDto(deps, invite) });
    });

    mount(api, routes['squads.patch'], ({ auth, body }) => {
      const me = studentOf(auth);
      const { squad } = mySquad(db, me.id);
      if (squad.admin_user_id !== me.id) throw new DomainError('FORBIDDEN');
      if (body.name !== undefined && !nameAllowed(body.name)) throw new DomainError('NAME_REJECTED');
      db.transaction(() => {
        if (body.name !== undefined) db.run("UPDATE squad SET name = ?, name_status = 'ok' WHERE id = ?", [body.name, squad.id]);
        if (body.club_id !== undefined) {
          if (body.club_id !== null && !db.get("SELECT 1 AS x FROM club WHERE id = ? AND status = 'active'", [body.club_id])) {
            throw new DomainError('VALIDATION_FAILED', { issues: [{ path: 'club_id', code: 'unknown_club' }] });
          }
          db.run('UPDATE squad SET club_id = ?, calendar_id = ? WHERE id = ?', [body.club_id, calendarOfClub(db, body.club_id), squad.id]);
        }
      });
      return { squad: squadDto(squadById(db, squad.id)!, me.id) };
    });

    mount(api, routes['squads.leave'], ({ auth }) => {
      const me = studentOf(auth);
      mySquad(db, me.id);
      db.transaction(() => leaveSquad(db, deps, me));
      return undefined;
    });

    mount(api, routes['squads.regroup'], ({ auth }) => {
      const me = studentOf(auth);
      const { squad } = mySquad(db, me.id);
      if (!canRegroup(deps, squad)) throw new DomainError('NOT_ELIGIBLE');
      if (openMembers(db, squad.id).length >= P.squads.max_size) throw new DomainError('NOT_ELIGIBLE', { reason: 'squad_full' });
      const invite = db.transaction(() => squadInvite(db, deps, squad, me));
      return reply(201, { invite: inviteDto(deps, invite) });
    });

    mount(api, routes['squads.mergeRequest'], ({ auth, body }) => {
      const me = studentOf(auth);
      const { squad } = mySquad(db, me.id);
      const target = squadById(db, body.target_squad_ref);
      if (!target || target.id === squad.id || target.status === 'archived' || !canRegroup(deps, squad)) throw new DomainError('NOT_ELIGIBLE');
      const verdict = mergeAllowed(
        { clubId: squad.club_id, armRest: squad.arm_rest, lowActivity: squad.low_activity_since_day !== null, cohort: squad.cohort },
        { clubId: target.club_id, armRest: target.arm_rest, lowActivity: target.low_activity_since_day !== null, cohort: target.cohort },
      );
      // MERGE_ARM_MISMATCH (arch §8.3, round 2); details.reason kept for older clients.
      if (verdict === 'arm_mismatch') throw new DomainError('MERGE_ARM_MISMATCH', { reason: 'merge_arm_mismatch' });
      if (verdict !== 'ok') throw new DomainError('NOT_ELIGIBLE');
      const id = ids(deps).ulid();
      const expires = new Date(deps.platform.clock.now().getTime() + P.squads.invite_valid_days * DAY_MS).toISOString();
      db.run('INSERT INTO squad_merge_request (id, from_squad_id, to_squad_id, requested_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)', [
        id,
        squad.id,
        target.id,
        me.id,
        nowIso(deps),
        expires,
      ]);
      return reply(201, { merge_request_id: id, expires_at: expires });
    });

    mount(api, routes['squads.mergeAccept'], ({ auth, params }) => {
      const me = studentOf(auth);
      const { squad: mine } = mySquad(db, me.id);
      const req = db.get<{ id: string; from_squad_id: string; to_squad_id: string; status: string; expires_at: string }>('SELECT * FROM squad_merge_request WHERE id = ?', [params.id]);
      if (!req || req.status !== 'open' || req.to_squad_id !== mine.id || req.expires_at <= nowIso(deps)) throw new DomainError('NOT_ELIGIBLE');
      const from = squadById(db, req.from_squad_id);
      if (!from || from.status === 'archived' || !canRegroup(deps, mine)) throw new DomainError('NOT_ELIGIBLE');
      const verdict = mergeAllowed(
        { clubId: from.club_id, armRest: from.arm_rest, lowActivity: from.low_activity_since_day !== null, cohort: from.cohort },
        { clubId: mine.club_id, armRest: mine.arm_rest, lowActivity: mine.low_activity_since_day !== null, cohort: mine.cohort },
      );
      if (verdict === 'arm_mismatch') throw new DomainError('MERGE_ARM_MISMATCH', { reason: 'merge_arm_mismatch' });
      if (verdict !== 'ok') throw new DomainError('NOT_ELIGIBLE');
      const a = openMembers(db, from.id);
      const b = openMembers(db, mine.id);
      if (a.length + b.length > P.squads.max_size) throw new DomainError('SQUAD_FULL');
      // The merged squad keeps the arms of the larger squad (spec §4.4); ties keep the accepting one.
      const [keep, gone, moving] = a.length > b.length ? [from, mine, b] : [mine, from, a];
      db.transaction(() => {
        for (const m of moving) {
          if (!m.user_id) continue;
          const u = userById(db, m.user_id)!;
          leaveSquad(db, deps, { id: u.id, pseudonym: u.pseudonym }, { event: false });
          addMember(db, deps, squadById(db, keep.id)!, { id: u.id, pseudonym: u.pseudonym }, { role: 'member', inviteId: null, event: 'squad_joined' });
          logJoinSwitches(db, deps, u.id, keep, 'merge', gone);
        }
        db.run("UPDATE squad SET merged_into = ?, status = 'archived' WHERE id = ?", [keep.id, gone.id]);
        db.run("UPDATE squad_merge_request SET status = 'accepted', accepted_at = ? WHERE id = ?", [nowIso(deps), req.id]);
        db.run('UPDATE squad SET low_activity_since_day = NULL, regroup_offered_at = NULL WHERE id = ?', [keep.id]);
        services.events.event(db, 'squad_merged', { squad_id: gone.id }, { pseudonym: me.pseudonym, squadId: keep.id });
      });
      return squadMine(deps, me.id);
    });

    mount(api, routes['squads.nameReport'], ({ auth, params, body }) => {
      const me = studentOf(auth);
      const squad = squadById(db, params.id);
      if (!squad) throw new DomainError('NOT_FOUND');
      if (db.get('SELECT 1 AS x FROM squad_name_report WHERE squad_id = ? AND reporter_user_id = ?', [squad.id, me.id])) throw new DomainError('ALREADY_REPORTED');
      const flagId = db.transaction(() => {
        const id = services.flags.raise(db, { code: 'NAME_REPORT', subject: { type: 'squad', id: squad.id }, sessionIds: [], evidence: { reason: body.reason ?? 'other' } });
        db.run('INSERT INTO squad_name_report (squad_id, reporter_user_id, flag_id, created_at) VALUES (?, ?, ?, ?)', [squad.id, me.id, id, nowIso(deps)]);
        db.run("UPDATE squad SET name_status = 'reported' WHERE id = ? AND name_status = 'ok'", [squad.id]);
        services.events.event(db, 'squad_name_reported', { squad_id: squad.id }, { pseudonym: me.pseudonym });
        return id;
      });
      return reply(201, { flag_id: flagId });
    });

    api.get('/squads/health', (c) => c.json({ module: 'squads', status: 'ok' }));
  },
};
