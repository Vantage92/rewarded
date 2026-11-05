// V3 Prestatiechallenge (UX §3.5; spec §3.8, §4.7): fixed places, enrol before the start,
// progress per day, "Verdiend". No euro value and never "kans" or "win" (UX §6.1 rule 5).
import type { ChallengeListItem, ProgressResponse } from '@rewarded/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Button, Card, Chip } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';
import { apiKey, errorText, useApiMutation, useApiQuery } from '../../lib/api/index.ts';
import { ErrorNote, Screen, Skeleton, formatDate, idempotencyKey, isApiError, useMe } from '../profile/kit.tsx';

export function ChallengeScreen() {
  const { t } = useT();
  const { id = '' } = useParams();
  useMe();
  const list = useApiQuery('challenges.list');
  const challenge = list.data?.items.find((c) => c.id === id);
  return (
    <Screen title={challenge?.title ?? t('challenges:title')}>
      {list.isPending ? <Skeleton /> : null}
      {list.error ? <ErrorNote error={list.error} onRetry={() => void list.refetch()} /> : null}
      {list.data && !challenge ? <p>{t('challenges:not_found')}</p> : null}
      {challenge ? <ChallengeDetail challenge={challenge} /> : null}
      <Link to="/vereniging">{t('challenges:back')}</Link>
    </Screen>
  );
}

export function ChallengeDetail({ challenge }: { challenge: ChallengeListItem }) {
  const { t, locale } = useT();
  const qc = useQueryClient();
  const key = useRef(idempotencyKey());
  const [message, setMessage] = useState<string | null>(null);
  const progress = useApiQuery('challenges.progress', { params: { id: challenge.id } }, { retry: false });
  const enrolled = Boolean(progress.data);
  const enroll = useApiMutation('challenges.enroll', {
    onSuccess: (r) => {
      setMessage(r.seat_no ? `${t('challenges:enrolled')} ${t('challenges:seat', { seat: r.seat_no })}` : t('challenges:enrolled'));
      void qc.invalidateQueries({ queryKey: apiKey('challenges.progress') });
      void qc.invalidateQueries({ queryKey: apiKey('challenges.list') });
    },
    onError: (e) => {
      key.current = idempotencyKey();
      setMessage(isApiError(e, 'SEATS_FULL') ? t('challenges:full') : isApiError(e, 'ENROLLMENT_CLOSED') ? t('challenges:closed') : errorText(locale, e));
    },
  });
  const date = (d: string) => formatDate(locale, d, { day: 'numeric', month: 'long' });
  const full = challenge.seats_left === 0;
  return (
    <>
      <p>{t('challenges:period', { from: date(challenge.period.start_day), to: date(challenge.period.end_day) })}</p>
      {challenge.prize ? (
        <Card>
          <p>{t('challenges:prize', { prize: challenge.prize.description })}</p>
          <p className="wp9-row">
            <Chip tone="earned">{t('club:prize.earned')}</Chip>
            <span className="wp9-small">{t('challenges:earned')}</span>
          </p>
        </Card>
      ) : null}
      {challenge.seats_left !== undefined ? <p>{t('challenges:seats', { count: challenge.seats_left })}</p> : null}
      {message ? <p role="status">{message}</p> : null}
      {progress.isPending ? <Skeleton lines={2} /> : null}
      {!enrolled && !progress.isPending && challenge.type === 'performance' ? (
        <Button onClick={() => enroll.mutate({ params: { id: challenge.id }, idempotencyKey: key.current })} disabled={full || enroll.isPending} disabledReason={full ? t('challenges:full') : undefined}>
          {t('challenges:enroll')}
        </Button>
      ) : null}
      {progress.data ? <Progress data={progress.data} /> : progress.error && !isApiError(progress.error, 'NOT_ENROLLED') ? <ErrorNote error={progress.error} /> : null}
    </>
  );
}

function Progress({ data }: { data: ProgressResponse }) {
  const { t, locale } = useT();
  return (
    <Card title={t('challenges:progress')}>
      <p>{t(`challenges:status.${data.status}`)}</p>
      <ul className="wp9-items">
        {data.days.map((d) => (
          <li key={d.day} className="wp9-row">
            <span>{t('challenges:day', { date: formatDate(locale, d.day), minutes: d.minutes })}</span>
            <Chip tone={d.met ? 'earned' : 'neutral'}>{d.met ? t('challenges:day_met') : t('challenges:day_open')}</Chip>
          </li>
        ))}
      </ul>
    </Card>
  );
}
