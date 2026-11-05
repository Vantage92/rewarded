import { RouterProvider, type createBrowserRouter } from 'react-router';
import { I18nProvider, type Locale } from '../i18n/index.tsx';

type AppRouter = ReturnType<typeof createBrowserRouter>;

/** Providers around the router. TanStack Query and the session store are added by WP-7 and WP-8. */
export function App({ router, locale }: { router: AppRouter; locale?: Locale }) {
  return (
    <I18nProvider {...(locale ? { locale } : {})}>
      <RouterProvider router={router} />
    </I18nProvider>
  );
}
