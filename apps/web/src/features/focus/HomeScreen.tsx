// F1 Home "Vandaag" (UX §3.3): daily goal ring with the week, squad presence, the length choice and
// the start button. The night rule (01:00–04:00) and the day edge (00:00–04:00) are shown in text.
import { CURRENT_PARAMS } from '@rewarded/core/params';
import type { SessionLengthMin } from '@rewarded/core/session';
import { focusDayOf, toLocalParts, parseDay } from '@rewarded/core/time';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { Banner, BottomSheet, Button, ButtonLink, Card, ProgressRing, Segment } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';
import { apiKey, useApiMutation, useApiQuery } from '../../lib/api/index.ts';
import { takePendingClubCode } from '../club/pending.ts';
import { BonusRule } from './BonusRule.tsx';
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
  const [now] = useState(() => Date.now());
  const mine = useApiQuery('squads.mine', undefined, { enabled: signedIn && hasSquad, retry: false, staleTime: 30_000 });
  const [examOpen, setExamOpen] = useState(false);
  useEffect(() => {
    setSessionUser(me.data?.user?.id ?? null);
  }, [me.data?.user?.id]);
  // A QR of a club opened /c/:code before the account existed: link now (V2).
  useEffect(() => {
    if (!me.data?.user || !me.data.onboarding_complete || me.data.club) return;
    const pending = takePendingClubCode();
    if (pending) void navigate(`/vereniging/koppelen?code=${encodeURIComponent(pending.code)}${pending.bron ? `&bron=${encodeURIComponent(pending.bron)}` : ''}`);
  }, [me.data, navigate]);
  useEffect(() => {
    void store.cacheGet<number>(LAST_LENGTH).then((v) => {
      if (v === 25 || v === 50 || v === 90) setLength(v);
    });
  }, [store]);

  if (me.data && !me.data.onboarding_complete) return <Navigate to="/onboarding" replace />;
  if (me.data?.user?.blocked) return <Navigate to="/geblokkeerd" replace />;
  if (snap.phase === 'running' || snap.phase === 'offline' || snap.phase === 'stopping' || snap.phase === 'starting' || snap.phase === 'ending') {
    return <Navigate to="/focus" replace />;
  }

  const local = toLocalParts(now);
  const minutesOfDay = local.hour * 60 + local.minute;
  const night = minutesOfDay >= 60 && minutesOfDay < 240;
  const dayEdge = minutesOfDay < 240;
  const dayName = (() => {
    const d = parseDay(focusDayOf(now, CURRENT_PARAMS));
    return new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(Date.UTC(d.year, d.month - 1, d.day, 12));
  })();
  const live = presence.data?.members.filter((m) => m.focusing).length ?? 0;
  // Denominator of spec §4.4: active members (not paused), silent members included; never the
  // length of the presence list, which leaves silent members out and counts paused ones.
  const total = presence.data?.active_count ?? mine.data?.today?.active ?? presence.data?.members.length ?? 0;
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
          {night ? <p>{t('focus:home.night')}</p> : <BonusRule today={today.data} place="home" />}
          {today.data ? (
            <div className="focus-stack focus-meta">
              {today.data.streak !== null ? <p>{t('focus:home.streak', { count: today.data.streak })}</p> : null}
              <p>{today.data.joker_available ? t('focus:home.joker_available') : t('focus:home.joker_used')}</p>
              {today.data.exam_day ? <p>{t('focus:home.exam_on')}</p> : null}
              <Button variant="link" onClick={() => setExamOpen(true)}>
                {today.data.exam_day ? t('focus:exam.undo') : t('focus:home.exam_link')}
              </Button>
            </div>
          ) : null}
          {me.data?.club?.status === 'linked' ? (
            <p>
              {t('focus:home.club', { club: me.data.club.name })} <Link to="/vereniging/ranglijst">{t('focus:home.club_link')}</Link>
            </p>
          ) : null}
          <ReminderOffer />
          {today.data ? <ExamSheet open={examOpen} onClose={() => setExamOpen(false)} day={today.data.focus_day} isExam={today.data.exam_day} /> : null}
        </>
      )}
      <ButtonLink to="/hoe-we-tellen" variant="link">
        {t('focus:home.how')}
      </ButtonLink>
    </div>
  );
}

/** F10 Tentamendag (UX §3.3, spec §3.13): a sheet on the exam-day route, at most 3 per week. */
function ExamSheet({ open, onClose, day, isExam }: { open: boolean; onClose: () => void; day: string; isExam: boolean }) {
  const { t } = useT();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const done = () => {
    void qc.invalidateQueries({ queryKey: apiKey('me.today') });
    onClose();
  };
  const put = useApiMutation('me.examDays.put', { onSuccess: done, onError: (e) => setError(e.code === 'EXAM_DAY_LIMIT' ? t('focus:exam.limit') : e.message) });
  const del = useApiMutation('me.examDays.delete', { onSuccess: done });
  return (
    <BottomSheet open={open} title={t('focus:exam.title')} onClose={onClose}>
      <p>{t('focus:exam.text')}</p>
      {error ? <p role="alert">{error}</p> : null}
      <div className="focus-stack">
        {isExam ? (
          <Button block onClick={() => del.mutate({ params: { day } })}>
            {t('focus:exam.undo')}
          </Button>
        ) : (
          <Button block onClick={() => put.mutate({ params: { day } })}>
            {t('focus:exam.confirm')}
          </Button>
        )}
        <Button block variant="secondary" onClick={onClose}>
          {t('focus:exam.cancel')}
        </Button>
      </div>
    </BottomSheet>
  );
}

/** Reminder proposal (UX §6.2 "Herinnering, voorstel"): opt-in, default off, shown until a choice. */
function ReminderOffer() {
  const { t } = useT();
  const me = useMe();
  const qc = useQueryClient();
  const [saved, setSaved] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('rw_reminder_offer') === 'no';
    } catch {
      return false;
    }
  });
  const patch = useApiMutation('me.settings', { onSuccess: (r) => {
    setSaved(r.settings.reminder_time ?? '19:30');
    void qc.invalidateQueries({ queryKey: apiKey('me.get') });
  } });
  const settings = me.data?.settings;
  if (saved) return <p role="status">{t('focus:home.reminder_saved', { time: saved })}</p>;
  if (!settings || settings.email_reminders || dismissed || !me.data?.flags.reminders) return null;
  const time = settings.reminder_time ?? '19:30';
  return (
    <Card level={2}>
      <p>{t('focus:home.reminder', { time })}</p>
      <div className="focus-stack">
        <Button block onClick={() => patch.mutate({ body: { email_reminders: true, reminder_time: time } })}>
          {t('focus:home.reminder_yes', { time })}
        </Button>
        <ButtonLink to="/profiel#herinneringen" variant="secondary" block>
          {t('focus:home.reminder_other')}
        </ButtonLink>
        <Button
          variant="link"
          onClick={() => {
            try {
              localStorage.setItem('rw_reminder_offer', 'no');
            } catch {
              // Per-viewer convenience only.
            }
            setDismissed(true);
          }}
        >
          {t('focus:home.reminder_no')}
        </Button>
      </div>
    </Card>
  );
}
