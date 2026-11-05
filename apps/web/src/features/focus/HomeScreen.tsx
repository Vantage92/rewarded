// F1 Home "Vandaag" (UX §3.3): daily goal ring with the week, squad presence, the length choice and
// the start button. The night rule (01:00–04:00) and the day edge (00:00–04:00) are shown in text.
import { CURRENT_PARAMS } from '@rewarded/core/params';
import type { SessionLengthMin } from '@rewarded/core/session';
import { focusDayOf, toLocalParts, parseDay } from '@rewarded/core/time';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Banner, Button, ButtonLink, Card, ProgressRing, Segment } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';
import { SESSION_LENGTHS } from './copy.ts';
import { useMe, usePresence, useToday } from './hooks.ts';
import { setSessionUser, useSession } from './session/context.tsx';
import './focus.css';

const LAST_LENGTH = 'last_length';

export function HomeScreen() {
  const { t, time, locale } = useT();
  const navigate = useNavigate();
  const [snap, store] = useSession();
  const me = useMe();
  const signedIn = Boolean(me.data?.user);
  const today = useToday(signedIn);
  const hasSquad = Boolean(me.data?.squad);
  const presence = usePresence(signedIn && hasSquad);
  const [length, setLength] = useState<SessionLengthMin>(25);
  useEffect(() => {
    setSessionUser(me.data?.user?.id ?? null);
  }, [me.data?.user?.id]);
  useEffect(() => {
    void store.cacheGet<number>(LAST_LENGTH).then((v) => {
      if (v === 25 || v === 50 || v === 90) setLength(v);
    });
  }, [store]);

  if (me.data && !me.data.onboarding_complete) return <Navigate to="/onboarding" replace />;
  if (snap.phase === 'running' || snap.phase === 'offline' || snap.phase === 'stopping' || snap.phase === 'starting' || snap.phase === 'ending') {
    return <Navigate to="/focus" replace />;
  }

  const now = Date.now();
  const local = toLocalParts(now);
  const minutesOfDay = local.hour * 60 + local.minute;
  const night = minutesOfDay >= 60 && minutesOfDay < 240;
  const dayEdge = minutesOfDay < 240;
  const dayName = (() => {
    const d = parseDay(focusDayOf(now, CURRENT_PARAMS));
    return new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(Date.UTC(d.year, d.month - 1, d.day, 12));
  })();
  const live = presence.data?.members.filter((m) => m.focusing).length ?? 0;
  const total = presence.data?.members.length ?? 0;
  const start = () => {
    store.cacheSet(LAST_LENGTH, length);
    void navigate(`/focus?duur=${length}`);
  };
  const unseenAbort = (snap.phase === 'aborted' || snap.phase === 'aborted_local') && snap.result && !snap.result.practice;

  return (
    <div className="focus-page">
      <h1 className="focus-title">{t('focus:home.title')}</h1>
      {unseenAbort && snap.result?.stoppedAt ? (
        <Banner tone="info" action={<ButtonLink to="/focus" variant="link">{t('focus:home.aborted_banner_view')}</ButtonLink>}>
          {t('focus:home.aborted_banner', { time: time(snap.result.stoppedAt) })}
        </Banner>
      ) : null}
      {me.isError || (me.data && !me.data.user) ? (
        <Card level={2}>
          <p>{t('focus:home.signed_out')}</p>
          <ButtonLink to="/login" block>
            {t('focus:home.login')}
          </ButtonLink>
        </Card>
      ) : (
        <>
          {dayEdge ? <p className="focus-muted">{t('focus:home.day_edge', { day: dayName })}</p> : null}
          <div className="focus-ring-wrap">
            {today.data ? (
              <ProgressRing
                value={today.data.counted_min}
                max={today.data.goal_min}
                label={t('focus:home.goal_label')}
                valueText={t('focus:home.goal_value', { value: today.data.counted_min, max: today.data.goal_min })}
              />
            ) : (
              <p className="focus-muted">{t('focus:home.goal_unknown')}</p>
            )}
            {today.data ? <p>{t('focus:home.week', { count: today.data.goal_days_this_week })}</p> : null}
          </div>
          {signedIn ? (
            hasSquad ? (
              <ButtonLink to="/squad" variant="secondary" block>
                {t('focus:home.squad_live', { live, total })}
              </ButtonLink>
            ) : (
              <ButtonLink to="/squad/nieuw" variant="secondary" block>
                {t('focus:home.squad_none')}
              </ButtonLink>
            )
          ) : null}
          <Segment
            label={t('focus:home.duration_label')}
            options={SESSION_LENGTHS.map((m) => ({ value: m, label: t('focus:minutes_option', { count: m }) }))}
            value={length}
            onChange={setLength}
          />
          <Button block onClick={start} disabled={snap.phase === 'other_tab'} disabledReason={snap.phase === 'other_tab' ? t('focus:other_tab.title') : undefined}>
            {t('focus:home.start')}
          </Button>
          {night ? <p>{t('focus:home.night')}</p> : null}
        </>
      )}
      <ButtonLink to="/hoe-we-tellen" variant="link">
        {t('focus:home.how')}
      </ButtonLink>
    </div>
  );
}
