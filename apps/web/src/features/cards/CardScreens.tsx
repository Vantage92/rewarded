// K1 Kaart maken and K2 Verificatiepagina (UX §3.7, §4.8, §6.2; spec §3.10, §4.8). A card never
// shows points, amounts, rewards, draws or ranking positions; sharing earns nothing. The
// verification page also says what it does not show, without clock times (UX §6.2 proposal).
import type { CardFormat, CardKind, CreateCardResponse } from '@rewarded/contracts';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { Button, ButtonLink, Card, Segment, Switch } from '../../design/index.ts';
import { hasKey, useT } from '../../i18n/index.tsx';
import { errorText, useApi, useApiMutation, useApiQuery } from '../../lib/api/index.ts';
import { ErrorNote, Screen, Skeleton, formatDate, isApiError, useMe, useTrack } from '../profile/kit.tsx';
import { downloadBlob, rasterizeSvg, svgDataUrl } from './rasterize.ts';
import { share } from './share.ts';

const KINDS: readonly CardKind[] = ['session', 'streak', 'week', 'belofte'];

export interface CardMakerProps {
  /** Replaceable for tests (jsdom has no canvas). */
  rasterize?: typeof rasterizeSvg;
}

export function CardMakerScreen({ rasterize = rasterizeSvg }: CardMakerProps) {
  const { t, locale } = useT();
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const kindParam = params.get('soort') as CardKind | null;
  const kind: CardKind = kindParam && KINDS.includes(kindParam) ? kindParam : 'session';
  const me = useMe();
  const api = useApi();
  const track = useTrack();
  const squadNameAllowed = me.data?.settings?.squad_name_on_cards ?? false;
  const [firstName, setFirstName] = useState(true);
  const [streak, setStreak] = useState(true);
  const [squadName, setSquadName] = useState(false);
  const [format, setFormat] = useState<CardFormat>('9x16');
  const [card, setCard] = useState<CreateCardResponse | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [revoked, setRevoked] = useState(false);

  const fields = { first_name: firstName, streak, duration: true, ...(squadNameAllowed ? { squad_name: squadName } : {}) };
  const onFields = (Object.entries(fields) as [keyof typeof fields, boolean][]).filter(([, on]) => on).map(([k]) => k);

  const loadImage = async (cardId: string, f: CardFormat) => setSvg(await api.call('cards.image', { params: { id: cardId }, query: { format: f } }));
  const create = useApiMutation('cards.create', {
    onSuccess: async (r) => {
      setCard(r);
      setNote(null);
      try {
        await loadImage(r.card_id, format);
      } catch (e) {
        setNote(errorText(locale, e));
      }
    },
    onError: (e) => setNote(isApiError(e, 'SESSION_UNDER_REVIEW') ? t('cards:make.under_review') : errorText(locale, e)),
  });
  const revoke = useApiMutation('cards.delete', { onSuccess: () => setRevoked(true) });

  const png = async () => rasterize(svg ?? '', format);
  const onShare = async () => {
    if (!card || !svg) return;
    track({ name: 'card_share_opened', props: { card_id: card.card_id, aanleiding: kind, velden_aan: onFields } });
    try {
      const file = new File([await png()], t('cards:make.file_name'), { type: 'image/png' });
      const outcome = await share({ files: [file], title: t('cards:make.share_title') });
      if (outcome === 'unsupported') setNote(t('cards:make.no_share'));
    } catch {
      setNote(t('cards:make.no_share'));
    }
  };
  const onSave = async () => {
    try {
      downloadBlob(await png(), t('cards:make.file_name'));
    } catch (e) {
      setNote(errorText(locale, e));
    }
  };

  return (
    <Screen title={t('cards:title')} intro={t('cards:make.intro')}>
      {revoked ? (
        <p role="status">{t('cards:make.revoked')}</p>
      ) : (
        <>
          <Card>
            <Switch label={t('cards:make.first_name')} checked={firstName} onChange={setFirstName} />
            <Switch label={t('cards:make.streak')} checked={streak} onChange={setStreak} />
            <Switch label={t('cards:make.squad_name')} checked={squadNameAllowed && squadName} onChange={setSquadName} disabled={!squadNameAllowed} description={squadNameAllowed ? undefined : t('cards:make.squad_name_off')} />
            <p className="wp9-small">{t('cards:make.duration')}</p>
            <p className="wp9-small">{t('cards:make.never')}</p>
            <Segment
              label={t('cards:make.format')}
              options={[
                { value: '9x16', label: t('cards:make.story') },
                { value: '1x1', label: t('cards:make.square') },
              ]}
              value={format}
              onChange={(f) => {
                setFormat(f);
                if (card) void loadImage(card.card_id, f).catch(() => undefined);
              }}
            />
            {!card ? (
              <Button onClick={() => create.mutate({ body: { kind, ref_id: id, fields } })} disabled={create.isPending || !id}>
                {create.isPending ? t('cards:make.busy') : t('cards:make.create')}
              </Button>
            ) : null}
          </Card>
          {note ? <p role="status">{note}</p> : null}
          {card && !svg && !note ? <Skeleton lines={4} /> : null}
          {card && svg ? (
            <div className="wp9-stack">
              <figure className="wp9-preview">
                <img src={svgDataUrl(svg)} alt={t('cards:make.preview')} />
              </figure>
              <div className="wp9-row">
                <Button onClick={() => void onShare()}>{t('cards:make.share')}</Button>
                <Button variant="secondary" onClick={() => void onSave()}>
                  {t('cards:make.save')}
                </Button>
              </div>
              <Button variant="link" onClick={() => revoke.mutate({ params: { id: card.card_id } })} disabled={revoke.isPending}>
                {t('cards:make.revoke')}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </Screen>
  );
}

/** Maps the API statement key ("cards.verify.statement_session") to this namespace. */
export function statementKey(apiKey: string): string {
  const key = apiKey.startsWith('cards.') ? `cards:${apiKey.slice('cards.'.length)}` : `cards:${apiKey}`;
  return hasKey('nl', key) ? key : 'cards:verify.statement';
}

export function VerifyScreen() {
  const { t, locale } = useT();
  const { token = '' } = useParams();
  const verify = useApiQuery('verify.get', { params: { token } }, { retry: false, enabled: token.length > 0 });
  const unavailable = isApiError(verify.error, 'CARD_UNAVAILABLE') || isApiError(verify.error, 'NOT_FOUND') || isApiError(verify.error, 'VALIDATION_FAILED');
  const d = verify.data;
  useNoIndex();
  return (
    <Screen title={t('cards:verify.title')}>
      {verify.isPending && token ? <Skeleton /> : null}
      {unavailable || !token ? <p>{t('cards:verify.unavailable')}</p> : verify.error ? <ErrorNote error={verify.error} onRetry={() => void verify.refetch()} /> : null}
      {d ? (
        <Card title={t('cards:verify.of', { name: d.first_name })}>
          <p data-testid="verify-statement">
            {t(statementKey(d.statement_key), { duration: d.duration_min, date: formatDate(locale, d.from), from: formatDate(locale, d.from, { day: 'numeric', month: 'long' }), to: formatDate(locale, d.to, { day: 'numeric', month: 'long' }) })}
          </p>
          {d.streak !== undefined ? <p>{t('cards:verify.streak', { count: d.streak })}</p> : null}
        </Card>
      ) : null}
      {d ? <ButtonLink to={d.focus_ook_url}>{t('cards:verify.focus_too')}</ButtonLink> : null}
    </Screen>
  );
}

/** The verification page is noindex (spec §4.8); the server header covers crawlers without JS. */
function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.append(meta);
    return () => meta.remove();
  }, []);
}
