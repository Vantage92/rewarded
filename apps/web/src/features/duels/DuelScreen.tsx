// Q4 Duel (UX §3.4, §6.2; spec §3.6, §4.5): seven days on met daily goals, a badge, no points,
// no minutes. A duel link outside the squad exists only for 18_plus (founder JS3, principle P10).
import type { CurrentDuelResponse, InviteDto } from '@rewarded/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { BottomSheet, Button, ButtonLink, Card, useToast } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';
import { apiKey, errorText, useApiMutation, useApiQuery } from '../../lib/api/index.ts';
import { absoluteUrl, canShare, copyText, share } from '../cards/share.ts';
import { DayDots, ErrorNote, Screen, Skeleton, formatDate, isAdult, isApiError, useMe } from '../profile/kit.tsx';

export function DuelScreen() {
  const { t } = useT();
  const me = useMe();
  const current = useApiQuery('duels.current', undefined, { retry: false });
  const none = isApiError(current.error, 'NOT_FOUND');
  const ended = current.data && (current.data.duel.status === 'expired' || current.data.duel.status === 'finished');
  return (
    <Screen title={t('duels:title')} intro={t('duels:intro')}>
      <p>{t('duels:rule')}</p>
      {current.isPending || me.isPending ? <Skeleton /> : null}
      {current.error && !none ? <ErrorNote error={current.error} onRetry={() => void current.refetch()} /> : null}
      {current.data ? <DuelStatus data={current.data} /> : null}
      {(none || ended) && me.data ? <StartDuel adult={isAdult(me.data)} rematch={Boolean(ended)} /> : null}
    </Screen>
  );
}

function DuelStatus({ data }: { data: CurrentDuelResponse }) {
  const { t, locale } = useT();
  const name = data.duel.opponent_first_name ?? t('duels:opponent');
  const day = (d: string | null) => (d ? formatDate(locale, d, { day: 'numeric', month: 'long' }) : '');
  const { status } = data.duel;
  return (
    <Card>
      {status === 'open' ? <p>{t('duels:open')}</p> : null}
      {status === 'expired' ? <p>{t('duels:expired')}</p> : null}
      {status === 'running' || status === 'pending_review' || status === 'finished' ? (
        <div className="wp9-stack">
          <p>{t('duels:running', { name, from: day(data.duel.start_day), to: day(data.duel.end_day) })}</p>
          <p className="wp9-big" data-testid="duel-totals">
            {t('duels:totals', { me: data.me_total, name, opponent: data.opponent_total })}
          </p>
          <DayDots days={data.days.map((d) => ({ day: d.day, met: d.me_met }))} label={t('duels:days_me')} />
          <DayDots days={data.days.map((d) => ({ day: d.day, met: d.opponent_met }))} label={t('duels:days_opponent', { name })} />
          {status === 'pending_review' ? <p>{t('duels:pending_review')}</p> : null}
          {status === 'finished' && data.result ? (
            <>
              <p>{t(`duels:${data.result}`, { name })}</p>
              {data.result === 'won' ? <p className="wp9-small">{t('duels:badge_private')}</p> : null}
            </>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

function StartDuel({ adult, rematch }: { adult: boolean; rematch: boolean }) {
  const { t, locale } = useT();
  const qc = useQueryClient();
  const [invite, setInvite] = useState<InviteDto | null>(null);
  const [error, setError] = useState<unknown>(null);
  const create = useApiMutation('duels.create', {
    onSuccess: (r) => {
      setInvite(r.invite);
      void qc.invalidateQueries({ queryKey: apiKey('duels.current') });
    },
    onError: setError,
  });
  if (!adult) {
    // 16_17: no duel link to the outside exists, not even greyed out (UX §3.4 Q4, principle P10).
    return (
      <Card>
        <p>{t('duels:squad_only')}</p>
        <ButtonLink to="/squad" variant="secondary">
          {t('duels:squad_link')}
        </ButtonLink>
      </Card>
    );
  }
  return (
    <Card>
      {error ? <p role="alert">{errorText(locale, error)}</p> : null}
      <Button onClick={() => create.mutate({ body: {} })} disabled={create.isPending}>
        {rematch ? t('duels:rematch') : t('duels:create_link')}
      </Button>
      {invite ? <DuelLinkSheet invite={invite} onClose={() => setInvite(null)} /> : null}
    </Card>
  );
}

function DuelLinkSheet({ invite, onClose }: { invite: InviteDto; onClose: () => void }) {
  const { t } = useT();
  const toast = useToast();
  const url = absoluteUrl(invite.url);
  const text = t('duels:link_text');
  return (
    <BottomSheet open title={t('duels:link_title')} onClose={onClose}>
      <div className="wp9-stack">
        <blockquote>
          {text} {url}
        </blockquote>
        <p className="wp9-small">{t('duels:link_validity')}</p>
        {canShare({ text, url }) ? (
          <Button block onClick={() => void share({ text, url })}>
            {t('squads:invite.share')}
          </Button>
        ) : null}
        <Button variant="secondary" block onClick={async () => (await copyText(`${text} ${url}`)) && toast.show(t('squads:invite.copied'))}>
          {t('squads:invite.copy')}
        </Button>
      </div>
    </BottomSheet>
  );
}
