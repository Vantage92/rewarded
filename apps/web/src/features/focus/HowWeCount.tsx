// F9 "Hoe we tellen" (UX §3.3, spec §4.1 "Uitleg"): the honest claim, the rules in plain language,
// the abort codes, what we cannot see, what a report can restore, and the practice minute.
import { ButtonLink, Card } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';
import { ABORT_CODES } from './copy.ts';
import './focus.css';

const RULES = ['rule_lengths', 'rule_server', 'rule_offline', 'rule_day', 'rule_night', 'rule_laptop'] as const;

export function HowWeCount() {
  const { t } = useT();
  return (
    <div className="focus-page">
      <h1 className="focus-title">{t('focus:how.title')}</h1>
      <p className="focus-lead">{t('focus:how.claim')}</p>
      <Card title={t('focus:how.rules_title')} level={2}>
        <ul className="focus-checklist">
          {RULES.map((r) => (
            <li key={r}>{t(`focus:how.${r}`)}</li>
          ))}
        </ul>
      </Card>
      <Card title={t('focus:how.codes_title')} level={2}>
        <ul className="focus-checklist">
          {ABORT_CODES.map((c) => (
            <li key={c}>{t(`focus:how.code_${c}`)}</li>
          ))}
        </ul>
      </Card>
      <Card title={t('focus:how.unseen_title')} level={2}>
        <p>{t('focus:how.unseen')}</p>
      </Card>
      <Card title={t('focus:how.report_title')} level={2}>
        <p>{t('focus:how.report_body')}</p>
      </Card>
      <ButtonLink to="/onboarding/oefenen" variant="secondary" block>
        {t('focus:how.practice')}
      </ButtonLink>
    </div>
  );
}
