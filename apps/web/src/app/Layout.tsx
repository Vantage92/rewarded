import { Link, NavLink, Outlet } from 'react-router';
import { useT } from '../i18n/index.tsx';

const NAV = [
  { to: '/', key: 'nav.home' },
  { to: '/focus', key: 'nav.focus' },
  { to: '/squad', key: 'nav.squad' },
  { to: '/punten', key: 'nav.points' },
  { to: '/profiel', key: 'nav.profile' },
] as const;

/** Mobile-first app shell: header, content, bottom navigation. WP-7 owns the final layout. */
export function Layout() {
  const { t } = useT();
  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        {t('app.skip_to_content')}
      </a>
      <header className="shell-header">{t('app.name')}</header>
      <main id="main" className="shell-main">
        <Outlet />
      </main>
      <nav className="shell-nav" aria-label={t('nav.label')}>
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}>
            {t(item.key)}
          </NavLink>
        ))}
      </nav>
    </div>
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
