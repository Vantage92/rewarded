// /focus (architecture §9.1): checklist and length (F2), running session, end and abort screens.
import type { PlannedMin } from '@rewarded/core/session';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ButtonLink } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';
import { isSessionLength } from './copy.ts';
import { useSession } from './session/context.tsx';
import type { SessionStore } from './session/store.ts';
import { PrepareView } from './views/PrepareView.tsx';
import { SessionSurface } from './views/SessionSurface.tsx';
import './focus.css';

const CHECKLIST_KEY = 'checklist_seen';

export function FocusPage() {
  const { t } = useT();
  const [snap, store] = useSession();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const raw = Number(params.get('duur') ?? '25');
  const minutes: PlannedMin = isSessionLength(raw) ? raw : 25;
  const firstTime = useChecklist(store, snap.phase);

  if (snap.phase === 'idle' || snap.phase === 'loading') {
    return (
      <div className="focus-page">
        <h1 className="focus-title">{t('nav.focus')}</h1>
        <p className="focus-muted">{t('focus:prepare.title')}</p>
        {snap.phase === 'loading' ? (
          <p role="status">{t('focus:loading')}</p>
        ) : (
          <PrepareView store={store} minutes={minutes} startError={snap.startError} firstTime={firstTime} />
        )}
        <div className="focus-row">
          <ButtonLink to="/" variant="link">
            {t('focus:prepare.back')}
          </ButtonLink>
          <ButtonLink to="/hoe-we-tellen" variant="link">
            {t('focus:home.how')}
          </ButtonLink>
        </div>
      </div>
    );
  }
  return (
    <div className="focus-page">
      {snap.phase === 'other_tab' ? <h1 className="focus-title">{t('nav.focus')}</h1> : null}
      <SessionSurface
        snap={snap}
        store={store}
        onAgain={(m) => setParams(m ? { duur: String(m) } : {})}
        onDone={() => void navigate('/')}
      />
    </div>
  );
}

/** The checklist shows once, before the first session (UX F2 "eenmalige checklist"). */
function useChecklist(store: SessionStore, phase: string): boolean {
  const [first, setFirst] = useState(true);
  useEffect(() => {
    let live = true;
    void store.cacheGet<boolean>(CHECKLIST_KEY).then((seen) => {
      if (live && seen) setFirst(false);
    });
    return () => {
      live = false;
    };
  }, [store]);
  useEffect(() => {
    if (phase === 'running') store.cacheSet(CHECKLIST_KEY, true);
  }, [phase, store]);
  return first;
}
