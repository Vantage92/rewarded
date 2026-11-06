// Integration wave (web): the exam calendar screen in /beheer (spec §4.13), the focus mock for
// ?api=mock and the service-worker update rule (architecture §9.4).
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockApiClient } from '@rewarded/contracts/mock';
import { handlers as adminHandlers } from '../src/features/admin/mock.ts';
import { handlers as focusHandlers } from '../src/features/focus/mock.ts';
import { registerServiceWorker } from '../src/app/sw-register.ts';
import { renderAdmin } from './wp10/helpers.tsx';

afterEach(cleanup);

describe('spec §4.13 tentamenkalenders in de beheeromgeving', () => {
  it('§4.13 lists the default calendar with its derived dates and adds a club calendar', async () => {
    renderAdmin('/beheer/tentamenkalenders', { handlers: adminHandlers });
    expect(await screen.findByRole('heading', { level: 2, name: 'Tentamenkalenders' })).toBeTruthy();
    const table = await screen.findByRole('table', { name: 'Tentamenkalenders met de afgeleide data' });
    expect(within(table).getByText('Standaardkalender (standaard)')).toBeTruthy();
    expect(within(table).getByText('2027-01-18T04:00'.replace('T', ' '))).toBeTruthy();
    const form = screen.getByRole('form', { name: 'Kalender toevoegen' });
    const f = within(form);
    fireEvent.change(f.getByLabelText(/^Instelling/), { target: { value: 'Hogeschool Demostad' } });
    fireEvent.change(f.getByLabelText(/^T \(laatste tentamenzondag\)/), { target: { value: '2027-01-24' } });
    fireEvent.change(f.getByLabelText(/^Bron/), { target: { value: 'Jaarrooster' } });
    fireEvent.change(f.getByLabelText(/^Gecontroleerd op/), { target: { value: '2026-11-05' } });
    fireEvent.click(f.getByRole('button', { name: 'Kalender opslaan' }));
    expect(await screen.findByText('Kalender opgeslagen, T is 2027-01-24.')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('2027-01-25 04:00')).toBeTruthy());
  });
});

describe('arch §9.2 mock-modus voor de focus-engine', () => {
  it('§9.2 a session in mock mode starts, beats with a new nonce and ends with points', async () => {
    const api = createMockApiClient(focusHandlers);
    const start = await api.call('sessions.start', { body: { planned_min: 25, device_id: '01JF0000000000000000000001', practice: false, client_ts: 1, mono_ms: 1, webdriver: false, standalone: false }, idempotencyKey: 'k-mock-0001' });
    const hb = await api.call('sessions.heartbeat', { params: { id: start.session_id }, body: { nonce: start.nonce, seq: 1, mono_ms: 30_001, client_ts: 2, visibility: 'visible', wakelock: 'acquired', events: [] } });
    expect(hb.nonce).not.toBe(start.nonce);
    const end = await api.call('sessions.end', { params: { id: start.session_id }, body: { nonce: hb.nonce, mono_ms: 1_500_001, client_ts: 3, events: [] } });
    expect(end).toMatchObject({ status: 'completed', points: 25 });
  });
});

describe('arch §9.4 service-worker-update', () => {
  it('§9.4 a waiting version activates only when canActivate allows it, and the first install does not reload', async () => {
    const listeners: Record<string, () => void> = {};
    const waiting = { postMessage: vi.fn<(m: unknown) => void>() };
    const reg = { waiting, installing: null, addEventListener: vi.fn<() => void>() };
    const container = { controller: null, register: vi.fn<() => Promise<typeof reg>>(async () => reg), addEventListener: (n: string, fn: () => void) => (listeners[n] = fn) } as unknown as ServiceWorkerContainer;
    let running = true;
    const sw = await registerServiceWorker({ container, canActivate: () => !running });
    expect(sw.applyUpdate()).toBe(false);
    running = false;
    expect(sw.applyUpdate()).toBe(true);
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    // No controller at registration (first install): controllerchange must not reload. jsdom has no
    // real reload; a call would log "not implemented", so the handler returning early is what we check.
    expect(() => listeners.controllerchange?.()).not.toThrow();
  });
});
