import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const web = fileURLToPath(new URL('../..', import.meta.url));

// WP-7: installability and offline shell against the production build (architecture §9.4), plus axe
// with colour contrast in a real browser. Run with `pnpm -F @rewarded/web test:pwa` (builds first).
// Browsers come from PLAYWRIGHT_BROWSERS_PATH; never `playwright install` in the build container.
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  outputDir: '../../.cache/pwa-output',
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  webServer: {
    command: 'pnpm exec vite preview --port 4173 --strictPort',
    cwd: web,
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Pixel 7'] } }],
});
