// Second tab on the same device (architecture §4.4): no start, no heartbeats.
import { Card } from '../../../design/index.ts';
import { useT } from '../../../i18n/index.tsx';

export function OtherTabView() {
  const { t } = useT();
  return (
    <Card title={t('focus:other_tab.title')} level={2}>
      <p>{t('focus:other_tab.body')}</p>
    </Card>
  );
}
