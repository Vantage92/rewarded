// Dev and e2e entry: includes modules/dev, the settable clock and the dev inbox.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createApp } from './app.ts';
import { loadConfig, loadDotEnv } from './config.ts';
import { modules } from './modules.gen.ts';
import { devModules } from './modules.dev.gen.ts';
import { createSqlServices } from './db/services/index.ts';
import { startScheduler } from './jobs/scheduler.ts';
import { httpConfigFromEnv } from './middleware/context.ts';
import { DEV_EXPERIMENT_SEED, DEV_PEPPERS, DEV_TOTP_KEY, DevClock, DevInbox, DevMailer, DevSmsSender } from './platform/dev.ts';
import { DevNetClassifier } from './platform/net.ts';
import { CryptoRandom, HmacHasher, loadSecrets, stdoutLogger } from './platform/system.ts';
import type { Platform } from './platform/types.ts';
import { createServices } from './services/index.ts';
import { openMigratedDb, startServer } from './server.ts';

loadDotEnv();
const config = loadConfig();
const clock = new DevClock();
const inbox = new DevInbox(clock);
const hasPeppers = existsSync(join(config.secretsDir, 'peppers.json'));
if (!hasPeppers) console.warn('[api] No peppers found; using fixed dev peppers. Run `pnpm secrets:init` to generate local ones.');

const secrets = hasPeppers ? loadSecrets(config.secretsDir) : undefined;
const db = openMigratedDb(config, clock);
const platform: Platform = {
  clock,
  random: new CryptoRandom(),
  mailer: new DevMailer(inbox),
  sms: new DevSmsSender(inbox),
  hasher: new HmacHasher(secrets?.peppers ?? DEV_PEPPERS),
  logger: stdoutLogger(clock),
  net: new DevNetClassifier(),
  totpKey: secrets?.totpKey ?? DEV_TOTP_KEY,
};
const http = httpConfigFromEnv(process.env);
// WP-3 services are real; the others stay fakes until their owners pass them in.
const services = createServices(createSqlServices(db, platform, { seed: secrets?.experimentSeed ?? DEV_EXPERIMENT_SEED, seedVersion: 'dev', release: http.release }));
const deps = { db, platform, services, http };
const app = createApp({ modules: [...modules, ...devModules], deps });

const server = await startServer(app, config.port);
await startScheduler(deps, platform.logger);
console.info(`[api] dev server on http://localhost:${server.port}/api/v1 (db: ${db.driver})`);
