import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../src/app/App.tsx';
import { featureNames, routes } from '../src/app/routes.tsx';

afterEach(cleanup);

const renderAt = (path: string, locale: 'nl' | 'en' = 'nl') =>
  render(<App router={createMemoryRouter(routes, { initialEntries: [path] })} locale={locale} />);

describe('app shell', () => {
  it('renders header, home placeholder and the five tabs of UX §2.1', () => {
    renderAt('/');
    expect(screen.getByRole('banner').textContent).toBe('Rewarded');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Vandaag');
    const nav = screen.getByRole('navigation', { name: 'Hoofdmenu' });
    expect([...nav.querySelectorAll('a')].map((a) => a.textContent)).toEqual(['Focus', 'Squad', 'Vereniging', 'Beloningen', 'Ik']);
  });

  it('switches language', () => {
    renderAt('/', 'en');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Today');
  });

  it('loads every feature from architecture §2', () => {
    // arrayContaining: WP-9 adds features/survey later without editing this test.
    expect(featureNames).toEqual(expect.arrayContaining([
      'admin', 'belofte', 'board', 'cards', 'challenges', 'club', 'draws', 'duels',
      'focus', 'onboarding', 'points', 'profile', 'squads', 'waitlist',
    ]));
  });

  it.each([
    ['/wachtlijst', 'Wachtlijst'],
    ['/onboarding/start', 'Welkom'],
    ['/focus', 'Focus'],
    ['/punten/catalogus', 'Punten'],
    ['/squad', 'Squad'],
    ['/duel', 'Duel'],
    ['/vereniging/ranglijst', 'Vereniging'],
    ['/challenges/abc', 'Challenge'],
    ['/belofte', 'De Belofte'],
    ['/kaart/123', 'Kaart'],
    ['/kans', 'Kans'],
    ['/profiel/privacy', 'Profiel'],
  ])('shows the placeholder for %s', (path, title) => {
    renderAt(path);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(title);
  });

  it.each([
    ['/bestuur/club-1/werving', 'Bestuur'],
    ['/beheer/wachtrij', 'Beheer'],
  ])('lazily loads %s', async (path, title) => {
    renderAt(path);
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe(title);
  });

  it('shows a not-found page for unknown routes', () => {
    renderAt('/bestaat-niet');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Pagina niet gevonden');
  });
});
