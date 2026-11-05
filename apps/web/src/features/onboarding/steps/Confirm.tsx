// /auth/bevestig#t=… (architecture §10.1): the token sits in the URL fragment and is only spent by
// the tap on "Inloggen", so a mail scanner that fetches the link does not use it up.
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Button, ButtonLink } from '../../../design/index.ts';
import { useT } from '../../../i18n/index.tsx';
import { apiKey, useApiMutation } from '../../../lib/api/index.ts';
import { STEP } from '../paths.ts';

export function tokenFromHash(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const tok = params.get('t') ?? params.get('token');
  return tok && /^[A-Za-z0-9_-]{16,128}$/.test(tok) ? tok : null;
}

export function Confirm() {
  const { t } = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [token] = useState(() => tokenFromHash(location.hash || (typeof window === 'undefined' ? '' : window.location.hash)));
  const [failed, setFailed] = useState(false);
  const confirm = useApiMutation('auth.confirm', {
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: apiKey('me.get') });
      void navigate(res.next === '/onboarding' ? STEP.age : '/', { replace: true });
    },
    onError: () => setFailed(true),
  });
  return (
    <div className="onb">
      <h1>{t('onboarding:confirm.title')}</h1>
      {!token ? (
        <p role="alert">{t('onboarding:confirm.missing')}</p>
      ) : failed ? (
        <>
          <p role="alert">{t('onboarding:confirm.invalid')}</p>
          <ButtonLink to="/login" block>
            {t('onboarding:confirm.again')}
          </ButtonLink>
        </>
      ) : (
        <>
          <p>{t('onboarding:confirm.intro')}</p>
          <Button block disabled={confirm.isPending} onClick={() => confirm.mutate({ body: { token } })}>
            {t('onboarding:confirm.button')}
          </Button>
        </>
      )}
    </div>
  );
}
