// O2 Hoe we tellen (kort): the literal claim of spec §3.1 step 3, phone and laptop in two lines.
// Not skippable: it sets the expectation F6 later has to keep (UX §4.1 step 2).
import { ButtonLink } from '../../../design/index.ts';
import { useT } from '../../../i18n/index.tsx';
import { STEP } from '../paths.ts';

export function HowShort() {
  const { t } = useT();
  return (
    <div className="onb">
      <h1>{t('onboarding:how.title')}</h1>
      <p className="onb-lead">{t('onboarding:welcome.claim')}</p>
      <p>{t('onboarding:how.phone')}</p>
      <p>{t('onboarding:how.laptop')}</p>
      <ButtonLink to={STEP.email} block>
        {t('onboarding:how.ok')}
      </ButtonLink>
    </div>
  );
}
