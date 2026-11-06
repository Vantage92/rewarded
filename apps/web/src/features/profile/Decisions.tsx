// Meldingen in Ik (F8, P4; spec §6.4, §6.5; UX §6.2 "Besluiten"): every decision about the own
// sessions or account in plain language per reason code, with [Beroep instellen] within 14 days.
// The blocked screen (spec §6.5, art. 22 AVG) shows the same list, plus export and delete.
import type { MyDecision } from '@rewarded/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button, Card, Modal, useToast } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';
import { apiKey, errorText, useApi, useApiMutation, useApiQuery } from '../../lib/api/index.ts';
import { createIdbStore } from '../../platform/storage.ts';
import { ErrorNote, Screen, Skeleton, formatDate } from './kit.tsx';

/** The decisions list; `id="meldingen"` so the toast after "Klopt dit niet?" can point here. */
export function DecisionsCard() {
  const { t } = useT();
  const mine = useApiQuery('appeals.mine', undefined, { retry: false });
  return (
    <Card title={t('profile:decisions.title')}>
      <div id="meldingen">
        {mine.isPending ? <Skeleton lines={2} /> : null}
        {mine.error ? <ErrorNote error={mine.error} onRetry={() => void mine.refetch()} /> : null}
        {mine.data && mine.data.items.length === 0 ? <p>{t('profile:decisions.empty')}</p> : null}
        {mine.data?.items.length ? (
          <ul className="wp9-items">
            {mine.data.items.map((d) => (
              <DecisionRow key={d.flag_id} d={d} />
            ))}
          </ul>
        ) : null}
      </div>
    </Card>
  );
}

const KNOWN_REASONS = new Set([
  'no_evidence', 'pattern_explained', 'shared_network', 'outage_confirmed', 'late_log_valid', 'false_positive',
  'automation', 'multiple_accounts', 'shared_device', 'unattended_device', 'implausible_pattern', 'clock_manipulation', 'incomplete_evidence',
  'fraud_confirmed', 'repeat_offence', 'blocked_phone_reuse',
]);

function DecisionRow({ d }: { d: MyDecision }) {
  const { t, locale } = useT();
  const [open, setOpen] = useState(false);
  const text =
    d.status === 'open'
      ? t('profile:decisions.open')
      : d.reason_code && KNOWN_REASONS.has(d.reason_code)
        ? t(`profile:decisions.reason.${d.reason_code}`)
        : t('profile:decisions.reason.other');
  return (
    <li>
      <p>{text}</p>
      {d.decided_at ? <p className="wp9-small">{t('profile:decisions.on', { date: formatDate(locale, d.decided_at) })}</p> : null}
      {d.appeal?.status === 'open' ? <p className="wp9-small">{t('profile:decisions.appeal_open')}</p> : null}
      {d.appeal?.outcome === 'upheld' ? <p>{t('profile:decisions.appeal_upheld')}</p> : null}
      {d.appeal?.outcome === 'rejected' ? <p>{t('profile:decisions.appeal_denied', { motivation: d.appeal.motivation ?? '' })}</p> : null}
      {d.appeal_until ? (
        <>
          <p className="wp9-small">{t('profile:decisions.appeal_until', { date: formatDate(locale, d.appeal_until) })}</p>
          <Button variant="secondary" onClick={() => setOpen(true)}>
            {t('profile:decisions.appeal')}
          </Button>
          <AppealModal d={d} open={open} onClose={() => setOpen(false)} />
        </>
      ) : null}
    </li>
  );
}

function AppealModal({ d, open, onClose }: { d: MyDecision; open: boolean; onClose: () => void }) {
  const { t, locale } = useT();
  const qc = useQueryClient();
  const toast = useToast();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const create = useApiMutation('appeals.create', {
    onSuccess: () => {
      onClose();
      toast.show(t('profile:decisions.appeal_sent'));
      void qc.invalidateQueries({ queryKey: apiKey('appeals.mine') });
    },
    onError: (e) => setError(errorText(locale, e)),
  });
  const valid = text.trim().length >= 2;
  return (
    <Modal
      open={open}
      title={t('profile:decisions.appeal_title')}
      onClose={onClose}
      safe={{ label: t('profile:decisions.appeal_cancel'), onClick: onClose }}
      confirm={{ label: t('profile:decisions.appeal_send'), onClick: () => valid && create.mutate({ body: { object_type: d.kind === 'block' ? 'block' : 'flag', object_id: d.flag_id, text: text.trim() } }) }}
    >
      <p>{t('profile:decisions.appeal_text')}</p>
      <label className="wp9-stack">
        <span>{t('profile:decisions.appeal_label')}</span>
        <textarea value={text} maxLength={2000} rows={5} onChange={(e) => setText(e.target.value)} />
      </label>
      {error ? <p role="alert">{error}</p> : null}
    </Modal>
  );
}

/** Account blocked: restricted session; appeal, export and delete still work (spec §6.5). */
export function BlockedScreen() {
  const { t } = useT();
  return (
    <Screen title={t('profile:blocked.title')} intro={t('profile:blocked.intro')}>
      <DecisionsCard />
      <Card>
        <p>{t('profile:blocked.rights')}</p>
        <Link to="/profiel/privacy">{t('profile:blocked.privacy')}</Link>
      </Card>
      <LogoutButton />
    </Screen>
  );
}

/** Logout (P1): ends the session on the server and empties the local session data (shared computers). */
export function LogoutButton() {
  const { t } = useT();
  const api = useApi();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const logout = async () => {
    setBusy(true);
    try {
      await api.call('auth.logout');
    } catch {
      // Logged out on the server or offline: the local data goes anyway.
    }
    const kv = createIdbStore();
    await Promise.all((['active_session', 'outbox', 'cache'] as const).map((s) => kv.clear(s).catch(() => undefined)));
    qc.clear();
    window.location.assign('/login');
  };
  return (
    <Button variant="secondary" onClick={() => void logout()} disabled={busy}>
      {t('profile:logout')}
    </Button>
  );
}
