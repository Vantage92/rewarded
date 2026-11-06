// Privacy test of architecture §6.4 over all social routes (WP-5 acceptance criterion), including
// the difference test on the board dashboard: no answer outside the own squad or duel holds a user
// id, e-mail address, pseudonym or minutes of another member; minutes only with mutual opt-in;
// silent members are absent from presence; witnesses only for witnesses = squad; the board sees
// rounded weekly aggregates from 5 members and deleting one member of twenty changes nothing shown.
import { routes } from '@rewarded/contracts';
import { describe, expect, it } from 'vitest';
import { call, closeDay, createClub, createUser, linkMember, putDay, putSession, setFlag, squadOf, wp5Harness, type CallResult, type Harness, type TestUser } from './harness.ts';

const SOCIAL_MODULES = new Set(['squads', 'invites', 'duels', 'clubs', 'leaderboards', 'challenges', 'belofte', 'cards', 'referral', 'reminders']);

function noForeignData(r: CallResult, others: readonly TestUser[], label: string) {
  for (const o of others) {
    expect(r.text, `${label}: user id of ${o.firstName}`).not.toContain(o.id);
    expect(r.text, `${label}: e-mail of ${o.firstName}`).not.toContain(o.email);
    expect(r.text, `${label}: pseudonym of ${o.firstName}`).not.toContain(o.pseudonym);
  }
}

async function world(h: Harness) {
  setFlag(h, 'duels');
  setFlag(h, 'belofte');
  setFlag(h, 'cards');
  setFlag(h, 'referral');
  const club = createClub(h, { declared: 20 });
  const { users, squadId, token } = await squadOf(h, 4, { club: club.id });
  const [viewer, mutual, closed, silent] = users as [TestUser, TestUser, TestUser, TestUser];
  h.db.run('UPDATE user SET compare_opt_in = 1 WHERE id IN (?, ?)', [viewer.id, mutual.id]);
  h.db.run('UPDATE user SET silent_mode = 1 WHERE id = ?', [silent.id]);
  const day = '2026-12-03';
  for (const [u, minutes] of [[viewer, 50], [mutual, 77], [closed, 83], [silent, 91]] as const) {
    putSession(h, u.id, day, { minutes: 50 });
    putDay(h, u.id, day, { goalMet: true, countedMin: minutes });
  }
  // A running session of the silent member must not show up in presence.
  putSession(h, silent.id, day, { status: 'active', startAt: h.clock.now().getTime() - 60_000, plannedEndAt: h.clock.now().getTime() + 24 * 60_000 });
  putSession(h, mutual.id, day, { status: 'active', startAt: h.clock.now().getTime() - 60_000, plannedEndAt: h.clock.now().getTime() + 32 * 60_000 });
  // Beloftes: one with the squad as witness, one without.
  for (const u of [mutual, closed]) h.db.run("INSERT INTO belofte_offer (user_id, arm, trigger, due_day, offered_at) VALUES (?, 'early', 'early', '2026-11-01', '2026-11-01T10:00:00Z')", [u.id]);
  h.db.run("INSERT INTO belofte_offer (user_id, arm, trigger, due_day) VALUES (?, 'early', 'early', '2026-11-01')", [viewer.id]);
  expect((await call(h, mutual, 'POST', '/beloftes', { days_per_week: 4, min_per_day: 50, witnesses: 'squad' })).status).toBe(201);
  expect((await call(h, closed, 'POST', '/beloftes', { days_per_week: 5, min_per_day: 90, witnesses: 'none' })).status).toBe(201);
  // A club of twenty linked members with a board member outside the squad.
  const board = createUser(h, { firstName: 'Bestuur' });
  h.db.run("INSERT INTO club_board_member (user_id, club_id, role, created_by, created_at) VALUES (?, ?, 'board', 'seed', '2026-11-01')", [board.id, club.id]);
  const members = [viewer, mutual, closed, silent, ...Array.from({ length: 16 }, () => createUser(h, { institution: true }))];
  for (const m of members) linkMember(h, club.id, m.id, '2026-11-20', m === viewer ? 'poster' : 'story');
  return { club, squadId, token, viewer, mutual, closed, silent, board, members };
}

describe('architecture §6.4 privacy of individual data on every social route', () => {
  it('§6.4 squad routes (squads.mine included): first names only, no minutes except mutual opt-in compare, silent members absent, witnesses only', async () => {
    const h = wp5Harness({ start: '2026-12-03T15:00:00Z' });
    const w = await world(h);
    const others = [w.mutual, w.closed, w.silent, w.board];

    const mine = await call(h, w.viewer, 'GET', '/squads/mine');
    expect(mine.status).toBe(200);
    noForeignData(mine, others, 'squads.mine');
    expect(mine.text).not.toMatch(/minut|77|83|91/);
    expect(mine.body.members.map((m: { first_name: string }) => m.first_name).sort()).toEqual([w.viewer, w.mutual, w.closed, w.silent].map((u) => u.firstName).sort());
    // Repair wave: a silent member shows only the first name and `silent`; the squad day is an aggregate.
    expect(mine.body.members.find((m: { first_name: string }) => m.first_name === w.silent.firstName)).toEqual({ first_name: w.silent.firstName, status: 'silent' });
    expect(mine.body.today).toEqual({ active: 4, goal_met: 4 });

    const presence = await call(h, w.viewer, 'GET', '/squads/mine/presence');
    noForeignData(presence, others, 'squads.presence');
    expect(presence.body.members).toHaveLength(3);
    expect(presence.body.active_count).toBe(4);
    const focusing = presence.body.members.filter((m: { focusing: boolean }) => m.focusing);
    expect(focusing).toEqual([{ member_ref: expect.any(String), focusing: true, remaining_min: 32 }]);
    for (const m of presence.body.members) expect(Object.keys(m).sort()).toEqual(m.focusing ? ['focusing', 'member_ref', 'remaining_min'] : ['focusing', 'member_ref']);

    const compare = await call(h, w.viewer, 'GET', '/squads/mine/compare');
    noForeignData(compare, others, 'squads.compare');
    expect(compare.body.members.map((m: { first_name: string }) => m.first_name).sort()).toEqual([w.viewer.firstName, w.mutual.firstName].sort());
    expect(compare.text).not.toMatch(/\b83\b|\b91\b/);
    // Without own opt-in nothing at all.
    expect((await call(h, w.closed, 'GET', '/squads/mine/compare')).body.error.code).toBe('COMPARE_OPT_IN_REQUIRED');

    const beloftes = await call(h, w.viewer, 'GET', '/squads/mine/beloftes');
    noForeignData(beloftes, others, 'squads.beloftes');
    expect(beloftes.body.items.map((b: { first_name: string }) => b.first_name)).toEqual([w.mutual.firstName]);
    expect(beloftes.text).not.toMatch(/minutes"/);

    // Outside the squad: nothing of the squad.
    const outsider = createUser(h);
    expect((await call(h, outsider, 'GET', '/squads/mine')).body.error.code).toBe('NOT_IN_SQUAD');
    expect((await call(h, outsider, 'GET', '/squads/mine/presence')).body.error.code).toBe('NOT_IN_SQUAD');
    expect((await call(h, outsider, 'GET', '/squads/mine/beloftes')).body.error.code).toBe('NOT_IN_SQUAD');
    const preview = await call(h, null, 'GET', `/invites/${w.token}`);
    noForeignData(preview, [w.viewer, ...others], 'invites.preview');
  });

  it('§6.4 duel, leaderboard, challenges, cards, referral and Belofte answers hold no data of other users', async () => {
    const h = wp5Harness({ start: '2026-12-03T15:00:00Z' });
    const w = await world(h);
    const others = [w.mutual, w.closed, w.silent, w.board, ...w.members.slice(4)];
    const called = new Set<string>();
    const track = async (id: keyof typeof routes, user: TestUser | null, method: string, path: string, body?: unknown) => {
      const r = await call(h, user, method, path, body);
      called.add(id);
      noForeignData(r, others, id);
      return r;
    };
    // Duel inside the squad: per day met or not and the totals, never minutes.
    const presence = await call(h, w.viewer, 'GET', '/squads/mine/presence');
    const ref = presence.body.members.find((m: { focusing: boolean }) => m.focusing).member_ref as string;
    const duel = await track('duels.create', w.viewer, 'POST', '/duels', { opponent_member_ref: ref });
    expect(duel.status).toBe(201);
    await track('invites.accept', w.mutual, 'POST', `/invites/${duel.body.invite.token}/accept`);
    for (const day of ['2026-12-04', '2026-12-05']) {
      putDay(h, w.viewer.id, day, { goalMet: true, countedMin: 61 });
      putDay(h, w.mutual.id, day, { goalMet: true, countedMin: 99 });
    }
    h.clock.set(new Date('2026-12-06T12:00:00Z'));
    const current = await track('duels.current', w.viewer, 'GET', '/duels/current');
    expect(current.body).toMatchObject({ me_total: 2, opponent_total: 2 });
    expect(current.text).not.toMatch(/\b99\b|minut/);

    // Leaderboard and challenges: club level only.
    const admin = createUser(h, { admin: true });
    const ch = await call(h, admin, 'POST', '/admin/challenges', { type: 'club_warmup', title_nl: 'Aanloop', title_en: 'Warm-up', period_start_day: '2026-11-30', period_end_day: '2026-12-20', rules: {}, prizes: [] });
    expect(ch.status).toBe(201);
    await call(h, admin, 'POST', `/admin/challenges/${ch.body.challenge.id}/publish`);
    await closeDay(h, '2026-12-05', [8]);
    const lb = await track('leaderboards.get', w.viewer, 'GET', `/leaderboards/${ch.body.challenge.id}`);
    expect(lb.status).toBe(200);
    expect(lb.text).not.toMatch(/first_name|user/);
    await track('challenges.list', w.viewer, 'GET', '/challenges');

    // Cards and the public verification page show only the owner's own switched-on fields.
    const sid = putSession(h, w.viewer.id, '2026-12-05', { minutes: 50 });
    const card = await track('cards.create', w.viewer, 'POST', '/cards', { kind: 'session', ref_id: sid, fields: { first_name: true, squad_name: true, streak: true } });
    expect(card.status).toBe(201);
    const verify = await track('verify.get', null, 'GET', `/verify/${card.body.token}`);
    expect(verify.text).not.toContain(w.viewer.id);
    expect(verify.text).not.toContain('Studiegenoten'); // not every member allows the squad name

    const ref2 = await track('referral.mine', w.viewer, 'GET', '/referral/mine');
    expect(ref2.status).toBe(404); // the referral is live only from 5 January 2027
    await track('belofte.offer', w.viewer, 'GET', '/belofte/offer');
    expect(called.size).toBeGreaterThan(8);
  });

  it('§6.4 board dashboard: weekly aggregates rounded to 5, hidden below 5, no member data, and FORBIDDEN for others', async () => {
    const h = wp5Harness({ start: '2026-11-30T10:00:00Z' });
    const w = await world(h);
    for (const m of w.members.slice(0, 7)) putSession(h, m.id, '2026-11-30', { minutes: 25 });
    await closeDay(h, '2026-11-30', [8]);
    // Repair wave: the running week is not shown (rule 1: week figures); only closed weeks.
    expect((await call(h, w.board, 'GET', `/board/clubs/${w.club.id}/dashboard?tab=werving`)).body.linked_members).toEqual({ value: null, suppressed: true });
    h.clock.set(new Date('2026-12-07T10:00:00Z'));
    await closeDay(h, '2026-12-06', [8]);
    const werving = await call(h, w.board, 'GET', `/board/clubs/${w.club.id}/dashboard?tab=werving`);
    expect(werving.status).toBe(200);
    noForeignData(werving, w.members, 'board.werving');
    expect(werving.body.linked_members).toEqual({ value: 20, suppressed: false });
    // Per QR source: 'poster' has one member (hidden), 'story' 19 (rounded to 20).
    expect(werving.body.by_qr_source).toEqual([
      { qr_source: 'poster', linked: { value: null, suppressed: true } },
      { qr_source: 'story', linked: { value: 20, suppressed: false } },
    ]);
    const prijs = await call(h, w.board, 'GET', `/board/clubs/${w.club.id}/dashboard?tab=prijs`);
    expect(prijs.body.anchored_members).toEqual({ value: 15, suppressed: false }); // 16 anchored → 15
    const kwaliteit = await call(h, w.board, 'GET', `/board/clubs/${w.club.id}/dashboard?tab=kwaliteit`);
    expect(kwaliteit.body.anchored_share).toEqual({ value: 0.75, suppressed: false }); // 15 / 20 from rounded counts
    for (const tab of ['stand', 'werving', 'prijs', 'kwaliteit']) {
      const r = await call(h, w.board, 'GET', `/board/clubs/${w.club.id}/dashboard?tab=${tab}`);
      expect({ tab, status: r.status }).toEqual({ tab, status: 200 });
      expect(r.text).not.toMatch(/first_name|user_id|pseudonym|"email"/);
    }
    // One link in the middle of the next week does not move any board number before that week closes.
    const late = createUser(h, { institution: true });
    linkMember(h, w.club.id, late.id, '2026-12-08', 'story');
    h.clock.set(new Date('2026-12-09T10:00:00Z'));
    await closeDay(h, '2026-12-08', [8]);
    expect((await call(h, w.board, 'GET', `/board/clubs/${w.club.id}/dashboard?tab=werving`)).body).toEqual(werving.body);
    expect((await call(h, w.viewer, 'GET', `/board/clubs/${w.club.id}/dashboard?tab=werving`)).body.error.code).toBe('FORBIDDEN');
    expect((await call(h, w.board, 'GET', `/board/clubs/${w.club.id}/promo-kit`)).body.assets).toHaveLength(4);
  });

  it('§6.4 verschiltest: deleting one member of a club of twenty is not visible in any board number of this or the previous week', async () => {
    const h = wp5Harness({ start: '2026-11-30T10:00:00Z' });
    const w = await world(h);
    const tabs = ['stand', 'werving', 'prijs', 'kwaliteit'] as const;
    const snapshot = async () => Object.fromEntries(await Promise.all(tabs.map(async (t) => [t, (await call(h, w.board, 'GET', `/board/clubs/${w.club.id}/dashboard?tab=${t}`)).body])));
    h.db.run(
      `INSERT INTO challenge (id, type, title_nl, title_en, period_start_day, period_end_day, status, created_by, created_at)
       VALUES ('01JWP5CHA0000000000000000A', 'club_warmup', 'Aanloop', 'Warm-up', '2026-11-30', '2026-12-20', 'published', 'seed', '2026-11-01')`,
    );
    // Previous week (30 Nov – 6 Dec) and the current week (7 Dec –).
    for (const day of ['2026-11-30', '2026-12-06']) await closeDay(h, day, [8]);
    await closeDay(h, '2026-12-07', [8]);
    const before = await snapshot();
    // Delete one anchored member: the privacy erasers run, then the account row goes.
    const gone = w.members[10]!;
    h.db.transaction(() => {
      h.privacy.eraseUser(h.db, gone.id);
      h.db.run('DELETE FROM auth_session WHERE user_id = ?', [gone.id]);
      h.db.run('DELETE FROM user WHERE id = ?', [gone.id]);
    });
    await closeDay(h, '2026-12-08', [8]);
    const after = await snapshot();
    // No shown number changes: every metric keeps its value or turns into "minder dan 5 veranderd"
    // (rule 3), which says nothing about who. The finished previous week is unchanged exactly.
    const metrics = (o: unknown, path = ''): [string, { value: number | null; suppressed: boolean }][] => {
      if (o && typeof o === 'object' && 'suppressed' in o && 'value' in o) return [[path, o as { value: number | null; suppressed: boolean }]];
      if (o && typeof o === 'object') return Object.entries(o).flatMap(([k, v]) => metrics(v, `${path}.${k}`));
      return [];
    };
    const b = new Map(metrics(before));
    const changed = metrics(after)
      .filter(([path, m]) => !b.has(path) || (!m.suppressed && m.value !== b.get(path)!.value))
      .map(([path]) => path);
    expect(changed).toEqual([]);
    expect(before.stand.weeks).toHaveLength(2);
    expect(after.stand.weeks[0]).toEqual(before.stand.weeks[0]);
    expect(after.werving.linked_members).toEqual(before.werving.linked_members);
    // The link stays in the denominator without a user id (architecture §6.2, §10.7).
    expect(h.db.get<{ n: number }>('SELECT count(*) AS n FROM club_membership WHERE club_id = ? AND user_id IS NULL', [w.club.id])!.n).toBe(1);
  });

  it('§6.4 every social route of contracts-v1 is mounted by WP-5', () => {
    const social = Object.entries(routes).filter(([, r]) => SOCIAL_MODULES.has(r.module));
    expect(social.length).toBeGreaterThan(30);
    const h = wp5Harness();
    const mounted = new Set(h.app.routes.map((r) => `${r.method} ${r.path.replace(/^\/api\/v1/, '')}`));
    expect(social.filter(([, r]) => !mounted.has(`${r.method} ${r.path}`)).map(([id]) => id)).toEqual([]);
  });
});
