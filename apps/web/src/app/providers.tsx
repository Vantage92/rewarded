// Providers around the router (architecture §9.2): TanStack Query, the typed API client, i18n,
// theme and shell state. Tests of other packages can wrap components in <AppProviders>.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ThemeProvider, type ThemePreference } from '../design/theme.tsx';
import { I18nProvider, type Locale } from '../i18n/index.tsx';
import { ApiProvider } from '../lib/api/react.tsx';
import type { WebApi } from '../lib/api/web.ts';
import { ShellProvider } from './shell.tsx';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Keep the last known data on errors (UX §3.1 Fout) and retry once, not on 4xx.
        retry: (count, error) => {
          const status = (error as { status?: number }).status ?? 0;
          return count < 1 && !(status >= 400 && status < 500);
        },
        staleTime: 15_000,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  });
}

export interface AppProvidersProps {
  children: ReactNode;
  locale?: Locale;
  theme?: ThemePreference;
  api?: WebApi;
  queryClient?: QueryClient;
}

export function AppProviders({ children, locale, theme, api, queryClient }: AppProvidersProps) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  return (
    <QueryClientProvider client={client}>
      <ApiProvider {...(api ? { value: api } : {})}>
        <I18nProvider {...(locale ? { locale } : {})}>
          <ThemeProvider {...(theme ? { preference: theme } : {})}>
            <ShellProvider>{children}</ShellProvider>
          </ThemeProvider>
        </I18nProvider>
      </ApiProvider>
    </QueryClientProvider>
  );
}
