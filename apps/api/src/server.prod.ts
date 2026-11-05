// Production entry: no modules/dev, no settable clock, no dev inbox (architecture §10.3).
import { createApp } from './app.ts';
import { loadConfig, loadDotEnv } from './config.ts';
import { modules } from './modules.gen.ts';
import { CryptoRandom, HmacHasher, SystemClock, UnconfiguredMailer, UnconfiguredSmsSender, loadPeppers } from './platform/system.ts';
import { createServices } from './services/index.ts';
import { openMigratedDb, startServer } from './server.ts';

loadDotEnv();
const config = loadConfig();
const clock = new SystemClock();
const db = openMigratedDb(config, clock);
const app = createApp({
  modules,
  deps: {
    db,
    platform: {
      clock,
      random: new CryptoRandom(),
      mailer: new UnconfiguredMailer(),
      sms: new UnconfiguredSmsSender(),
      hasher: new HmacHasher(loadPeppers(config.secretsDir)),
    },
    services: createServices(),
  },
});

const server = await startServer(app, config.port);
console.info(`[api] listening on port ${server.port} (db: ${db.driver})`);
