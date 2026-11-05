// O5a (only 16_17, UX §3.2): live presence is off by default for minors (product plan §4).
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, Switch } from '../../../design/index.ts';
import { useT } from '../../../i18n/index.tsx';
import { updateDraft } from '../draft.ts';
import { STEP } from '../paths.ts';

export function SilentStep() {
  const { t } = useT();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  return (
    <div className="onb">
      <h1>{t('onboarding:silent.title')}</h1>
      <p className="onb-lead">{t('onboarding:silent.body')}</p>
      <Switch label={t('onboarding:silent.switch')} checked={show} onChange={setShow} />
      <Button
        block
        onClick={() => {
          updateDraft({ silentMode: !show });
          void navigate(STEP.consent);
        }}
      >
        {t('onboarding:silent.next')}
      </Button>
    </div>
  );
}
