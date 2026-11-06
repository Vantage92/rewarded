// Squads, invites and name reports through the API (spec §3.5, §4.4; architecture §6.3, §8.2).
import { describe, expect, it } from 'vitest';
import { DRIVERS, call, createClub, createUser, squadOf, wp5Harness } from './harness.ts';

describe.each(DRIVERS)('squads on %s', (driver) => {
  it('spec §3.5 / §4.4 Uitnodigingslink: creating a squad gives an invite object with source squad, 7 days, 5 uses', async () => {
    const h = wp5Harness({ driver });
    const maker = createUser(h, { firstName: 'Sanne' });
    const r = await call(h, maker, 'POST', '/squads', { name: 'Blokkers' });
    expect(r.status).toBe(201);
    expect(r.body.squad).toMatchObject({ name: 'Blokkers', status: 'building', is_admin: true });
    expect(r.body.invite).toMatchObject({ source: 'squad', max_uses: 5, uses: 0 });
    expect(Date.parse(r.body.invite.expires_at) - h.clock.now().getTime()).toBe(7 * 86_400_000);
    expect(r.body.invite.url).toBe(`http://localhost:5173/i/${r.body.invite.token}`);
    expect(h.events.named('squad_created')).toHaveLength(1);
    expect(h.events.named('invite_created')[0]!.props).toMatchObject({ bron: 'squad', max_uses: 5 });
    // The squad got its own arms at creation (spec §5 Toewijzing).
    expect(h.db.get<{ arm_bonus: string | null }>('SELECT arm_bonus FROM squad WHERE id = ?', [r.body.squad.id])!.arm_bonus).not.toBeNull();
    expect((await call(h, maker, 'POST', '/squads', { name: 'Tweede' })).body.error.code).toBe('ALREADY_IN_SQUAD');
  });

  it('spec §4.4 Squadnaam: names with a word from the list, an e-mail address or a phone number are refused', async () => {
    const h = wp5Harness({ driver });
    const u = createUser(h);
    const codes: string[] = [];
    for (const name of ['K4nker squad', 'mail me@x.nl', 'bel 0612345678', '<script>']) codes.push((await call(h, u, 'POST', '/squads', { name })).body.error.code);
    expect(codes).toEqual(['NAME_REJECTED', 'NAME_REJECTED', 'NAME_REJECTED', 'NAME_REJECTED']);
  });

  it('spec §3.5: the invite preview names the inviter and squad, never points or prizes; a third member makes the squad active', async () => {
    const h = wp5Harness({ driver });
    const { users, token, squadId } = await squadOf(h, 2);
    const preview = await call(h, null, 'GET', `/invites/${token}`);
    expect(preview.status).toBe(200);
    expect(preview.body).toEqual({ source: 'squad', inviter_first_name: users[0]!.firstName, squad_name: 'Studiegenoten', valid: true });
    expect(preview.text).not.toMatch(/punt|point|prijs|prize|€/i);
    expect(h.events.named('invite_link_opened')[0]!.pseudonym).toBeNull();
    expect((await call(h, users[0]!, 'GET', '/squads/mine')).body.status).toBe('building');
    const third = createUser(h);
    expect((await call(h, third, 'POST', `/invites/${token}/accept`)).body).toEqual({ squad: { id: squadId, name: 'Studiegenoten' } });
    const mine = await call(h, third, 'GET', '/squads/mine');
    expect(mine.body.status).toBe('active');
    expect(mine.body.members).toHaveLength(3);
    expect(h.events.named('squad_became_active')).toHaveLength(1);
    expect(h.events.named('squad_joined').at(-1)!.props).toMatchObject({ ledental_na: 3 });
  });

  it('spec §4.4 Omvang: at most six members; a used-up invite is INVITE_EXHAUSTED', async () => {
    const h = wp5Harness({ driver });
    const { token } = await squadOf(h, 6);
    expect((await call(h, createUser(h), 'POST', `/invites/${token}/accept`)).body.error.code).toBe('INVITE_EXHAUSTED');
    expect((await call(h, null, 'GET', '/invites/AAAAAAAAAAAAAAAAAAAAAA')).body.error.code).toBe('INVITE_INVALID');
  });

  it('spec §4.4 Uitnodigingsmomenten: a new invite only with a free spot and at most once per week', async () => {
    const h = wp5Harness({ driver });
    const { users } = await squadOf(h, 3);
    expect((await call(h, users[1]!, 'POST', '/squads/mine/invites')).body.error.code).toBe('INVITE_MOMENT_NOT_ALLOWED');
    h.clock.advance(7 * 86_400_000);
    expect((await call(h, users[1]!, 'POST', '/squads/mine/invites')).status).toBe(201);
    expect((await call(h, users[2]!, 'POST', '/squads/mine/invites')).body.error.code).toBe('INVITE_MOMENT_NOT_ALLOWED');
  });

  it('spec §4.4 Lid vertrekt / maker vertrekt: the admin role goes to the longest-sitting member', async () => {
    const h = wp5Harness({ driver });
    const { users } = await squadOf(h, 3);
    expect((await call(h, users[0]!, 'POST', '/squads/mine/leave')).status).toBe(204);
    expect((await call(h, users[0]!, 'GET', '/squads/mine')).body.error.code).toBe('NOT_IN_SQUAD');
    const mine = await call(h, users[1]!, 'GET', '/squads/mine');
    expect(mine.body.squad.is_admin).toBe(true);
    expect(mine.body.status).toBe('building');
    expect((await call(h, users[2]!, 'PATCH', '/squads/mine', { name: 'Nieuw' })).body.error.code).toBe('FORBIDDEN');
    expect((await call(h, users[1]!, 'PATCH', '/squads/mine', { name: 'Nieuw' })).body.squad.name).toBe('Nieuw');
  });

  it('spec §4.4 Squadnaam (art. 16 DSA): one report per person, a NAME_REPORT flag and name_status reported', async () => {
    const h = wp5Harness({ driver });
    const { squadId } = await squadOf(h, 3);
    const outsider = createUser(h);
    const r = await call(h, outsider, 'POST', `/squads/${squadId}/name-report`, { reason: 'offensive' });
    expect(r.status).toBe(201);
    expect(h.flags.get('flag_1')).toMatchObject({ code: 'NAME_REPORT', subject: { type: 'squad', id: squadId } });
    expect((await call(h, outsider, 'POST', `/squads/${squadId}/name-report`, {})).body.error.code).toBe('ALREADY_REPORTED');
    expect(h.db.get<{ name_status: string }>('SELECT name_status FROM squad WHERE id = ?', [squadId])!.name_status).toBe('reported');
  });

  it('spec §4.4 Squad uit elkaar: regroup and merge only with low activity; merging needs the same rest-period arm', async () => {
    const h = wp5Harness({ driver });
    const club = createClub(h);
    const a = await squadOf(h, 2, { club: club.id });
    const b = await squadOf(h, 2, { club: club.id, name: 'Andere squad' });
    expect((await call(h, a.users[0]!, 'POST', '/squads/mine/regroup')).body.error.code).toBe('NOT_ELIGIBLE');
    h.db.run("UPDATE squad SET low_activity_since_day = '2026-12-02'");
    expect((await call(h, a.users[0]!, 'POST', '/squads/mine/regroup')).status).toBe(201);
    h.db.run("UPDATE squad SET arm_rest = 'rest' WHERE id = ?", [a.squadId]);
    h.db.run("UPDATE squad SET arm_rest = 'continue' WHERE id = ?", [b.squadId]);
    const mismatch = await call(h, a.users[0]!, 'POST', '/squads/mine/merge-requests', { target_squad_ref: b.squadId });
    expect(mismatch.body.error).toMatchObject({ code: 'MERGE_ARM_MISMATCH', details: { reason: 'merge_arm_mismatch' } });
    h.db.run("UPDATE squad SET arm_rest = 'rest'");
    const req = await call(h, a.users[0]!, 'POST', '/squads/mine/merge-requests', { target_squad_ref: b.squadId });
    expect(req.status).toBe(201);
    // The target squad consents by accepting; the merged squad has four members.
    const merged = await call(h, b.users[0]!, 'POST', `/squads/merge-requests/${req.body.merge_request_id}/accept`);
    expect(merged.status).toBe(200);
    expect(merged.body.members).toHaveLength(4);
    expect(h.events.named('squad_merged')).toHaveLength(1);
    // Outside an exam period of the calendar the route is paused (spec §4.13).
    h.db.run(
      `INSERT INTO exam_calendar (id, institution, t_day, exam_periods, source_ref, checked_at, created_at)
       VALUES ('01JWP5CA0000000000000000001', 'UU', '2027-01-17', '[{"first_day":"2026-12-20","last_day":"2027-01-17"}]', 'uu.nl', '2026-11-01', '2026-11-01')`,
    );
    h.db.run("UPDATE squad SET calendar_id = '01JWP5CA0000000000000000001', low_activity_since_day = '2026-12-01'");
    expect((await call(h, b.users[0]!, 'POST', '/squads/mine/regroup')).body.error.code).toBe('NOT_ELIGIBLE');
  });

  it('spec §3.6 / §4.5: a duel link from outside the squad is refused for a 16- or 17-year-old (AGE_RESTRICTED)', async () => {
    const h = wp5Harness({ driver });
    h.db.run("INSERT INTO feature_flag (key, enabled, updated_at, updated_by) VALUES ('duels', 1, '2026-12-01T00:00:00Z', 't')");
    const adult = createUser(h);
    const minor = createUser(h, { ageBand: '16_17' });
    expect((await call(h, minor, 'POST', '/duels', {})).body.error.code).toBe('AGE_RESTRICTED');
    const d = await call(h, adult, 'POST', '/duels', {});
    expect(d.status).toBe(201);
    expect((await call(h, minor, 'POST', `/invites/${d.body.invite.token}/accept`)).body.error.code).toBe('AGE_RESTRICTED');
    const other = createUser(h);
    const ok = await call(h, other, 'POST', `/invites/${d.body.invite.token}/accept`);
    expect(ok.body.duel).toMatchObject({ start_day: '2026-12-04', end_day: '2026-12-10' });
    expect((await call(h, other, 'POST', '/duels', {})).body.error.code).toBe('DUEL_ACTIVE');
  });
});

describe('SocialService for other packages (streak and joker for /me/today, squad and club for /me)', () => {
  it('spec §4.4: streak, joker and membership of a member', async () => {
    const h = wp5Harness();
    const club = createClub(h);
    const { users, squadId } = await squadOf(h, 3, { club: club.id });
    const social = h.services.social!;
    expect(social.streak(users[0]!.id)).toBe(0);
    expect(social.membership(users[0]!.id)).toEqual({ squadId, squadName: 'Studiegenoten', clubId: null });
    expect(social.jokerAvailable(users[0]!.id, '2026-12-03')).toBe(true);
    h.db.run("INSERT INTO squad_joker (user_id, week_start, used_day) VALUES (?, '2026-11-30', '2026-12-02')", [users[0]!.id]);
    expect(social.jokerAvailable(users[0]!.id, '2026-12-03')).toBe(false);
    expect(social.streak(createUser(h).id)).toBeNull();
  });
});
