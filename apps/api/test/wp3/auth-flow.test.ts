// Integration tests for the whole login flow (architecture §10.1, §11; spec §3.1), on both drivers.
import { describe, expect, it } from 'vitest';
import { DRIVERS, Client, ONBOARDING, lastLogin, register, seedInvite, userIdOf, wp3App, type TestApp } from './helpers.ts';

type Err = { error: { code: string; message_key: string } };
const code = (r: { body: unknown }) => (r.body as Err).error?.code;

async function requestLink(_t: TestApp, c: Client, email: string, invite?: string) {
  return c.post('/auth/magic-link', { email, locale: 'nl', ...(invite ? { invite_token: invite } : {}) });
}

describe.each(DRIVERS)('login flow on %s', (driver) => {
  it('§10.1 step 1: magic link answers 202, mails a fragment link and a code, stores only hashes', async () => {
    const t = wp3App(driver);
    const c = new Client(t);
    const res = await requestLink(t, c, 'Sanne@Example.nl', seedInvite(t));
    expect(res.status).toBe(202);
    expect(res.body).toEqual({});
    const mail = t.inbox.list('sanne@example.nl')[0]!;
    expect(mail.channel === 'email' && mail.text).toMatch(/http:\/\/app\.test\/auth\/bevestig#t=[A-Za-z0-9_-]{43}/);
    const { token, code: six } = lastLogin(t, 'sanne@example.nl');
    const row = t.db.get<Record<string, unknown>>('SELECT * FROM auth_magic_link')!;
    expect(JSON.stringify(row)).not.toContain(token);
    expect(JSON.stringify(row)).not.toContain(six);
    expect(row.expires_at).toBe('2026-11-05T09:15:00.000Z');
    expect(t.db.get('SELECT requested FROM auth_daily_stat')).toEqual({ requested: 1 });
  });

  it('§10.1 step 2 / §11 scanner scenario: fetching the link consumes nothing; the tap confirms', async () => {
    const t = wp3App(driver);
    const c = new Client(t);
    await requestLink(t, c, 'sanne@example.nl', seedInvite(t));
    const { token } = lastLogin(t, 'sanne@example.nl');
    // A mail scanner fetches the URL: the fragment never leaves the client, so the server sees only the path.
    const scanner = new Client(t, '192.0.2.50');
    const fetched = await scanner.get('/auth/bevestig');
    expect(fetched.status).toBe(404);
    const getConfirm = await scanner.get(`/auth/confirm?t=${token}`);
    expect(getConfirm.status).toBe(404);
    expect(t.db.get('SELECT used_at FROM auth_magic_link')).toEqual({ used_at: null });
    // The student taps "Inloggen": an explicit POST.
    const res = await c.post('/auth/confirm', { token });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ next: '/onboarding' });
    expect(c.cookies.get('rw_sid')).toBeDefined();
    expect(res.headers.getSetCookie().find((h) => h.startsWith('rw_sid='))).toMatch(/HttpOnly/i);
    expect(t.db.get('SELECT used_via FROM auth_magic_link')).toEqual({ used_via: 'link' });
    // One-time: a second tap is refused.
    expect(code(await new Client(t).post('/auth/confirm', { token }))).toBe('LINK_INVALID');
  });

  it('§11: code in the first browser, link opened in a second context: same invite, the other path is then invalid', async () => {
    const t = wp3App(driver);
    const invite = seedInvite(t);
    const first = new Client(t);
    const second = new Client(t, '198.51.100.7');
    await requestLink(t, first, 'sanne@example.nl', invite);
    const { token, code: six } = lastLogin(t, 'sanne@example.nl');
    const viaCode = await first.post('/auth/code', { email: 'sanne@example.nl', code: six });
    expect(viaCode.status).toBe(200);
    expect(t.db.get('SELECT invite_token FROM auth_session')).toEqual({ invite_token: invite });
    expect(code(await second.post('/auth/confirm', { token }))).toBe('LINK_INVALID');

    // And the other way round: the link wins, then the code is refused.
    await requestLink(t, first, 'daan@example.nl', invite);
    const l2 = lastLogin(t, 'daan@example.nl');
    expect((await second.post('/auth/confirm', { token: l2.token })).status).toBe(200);
    expect(code(await first.post('/auth/code', { email: 'daan@example.nl', code: l2.code }))).toBe('CODE_INVALID');
    const sessions = t.db.all<{ invite_token: string }>('SELECT invite_token FROM auth_session WHERE pending_email IS NOT NULL');
    expect(sessions.map((s) => s.invite_token)).toEqual([invite, invite]);
  });

  it('§10.2: five code attempts per request, then TOO_MANY_ATTEMPTS; codes and links expire after 15 minutes', async () => {
    const t = wp3App(driver);
    const c = new Client(t);
    await requestLink(t, c, 'sanne@example.nl', seedInvite(t));
    const { code: six } = lastLogin(t, 'sanne@example.nl');
    const wrong = six === '000000' ? '111111' : '000000';
    for (let i = 0; i < 4; i++) expect(code(await c.post('/auth/code', { email: 'sanne@example.nl', code: wrong }))).toBe('CODE_INVALID');
    expect(code(await c.post('/auth/code', { email: 'sanne@example.nl', code: wrong }))).toBe('TOO_MANY_ATTEMPTS');
    expect(code(await c.post('/auth/code', { email: 'sanne@example.nl', code: six }))).toBe('TOO_MANY_ATTEMPTS');

    await requestLink(t, c, 'sanne@example.nl', seedInvite(t));
    const fresh = lastLogin(t, 'sanne@example.nl');
    t.clock.advance(15 * 60 * 1000);
    expect(code(await c.post('/auth/code', { email: 'sanne@example.nl', code: fresh.code }))).toBe('CODE_EXPIRED');
    const expired = await c.post<Err>('/auth/confirm', { token: fresh.token });
    expect(expired.status).toBe(401);
    expect(expired.body.error).toEqual({ code: 'LINK_EXPIRED', message_key: 'errors.auth.link_expired' });
  });

  it('spec §3.1: a 17-year-old gets 16_17, the day of turning 18, silent mode and personal arm A / continue', async () => {
    const t = wp3App(driver);
    const c = new Client(t);
    await requestLink(t, c, 'sem@example.nl', seedInvite(t, { source: 'club' }));
    await c.post('/auth/confirm', { token: lastLogin(t, 'sem@example.nl').token });
    // An event of the pre user waits in event_pending until onboarding.
    expect((await c.post('/events', { name: 'squad_prompt_shown', props: { dag: 1 } })).status).toBe(202);
    expect(t.db.get('SELECT count(*) AS n FROM event_pending')).toEqual({ n: 1 });
    const res = await c.post<{ user: { id: string }; assignment: { arm_bonus: string; arm_rest: string; unit: string } }>('/onboarding', {
      ...ONBOARDING,
      birth_date: '2009-06-01',
    });
    expect(res.status).toBe(201);
    expect(res.body.assignment).toMatchObject({ unit: 'solo', arm_bonus: 'A', arm_rest: 'continue' });
    const user = t.db.get<Record<string, unknown>>('SELECT * FROM user')!;
    expect(user).toMatchObject({ age_band: '16_17', turns_18_on: '2027-06-01', silent_mode: 1, registration_source: 'club', registration_channel: 'club', cohort: 'experiment' });
    expect(JSON.stringify(user)).not.toContain('2009-06-01');
    expect(t.db.get('SELECT count(*) AS n FROM event_pending')).toEqual({ n: 0 });
    const names = t.db.all<{ name: string }>('SELECT name FROM event WHERE pseudonym = ? ORDER BY server_at, name', [user.pseudonym as string]).map((e) => e.name);
    expect(names).toEqual(expect.arrayContaining(['squad_prompt_shown', 'account_created', 'experiment_assigned', 'daily_goal_set']));
    expect(t.db.get('SELECT uses FROM invite')).toEqual({ uses: 1 });
    const me = await c.get<{ onboarding_complete: boolean; age_band: string; settings: { silent_mode: boolean } }>('/me');
    expect(me.body).toMatchObject({ onboarding_complete: true, age_band: '16_17', settings: { silent_mode: true } });
  });

  it('spec §3.1 step 5 / arch §11: under 16 gives AGE_BELOW_MINIMUM and nothing of the person remains', async () => {
    const t = wp3App(driver);
    const c = new Client(t);
    await requestLink(t, c, 'kees@example.nl', seedInvite(t));
    await c.post('/auth/confirm', { token: lastLogin(t, 'kees@example.nl').token });
    await c.post('/events', { name: 'squad_prompt_shown', props: { dag: 1 } });
    const res = await c.post<Err>('/onboarding', { ...ONBOARDING, birth_date: '2011-01-01' });
    expect(res.status).toBe(403);
    expect(res.body.error).toEqual({ code: 'AGE_BELOW_MINIMUM', message_key: 'errors.auth.age_below_minimum' });
    expect(t.db.get('SELECT count(*) AS n FROM user')).toEqual({ n: 0 });
    expect(t.db.get('SELECT count(*) AS n FROM auth_magic_link')).toEqual({ n: 0 });
    expect(t.db.get('SELECT count(*) AS n FROM event_pending')).toEqual({ n: 0 });
    expect(t.db.get('SELECT count(*) AS n FROM auth_session')).toEqual({ n: 0 });
    expect(c.cookies.has('rw_sid')).toBe(false);
    // No trace of the address or the birth date in any table.
    for (const { name } of t.db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'")) {
      const dump = JSON.stringify(t.db.all(`SELECT * FROM "${name}"`));
      expect(dump).not.toContain('kees@example.nl');
      expect(dump).not.toContain('2011-01-01');
    }
    expect((await c.get('/me')).status).toBe(401);
  });

  it('spec §3.1 step 4: an existing user logs in to "/", also through a plus alias (the mail goes to the account address)', async () => {
    const t = wp3App(driver);
    await register(t, 'jan.jansen@example.nl', '2000-01-01');
    const c = new Client(t);
    // No invite needed for an existing account.
    expect((await requestLink(t, c, 'jan.jansen+2@example.nl')).status).toBe(202);
    // Repair wave: the mail goes to the account's own address, never to the typed variant.
    expect(t.inbox.list('jan.jansen+2@example.nl')).toHaveLength(0);
    const res = await c.post('/auth/confirm', { token: lastLogin(t, 'jan.jansen@example.nl').token });
    expect(res.body).toEqual({ next: '/' });
    expect(t.db.get('SELECT count(*) AS n FROM user')).toEqual({ n: 1 });
    const me = await c.get<{ user: { id: string } }>('/me');
    expect(me.body.user.id).toBe(userIdOf(t, 'jan.jansen@example.nl'));
  });

  it('§3.1 closed pilot: unknown address without invite gets 202 and a waitlist mail; a bad invite gives INVITE_REQUIRED', async () => {
    const t = wp3App(driver);
    const c = new Client(t);
    const res = await requestLink(t, c, 'nobody@example.nl');
    expect(res.status).toBe(202);
    expect(t.db.get('SELECT count(*) AS n FROM auth_magic_link')).toEqual({ n: 0 });
    const mail = t.inbox.list('nobody@example.nl')[0]!;
    expect(mail.channel === 'email' && mail.text).toContain('/welkom');
    expect(mail.channel === 'email' && mail.text).not.toMatch(/\d{6}/);
    expect(code(await requestLink(t, c, 'nobody@example.nl', 'unknown-invite-token-123'))).toBe('INVITE_REQUIRED');
    const used = seedInvite(t, { maxUses: 1 });
    t.db.run('UPDATE invite SET uses = 1 WHERE token = ?', [used]);
    expect(code(await requestLink(t, c, 'nobody@example.nl', used))).toBe('INVITE_REQUIRED');
  });

  it('§8.2: TERMS_OUTDATED, OVERREACH_CONFIRM_REQUIRED and an implausible birth date', async () => {
    const t = wp3App(driver);
    const c = new Client(t);
    await requestLink(t, c, 'sanne@example.nl', seedInvite(t));
    await c.post('/auth/confirm', { token: lastLogin(t, 'sanne@example.nl').token });
    expect(code(await c.post('/onboarding', { ...ONBOARDING, terms_version: '0.2', birth_date: '2000-01-01' }))).toBe('TERMS_OUTDATED');
    expect(code(await c.post('/onboarding', { ...ONBOARDING, daily_goal_min: 120, birth_date: '2000-01-01' }))).toBe('OVERREACH_CONFIRM_REQUIRED');
    expect(code(await c.post('/onboarding', { ...ONBOARDING, birth_date: '2030-01-01' }))).toBe('VALIDATION_FAILED');
    expect(code(await c.post('/onboarding', { ...ONBOARDING, birth_date: '2000-01-01', extra: 1 }))).toBe('VALIDATION_FAILED');
    expect((await c.post('/onboarding', { ...ONBOARDING, daily_goal_min: 120, confirm_overreach: true, birth_date: '2000-01-01' })).status).toBe(201);
  });

  it('§10.1 step 5: logout removes every session of the account', async () => {
    const t = wp3App(driver);
    const c = await register(t, 'sanne@example.nl', '2000-01-01');
    const other = new Client(t);
    await requestLink(t, other, 'sanne@example.nl');
    await other.post('/auth/confirm', { token: lastLogin(t, 'sanne@example.nl').token });
    expect(t.db.get('SELECT count(*) AS n FROM auth_session')).toEqual({ n: 2 });
    expect((await c.post('/auth/logout')).status).toBe(204);
    expect(t.db.get('SELECT count(*) AS n FROM auth_session')).toEqual({ n: 0 });
    expect((await other.get('/me')).status).toBe(401);
  });

  it('§10.1: sessions slide for 30 days; pre sessions see user null', async () => {
    const t = wp3App(driver);
    const pre = new Client(t);
    await requestLink(t, pre, 'pre@example.nl', seedInvite(t));
    await pre.post('/auth/confirm', { token: lastLogin(t, 'pre@example.nl').token });
    expect((await pre.get('/me')).body).toMatchObject({ user: null, onboarding_complete: false });
    const c = await register(t, 'sanne@example.nl', '2000-01-01');
    t.clock.advance(29 * 24 * 3600 * 1000);
    expect((await c.get('/me')).status).toBe(200);
    t.clock.advance(29 * 24 * 3600 * 1000);
    expect((await c.get('/me')).status).toBe(200);
    t.clock.advance(31 * 24 * 3600 * 1000);
    expect((await c.get('/me')).status).toBe(401);
  });

  it('§8.2 settings and research opt-out (spec §4.10): once, from the next focus day', async () => {
    const t = wp3App(driver);
    const c = await register(t, 'sanne@example.nl', '2000-01-01');
    const s = await c.request<{ settings: Record<string, unknown> }>('PATCH', '/me/settings', { compare_opt_in: true, locale: 'en' });
    expect(s.body.settings).toMatchObject({ compare_opt_in: true, locale: 'en' });
    const r = await c.post<{ effective_from_day: string }>('/me/research-opt-out', { confirm: true });
    expect(r.status).toBe(200);
    expect(r.body.effective_from_day).toBe('2026-11-06');
    expect(code(await c.post('/me/research-opt-out', { confirm: true }))).toBe('ALREADY_OPTED_OUT');
    const reasons = t.db.all<{ reason: string }>('SELECT DISTINCT reason FROM arm_switch').map((x) => x.reason);
    expect(reasons).toEqual(['opt_out']);
  });

  it('§10.1 Meten: auth_daily_stat counts requests, link and code use, invalid attempts', async () => {
    const t = wp3App(driver);
    const c = new Client(t);
    await requestLink(t, c, 'a@example.nl', seedInvite(t));
    await requestLink(t, c, 'b@example.nl', seedInvite(t));
    await c.post('/auth/confirm', { token: lastLogin(t, 'a@example.nl').token });
    await c.post('/auth/code', { email: 'b@example.nl', code: lastLogin(t, 'b@example.nl').code });
    await c.post('/auth/confirm', { token: 'x'.repeat(43) });
    expect(t.db.get('SELECT day, requested, consumed_link, consumed_code, invalid FROM auth_daily_stat')).toEqual({
      day: '2026-11-05',
      requested: 2,
      consumed_link: 1,
      consumed_code: 1,
      invalid: 1,
    });
  });

  it('§10.2: magic links are limited to five per hour per address', async () => {
    const t = wp3App(driver);
    const c = new Client(t);
    const inv = seedInvite(t);
    for (let i = 0; i < 5; i++) expect((await requestLink(t, c, `x+${i}@example.nl`, inv)).status).toBe(202);
    const limited = await requestLink(t, c, 'x@example.nl', inv);
    expect(limited.status).toBe(429);
    expect(code(limited)).toBe('RATE_LIMITED');
  });
});
