// WP-8 component tests (architecture §11 "Componenten"): the abort screen per code, the overreach
// brake, the code field at login, and the waiting-list hook.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { AbortReason } from '@rewarded/core/session';
import type { ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../src/app/providers.tsx';
import { createWebApi } from '../src/lib/api/index.ts';
import { ABORT_CODES } from '../src/features/focus/copy.ts';
import type { SessionResult } from '../src/features/focus/session/store.ts';
import { AbortedView } from '../src/features/focus/views/AbortedView.tsx';
import { GoalPicker } from '../src/features/onboarding/GoalPicker.tsx';
import { CheckInbox } from '../src/features/onboarding/steps/CheckInbox.tsx';
import { AgeStep } from '../src/features/onboarding/steps/AgeStep.tsx';
import { updateDraft } from '../src/features/onboarding/draft.ts';
import { tokenFromHash } from '../src/features/onboarding/steps/Confirm.tsx';
import { ageClass, ageOn, parseBirthDate } from '../src/features/onboarding/age.ts';
import { assignHookArm, drawArm, setHookReporter, sourceFrom, utmFrom } from '../src/features/waitlist/hook.ts';
import { WaitlistPage } from '../src/features/waitlist/WaitlistPage.tsx';
import { mockError, type MockHandlers } from '@rewarded/contracts/mock';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  localStorage.clear();
});

function wrap(ui: ReactNode, handlers: MockHandlers = {}, path = '/') {
  const api = createWebApi({ mode: 'mock', loadFeatureMocks: false, handlers });
  const router = createMemoryRouter(
    [
      { path: '*', element: ui },
      { path: '/onboarding/leeftijd', element: <h1>leeftijd</h1> },
    ],
    { initialEntries: [path] },
  );
  render(
    <AppProviders locale="nl" api={api}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { api, router };
}

const result = (code: AbortReason, extra: Partial<SessionResult> = {}): SessionResult => ({
  sessionId: '01S00000000000000000000001',
  status: 'aborted',
  abortReason: code,
  practice: false,
  plannedMin: 50,
  serverStartAt: '2026-12-02T13:14:00.000Z',
  stoppedAt: '2026-12-02T13:32:00.000Z',
  elapsedS: 18 * 60 + 20,
  confirmed: true,
  ...extra,
});

describe('abort screen F6 per code (spec §4.1 "Wat telt als afgebroken", UX §6.2)', () => {
  const expected: Record<AbortReason, RegExp> = {
    hidden: /stopte om 14:32 omdat Rewarded niet meer op je scherm stond\. Je hield 18 minuten vol\. Afgebroken sessies leveren geen punten op/,
    heartbeat_gap: /stopte om 14:32 omdat we langer dan toegestaan geen signaal van je toestel kregen\. Dat kan aan de wifi liggen\. Je hield 18 minuten vol/,
    user_stop: /Je stopte na 18 minuten\. Een sessie van 25 minuten telt ook mee voor je dagdoel\./,
    second_session: /Je startte een sessie op een ander toestel, dus deze is gestopt\. Er loopt er één tegelijk\./,
    late_end: /We kregen het einde van je sessie pas laat binnen, zonder signaal in de tussentijd\./,
  };

  it.each(ABORT_CODES)('spec §4.1: code %s has its fixed copy, the time in Europe/Amsterdam and the way back', (code) => {
    wrap(<AbortedView result={result(code)} abortsToday={1} onRestart={() => undefined} onShorter={() => undefined} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Je sessie stopte om 14:32.');
    expect(document.body.textContent).toMatch(expected[code]);
    expect(screen.getByRole('button', { name: 'Opnieuw beginnen' })).toBeTruthy();
    // 50 minutes aborted: "Kortere sessie" (spec §3.3 step 3).
    expect(screen.getByRole('button', { name: 'Kortere sessie' })).toBeTruthy();
    const report = screen.getByRole('button', { name: 'Klopt dit niet?' });
    // heartbeat_gap and late_end: a secondary button instead of a text link (UX F6).
    expect(report.className.includes('btn-secondary')).toBe(code === 'heartbeat_gap' || code === 'late_end');
    // No points on this screen and no blame.
    expect(document.body.textContent).not.toMatch(/gefaald|\+\d+ punten/);
  });

  it('UX §4.3: "Klopt dit niet?" opens the sheet with the copy and choices of the code', async () => {
    const report = vi.fn(() => ({ flag_id: '01F00000000000000000000001' }));
    wrap(<AbortedView result={result('heartbeat_gap')} abortsToday={1} onRestart={() => undefined} onShorter={() => undefined} />, { 'sessions.report': report });
    fireEvent.click(screen.getByRole('button', { name: 'Klopt dit niet?' }));
    expect(screen.getByRole('dialog').textContent).toMatch(/Een mens kijkt of we je sessie kunnen herstellen, meestal binnen 3 werkdagen\./);
    fireEvent.click(screen.getByRole('radio', { name: 'Batterij leeg' }));
    fireEvent.click(screen.getByRole('button', { name: 'Versturen' }));
    await waitFor(() => expect(report).toHaveBeenCalled());
    const call = (report.mock.calls[0] as unknown as [{ body: { text: string } }])[0];
    expect(call.body.text).toBe('[battery]');
  });

  it('UX §4.3: for hidden the sheet says it cannot be undone; ALREADY_REPORTED shows the status', async () => {
    wrap(<AbortedView result={result('hidden')} abortsToday={1} onRestart={() => undefined} onShorter={() => undefined} />, {
      'sessions.report': () => {
        throw mockError('ALREADY_REPORTED');
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Klopt dit niet?' }));
    expect(screen.getByRole('dialog').textContent).toMatch(/kunnen we niet terugdraaien/);
    fireEvent.click(screen.getByRole('button', { name: 'Versturen' }));
    expect(await screen.findByText('Je hebt deze sessie al gemeld. Je ziet de status bij Ik, Meldingen.')).toBeTruthy();
  });

  it('spec §3.3 step 4: the third abort today suggests a shorter session and Do Not Disturb', () => {
    wrap(<AbortedView result={result('hidden', { plannedMin: 25 })} abortsToday={3} onRestart={() => undefined} onShorter={() => undefined} />);
    expect(screen.getByText('Lukt het vandaag niet lang? Probeer 25 minuten met Niet storen aan.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Kortere sessie' })).toBeNull();
  });

  it('a local guess (not confirmed by the server) says so', () => {
    wrap(<AbortedView result={result('heartbeat_gap', { confirmed: false })} abortsToday={0} onRestart={() => undefined} onShorter={() => undefined} />);
    expect(screen.getByRole('status').textContent).toMatch(/wachten nog op de bevestiging/);
  });

  it('UX O9: the practice abort is labelled "Oefening" and has no report', () => {
    const go = vi.fn();
    wrap(<AbortedView result={result('hidden', { practice: true, plannedMin: 1 })} abortsToday={0} onRestart={() => undefined} onShorter={() => undefined} onContinue={go} />);
    expect(screen.getByText('Oefening')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Klopt dit niet?' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Verder' }));
    expect(go).toHaveBeenCalled();
  });
});

describe('overreach brake (spec §4.4 "Overmoedrem", UX O7)', () => {
  it('spec §4.4: default 25; 25 and 50 go straight through', () => {
    const submit = vi.fn();
    wrap(<GoalPicker onSubmit={submit} />);
    expect(screen.getByRole('radio', { name: '25 min' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: '50 min' }));
    expect(screen.queryByText('Begin liever klein')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Verder' }));
    expect(submit).toHaveBeenCalledWith(50, false);
  });

  it.each([90, 120] as const)('spec §4.4: %i in the first 7 days asks "Begin liever klein?"; keeping it confirms', (min) => {
    const submit = vi.fn();
    wrap(<GoalPicker onSubmit={submit} />);
    fireEvent.click(screen.getByRole('radio', { name: `${min} min` }));
    expect(screen.getByText('Begin liever klein')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Verder' }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Begin liever klein?' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: `Toch ${min} minuten` }));
    expect(submit).toHaveBeenCalledWith(min, true);
  });

  it('spec §4.4: choosing small from the sheet submits 25 without the confirmation', () => {
    const submit = vi.fn();
    wrap(<GoalPicker onSubmit={submit} />);
    fireEvent.click(screen.getByRole('radio', { name: '120 min' }));
    fireEvent.click(screen.getByRole('button', { name: 'Verder' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kies 25 minuten' }));
    expect(submit).toHaveBeenCalledWith(25, false);
  });

  it('spec §4.4: after 7 days there is no brake', () => {
    const submit = vi.fn();
    wrap(<GoalPicker daysSinceRegistration={7} onSubmit={submit} />);
    fireEvent.click(screen.getByRole('radio', { name: '90 min' }));
    fireEvent.click(screen.getByRole('button', { name: 'Verder' }));
    expect(submit).toHaveBeenCalledWith(90, false);
  });
});

describe('login with code (UX O4, architecture §10.1)', () => {
  it('UX O4: a wrong code says so without counting attempts; a good one goes to the age check', async () => {
    updateDraft({ email: 'mila@example.org' });
    const code = vi.fn((input: { body: unknown }) => {
      if ((input.body as { code: string }).code !== '123456') throw mockError('CODE_INVALID');
      return { next: '/onboarding' as const };
    });
    const { router } = wrap(<CheckInbox />, { 'auth.code': code }, '/auth/check-inbox');
    const field = screen.getByLabelText('Code van 6 cijfers');
    expect(field.getAttribute('inputmode')).toBe('numeric');
    expect(field.getAttribute('autocomplete')).toBe('one-time-code');
    fireEvent.change(field, { target: { value: '111111' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ga verder' }));
    expect(await screen.findByText('Deze code klopt niet. Controleer de mail of vraag een nieuwe.')).toBeTruthy();
    fireEvent.change(field, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ga verder' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/onboarding/leeftijd'));
  });

  it('resend is only possible after 30 s, with the reason next to the button', () => {
    updateDraft({ email: 'mila@example.org' });
    wrap(<CheckInbox />, {}, '/auth/check-inbox');
    const resend = screen.getByRole('button', { name: 'Opnieuw sturen' }) as HTMLButtonElement;
    expect(resend.disabled).toBe(true);
    expect(document.body.textContent).toMatch(/Opnieuw sturen kan over 30 seconden/);
  });

  it('architecture §10.1: the token is read from the URL fragment only', () => {
    expect(tokenFromHash('#t=abcdefghijklmnop1234')).toBe('abcdefghijklmnop1234');
    expect(tokenFromHash('#t=short')).toBeNull();
    expect(tokenFromHash('')).toBeNull();
  });
});

describe('age check (spec §3.1 step 5, UX O5)', () => {
  it('computes completed years and the class', () => {
    const today = { year: 2026, month: 12, day: 2 };
    expect(ageOn(parseBirthDate('2', '12', '2010')!, today)).toBe(16);
    expect(ageOn(parseBirthDate('3', '12', '2010')!, today)).toBe(15);
    expect(ageClass(15)).toBe('under_16');
    expect(ageClass(17)).toBe('16_17');
    expect(ageClass(18)).toBe('18_plus');
    expect(parseBirthDate('31', '2', '2008')).toBeNull();
  });

  it('UX O5: below 16 asks for confirmation first; after it, O5b and nothing kept', async () => {
    updateDraft({ firstName: 'Sem' });
    const onboarding = vi.fn(() => {
      throw mockError('AGE_BELOW_MINIMUM');
    });
    wrap(<AgeStep />, { 'me.onboarding': onboarding }, '/age');
    const year = new Date().getFullYear() - 14;
    fireEvent.change(screen.getByLabelText('Dag'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Maand'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Jaar'), { target: { value: String(year) } });
    fireEvent.click(screen.getByRole('button', { name: 'Verder' }));
    expect(screen.getByRole('dialog').textContent).toMatch(/Volgens deze datum ben je 1[45]\. Klopt dat\?/);
    fireEvent.click(screen.getByRole('button', { name: 'Ja, dat klopt' }));
    expect(await screen.findByText('We hebben niets van je bewaard.')).toBeTruthy();
    expect(onboarding).toHaveBeenCalled();
    expect(sessionStorage.getItem('rw_onboarding')).toBeNull();
  });
});

describe('waiting list hook test (product plan §4 "Wachtlijsttest")', () => {
  it('50/50 per visitor, fixed for repeat visits, overridable with ?hook=', () => {
    expect(drawArm(() => 0.2)).toBe('F');
    expect(drawArm(() => 0.7)).toBe('G');
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    const first = assignHookArm('', storage, () => 0.9);
    expect(first).toBe('G');
    expect(assignHookArm('', storage, () => 0.1)).toBe('G');
    expect(assignHookArm('?hook=f', storage)).toBe('F');
    expect(utmFrom('?utm_source=ig&utm_campaign=dec')).toEqual({ source: 'ig', campaign: 'dec' });
    expect(sourceFrom('?bron=club_qr')).toBe('club_qr');
    expect(sourceFrom('?bron=evil')).toBe('landing');
  });

  it('arm G shows the honest money hook with "Geen geld" directly visible; arm F the focus hook', () => {
    wrap(<WaitlistPage />, {}, '/wachtlijst?hook=G');
    expect(document.body.textContent).toMatch(/Word beloond voor je focusuren\./);
    expect(document.body.textContent).toMatch(/Geen geld\. Punten voor partnerbeloningen\./);
    cleanup();
    wrap(<WaitlistPage />, {}, '/wachtlijst?hook=F');
    expect(document.body.textContent).toMatch(/Telefoon weg\. Squad aan\./);
    expect(document.body.textContent).not.toMatch(/Word beloond voor je focusuren/);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Wachtlijst');
  });

  it('signing up sends source, consent version and an Idempotency-Key, and reports the arm', async () => {
    const join = vi.fn(() => ({}));
    const exposure = vi.fn();
    const signup = vi.fn();
    setHookReporter({ exposure, signup });
    const { api } = wrap(<WaitlistPage />, { 'waitlist.join': join }, '/wachtlijst?hook=F&bron=card');
    fireEvent.change(screen.getByLabelText('E-mailadres'), { target: { value: 'sanne@example.org' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start een squad' }));
    expect(await screen.findByText('Zet het vinkje aan om je in te schrijven.')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Start een squad' }));
    expect(await screen.findByText('Je staat op de wachtlijst.')).toBeTruthy();
    const call = api.mock!.calls.find((c) => c.id === 'waitlist.join')!;
    expect(call.input.body).toMatchObject({ email: 'sanne@example.org', source: 'card', consent_version: 'privacy-0.3', locale: 'nl' });
    expect(call.input.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
    expect(exposure).toHaveBeenCalledWith('F', {});
    expect(signup).toHaveBeenCalledWith('F', true, {});
  });
});
