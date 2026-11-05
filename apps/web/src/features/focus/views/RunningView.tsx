// F3 (running) and F4 (stop confirmation), UX §3.3 and §4.2: dark screen, remaining time, squad
// members focusing now, one Stop button. No points on screen (spec §3.2 step 4).
import { useEffect, useState } from 'react';
import { useImmersive } from '../../../app/shell.tsx';
import { Modal, ProgressRing, TimerDisplay } from '../../../design/index.ts';
import { useT } from '../../../i18n/index.tsx';
import { useTick } from '../session/context.tsx';
import { OFFLINE_NOTICE_MS, type SessionSnapshot, type SessionStore } from '../session/store.ts';

export interface RunningViewProps {
  snap: SessionSnapshot;
  store: SessionStore;
  /** Squad members focusing now (presence poll), or null without a squad. */
  liveMembers: number | null;
}

const HINT_BIG_MS = 5000;

export function RunningView({ snap, store, liveMembers }: RunningViewProps) {
  const { t } = useT();
  useImmersive(true);
  useTick(true, 1000);
  const [confirm, setConfirm] = useState(false);
  const [hintSmall, setHintSmall] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setHintSmall(true), HINT_BIG_MS);
    return () => clearTimeout(id);
  }, []);
  const remaining = store.remaining();
  const plannedMs = (snap.plannedMin ?? 0) * 60_000;
  const offline = snap.phase === 'offline' || (snap.phase === 'stopping' && snap.ctx.state === 'running_offline');
  const offlineLong = offline && store.sinceLastAck() > OFFLINE_NOTICE_MS;
  const stopping = snap.phase === 'stopping';
  const wakeWarn = snap.wakeLock === 'released' || snap.wakeLock === 'denied';
  const minutesLeft = Math.ceil(remaining / 60_000);
  return (
    <section className="session-screen" aria-labelledby="session-title">
      <h1 id="session-title" className="visually-hidden">
        {t('focus:running.label')}
      </h1>
      {snap.practice ? <span className="session-practice">{t('focus:practice_label')}</span> : null}
      <ProgressRing
        variant="session"
        size={240}
        value={plannedMs - remaining}
        max={plannedMs}
        label={t('focus:running.progress')}
        valueText={t('focus:running.progress_value', { count: minutesLeft })}
      >
        <TimerDisplay remainingMs={remaining} variant="session" />
      </ProgressRing>
      <p className={hintSmall ? 'session-hint session-hint-small' : 'session-hint'}>{store.isDesktop() ? t('focus:running.laptop') : t('focus:running.phone')}</p>
      {liveMembers !== null && liveMembers > 0 ? (
        <div className="session-presence" aria-label={t('focus:running.squad_live', { count: liveMembers })} role="img">
          {Array.from({ length: Math.min(6, liveMembers) }, (_, i) => (
            <span key={i} className="session-dot" />
          ))}
        </div>
      ) : null}
      <div className="session-status" role="status">
        {offline ? <span>{t('focus:running.offline_icon')}</span> : null}
        {snap.wakeLock === 'acquired' ? <span>{t('focus:running.wakelock_ok')}</span> : null}
      </div>
      {wakeWarn ? (
        <button type="button" className="session-wakelock" onClick={() => store.keepAwake()}>
          {t('focus:running.wakelock_released')}
        </button>
      ) : null}
      {offlineLong ? <p className="session-offline-line">{t('focus:running.offline_line')}</p> : null}
      {stopping ? (
        <p className="session-offline-line" role="status">
          {snap.stopQueued ? t('focus:running.stop_queued') : t('focus:running.stopping')}
        </p>
      ) : (
        <button type="button" className="btn session-stop" onClick={() => setConfirm(true)}>
          {t('focus:running.stop')}
        </button>
      )}
      <Modal
        open={confirm}
        title={t('focus:stop_modal.title')}
        onClose={() => setConfirm(false)}
        safe={{ label: t('focus:stop_modal.continue'), onClick: () => setConfirm(false) }}
        confirm={{
          label: t('focus:stop_modal.stop'),
          onClick: () => {
            setConfirm(false);
            store.confirmStop();
          },
        }}
      >
        <p>{t('focus:stop_modal.body')}</p>
      </Modal>
    </section>
  );
}
