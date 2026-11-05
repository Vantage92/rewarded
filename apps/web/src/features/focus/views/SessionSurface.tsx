// The screens of a session after [Begin]: F3/F4 running, F3e end signal, F5 completed, F6 aborted.
// Shared by /focus and the practice session in the onboarding (O9). Renders null when idle.
import { CURRENT_PARAMS } from '@rewarded/core/params';
import { useState } from 'react';
import { focusDayOf } from '@rewarded/core/time';
import { useT } from '../../../i18n/index.tsx';
import { useApiQuery } from '../../../lib/api/index.ts';
import { useMe, usePresence, useToday } from '../hooks.ts';
import type { SessionSnapshot, SessionStore } from '../session/store.ts';
import { AbortedView } from './AbortedView.tsx';
import { CompletedView } from './CompletedView.tsx';
import { EndSignalView } from './EndSignalView.tsx';
import { OtherTabView } from './OtherTabView.tsx';
import { RunningView } from './RunningView.tsx';

export interface SessionSurfaceProps {
  snap: SessionSnapshot;
  store: SessionStore;
  /** After a result: another session of this length (null: back to the choice). */
  onAgain: (minutes: 25 | 50 | 90 | null) => void;
  onDone: () => void;
}

function useAbortsToday(enabled: boolean): number {
  const [day] = useState(() => focusDayOf(Date.now(), CURRENT_PARAMS));
  const list = useApiQuery('sessions.list', { query: { from: day, to: day } }, { enabled, retry: false });
  return (list.data?.items ?? []).filter((s) => s.status === 'aborted' && !s.is_practice).length;
}

export function SessionSurface({ snap, store, onAgain, onDone }: SessionSurfaceProps) {
  const { t } = useT();
  const me = useMe();
  const hasSquad = Boolean(me.data?.squad);
  const live = snap.phase === 'running' || snap.phase === 'offline' || snap.phase === 'stopping';
  const presence = usePresence(live && hasSquad);
  const finished = snap.phase === 'completed';
  const today = useToday(finished && !snap.practice);
  const aborted = snap.phase === 'aborted' || snap.phase === 'aborted_local';
  const abortsToday = useAbortsToday(aborted && !snap.practice && Boolean(snap.result?.confirmed));

  switch (snap.phase) {
    case 'other_tab':
      return <OtherTabView />;
    case 'starting':
      return (
        <p role="status" className="focus-lead">
          {t('focus:prepare.starting')}
        </p>
      );
    case 'running':
    case 'offline':
    case 'stopping': {
      const liveMembers = hasSquad ? (presence.data?.members.filter((m) => m.focusing).length ?? 0) : null;
      return <RunningView snap={snap} store={store} liveMembers={liveMembers} />;
    }
    case 'ending':
      return snap.endSignal ? <EndSignalView waiting /> : <p role="status">{t('focus:end_signal.waiting')}</p>;
    case 'completed':
      if (snap.endSignal || !snap.result) return <EndSignalView waiting={false} />;
      return (
        <CompletedView
          result={snap.result}
          today={today.data}
          onAgain={() => {
            const m = snap.result?.plannedMin;
            store.reset();
            onAgain(m === 25 || m === 50 || m === 90 ? m : null);
          }}
          onDone={() => {
            store.reset();
            onDone();
          }}
        />
      );
    case 'aborted':
    case 'aborted_local':
      if (!snap.result) return null;
      return (
        <AbortedView
          result={snap.result}
          abortsToday={abortsToday}
          onRecovery={(action, seconds) => store.recordRecovery(action, seconds)}
          onRestart={() => {
            const m = snap.result?.plannedMin;
            store.reset();
            onAgain(m === 25 || m === 50 || m === 90 ? m : null);
          }}
          onShorter={(m) => {
            store.reset();
            onAgain(m);
          }}
          onContinue={() => {
            store.reset();
            onDone();
          }}
        />
      );
    default:
      return null;
  }
}
