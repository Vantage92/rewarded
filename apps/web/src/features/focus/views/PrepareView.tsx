// F2 (UX §3.3, §4.2 step 2): the one-time checklist, the chosen length, the end signal with its
// switch, and [Begin]. The tap on [Begin] unlocks the audio for the end tone.
import type { PlannedMin } from '@rewarded/core/session';
import { useState } from 'react';
import { Banner, Button, Card, Switch } from '../../../design/index.ts';
import { isErrorCode, messageKey } from '@rewarded/contracts/errors';
import { useT } from '../../../i18n/index.tsx';
import { useApiQuery } from '../../../lib/api/index.ts';
import type { SessionStore } from '../session/store.ts';

export interface PrepareViewProps {
  store: SessionStore;
  minutes: PlannedMin;
  practice?: boolean;
  startError: string | null;
  /** Show the checklist (first session only). */
  firstTime: boolean;
}

export function PrepareView({ store, minutes, practice = false, startError, firstTime }: PrepareViewProps) {
  const { t } = useT();
  const [tone, setTone] = useState(true);
  const [busy, setBusy] = useState(false);
  // A session running elsewhere (this screen has none yet): starting here stops it (spec §4.1 second_session).
  const active = useApiQuery('sessions.active', undefined, { retry: false, staleTime: 0 });
  const begin = () => {
    store.unlockSignal();
    setBusy(true);
    void store.start(minutes, { practice, tone }).finally(() => setBusy(false));
  };
  const reason = startError === 'NETWORK' ? t('focus:prepare.start_failed_network') : startError && isErrorCode(startError) ? t(messageKey(startError)) : t('errors.internal');
  return (
    <div className="focus-stack">
      <p className="focus-lead">{t('focus:prepare.duration', { count: minutes })}</p>
      {firstTime ? (
        <Card title={t('focus:prepare.checklist_title')} level={2}>
          <ul className="focus-checklist">
            <li>{t('focus:prepare.check_phone')}</li>
            <li>{t('focus:prepare.check_laptop')}</li>
          </ul>
        </Card>
      ) : null}
      {!store.wakeLockSupported() ? <Banner tone="info">{t('focus:prepare.no_wakelock')}</Banner> : null}
      <p>{t('focus:prepare.signal_info')}</p>
      <Switch label={t('focus:prepare.tone')} checked={tone} onChange={setTone} />
      {active.data?.session && !practice ? <Banner tone="info">{t('focus:prepare.other_device')}</Banner> : null}
      {startError ? <p role="alert">{t('focus:prepare.start_failed', { reason })}</p> : null}
      <Button block onClick={begin} disabled={busy}>
        {t('focus:prepare.begin')}
      </Button>
    </div>
  );
}
