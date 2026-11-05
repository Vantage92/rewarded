// O10 Eerste sessie (UX §3.2): the squad above when the student came through a squad link.
import { ButtonLink } from '../../../design/index.ts';
import { useT } from '../../../i18n/index.tsx';
import { useMe } from '../../focus/hooks.ts';

export function FirstSession() {
  const { t } = useT();
  const me = useMe();
  const squad = me.data?.squad;
  return (
    <div className="onb">
      {squad ? <p className="onb-invite">{t('onboarding:first.squad', { name: squad.name })}</p> : null}
      <h1>{t('onboarding:first.title')}</h1>
      <p className="onb-lead">{t('onboarding:first.body')}</p>
      <div className="onb-actions">
        <ButtonLink to="/focus?duur=25" block>
          {t('onboarding:first.start')}
        </ButtonLink>
        <ButtonLink to="/" variant="secondary" block>
          {t('onboarding:first.later')}
        </ButtonLink>
      </div>
    </div>
  );
}
