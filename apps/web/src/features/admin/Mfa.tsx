// Second factor for admins: magic link plus a TOTP code (RFC 6238, six digits; architecture §10.8).
import { useState, type FormEvent } from 'react';
import { Button, TextField } from '../../design/index.ts';
import { useApiMutation } from '../../lib/api/index.ts';
import { ErrorNote, isApiError, Notice, useTa } from './ui.tsx';

export function MfaGate({ onVerified }: { onVerified: () => void }) {
  const { ta } = useTa();
  const [code, setCode] = useState('');
  const verify = useApiMutation('admin.mfa.verify', { onSuccess: onVerified });
  const enroll = useApiMutation('admin.mfa.enroll');
  const valid = /^\d{6}$/.test(code);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (valid) verify.mutate({ body: { code } });
  };
  return (
    <div className="adm-gate">
      <h2>{ta('mfa.title')}</h2>
      <p>{ta('mfa.intro')}</p>
      <form onSubmit={submit} noValidate>
        <TextField
          label={ta('mfa.code')}
          hint={ta('mfa.code_hint')}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          required
        />
        <Button type="submit" disabled={!valid || verify.isPending} disabledReason={valid ? undefined : ta('mfa.code_reason')}>
          {ta('mfa.submit')}
        </Button>
      </form>
      {verify.isError ? <ErrorNote error={verify.error} /> : null}
      <div className="adm-block">
        <p>{ta('mfa.enroll_intro')}</p>
        <Button variant="secondary" onClick={() => enroll.mutate({})} disabled={enroll.isPending}>
          {ta('mfa.enroll')}
        </Button>
        {enroll.isError && isApiError(enroll.error, 'FORBIDDEN') ? <Notice>{ta('mfa.already_enrolled')}</Notice> : enroll.isError ? <ErrorNote error={enroll.error} /> : null}
        {enroll.data ? (
          <div className="adm-secret">
            <p>{ta('mfa.secret_intro')}</p>
            <p>
              <code>{enroll.data.secret_base32}</code>
            </p>
            <p className="field-hint">
              <code>{enroll.data.otpauth_uri}</code>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
