// O9 Oefensessie (UX §3.2, spec §3.1 step 11): one minute through the same protocol, booking
// nothing. Leaving on purpose shows an F6-like screen labelled "Oefening"; staying plays the end signal.
import { useNavigate } from 'react-router';
import { Button } from '../../../design/index.ts';
import { useT } from '../../../i18n/index.tsx';
import { useSession } from '../../focus/session/context.tsx';
import { SessionSurface } from '../../focus/views/SessionSurface.tsx';
import '../../focus/focus.css';
import { STEP } from '../paths.ts';

export function PracticeStep() {
  const { t } = useT();
  const navigate = useNavigate();
  const [snap, store] = useSession();
  if (snap.phase !== 'idle' && snap.phase !== 'loading') {
    return (
      <div className="onb">
        <SessionSurface snap={snap} store={store} onAgain={() => undefined} onDone={() => void navigate(STEP.first)} />
      </div>
    );
  }
  return (
    <div className="onb">
      <h1>{t('onboarding:practice.title')}</h1>
      <p className="onb-lead">{t('onboarding:practice.body')}</p>
      {snap.startError ? <p role="alert">{t('focus:prepare.start_failed', { reason: '' })}</p> : null}
      <div className="onb-actions">
        <Button
          block
          disabled={snap.phase === 'loading'}
          onClick={() => {
            store.unlockSignal();
            void store.start(1, { practice: true, tone: true });
          }}
        >
          {t('onboarding:practice.start')}
        </Button>
        <Button block variant="secondary" onClick={() => void navigate(STEP.first)}>
          {t('onboarding:practice.skip')}
        </Button>
      </div>
    </div>
  );
}
