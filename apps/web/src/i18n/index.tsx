// i18n helper (WP-7, architecture §9.6). Catalogs live in <locale>/<namespace>.json; keys are
// 'namespace:path.to.key' (namespace defaults to 'common'). Error message keys from the API
// ('errors.<module>.<code>') resolve to the namespace errors/<module>.
//
// Messages support {name} variables and a small ICU subset:
//   {count, plural, =0 {geen minuten} one {# minuut} other {# minuten}}
//   {arm, select, a {…} b {…} other {…}}
// Architecture §9.6 names i18next; this helper keeps the same useT() API without the dependency
// (see docs/build/WP-7.md). Times are shown in Europe/Amsterdam.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export const LOCALES = ['nl', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'nl';
export const TIME_ZONE = 'Europe/Amsterdam';

export type Catalog = { [key: string]: string | Catalog };
const files = import.meta.glob<Catalog>('./*/**/*.json', { eager: true, import: 'default' });

const catalogs: Record<string, Record<string, Catalog>> = {};
for (const [path, catalog] of Object.entries(files)) {
  const [, locale, ...rest] = path.split('/');
  const ns = rest.join('/').replace(/\.json$/, '');
  (catalogs[locale!] ??= {})[ns] = catalog;
}

/** Namespaces found per locale, for tests. */
export function namespaces(locale: Locale): string[] {
  return Object.keys(catalogs[locale] ?? {}).sort();
}

export function catalogFor(locale: Locale, ns: string): Catalog | undefined {
  return catalogs[locale]?.[ns];
}

function lookup(locale: string, ns: string, path: string): string | undefined {
  let node: string | Catalog | undefined = catalogs[locale]?.[ns];
  for (const part of path.split('.')) node = typeof node === 'object' ? node[part] : undefined;
  return typeof node === 'string' ? node : undefined;
}

export type Vars = Record<string, string | number>;

/** Splits 'ns:path' or an API message key 'errors.<module>.<code>' into namespace and path. */
export function splitKey(key: string): [ns: string, path: string] {
  if (key.includes(':')) return key.split(':', 2) as [string, string];
  const m = /^errors\.([a-z_]+)\.(.+)$/.exec(key);
  if (m) return [`errors/${m[1]}`, m[2]!];
  return ['common', key];
}

/** Finds the matching closing brace for the '{' at index `open`. */
function closing(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return i;
  }
  return -1;
}

function parseOptions(body: string): Map<string, string> {
  const options = new Map<string, string>();
  let i = 0;
  while (i < body.length) {
    while (i < body.length && /\s/.test(body[i]!)) i++;
    const start = i;
    while (i < body.length && body[i] !== '{' && !/\s/.test(body[i]!)) i++;
    const selector = body.slice(start, i);
    while (i < body.length && /\s/.test(body[i]!)) i++;
    if (body[i] !== '{') break;
    const end = closing(body, i);
    if (end < 0) break;
    options.set(selector, body.slice(i + 1, end));
    i = end + 1;
  }
  return options;
}

/** Interpolates variables and the ICU plural/select subset. Unknown variables stay visible. */
export function format(locale: Locale, text: string, vars: Vars = {}): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf('{', i);
    if (open < 0) {
      out += text.slice(i);
      break;
    }
    out += text.slice(i, open);
    const end = closing(text, open);
    if (end < 0) {
      out += text.slice(open);
      break;
    }
    const inner = text.slice(open + 1, end);
    const icu = /^\s*(\w+)\s*,\s*(plural|select)\s*,([\s\S]*)$/.exec(inner);
    if (icu) {
      const name = icu[1]!;
      const kind = icu[2];
      const body = icu[3]!;
      const value = vars[name];
      const options = parseOptions(body);
      let chosen: string | undefined;
      if (kind === 'plural') {
        const n = Number(value);
        chosen = options.get(`=${n}`) ?? options.get(new Intl.PluralRules(locale).select(n)) ?? options.get('other');
        if (chosen !== undefined) chosen = chosen.replace(/#/g, new Intl.NumberFormat(locale).format(n));
      } else {
        chosen = options.get(String(value)) ?? options.get('other');
      }
      out += chosen === undefined ? text.slice(open, end + 1) : format(locale, chosen, vars);
    } else {
      const name = inner.trim();
      const value = vars[name];
      out += value === undefined ? text.slice(open, end + 1) : typeof value === 'number' ? new Intl.NumberFormat(locale).format(value) : value;
    }
    i = end + 1;
  }
  return out;
}

export function hasKey(locale: Locale, key: string): boolean {
  const [ns, path] = splitKey(key);
  return lookup(locale, ns, path) !== undefined;
}

export function translate(locale: Locale, key: string, vars?: Vars): string {
  const [ns, path] = splitKey(key);
  const text = lookup(locale, ns, path) ?? lookup(DEFAULT_LOCALE, ns, path);
  if (text === undefined) {
    // An API error without a catalog entry falls back to the generic message, never to a raw key.
    if (ns.startsWith('errors/')) return lookup(locale, 'common', 'errors.internal') ?? key;
    return key;
  }
  return format(locale, text, vars);
}

/** Time of day in Europe/Amsterdam, e.g. "14:32". */
export function formatTime(locale: Locale, date: Date | string | number): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TIME_ZONE }).format(new Date(date));
}

/** Weekday name in Europe/Amsterdam, e.g. "dinsdag". */
export function formatWeekday(locale: Locale, date: Date | string | number): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: TIME_ZONE }).format(new Date(date));
}

export function formatNumber(locale: Locale, n: number): string {
  return new Intl.NumberFormat(locale).format(n);
}

const STORAGE_KEY = 'rw_locale';

function initialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (LOCALES as readonly string[]).includes(stored)) return stored as Locale;
  } catch {
    // Storage can be unavailable (private mode); fall back to the default.
  }
  return DEFAULT_LOCALE;
}

export interface I18nValue {
  locale: Locale;
  setLocale(locale: Locale): void;
  t(key: string, vars?: Vars): string;
  /** Formats a time of day in Europe/Amsterdam. */
  time(date: Date | string | number): string;
  number(n: number): string;
}

const makeValue = (locale: Locale, setLocale: (l: Locale) => void): I18nValue => ({
  locale,
  setLocale,
  t: (key, vars) => translate(locale, key, vars),
  time: (date) => formatTime(locale, date),
  number: (n) => formatNumber(locale, n),
});

const I18nContext = createContext<I18nValue>(makeValue(DEFAULT_LOCALE, () => {}));

export function I18nProvider({ children, locale: forced }: { children: ReactNode; locale?: Locale }) {
  const [locale, setState] = useState<Locale>(forced ?? initialLocale);
  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = locale;
  }, [locale]);
  const value = useMemo<I18nValue>(
    () =>
      makeValue(locale, (next) => {
        setState(next);
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {
          // Ignore: the choice then lasts for this visit only.
        }
      }),
    [locale],
  );
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useT() {
  return useContext(I18nContext);
}
