// Minimal i18n helper (WP-0). WP-7 may replace it with i18next (architecture §9.6) behind the same useT().
// Catalogs live in <locale>/<namespace>.json; keys are 'namespace:path.to.key' (namespace defaults to 'common').
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export const LOCALES = ['nl', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'nl';

type Catalog = { [key: string]: string | Catalog };
const files = import.meta.glob<Catalog>('./*/**/*.json', { eager: true, import: 'default' });

const catalogs: Record<string, Record<string, Catalog>> = {};
for (const [path, catalog] of Object.entries(files)) {
  const [, locale, ...rest] = path.split('/');
  const ns = rest.join('/').replace(/\.json$/, '');
  (catalogs[locale!] ??= {})[ns] = catalog;
}

function lookup(locale: string, ns: string, path: string): string | undefined {
  let node: string | Catalog | undefined = catalogs[locale]?.[ns];
  for (const part of path.split('.')) node = typeof node === 'object' ? node[part] : undefined;
  return typeof node === 'string' ? node : undefined;
}

export type Vars = Record<string, string | number>;

export function translate(locale: Locale, key: string, vars?: Vars): string {
  const [ns, path] = key.includes(':') ? (key.split(':', 2) as [string, string]) : ['common', key];
  const text = lookup(locale, ns, path) ?? lookup(DEFAULT_LOCALE, ns, path) ?? key;
  return vars ? text.replace(/\{(\w+)\}/g, (m, name: string) => String(vars[name] ?? m)) : text;
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

interface I18nValue {
  locale: Locale;
  setLocale(locale: Locale): void;
  t(key: string, vars?: Vars): string;
}

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, vars) => translate(DEFAULT_LOCALE, key, vars),
});

export function I18nProvider({ children, locale: forced }: { children: ReactNode; locale?: Locale }) {
  const [locale, setState] = useState<Locale>(forced ?? initialLocale);
  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale(next) {
        setState(next);
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {
          // Ignore: the choice then lasts for this visit only.
        }
      },
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale],
  );
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useT() {
  return useContext(I18nContext);
}
