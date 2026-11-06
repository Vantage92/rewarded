// Clubs, leaderboard and challenges through the API and day close step 8 (spec §4.6, §4.7,
// §4.11; architecture §6.2). The participation rate is recalculated by hand on fixture data.
import { describe, expect, it } from 'vitest';
import { DRIVERS, call, closeDay, createClub, createUser, linkMember, putDay, putSession, wp5Harness, type Harness, type TestUser } from './harness.ts';

function goalDays(h: Harness, u: TestUser, days: string[], minutes = 30) {
  for (const d of days) {
    putSession(h, u.id, d, { minutes: 25 });
    putDay(h, u.id, d, { goalMet: true, countedMin: minutes });
  }
}

describe.each(DRIVERS)('clubs and challenges on %s', (driver) => {
  it('spec §4.6 Codeplafond: links above floor(1.1 × declared) wait for the admin; one open link per user', async () => {
    const h = wp5Harness({ driver });
    const club = createClub(h, { declared: 2 });
    const [a, b, c] = [createUser(h), createUser(h), createUser(h)];
    expect((await call(h, a, 'POST', '/clubs/join', { code: club.code, qr_source: 'poster' })).body.status).toBe('linked');
    expect((await call(h, b, 'POST', '/clubs/join', { code: club.code })).body.status).toBe('linked');
    expect((await call(h, c, 'POST', '/clubs/join', { code: club.code })).body.status).toBe('pending_admin');
    expect(h.events.named('code_cap_reached')).toHaveLength(1);
    expect((await call(h, a, 'POST', '/clubs/join', { code: club.code })).body.error.code).toBe('ALREADY_LINKED');
    expect((await call(h, a, 'POST', '/clubs/join', { code: 'NOPE1234' })).body.error.code).toBe('CODE_INVALID');
    const admin = createUser(h, { admin: true });
    const pending = await call(h, admin, 'GET', `/admin/clubs/${club.id}/pending-links`);
    expect(pending.body.items).toHaveLength(1);
    const decided = await call(h, admin, 'POST', `/admin/clubs/${club.id}/pending-links/decide`, { user_ref: pending.body.items[0].user_ref, decision: 'approve' });
    expect(decided.body.status).toBe('linked');
    expect((await call(h, c, 'POST', '/clubs/leave')).status).toBe(204);
  });

  it('spec §4.11 Verenigingen: no code without agreement; the member count is fixed after members_fixed_at', async () => {
    const h = wp5Harness({ driver });
    const admin = createUser(h, { admin: true });
    const board = createUser(h);
    const created = await call(h, admin, 'POST', '/admin/clubs', {
      name: 'Sv Demo',
      city: 'Demostad',
      declared_members: 120,
      members_source_kind: 'self',
      members_source_ref: 'opgave bestuur',
      board_member_emails: [board.email],
    });
    expect(created.status).toBe(201);
    expect(created.body.club).toMatchObject({ join_code: null, status: 'draft', prize_eligible: false, pool: 'lt150', code_cap: 132 });
    expect(created.body.club.board_member_refs).toHaveLength(1);
    const id = created.body.club.id as string;
    const signedNoCal = await call(h, admin, 'PATCH', `/admin/clubs/${id}`, { agreement_ref: 'ovk-2026-01', members_source_kind: 'institution', fix_members: true });
    // Integration wave (spec §4.13): no code without a confirmed club calendar either.
    expect(signedNoCal.body.club).toMatchObject({ status: 'draft', join_code: null, prize_eligible: true });
    const cal = await call(h, admin, 'POST', '/admin/exam-calendars', { institution: 'Hogeschool Demostad', t_day: '2027-01-24', source_ref: 'https://example.test/rooster', checked_at: '2026-11-05' });
    expect(cal.status).toBe(201);
    const signed = await call(h, admin, 'PATCH', `/admin/clubs/${id}`, { exam_calendar_id: cal.body.calendar.id });
    expect(signed.body.club).toMatchObject({ status: 'active', prize_eligible: true, exam_calendar_id: cal.body.calendar.id });
    expect(signed.body.club.join_code).toMatch(/^[A-Z0-9]{6}$/);
    expect((await call(h, admin, 'PATCH', `/admin/clubs/${id}`, { declared_members: 300 })).body.error.code).toBe('MEMBERS_FIXED');
    expect((await call(h, board, 'GET', '/admin/clubs')).status).toBe(403);
  });

  it('architecture §6.2: participation rate, intensity and rank per pool, recalculated by hand', async () => {
    const h = wp5Harness({ driver, start: '2026-12-07T10:00:00Z' });
    const week = ['2026-12-07', '2026-12-08', '2026-12-09', '2026-12-10', '2026-12-11', '2026-12-12', '2026-12-13'];
    // Three clubs in one pool (< 150), each with 15 linked members (the ranking minimum).
    const clubs = [createClub(h, { declared: 40, name: 'Alfa' }), createClub(h, { declared: 15, name: 'Beta' }), createClub(h, { declared: 20, name: 'Gamma' })];
    const members = clubs.map((c) => Array.from({ length: 15 }, () => {
      const u = createUser(h);
      linkMember(h, c.id, u.id, '2026-12-01');
      return u;
    }));
    // Alfa: 6 members with 3 goal days (30 min), 1 with 2 goal days, 1 with exam days only.
    for (const u of members[0]!.slice(0, 6)) goalDays(h, u, week.slice(0, 3));
    goalDays(h, members[0]![6]!, week.slice(0, 2));
    for (const d of week.slice(0, 4)) putDay(h, members[0]![7]!.id, d, { goalMet: true, examDay: true, countedMin: 30 });
    // Beta: 3 members with 4 goal days of 400 minutes (capped at 300).
    for (const u of members[1]!.slice(0, 3)) goalDays(h, u, week.slice(0, 4), 400);
    // Gamma: 4 members with 3 goal days; same rate as Beta would need 4/20 = 0.2 vs Beta 3/15 = 0.2.
    for (const u of members[2]!.slice(0, 4)) goalDays(h, u, week.slice(0, 3), 60);
    const admin = createUser(h, { admin: true });
    const ch = await call(h, admin, 'POST', '/admin/challenges', { type: 'club_warmup', title_nl: 'Aanloop', title_en: 'Warm-up', period_start_day: '2026-12-07', period_end_day: '2026-12-20', rules: {}, prizes: [] });
    await call(h, admin, 'POST', `/admin/challenges/${ch.body.challenge.id}/publish`);
    await closeDay(h, '2026-12-13', [8]);
    const score = (clubId: string) => h.db.get<{ numerator: number; denominator: number; participation_rate: number; intensity_min: number; active_members: number; rank: number }>(
      'SELECT numerator, denominator, participation_rate, intensity_min, active_members, rank FROM challenge_score WHERE club_id = ?',
      [clubId],
    )!;
    // Alfa: 6 / max(40, 15) = 0.15; active = 7 (exam-only member had no session); intensity = (6×3×30 + 2×30) / (7 × 7).
    expect(score(clubs[0]!.id)).toMatchObject({ numerator: 6, denominator: 40, active_members: 7 });
    expect(score(clubs[0]!.id).participation_rate).toBeCloseTo(0.15);
    expect(score(clubs[0]!.id).intensity_min).toBeCloseTo((6 * 3 * 30 + 2 * 30) / 49);
    // Beta: 3 / 15 = 0.2; intensity = 3 × 4 × 300 / (3 × 7); Gamma: 4 / 20 = 0.2, intensity 4×3×60 / (4×7).
    expect(score(clubs[1]!.id)).toMatchObject({ numerator: 3, denominator: 15 });
    expect(score(clubs[1]!.id).intensity_min).toBeCloseTo((3 * 4 * 300) / 21);
    expect(score(clubs[2]!.id).participation_rate).toBeCloseTo(0.2);
    // Equal rate: intensity decides (Beta before Gamma), Alfa third.
    expect([score(clubs[1]!.id).rank, score(clubs[2]!.id).rank, score(clubs[0]!.id).rank]).toEqual([1, 2, 3]);
    const lb = await call(h, members[0]![0]!, 'GET', `/leaderboards/${ch.body.challenge.id}`);
    expect(lb.body.pools).toHaveLength(1);
    expect(lb.body.pools[0].rows.map((r: { club_name: string; rank: number; declared_members: number }) => [r.club_name, r.rank, r.declared_members])).toEqual([
      ['Beta', 1, 15],
      ['Gamma', 2, 20],
      ['Alfa', 3, 40],
    ]);
    expect(lb.body.is_final).toBe(false);
  });

  it('spec §3.8 / §4.7 / UX P10: performance challenge with fixed seats, enrollment before the start, ceilings, sample and four eyes', async () => {
    const h = wp5Harness({ driver, start: '2026-12-03T10:00:00Z' });
    const admin = createUser(h, { admin: true });
    const prize = { kind: 'earned_individual', reward_kind: 'in_kind', description_nl: 'Boekenbon', description_en: 'Book voucher', value_cents: 1000, partner_id: '01JWP5PAR0000000000000000A', budget_id: '01JWP5BDG0000000000000000A', declaration_ref: 'decl-1', min_age_band: '18_plus' };
    const over = await call(h, admin, 'POST', '/admin/challenges', { type: 'performance', title_nl: 'Elke dag 120', title_en: 'Every day 120', period_start_day: '2026-12-07', period_end_day: '2026-12-13', rules: { day_minutes: 120, seats: 2 }, prizes: [{ ...prize, value_cents: 1001 }] });
    expect(over.body.error.code).toBe('CEILING_EXCEEDED');
    const ch = await call(h, admin, 'POST', '/admin/challenges', { type: 'performance', title_nl: 'Elke dag 120', title_en: 'Every day 120', period_start_day: '2026-12-07', period_end_day: '2026-12-13', rules: { day_minutes: 120, seats: 2 }, prizes: [prize] });
    expect(ch.status).toBe(201);
    const id = ch.body.challenge.id as string;
    await call(h, admin, 'POST', `/admin/challenges/${id}/publish`);
    // The research cohort has no individual prize challenge in its rest period; this one is before it.
    const [u1, u2, u3] = [createUser(h), createUser(h), createUser(h)];
    const minor = createUser(h, { ageBand: '16_17' });
    expect((await call(h, minor, 'POST', `/challenges/${id}/enroll`)).body.error.code).toBe('AGE_RESTRICTED');
    expect((await call(h, u1, 'POST', `/challenges/${id}/enroll`)).body.seat_no).toBe(1);
    expect((await call(h, u2, 'POST', `/challenges/${id}/enroll`)).body.seat_no).toBe(2);
    expect((await call(h, u3, 'POST', `/challenges/${id}/enroll`)).body.error.code).toBe('SEATS_FULL');
    const listed = (await call(h, u1, 'GET', '/challenges')).body.items[0];
    expect(listed).toMatchObject({ seats_left: 0, prize: { description: 'Boekenbon' } });
    // Repair wave: no euro value for students (P7), and a minor does not see an 18+ prize (P10).
    expect(listed.prize.value_cents).toBeUndefined();
    const minorList = (await call(h, minor, 'GET', '/challenges')).body.items as { id: string }[];
    expect(minorList.some((c) => c.id === id)).toBe(false);
    expect(JSON.stringify(minorList)).not.toContain('Boekenbon');
    h.clock.set(new Date('2026-12-07T10:00:00Z'));
    expect((await call(h, u3, 'POST', `/challenges/${id}/enroll`)).body.error.code).toBe('ENROLLMENT_CLOSED');
    expect((await call(h, u3, 'GET', `/challenges/${id}/progress`)).body.error.code).toBe('NOT_ENROLLED');
    for (const d of ['2026-12-07', '2026-12-08', '2026-12-09', '2026-12-10', '2026-12-11', '2026-12-12', '2026-12-13']) putDay(h, u1.id, d, { goalMet: true, countedMin: 130 });
    putDay(h, u2.id, '2026-12-07', { goalMet: true, countedMin: 60 });
    await closeDay(h, '2026-12-13', [8]);
    const status = (u: TestUser) => h.db.get<{ status: string }>('SELECT status FROM challenge_enrollment WHERE user_id = ?', [u.id])!.status;
    expect([status(u1), status(u2)]).toEqual(['achieved', 'failed']);
    const progress = await call(h, u1, 'GET', `/challenges/${id}/progress`);
    expect(progress.body.days).toHaveLength(7);
    // Result: proposed by one admin, confirmed by another (four eyes). Admin sessions last 12 hours.
    const [proposer, admin2] = [createUser(h, { admin: true }), createUser(h, { admin: true })];
    const enrollment = h.db.get<{ id: string }>('SELECT id FROM challenge_enrollment WHERE user_id = ?', [u1.id])!.id;
    const prizeId = ch.body.challenge.prizes[0].prize_id as string;
    expect((await call(h, proposer, 'POST', `/admin/challenges/${id}/results/propose`, { winners: [{ prize_id: prizeId, user_ref: enrollment }] })).status).toBe(200);
    expect((await call(h, proposer, 'POST', `/admin/challenges/${id}/results/confirm`, {})).body.error.code).toBe('FOUR_EYES_REQUIRED');
    const final = await call(h, admin2, 'POST', `/admin/challenges/${id}/results/confirm`, {});
    expect(final.body.challenge.status).toBe('final');
  });

  it('architecture §6.2: a collective result needs a judged prize sample (SAMPLE_REQUIRED)', async () => {
    const h = wp5Harness({ driver });
    const admin = createUser(h, { admin: true });
    const club = createClub(h);
    const prize = { kind: 'earned_collective', reward_kind: 'in_kind', description_nl: 'Borrel', description_en: 'Drinks', value_cents: 7500, partner_id: '01JWP5PAR0000000000000000A', budget_id: '01JWP5BDG0000000000000000A', declaration_ref: 'decl-1', min_age_band: '16_17' };
    const ch = await call(h, admin, 'POST', '/admin/challenges', { type: 'club_prize', title_nl: 'Blokk', title_en: 'Blokk', period_start_day: '2027-01-04', period_end_day: '2027-01-17', rules: { threshold_rate: 0.25 }, prizes: [prize] });
    expect(ch.status).toBe(201);
    expect((await call(h, admin, 'POST', '/admin/challenges', { type: 'club_prize', title_nl: 'X', title_en: 'X', period_start_day: '2027-01-04', period_end_day: '2027-01-17', rules: {}, prizes: [{ ...prize, value_cents: 7501 }] })).body.error.code).toBe('CEILING_EXCEEDED');
    await call(h, admin, 'POST', `/admin/challenges/${ch.body.challenge.id}/publish`);
    const r = await call(h, admin, 'POST', `/admin/challenges/${ch.body.challenge.id}/results/propose`, { winners: [{ prize_id: ch.body.challenge.prizes[0].prize_id, club_id: club.id }] });
    expect(r.body.error.code).toBe('SAMPLE_REQUIRED');
  });
});
