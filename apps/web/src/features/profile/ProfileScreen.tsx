// P1 Ik (UX §3.7; spec §4.10): name, daily goal (from tomorrow, overreach brake), squad, club,
// the switches, research opt-out apart from everything else, the institution email with the
// fingerprint copy, and links to privacy, terms, Plus and the personal link.
import type { GoalMinutes, MeResponse, UserSettings } from '@rewarded/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button, Card, Modal, Segment, Switch, TextField, ThemeSwitch, useToast } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';
import { apiKey, errorText, useApiMutation } from '../../lib/api/index.ts';
import { BlockedScreen, DecisionsCard, LogoutButton } from './Decisions.tsx';
import { AccountLanguageSwitch, ErrorNote, Screen, Skeleton, formatDate, isApiError, useMe } from './kit.tsx';

const GOALS = [25, 50, 90, 120] as const;

export function ProfileScreen() {
  const { t } = useT();
  const me = useMe();
  if (me.data?.user?.blocked) return <BlockedScreen />;
  return (
    <Screen title={t('profile:title')}>
      {me.isPending ? <Skeleton lines={5} /> : null}
      {me.error ? <ErrorNote error={me.error} onRetry={() => void me.refetch()} /> : null}
      {me.data?.user ? <ProfileContent me={me.data} /> : null}
    </Screen>
  );
}

function ProfileContent({ me }: { me: MeResponse }) {
  const { t } = useT();
  const user = me.user!;
  return (
    <>
      <Card>
        <dl className="wp9-dl">
          <dt>{t('profile:me.name')}</dt>
          <dd>{[user.first_name, user.last_name].filter(Boolean).join(' ')}</dd>
          <dt>{t('profile:me.age')}</dt>
          <dd>{me.age_band ? t('profile:me.age_band', { band: me.age_band }) : t('profile:me.none')}</dd>
          <dt>{t('profile:me.squad')}</dt>
          <dd>{me.squad ? <Link to="/squad">{me.squad.name}</Link> : t('profile:me.none')}</dd>
          <dt>{t('profile:me.club')}</dt>
          <dd>{me.club ? <Link to="/vereniging">{me.club.name}</Link> : t('profile:me.none')}</dd>
        </dl>
      </Card>
      <DailyGoal current={user.daily_goal_min} createdAt={user.created_at} />
      {me.settings ? <Settings me={me} settings={me.settings} /> : null}
      <DecisionsCard />
      <Research optedOut={user.research_opted_out} />
      <InstitutionEmail domain={user.institution_domain} />
      <Card title={t('profile:links.title')}>
        <ul className="wp9-items">
          <li>
            <Link to="/profiel/privacy">{t('profile:links.privacy')}</Link>
          </li>
          <li>
            <Link to="/profiel/voorwaarden">{t('profile:links.terms')}</Link>
          </li>
          <li>
            <Link to="/hoe-we-tellen">{t('profile:links.how')}</Link>
          </li>
          {me.flags.referral ? (
            <li>
              <Link to="/profiel/link">{t('profile:links.referral')}</Link>
            </li>
          ) : null}
          {me.flags.plus_door ? (
            <li>
              <Link to="/profiel/plus">{t('profile:plus_link')}</Link>
            </li>
          ) : null}
        </ul>
      </Card>
      <Card>
        <ThemeSwitch />
        <AccountLanguageSwitch />
      </Card>
      <LogoutButton />
    </>
  );
}

/** Daily goal 25/50/90/120; 90 or 120 in the first 7 days asks "Begin liever klein" (spec §4.4). */
function DailyGoal({ current, createdAt }: { current: GoalMinutes; createdAt: string }) {
  const { t, locale } = useT();
  const qc = useQueryClient();
  const [value, setValue] = useState<GoalMinutes>(current);
  const [confirm, setConfirm] = useState<GoalMinutes | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const save = useApiMutation('me.dailyGoal', {
    onSuccess: (r) => {
      setConfirm(null);
      setNote(t('profile:goal.saved', { minutes: r.goal_min, date: formatDate(locale, r.effective_from_day) }));
      void qc.invalidateQueries({ queryKey: apiKey('me.get') });
    },
    onError: (e, input) => {
      if (isApiError(e, 'OVERREACH_CONFIRM_REQUIRED')) return setConfirm(input.body!.minutes);
      setNote(errorText(locale, e));
    },
  });
  const choose = (m: GoalMinutes) => {
    setValue(m);
    if (m === current) return;
    // Overreach brake in the first 7 days (spec §4.4); the server asks again if needed.
    const firstWeek = Date.now() - Date.parse(createdAt) < 7 * 24 * 3600 * 1000;
    if (firstWeek && m >= 90) return setConfirm(m);
    save.mutate({ body: { minutes: m } });
  };
  return (
    <Card title={t('profile:goal.title')}>
      <Segment label={t('profile:goal.label')} options={GOALS.map((g) => ({ value: g, label: String(g) }))} value={value} onChange={choose} />
      <p className="wp9-small">{t('profile:goal.from_tomorrow')}</p>
      {note ? <p role="status">{note}</p> : null}
      <Modal
        open={confirm !== null}
        title={t('profile:goal.title')}
        onClose={() => {
          setConfirm(null);
          setValue(current);
        }}
        safe={{
          label: t('profile:goal.overreach_cancel'),
          onClick: () => {
            setConfirm(null);
            setValue(current);
          },
        }}
        confirm={{ label: t('profile:goal.overreach_confirm', { minutes: confirm ?? 0 }), onClick: () => confirm && save.mutate({ body: { minutes: confirm, confirm_overreach: true } }) }}
      >
        <p>{t('profile:goal.overreach')}</p>
      </Modal>
    </Card>
  );
}

function Settings({ me, settings }: { me: MeResponse; settings: UserSettings }) {
  const { t, locale } = useT();
  const qc = useQueryClient();
  const toast = useToast();
  const [local, setLocal] = useState(settings);
  const patch = useApiMutation('me.settings', {
    onSuccess: (r) => {
      setLocal(r.settings);
      qc.setQueryData(apiKey('me.get'), { ...me, settings: r.settings });
      toast.show(t('profile:settings.saved'));
    },
    onError: (e) => {
      setLocal(settings);
      toast.show(errorText(locale, e));
    },
  });
  const set = (key: 'compare_opt_in' | 'silent_mode' | 'squad_name_on_cards' | 'no_points_mode' | 'email_reminders') => (on: boolean) => {
    setLocal((s) => ({ ...s, [key]: on }));
    patch.mutate({ body: { [key]: on } });
  };
  return (
    <Card title={t('profile:settings.title')}>
      <Switch label={t('profile:settings.compare')} description={t('profile:settings.compare_desc')} checked={local.compare_opt_in} onChange={set('compare_opt_in')} />
      <Switch
        label={t('profile:settings.silent')}
        description={me.age_band === '16_17' ? `${t('profile:settings.silent_desc')} ${t('profile:settings.silent_minor')}` : t('profile:settings.silent_desc')}
        checked={local.silent_mode}
        onChange={set('silent_mode')}
      />
      <Switch label={t('profile:settings.squad_name_cards')} description={t('profile:settings.squad_name_cards_desc')} checked={local.squad_name_on_cards} onChange={set('squad_name_on_cards')} />
      {me.flags.no_points_mode ? <Switch label={t('profile:settings.no_points')} description={t('profile:settings.no_points_desc')} checked={local.no_points_mode} onChange={set('no_points_mode')} /> : null}
      {me.flags.reminders ? (
        <div id="herinneringen">
          <Switch label={t('profile:settings.reminders')} description={t('profile:settings.reminders_desc')} checked={local.email_reminders} onChange={set('email_reminders')} />
          {local.email_reminders ? (
            <ReminderSchedule
              time={local.reminder_time ?? '19:30'}
              days={local.reminder_days ?? [1, 2, 3, 4, 5, 6, 7]}
              onChange={(patchBody) => {
                setLocal((s) => ({ ...s, ...patchBody }));
                patch.mutate({ body: patchBody });
              }}
            />
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

/** "Meedoen aan het onderzoek": its own switch with a confirmation, no loss of points (spec §4.10). */
function Research({ optedOut }: { optedOut: boolean }) {
  const { t, locale } = useT();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(optedOut);
  const [error, setError] = useState<unknown>(null);
  const opt = useApiMutation('me.researchOptOut', {
    onSuccess: () => {
      setDone(true);
      setOpen(false);
      void qc.invalidateQueries({ queryKey: apiKey('me.get') });
    },
    onError: (e) => {
      if (isApiError(e, 'ALREADY_OPTED_OUT')) setDone(true);
      else setError(e);
      setOpen(false);
    },
  });
  return (
    <Card title={t('profile:research.title')}>
      {done ? (
        <p>{t('profile:research.opted_out')}</p>
      ) : (
        <Switch label={t('profile:research.participate')} description={t('profile:research.participate_desc')} checked onChange={() => setOpen(true)} />
      )}
      {error ? <p role="alert">{errorText(locale, error)}</p> : null}
      <Modal
        open={open}
        title={t('profile:research.confirm_title')}
        onClose={() => setOpen(false)}
        safe={{ label: t('profile:research.cancel'), onClick: () => setOpen(false) }}
        confirm={{ label: t('profile:research.confirm'), onClick: () => opt.mutate({ body: { confirm: true } }) }}
      >
        <p>{t('profile:research.confirm_text')}</p>
      </Modal>
    </Card>
  );
}

function InstitutionEmail({ domain }: { domain: string | null }) {
  const { t, locale } = useT();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(domain);
  const [error, setError] = useState<string | undefined>();
  const start = useApiMutation('institution.start', {
    onSuccess: () => {
      setSent(true);
      setError(undefined);
    },
    onError: (e) => setError(isApiError(e, 'INSTITUTION_EMAIL_IN_USE') ? t('profile:institution.in_use') : isApiError(e, 'DOMAIN_NOT_ALLOWED') ? t('profile:institution.domain') : errorText(locale, e)),
  });
  const confirm = useApiMutation('institution.confirm', {
    onSuccess: (r) => {
      setConfirmed(r.domain);
      void qc.invalidateQueries({ queryKey: apiKey('me.get') });
    },
    onError: (e) => setError(errorText(locale, e)),
  });
  return (
    <section id="instellingsmail">
      <Card title={t('profile:institution.title')}>
        {confirmed ? (
          <p>{t('profile:institution.confirmed', { domain: confirmed })}</p>
        ) : (
          <>
            <p>{t('profile:institution.intro')}</p>
            {!sent ? (
              <form
                className="wp9-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  start.mutate({ body: { email: email.trim() } });
                }}
              >
                <TextField label={t('profile:institution.email')} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
                <Button type="submit" disabled={start.isPending || !email.includes('@')}>
                  {t('profile:institution.send')}
                </Button>
              </form>
            ) : (
              <form
                className="wp9-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  confirm.mutate({ body: { code } });
                }}
              >
                <p>{t('profile:institution.sent')}</p>
                <TextField label={t('profile:institution.code')} autoComplete="one-time-code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} error={error} />
                <Button type="submit" disabled={confirm.isPending || code.length !== 6}>
                  {t('profile:institution.confirm')}
                </Button>
              </form>
            )}
          </>
        )}
        <p className="wp9-small" data-testid="fingerprint">
          {t('profile:institution.fingerprint')}
        </p>
      </Card>
    </section>
  );
}

const QUARTERS = Array.from({ length: 96 }, (_, i) => `${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`);

/** P5: time (quarter hours) and days of the reminder mail. */
function ReminderSchedule({ time, days, onChange }: { time: string; days: readonly number[]; onChange: (p: { reminder_time?: string; reminder_days?: number[] }) => void }) {
  const { t } = useT();
  return (
    <div className="wp9-stack">
      <label className="wp9-stack">
        <span>{t('profile:reminders.time')}</span>
        <select value={time} onChange={(e) => onChange({ reminder_time: e.target.value })}>
          {QUARTERS.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>{t('profile:reminders.days')}</legend>
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
          <label key={d} className="wp9-row">
            <input
              type="checkbox"
              checked={days.includes(d)}
              onChange={(e) => {
                const next = e.target.checked ? [...days, d] : days.filter((x) => x !== d);
                if (next.length > 0) onChange({ reminder_days: [...new Set(next)].sort() });
              }}
            />
            <span>{t(`profile:reminders.day.${d}`)}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
