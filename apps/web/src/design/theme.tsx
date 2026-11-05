// Theme: light, dark or system (UX §5.2, default system). System follows prefers-color-scheme via
// tokens.css; a manual choice sets <html data-theme>. Stored in localStorage with try/catch (§9.3).
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'rw_theme';
const QUERY = '(prefers-color-scheme: dark)';

function storedPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && (THEME_PREFERENCES as readonly string[]).includes(v)) return v as ThemePreference;
  } catch {
    // Storage unavailable: use the system setting.
  }
  return 'system';
}

function systemTheme(): ResolvedTheme {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches ? 'dark' : 'light';
}

/** Applies a preference to <html>: data-theme for a manual choice, nothing for system. */
export function applyTheme(preference: ThemePreference, root: HTMLElement = document.documentElement): void {
  if (preference === 'system') delete root.dataset.theme;
  else root.dataset.theme = preference;
}

export interface ThemeValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference(preference: ThemePreference): void;
}

const ThemeContext = createContext<ThemeValue>({ preference: 'system', resolved: 'light', setPreference: () => {} });

export function ThemeProvider({ children, preference: forced }: { children: ReactNode; preference?: ThemePreference }) {
  const [preference, setState] = useState<ThemePreference>(forced ?? storedPreference);
  const [system, setSystem] = useState<ResolvedTheme>(systemTheme);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(QUERY);
    const onChange = () => setSystem(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => applyTheme(preference), [preference]);

  const resolved: ResolvedTheme = preference === 'system' ? system : preference;

  // Keep the browser UI colour in step with the surface (manifest theme_color is the light value).
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) return;
    const value = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim();
    if (value) meta.content = value;
  }, [resolved]);

  const value = useMemo<ThemeValue>(
    () => ({
      preference,
      resolved,
      setPreference(next) {
        setState(next);
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {
          // Ignore: the choice then lasts for this visit only.
        }
      },
    }),
    [preference, resolved],
  );
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}
