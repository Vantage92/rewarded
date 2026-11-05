// F5 (UX §3.3, §4.2 step 6): first the daily goal and the week, then the squad, and only at the
// bottom, small, the points and the earn-in progress (spec §3.2 step 5; principle P1).
import { CURRENT_PARAMS } from '@rewarded/core/params';
import { isLateStart } from '@rewarded/core/time';
import type { TodayResponse } from '@rewarded/contracts/points';
import { useShell } from '../../../app/shell.tsx';
import { Button, ProgressBar } from '../../../design/index.ts';
import { useT } from '../../../i18n/index.tsx';
import type { SessionResult } from '../session/store.ts';

export interface CompletedViewProps {
  result: SessionResult;
  today: TodayResponse | undefined;
  onAgain: () => void;
  onDone: () => void;
}

export function CompletedView({ result, today, onAgain, onDone }: CompletedViewProps) {
  const { t } = useT();
  const { noPointsMode } = useShell();
  if (result.practice) {
    return (
      <section className="focus-stack" aria-labelledby="done-title">
        <h1 id="done-title" className="focus-title">
          {t('focus:completed.practice_done')}
        </h1>
        <p className="focus-muted">{t('focus:completed.practice_note')}</p>
        <Button block onClick={onDone}>
          {t('focus:aborted.continue')}
        </Button>
      </section>
    );
  }
  const end = result.end;
  const minutes = end?.verified_min ?? result.plannedMin;
  const goalMet = today?.goal_met ?? end?.goal_met ?? false;
  const left = today ? Math.max(0, today.goal_min - today.counted_min) : null;
  const late = result.serverStartAt ? isLateStart(Date.parse(result.serverStartAt), CURRENT_PARAMS) : false;
  const capped = end ? end.counted_min < end.verified_min : false;
  const earnIn = CURRENT_PARAMS.points.earn_in_min;
  return (
    <section className="focus-stack" aria-labelledby="done-title">
      <h1 id="done-title" className="visually-hidden">
        {t('focus:completed.title')}
      </h1>
      <div className="result-block">
        <p className="focus-lead">
          {goalMet
            ? t('focus:completed.goal_met', { minutes })
            : left !== null && left > 0
              ? t('focus:completed.goal_open', { minutes, left })
              : t('focus:completed.minutes_only', { minutes })}
        </p>
        {today ? <p>{t('focus:completed.week', { count: today.goal_days_this_week })}</p> : null}
        {late ? <p>{t('focus:completed.late')}</p> : null}
      </div>
      {end?.streak !== null && end?.streak !== undefined ? (
        <div className="result-block">
          <p>{t('focus:completed.streak', { count: end.streak })}</p>
        </div>
      ) : null}
      {!noPointsMode && end ? (
        <div className="result-block result-points">
          {end.flagged || end.points_status === 'pending' ? <p>{t('focus:completed.points_pending')}</p> : <p>{t('focus:completed.points', { count: end.points })}</p>}
          {capped ? <p>{t('focus:completed.cap')}</p> : null}
          {end.earn_in_progress_min < earnIn ? (
            <ProgressBar
              value={end.earn_in_progress_min}
              max={earnIn}
              label={t('focus:completed.earn_in_label')}
              valueText={t('focus:completed.earn_in_value', { value: end.earn_in_progress_min, max: earnIn })}
            />
          ) : null}
        </div>
      ) : null}
      <div className="focus-stack">
        <Button block onClick={onAgain}>
          {t('focus:completed.again')}
        </Button>
        <Button block variant="secondary" onClick={onDone}>
          {t('focus:completed.done')}
        </Button>
      </div>
    </section>
  );
}
