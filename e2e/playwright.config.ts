import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

// End-to-end suite (architecture §11). One web server (Vite, the real app in dev mode) for the run;
// every worker starts its own API process with its own SQLite file on port 4100 + worker index
// (e2e/support/api.ts), and the pages of a test talk to that API through context.route.
// Browsers come from PLAYWRIGHT_BROWSERS_PATH; never run `playwright install` in the build container.
// Projects:
// - chain: the scenarios of architecture §11 against the real API (e2e/chain);
// - focus: the WP-8 session specs against the protocol fake (e2e/focus, owned by WP-8);
// - shell: the app shell smoke test.
// WebKit is left out: its browser is not in the local cache (tooling/bootstrap/README.md); the
// handmatige checklist (e2e/MANUAL.md) covers Safari on iPhone.
export default defineConfig({
  testDir: '.',
  outputDir: '.output/results',
  reporter: [['list']],
  forbidOnly: !!process.env.CI,
  workers: process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : 2,
  timeout: 120_000,
  use: { baseURL: 'http://localhost:5173', trace: 'retain-on-failure' },
  webServer: {
    command: 'pnpm --filter @rewarded/web exec vite --port 5173 --strictPort',
    cwd: root,
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: 'chain', testDir: './chain', use: { ...devices['Pixel 7'] } },
    { name: 'shell', testMatch: 'shell.spec.ts', use: { ...devices['Pixel 7'] } },
    { name: 'focus', testDir: './focus', use: { ...devices['Pixel 7'] }, fullyParallel: true },
  ],
});
