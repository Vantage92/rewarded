// Clubs, the board dashboard and the club admin routes (spec §3.7, §4.6, §4.10; architecture §6.2,
// §6.4, §8.2). Owner WP-5. The board sees aggregates only: weekly numbers rounded to fives, hidden
// below 5 members and when they moved less than 5 since the last shown week (core/privacy). The
// board queries never select a user id; they read the weekly snapshot club_week_stat.
import { isoWeekKey } from '@rewarded/core/catalog';
import { codeCap, poolFor } from '@rewarded/core/challenges';
import { groupMetric, shareFromRounded, suppressCount, toMetric, weeklyCountSeries, type Metric, type PrivacyRules } from '@rewarded/core/privacy';
import { DomainError, routes, type AdminClub, type BoardDashboardResponse } from '@rewarded/contracts';
import { adminActor, auditRef } from '../../db/services/audit.ts';
import type { Db } from '../../db/types.ts';
import { mount, reply } from '../../middleware/route.ts';
import type { ApiModule, ModuleDeps } from '../../module.ts';
import { P, focusDayOfIso, ids, nowIso, studentOf, today } from '../squads/lib/social.ts';
import { clubById, clubDto, linkClub, type ClubRow } from './link.ts';
import { clubWeekStats, type ClubWeekStat } from './stats.ts';
import { registerCalendarRoutes } from './calendars.ts';

const RULES: PrivacyRules = P.board;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function newJoinCode(deps: ModuleDeps, db: Db): string {
  for (;;) {
    let code = '';
    for (let i = 0; i < 6; i += 1) code += CODE_ALPHABET[deps.platform.random.int(CODE_ALPHABET.length)];
    if (!db.get('SELECT 1 AS x FROM club WHERE join_code = ?', [code])) return code;
  }
}

function adminClub(deps: ModuleDeps, db: Db, c: ClubRow): AdminClub {
  const board = db.all<{ user_id: string }>('SELECT user_id FROM club_board_member WHERE club_id = ? ORDER BY user_id', [c.id]);
  let help: AdminClub['help_resources'] = [];
  try {
    help = JSON.parse(c.help_resources) as AdminClub['help_resources'];
  } catch {
    help = [];
  }
  return {
    ...clubDto(c),
    members_source_ref: c.members_source_ref,
    members_fixed_at: c.members_fixed_at,
    agreement_ref: c.agreement_ref,
    join_code: c.join_code,
    code_cap: codeCap(c.declared_members, P.challenges),
    status: c.status,
    help_resources: help,
    board_member_refs: board.map((b) => auditRef(deps.platform.hasher, b.user_id)),
    exam_calendar_id: c.exam_calendar_id,
    april_members: (c as ClubRow & { april_members?: number | null }).april_members ?? null,
  };
}

/** Spec §4.13: a club gets a code only with an agreement and a club calendar (never the default). */
function calendarUsable(db: Db, calendarId: string | null | undefined): boolean {
  if (!calendarId) return false;
  const row = db.get<{ is_default: number }>('SELECT is_default FROM exam_calendar WHERE id = ?', [calendarId]);
  return row !== undefined && row.is_default === 0;
}

function requireClubCalendar(db: Db, calendarId: string | null | undefined): void {
  if (calendarId && !calendarUsable(db, calendarId)) throw new DomainError('VALIDATION_FAILED', { field: 'exam_calendar_id' });
}

function requireBoard(db: Db, userId: string, clubId: string): ClubRow {
  const club = clubById(db, clubId);
  if (!club || !db.get('SELECT 1 AS x FROM club_board_member WHERE user_id = ? AND club_id = ?', [userId, clubId])) throw new DomainError('FORBIDDEN');
  return club;
}

function adminOf(deps: ModuleDeps, userId: string): `admin:${string}` {
  return adminActor(deps.platform.hasher, userId);
}

function addBoardMembers(db: Db, clubId: string, emails: readonly string[], by: string, at: string): void {
  for (const email of emails) {
    const u = db.get<{ id: string }>('SELECT id FROM user WHERE lower(email) = lower(?)', [email]);
    if (u) db.run('INSERT OR IGNORE INTO club_board_member (user_id, club_id, role, created_by, created_at) VALUES (?, ?, ?, ?, ?)', [u.id, clubId, 'board', by, at]);
  }
}

/** Last value of a weekly series after rules 1–3. */
function lastOf(series: readonly { count: number; groupSize: number }[]): Metric {
  const out = weeklyCountSeries(series, RULES);
  return out.length > 0 ? toMetric(out[out.length - 1]!) : { value: null, suppressed: true };
}

/** Werving, Prijs and Kwaliteit from the weekly snapshot (architecture §6.4 rules 1–3). */
function boardFromStats(stats: readonly ClubWeekStat[]) {
  const last = stats[stats.length - 1];
  const linkedSeries = stats.map((s) => ({ count: s.linked, groupSize: s.linked }));
  const linked = lastOf(linkedSeries);
  const anchored = lastOf(stats.map((s) => ({ count: s.anchored, groupSize: s.linked })));
  const pending = last ? toMetric(suppressCount(last.pending, Math.max(last.linked, last.pending), RULES)) : { value: null, suppressed: true };
  const sources = last ? Object.keys(JSON.parse(last.by_qr_source) as Record<string, number>).sort() : [];
  const bySource = sources.map((src) => ({
    qr_source: src,
    linked: lastOf(stats.map((s) => {
      const n = (JSON.parse(s.by_qr_source) as Record<string, number>)[src] ?? 0;
      return { count: n, groupSize: n };
    })),
  }));
  const sessions = lastOf(stats.map((s) => ({ count: s.sessions, groupSize: s.active })));
  const flaggedCount = lastOf(stats.map((s) => ({ count: s.flagged, groupSize: s.active })));
  const anchoredShare = !linked.suppressed && !anchored.suppressed && last ? toMetric(shareFromRounded(last.anchored, last.linked, RULES)) : { value: null, suppressed: true };
  const flaggedShare = !sessions.suppressed && last && last.active >= RULES.min_group && !(flaggedCount.suppressed && last.flagged > 0)
    ? toMetric(shareFromRounded(last.flagged, last.sessions, RULES))
    : { value: null, suppressed: true };
  return { linked, anchored, pending, bySource, anchoredShare, flaggedShare };
}

interface ScoreRow {
  challenge_id: string;
  week_start: string;
  pool: 'lt150' | '150_500' | 'gt500';
  participation_rate: number;
  intensity_min: number;
  linked_members: number;
  rank: number | null;
  is_final: number;
}

function latestScores(db: Db, clubId: string): ScoreRow[] {
  const latest = db.get<{ challenge_id: string }>(
    `SELECT s.challenge_id FROM challenge_score s JOIN challenge c ON c.id = s.challenge_id
      WHERE s.club_id = ? AND c.type IN ('club_warmup', 'club_prize') ORDER BY s.computed_at DESC LIMIT 1`,
    [clubId],
  );
  if (!latest) return [];
  return db.all<ScoreRow>('SELECT * FROM challenge_score WHERE club_id = ? AND challenge_id = ? ORDER BY week_start', [clubId, latest.challenge_id]);
}

export const module: ApiModule = {
  name: 'clubs',
  owner: 'WP-5',
  register(api, deps) {
    registerCalendarRoutes(api, deps);
    const { db, services } = deps;

    mount(api, routes['clubs.join'], ({ auth, body, c }) => {
      const me = studentOf(auth);
      const club = db.get<ClubRow>("SELECT * FROM club WHERE join_code = ? AND status = 'active'", [body.code]);
      if (!club) throw new DomainError('CODE_INVALID');
      return db.transaction(() =>
        linkClub(db, deps, { userId: me.id, pseudonym: me.pseudonym, clubId: club.id, qrSource: body.qr_source ?? null, ipHash: c.var.ipHash, netClass: c.var.netClass }),
      );
    });

    mount(api, routes['clubs.leave'], ({ auth }) => {
      const me = studentOf(auth);
      // Leaving keeps the link in the denominator of the running week (spec §4.6 Vertrek tijdens de week).
      db.run('UPDATE club_membership SET left_at = ?, left_day = ? WHERE user_id = ? AND left_at IS NULL', [nowIso(deps), today(deps), me.id]);
      return undefined;
    });

    mount(api, routes['board.dashboard'], ({ auth, params, query }) => {
      const me = studentOf(auth);
      const club = requireBoard(db, me.id, params.id);
      const tab = query.tab ?? 'stand';
      db.transaction(() => services.events.event(db, 'club_dashboard_viewed', { vereniging_id: club.id, tab }, { pseudonym: me.pseudonym }));
      const stats = clubWeekStats(db, club.id);
      const b = boardFromStats(stats);
      let res: BoardDashboardResponse;
      if (tab === 'stand') {
        const scores = latestScores(db, club.id);
        const last = scores[scores.length - 1];
        const linkedWeeks = weeklyCountSeries(scores.map((s) => ({ count: s.linked_members, groupSize: s.linked_members })), RULES);
        res = {
          tab: 'stand',
          pool: last?.pool ?? club.pool,
          // Club-level numbers, refreshed at the daily close (architecture §6.4: Stand stays daily).
          rank: toMetric(groupMetric(last?.rank ?? null, last?.linked_members ?? 0, RULES)),
          participation_rate: toMetric(groupMetric(last ? Math.round(last.participation_rate * 1000) / 1000 : null, last?.linked_members ?? 0, RULES)),
          intensity_min: toMetric(groupMetric(last ? Math.round(last.intensity_min * 10) / 10 : null, last?.linked_members ?? 0, RULES)),
          weeks: scores.map((s, i) => ({
            week: isoWeekKey(s.week_start),
            participation_rate: toMetric(groupMetric(Math.round(s.participation_rate * 1000) / 1000, s.linked_members, RULES)),
            intensity_min: toMetric(groupMetric(Math.round(s.intensity_min * 10) / 10, s.linked_members, RULES)),
            linked_members: toMetric(linkedWeeks[i]!),
          })),
        };
      } else if (tab === 'werving') {
        res = { tab: 'werving', linked_members: b.linked, code_cap: codeCap(club.declared_members, P.challenges), pending_admin: b.pending, by_qr_source: b.bySource };
      } else if (tab === 'prijs') {
        const scores = latestScores(db, club.id);
        res = {
          tab: 'prijs',
          prize_eligible: club.prize_eligible === 1,
          threshold_rate: P.challenges.threshold_participation_pct / 100,
          anchored_members: b.anchored,
          is_final: scores.length > 0 && scores.every((s) => s.is_final === 1),
        };
      } else {
        res = { tab: 'kwaliteit', anchored_share: b.anchoredShare, flagged_share: b.flaggedShare, sample_status: 'none' };
      }
      return res;
    });

    mount(api, routes['board.promoKit'], ({ auth, params }) => {
      const me = studentOf(auth);
      const club = requireBoard(db, me.id, params.id);
      if (!club.join_code) return { assets: [] };
      const base = `${deps.http?.appOrigin ?? ''}/c/${club.join_code}`;
      const assets = (['poster', 'story', 'qr', 'text'] as const).map((kind) => ({ kind, url: `${base}?bron=${kind}`, qr_source: kind }));
      return { assets };
    });

    // ---- Admin (architecture §8.2 Beheer; spec §4.11 Verenigingen) ----

    mount(api, routes['admin.clubs.list'], () => ({ items: db.all<ClubRow>('SELECT * FROM club ORDER BY name').map((c) => adminClub(deps, db, c)) }));

    mount(api, routes['admin.clubs.get'], ({ params }) => {
      const c = clubById(db, params.id);
      if (!c) throw new DomainError('NOT_FOUND');
      return { club: adminClub(deps, db, c) };
    });

    mount(api, routes['admin.clubs.create'], ({ auth, body }) => {
      const actor = adminOf(deps, studentOf(auth).id);
      const id = ids(deps).ulid();
      const at = nowIso(deps);
      const club = db.transaction(() => {
        requireClubCalendar(db, body.exam_calendar_id);
        const code = body.agreement_ref && calendarUsable(db, body.exam_calendar_id) ? newJoinCode(deps, db) : null;
        db.run(
          `INSERT INTO club (id, name, city, exam_calendar_id, declared_members, members_source_kind, members_source_ref, prize_eligible, agreement_ref, help_resources, pool, join_code, status, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            body.name,
            body.city,
            body.exam_calendar_id ?? null,
            body.declared_members,
            body.members_source_kind,
            body.members_source_ref,
            body.members_source_kind === 'self' ? 0 : 1,
            body.agreement_ref ?? null,
            JSON.stringify(body.help_resources ?? []),
            body.pool ?? poolFor(body.declared_members, P.challenges),
            code,
            code ? 'active' : 'draft',
            actor,
            at,
          ],
        );
        addBoardMembers(db, id, body.board_member_emails ?? [], actor, at);
        services.audit.audit(db, { actor, action: 'club_created', objectType: 'club', objectRef: id });
        return clubById(db, id)!;
      });
      return reply(201, { club: adminClub(deps, db, club) });
    });

    mount(api, routes['admin.clubs.patch'], ({ auth, params, body }) => {
      const actor = adminOf(deps, studentOf(auth).id);
      const c = clubById(db, params.id);
      if (!c) throw new DomainError('NOT_FOUND');
      const membersChange = body.declared_members !== undefined || body.members_source_kind !== undefined || body.members_source_ref !== undefined;
      if (membersChange && c.members_fixed_at !== null) throw new DomainError('MEMBERS_FIXED');
      const at = nowIso(deps);
      const club = db.transaction(() => {
        const set: [string, string | number | null][] = [];
        if (body.name !== undefined) set.push(['name', body.name]);
        if (body.city !== undefined) set.push(['city', body.city]);
        if (body.declared_members !== undefined) set.push(['declared_members', body.declared_members]);
        if (body.members_source_ref !== undefined) set.push(['members_source_ref', body.members_source_ref]);
        if (body.members_source_kind !== undefined) {
          set.push(['members_source_kind', body.members_source_kind]);
          set.push(['prize_eligible', body.members_source_kind === 'self' ? 0 : 1]);
        }
        if (body.help_resources !== undefined) set.push(['help_resources', JSON.stringify(body.help_resources)]);
        if (body.pool !== undefined) set.push(['pool', body.pool]);
        if (body.exam_calendar_id !== undefined) {
          requireClubCalendar(db, body.exam_calendar_id);
          set.push(['exam_calendar_id', body.exam_calendar_id]);
        }
        if (body.agreement_ref !== undefined) set.push(['agreement_ref', body.agreement_ref]);
        const agreement = body.agreement_ref ?? c.agreement_ref;
        const calendar = body.exam_calendar_id !== undefined ? body.exam_calendar_id : c.exam_calendar_id;
        if (!c.join_code && agreement && calendarUsable(db, calendar)) {
          set.push(['join_code', newJoinCode(deps, db)]);
          set.push(['status', 'active']);
        }
        if (body.fix_members) set.push(['members_fixed_at', c.members_fixed_at ?? at]);
        if (set.length > 0) db.run(`UPDATE club SET ${set.map(([k]) => `${k} = ?`).join(', ')} WHERE id = ?`, [...set.map(([, v]) => v), c.id]);
        // Squads of the club follow its calendar (spec §4.13).
        if (body.exam_calendar_id !== undefined) db.run('UPDATE squad SET calendar_id = ? WHERE club_id = ?', [body.exam_calendar_id, c.id]);
        addBoardMembers(db, c.id, body.board_member_emails ?? [], actor, at);
        services.audit.audit(db, { actor, action: 'club_updated', objectType: 'club', objectRef: c.id });
        return clubById(db, c.id)!;
      });
      return { club: adminClub(deps, db, club) };
    });

    mount(api, routes['admin.clubs.pendingLinks'], ({ auth, params }) => {
      const actor = adminOf(deps, studentOf(auth).id);
      const rows = db.all<{ user_id: string; first_name: string; linked_at: string; qr_source: string | null }>(
        `SELECT m.user_id, u.first_name, m.linked_at, m.qr_source FROM club_membership m JOIN user u ON u.id = m.user_id
          WHERE m.club_id = ? AND m.pending_admin = 1 AND m.left_at IS NULL ORDER BY m.linked_at`,
        [params.id],
      );
      db.transaction(() => services.audit.audit(db, { actor, action: 'club_pending_links_viewed', objectType: 'club', objectRef: params.id }));
      return { items: rows.map((r) => ({ user_ref: auditRef(deps.platform.hasher, r.user_id), first_name: r.first_name, linked_at: r.linked_at, qr_source: r.qr_source })) };
    });

    mount(api, routes['admin.clubs.decideLink'], ({ auth, params, body }) => {
      const actor = adminOf(deps, studentOf(auth).id);
      const rows = db.all<{ id: string; user_id: string }>('SELECT id, user_id FROM club_membership WHERE club_id = ? AND pending_admin = 1 AND left_at IS NULL', [params.id]);
      const row = rows.find((r) => auditRef(deps.platform.hasher, r.user_id) === body.user_ref);
      if (!row) throw new DomainError('NOT_FOUND');
      const at = nowIso(deps);
      db.transaction(() => {
        if (body.decision === 'approve') {
          db.run("UPDATE club_membership SET pending_admin = 0, decision = 'approve', decided_at = ?, linked_day = ? WHERE id = ?", [at, focusDayOfIso(at), row.id]);
          const u = db.get<{ pseudonym: string; qr: string | null }>('SELECT u.pseudonym, m.qr_source AS qr FROM user u JOIN club_membership m ON m.user_id = u.id WHERE m.id = ?', [row.id]);
          if (u) services.events.event(db, 'vereniging_joined', { vereniging_id: params.id, qr_bron: u.qr }, { pseudonym: u.pseudonym });
        } else {
          db.run("UPDATE club_membership SET pending_admin = 0, decision = 'reject', decided_at = ?, left_at = ?, left_day = ? WHERE id = ?", [at, at, focusDayOfIso(at), row.id]);
        }
        services.audit.audit(db, { actor, action: 'club_link_decided', objectType: 'club', objectRef: params.id, reason: body.decision });
      });
      return { user_ref: body.user_ref, status: body.decision === 'approve' ? ('linked' as const) : ('rejected' as const) };
    });
  },
};
