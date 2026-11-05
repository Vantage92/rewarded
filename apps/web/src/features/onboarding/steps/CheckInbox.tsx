// O4 "Check je mail" (UX §3.2): the magic link or the 6-digit code from the same mail, for devices
// where the link opens in another browser context (Home Screen app, in-app browser).
import { Email } from '@rewarded/contracts/common';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, ButtonLink, TextField } from '../../../design/index.ts';
import { useT } from '../../../i18n/index.tsx';
import { apiKey, useApiMutation } from '../../../lib/api/index.ts';
import { readDraft, updateDraft } from '../draft.ts';
import { STEP } from '../paths.ts';

const RESEND_AFTER_S = 30;

export function CheckInbox() {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const draft = readDraft();
  const [email, setEmail] = useState(draft.email);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [wait, setWait] = useState(RESEND_AFTER_S);
  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);
  const login = useApiMutation('auth.code', {
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: apiKey('me.get') });
      void navigate(res.next === '/onboarding' ? STEP.age : '/', { replace: true });
    },
    onError: (e) => {
      if (e.is('CODE_EXPIRED')) setError('onboarding:inbox.code_expired');
      else if (e.is('TOO_MANY_ATTEMPTS')) setError('onboarding:inbox.too_many');
      else setError('onboarding:inbox.code_invalid');
    },
  });
  const resend = useApiMutation('auth.magicLink', {
    onSuccess: () => {
      setNotice('onboarding:inbox.resent');
      setWait(RESEND_AFTER_S);
    },
  });
  const submit = () => {
    const c = code.replace(/\s/g, '');
    if (!/^\d{6}$/.test(c)) return setError('onboarding:inbox.code_format');
    const parsed = Email.safeParse(email.trim());
    if (!parsed.success) return setError('onboarding:email.invalid');
    setError(null);
    updateDraft({ email: parsed.data });
    login.mutate({ body: { email: parsed.data, code: c } });
  };
  return (
    <div className="onb">
      <h1>{t('onboarding:inbox.title')}</h1>
      {draft.email ? <p>{t('onboarding:inbox.sent_to', { email: draft.email })}</p> : null}
      <p className="onb-lead">{t('onboarding:inbox.instruction')}</p>
      <p className="onb-muted">{t('onboarding:inbox.validity')}</p>
      <form
        className="onb-actions"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {!draft.email ? <TextField label={t('onboarding:inbox.email')} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /> : null}
        <TextField
          label={t('onboarding:inbox.code')}
          className="onb-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={7}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={error ? t(error) : undefined}
        />
        <Button type="submit" block disabled={login.isPending}>
          {t('onboarding:inbox.go')}
        </Button>
      </form>
      {notice ? <p role="status">{t(notice)}</p> : null}
      <div className="onb-actions">
        <Button
          variant="secondary"
          block
          disabled={wait > 0 || !draft.email || resend.isPending}
          disabledReason={wait > 0 ? t('onboarding:inbox.resend_wait', { count: wait }) : undefined}
          onClick={() => {
            const d = readDraft();
            resend.mutate({ body: { email: d.email, locale, ...(d.inviteToken ? { invite_token: d.inviteToken } : {}) } });
          }}
        >
          {t('onboarding:inbox.resend')}
        </Button>
        <ButtonLink to={STEP.email} variant="link">
          {t('onboarding:inbox.other')}
        </ButtonLink>
      </div>
    </div>
  );
}
