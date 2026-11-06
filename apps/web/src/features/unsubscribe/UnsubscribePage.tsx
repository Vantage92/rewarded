// One-click unsubscribe (P5, UX §4.9; spec §4.9): the token comes from the URL hash (never sent to
// the server as a URL, so not in proxy logs), is posted once, and the page confirms in NL or EN.
import { useEffect, useRef, useState } from 'react';
import { ButtonLink } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';
import { useApi } from '../../lib/api/index.ts';

type Kind = 'reminders' | 'waitlist';
type State = 'busy' | 'done' | 'invalid';

export function tokenFromHash(hash: string): string | null {
  const m = /(?:^#|&)t=([A-Za-z0-9_-]{16,128})/.exec(hash);
  return m ? m[1]! : null;
}

export function UnsubscribePage({ kind }: { kind: Kind }) {
  const { t } = useT();
  const api = useApi();
  const [token] = useState(() => tokenFromHash(window.location.hash));
  const [state, setState] = useState<State>(token ? 'busy' : 'invalid');
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current || !token) return;
    sent.current = true;
    // A first GET gives the browser its CSRF cookie (the mail link opens a fresh page).
    const post = () => (kind === 'reminders' ? api.call('reminders.unsubscribe', { body: { token } }) : api.call('waitlist.unsubscribe', { body: { token } }));
    const call = api.call('me.get').catch(() => undefined).then(post);
    void call.then(
      () => setState('done'),
      () => setState('invalid'),
    );
  }, [api, kind, token]);
  return (
    <div className="onb">
      <h1>{t(`unsubscribe:${kind}.title`)}</h1>
      <p role="status">{state === 'busy' ? t('unsubscribe:busy') : state === 'done' ? t(`unsubscribe:${kind}.done`) : t('unsubscribe:invalid')}</p>
      <ButtonLink to="/" variant="link">
        {t('unsubscribe:home')}
      </ButtonLink>
    </div>
  );
}
