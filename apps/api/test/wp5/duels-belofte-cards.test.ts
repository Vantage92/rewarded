// Duels (spec §4.5), the Belofte (spec §3.12, §4.12), shareable cards with the SVG escape test
// (spec §4.8, architecture §10.3, §11), referral (spec §4.9) and the reminder mail (architecture §6.3).
import { describe, expect, it } from 'vitest';
import { job as remindersJob } from '../../src/jobs/reminders.ts';
import { sendReminders } from '../../src/modules/reminders/logic.ts';
import { ANON, call, closeDay, createUser, putDay, putSession, setFlag, squadOf, wp5Harness } from './harness.ts';

describe('spec §4.5 duels on met daily goals, no points', () => {
  it('§4.5 seven days from the next day; goal_met_final counts, an exam day does not; a flag holds the result', async () => {
    const h = wp5Harness({ start: '2026-12-03T10:00:00Z' });
    expect((await call(h, createUser(h), 'POST', '/duels', {})).body.error.code).toBe('FEATURE_DISABLED');
    setFlag(h, 'duels');
    const { users } = await squadOf(h, 3);
    const [a, b] = users;
    // a 16-year-old can challenge a squad member (spec §3.6 step 1)
    h.db.run("UPDATE user SET age_band = '16_17', turns_18_on = '2027-09-01' WHERE id = ?", [a!.id]);
    const presence = await call(h, a!, 'GET', '/squads/mine/presence');
    const refs = presence.body.members.map((m: { member_ref: string }) => m.member_ref) as string[];
    let created;
    for (const ref of refs) {
      created = await call(h, a!, 'POST', '/duels', { opponent_member_ref: ref });
      if (created.status === 201) break;
    }
    expect(created!.status).toBe(201);
    expect(created!.body.duel).toMatchObject({ status: 'open', in_squad: true });
    const opponent = h.db.get<{ opponent_id: string }>('SELECT opponent_id FROM duel')!.opponent_id;
    const opp = users.find((u) => u.id === opponent)!;
    const accepted = await call(h, opp, 'POST', `/invites/${created!.body.invite.token}/accept`);
    expect(accepted.body.duel).toEqual({ id: created!.body.duel.id, start_day: '2026-12-04', end_day: '2026-12-10' });
    const days = ['2026-12-04', '2026-12-05', '2026-12-06', '2026-12-07', '2026-12-08', '2026-12-09', '2026-12-10'];
    for (const [i, d] of days.entries()) {
      putDay(h, a!.id, d, { goalMet: i < 5 });
      putDay(h, opp.id, d, { goalMet: i < 3 || i === 6, examDay: i === 5 });
    }
    // A provisional goal (open flag) is not final: goal_met_final = 0 does not count.
    putDay(h, opp.id, '2026-12-08', { goalMet: true, goalMetFinal: false });
    await closeDay(h, '2026-12-10', [5]);
    const d = h.db.get<{ status: string; result: string }>('SELECT status, result FROM duel')!;
    expect(d).toEqual({ status: 'finished', result: 'challenger' });
    h.clock.set(new Date('2026-12-11T10:00:00Z'));
    const cur = await call(h, a!, 'GET', '/duels/current');
    expect(cur.body).toMatchObject({ me_total: 5, opponent_total: 4, result: 'won' });
    expect(cur.text).not.toMatch(/punt|point|minut/);
    expect(h.events.named('duel_finished')).toHaveLength(1);
    expect(b).toBeDefined();
  });

  it('§4.5 a player with an open flag in the duel period gets a result only after the decision', async () => {
    const h = wp5Harness({ start: '2026-12-03T10:00:00Z' });
    setFlag(h, 'duels');
    const [a, b] = [createUser(h), createUser(h)];
    const created = await call(h, a, 'POST', '/duels', {});
    await call(h, b, 'POST', `/invites/${created.body.invite.token}/accept`);
    expect(h.db.get<{ in_squad: number }>('SELECT in_squad FROM duel')!.in_squad).toBe(0);
    const sid = putSession(h, b.id, '2026-12-05');
    h.flags.raise(h.db, { code: 'H3', subject: { type: 'session', id: sid }, sessionIds: [sid], evidence: {} });
    await closeDay(h, '2026-12-10', [5]);
    expect(h.db.get<{ status: string }>('SELECT status FROM duel')!.status).toBe('pending_review');
  });
});

describe('spec §4.12 the Belofte', () => {
  it('§4.12 offer per arm and calendar, witnesses, day results without points, reflection with the 18+ question', async () => {
    const h = wp5Harness({ start: '2027-01-10T10:00:00Z' });
    setFlag(h, 'belofte');
    const { users, squadId } = await squadOf(h, 3);
    const [early, mate, minor] = users;
    h.db.run("UPDATE squad SET arm_belofte = 'early' WHERE id = ?", [squadId]);
    h.db.run("UPDATE user SET age_band = '16_17', turns_18_on = '2027-09-01' WHERE id = ?", [minor!.id]);
    // T = 17 January (params fallback): the early offer comes on T − 6 = 11 January.
    expect((await call(h, early!, 'GET', '/belofte/offer')).body).toEqual({});
    expect((await call(h, early!, 'POST', '/beloftes', { days_per_week: 4, min_per_day: 50, witnesses: 'squad' })).body.error.code).toBe('OFFER_NOT_YET');
    h.clock.set(new Date('2027-01-11T10:00:00Z'));
    for (const d of ['2027-01-04', '2027-01-05', '2027-01-06', '2027-01-07', '2027-01-08', '2027-01-09']) putDay(h, early!.id, d, { goalMet: true, countedMin: 60, verifiedMin: 60 });
    const offer = await call(h, early!, 'GET', '/belofte/offer');
    expect(offer.body).toEqual({ offer: { suggested_days: 3, suggested_min: 50, trigger: 'early' } });
    const made = await call(h, early!, 'POST', '/beloftes', { days_per_week: 4, min_per_day: 50, witnesses: 'squad' });
    expect(made.status).toBe(201);
    expect(made.body.belofte).toMatchObject({ start_day: '2027-01-11', end_day: '2027-01-24', status: 'active' });
    expect((await call(h, early!, 'POST', '/beloftes', { days_per_week: 4, min_per_day: 50, witnesses: 'squad' })).body.error.code).toBe('BELOFTE_ACTIVE');
    expect(h.ledger.entries()).toHaveLength(0);
    // Day result at the close: 55 minutes ≥ 50.
    putDay(h, early!.id, '2027-01-11', { goalMet: true, countedMin: 55 });
    await closeDay(h, '2027-01-11', [6]);
    expect(h.events.named('belofte_day_result').map((e) => e.props)).toEqual([{ gehaald: true }]);
    const witness = await call(h, mate!, 'GET', '/squads/mine/beloftes');
    expect(witness.body.items).toEqual([{ first_name: early!.firstName, days_per_week: 4, min_per_day: 50, start_day: '2027-01-11', end_day: '2027-01-24', status: 'active', days: [{ day: '2027-01-11', met: true }] }]);
    // Reflection after 14 days; the stake question is only for 18-plussers.
    h.clock.set(new Date('2027-01-25T10:00:00Z'));
    await closeDay(h, '2027-01-24', [6]);
    h.clock.set(new Date('2027-01-25T10:00:00Z'));
    const id = made.body.belofte.id as string;
    const refl = await call(h, early!, 'POST', `/beloftes/${id}/reflection`, { action: 'extend', stake_interest: 'unsure' });
    expect(refl.body).toEqual({ next: 'new_belofte' });
    expect(h.db.get<{ renewal_used_at: string | null }>('SELECT renewal_used_at FROM belofte_offer WHERE user_id = ?', [early!.id])!.renewal_used_at).not.toBeNull();
    const cur = await call(h, early!, 'GET', '/beloftes/current');
    expect(cur.body.belofte).toMatchObject({ start_day: '2027-01-25', status: 'active' });
    expect((await call(h, early!, 'POST', `/beloftes/${cur.body.belofte.id}/stop`)).body).toEqual({ status: 'stopped' });
    // The minor gets the same offer but not the stake question.
    const m = await call(h, minor!, 'POST', '/beloftes', { days_per_week: 3, min_per_day: 25, witnesses: 'none' });
    h.db.run("UPDATE belofte SET start_day = '2027-01-11', end_day = '2027-01-24' WHERE id = ?", [m.body.belofte.id]);
    expect((await call(h, minor!, 'POST', `/beloftes/${m.body.belofte.id}/reflection`, { action: 'stop', stake_interest: 'yes' })).body.error.code).toBe('AGE_RESTRICTED');
    expect((await call(h, mate!, 'POST', `/beloftes/${m.body.belofte.id}/stop`)).body.error.code).toBe('FORBIDDEN');
  });

  it('§4.12 the late arm gets the offer only after the April window (no leak before)', async () => {
    const h = wp5Harness({ start: '2027-01-11T10:00:00Z' });
    setFlag(h, 'belofte');
    const { users, squadId } = await squadOf(h, 3);
    h.db.run("UPDATE squad SET arm_belofte = 'late' WHERE id = ?", [squadId]);
    expect((await call(h, users[0]!, 'GET', '/belofte/offer')).body).toEqual({});
    expect((await call(h, users[0]!, 'POST', '/beloftes', { days_per_week: 3, min_per_day: 25, witnesses: 'none' })).body.error.code).toBe('OFFER_NOT_YET');
  });
});

describe('spec §4.8 shareable card as SVG', () => {
  it('architecture §11 Kaart met kwaadaardige voornaam: escaped SVG, strict headers, never points', async () => {
    const h = wp5Harness({ start: '2026-12-03T15:00:00Z' });
    setFlag(h, 'cards');
    const evil = '<script>alert("x")</script>&<img src=x onerror=1>';
    const u = createUser(h, { firstName: evil });
    const sid = putSession(h, u.id, '2026-12-03', { minutes: 50 });
    const card = await call(h, u, 'POST', '/cards', { kind: 'session', ref_id: sid, fields: { first_name: true, duration: true } });
    expect(card.status).toBe(201);
    const img = await call(h, u, 'GET', `/cards/${card.body.card_id}/image?format=1x1`);
    expect(img.status).toBe(200);
    expect(img.headers.get('content-type')).toBe('image/svg+xml; charset=utf-8');
    expect(img.headers.get('content-security-policy')).toContain("default-src 'none'");
    expect(img.headers.get('content-security-policy')).toContain("script-src 'none'");
    expect(img.headers.get('x-content-type-options')).toBe('nosniff');
    expect(img.text).not.toMatch(/<script|<img|onerror=1>/i);
    expect(img.text).toContain('&lt;script&gt;alert(&quot;');
    expect(img.text).toContain('50 minuten focus');
    expect(img.text).not.toMatch(/punt|point|€/i);
    expect(img.text.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    // Public verification page: noindex, the statement of what it does not prove, then revocation.
    const v = await call(h, null, 'GET', `/verify/${card.body.token}`);
    expect(v.headers.get('x-robots-tag')).toContain('noindex');
    expect(v.body).toMatchObject({ first_name: evil, duration_min: 50, from: '2026-12-03', statement_key: 'cards.verify.statement_session' });
    expect((await call(h, u, 'DELETE', `/cards/${card.body.card_id}`)).status).toBe(204);
    expect((await call(h, null, 'GET', `/verify/${card.body.token}`)).body.error.code).toBe('CARD_UNAVAILABLE');
  });

  it('§4.8 no card for a session under review; a rejected session makes the page disappear', async () => {
    const h = wp5Harness({ start: '2026-12-03T15:00:00Z' });
    setFlag(h, 'cards');
    const u = createUser(h);
    const pending = putSession(h, u.id, '2026-12-03', { review: 'pending' });
    expect((await call(h, u, 'POST', '/cards', { kind: 'session', ref_id: pending, fields: { first_name: true } })).body.error.code).toBe('SESSION_UNDER_REVIEW');
    const ok = putSession(h, u.id, '2026-12-03');
    const card = await call(h, u, 'POST', '/cards', { kind: 'session', ref_id: ok, fields: { first_name: false } });
    expect((await call(h, null, 'GET', `/verify/${card.body.token}`)).status).toBe(200);
    h.db.run("UPDATE focus_session SET review_status = 'rejected' WHERE id = ?", [ok]);
    expect((await call(h, null, 'GET', `/verify/${card.body.token}`)).body.error.code).toBe('CARD_UNAVAILABLE');
    expect((await call(h, createUser(h), 'GET', `/cards/${card.body.card_id}/image`)).status).toBe(404);
  });
});

describe('spec §4.9 referral behind the flag', () => {
  it('§4.9 150 unvested points per party, vesting after 3 sessions and the hold, never with the same device', async () => {
    const h = wp5Harness({ start: '2027-01-06T10:00:00Z' });
    setFlag(h, 'referral');
    const inviter = createUser(h, { firstName: 'Joris' });
    const mine = await call(h, inviter, 'GET', '/referral/mine');
    expect(mine.status).toBe(200);
    const token = (mine.body.link as string).split('/i/')[1]!;
    const inviteId = h.db.get<{ id: string }>('SELECT id FROM invite WHERE token = ?', [token])!.id;
    const invitee = createUser(h, { firstName: 'Mila' });
    h.db.run('UPDATE user SET registration_invite_id = ?, first_redeem_after = ? WHERE id = ?', [inviteId, '2027-01-08T00:00:00.000Z', invitee.id]);
    expect((await call(h, invitee, 'POST', `/invites/${token}/accept`)).status).toBe(200);
    expect(h.ledger.balances(inviter.id).referralUnvested).toBe(150);
    expect(h.ledger.balances(invitee.id).referralUnvested).toBe(150);
    for (const d of ['2027-01-06', '2027-01-07']) putSession(h, invitee.id, d, { minutes: 25, startAt: Date.parse(`${d}T12:00:00Z`) });
    await closeDay(h, '2027-01-07', [8]);
    expect((await call(h, inviter, 'GET', '/referral/mine')).body.pending).toEqual([{ first_name: 'Mila', sessions_done: 2, deadline: '2027-01-13T10:00:00.000Z' }]);
    putSession(h, invitee.id, '2027-01-08', { minutes: 25, startAt: Date.parse('2027-01-08T12:00:00Z') });
    await closeDay(h, '2027-01-08', [8]);
    expect(h.db.get<{ status: string }>('SELECT status FROM referral')!.status).toBe('vested');
    expect(h.ledger.balances(inviter.id).available).toBe(150);
    expect(h.ledger.balances(invitee.id).referralUnvested).toBe(0);
    expect(h.events.named('referral_vested')).toHaveLength(1);

    // Same client_device_id as the inviter: the referral lapses silently.
    const twin = createUser(h);
    h.db.run('UPDATE device SET client_device_id = ? WHERE user_id = ?', [`cd_${inviter.id}`, twin.id]);
    h.db.run('UPDATE user SET registration_invite_id = ? WHERE id = ?', [inviteId, twin.id]);
    await call(h, twin, 'POST', `/invites/${token}/accept`);
    await closeDay(h, '2027-01-09', [8]);
    expect(h.db.get<{ status: string }>('SELECT status FROM referral WHERE invitee_id = ?', [twin.id])!.status).toBe('lapsed');
    expect(h.ledger.balances(twin.id).referralUnvested).toBe(0);
  });

  it('§4.9 before 5 January or with the flag off there is no referral', async () => {
    const h = wp5Harness({ start: '2027-01-04T10:00:00Z' });
    setFlag(h, 'referral');
    expect((await call(h, createUser(h), 'GET', '/referral/mine')).body.error.code).toBe('FEATURE_DISABLED');
  });
});

describe('architecture §6.3 reminder mail', () => {
  it('§6.3 / UX §4.9 at most one per user per day at the chosen time, only when the goal is not met, off with a random token', async () => {
    const h = wp5Harness({ start: '2026-12-03T18:31:00Z' });
    const [late, done, off, early] = [createUser(h), createUser(h), createUser(h), createUser(h)];
    // Reminders are opt-in (P5): a direct insert without a choice is off.
    expect(h.db.get<{ n: number }>('SELECT count(*) AS n FROM user WHERE email_reminders = 1')!.n).toBe(0);
    h.db.run("UPDATE user SET email_reminders = 1, reminders_chosen_at = '2026-12-01T10:00:00.000Z' WHERE id IN (?, ?, ?)", [late.id, done.id, early.id]);
    h.db.run("UPDATE user SET reminder_time = '20:00' WHERE id = ?", [early.id]);
    putDay(h, done.id, '2026-12-03', { goalMet: true });
    void off;
    expect((await sendReminders(h.deps, '2026-12-03')).sent).toBe(0); // flag off
    setFlag(h, 'reminders');
    expect(remindersJob.dueKey!(new Date('2026-12-03T18:31:00Z'))).toBe('reminders:2026-12-03T19:30');
    expect(remindersJob.dueKey!(new Date('2026-12-03T18:46:00Z'))).toBe('reminders:2026-12-03T19:45');
    expect((await sendReminders(h.deps, '2026-12-03')).sent).toBe(1);
    expect((await sendReminders(h.deps, '2026-12-03')).sent).toBe(0);
    // 20:00 for the user who chose that time.
    expect((await sendReminders(h.deps, '2026-12-03', new Date('2026-12-03T19:01:00Z'))).sent).toBe(1);
    const mail = h.inbox.list(late.email).at(-1)!;
    expect(mail.channel).toBe('email');
    const text = mail.channel === 'email' ? mail.text : '';
    expect(text).not.toMatch(/punt|point|streak/i);
    expect(text).toContain('Je krijgt deze mail omdat je een herinnering aanzette.');
    expect(mail.channel === 'email' ? mail.subject : '').toBe('Je dagdoel staat nog open.');
    const token = /#t=([A-Za-z0-9_-]+)/.exec(text)![1]!;
    expect(token).not.toContain(late.id);
    expect((await call(h, ANON, 'POST', '/reminders/unsubscribe', { token: `${token.slice(0, -1)}x` })).body.error.code).toBe('LINK_INVALID');
    expect((await call(h, ANON, 'POST', '/reminders/unsubscribe', { token })).status).toBe(204);
    expect(h.db.get<{ email_reminders: number }>('SELECT email_reminders FROM user WHERE id = ?', [late.id])!.email_reminders).toBe(0);
    expect(h.events.named('reminder_sent')).toHaveLength(2);
  });
});
