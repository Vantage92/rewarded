// /wachtlijst and /wachtlijst/groep/:token (architecture §9.1, rapport 04 §9 "wachtlijstversie"):
// the hero per arm of the hook test, three blocks, the squads-first call to action and the form.
// POST /waitlist always answers 202 (it does not reveal whether an address is known).
import { Email } from '@rewarded/contracts/common';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { Banner, Button, Card, TextField } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';
import { useApiMutation } from '../../lib/api/index.ts';
import { newIdempotencyKey } from '../../platform/transport.ts';
import { assignHookArm, hookReporter, sourceFrom, utmFrom, type HookArm } from './hook.ts';
import './waitlist.css';

export const WAITLIST_CONSENT_VERSION = 'privacy-0.3';

export function WaitlistPage() {
  const { t, locale } = useT();
  const { token } = useParams();
  const { search } = useLocation();
  const arm: HookArm = useMemo(() => assignHookArm(search), [search]);
  const utm = useMemo(() => utmFrom(search), [search]);
  const reported = useRef(false);
  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    hookReporter().exposure(arm, utm);
  }, [arm, utm]);
  const [email, setEmail] = useState('');
  const [club, setClub] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<'squad' | 'solo' | null>(null);
  const key = useRef<string | null>(null);
  const join = useApiMutation('waitlist.join', {
    onError: (e) => setError(e.is('RATE_LIMITED') ? 'waitlist:rate_limited' : e.is('VALIDATION_FAILED') ? 'waitlist:invalid_email' : 'waitlist:failed'),
  });
  const submit = (withFriends: boolean) => {
    const parsed = Email.safeParse(email.trim());
    if (!parsed.success) return setError('waitlist:invalid_email');
    if (!consent) return setError('waitlist:consent_needed');
    setError(null);
    // One key per sign-up, reused when the student taps again after a lost answer.
    key.current ??= newIdempotencyKey();
    join.mutate(
      {
        body: {
          email: parsed.data,
          locale,
          source: sourceFrom(search),
          ...(token && /^[A-Za-z0-9_-]{8,64}$/.test(token) ? { group_token: token } : {}),
          ...(club.trim() ? { club_hint: club.trim().slice(0, 80) } : {}),
          consent_version: WAITLIST_CONSENT_VERSION,
        },
        idempotencyKey: key.current,
      },
      {
        onSuccess: () => {
          hookReporter().signup(arm, withFriends || Boolean(token), utm);
          setDone(withFriends || token ? 'squad' : 'solo');
        },
      },
    );
  };
  return (
    <div className="wl" data-hook-arm={arm}>
      <h1 className="wl-eyebrow">{t('waitlist:title')}</h1>
      <p className="wl-hero">{arm === 'F' ? t('waitlist:hero.f') : t('waitlist:hero.g')}</p>
      <p className="wl-sub">{arm === 'F' ? t('waitlist:hero.f_sub') : t('waitlist:hero.g_sub')}</p>
      {arm === 'G' ? <p className="wl-no-money">{t('waitlist:hero.g_no_money')}</p> : null}
      {token ? <Banner tone="info">{t('waitlist:group_banner')}</Banner> : null}
      {done ? (
        <Card title={t('waitlist:done_title')} level={2}>
          <p role="status">{done === 'squad' ? t('waitlist:done_squad') : t('waitlist:done_solo')}</p>
        </Card>
      ) : (
        <form
          className="wl-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit(true);
          }}
        >
          <Card title={t('waitlist:cta_title')} level={2}>
            <p>{t('waitlist:cta')}</p>
          </Card>
          <TextField label={t('waitlist:email')} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label={t('waitlist:club')} optional value={club} onChange={(e) => setClub(e.target.value)} />
          <label className="wl-check">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>{t('waitlist:consent')}</span>
          </label>
          {error ? <p role="alert">{t(error)}</p> : null}
          <Button type="submit" block disabled={join.isPending}>
            {t('waitlist:start_squad')}
          </Button>
          <Button variant="secondary" block disabled={join.isPending} onClick={() => submit(false)}>
            {t('waitlist:solo')}
          </Button>
          <p className="wl-small">{t('waitlist:small')}</p>
        </form>
      )}
      <section className="wl-blocks">
        <Card title={t('waitlist:block1_title')} level={2}>
          <p>{t('waitlist:block1')}</p>
        </Card>
        <Card title={t('waitlist:block2_title')} level={2}>
          <p>{t('waitlist:block2')}</p>
          <p className="wl-small">{t('waitlist:block2_note')}</p>
        </Card>
        <Card title={t('waitlist:block3_title')} level={2}>
          <p>{t('waitlist:block3')}</p>
        </Card>
      </section>
    </div>
  );
}
