// Access and onboarding through the real chain (architecture §11 table; spec §3.1, §10.1).
import { lastCode, lastToken } from '../../tooling/seed/driver.ts';
import { LEGAL } from '../../tooling/seed/flows.ts';
import { expect, test } from '../support/fixtures.ts';
import { Chain, SEASON_START, homeIp, MIN } from '../support/steps.ts';

const INVITE_LINK = /\/i\/([A-Za-z0-9_-]{16,128})/;
const GROUP_LINK = /[?&]groep=([A-Za-z0-9_-]{8,64})/;

test('Wachtlijst: groepslink, batch-uitnodiging, registratie via de uitnodiging (arch §11, spec §3.1)', async ({ api }) => {
  const c = new Chain(api);
  await c.at(SEASON_START);
  const first = api.newActor(homeIp());
  await first.api.call('waitlist.join', { body: { email: 'groep.een@mail.demostad.test', locale: 'nl', source: 'landing', consent_version: 'privacy-0.3' } });
  const group = await lastToken(api.inbox, 'groep.een@mail.demostad.test', GROUP_LINK);
  for (const email of ['groep.twee@mail.demostad.test', 'groep.drie@mail.demostad.test']) {
    await api.newActor(homeIp()).api.call('waitlist.join', { body: { email, locale: 'nl', source: 'landing', group_token: group, consent_version: 'privacy-0.3' } });
  }
  const admin = await c.admin();
  const overview = await admin.api.call('admin.waitlist.overview');
  expect(overview.classes.find((k) => k.priority_reason === 'group')?.waiting).toBe(3);
  const batch = await admin.api.call('admin.waitlist.inviteBatch', { body: { count: 3 } });
  // The group travels in one invite with max_uses = group size.
  expect(batch.invites).toEqual([expect.objectContaining({ priority_reason: 'group', group_size: 3 })]);
  const tokens = new Set<string>();
  for (const e of ['groep.een', 'groep.twee', 'groep.drie']) tokens.add(await lastToken(api.inbox, `${e}@mail.demostad.test`, INVITE_LINK));
  expect(tokens.size).toBe(1);
  const s = await c.student({ email: 'groep.twee@mail.demostad.test', invite: [...tokens][0]! });
  const row = api.sql<{ registration_source: string; registration_channel: string; max_uses: number; source: string }>(
    'SELECT u.registration_source, u.registration_channel, i.max_uses, i.source FROM user u JOIN invite i ON i.id = u.registration_invite_id WHERE u.email = ?',
    ['groep.twee@mail.demostad.test'],
  )[0]!;
  expect(row).toEqual({ registration_source: 'waitlist', registration_channel: 'waitlist', max_uses: 3, source: 'waitlist' });
  // An activated waitlist registration does not count for K (spec §7.2).
  await c.sessions({ actor: s.actor, deviceId: s.deviceId, start: (await api.now()) + MIN, plannedMin: 25, outcome: { kind: 'complete' } });
  const day = new Date(await api.now()).toISOString().slice(0, 10);
  const k = await admin.api.call('admin.kpi.query', { params: { query: 'k_factor' }, query: { from: day, to: day } });
  const bronnen = k.rows.map((r) => r[0]);
  expect(bronnen).not.toContain('waitlist');
  expect(k.rows.find((r) => r[0] === 'all_activated')?.[1]).toBe(1);
});

test('Inloglink eerst opgehaald door een scanner: token niet verbruikt, daarna lukt Inloggen (arch §11, §10.1)', async ({ api, request }) => {
  const c = new Chain(api);
  const s = await c.student({ email: 'scanner@student.demostad.test' });
  const a = api.newActor(homeIp());
  await a.api.call('auth.magicLink', { body: { email: s.email, locale: 'nl' } });
  const link = (await api.inbox(s.email)).at(-1)!.text.match(/https?:\/\/\S+\/auth\/bevestig#t=[A-Za-z0-9_-]+/)![0];
  // A mail scanner fetches the URL; the token sits in the fragment, so nothing reaches the API.
  const scanned = await request.get(link.replace('http://localhost:5173', ''));
  expect(scanned.ok()).toBe(true);
  const token = link.split('#t=')[1]!;
  expect(api.sql<{ used_at: string | null }>('SELECT used_at FROM auth_magic_link WHERE email = ? ORDER BY created_at DESC LIMIT 1', [s.email])[0]!.used_at).toBeNull();
  const r = await a.api.call('auth.confirm', { body: { token } });
  expect(r.next).toBe('/');
  expect((await a.api.call('me.get')).user?.email).toBe(s.email);
});

test('Inloglink in een tweede browsercontext, code in de eerste: één pad wint, het andere is ongeldig (arch §11, §10.1)', async ({ api }) => {
  const c = new Chain(api);
  const email = c.email('twee.contexten');
  const invite = await c.waitlistInvite(email);
  const phone = api.newActor(homeIp());
  const laptop = api.newActor(homeIp());
  await phone.api.call('auth.magicLink', { body: { email, locale: 'nl', invite_token: invite } });
  const mail = (await api.inbox(email)).at(-1)!.text;
  const token = /#t=([A-Za-z0-9_-]+)/.exec(mail)![1]!;
  // Code in the first context: a pre session with the invite; the onboarding completes there.
  expect((await phone.api.call('auth.code', { body: { email, code: await lastCode(api.inbox, email) } })).next).toBe('/onboarding');
  expect(await laptop.codeOf(laptop.api.call('auth.confirm', { body: { token } }))).toBe('LINK_INVALID');
  const done = await phone.api.call('me.onboarding', { body: { first_name: 'Twee', birth_date: '2004-02-02', ...LEGAL, daily_goal_min: 25 } });
  expect(done.user.email).toBe(email);
  // And the other way round: a new link used in the second context makes the code invalid.
  await phone.api.call('auth.magicLink', { body: { email, locale: 'nl' } });
  const token2 = /#t=([A-Za-z0-9_-]+)/.exec((await api.inbox(email)).at(-1)!.text)![1]!;
  const code2 = await lastCode(api.inbox, email);
  expect((await laptop.api.call('auth.confirm', { body: { token: token2 } })).next).toBe('/');
  expect(await phone.codeOf(phone.api.call('auth.code', { body: { email, code: code2 } }))).toBe('CODE_INVALID');
});

test('Registratie met geboortedatum 15 jaar: AGE_BELOW_MINIMUM en niets blijft over (arch §11, spec §3.1)', async ({ api }) => {
  const c = new Chain(api);
  await c.at(SEASON_START);
  const email = c.email('vijftien');
  const invite = await c.waitlistInvite(email);
  const a = api.newActor(homeIp());
  await a.api.call('auth.magicLink', { body: { email, locale: 'nl', invite_token: invite } });
  await a.api.call('auth.code', { body: { email, code: await lastCode(api.inbox, email) } });
  const code = await a.codeOf(a.api.call('me.onboarding', { body: { first_name: 'Vijftien', birth_date: '2011-06-01', ...LEGAL, daily_goal_min: 25 } }));
  expect(code).toBe('AGE_BELOW_MINIMUM');
  expect(api.sql('SELECT id FROM user WHERE email = ?', [email])).toHaveLength(0);
  expect(api.sql('SELECT id FROM auth_magic_link WHERE email = ?', [email])).toHaveLength(0);
  expect(api.sql('SELECT id FROM auth_session WHERE pending_email = ?', [email])).toHaveLength(0);
  expect(api.sql('SELECT count(*) AS n FROM event_pending')).toEqual([{ n: 0 }]);
});

test('Registratie met jan.jansen+2@ na jan.jansen@: geweigerd als bestaand adres (arch §11, §10.4)', async ({ api }) => {
  const c = new Chain(api);
  await c.student({ email: 'jan.jansen@student.demostad.test', firstName: 'Jan' });
  const before = api.sql<{ n: number }>('SELECT count(*) AS n FROM user')[0]!.n;
  // The alias logs into the existing account; no second account, no onboarding.
  const alias = 'Jan.Jansen+2@student.demostad.test';
  const a = api.newActor(homeIp());
  await a.api.call('auth.magicLink', { body: { email: alias, locale: 'nl' } });
  const r = await a.api.call('auth.code', { body: { email: alias, code: await lastCode(api.inbox, alias.toLowerCase()) } });
  expect(r.next).toBe('/');
  expect((await a.api.call('me.get')).user?.email).toBe('jan.jansen@student.demostad.test');
  expect(api.sql<{ n: number }>('SELECT count(*) AS n FROM user')[0]!.n).toBe(before);
  // A waitlist entry with the alias is the same entry (always 202, no second row).
  await a.api.call('waitlist.join', { body: { email: 'jan.jansen+3@student.demostad.test', locale: 'nl', source: 'landing', consent_version: 'privacy-0.3' } });
  await a.api.call('waitlist.join', { body: { email: 'jan.jansen+4@student.demostad.test', locale: 'nl', source: 'landing', consent_version: 'privacy-0.3' } });
  expect(api.sql<{ n: number }>("SELECT count(*) AS n FROM waitlist_entry WHERE email LIKE 'jan.jansen%'")[0]!.n).toBe(1);
});

test('Tweede account bevestigt hetzelfde instellingsadres (hoofdletters, plus-deel): INSTITUTION_EMAIL_IN_USE (arch §11, productplan §0.6)', async ({ api }) => {
  const c = new Chain(api);
  const a = await c.student();
  const b = await c.student();
  const domain = 'student.hogeschooldemostad.test';
  const start = (s: typeof a, email: string) => s.actor.api.call('institution.start', { body: { email } });
  await start(a, `p.peters@${domain}`);
  await a.actor.api.call('institution.confirm', { body: { code: await lastCode(api.inbox, `p.peters@${domain}`) } });
  const variant = `P.Peters+pilot@${domain.toUpperCase()}`;
  const started = await b.actor.codeOf(start(b, variant));
  if (started === 'OK') {
    const code = await lastCode(api.inbox, variant.toLowerCase()).catch(() => lastCode(api.inbox, variant));
    expect(await b.actor.codeOf(b.actor.api.call('institution.confirm', { body: { code } }))).toBe('INSTITUTION_EMAIL_IN_USE');
  } else {
    expect(started).toBe('INSTITUTION_EMAIL_IN_USE');
  }
  expect((await b.actor.api.call('me.get')).user?.institution_domain ?? null).toBeNull();
});
