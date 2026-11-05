// Gated layout of the admin environment: the server decides access. A probe call answers
// AUTH_REQUIRED (log in first), FORBIDDEN (no admin), MFA_REQUIRED (TOTP, architecture §10.8) or data.
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import { ButtonLink } from '../../design/index.ts';
import { useApiContext, useApiQuery } from '../../lib/api/index.ts';
import { MfaGate } from './Mfa.tsx';
import { ADMIN_SECTIONS } from './routes.tsx';
import { ErrorNote, isApiError, Loading, useTa } from './ui.tsx';
import './admin.css';

export function AdminLayout() {
  const { ta } = useTa();
  const queryClient = useQueryClient();
  // Probe: cheap list without personal data and without an audit line (architecture §10.8).
  const probe = useApiQuery('admin.clubs.list', undefined, { retry: false });

  let body;
  if (probe.isPending) body = <Loading />;
  else if (probe.isError && isApiError(probe.error, 'MFA_REQUIRED')) body = <MfaGate onVerified={() => void queryClient.invalidateQueries()} />;
  else if (probe.isError && isApiError(probe.error, 'AUTH_REQUIRED'))
    body = (
      <div className="adm-gate">
        <p>{ta('gate.login')}</p>
        <ButtonLink to="/login">{ta('gate.login_action')}</ButtonLink>
      </div>
    );
  else if (probe.isError && isApiError(probe.error, 'FORBIDDEN')) body = <p className="adm-gate">{ta('gate.forbidden')}</p>;
  else if (probe.isError) body = <ErrorNote error={probe.error} onRetry={() => void probe.refetch()} />;
  else
    body = (
      <div className="adm-frame">
        <nav className="adm-nav" aria-label={ta('nav.label')}>
          <ul>
            <li>
              <NavLink to="/beheer" end>
                {ta('nav.overview')}
              </NavLink>
            </li>
            {ADMIN_SECTIONS.map(([path, , key]) => (
              <li key={path}>
                <NavLink to={`/beheer/${path}`}>{ta(`nav.${key}`)}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="adm-content">
          <Outlet />
        </div>
      </div>
    );

  return (
    <div className="adm rw-wide">
      <header className="adm-head">
        <h1>{ta('title')}</h1>
        <p className="adm-intro">{ta('subtitle')}</p>
        <MockActorSwitch />
      </header>
      {body}
    </div>
  );
}

/** Mock mode only: act as another admin, so four eyes can be shown without a second login. */
function MockActorSwitch() {
  const { ta } = useTa();
  const { mode } = useApiContext();
  const queryClient = useQueryClient();
  const [mock, setMock] = useState<{ admins: readonly string[]; actor: string; set(a: string): void } | null>(null);
  useEffect(() => {
    if (mode !== 'mock') return;
    let live = true;
    void import('./mock.ts').then(({ adminMock, MOCK_ADMINS }) => {
      if (live) setMock({ admins: MOCK_ADMINS, actor: adminMock.state.actor, set: (a) => adminMock.setActor(a) });
    });
    return () => {
      live = false;
    };
  }, [mode]);
  if (!mock) return null;
  return (
    <p className="adm-demo">
      <label>
        {ta('demo.actor')}{' '}
        <select
          className="input"
          value={mock.actor}
          onChange={(e) => {
            mock.set(e.target.value);
            setMock({ ...mock, actor: e.target.value });
            void queryClient.invalidateQueries();
          }}
        >
          {mock.admins.map((a, i) => (
            <option key={a} value={a}>
              {ta('demo.admin', { letter: String.fromCharCode(65 + i), ref: a })}
            </option>
          ))}
        </select>
      </label>
    </p>
  );
}
