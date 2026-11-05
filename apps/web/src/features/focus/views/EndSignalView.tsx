// F3e: the end screen (UX §4.2 step 5). A full white plane with dark text, so the light under a
// face-down phone changes; the tone and vibration come from the store. Any touch or the return to
// visible leads to F5 (the store records the first interaction for the claim delay, H9).
import { useImmersive } from '../../../app/shell.tsx';
import { useT } from '../../../i18n/index.tsx';

export function EndSignalView({ waiting }: { waiting: boolean }) {
  const { t } = useT();
  useImmersive(true);
  return (
    <section className="end-screen" aria-live="assertive">
      <h1>{t('focus:end_signal.title')}</h1>
      <p>{t('focus:end_signal.turn')}</p>
      {waiting ? <p className="visually-hidden">{t('focus:end_signal.waiting')}</p> : null}
    </section>
  );
}
