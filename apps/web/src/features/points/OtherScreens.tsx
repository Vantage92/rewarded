// Points history (architecture §9.1 /punten/geschiedenis) and B7 Bonusregel (UX §3.6, spec §5
// "Transparantie"). Both arms in the same words and length; only the framing differs.
import type { LedgerItem } from '@rewarded/contracts';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button, Card } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';
import { useApiQuery } from '../../lib/api/index.ts';
import { ErrorNote, Screen, Skeleton, formatDate, useMe } from '../profile/kit.tsx';

export function LedgerScreen() {
  const { t, locale } = useT();
  useMe();
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  return (
    <Screen title={t('points:ledger.title')}>
      {cursors.map((cursor, i) => (
        <LedgerPage key={cursor ?? 'first'} cursor={cursor} last={i === cursors.length - 1} onMore={(next) => setCursors((c) => [...c, next])} locale={locale} />
      ))}
      <Link to="/punten">{t('actions.back')}</Link>
    </Screen>
  );
}

function LedgerPage({ cursor, last, onMore, locale }: { cursor: string | undefined; last: boolean; onMore: (c: string) => void; locale: 'nl' | 'en' }) {
  const { t } = useT();
  const page = useApiQuery('points.ledger', cursor ? { query: { cursor } } : undefined);
  if (page.isPending) return <Skeleton />;
  if (page.error) return <ErrorNote error={page.error} onRetry={() => void page.refetch()} />;
  const items: LedgerItem[] = page.data.items;
  if (!items.length && !cursor) return <p>{t('points:ledger.empty')}</p>;
  return (
    <>
      <ul className="wp9-items">
        {items.map((item, i) => (
          <li key={`${item.ref}-${item.type}-${i}`} className="wp9-row">
            <span>{t('points:ledger.type', { type: item.type })}</span>
            <span className="wp9-small">{formatDate(locale, item.created_at, { day: 'numeric', month: 'short' })}</span>
            <strong>{item.amount > 0 ? `+${item.amount}` : String(item.amount)}</strong>
            <span className="wp9-small">{t('points:ledger.status', { status: item.status })}</span>
          </li>
        ))}
      </ul>
      {last && page.data.next_cursor ? (
        <Button variant="secondary" onClick={() => onMore(page.data.next_cursor!)}>
          {t('points:ledger.more')}
        </Button>
      ) : null}
    </>
  );
}

export function BonusRuleScreen() {
  const { t } = useT();
  const me = useMe();
  const { locale } = useT();
  const today = useApiQuery('me.today');
  const rule = today.data?.bonus_rule;
  return (
    <Screen title={t('points:bonus.title')} intro={t('points:bonus.intro')}>
      {today.isPending ? <Skeleton /> : null}
      {rule ? (
        <Card>
          <p>{rule === 'A' ? t('points:bonus.yours_a') : rule === 'B' ? t('points:bonus.yours_b') : t('points:bonus.none')}</p>
          {rule === 'A' ? <p>{t('points:bonus.rule_a')}</p> : rule === 'B' ? <p>{t('points:bonus.rule_b')}</p> : null}
        </Card>
      ) : null}
      <ul>
        <li>{t('points:bonus.joker')}</li>
        <li>{t('points:bonus.night')}</li>
        <li>{t('points:bonus.exam')}</li>
        {me.data?.calendar ? <li>{t('points:bonus.season', { date: formatDate(locale, me.data.calendar.t_day, { day: 'numeric', month: 'long', year: 'numeric' }) })}</li> : null}
      </ul>
      <Link to="/punten">{t('actions.back')}</Link>
    </Screen>
  );
}
