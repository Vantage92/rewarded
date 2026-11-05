// Shared building blocks of the admin environment (spec §4.11, architecture §9.1 `/beheer/*`).
// The admin UI is functional and internal (UX §2.1): design-system components, no own screen design.
import { ApiClientError } from '@rewarded/contracts/client';
import type { ErrorCode } from '@rewarded/contracts';
import { useId, useSyncExternalStore, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Banner, Button, FormField } from '../../design/index.ts';
import { TIME_ZONE, useT, type Locale } from '../../i18n/index.tsx';
import { errorText } from '../../lib/api/index.ts';

/** Translation helper bound to the admin namespace: `ta('queue.title')` = t('admin:queue.title'). */
export function useTa() {
  const i18n = useT();
  return { ...i18n, ta: (key: string, vars?: Record<string, string | number>) => i18n.t(`admin:${key}`, vars) };
}

/** A section of the admin page: the page has one h1 ("Beheer"), each section an h2. */
export function Section({ title, intro, children, actions }: { title: string; intro?: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  const id = useId();
  return (
    <section className="adm-section" aria-labelledby={id}>
      <div className="adm-section-head">
        <h2 id={id}>{title}</h2>
        {actions}
      </div>
      {intro ? <p className="adm-intro">{intro}</p> : null}
      {children}
    </section>
  );
}

/** Sub-block inside a section with an h3. */
export function Block({ title, children }: { title: string; children?: ReactNode }) {
  const id = useId();
  return (
    <section className="adm-block" aria-labelledby={id}>
      <h3 id={id}>{title}</h3>
      {children}
    </section>
  );
}

export function Loading() {
  const { t } = useT();
  return (
    <p className="adm-loading" role="status" aria-live="polite">
      {t('loading')}
    </p>
  );
}

/** Inline error with the contract message and an optional retry (UX §3.1 Fout). */
export function ErrorNote({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t, locale } = useT();
  return (
    <div role="alert" className="adm-error">
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
    </div>
  );
}

/** Success or status line after an action, announced politely. */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="adm-notice" role="status">
      {children}
    </p>
  );
}

export function isApiError<C extends ErrorCode>(error: unknown, code: C): error is ApiClientError & { code: C } {
  return error instanceof ApiClientError && error.is(code);
}

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'children'> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  options: readonly { value: string; label: string }[];
  /** Label of an empty first option; omitted when the choice is mandatory and preset. */
  placeholder?: string;
}

export function SelectField({ label, hint, error, options, placeholder, required, ...select }: SelectFieldProps) {
  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {(props) => (
        <select {...select} {...props} required={required} className="input">
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  );
}

export interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'children'> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
}

export function TextAreaField({ label, hint, error, required, ...area }: TextAreaFieldProps) {
  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {(props) => <textarea {...area} {...props} required={required} className="input adm-textarea" />}
    </FormField>
  );
}

export function CheckboxField({ label, checked, onChange, hint }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; hint?: ReactNode }) {
  const id = useId();
  return (
    <div className="adm-check">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-describedby={hint ? `${id}-hint` : undefined} />
      <label htmlFor={id}>{label}</label>
      {hint ? (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Simple data table with a caption (WCAG 1.3.1). */
export function Table({ caption, head, rows, empty }: { caption: string; head: readonly ReactNode[]; rows: readonly (readonly ReactNode[])[]; empty?: string }) {
  if (!rows.length && empty) return <p className="adm-empty">{empty}</p>;
  return (
    <div className="adm-table-wrap">
      <table className="adm-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Euro amount from cents; only inside the admin environment (spec §4.3, UX P7). */
export function formatEuro(locale: Locale, cents: number): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

/** Parses a euro input ("4,50" or "4.50") into cents; NaN when invalid. */
export function parseEuroToCents(input: string): number {
  const s = input.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return Number.NaN;
  return Math.round(Number(s) * 100);
}

export function formatDateTime(locale: Locale, at: string | number | Date): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: TIME_ZONE }).format(new Date(at));
}

export function formatPct(locale: Locale, share: number): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(share);
}

/** Random key for routes that need an Idempotency-Key or for local ids. */
export function randomKey(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// ---------------------------------------------------------------------------------------------
// Workset: objects the admin created or changed in this tab, for resources whose contract has no
// list route (rewards, budgets, admin challenges; see docs/build/WP-10.md). Kept in sessionStorage.

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();
const cache = new Map<string, readonly unknown[]>();
const STORAGE_PREFIX = 'rw_admin_ws_';

function read(kind: string): readonly unknown[] {
  const hit = cache.get(kind);
  if (hit) return hit;
  let value: unknown[] = [];
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + kind);
    if (raw) value = JSON.parse(raw) as unknown[];
  } catch {
    // Storage unavailable or corrupt: start empty.
  }
  cache.set(kind, value);
  return value;
}

function write(kind: string, value: readonly unknown[]): void {
  cache.set(kind, value);
  try {
    sessionStorage.setItem(STORAGE_PREFIX + kind, JSON.stringify(value));
  } catch {
    // Ignore: the workset then lasts for this page only.
  }
  for (const l of listeners.get(kind) ?? []) l();
}

/** Upserts an object (by id) into the workset of `kind`; newest first. */
export function upsertWorkset<T extends { id: string }>(kind: string, item: T): void {
  const items = read(kind) as T[];
  write(kind, [item, ...items.filter((i) => i.id !== item.id)]);
}

/** Clears every workset (tests, logout). */
export function clearWorksets(): void {
  for (const kind of [...cache.keys()]) write(kind, []);
  cache.clear();
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // Nothing to clear.
  }
}

export function useWorkset<T extends { id: string }>(kind: string): readonly T[] {
  return useSyncExternalStore(
    (cb) => {
      const set = listeners.get(kind) ?? new Set<Listener>();
      set.add(cb);
      listeners.set(kind, set);
      return () => set.delete(cb);
    },
    () => read(kind) as readonly T[],
    () => read(kind) as readonly T[],
  );
}
