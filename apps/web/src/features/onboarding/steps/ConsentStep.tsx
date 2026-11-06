// O6 (UX §3.2, spec §3.1 steps 6–7): informed participation in plain language before the consent;
// two separate, unticked boxes; [Akkoord] only with both, with the reason next to it.
import { CURRENT_PARAMS } from '@rewarded/core/params';
import { calendarDates, defaultCalendar } from '@rewarded/core/calendar';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { Button, Card } from '../../../design/index.ts';
import { useT } from '../../../i18n/index.tsx';
import { useApiQuery } from '../../../lib/api/index.ts';
import { formatDate } from '../../profile/kit.tsx';
import { readDraft } from '../draft.ts';
import { ageClass, ageOn, todayParts } from '../age.ts';
import { getBirthDate } from '../draft.ts';
import { STEP } from '../paths.ts';

let consented = false;
export const consentGiven = () => consented;

export function ConsentStep() {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const invite = readDraft().inviteToken;
  const preview = useApiQuery('invites.preview', { params: { token: invite ?? '' } }, { enabled: Boolean(invite), retry: false });
  // T of the calendar this invite leads to; without one the default calendar (spec §4.13).
  const tDay = preview.data?.t_day ?? calendarDates(defaultCalendar(CURRENT_PARAMS), CURRENT_PARAMS).tDay;
  const date = formatDate(locale, tDay, { day: 'numeric', month: 'long', year: 'numeric' });
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const birth = getBirthDate();
  if (!birth) return <Navigate to={STEP.age} replace />;
  const [y, m, d] = birth.split('-').map(Number) as [number, number, number];
  const minor = ageClass(ageOn({ year: y, month: m, day: d }, todayParts())) === '16_17';
  const both = terms && privacy;
  return (
    <div className="onb">
      <h1>{t('onboarding:consent.title')}</h1>
      <p className="onb-lead">{t('onboarding:consent.pilot', { date })}</p>
      <p>{t('onboarding:consent.research')}</p>
      <p>{t('onboarding:consent.group')}</p>
      {minor ? <p>{t('onboarding:consent.minor')}</p> : null}
      <Card title={t('onboarding:consent.signals_title')} level={2}>
        <p>{t('onboarding:consent.signals')}</p>
      </Card>
      <label className="onb-check">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
        <span>{t('onboarding:consent.terms')}</span>
      </label>
      <Link to="/profiel/voorwaarden" target="_blank" rel="noopener">
        {t('onboarding:consent.terms_link')}
      </Link>
      <label className="onb-check">
        <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
        <span>{t('onboarding:consent.privacy')}</span>
      </label>
      <Link to="/profiel/privacy" target="_blank" rel="noopener">
        {t('onboarding:consent.privacy_link')}
      </Link>
      <Button
        block
        disabled={!both}
        disabledReason={both ? undefined : t('onboarding:consent.both')}
        onClick={() => {
          consented = true;
          void navigate(STEP.goal);
        }}
      >
        {t('onboarding:consent.accept')}
      </Button>
    </div>
  );
}
