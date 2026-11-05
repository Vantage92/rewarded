// pnpm bootstrap — one-time step with network access, so later installs and tests work offline (architecture §2.1).
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const run = (cmd: string) => {
  console.info(`[bootstrap] ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
};

// 1. Fill the pnpm store from the lockfile, so `pnpm install --offline` works afterwards.
run('pnpm fetch');
// 2. better-sqlite3 builds or downloads its native binding during install; node:sqlite is the fallback.
// 3. Playwright browsers: use the preinstalled cache when present; never download here.
const browsers = process.env.PLAYWRIGHT_BROWSERS_PATH;
if (!browsers || !existsSync(browsers)) {
  console.warn('[bootstrap] PLAYWRIGHT_BROWSERS_PATH is not set or missing. See tooling/bootstrap/README.md.');
}
console.info('[bootstrap] done. Next: pnpm install --offline');
