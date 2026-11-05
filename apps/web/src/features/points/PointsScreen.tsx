// B1 Saldo en catalogus, B2 Item en verzilveren, B3 Telefoon verifiëren, B4 Voucher (UX §3.6,
// §4.6, §6.2; spec §3.4, §4.3). Balance in three parts with the earn-in progress, stock next to the
// students who may redeem, buttons disabled with their reason. Never a euro value next to points.
import type { BalanceResponse, CatalogItem, RedeemResponse, RedemptionDto } from '@rewarded/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useOnline } from '../../app/shell.tsx';
import { BottomSheet, Button, Card, ProgressBar, TextField, useToast } from '../../design/index.ts';
import { useT } from '../../i18n/index.tsx';
import { apiKey, errorText, useApiMutation, useApiQuery } from '../../lib/api/index.ts';
import { ErrorNote, Screen, Skeleton, formatDate, idempotencyKey, isApiError, noPointsMode, useMe, useTrack } from '../profile/kit.tsx';
import { itemBlock, nextMonthStart, redeemGate, sortCatalog, type ItemBlock, type RedeemGate } from './redeem.ts';

export interface PointsScreenProps {
  /** Clock for the hold and weekly checks; tests pass a fixed value. */
  now?: () => number;
}

export function PointsScreen({ now = Date.now }: PointsScreenProps) {
  const { t } = useT();
  const me = useMe();
  if (noPointsMode(me.data)) {
    return (
      <Screen title={t('points:title')}>
        <p>{t('points:no_points.text')}</p>
        <Link to="/profiel">{t('points:no_points.link')}</Link>
      </Screen>
    );
  }
  return (
    <Screen title={t('points:title')}>
      <PointsContent now={now} referralOn={me.data?.flags.referral ?? false} />
    </Screen>
  );
}

function PointsContent({ now, referralOn }: { now: () => number; referralOn: boolean }) {
  const { t } = useT();
  const balance = useApiQuery('points.balance');
  const catalog = useApiQuery('catalog.list');
  const today = useApiQuery('me.today');
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const track = useTrack();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current || !balance.data || !catalog.data) return;
    tracked.current = true;
    track({
      name: 'catalog_viewed',
      props: { items_zichtbaar: catalog.data.items.length, saldo: balance.data.available, inverdiend: balance.data.earn_in_min >= balance.data.earn_in_required },
    });
  }, [balance.data, catalog.data, track]);

  const armB = today.data?.bonus_rule === 'B';
  return (
    <>
      {balance.error ? <ErrorNote error={balance.error} onRetry={() => void balance.refetch()} /> : null}
      {balance.data ? <BalanceCard balance={balance.data} armB={armB} referralOn={referralOn} now={now()} /> : balance.isPending ? <Skeleton /> : null}
      <Card title={t('points:catalog.title')}>
        <p className="wp9-small">{t('points:catalog.disclaimer')}</p>
        {catalog.error ? <ErrorNote error={catalog.error} onRetry={() => void catalog.refetch()} /> : null}
        {catalog.data?.week ? <p>{t('points:catalog.week', { released: catalog.data.week.released, eligible: catalog.data.week.eligible_users })}</p> : null}
        {catalog.isPending ? <Skeleton /> : null}
        {catalog.data && balance.data ? <CatalogList items={catalog.data.items} balance={balance.data} now={now()} onSelect={setSelected} /> : null}
      </Card>
      <Vouchers />
      <p>
        <Link to="/punten/geschiedenis">{t('points:ledger.link')}</Link>
      </p>
      {selected && balance.data ? (
        <RedeemSheet item={selected} balance={balance.data} referralOn={referralOn} now={now} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}

function gateText(t: (k: string, v?: Record<string, string | number>) => string, locale: 'nl' | 'en', gate: NonNullable<RedeemGate>): string {
  if (gate.kind === 'earn_in') return t('points:earn_in.remaining', { count: gate.minutes });
  if (gate.kind === 'hold') return t('points:earn_in.hold', { date: formatDate(locale, gate.from) });
  return t('points:earn_in.weekly');
}

function blockText(t: (k: string, v?: Record<string, string | number>) => string, block: NonNullable<ItemBlock>): string {
  if (block.kind === 'not_enough') return t('points:catalog.not_enough', { available: block.available, price: block.price });
  return t(`points:catalog.${block.kind}`);
}

export function BalanceCard({ balance, armB, referralOn, now }: { balance: BalanceResponse; armB: boolean; referralOn: boolean; now: number }) {
  const { t, locale, number } = useT();
  const gate = redeemGate(balance, now);
  return (
    <Card title={t('points:balance.title')}>
      <p className="wp9-small">{t('points:balance.available')}</p>
      <p className="wp9-big" data-testid="balance-available">
        {number(balance.available)} <span className="wp9-unit">{t('points:balance.unit', { count: balance.available })}</span>
      </p>
      <dl className="wp9-dl">
        <dt>{armB ? t('points:balance.pending_b') : t('points:balance.pending_a')}</dt>
        <dd>{balance.pending}</dd>
        {referralOn ? (
          <>
            <dt>{t('points:balance.referral')}</dt>
            <dd>{balance.referral_unvested}</dd>
          </>
        ) : null}
      </dl>
      <p className="wp9-row">
        <Link to="/punten/bonusregel">{t('points:balance.why')}</Link>
      </p>
      <ProgressBar
        value={Math.min(balance.earn_in_min, balance.earn_in_required)}
        max={balance.earn_in_required}
        label={t('points:earn_in.label')}
        valueText={t('points:earn_in.value', { value: Math.min(balance.earn_in_min, balance.earn_in_required), max: balance.earn_in_required })}
      />
      <p>{gate ? gateText(t, locale, gate) : t('points:earn_in.ready')}</p>
      {gate?.kind === 'earn_in' ? <p className="wp9-small">{t('points:earn_in.explain')}</p> : null}
    </Card>
  );
}

export function CatalogList({ items, balance, now, onSelect }: { items: readonly CatalogItem[]; balance: BalanceResponse; now: number; onSelect: (item: CatalogItem) => void }) {
  const { t, locale } = useT();
  const online = useOnline();
  if (items.length === 0) return <p>{t('points:catalog.empty')}</p>;
  const gate = redeemGate(balance, now);
  return (
    <ul className="wp9-items" aria-label={t('points:catalog.list')}>
      {sortCatalog(items).map((item) => {
        const block = itemBlock(item, balance);
        const reason = !online ? t('offline.action_disabled') : gate ? gateText(t, locale, gate) : block ? blockText(t, block) : undefined;
        return (
          <li key={item.id} className="card card-standard">
            <h3 className="card-title">{item.title}</h3>
            <p className="wp9-small">{t('points:catalog.partner', { partner: item.partner })}</p>
            {item.collective ? <p className="wp9-small">{t('points:catalog.collective')}</p> : null}
            <p className="wp9-row">
              <strong>{t('points:catalog.price', { count: item.points_price })}</strong>
              {item.stock_today > 0 ? (
                <span>{t('points:catalog.stock', { count: item.stock_today })}</span>
              ) : block && reason === blockText(t, block) ? null : (
                <span>{blockText(t, item.next_release ? { kind: 'sold_out_today' } : { kind: 'sold_out_week' })}</span>
              )}
            </p>
            <Button variant="secondary" disabled={reason !== undefined} disabledReason={reason} onClick={() => onSelect(item)} aria-label={t('points:catalog.view', { title: item.title })}>
              {t('points:redeem.title')}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

type Step = { kind: 'confirm'; error?: string } | { kind: 'phone' } | { kind: 'voucher'; result: RedeemResponse };

export function RedeemSheet({ item, balance, referralOn, now, onClose }: { item: CatalogItem; balance: BalanceResponse; referralOn: boolean; now: () => number; onClose: () => void }) {
  const { t, locale } = useT();
  const qc = useQueryClient();
  const toast = useToast();
  const [step, setStep] = useState<Step>({ kind: 'confirm' });
  const key = useRef(idempotencyKey());
  const redeem = useApiMutation('redemptions.create', {
    onSuccess: (result) => {
      setStep({ kind: 'voucher', result });
      toast.show(t('points:voucher.mail'));
      void qc.invalidateQueries({ queryKey: apiKey('points.balance') });
      void qc.invalidateQueries({ queryKey: apiKey('catalog.list') });
      void qc.invalidateQueries({ queryKey: apiKey('redemptions.list') });
    },
    onError: (error) => {
      // A refused redemption takes nothing (spec §4.3); the next try is a new action with a new key.
      key.current = idempotencyKey();
      if (isApiError(error, 'PHONE_NOT_VERIFIED')) return setStep({ kind: 'phone' });
      setStep({ kind: 'confirm', error: blockedText(error) });
    },
  });

  function blockedText(error: unknown): string {
    if (isApiError(error, 'EARN_IN_REQUIRED')) return t('points:blocked.EARN_IN_REQUIRED', { minutes: Math.max(0, balance.earn_in_required - balance.earn_in_min) });
    if (isApiError(error, 'FIRST_REDEEM_HOLD')) {
      const from = (error.details?.['from'] as string | undefined) ?? balance.first_redeem_after;
      return t('points:blocked.FIRST_REDEEM_HOLD', { date: from ? formatDate(locale, from) : t('points:blocked.soon') });
    }
    if (isApiError(error, 'MONTHLY_CAP')) return t('points:blocked.MONTHLY_CAP', { date: formatDate(locale, nextMonthStart(now()), { day: 'numeric', month: 'long' }) });
    if (isApiError(error, 'INSUFFICIENT_POINTS')) return t('points:blocked.INSUFFICIENT_POINTS', { available: balance.available, price: item.points_price });
    for (const code of ['WEEKLY_CAP', 'OUT_OF_STOCK', 'REFERRAL_SHARE_EXCEEDED'] as const) if (isApiError(error, code)) return t(`points:blocked.${code}`);
    return `${errorText(locale, error)} ${t('points:redeem.nothing_taken')}`;
  }

  const submit = () => redeem.mutate({ body: { reward_id: item.id }, idempotencyKey: key.current });

  return (
    <BottomSheet open title={step.kind === 'voucher' ? t('points:voucher.title') : step.kind === 'phone' ? t('points:phone.title') : item.title} onClose={onClose}>
      {step.kind === 'confirm' ? (
        <div className="wp9-stack">
          <p className="wp9-small">{t('points:catalog.partner', { partner: item.partner })}</p>
          <h3>{t('points:redeem.terms')}</h3>
          <p>{item.terms}</p>
          <dl className="wp9-dl">
            <dt>{t('points:redeem.cost')}</dt>
            <dd>{t('points:catalog.price', { count: item.points_price })}</dd>
            <dt>{t('points:redeem.after')}</dt>
            <dd>{t('points:catalog.price', { count: Math.max(0, balance.available - item.points_price) })}</dd>
          </dl>
          {referralOn ? <p className="wp9-small">{t('points:redeem.referral_rule')}</p> : null}
          {step.error ? (
            <p role="alert" data-testid="redeem-blocked">
              {step.error}
            </p>
          ) : null}
          <Button block onClick={submit} disabled={redeem.isPending}>
            {redeem.isPending ? t('points:redeem.busy') : t('points:redeem.confirm', { count: item.points_price })}
          </Button>
        </div>
      ) : step.kind === 'phone' ? (
        <PhoneVerify onVerified={() => { setStep({ kind: 'confirm' }); submit(); }} />
      ) : (
        <VoucherView code={step.result.voucher_code} partner={item.partner} />
      )}
    </BottomSheet>
  );
}

/** B3: one mobile number per account, with the line-type check at the SMS processor (spec §3.4 step 4). */
export function PhoneVerify({ onVerified }: { onVerified: () => void }) {
  const { t, locale } = useT();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const qc = useQueryClient();
  const start = useApiMutation('phone.start', {
    onSuccess: () => {
      setSent(true);
      setError(undefined);
    },
    onError: (e) =>
      setError(isApiError(e, 'PHONE_TYPE_NOT_ALLOWED') ? t('points:phone.type_not_allowed') : isApiError(e, 'PHONE_IN_USE') ? t('points:phone.in_use') : errorText(locale, e)),
  });
  const confirm = useApiMutation('phone.confirm', {
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: apiKey('me.get') });
      onVerified();
    },
    onError: (e) => setError(errorText(locale, e)),
  });
  const valid = /^\+[1-9]\d{7,14}$/.test(phone.replace(/\s/g, ''));
  return (
    <div className="wp9-stack">
      <p>{t('points:phone.why')}</p>
      <p className="wp9-small">{t('points:phone.stored')}</p>
      {!sent ? (
        <form
          className="wp9-stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return setError(t('points:phone.invalid_number'));
            start.mutate({ body: { phone: phone.replace(/\s/g, '') } });
          }}
        >
          <TextField label={t('points:phone.number')} hint={t('points:phone.number_hint')} type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={error} />
          <Button type="submit" disabled={start.isPending}>
            {t('points:phone.send')}
          </Button>
        </form>
      ) : (
        <form
          className="wp9-stack"
          onSubmit={(e) => {
            e.preventDefault();
            confirm.mutate({ body: { code } });
          }}
        >
          <p>{t('points:phone.sent')}</p>
          <TextField label={t('points:phone.code')} autoComplete="one-time-code" inputMode="numeric" pattern="\d{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} error={error} />
          <Button type="submit" disabled={confirm.isPending || code.length !== 6}>
            {t('points:phone.confirm')}
          </Button>
        </form>
      )}
    </div>
  );
}

/** B4: the code, copy, and "Werkt niet". */
export function VoucherView({ code, partner, redemptionId }: { code: string; partner: string; redemptionId?: string }) {
  const { t } = useT();
  const toast = useToast();
  return (
    <div className="wp9-stack">
      <p className="wp9-code" data-testid="voucher-code">
        {code}
      </p>
      <p>{t('points:voucher.how', { partner })}</p>
      <div className="wp9-row">
        <Button
          variant="secondary"
          onClick={() => {
            void navigator.clipboard?.writeText(code).then(
              () => toast.show(t('points:voucher.copied')),
              () => undefined,
            );
          }}
        >
          {t('points:voucher.copy')}
        </Button>
        {redemptionId ? <BrokenButton redemptionId={redemptionId} /> : null}
      </div>
    </div>
  );
}

function BrokenButton({ redemptionId }: { redemptionId: string }) {
  const { t, locale } = useT();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const broken = useApiMutation('redemptions.broken', {
    onSuccess: () => setDone(t('points:voucher.broken_sent')),
    onError: (e) => setDone(errorText(locale, e)),
  });
  return (
    <>
      <Button variant="link" onClick={() => setOpen(true)}>
        {t('points:voucher.broken')}
      </Button>
      <BottomSheet open={open} title={t('points:voucher.broken_title')} onClose={() => setOpen(false)}>
        <div className="wp9-stack">
          <p>{t('points:voucher.broken_text')}</p>
          {done ? (
            <p role="status">{done}</p>
          ) : (
            <>
              <TextField label={t('points:voucher.broken_note')} optional value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} />
              <Button disabled={broken.isPending} onClick={() => broken.mutate({ params: { id: redemptionId }, body: text.trim() ? { text: text.trim() } : {} })}>
                {t('points:voucher.broken_send')}
              </Button>
            </>
          )}
        </div>
      </BottomSheet>
    </>
  );
}

function Vouchers() {
  const { t } = useT();
  const list = useApiQuery('redemptions.list');
  if (!list.data?.items.length) return null;
  return (
    <Card title={t('points:voucher.list')}>
      <ul className="wp9-items">
        {list.data.items.map((r: RedemptionDto) => (
          <li key={r.id} className="wp9-stack">
            <strong>{r.title}</strong>
            <span className="wp9-small">{t('points:voucher.status', { status: r.status })}</span>
            {r.status === 'reserved' || r.status === 'delivered' || r.status === 'replaced' ? <VoucherView code={r.voucher_code} partner={r.partner} redemptionId={r.id} /> : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
