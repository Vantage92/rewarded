import { useT } from '../i18n/index.tsx';

/** Empty screen shown until the owning work package builds the feature. */
export function Placeholder({ feature, owner }: { feature: string; owner: string }) {
  const { t } = useT();
  return (
    <section aria-labelledby={`title-${feature}`}>
      <h1 id={`title-${feature}`}>{t(`features.${feature}`)}</h1>
      <p className="placeholder">{t('placeholder.coming', { owner })}</p>
    </section>
  );
}
