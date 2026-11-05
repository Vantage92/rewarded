// Q1 Squad-overzicht, Q3 Uitnodigen, Q7 Belofte van een squadlid, the name report and leaving
// (UX §3.4, §4.4, §6.2; spec §3.5, §4.4). Presence polls every 30 s while the screen is visible
// (architecture §9.2). Minutes appear only when the student opted in to comparing (spec §4.4).
import type { CurrentBelofteResponse, InviteDto, SquadMember, SquadMineResponse, WitnessBelofte } from '@rewarded/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { BottomSheet, Button, ButtonLink, Card, List, ListItem, Modal, useToast } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';
import { apiKey, errorText, useApiMutation, useApiQuery } from '../../lib/api/index.ts';
import { absoluteUrl, canShare, copyText, share } from '../cards/share.ts';
import { DayDots, ErrorNote, Screen, Skeleton, formatDate, isApiError, useMe, useTrack } from '../profile/kit.tsx';

/** Spec §4.4: a squad day succeeds when at least half of the active members (rounded up, min. 2) meet their goal. */
export function squadDayNeeded(active: number): number {
  return Math.max(2, Math.ceil(active / 2));
}

/** Monday (ISO) of the week of a focus day. */
export function weekStart(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

/** Days met this week of a Belofte, next to the promised days per week (UX §6.2 "Belofte: 3 van 5 dagen deze week"). */
export function belofteWeek(days: readonly { day: string; met: boolean }[], today: string): number {
  const from = weekStart(today);
  return days.filter((d) => d.met && d.day >= from && d.day <= today).length;
}

export function SquadScreen() {
  const { t } = useT();
  const mine = useApiQuery('squads.mine', undefined, { retry: false });
  const notInSquad = isApiError(mine.error, 'NOT_IN_SQUAD');
  return (
    <Screen title={t('squads:title')}>
      {mine.isPending ? <Skeleton lines={4} /> : null}
      {notInSquad ? (
        <Card>
          <p>{t('squads:empty.text')}</p>
          <ButtonLink to="/squad/nieuw">{t('squads:empty.create')}</ButtonLink>
        </Card>
      ) : mine.error ? (
        <ErrorNote error={mine.error} onRetry={() => void mine.refetch()} />
      ) : null}
      {mine.data ? <SquadOverview data={mine.data} /> : null}
    </Screen>
  );
}

function SquadOverview({ data }: { data: SquadMineResponse }) {
  const { t } = useT();
  const me = useMe();
  const today = useApiQuery('me.today');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const active = data.members.filter((m) => !m.paused);
  const paused = data.members.filter((m) => m.paused);
  const met = active.filter((m) => m.goal_met_today).length;
  const needed = squadDayNeeded(active.length);
  const building = data.status === 'building';
  const frozen = !building && active.length < 3;
  const focusDay = today.data?.focus_day;
  const compareOn = me.data?.settings?.compare_opt_in ?? false;

  return (
    <>
      <Card title={data.squad.name} action={<NameReport squadId={data.squad.id} status={data.squad.name_status} />}>
        {building ? (
          <p>{t('squads:streak.building', { count: Math.max(1, 3 - data.members.length) })}</p>
        ) : (
          <>
            <p className="wp9-small">{t('squads:streak.label')}</p>
            <p className="wp9-big" data-testid="streak">
              {t('squads:streak.value', { count: data.streak })}
            </p>
            {frozen ? <p>{t('squads:streak.frozen')}</p> : null}
            {today.data?.recovery ? (
              <p>
                {t('squads:streak.recovery')} {t('squads:streak.recovery_detail', { count: today.data.recovery.streak_before_break })}
              </p>
            ) : null}
            <p>
              {t('squads:today.line', { met, active: active.length })} {met >= needed ? t('squads:today.success') : t('squads:today.needed', { needed })}
            </p>
          </>
        )}
        {today.data ? <p>{today.data.joker_available ? t('squads:joker.available') : t('squads:joker.used')}</p> : null}
      </Card>

      <Presence activeCount={active.length} />

      <Card title={t('squads:members.label')}>
        <List label={t('squads:members.label')}>
          {active.map((m, i) => (
            <MemberRow key={`${m.first_name}-${i}`} member={m} />
          ))}
        </List>
        {paused.length ? (
          <>
            <h3>{t('squads:members.paused_title')}</h3>
            <List label={t('squads:members.paused_label')}>
              {paused.map((m, i) => (
                <ListItem key={`${m.first_name}-p${i}`} title={m.first_name} avatarName={m.first_name} subtitle={t('squads:members.paused', { name: m.first_name })} status={{ label: t('squads:members.paused_title'), tone: 'pause' }} />
              ))}
            </List>
          </>
        ) : null}
      </Card>

      {focusDay ? <Beloftes focusDay={focusDay} /> : null}

      {compareOn ? <Compare /> : <p className="wp9-small">{t('squads:compare.off')}</p>}

      <div className="wp9-row">
        {data.members.length < 6 ? (
          <Button onClick={() => setInviteOpen(true)}>{t('squads:actions.invite')}</Button>
        ) : null}
        <ButtonLink to="/duel" variant="secondary">
          {t('squads:actions.duel')}
        </ButtonLink>
      </div>
      <Button variant="link" onClick={() => setLeaving(true)}>
        {t('squads:actions.leave')}
      </Button>
      {inviteOpen ? <InviteSheet onClose={() => setInviteOpen(false)} /> : null}
      <LeaveModal open={leaving} onClose={() => setLeaving(false)} />
    </>
  );
}

function MemberRow({ member }: { member: SquadMember }) {
  const { t } = useT();
  return (
    <ListItem
      title={member.first_name}
      avatarName={member.first_name}
      status={member.goal_met_today ? { label: t('squads:members.met'), tone: 'earned', icon: '✓' } : { label: t('squads:members.open'), tone: 'neutral' }}
    />
  );
}

/** Live presence without names or minutes beyond the remaining time (spec §4.4, architecture §6.4). */
function Presence({ activeCount }: { activeCount: number }) {
  const { t } = useT();
  const track = useTrack();
  const presence = useApiQuery('squads.presence', undefined, { refetchInterval: 30_000, refetchIntervalInBackground: false });
  const sent = useRef(false);
  const live = presence.data?.members.filter((m) => m.focusing) ?? [];
  useEffect(() => {
    if (sent.current || !presence.data) return;
    sent.current = true;
    track({ name: 'presence_viewed', props: { leden_live: Math.min(6, live.length) } });
  }, [presence.data, live.length, track]);
  if (!presence.data) return null;
  return (
    <Card title={t('squads:presence.label')}>
      <p aria-live="polite">{t('squads:presence.line', { live: live.length, active: activeCount })}</p>
      {live.length ? (
        <ul>
          {live.map((m) => (
            <li key={m.member_ref}>{t('squads:presence.remaining', { count: m.remaining_min ?? 0 })}</li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

function Beloftes({ focusDay }: { focusDay: string }) {
  const { t } = useT();
  const own = useApiQuery('beloftes.current', undefined, { retry: false });
  const others = useApiQuery('squads.beloftes');
  const [open, setOpen] = useState<WitnessBelofte | null>(null);
  const ownActive: CurrentBelofteResponse | undefined = own.data?.belofte.status === 'active' ? own.data : undefined;
  const items = others.data?.items ?? [];
  if (!ownActive && !items.length) return null;
  return (
    <Card>
      <ul className="wp9-items">
        {ownActive ? <li>{t('squads:belofte.own', { met: belofteWeek(ownActive.days, focusDay), target: ownActive.belofte.days_per_week })}</li> : null}
        {items.map((b, i) => (
          <li key={`${b.first_name}-${i}`}>
            <Button variant="link" onClick={() => setOpen(b)} aria-label={t('squads:belofte.open', { name: b.first_name })}>
              {b.status === 'stopped'
                ? t('squads:belofte.stopped', { name: b.first_name })
                : b.status === 'completed'
                  ? t('squads:belofte.completed', { name: b.first_name })
                  : t('squads:belofte.member', { name: b.first_name, met: belofteWeek(b.days, focusDay), target: b.days_per_week })}
            </Button>
          </li>
        ))}
      </ul>
      {open ? <WitnessSheet belofte={open} onClose={() => setOpen(null)} /> : null}
    </Card>
  );
}

/** Q7: what a witness sees — the promise and per day met or not; no minutes, no points, no judgement. */
export function WitnessSheet({ belofte, onClose }: { belofte: WitnessBelofte; onClose: () => void }) {
  const { t, locale } = useT();
  const track = useTrack();
  useEffect(() => track({ name: 'belofte_witness_viewed', props: { belofte_status: belofte.status } }), [belofte.status, track]);
  return (
    <BottomSheet open title={t('squads:belofte.sheet_title', { name: belofte.first_name })} onClose={onClose}>
      <div className="wp9-stack">
        {belofte.status === 'stopped' ? (
          <p>{t('squads:belofte.stopped', { name: belofte.first_name })}</p>
        ) : belofte.status === 'completed' ? (
          <p>{t('squads:belofte.completed', { name: belofte.first_name })}</p>
        ) : (
          <p>{t('squads:belofte.promised', { name: belofte.first_name, days: belofte.days_per_week, minutes: belofte.min_per_day, date: formatDate(locale, belofte.end_day, { day: 'numeric', month: 'long' }) })}</p>
        )}
        {belofte.status === 'active' ? <DayDots days={belofte.days} label={t('squads:belofte.days')} /> : null}
      </div>
    </BottomSheet>
  );
}

export function Compare() {
  const { t } = useT();
  const compare = useApiQuery('squads.compare', undefined, { retry: false });
  if (isApiError(compare.error, 'COMPARE_OPT_IN_REQUIRED')) return <p className="wp9-small">{t('squads:compare.off')}</p>;
  if (!compare.data) return null;
  return (
    <Card title={t('squads:compare.title')}>
      {compare.data.members.length ? (
        <ul>
          {compare.data.members.map((m, i) => (
            <li key={`${m.first_name}-${i}`}>{t('squads:compare.row', { name: m.first_name, today: m.minutes_today, week: m.minutes_week })}</li>
          ))}
        </ul>
      ) : (
        <p>{t('squads:compare.none')}</p>
      )}
    </Card>
  );
}

/** Q3: suggested text without points or prizes (spec §3.5 step 2), Web Share or copy. */
export function InviteSheet({ onClose, initial }: { onClose: () => void; initial?: InviteDto }) {
  const { t, locale } = useT();
  const toast = useToast();
  const track = useTrack();
  const [invite, setInvite] = useState<InviteDto | undefined>(initial);
  const [error, setError] = useState<unknown>(null);
  const create = useApiMutation('squads.invite', { onSuccess: (r) => setInvite(r.invite), onError: setError });
  const started = useRef(false);
  useEffect(() => {
    if (initial || started.current) return;
    started.current = true;
    create.mutate({});
  }, [initial, create]);
  const url = invite ? absoluteUrl(invite.url) : '';
  const text = t('squads:invite.text');
  const shareable = canShare({ text, url });
  return (
    <BottomSheet open title={t('squads:invite.title')} onClose={onClose}>
      <div className="wp9-stack">
        {error ? <p role="alert">{errorText(locale, error)}</p> : null}
        {!invite && !error ? <Skeleton lines={2} /> : null}
        {invite ? (
          <>
            <p className="wp9-small">{t('squads:invite.preview')}</p>
            <blockquote data-testid="invite-text">
              {text} {url}
            </blockquote>
            <p className="wp9-small">{t('squads:invite.validity')}</p>
            {shareable ? (
              <Button
                block
                onClick={async () => {
                  track({ name: 'invite_share_opened', props: { invite_id: invite.id, kanaal: 'systeem' } });
                  await share({ text, url });
                }}
              >
                {t('squads:invite.share')}
              </Button>
            ) : (
              <p className="wp9-small">{t('squads:invite.no_share')}</p>
            )}
            <Button
              variant="secondary"
              block
              onClick={async () => {
                track({ name: 'invite_share_opened', props: { invite_id: invite.id, kanaal: 'kopie' } });
                if (await copyText(`${text} ${url}`)) toast.show(t('squads:invite.copied'));
              }}
            >
              {t('squads:invite.copy')}
            </Button>
          </>
        ) : null}
      </div>
    </BottomSheet>
  );
}

const REASONS = ['offensive', 'personal_data', 'impersonation', 'other'] as const;

/** "Naam melden" next to the squad name (art. 16 DSA; spec §3.5 step 5). */
function NameReport({ squadId, status }: { squadId: string; status: string }) {
  const { t, locale } = useT();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]>('offensive');
  const [done, setDone] = useState<string | null>(null);
  const report = useApiMutation('squads.nameReport', {
    onSuccess: () => setDone(t('squads:report.sent')),
    onError: (e) => setDone(isApiError(e, 'ALREADY_REPORTED') ? t('squads:report.status_pending') : errorText(locale, e)),
  });
  if (status === 'reported' || status === 'pending') return <span className="wp9-small">{t('squads:report.status_pending')}</span>;
  return (
    <>
      <Button variant="link" onClick={() => setOpen(true)}>
        {t('squads:report.menu')}
      </Button>
      <BottomSheet open={open} title={t('squads:report.title')} onClose={() => setOpen(false)}>
        <div className="wp9-stack">
          <p>{t('squads:report.text')}</p>
          {done ? (
            <p role="status">{done}</p>
          ) : (
            <>
              <fieldset>
                <legend>{t('squads:report.reason')}</legend>
                {REASONS.map((r) => (
                  <label key={r} className="wp9-row">
                    <input type="radio" name="report-reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
                    {t(`squads:report.${r}`)}
                  </label>
                ))}
              </fieldset>
              <Button disabled={report.isPending} onClick={() => report.mutate({ params: { id: squadId }, body: { reason } })}>
                {t('squads:report.send')}
              </Button>
            </>
          )}
        </div>
      </BottomSheet>
    </>
  );
}

function LeaveModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const leave = useApiMutation('squads.leave', {
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: apiKey('squads.mine') });
      void qc.invalidateQueries({ queryKey: apiKey('me.get') });
      onClose();
      void navigate('/squad');
    },
  });
  return (
    <Modal
      open={open}
      title={t('squads:actions.leave_title')}
      onClose={onClose}
      safe={{ label: t('squads:actions.stay'), onClick: onClose }}
      confirm={{ label: t('squads:actions.leave_confirm'), onClick: () => leave.mutate({}), danger: true }}
    >
      <p>{t('squads:actions.leave_text')}</p>
    </Modal>
  );
}

/** Small home element for F1 (WP-8): squad strip with live presence, or the empty prompt (UX §3.3 F1). */
export function SquadStrip() {
  const { t } = useT();
  const mine = useApiQuery('squads.mine', undefined, { retry: false });
  const presence = useApiQuery('squads.presence', undefined, { refetchInterval: 30_000, enabled: Boolean(mine.data) });
  if (isApiError(mine.error, 'NOT_IN_SQUAD')) return <Link to="/squad/nieuw">{t('squads:empty.text')}</Link>;
  if (!mine.data) return null;
  const active = mine.data.members.filter((m) => !m.paused).length;
  const live = presence.data?.members.filter((m) => m.focusing).length ?? 0;
  return <Link to="/squad">{t('squads:presence.line', { live, active })}</Link>;
}
