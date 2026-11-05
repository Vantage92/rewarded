import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const reuse = !process.env.CI;

// WP-0: one API and one web server for the whole run. WP-11 moves to an API process per worker (architecture §11).
// Browsers come from PLAYWRIGHT_BROWSERS_PATH; never run `playwright install` in the build container.
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  outputDir: '.output',
  reporter: [['list']],
  forbidOnly: !!process.env.CI,
  use: { baseURL: 'http://localhost:5173', trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'pnpm --filter @rewarded/api start:dev',
      cwd: root,
      url: 'http://localhost:8787/api/v1/health',
      env: { DATABASE_PATH: ':memory:', PORT: '8787' },
      reuseExistingServer: reuse,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter @rewarded/web dev',
      cwd: root,
      url: 'http://localhost:5173',
      reuseExistingServer: reuse,
      timeout: 60_000,
    },
  ],
  // WebKit follows when its browser is in the cache (tooling/bootstrap/README.md).
  projects: [{ name: 'chromium', use: { ...devices['Pixel 7'] } }],
});
