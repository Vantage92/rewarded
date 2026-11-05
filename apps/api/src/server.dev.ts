// Dev and e2e entry: includes modules/dev, the settable clock and the dev inbox.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createApp } from './app.ts';
import { loadConfig, loadDotEnv } from './config.ts';
import { modules } from './modules.gen.ts';
import { devModules } from './modules.dev.gen.ts';
import { DEV_PEPPERS, DevClock, DevInbox, DevMailer, DevSmsSender } from './platform/dev.ts';
import { CryptoRandom, HmacHasher, loadPeppers } from './platform/system.ts';
import { createServices } from './services/index.ts';
import { openMigratedDb, startServer } from './server.ts';

loadDotEnv();
const config = loadConfig();
const clock = new DevClock();
const inbox = new DevInbox(clock);
const hasPeppers = existsSync(join(config.secretsDir, 'peppers.json'));
if (!hasPeppers) console.warn('[api] No peppers found; using fixed dev peppers. Run `pnpm secrets:init` to generate local ones.');

const db = openMigratedDb(config, clock);
const app = createApp({
  modules: [...modules, ...devModules],
  deps: {
    db,
    platform: {
      clock,
      random: new CryptoRandom(),
      mailer: new DevMailer(inbox),
      sms: new DevSmsSender(inbox),
      hasher: new HmacHasher(hasPeppers ? loadPeppers(config.secretsDir) : DEV_PEPPERS),
    },
    services: createServices(),
  },
});

const server = await startServer(app, config.port);
console.info(`[api] dev server on http://localhost:${server.port}/api/v1 (db: ${db.driver})`);
