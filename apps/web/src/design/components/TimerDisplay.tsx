import { useT } from '../../i18n/index.tsx';

export interface TimerDisplayProps {
  /** Remaining time in ms (from the session store; never computed from Date.now() here). */
  remainingMs: number;
  /** session: display style in session-text; compact: title-m on F1. */
  variant?: 'session' | 'compact';
  /** UX §5.5: announce only the end by default; every 5 minutes as a setting (F2). */
  announce?: 'end' | 'every5';
}

/** Minutes, with seconds only in the last minute (UX §5.5). */
export function timerParts(remainingMs: number): { minutes: number; seconds: number; lastMinute: boolean; done: boolean } {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  return { minutes: Math.ceil(totalSec / 60), seconds: totalSec, lastMinute: totalSec > 0 && totalSec <= 60, done: totalSec === 0 };
}

export function TimerDisplay({ remainingMs, variant = 'session', announce = 'end' }: TimerDisplayProps) {
  const { t } = useT();
  const { minutes, seconds, lastMinute, done } = timerParts(remainingMs);
  // Derived, not stored: the live region only speaks when this text changes (UX §5.5).
  const message = done ? t('timer.done') : announce === 'every5' && !lastMinute ? t('timer.remaining_min', { count: Math.ceil(minutes / 5) * 5 }) : '';

  const label = done ? t('timer.done') : lastMinute ? t('timer.remaining_sec', { count: seconds }) : t('timer.remaining_min', { count: minutes });
  return (
    <div className={`timer timer-${variant}`}>
      {/* role=timer is not live by default; the separate region announces only what UX §5.5 allows. */}
      <div role="timer" aria-label={label} className="timer-value">
        <span aria-hidden="true">{lastMinute ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : done ? '0' : minutes}</span>
        {!lastMinute && !done ? (
          <span className="timer-unit" aria-hidden="true">
            {t('timer.unit_min')}
          </span>
        ) : null}
      </div>
      <span className="visually-hidden" aria-live="polite" aria-atomic="true">
        {message}
      </span>
    </div>
  );
}
