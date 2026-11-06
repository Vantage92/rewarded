// Small building blocks shared by the student features of WP-9 (points, squads, duels, club,
// challenges, belofte, cards, profile): the screen frame with its single h1, the five states of
// UX §3.1, the /me query, client events and date formatting in Europe/Amsterdam.
import type { ClientEvent, ErrorCode, MeResponse } from '@rewarded/contracts';
import { ApiClientError } from '@rewarded/contracts/client';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, type ReactNode } from 'react';
import { useShell } from '../../app/shell.tsx';
import { Banner, Button, Segment } from '../../design/index.ts';
import { LOCALES, TIME_ZONE, hasStoredLocale, useT, type Locale } from '../../i18n/index.tsx';
import { apiKey, errorText, useApi, useApiMutation, useApiQuery } from '../../lib/api/index.ts';
import './kit.css';

/** Screen frame: the single h1 of the page (UX §5.8) and its content. */
export function Screen({ title, intro, children }: { title: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <section className="wp9-screen" aria-labelledby="wp9-title">
      <h1 id="wp9-title">{title}</h1>
      {intro ? <p className="wp9-intro">{intro}</p> : null}
      {children}
    </section>
  );
}

/** Loading state: skeleton blocks in the shape of the content, no spinner (UX §3.1 Laden). */
export function Skeleton({ lines = 3 }: { lines?: number }) {
  const { t } = useT();
  return (
    <div className="wp9-skeleton" role="status" aria-live="polite">
      <span className="visually-hidden">{t('loading')}</span>
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="wp9-skeleton-line" aria-hidden="true" />
      ))}
    </div>
  );
}

/** Error state: what went wrong and what you can do; the last data stays (UX §3.1 Fout). */
export function ErrorNote({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t, locale } = useT();
  return (
    <Banner
      tone="info"
      action={
        onRetry ? (
          <Button variant="link" onClick={onRetry}>
            {t('errors.retry')}
          </Button>
        ) : undefined
      }
    >
      {errorText(locale, error)}
    </Banner>
  );
}

/** True when `error` is the contract error `code`. */
export function isApiError<C extends ErrorCode>(error: unknown, code: C): error is ApiClientError & { code: C } {
  return error instanceof ApiClientError && error.is(code);
}

/** The signed-in student (GET /me). Also tells the shell about the no-points mode (UX §2.1). */
export function useMe() {
  const query = useApiQuery('me.get', undefined, { staleTime: 60_000 });
  const { setNoPointsMode } = useShell();
  const noPoints = query.data?.settings?.no_points_mode ?? false;
  useEffect(() => setNoPointsMode(noPoints), [noPoints, setNoPointsMode]);
  useAccountLocale(query.data?.user?.locale);
  return query;
}

/** A new device starts in the account's language when the browser holds no choice yet. */
export function useAccountLocale(accountLocale: Locale | undefined) {
  const { locale, setLocale } = useT();
  useEffect(() => {
    if (accountLocale && accountLocale !== locale && !hasStoredLocale()) setLocale(accountLocale);
  }, [accountLocale, locale, setLocale]);
}

/** Language switch of P1: the browser and the account (mails, catalogue and challenge titles). */
export function AccountLanguageSwitch() {
  const { t, locale, setLocale } = useT();
  const qc = useQueryClient();
  const patch = useApiMutation('me.settings', {
    onSuccess: () => {
      for (const id of ['me.get', 'catalog.list', 'challenges.list'] as const) void qc.invalidateQueries({ queryKey: apiKey(id) });
    },
  });
  return (
    <Segment<Locale>
      label={t('language.label')}
      options={LOCALES.map((l) => ({ value: l, label: t(`language.${l}`) }))}
      value={locale}
      onChange={(l) => {
        setLocale(l);
        patch.mutate({ body: { locale: l } });
      }}
    />
  );
}

/** Helpers on /me used by several screens. */
export const ageBand = (me: MeResponse | undefined) => me?.age_band ?? null;
export const isAdult = (me: MeResponse | undefined) => me?.age_band === '18_plus';
export const noPointsMode = (me: MeResponse | undefined) => me?.settings?.no_points_mode ?? false;

/** Sends a client event from the taxonomy; failures never reach the student. */
export function useTrack() {
  const api = useApi();
  return useCallback(
    (event: ClientEvent) => {
      void Promise.resolve()
        .then(() => api.call('events.track', { body: event }))
        .catch(() => undefined);
    },
    [api],
  );
}

/** Fresh Idempotency-Key per user action (architecture §8.1). */
export function idempotencyKey(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Formats a focus day (YYYY-MM-DD) or an instant as a date in Europe/Amsterdam, e.g.
 * "dinsdag 12 januari". A bare focus day is read at noon so the zone never shifts the date.
 */
export function formatDate(locale: Locale, value: string | Date, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }): string {
  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value);
  return new Intl.DateTimeFormat(locale, { ...opts, timeZone: TIME_ZONE }).format(date);
}

/** "12 januari" without the weekday. */
export const formatShortDate = (locale: Locale, value: string | Date) => formatDate(locale, value, { day: 'numeric', month: 'long' });

/** Week dots: one dot per day, met or not, never red (UX §3.4 Q6, Q7). */
export function DayDots({ days, label }: { days: readonly { day: string; met: boolean; provisional?: boolean }[]; label: string }) {
  const { t, locale } = useT();
  return (
    <ol className="wp9-dots" aria-label={label}>
      {days.map((d) => (
        <li key={d.day} className={d.met ? 'wp9-dot is-met' : 'wp9-dot'}>
          <span className="visually-hidden">
            {t('profile:kit.day_status', { day: formatDate(locale, d.day), status: d.met ? (d.provisional ? 'provisional' : 'met') : 'open' })}
          </span>
        </li>
      ))}
    </ol>
  );
}
