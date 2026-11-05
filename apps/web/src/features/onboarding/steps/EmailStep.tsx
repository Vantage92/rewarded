// O3 E-mail (UX §3.2) and /login: an account without a password. The server keeps the invitation
// with the magic-link request (UX §4.1 step 3) and always answers 202 (architecture §10.1).
import { Email } from '@rewarded/contracts/common';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, ButtonLink, TextField } from '../../../design/index.ts';
import { useT } from '../../../i18n/index.tsx';
import { useApiMutation } from '../../../lib/api/index.ts';
import { readDraft, updateDraft } from '../draft.ts';
import { STEP } from '../paths.ts';

export function EmailForm({ withNames }: { withNames: boolean }) {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const draft = readDraft();
  const [email, setEmail] = useState(draft.email);
  const [first, setFirst] = useState(draft.firstName);
  const [last, setLast] = useState(draft.lastName);
  const [error, setError] = useState<{ field: 'email' | 'first' | 'form'; key: string } | null>(null);
  const send = useApiMutation('auth.magicLink', {
    onSuccess: () => void navigate(STEP.inbox),
    onError: (e) => {
      if (e.is('RATE_LIMITED')) setError({ field: 'form', key: 'onboarding:email.rate_limited' });
      else if (e.is('INVITE_REQUIRED')) setError({ field: 'form', key: 'onboarding:email.invite_required' });
      else if (e.is('VALIDATION_FAILED')) setError({ field: 'email', key: 'onboarding:email.invalid' });
      else setError({ field: 'form', key: 'onboarding:email.failed' });
    },
  });
  const submit = () => {
    const parsed = Email.safeParse(email.trim());
    if (!parsed.success) return setError({ field: 'email', key: 'onboarding:email.invalid' });
    if (withNames && !first.trim()) return setError({ field: 'first', key: 'onboarding:email.first_name_required' });
    setError(null);
    const d = updateDraft({ email: parsed.data, ...(withNames ? { firstName: first.trim(), lastName: last.trim() } : {}) });
    send.mutate({ body: { email: parsed.data, locale, ...(d.inviteToken ? { invite_token: d.inviteToken } : {}) } });
  };
  return (
    <form
      className="onb-actions"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <TextField
        label={t('onboarding:email.email')}
        type="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error?.field === 'email' ? t(error.key) : undefined}
      />
      {withNames ? (
        <>
          <TextField
            label={t('onboarding:email.first_name')}
            autoComplete="given-name"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            error={error?.field === 'first' ? t(error.key) : undefined}
          />
          <TextField label={t('onboarding:email.last_name')} autoComplete="family-name" optional value={last} onChange={(e) => setLast(e.target.value)} />
        </>
      ) : null}
      {error?.field === 'form' ? (
        <p role="alert">
          {t(error.key)} {error.key.endsWith('invite_required') ? <ButtonLink to="/wachtlijst" variant="link">{t('onboarding:welcome.waitlist')}</ButtonLink> : null}
        </p>
      ) : null}
      <Button type="submit" block disabled={send.isPending}>
        {t('onboarding:email.send')}
      </Button>
    </form>
  );
}

export function EmailStep() {
  const { t } = useT();
  return (
    <div className="onb">
      <h1>{t('onboarding:email.title')}</h1>
      <p className="onb-muted">{t('onboarding:email.intro')}</p>
      <EmailForm withNames />
    </div>
  );
}

export function LoginPage() {
  const { t } = useT();
  return (
    <div className="onb">
      <h1>{t('onboarding:login.title')}</h1>
      <p className="onb-muted">{t('onboarding:login.intro')}</p>
      <EmailForm withNames={false} />
      <p className="onb-muted">{t('onboarding:login.new')}</p>
    </div>
  );
}
