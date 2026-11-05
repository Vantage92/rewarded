// V1 Verenigingschallenge and V2 Lid worden (UX §3.5, §4.5; spec §3.7, §4.6). The ranking shows
// only clubs, on participation rate, with the member count and its source next to each club; no
// person and no totals (principle P6). Earned prizes say "Verdiend", never "kans".
import type { ChallengeListItem, LeaderboardResponse } from '@rewarded/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button, ButtonLink, Card, Chip, Modal, TextField } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';
import { apiKey, errorText, useApiMutation, useApiQuery } from '../../lib/api/index.ts';
import { ErrorNote, Screen, Skeleton, formatDate, isApiError, useMe, useTrack } from '../profile/kit.tsx';

/** The club challenge to show: a running prize period first, then the warm-up ranking (spec §4.6). */
export function pickClubChallenge(items: readonly ChallengeListItem[], today: string): ChallengeListItem | undefined {
  const club = items.filter((c) => c.type !== 'performance');
  const running = (c: ChallengeListItem) => c.period.start_day <= today && today <= c.period.end_day;
  return club.find((c) => c.type === 'club_prize' && running(c)) ?? club.find((c) => c.type === 'club_warmup' && running(c)) ?? club.find((c) => c.period.end_day >= today) ?? club[0];
}

const localDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date());

export function ClubScreen() {
  const { t } = useT();
  const me = useMe();
  const club = me.data?.club;
  return (
    <Screen title={t('club:title')}>
      {me.isPending ? <Skeleton /> : null}
      {me.error ? <ErrorNote error={me.error} onRetry={() => void me.refetch()} /> : null}
      {me.data && !club ? (
        <Card>
          <p>{t('club:empty.text')}</p>
          <ButtonLink to="/vereniging/koppelen">{t('club:empty.action')}</ButtonLink>
        </Card>
      ) : null}
      {club ? (
        <>
          <p>{club.status === 'linked' ? t('club:mine', { club: club.name }) : t('club:pending', { club: club.name })}</p>
          {!me.data?.user?.institution_domain && !me.data?.user?.phone_verified ? (
            <Card>
              <p>{t('club:anchor.text')}</p>
              <ButtonLink to="/profiel#instellingsmail" variant="secondary">
                {t('club:anchor.action')}
              </ButtonLink>
            </Card>
          ) : null}
          <ClubChallenge ownClub={club.name} />
          <LeaveClub />
        </>
      ) : null}
    </Screen>
  );
}

function ClubChallenge({ ownClub }: { ownClub: string }) {
  const { t, locale } = useT();
  const list = useApiQuery('challenges.list');
  const today = useApiQuery('me.today');
  const day = today.data?.focus_day ?? localDay();
  if (list.isPending) return <Skeleton />;
  if (list.error) return <ErrorNote error={list.error} onRetry={() => void list.refetch()} />;
  const challenge = pickClubChallenge(list.data.items, day);
  const performance = list.data.items.filter((c) => c.type === 'performance');
  const dates = (c: ChallengeListItem) => ({ from: formatDate(locale, c.period.start_day, { day: 'numeric', month: 'long' }), to: formatDate(locale, c.period.end_day, { day: 'numeric', month: 'long' }) });
  return (
    <>
      {challenge ? (
        <>
          <p>{challenge.type === 'club_warmup' ? t('club:period.club_warmup') : t('club:period.club_prize', dates(challenge))}</p>
          {challenge.prize ? (
            <Card title={t('club:prize.title')}>
              <p className="wp9-row">
                <span>{challenge.prize.description}</span>
                <Chip tone="earned">{t('club:prize.earned')}</Chip>
              </p>
            </Card>
          ) : null}
          <Leaderboard challenge={challenge} ownClub={ownClub} />
        </>
      ) : (
        <p>{t('club:board.none')}</p>
      )}
      <HowWeCount />
      {performance.length ? (
        <Card title={t('club:challenges.title')}>
          <ul className="wp9-items">
            {performance.map((c) => (
              <li key={c.id}>
                <Link to={`/challenges/${c.id}`} aria-label={t('club:challenges.open', { title: c.title })}>
                  {c.title}
                </Link>{' '}
                <span className="wp9-small">{t('club:period.dates', dates(c))}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}

export function Leaderboard({ challenge, ownClub }: { challenge: ChallengeListItem; ownClub?: string }) {
  const board = useApiQuery('leaderboards.get', { params: { challenge_id: challenge.id } });
  const track = useTrack();
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current || !board.data?.pools[0]) return;
    sent.current = true;
    track({ name: 'leaderboard_viewed', props: { poule: board.data.pools[0].pool, periode: challenge.type } });
  }, [board.data, challenge.type, track]);
  if (board.isPending) return <Skeleton />;
  if (board.error) return <ErrorNote error={board.error} onRetry={() => void board.refetch()} />;
  return <LeaderboardView data={board.data} ownClub={ownClub} />;
}

export function LeaderboardView({ data, ownClub }: { data: LeaderboardResponse; ownClub?: string | undefined }) {
  const { t, locale } = useT();
  const pct = (r: number) => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(r);
  const min = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
  const pools = data.pools.filter((p) => p.rows.length);
  return (
    <Card title={t('club:board.title')} action={<Chip tone="neutral">{data.is_final ? t('club:board.final') : t('club:board.provisional')}</Chip>}>
      {!data.is_final ? <p className="wp9-small">{t('club:board.provisional_note')}</p> : null}
      {!pools.length ? <p>{t('club:board.empty')}</p> : null}
      {pools.map((pool) => (
        <section key={pool.pool} aria-label={t('club:board.pool', { pool: pool.pool })}>
          <h3>{t('club:board.pool', { pool: pool.pool })}</h3>
          <ol className="wp9-items">
            {pool.rows.map((row) => {
              const own = ownClub !== undefined && row.club_name === ownClub;
              return (
                <li key={row.club_name} className={own ? 'wp9-own' : undefined} aria-current={own ? 'true' : undefined}>
                  <div className="wp9-row">
                    <span>{t('club:board.rank', { rank: row.rank })}</span>
                    <strong>{row.club_name}</strong>
                    {own ? <Chip tone="live">{t('club:board.own')}</Chip> : null}
                    <span>{t('club:board.rate', { rate: pct(row.participation_rate) })}</span>
                  </div>
                  <p className="wp9-small">
                    {t('club:board.members', { count: row.declared_members, source: row.members_source_kind })} · {t('club:board.intensity', { min: min(row.intensity_min) })}
                  </p>
                  {!row.prize_eligible ? <p className="wp9-small">{t('club:board.no_prize')}</p> : null}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </Card>
  );
}

function HowWeCount() {
  const { t } = useT();
  return (
    <details>
      <summary>{t('club:how.title')}</summary>
      <ul>
        <li>{t('club:how.rate')}</li>
        <li>{t('club:how.intensity')}</li>
        <li>{t('club:how.anchor')}</li>
        <li>{t('club:how.members')}</li>
        <li>{t('club:how.exam')}</li>
      </ul>
    </details>
  );
}

function LeaveClub() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const leave = useApiMutation('clubs.leave', {
    onSuccess: () => {
      setOpen(false);
      void qc.invalidateQueries({ queryKey: apiKey('me.get') });
    },
  });
  return (
    <>
      <Button variant="link" onClick={() => setOpen(true)}>
        {t('club:leave.action')}
      </Button>
      <Modal
        open={open}
        title={t('club:leave.title')}
        onClose={() => setOpen(false)}
        safe={{ label: t('club:leave.cancel'), onClick: () => setOpen(false) }}
        confirm={{ label: t('club:leave.confirm'), onClick: () => leave.mutate({}), danger: true }}
      >
        <p>{t('club:leave.text')}</p>
      </Modal>
    </>
  );
}

/** V2: link with a code (or a QR that opened /vereniging/koppelen?code=…&bron=…). */
export function JoinClubScreen() {
  const { t, locale } = useT();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [code, setCode] = useState((params.get('code') ?? '').toUpperCase());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  useMe();
  const qr = params.get('bron');
  const join = useApiMutation('clubs.join', {
    onSuccess: (r) => {
      setError(undefined);
      setMessage(r.status === 'linked' ? t('club:join.linked', { club: r.club.name }) : t('club:join.pending'));
      void qc.invalidateQueries({ queryKey: apiKey('me.get') });
    },
    onError: (e) => setError(isApiError(e, 'CODE_INVALID') || isApiError(e, 'VALIDATION_FAILED') ? t('club:join.invalid') : isApiError(e, 'ALREADY_LINKED') ? t('club:join.already') : errorText(locale, e)),
  });
  const valid = /^[A-Z0-9]{4,12}$/.test(code);
  return (
    <Screen title={t('club:join.title')} intro={t('club:join.privacy')}>
      {message ? (
        <Card>
          <p role="status">{message}</p>
          <Button onClick={() => void navigate('/vereniging')}>{t('club:title')}</Button>
        </Card>
      ) : (
        <form
          className="wp9-stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return setError(t('club:join.invalid'));
            join.mutate({ body: { code, ...(qr && /^[a-z0-9_-]{1,32}$/.test(qr) ? { qr_source: qr } : {}) } });
          }}
        >
          <TextField label={t('club:join.code')} hint={t('club:join.code_hint')} value={code} autoCapitalize="characters" maxLength={12} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))} error={error} />
          <Button type="submit" disabled={join.isPending}>
            {t('club:join.submit')}
          </Button>
        </form>
      )}
    </Screen>
  );
}
