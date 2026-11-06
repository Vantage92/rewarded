// P2 Privacy en gegevens, P3 Alle voorwaarden, R1 Persoonlijke link (flag) and B8 Plus (fake door,
// web build only) (UX §3.6, §3.7; spec §4.9, §4.10; architecture §10.7).
import { useState } from 'react';
import { Link } from 'react-router';
import { Button, Card, Modal, TextField, useToast } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';
import { errorText, useApi, useApiMutation, useApiQuery } from '../../lib/api/index.ts';
import { absoluteUrl, canShare, copyText, share } from '../cards/share.ts';
import { downloadBlob } from '../cards/rasterize.ts';
import { ErrorNote, Screen, Skeleton, isApiError, useMe } from './kit.tsx';

const Back = () => {
  const { t } = useT();
  return <Link to="/profiel">{t('actions.back')}</Link>;
};

export function PrivacyScreen() {
  const { t, locale } = useT();
  useMe();
  const api = useApi();
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [deleted, setDeleted] = useState(false);
  const del = useApiMutation('privacy.deleteMe', {
    onSuccess: () => {
      setOpen(false);
      setDeleted(true);
    },
    onError: (e) => setNote(errorText(locale, e)),
  });
  const download = async () => {
    try {
      const file = await api.call('privacy.export');
      downloadBlob(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }), t('profile:privacy.file_name'));
      setNote(t('profile:privacy.download_done'));
    } catch (e) {
      setNote(errorText(locale, e));
    }
  };
  // The profile owns the single h1 (shell test: /profiel/privacy shows "Profiel"); the page title is h2.
  return (
    <Screen title={t('profile:title')}>
      <h2>{t('profile:privacy.title')}</h2>
      {deleted ? (
        <p role="status">{t('profile:privacy.deleted')}</p>
      ) : (
        <>
          <p>{t('profile:privacy.logged')}</p>
          <p>{t('profile:privacy.retention')}</p>
          <p>{t('profile:privacy.age')}</p>
          {note ? <p role="status">{note}</p> : null}
          <div className="wp9-row">
            <Button variant="secondary" onClick={() => void download()}>
              {t('profile:privacy.download')}
            </Button>
            <Button variant="danger" onClick={() => setOpen(true)}>
              {t('profile:privacy.delete')}
            </Button>
          </div>
          <Modal
            open={open}
            title={t('profile:privacy.delete_title')}
            onClose={() => setOpen(false)}
            safe={{ label: t('profile:privacy.delete_cancel'), onClick: () => setOpen(false) }}
            confirm={{ label: t('profile:privacy.delete_confirm'), danger: true, onClick: () => typed.trim() === 'VERWIJDER' && del.mutate({ body: { confirm: 'VERWIJDER' } }) }}
          >
            <p>{t('profile:privacy.delete_text')}</p>
            <TextField label={t('profile:privacy.delete_label')} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </Modal>
        </>
      )}
      <Back />
    </Screen>
  );
}

const TERMS = ['ratio', 'cap', 'earn_in', 'weekly', 'catalog', 'season', 'night', 'exam', 'verification', 'challenge'] as const;

export function TermsScreen() {
  const { t } = useT();
  return (
    <Screen title={t('profile:title')}>
      <h2>{t('profile:terms.title')}</h2>
      <ul>
        {TERMS.map((k) => (
          <li key={k}>{t(`profile:terms.${k}`)}</li>
        ))}
      </ul>
      <Back />
    </Screen>
  );
}

export function ReferralScreen() {
  const { t } = useT();
  const me = useMe();
  const toast = useToast();
  const on = me.data?.flags.referral ?? false;
  const mine = useApiQuery('referral.mine', undefined, { enabled: on, retry: false });
  const link = mine.data?.link ? absoluteUrl(mine.data.link) : undefined;
  const text = t('profile:referral.share_text');
  const [now] = useState(() => Date.now());
  const daysLeft = (deadline: string) => Math.max(0, Math.ceil((Date.parse(deadline) - now) / 86_400_000));
  return (
    <Screen title={t('profile:title')}>
      <h2>{t('profile:referral.title')}</h2>
      {me.data && (!on || isApiError(mine.error, 'FEATURE_DISABLED')) ? <p>{t('profile:referral.off')}</p> : null}
      {on && mine.isPending ? <Skeleton /> : null}
      {mine.error && !isApiError(mine.error, 'FEATURE_DISABLED') ? <ErrorNote error={mine.error} /> : null}
      {mine.data ? (
        <>
          <p>{t('profile:referral.explain')}</p>
          {link ? (
            <div className="wp9-row">
              {canShare({ text, url: link }) ? <Button onClick={() => void share({ text, url: link })}>{t('profile:referral.share')}</Button> : null}
              <Button variant="secondary" onClick={async () => (await copyText(`${text} ${link}`)) && toast.show(t('squads:invite.copied'))}>
                {t('profile:referral.copy')}
              </Button>
            </div>
          ) : null}
          <Card>
            {mine.data.pending.length ? (
              <ul>
                {mine.data.pending.map((p, i) => (
                  <li key={`${p.first_name}-${i}`}>
                    {daysLeft(p.deadline) > 0 ? t('profile:referral.progress', { name: p.first_name, done: p.sessions_done, days: daysLeft(p.deadline) }) : t('profile:referral.lapsed', { name: p.first_name })}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t('profile:referral.none')}</p>
            )}
          </Card>
        </>
      ) : null}
      <Back />
    </Screen>
  );
}

/** B8: interest measurement only; the euro amount here is a subscription price, not a point value (UX principle P7). */
export function PlusScreen() {
  const { t, locale } = useT();
  const me = useMe();
  const [answer, setAnswer] = useState<string | null>(null);
  const interest = useApiMutation('me.plusInterest', {
    onSuccess: () => setAnswer(t('points:plus.thanks')),
    onError: (e) => setAnswer(errorText(locale, e)),
  });
  const on = me.data?.flags.plus_door ?? false;
  return (
    <Screen title={t('profile:title')}>
      <h2>{t('points:plus.title')}</h2>
      {me.data && !on ? <p>{t('points:plus.off')}</p> : null}
      {on ? (
        <>
          <p>{t('points:plus.text')}</p>
          <p className="wp9-small">{t('points:plus.now')}</p>
          {answer ? (
            <p role="status">{answer}</p>
          ) : (
            <div className="wp9-row">
              <Button onClick={() => interest.mutate({})} disabled={interest.isPending}>
                {t('points:plus.yes')}
              </Button>
              <Button variant="secondary" onClick={() => setAnswer(t('points:plus.declined'))}>
                {t('points:plus.no')}
              </Button>
            </div>
          )}
        </>
      ) : null}
      <Back />
    </Screen>
  );
}
