import { RouterProvider, type createBrowserRouter } from 'react-router';
import '../design/components.css';
import type { ThemePreference } from '../design/theme.tsx';
import type { Locale } from '../i18n/index.tsx';
import type { WebApi } from '../lib/api/web.ts';
import { AppProviders } from './providers.tsx';

type AppRouter = ReturnType<typeof createBrowserRouter>;

export interface AppProps {
  router: AppRouter;
  locale?: Locale;
  theme?: ThemePreference;
  api?: WebApi;
}

/** Providers around the router. The session store is added by WP-8 inside features/focus. */
export function App({ router, locale, theme, api }: AppProps) {
  return (
    <AppProviders {...(locale ? { locale } : {})} {...(theme ? { theme } : {})} {...(api ? { api } : {})}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
