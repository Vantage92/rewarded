// O8 Niet storen (UX §3.2, spec §3.1 step 10): a call or an opened notification stops the session;
// one line on the 5-minute connection limit, so nobody learns it only afterwards (principle P4).
import { ButtonLink } from '../../../design/index.ts';
import { useT } from '../../../i18n/index.tsx';
import { uaClass } from '../../../platform/device.ts';
import { STEP } from '../paths.ts';

export function DndStep() {
  const { t } = useT();
  const cls = uaClass();
  const tip = cls.startsWith('ios') ? 'ios' : cls.startsWith('android') ? 'android' : 'laptop';
  return (
    <div className="onb">
      <h1>{t('onboarding:dnd.title')}</h1>
      <p className="onb-lead">{t('onboarding:dnd.why')}</p>
      <p>{t(`onboarding:dnd.${tip}`)}</p>
      <p className="onb-muted">{t('onboarding:dnd.connection')}</p>
      <div className="onb-actions">
        <ButtonLink to={STEP.practice} block>
          {t('onboarding:dnd.on')}
        </ButtonLink>
        <ButtonLink to={STEP.practice} variant="secondary" block>
          {t('onboarding:dnd.later')}
        </ButtonLink>
      </div>
    </div>
  );
}
