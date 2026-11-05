import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useMatches } from 'react-router';
import { Banner } from '../design/components/Banner.tsx';
import { ToastProvider } from '../design/components/Toast.tsx';
import { useT } from '../i18n/index.tsx';
import { Icon } from './icons.tsx';
import { currentTab, visibleTabs } from './nav.ts';
import { useOnline, useShell, type Chrome, type ShellHandle } from './shell.tsx';

/** Chrome of the deepest route that sets one, else full. */
function useRouteChrome(): Chrome {
  const matches = useMatches();
  for (let i = matches.length - 1; i >= 0; i--) {
    const chrome = (matches[i]!.handle as ShellHandle | undefined)?.chrome;
    if (chrome) return chrome;
  }
  return 'full';
}

/** Five tabs as a bottom bar on the phone and a sidebar from 960 px (UX §2.2). */
function TabNav() {
  const { t } = useT();
  const { pathname } = useLocation();
  const { noPointsMode, dots } = useShell();
  const current = currentTab(pathname);
  return (
    <nav className="shell-nav" aria-label={t('nav.label')}>
      <ul>
        {visibleTabs({ noPointsMode }).map((tab) => {
          const active = tab.id === current;
          return (
            <li key={tab.id}>
              <Link to={tab.to} className="tab" aria-current={active ? 'page' : undefined}>
                <Icon name={tab.id} filled={active} />
                <span>{t(tab.labelKey)}</span>
                {dots.has(tab.id) ? (
                  <span className="tab-dot">
                    <span className="visually-hidden">{t('nav.dot')}</span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** App shell: skip link, header, offline strip, content and navigation (UX §2.2, §3.1). */
export function Layout() {
  const { t } = useT();
  const routeChrome = useRouteChrome();
  const { requested } = useShell();
  const chrome = requested ?? routeChrome;
  const online = useOnline();
  const { pathname } = useLocation();
  const main = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // After a navigation, move focus to the content so screen readers start at the new screen.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    main.current?.focus({ preventScroll: false });
  }, [pathname]);

  return (
    <ToastProvider suppressed={chrome === 'immersive'}>
      <div className="shell" data-chrome={chrome}>
        <a className="skip-link" href="#main">
          {t('app.skip_to_content')}
        </a>
        {chrome !== 'immersive' ? <header className="shell-header">{t('app.name')}</header> : null}
        <div className="shell-body">
          {/* UX §3.1: the strip promises nothing about sessions; the session screen shows its own line. */}
          {!online && chrome !== 'immersive' ? <Banner tone="offline">{t('offline.banner')}</Banner> : null}
          <main id="main" ref={main} className="shell-main" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
        {chrome === 'full' ? <TabNav /> : null}
      </div>
    </ToastProvider>
  );
}

export function NotFound() {
  const { t } = useT();
  return (
    <section>
      <h1>{t('not_found.title')}</h1>
      <Link to="/">{t('not_found.back')}</Link>
    </section>
  );
}
