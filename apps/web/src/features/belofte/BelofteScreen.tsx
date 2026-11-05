// De Belofte (UX §3.4 Q5/Q6, §4.10, §6.2; spec §3.12, §4.12): offer per arm, choices with a
// suggestion, witnesses (squad or nobody), stop with one tap, reflection after 14 days with one
// optional stake question for 18_plus only. No points, badges or prizes anywhere.
import type { BelofteTrigger, CurrentBelofteResponse, GoalMinutes, StakeInterest } from '@rewarded/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Button, Card, Segment } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';
import { apiKey, errorText, useApiMutation, useApiQuery } from '../../lib/api/index.ts';
import { DayDots, ErrorNote, Screen, Skeleton, formatDate, isAdult, isApiError, useMe, useTrack } from '../profile/kit.tsx';
import { belofteWeek } from '../squads/SquadScreen.tsx';

const DAYS = [3, 4, 5, 6, 7] as const;
const MINUTES = [25, 50, 90, 120] as const;
type Days = (typeof DAYS)[number];

const TRIGGER_EVENT: Record<BelofteTrigger, 'vroeg' | 'laat' | 'buiten_experiment'> = { early: 'vroeg', late: 'laat', outside: 'buiten_experiment' };

export function BelofteScreen() {
  const { t } = useT();
  const current = useApiQuery('beloftes.current', undefined, { retry: false });
  const none = isApiError(current.error, 'NOT_FOUND');
  const status = current.data?.belofte.status;
  return (
    <Screen title={t('belofte:title')}>
      {current.isPending ? <Skeleton /> : null}
      {current.error && !none ? <ErrorNote error={current.error} onRetry={() => void current.refetch()} /> : null}
      {current.data && status === 'active' ? <CurrentBelofte data={current.data} /> : null}
      {current.data && status === 'completed' ? <Reflection data={current.data} /> : null}
      {none || status === 'stopped' ? <Offer /> : null}
    </Screen>
  );
}

function CurrentBelofte({ data }: { data: CurrentBelofteResponse }) {
  const { t, locale } = useT();
  const qc = useQueryClient();
  const today = useApiQuery('me.today');
  const [stopped, setStopped] = useState(false);
  const stop = useApiMutation('beloftes.stop', {
    onSuccess: () => {
      setStopped(true);
      void qc.invalidateQueries({ queryKey: apiKey('beloftes.current') });
    },
  });
  const b = data.belofte;
  if (stopped) return <p role="status">{t('belofte:current.stopped')}</p>;
  return (
    <Card>
      <p>{t('belofte:current.summary', { days: b.days_per_week, minutes: b.min_per_day, date: formatDate(locale, b.end_day, { day: 'numeric', month: 'long' }) })}</p>
      <p>{b.witnesses === 'squad' ? t('belofte:current.witnesses_squad') : t('belofte:current.witnesses_none')}</p>
      {today.data ? <p>{t('belofte:current.week', { met: belofteWeek(data.days, today.data.focus_day), days: b.days_per_week })}</p> : null}
      <DayDots days={data.days} label={t('belofte:current.days')} />
      <p className="wp9-small">{t('belofte:form.no_points')}</p>
      {/* One tap, no confirmation and no guilt (spec §4.12 Stoppen). */}
      <Button variant="secondary" onClick={() => stop.mutate({ params: { id: b.id } })} disabled={stop.isPending}>
        {t('belofte:current.stop')}
      </Button>
    </Card>
  );
}

function Reflection({ data }: { data: CurrentBelofteResponse }) {
  const { t, locale } = useT();
  const me = useMe();
  const qc = useQueryClient();
  const [stake, setStake] = useState<StakeInterest | null>(null);
  const [result, setResult] = useState<'done' | 'renewed' | 'adjust' | null>(null);
  const [error, setError] = useState<unknown>(null);
  const reflect = useApiMutation('beloftes.reflection', {
    onSuccess: (r, input) => {
      const action = (input.body as { action: string }).action;
      setResult(action === 'extend' ? 'renewed' : action === 'adjust' || r.next === 'adjust' ? 'adjust' : 'done');
      void qc.invalidateQueries({ queryKey: apiKey('beloftes.current') });
    },
    onError: setError,
  });
  const b = data.belofte;
  const met = data.days.filter((d) => d.met).length;
  const adult = isAdult(me.data);
  const send = (action: 'extend' | 'adjust' | 'stop') =>
    reflect.mutate({ params: { id: b.id }, body: { action, ...(adult && stake ? { stake_interest: stake } : {}) } });
  if (result === 'adjust') return <BelofteForm suggestedDays={b.days_per_week} suggestedMin={b.min_per_day} />;
  if (result) return <p role="status">{result === 'renewed' ? t('belofte:reflection.renewed') : t('belofte:reflection.done')}</p>;
  return (
    <Card title={t('belofte:reflection.title')}>
      <p>{t('belofte:reflection.result', { met, target: b.days_per_week * 2 })}</p>
      <DayDots days={data.days} label={t('belofte:current.days')} />
      {adult ? (
        <fieldset data-testid="stake-question">
          <legend>{t('belofte:reflection.stake')}</legend>
          <Segment
            label={t('belofte:reflection.stake')}
            options={[
              { value: 'yes', label: t('belofte:reflection.stake_yes') },
              { value: 'no', label: t('belofte:reflection.stake_no') },
              { value: 'unsure', label: t('belofte:reflection.stake_unsure') },
            ]}
            value={stake ?? ('' as StakeInterest)}
            onChange={(v) => setStake(v)}
          />
        </fieldset>
      ) : null}
      {error ? <p role="alert">{errorText(locale, error)}</p> : null}
      <div className="wp9-row">
        <Button onClick={() => send('extend')} disabled={reflect.isPending}>
          {t('belofte:reflection.renew')}
        </Button>
        <Button variant="secondary" onClick={() => send('adjust')} disabled={reflect.isPending}>
          {t('belofte:reflection.adjust')}
        </Button>
        <Button variant="secondary" onClick={() => send('stop')} disabled={reflect.isPending}>
          {t('belofte:reflection.stop')}
        </Button>
      </div>
    </Card>
  );
}

function Offer() {
  const { t } = useT();
  const offer = useApiQuery('belofte.offer', undefined, { retry: false });
  const me = useMe();
  const track = useTrack();
  const [later, setLater] = useState(false);
  const sent = useRef(false);
  const o = offer.data?.offer;
  useEffect(() => {
    if (sent.current || !o || !me.data) return;
    sent.current = true;
    track({ name: 'belofte_offered', props: { trigger: TRIGGER_EVENT[o.trigger], squadstatus: me.data.squad?.status ?? 'geen' } });
  }, [o, me.data, track]);
  if (offer.isPending) return <Skeleton />;
  if (isApiError(offer.error, 'FEATURE_DISABLED')) return <p>{t('belofte:offer.disabled')}</p>;
  if (offer.error) return <ErrorNote error={offer.error} onRetry={() => void offer.refetch()} />;
  if (!o) return <p>{t('belofte:offer.none')}</p>;
  return (
    <>
      <p>{o.trigger === 'early' ? t('belofte:offer.early') : t('belofte:offer.late')}</p>
      {later ? (
        <p role="status">{t('belofte:form.later_done')}</p>
      ) : (
        <BelofteForm suggestedDays={o.suggested_days} suggestedMin={o.suggested_min} onLater={() => setLater(true)} />
      )}
    </>
  );
}

/** Q5: choices prefilled with the suggestion; what witnesses see is stated before the choice. */
export function BelofteForm({ suggestedDays, suggestedMin, onLater }: { suggestedDays: number; suggestedMin: GoalMinutes; onLater?: () => void }) {
  const { t, locale } = useT();
  const me = useMe();
  const qc = useQueryClient();
  const hasSquad = Boolean(me.data?.squad);
  const [days, setDays] = useState<Days>((DAYS as readonly number[]).includes(suggestedDays) ? (suggestedDays as Days) : 3);
  const [minutes, setMinutes] = useState<GoalMinutes>(suggestedMin);
  const [chosen, setWitnesses] = useState<'squad' | 'none'>('squad');
  // Without a squad there are no witnesses (UX §3.4 Q5), whatever was chosen before.
  const witnesses = hasSquad ? chosen : 'none';
  const [error, setError] = useState<unknown>(null);
  const create = useApiMutation('beloftes.create', {
    onSuccess: () => void qc.invalidateQueries({ queryKey: apiKey('beloftes.current') }),
    onError: setError,
  });
  return (
    <Card>
      <p className="wp9-small">{t('belofte:form.suggestion', { days: suggestedDays, minutes: suggestedMin })}</p>
      <Segment label={t('belofte:form.days')} options={DAYS.map((d) => ({ value: d, label: String(d) }))} value={days} onChange={setDays} />
      <Segment label={t('belofte:form.minutes')} options={MINUTES.map((m) => ({ value: m, label: String(m) }))} value={minutes} onChange={setMinutes} />
      {hasSquad ? (
        <Segment
          label={t('belofte:form.witnesses')}
          options={[
            { value: 'squad', label: t('belofte:form.witness_squad') },
            { value: 'none', label: t('belofte:form.witness_none') },
          ]}
          value={witnesses}
          onChange={setWitnesses}
        />
      ) : (
        <p className="wp9-small">{t('belofte:form.no_squad')}</p>
      )}
      {witnesses === 'squad' ? <p>{t('belofte:form.witness_info')}</p> : null}
      <p>{t('belofte:form.no_points')}</p>
      {error ? <p role="alert">{errorText(locale, error)}</p> : null}
      <div className="wp9-row">
        <Button onClick={() => create.mutate({ body: { days_per_week: days, min_per_day: minutes, witnesses } })} disabled={create.isPending}>
          {t('belofte:form.submit')}
        </Button>
        {onLater ? (
          <Button variant="secondary" onClick={onLater}>
            {t('belofte:form.later')}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
