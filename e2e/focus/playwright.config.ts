import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));

// WP-8 session specs: the web app in dev mode against the protocol fake (fake-api.ts) behind
// page.route, so they run while the API is still being built. `pnpm e2e` (root config) also picks
// these specs up; there the fake intercepts /api as well. Browsers come from PLAYWRIGHT_BROWSERS_PATH.
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  outputDir: '../.output/focus',
  reporter: [['list']],
  fullyParallel: true,
  use: { baseURL: 'http://localhost:5174', trace: 'retain-on-failure' },
  webServer: {
    command: 'pnpm --filter @rewarded/web exec vite --port 5174 --strictPort',
    cwd: root,
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Pixel 7'] } }],
});
