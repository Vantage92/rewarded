// O5 Leeftijdscheck (UX §3.2, spec §3.1 step 5): date of birth as three numeric fields. Below 16
// a confirmation first; after it O5b, nothing kept (the server deletes the pre-session, §3.1).
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, Modal, TextField } from '../../../design/index.ts';
import { useT } from '../../../i18n/index.tsx';
import { useApiMutation } from '../../../lib/api/index.ts';
import { ageClass, ageOn, isoDate, parseBirthDate, todayParts } from '../age.ts';
import { clearDraft, readDraft, setBirthDate, updateDraft } from '../draft.ts';
import { LEGAL_VERSIONS } from '../legal.ts';
import { STEP } from '../paths.ts';

export function AgeStep() {
  const { t } = useT();
  const navigate = useNavigate();
  const draft = readDraft();
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [first, setFirst] = useState(draft.firstName);
  const [error, setError] = useState<string | null>(null);
  const [confirmAge, setConfirmAge] = useState<number | null>(null);
  const [tooYoung, setTooYoung] = useState(false);
  const below = useApiMutation('me.onboarding', { onSettled: () => setTooYoung(true) });

  if (tooYoung) {
    return (
      <div className="onb">
        <h1>{t('onboarding:age.too_young_title')}</h1>
        <p className="onb-lead">{t('onboarding:age.too_young')}</p>
      </div>
    );
  }

  const next = () => {
    const parts = parseBirthDate(day, month, year);
    if (!parts) return setError('onboarding:age.invalid');
    if (!first.trim()) return setError('onboarding:email.first_name_required');
    setError(null);
    updateDraft({ firstName: first.trim() });
    const age = ageOn(parts, todayParts());
    const cls = ageClass(age);
    setBirthDate(isoDate(parts));
    if (cls === 'under_16') return setConfirmAge(Math.max(0, age));
    void navigate(cls === '16_17' ? STEP.silent : STEP.consent);
  };

  const confirmUnder16 = () => {
    setConfirmAge(null);
    // The server answers AGE_BELOW_MINIMUM and removes the pre-session and its magic links.
    const birth = isoDate(parseBirthDate(day, month, year) ?? { year: 2015, month: 1, day: 1 });
    below.mutate({
      body: {
        first_name: first.trim() || '-',
        birth_date: birth,
        terms_version: LEGAL_VERSIONS.terms,
        privacy_version: LEGAL_VERSIONS.privacy,
        research_info_version: LEGAL_VERSIONS.research_info,
        daily_goal_min: 25,
      },
    });
    setBirthDate(null);
    clearDraft();
  };

  return (
    <div className="onb">
      <h1>{t('onboarding:age.title')}</h1>
      <p className="onb-lead">{t('onboarding:age.intro')}</p>
      <form
        className="onb-actions"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        {!draft.firstName ? <TextField label={t('onboarding:age.first_name')} autoComplete="given-name" value={first} onChange={(e) => setFirst(e.target.value)} /> : null}
        <fieldset className="onb-date">
          <legend>{t('onboarding:age.legend')}</legend>
          <TextField label={t('onboarding:age.day')} inputMode="numeric" autoComplete="bday-day" maxLength={2} value={day} onChange={(e) => setDay(e.target.value)} />
          <TextField label={t('onboarding:age.month')} inputMode="numeric" autoComplete="bday-month" maxLength={2} value={month} onChange={(e) => setMonth(e.target.value)} />
          <TextField label={t('onboarding:age.year')} inputMode="numeric" autoComplete="bday-year" maxLength={4} value={year} onChange={(e) => setYear(e.target.value)} />
        </fieldset>
        {error ? <p role="alert">{t(error)}</p> : null}
        <p className="onb-muted">{t('onboarding:age.privacy')}</p>
        <Button type="submit" block>
          {t('onboarding:age.next')}
        </Button>
      </form>
      <Modal
        open={confirmAge !== null}
        title={t('onboarding:age.confirm_title', { age: confirmAge ?? 0 })}
        onClose={() => setConfirmAge(null)}
        safe={{ label: t('onboarding:age.confirm_edit'), onClick: () => setConfirmAge(null) }}
        confirm={{ label: t('onboarding:age.confirm_yes'), onClick: confirmUnder16 }}
      />
    </div>
  );
}
