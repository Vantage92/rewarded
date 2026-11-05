// Waitlist with group link and batch invitation (architecture §3.1 toegangspoort, §8.2, §11).
import { describe, expect, it } from 'vitest';
import { DRIVERS, Client, ONBOARDING, lastLogin, makeAdmin, register, wp3App, type TestApp } from './helpers.ts';

let n = 0;
const join = (c: Client, email: string, extra: Record<string, unknown> = {}) =>
  c.post('/waitlist', { email, locale: 'nl', source: 'landing', consent_version: 'v1', ...extra }, { headers: { 'Idempotency-Key': `wl-key-${++n}` } });

function groupTokenOf(t: TestApp, email: string): string {
  const mail = t.inbox.list(email).at(-1)!;
  return /groep=([A-Za-z0-9_-]+)/.exec(mail.channel === 'email' ? mail.text : '')![1]!;
}

describe.each(DRIVERS)('waitlist on %s', (driver) => {
  it('§8.2: sign-up answers 202 always, dedupes on the normalised address and mails the group link', async () => {
    const t = wp3App(driver);
    const c = new Client(t);
    expect((await join(c, 'Lotte@Example.nl')).status).toBe(202);
    expect((await join(c, 'lotte+x@example.nl')).status).toBe(202);
    expect(t.db.get('SELECT count(*) AS n FROM waitlist_entry')).toEqual({ n: 1 });
    expect(t.inbox.list('lotte@example.nl')).toHaveLength(1);
    const row = t.db.get<Record<string, unknown>>('SELECT * FROM waitlist_entry')!;
    expect(row).toMatchObject({ email: 'lotte@example.nl', priority_reason: 'none', source: 'landing' });
    expect(row.ip_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(groupTokenOf(t, 'lotte@example.nl')).toBe(row.group_token);
  });

  it('§3.1: friends through the group link are invited together in one invite with max_uses = group size', async () => {
    const t = wp3App(driver);
    const c = new Client(t);
    await join(c, 'lotte@example.nl');
    const group = groupTokenOf(t, 'lotte@example.nl');
    t.clock.advance(1000);
    await join(c, 'bram@example.nl', { group_token: group });
    await join(c, 'noor@example.nl', { group_token: group });
    t.clock.advance(1000);
    await join(c, 'club@example.nl', { source: 'club_qr' });
    await join(c, 'card@example.nl', { source: 'card' });
    await join(c, 'solo@example.nl');

    const admin = await register(t, 'admin@example.nl', '1990-01-01');
    makeAdmin(t, 'admin@example.nl');
    const overview = await admin.get<{ classes: { priority_reason: string; waiting: number; groups: number }[]; total_waiting: number }>('/admin/waitlist');
    expect(overview.body.total_waiting).toBe(6);
    expect(overview.body.classes.find((x) => x.priority_reason === 'group')).toMatchObject({ waiting: 3, groups: 1 });

    const dry = await admin.post<{ invites: { group_size: number; priority_reason: string }[] }>('/admin/waitlist/invite-batch', { count: 4, dry_run: true });
    expect(dry.body.invites).toEqual([
      { invite_id: null, priority_reason: 'group', group_size: 3 },
      { invite_id: null, priority_reason: 'club', group_size: 1 },
    ]);
    expect(t.db.get("SELECT count(*) AS n FROM invite WHERE source = 'waitlist'")).toEqual({ n: 0 });

    const batch = await admin.post<{ invites: { invite_id: string; group_size: number }[]; entries_invited: number }>('/admin/waitlist/invite-batch', { count: 4 });
    expect(batch.status).toBe(200);
    expect(batch.body.entries_invited).toBe(4);
    const invites = t.db.all<{ source: string; max_uses: number; expires_at: string }>("SELECT source, max_uses, expires_at FROM invite WHERE source = 'waitlist' ORDER BY max_uses DESC");
    expect(invites).toEqual([
      { source: 'waitlist', max_uses: 3, expires_at: '2026-11-19T09:00:02.000Z' },
      { source: 'waitlist', max_uses: 1, expires_at: '2026-11-19T09:00:02.000Z' },
    ]);
    expect(t.db.get('SELECT count(*) AS n FROM waitlist_entry WHERE invited_at IS NOT NULL')).toEqual({ n: 4 });
    expect(t.db.get("SELECT count(*) AS n FROM audit_log WHERE action = 'waitlist_batch_invited'")).toEqual({ n: 1 });
    expect(t.db.get("SELECT count(*) AS n FROM event WHERE name = 'invite_created'")).toEqual({ n: 2 });

    // Registration through the waitlist invite: source waitlist, outside K (spec §7.2).
    const mail = t.inbox.list('bram@example.nl').at(-1)!;
    const token = /\/i\/([A-Za-z0-9_-]+)/.exec(mail.channel === 'email' ? mail.text : '')![1]!;
    const bram = new Client(t);
    await bram.post('/auth/magic-link', { email: 'bram@example.nl', locale: 'nl', invite_token: token });
    await bram.post('/auth/confirm', { token: lastLogin(t, 'bram@example.nl').token });
    expect((await bram.post('/onboarding', { ...ONBOARDING, birth_date: '2004-01-01' })).status).toBe(201);
    expect(t.db.get("SELECT registration_source, registration_channel FROM user WHERE email = 'bram@example.nl'")).toEqual({
      registration_source: 'waitlist',
      registration_channel: 'waitlist',
    });
    expect(t.db.get('SELECT uses FROM invite WHERE token = ?', [token])).toEqual({ uses: 1 });
  });

  it('§10.6: unsubscribing deletes the entry; a forged token is LINK_INVALID', async () => {
    const t = wp3App(driver);
    const c = new Client(t);
    await join(c, 'lotte@example.nl');
    const mail = t.inbox.list('lotte@example.nl')[0]!;
    const token = /afmelden#t=([A-Za-z0-9_-]+)/.exec(mail.channel === 'email' ? mail.text : '')![1]!;
    const forged = token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A');
    expect((await c.post<{ error: { code: string } }>('/waitlist/unsubscribe', { token: forged })).body.error.code).toBe('LINK_INVALID');
    expect((await c.post('/waitlist/unsubscribe', { token })).status).toBe(204);
    expect(t.db.get('SELECT count(*) AS n FROM waitlist_entry')).toEqual({ n: 0 });
    expect((await c.post<{ error: { code: string } }>('/waitlist/unsubscribe', { token })).body.error.code).toBe('LINK_INVALID');
  });

  it('§10.2: 5 sign-ups per hour per address and 30 per hour per IP (300 on campus)', async () => {
    const t = wp3App(driver);
    const c = new Client(t, '203.0.113.5');
    for (let i = 0; i < 30; i++) expect((await join(c, `p${i}@example.nl`)).status).toBe(202);
    expect((await join(c, 'p31@example.nl')).status).toBe(429);
    const campus = new Client(t, '192.0.2.10'); // dev campus range
    for (let i = 0; i < 40; i++) expect((await join(campus, `c${i}@example.nl`)).status).toBe(202);
  });
});
