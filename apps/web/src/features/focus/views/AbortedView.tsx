// F6 (UX §3.3, §4.3, §6.2): when the session stopped, how long the student kept going, the reason
// per fixed code, why there are no points, and the way back. Without blame.
import type { AbortReason } from '@rewarded/core/session';
import { useEffect, useRef, useState } from 'react';
import { Banner, Button } from '../../../design/index.ts';
import { useT } from '../../../i18n/index.tsx';
import { minutesHeld, reportIsProminent, shorterLength } from '../copy.ts';
import type { SessionResult } from '../session/store.ts';
import { ReportSheet } from './ReportSheet.tsx';

export interface AbortedViewProps {
  result: SessionResult;
  /** Aborted sessions today including this one (third abort: suggest shorter + Do Not Disturb). */
  abortsToday: number;
  onRestart: () => void;
  onShorter: (minutes: 25 | 50) => void;
  /** Practice: continue the onboarding. */
  onContinue?: () => void;
  /** abort_recovery: the chosen way back and the seconds until the choice. */
  onRecovery?: (action: 'opnieuw' | 'korter' | 'weg', seconds: number) => void;
}

export function AbortedView({ result, abortsToday, onRestart, onShorter, onContinue, onRecovery }: AbortedViewProps) {
  const { t, time } = useT();
  const [reporting, setReporting] = useState(false);
  const shownAt = useRef(Date.now());
  const chose = useRef(false);
  const code: AbortReason = result.abortReason ?? 'hidden';
  const minutes = minutesHeld(result.elapsedS);
  const at = result.stoppedAt ? time(result.stoppedAt) : null;
  const shorter = result.practice ? null : shorterLength(result.plannedMin);
  const prominent = reportIsProminent(code);
  const seconds = () => Math.round((Date.now() - shownAt.current) / 1000);
  const choose = (action: 'opnieuw' | 'korter', go: () => void) => {
    chose.current = true;
    onRecovery?.(action, seconds());
    go();
  };
  useEffect(
    () => () => {
      // Leaving without a choice counts as "weg" (UX §4.3 step 3).
      if (!chose.current) onRecovery?.('weg', seconds());
    },
    [],
  );
  const body = t(`focus:aborted.${code}`, { time: at ?? '', minutes });
  return (
    <section className="focus-stack" aria-labelledby="aborted-title">
      {result.practice ? <span className="focus-small">{t('focus:practice_label')}</span> : null}
      <h1 id="aborted-title" className="focus-title">
        {at ? t('focus:aborted.heading', { time: at }) : t('focus:aborted.heading_no_time')}
      </h1>
      {!result.practice && abortsToday >= 3 ? <Banner tone="info">{t('focus:aborted.third')}</Banner> : null}
      <p className="focus-lead">{body}</p>
      {result.practice ? <p className="focus-muted">{t('focus:aborted.practice_note')}</p> : null}
      {!result.confirmed ? (
        <p className="focus-muted" role="status">
          {t('focus:aborted.unconfirmed')}
        </p>
      ) : null}
      <div className="focus-stack">
        {result.practice ? (
          <>
            <Button block onClick={() => onContinue?.()}>
              {t('focus:aborted.continue')}
            </Button>
            <Button block variant="secondary" onClick={onRestart}>
              {t('focus:aborted.practice_again')}
            </Button>
          </>
        ) : (
          <>
            <Button block onClick={() => choose('opnieuw', onRestart)}>
              {t('focus:aborted.restart')}
            </Button>
            {shorter ? (
              <Button block variant="secondary" onClick={() => choose('korter', () => onShorter(shorter as 25 | 50))}>
                {t('focus:aborted.shorter')}
              </Button>
            ) : null}
            {prominent ? (
              <Button block variant="secondary" onClick={() => setReporting(true)}>
                {t('focus:aborted.report')}
              </Button>
            ) : (
              <Button variant="link" onClick={() => setReporting(true)}>
                {t('focus:aborted.report')}
              </Button>
            )}
          </>
        )}
      </div>
      {result.practice ? null : <ReportSheet open={reporting} code={code} sessionId={result.sessionId} onClose={() => setReporting(false)} />}
    </section>
  );
}
