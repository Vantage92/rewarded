import { useT, LOCALES, type Locale } from '../i18n/index.tsx';
import { Segment } from './components/Segment.tsx';
import { THEME_PREFERENCES, useTheme } from './theme.tsx';

/** Theme choice (light, dark, system) for P1 "Ik"; WP-9 places it on the profile screen. */
export function ThemeSwitch() {
  const { t } = useT();
  const { preference, setPreference } = useTheme();
  return <Segment label={t('theme.label')} options={THEME_PREFERENCES.map((p) => ({ value: p, label: t(`theme.${p}`) }))} value={preference} onChange={setPreference} />;
}

/** Language choice (NL, EN). */
export function LanguageSwitch() {
  const { t, locale, setLocale } = useT();
  return <Segment<Locale> label={t('language.label')} options={LOCALES.map((l) => ({ value: l, label: t(`language.${l}`) }))} value={locale} onChange={setLocale} />;
}
