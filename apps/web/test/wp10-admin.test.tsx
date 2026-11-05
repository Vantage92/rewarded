// WP-10 acceptance (architecture §12.1): on mock data an admin can release a flag, restore a session,
// publish an item with a declaration, invite a waiting-list batch and make a result final with four
// eyes, only after the prize sample. Test names carry the spec paragraph.
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup } from '@testing-library/react';
import { MOCK_ADMINS, mockId } from '../src/features/admin/mock.ts';
import { calledIds, inCard, renderAdmin } from './wp10/helpers.tsx';

afterEach(() => cleanup());

const change = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });

describe('WP-10 admin environment', () => {
  it('arch §10.8: admin routes need a TOTP code; a wrong code is refused, a right one opens the queue', async () => {
    const { mock } = renderAdmin('/beheer/wachtrij', { mfaVerified: false });
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('Beheer');
    const code = await screen.findByLabelText(/Code van zes cijfers/);
    expect(code.getAttribute('autocomplete')).toBe('one-time-code');
    expect((screen.getByRole('button', { name: 'Bevestigen' }) as HTMLButtonElement).disabled).toBe(true);
    change(code, '000000');
    // The button is re-rendered without its disabled reason, so query it again.
    fireEvent.click(screen.getByRole('button', { name: 'Bevestigen' }));
    expect(await screen.findByText(/Deze code klopt niet/)).toBeTruthy();
    change(code, '123456');
    fireEvent.click(screen.getByRole('button', { name: 'Bevestigen' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Fraudewachtrij' })).toBeTruthy();
    expect(mock.state.mfaVerified).toBe(true);
  });

  it('spec §4.11 Fraudewachtrij, §6.4: an admin releases a flagged session with a reason code', async () => {
    const { mock, api } = renderAdmin('/beheer/wachtrij');
    const heading = await screen.findByRole('heading', { level: 3, name: /^H1 · user_mila_0001/ });
    const card = inCard(heading);
    const submit = card.getByRole('button', { name: 'Besluit vastleggen' });
    // No decision without a reason code from the fixed list (spec §4.11).
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    expect(card.getByText('Kies eerst een redencode.')).toBeTruthy();
    card.getByRole('radio', { name: 'Vrijgeven' }).click();
    change(card.getByLabelText(/^Redencode/), 'no_evidence');
    change(card.getByLabelText('Interne toelichting'), 'Gewone browser na controle.');
    fireEvent.click(card.getByRole('button', { name: 'Besluit vastleggen' }));
    await waitFor(() => expect(screen.queryByRole('heading', { level: 3, name: /^H1 · / })).toBeNull());
    const flag = mock.state.flags.find((f) => f.id === mockId(50))!;
    expect(flag.status).toBe('released');
    expect(flag.reason_code).toBe('no_evidence');
    expect(flag.decided_by_ref).toBe(MOCK_ADMINS[0]);
    expect(calledIds(api)).toContain('admin.flags.decide');
    expect(mock.state.audit.some((a) => a.action === 'flag_release' && a.object_ref === flag.id)).toBe(true);
  });

  it('spec §6.4 herstel: an admin restores an aborted session as completed with evidence', async () => {
    const { mock } = renderAdmin('/beheer/wachtrij');
    const heading = await screen.findByRole('heading', { level: 3, name: /^USER_REPORT · user_daan_0002/ });
    const card = inCard(heading);
    fireEvent.click(card.getByRole('button', { name: 'Herstellen' }));
    const form = within(card.getByRole('form', { name: 'Sessie herstellen' }));
    expect((form.getByRole('button', { name: 'Sessie herstellen' }) as HTMLButtonElement).disabled).toBe(true);
    change(form.getByLabelText(/^Reden/), 'outage');
    change(form.getByLabelText(/^Bewijs/), 'Storing in de heartbeat-API van 13:20 tot 13:45.');
    fireEvent.click(form.getByRole('button', { name: 'Sessie herstellen' }));
    expect(await screen.findByText('Hersteld: Voltooid, 50 minuten.')).toBeTruthy();
    expect(mock.state.sessions.get(mockId(302))!.status).toBe('completed');
    expect(mock.state.audit.some((a) => a.action === 'session_restore' && a.reason === 'outage')).toBe(true);
  });

  it('spec §4.11, arch §10.8: a block needs a second admin (SAME_REVIEWER for the first)', async () => {
    const { mock } = renderAdmin('/beheer/wachtrij');
    const card = inCard(await screen.findByRole('heading', { level: 3, name: /^H6 · user_sem_00003/ }));
    card.getByRole('radio', { name: 'Blokkeren' }).click();
    await waitFor(() => expect(card.getByText(/tweede beheerder hem bevestigt/)).toBeTruthy());
    change(card.getByLabelText(/^Redencode/), 'fraud_confirmed');
    fireEvent.click(card.getByRole('button', { name: 'Besluit vastleggen' }));
    await waitFor(() => expect(mock.state.flags.find((f) => f.id === mockId(52))!.status).toBe('blocked'));
    change(screen.getByLabelText('Status'), 'blocked');
    const blocked = inCard(await screen.findByRole('heading', { level: 3, name: /^H6 · / }));
    change(blocked.getByLabelText(/^Toelichting bij de bevestiging/), 'Bevestigd na eigen controle.');
    fireEvent.click(blocked.getByRole('button', { name: 'Blokkade bevestigen' }));
    expect(await screen.findByText(/andere beheerder nemen dan degene die het eerste besluit nam/)).toBeTruthy();
    act(() => mock.setActor(MOCK_ADMINS[1]));
    fireEvent.click(screen.getByRole('button', { name: 'Blokkade bevestigen' }));
    await waitFor(() => expect(mock.state.flags.find((f) => f.id === mockId(52))!.block_confirmed_by_ref).toBe(MOCK_ADMINS[1]));
  });

  it('spec §4.3, §4.11 Catalogus: an item above €5 cannot be created; an item with a declaration is imported and published', async () => {
    const { mock } = renderAdmin('/beheer/catalogus');
    const form = within(await screen.findByRole('form', { name: 'Item aanmaken' }));
    await waitFor(() => expect(form.getByRole('option', { name: 'Boekhandel Demostad' })).toBeTruthy());
    change(form.getByLabelText('Partner'), mockId(401));
    change(form.getByLabelText(/^Budget-id/), mockId(501));
    change(form.getByLabelText(/^Titel \(Nederlands\)/), 'Workshop plannen');
    change(form.getByLabelText(/^Titel \(Engels\)/), 'Planning workshop');
    change(form.getByLabelText(/^Voorwaarden \(Nederlands\)/), 'Eén plek in de workshop.');
    change(form.getByLabelText(/^Voorwaarden \(Engels\)/), 'One seat in the workshop.');
    change(form.getByLabelText(/^Puntenprijs/), '500');
    change(form.getByLabelText(/^Partnerverklaring/), 'verklaring-boekhandel-2026-11');
    change(form.getByLabelText(/^Voorraad/), '2');
    change(form.getByLabelText(/^Kostprijs/), '6,00');
    expect(form.getByText(/Boven het plafond van € 5,00 per item/)).toBeTruthy();
    expect((form.getByRole('button', { name: 'Item aanmaken' }) as HTMLButtonElement).disabled).toBe(true);
    change(form.getByLabelText(/^Kostprijs/), '4,50');
    fireEvent.click(form.getByRole('button', { name: 'Item aanmaken' }));
    const card = inCard(await screen.findByRole('heading', { level: 3, name: 'Workshop plannen' }));
    expect(card.getByText('Verklaring: verklaring-boekhandel-2026-11')).toBeTruthy();
    // CSV import of voucher codes.
    change(card.getByLabelText('Of plak de codes'), 'code\nWS-001\nWS-002\nWS-002');
    fireEvent.click(card.getByRole('button', { name: 'Codes importeren' }));
    expect(await card.findByText('2 codes geïmporteerd, 1 dubbel.')).toBeTruthy();
    // Publishing asks for the explicit check that this is not money or free credit (spec §4.3).
    const publish = card.getByRole('button', { name: 'Item publiceren' }) as HTMLButtonElement;
    expect(publish.disabled).toBe(true);
    fireEvent.click(card.getByLabelText('Dit is geen geld en geen vrij besteedbaar tegoed.'));
    fireEvent.click(card.getByRole('button', { name: 'Item publiceren' }));
    expect(await card.findByText('Gepubliceerd. De puntenprijs ligt nu vast.')).toBeTruthy();
    const reward = mock.state.rewards[0]!;
    expect(reward.status).toBe('published');
    expect(reward.declaration_ref).toBe('verklaring-boekhandel-2026-11');
  });

  it('arch §3.1 toegangspoort, §8.2: an admin previews and invites a waiting-list batch', async () => {
    const { mock, api } = renderAdmin('/beheer/wachtlijst');
    expect(await screen.findByText(/Wachtenden per voorrangsklasse \(26 totaal\)/)).toBeTruthy();
    change(screen.getByLabelText(/^Aantal aanmeldingen/), '5');
    fireEvent.click(screen.getByRole('button', { name: 'Batch bekijken' }));
    expect(await screen.findByText('5 aanmeldingen in 3 uitnodigingen.')).toBeTruthy();
    // The preview is a dry run: nothing changed yet.
    expect(mock.state.waitlist[0]!.waiting).toBe(12);
    fireEvent.click(screen.getByRole('button', { name: '5 aanmeldingen uitnodigen' }));
    expect(await screen.findByText('5 aanmeldingen uitgenodigd in 3 uitnodigingen.')).toBeTruthy();
    // A group of three gets one invitation together, then two single sign-ups by priority.
    expect(mock.state.waitlist[0]!.waiting).toBe(9);
    expect(mock.state.waitlist[1]!.waiting).toBe(3);
    const bodies = api.mock!.calls.filter((c) => c.id === 'admin.waitlist.inviteBatch').map((c) => c.input.body);
    expect(bodies).toEqual([{ count: 5, dry_run: true }, { count: 5 }]);
    expect(await screen.findByText(/Wachtenden per voorrangsklasse \(21 totaal\)/)).toBeTruthy();
  });

  it('spec §4.6 Uitslag, §4.7: a result is final only with four eyes and after the prize sample', async () => {
    const challenge = { id: mockId(110), type: 'club_prize' as const, title: 'Blokchallenge januari', period: { start_day: '2027-01-04', end_day: '2027-01-17' }, prize: null };
    const { mock, router } = renderAdmin('/beheer/challenges', { handlers: { 'challenges.list': () => ({ items: [challenge] }) } });
    let card = inCard(await screen.findByRole('heading', { level: 3, name: 'Blokchallenge januari' }));
    fireEvent.click(card.getByRole('button', { name: 'Uitslag voorstellen' }));
    await waitFor(() => expect(mock.state.challenges.get(mockId(110))!.final_by_ref).toBe(MOCK_ADMINS[0]));
    card = inCard(await screen.findByRole('heading', { level: 3, name: 'Blokchallenge januari' }));
    expect(await card.findByText(`Uitslag voorgesteld door ${MOCK_ADMINS[0]}.`)).toBeTruthy();
    // Same admin: four eyes.
    fireEvent.click(card.getByRole('button', { name: 'Uitslag definitief maken' }));
    expect(await card.findByText(/Hiervoor is een tweede beheerder nodig/)).toBeTruthy();
    expect(mock.state.challenges.get(mockId(110))!.status).not.toBe('final');
    // Second admin, but the prize sample is not judged yet.
    act(() => mock.setActor(MOCK_ADMINS[1]));
    fireEvent.click(card.getByRole('button', { name: 'Uitslag definitief maken' }));
    expect(await card.findByText(/Eerst moet de steekproef klaar zijn/)).toBeTruthy();
    expect(card.getByRole('link', { name: 'Naar de steekproef' })).toBeTruthy();
    // Judge every item of the prize sample of 20 (fewer here: all counted members).
    await act(() => router.navigate('/beheer/steekproef'));
    expect(await screen.findByText('Prijssteekproef van 20 meegetelde leden', { exact: false })).toBeTruthy();
    for (const user of ['user_mila_0001', 'user_sem_00003', 'user_ruby_0005']) {
      const item = inCard(await screen.findByRole('heading', { level: 3, name: new RegExp(`^${user}`) }));
      fireEvent.click(item.getByLabelText('Identiteitsanker gecontroleerd'));
      fireEvent.click(item.getByLabelText(/Contact gehad/));
      change(item.getByLabelText(/^Criterium/), 'anchor_confirmed');
      fireEvent.click(item.getByRole('button', { name: 'Oordeel vastleggen' }));
      await waitFor(() => expect(mock.state.sample.items.find((i) => i.user_ref === user)!.judged_at).not.toBeNull());
    }
    expect(await screen.findByText('3 van 3 beoordeeld.')).toBeTruthy();
    await act(() => router.navigate('/beheer/challenges'));
    card = inCard(await screen.findByRole('heading', { level: 3, name: 'Blokchallenge januari' }));
    fireEvent.click(card.getByRole('button', { name: 'Uitslag definitief maken' }));
    expect(await screen.findByText('De uitslag is definitief.')).toBeTruthy();
    const final = mock.state.challenges.get(mockId(110))!;
    expect(final.status).toBe('final');
    expect(final.final_by_ref).toBe(MOCK_ADMINS[0]);
    expect(final.final_confirmed_by_ref).toBe(MOCK_ADMINS[1]);
  });

  it('spec §6.7: a suspect sample judgement opens a SAMPLE flag in the queue and books nothing', async () => {
    const { mock } = renderAdmin('/beheer/steekproef');
    const item = inCard(await screen.findByRole('heading', { level: 3, name: /^user_ruby_0005/ }));
    item.getByRole('radio', { name: 'Verdacht' }).click();
    await waitFor(() => expect(item.getByRole('option', { name: 'Geen anker en geen contact' })).toBeTruthy());
    change(item.getByLabelText(/^Criterium/), 'no_anchor_no_contact');
    fireEvent.click(item.getByRole('button', { name: 'Oordeel vastleggen' }));
    expect(await screen.findByText('Er is een markering geopend in de wachtrij.')).toBeTruthy();
    expect(mock.state.flags.some((f) => f.code === 'SAMPLE' && f.subject_ref === 'user_ruby_0005' && f.status === 'open')).toBe(true);
  });

  it('spec §4.11 Gebruikers: a lookup needs a reason and is audited; deletion needs a second admin', async () => {
    const { mock } = renderAdmin('/beheer/gebruikers');
    const form = within(await screen.findByRole('form', { name: 'Zoeken' }));
    change(form.getByLabelText(/^Naam of e-mailadres/), 'mila');
    expect((form.getByRole('button', { name: 'Zoeken' }) as HTMLButtonElement).disabled).toBe(true);
    change(form.getByLabelText(/^Reden van de inzage/), 'Supportticket 810');
    fireEvent.click(form.getByRole('button', { name: 'Zoeken' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Mila inzien' }));
    expect(await screen.findByText(/open markeringen/)).toBeTruthy();
    expect(mock.state.audit.filter((a) => a.reason === 'Supportticket 810').map((a) => a.action)).toEqual(expect.arrayContaining(['user_search', 'user_view']));
    fireEvent.click(screen.getByRole('button', { name: 'Account verwijderen' }));
    expect(await screen.findByText(/Een tweede beheerder moet de verwijdering bevestigen/)).toBeTruthy();
    act(() => mock.setActor(MOCK_ADMINS[2]));
    fireEvent.click(screen.getByRole('button', { name: 'Account verwijderen' }));
    expect(await screen.findByText('Het account is verwijderd.')).toBeTruthy();
  });

  it('spec §4.11 Experimenten, §3.9: assignment is locked, draws cannot be switched on, arm B stop waits for a second admin', async () => {
    renderAdmin('/beheer/experimenten');
    expect(await screen.findByText('Vergrendeld')).toBeTruthy();
    expect((await screen.findAllByText('squad_bieb_0001', { exact: false })).length).toBe(2);
    expect(screen.queryByRole('button', { name: 'Trekkingen aanzetten' })).toBeNull();
    expect(screen.getAllByText('Kan niet aan').length).toBeGreaterThan(0);
    change(screen.getByLabelText(/^Reden en besluit/), 'Stopregel geraakt volgens voorregistratie §8.3.');
    fireEvent.click(screen.getByRole('button', { name: 'Arm B stoppen' }));
    expect(await screen.findByText(/Na bevestiging door een tweede beheerder geldt het vanaf 2026-11-09/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Rustperiode-arm uitzetten' }));
    expect(await screen.findByText('Staat uit.')).toBeTruthy();
  });

  it('spec §4.3 Verplichting naast budget: the coverage alarm shows when coverage is below 100%', async () => {
    renderAdmin('/beheer/budget');
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText(/Dekkingsalarm: de dekkingsgraad is 0%/)).toBeTruthy();
    expect(screen.getByText('Uitstaande punten')).toBeTruthy();
  });

  it('spec §4.11 Verenigingen: no code without an agreement, cap 1.1 × members, no main prize without an external source', async () => {
    const { mock } = renderAdmin('/beheer/verenigingen');
    expect(await screen.findByText('DEMO100, plafond 264')).toBeTruthy();
    const form = within(screen.getByRole('form', { name: 'Vereniging aanmaken' }));
    change(form.getByLabelText(/^Naam/), 'Vereniging Zeta');
    change(form.getByLabelText(/^Stad/), 'Demostad');
    change(form.getByLabelText(/^Ledental/), '200');
    expect(form.getByText('Codeplafond wordt 220 (1,1 × ledental).')).toBeTruthy();
    change(form.getByLabelText(/^Soort bron/), 'self');
    expect(form.getByText(/niet om de hoofdprijs/)).toBeTruthy();
    change(form.getByLabelText(/^Documentverwijzing ledental/), 'eigen opgave bestuur');
    fireEvent.click(form.getByRole('button', { name: 'Vereniging aanmaken' }));
    expect(await screen.findByText('Vereniging Zeta aangemaakt. Code: geen code.')).toBeTruthy();
    const zeta = mock.state.clubs.find((c) => c.name === 'Vereniging Zeta')!;
    expect(zeta.join_code).toBeNull();
    expect(zeta.prize_eligible).toBe(false);
  });

  it('arch §9.1: the admin section is lazily loaded and has one h1', async () => {
    renderAdmin('/beheer/auditlog');
    expect(await screen.findByRole('heading', { level: 2, name: 'Auditlog' })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});
