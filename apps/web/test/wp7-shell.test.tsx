// Shell behaviour of UX §2.1–2.2 and §3.1: tabs, active state, session chrome, no-points mode,
// offline strip, theme and providers; axe on the shell (architecture §9.6, §12.1 WP-7).
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { createMemoryRouter, type RouteObject } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../src/app/App.tsx';
import { currentTab, visibleTabs } from '../src/app/nav.ts';
import { routes, shellPlaceholders } from '../src/app/routes.tsx';
import { useImmersive, useShell } from '../src/app/shell.tsx';
import { Layout } from '../src/app/Layout.tsx';
import { ThemeSwitch, LanguageSwitch } from '../src/design/index.ts';
import { createWebApi } from '../src/lib/api/web.ts';

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
  try {
    localStorage.clear();
  } catch {
    // ignore
  }
});

const mockApi = () => createWebApi({ mode: 'mock', loadFeatureMocks: false });
const renderAt = (path: string, extra: RouteObject[] = []) => {
  const tree: RouteObject[] = extra.length ? [{ path: '/', element: <Layout />, children: extra }] : routes;
  return render(<App router={createMemoryRouter(tree, { initialEntries: [path] })} locale="nl" api={mockApi()} />);
};

const tabs = (name = 'Hoofdmenu') => [...screen.getByRole('navigation', { name }).querySelectorAll('a')];

describe('navigation (UX §2.1, §2.2)', () => {
  it('UX §2.2: one nav with five links, the active one has aria-current="page" and a filled icon', () => {
    renderAt('/squad');
    const links = tabs();
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/', '/squad', '/vereniging', '/punten', '/profiel']);
    const current = links.filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current.map((a) => a.textContent)).toEqual(['Squad']);
    for (const a of links) expect(a.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(current[0]!.querySelector('[fill="currentColor"]')).toBeTruthy();
  });

  it('UX §2.1: Focus is current on home and on /focus; deeper paths map to their tab', () => {
    expect(currentTab('/')).toBe('focus');
    expect(currentTab('/focus/sessie')).toBe('focus');
    expect(currentTab('/punten/catalogus')).toBe('rewards');
    expect(currentTab('/vereniging/ranglijst')).toBe('club');
    expect(currentTab('/duel')).toBe('squad');
    expect(currentTab('/bestuur/x')).toBeUndefined();
    expect(currentTab('/squadx')).toBeUndefined();
  });

  it('UX §2.1: the no-points mode hides Rewards and keeps the order', () => {
    expect(visibleTabs({ noPointsMode: true }).map((t) => t.id)).toEqual(['focus', 'squad', 'club', 'me']);
    function NoPoints() {
      const { setNoPointsMode } = useShell();
      return <button onClick={() => setNoPointsMode(true)}>np</button>;
    }
    renderAt('/x', [{ path: 'x', element: <NoPoints /> }]);
    fireEvent.click(screen.getByRole('button', { name: 'np' }));
    expect(tabs().map((a) => a.textContent)).toEqual(['Focus', 'Squad', 'Vereniging', 'Ik']);
  });

  it('UX §2.2 Badges: a dot on Squad has a text alternative', () => {
    function Dot() {
      const { setDot } = useShell();
      return <button onClick={() => setDot('squad', true)}>dot</button>;
    }
    renderAt('/x', [{ path: 'x', element: <Dot /> }]);
    fireEvent.click(screen.getByRole('button', { name: 'dot' }));
    expect(tabs()[1]!.textContent).toBe('SquadEr staat iets voor je klaar');
  });

  it('UX §2.2 Sessiemodus: a running session hides header and navigation', () => {
    function Session() {
      useImmersive(true);
      return <h1>Sessie</h1>;
    }
    renderAt('/sessie', [{ path: 'sessie', element: <Session /> }]);
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('banner')).toBeNull();
  });

  it('bare routes (public pages from architecture §9.1) have no student navigation', () => {
    renderAt('/login');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Inloggen');
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it.each(shellPlaceholders.map(([path, feature]) => [path, feature]))('architecture §9.1: /%s has a placeholder until its feature exists', (path) => {
    renderAt(`/${path.replace(':token', 'abc').replace(':code', 'X1').replace(':moment', 'instroom').replace('*', 'code')}`);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.queryByText('Pagina niet gevonden')).toBeNull();
  });

  it.each([
    ['/login', { path: 'login' }, { path: 'login' }],
    ['/', { index: true }, { index: true }],
  ] as const)('a feature route wins over a shell placeholder listed after it (%s)', (path, feature, placeholder) => {
    const tree: RouteObject[] = [{ path: '/', element: <Layout />, children: [{ ...feature, element: <h1>Echt</h1> }, { ...placeholder, element: <h1>Placeholder</h1> }] }];
    render(<App router={createMemoryRouter(tree, { initialEntries: [path] })} locale="nl" api={mockApi()} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Echt');
  });
});

describe('offline strip (UX §3.1)', () => {
  it('shows the offline copy when the browser goes offline', () => {
    renderAt('/');
    expect(screen.queryByText('Geen verbinding. Wat de server nodig heeft, staat even uit.')).toBeNull();
    const original = Object.getOwnPropertyDescriptor(Navigator.prototype, 'onLine');
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByText('Geen verbinding. Wat de server nodig heeft, staat even uit.')).toBeTruthy();
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true });
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.queryByText('Geen verbinding. Wat de server nodig heeft, staat even uit.')).toBeNull();
    if (original) Object.defineProperty(navigator, 'onLine', original);
  });
});

describe('theme and language (UX §5.2)', () => {
  it('UX §5.2: system by default; a manual choice sets data-theme and is remembered', () => {
    renderAt('/x', [{ path: 'x', element: <><h1>x</h1><ThemeSwitch /><LanguageSwitch /></> }]);
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(screen.getByRole('radio', { name: 'Systeem' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: 'Donker' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('rw_theme')).toBe('dark');
    fireEvent.click(screen.getByRole('radio', { name: 'Systeem' }));
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('switching the language updates the shell and <html lang>', () => {
    renderAt('/x', [{ path: 'x', element: <><h1>x</h1><LanguageSwitch /></> }]);
    fireEvent.click(screen.getByRole('radio', { name: 'English' }));
    expect(tabs('Main menu').map((a) => a.textContent)).toEqual(['Focus', 'Squad', 'Club', 'Rewards', 'Me']);
    expect(document.documentElement.lang).toBe('en');
  });
});

describe('accessibility of the shell (axe, UX §5.8)', () => {
  // jsdom cannot compute colours: colour contrast is checked on the tokens (wp7-contrast) and in
  // Chromium by test/pwa/offline-shell.spec.ts.
  const run = async () => {
    const result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } }, resultTypes: ['violations'] });
    return result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  };

  it.each(['/', '/squad', '/vereniging', '/punten', '/profiel', '/login', '/bestaat-niet'])('axe finds no serious or critical violations on %s', async (path) => {
    renderAt(path);
    expect(await run()).toEqual([]);
  });

  it('has one h1, a skip link to main and a named nav (UX §5.8)', () => {
    renderAt('/');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Naar de inhoud' }).getAttribute('href')).toBe('#main');
    expect(document.getElementById('main')?.tagName).toBe('MAIN');
  });
});
