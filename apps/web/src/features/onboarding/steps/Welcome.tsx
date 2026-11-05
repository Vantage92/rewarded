// O1 Welkom (UX §3.2): the inviter on top, the core promise, the honest claim, one reward line,
// the visibility rule for a squad link, and 16+. In the closed pilot a visit without an invitation
// goes to the waiting list.
import { useEffect } from 'react';
import { useParams } from 'react-router';
import { ButtonLink } from '../../../design/index.ts';
import { useT } from '../../../i18n/index.tsx';
import { useApiQuery } from '../../../lib/api/index.ts';
import { uaClass } from '../../../platform/device.ts';
import { readDraft, updateDraft } from '../draft.ts';
import { STEP } from '../paths.ts';

export function Welcome() {
  const { t } = useT();
  const { token } = useParams();
  const inviteToken = token ?? readDraft().inviteToken;
  useEffect(() => {
    if (token) updateDraft({ inviteToken: token });
  }, [token]);
  const preview = useApiQuery('invites.preview', { params: { token: inviteToken ?? '' } }, { enabled: Boolean(inviteToken), retry: false });
  const cls = uaClass();
  const desktop = cls === 'desktop';
  const inApp = cls === 'ios_webview' || cls === 'android_webview';
  const p = preview.data;
  const invalid = preview.isError || (p && !p.valid);
  const squadLink = p?.source === 'squad' && p.valid;
  return (
    <div className="onb">
      {p?.inviter_first_name && p.valid ? (
        <p className="onb-invite">
          {p.squad_name ? t('onboarding:welcome.invited_squad', { name: p.inviter_first_name, squad: p.squad_name }) : t('onboarding:welcome.invited', { name: p.inviter_first_name })}
        </p>
      ) : null}
      <h1>{t('onboarding:welcome.title')}</h1>
      <p className="onb-lead">{desktop ? t('onboarding:welcome.promise_desktop') : t('onboarding:welcome.promise')}</p>
      <p>{t('onboarding:welcome.claim')}</p>
      <p>{t('onboarding:welcome.reward')}</p>
      {squadLink ? <p className="onb-muted">{t('onboarding:welcome.visibility')}</p> : null}
      <p className="onb-muted">{t('onboarding:welcome.age')}</p>
      {invalid ? (
        <p role="alert">{p?.inviter_first_name ? t('onboarding:welcome.invalid', { name: p.inviter_first_name }) : t('onboarding:welcome.invalid_anon')}</p>
      ) : null}
      {!inviteToken ? <p>{t('onboarding:welcome.closed_pilot')}</p> : null}
      <div className="onb-actions">
        {inviteToken && !invalid ? (
          <>
            <ButtonLink to={STEP.how} block>
              {t('onboarding:welcome.join')}
            </ButtonLink>
            <ButtonLink to={STEP.how} variant="link">
              {t('onboarding:welcome.how')}
            </ButtonLink>
          </>
        ) : (
          <ButtonLink to="/wachtlijst" block>
            {t('onboarding:welcome.waitlist')}
          </ButtonLink>
        )}
        <ButtonLink to="/login" variant="link">
          {t('onboarding:welcome.have_account')}
        </ButtonLink>
        {inApp ? <p className="onb-muted">{t('onboarding:welcome.in_app')}</p> : null}
      </div>
    </div>
  );
}
