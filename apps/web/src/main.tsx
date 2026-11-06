import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { App } from './app/App.tsx';
import { routes } from './app/routes.tsx';
import { registerServiceWorker } from './app/sw-register.ts';
import { canActivateUpdate } from './features/focus/session/context.tsx';
import './design/tokens.css';
import './design/base.css';

const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App router={router} />
  </StrictMode>,
);

// The service worker exists only in the production build (vite-plugin-pwa, injectManifest). A new
// version activates only while no focus session runs (architecture §9.4; WP-8 canActivateUpdate).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  void registerServiceWorker({ canActivate: canActivateUpdate }).then((sw) => {
    // applyUpdate refuses while a session runs; try again on return to the page and every minute.
    const tryUpdate = () => {
      if (sw.updateWaiting) sw.applyUpdate();
    };
    tryUpdate();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') tryUpdate();
    });
    setInterval(tryUpdate, 60_000);
  });
}
