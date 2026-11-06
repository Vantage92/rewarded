// Production entry: no modules/dev, no settable clock, no dev inbox (architecture §10.3).
import { createApp } from './app.ts';
import { loadConfig, loadDotEnv } from './config.ts';
import { modules } from './modules.gen.ts';
import { CURRENT_PARAMS } from '@rewarded/core';
import { createSqlServices } from './db/services/index.ts';
import { startScheduler } from './jobs/scheduler.ts';
import { httpConfigFromEnv } from './middleware/context.ts';
import { CidrNetClassifier } from './platform/net.ts';
import { CryptoRandom, HmacHasher, SystemClock, UnconfiguredMailer, UnconfiguredSmsSender, deriveSecret, loadSecrets, stdoutLogger } from './platform/system.ts';
import type { Platform } from './platform/types.ts';
import { createServices } from './services/index.ts';
import { openMigratedDb, startServer } from './server.ts';

loadDotEnv();
// Production refuses to start without an explicit proxy choice and an https origin (architecture
// §10.2, §10.3): otherwise every user shares the proxy's IP, or cookies go without Secure.
if (process.env.TRUST_PROXY !== '0' && process.env.TRUST_PROXY !== '1') {
  console.error('[api] TRUST_PROXY must be set to 0 or 1 in production');
  process.exit(1);
}
if (!process.env.APP_ORIGIN?.startsWith('https://')) {
  console.error('[api] APP_ORIGIN must be an https:// origin in production');
  process.exit(1);
}
const config = loadConfig();
const clock = new SystemClock();
const secrets = loadSecrets(config.secretsDir);
const db = openMigratedDb(config, clock);
const platform: Platform = {
  clock,
  random: new CryptoRandom(),
  mailer: new UnconfiguredMailer(),
  sms: new UnconfiguredSmsSender(),
  hasher: new HmacHasher(secrets.peppers),
  logger: stdoutLogger(clock),
  net: new CidrNetClassifier(CURRENT_PARAMS.net_classes),
  totpKey: secrets.totpKey,
};
const http = { ...httpConfigFromEnv(process.env, { appOrigin: 'https://invalid.invalid', trustProxy: false, secureCookies: true, release: 'r1' }), secureCookies: true };
// Without the registered seed (voorregistratie §9.2) the assignment is marked provisional.
if (secrets.experimentSeed === null) platform.logger?.log('warn', 'experiment_seed_missing');
const services = createServices(
  createSqlServices(db, platform, {
    seed: secrets.experimentSeed ?? deriveSecret(secrets.peppers.pepper_audit, 'experiment_seed'),
    seedVersion: secrets.experimentSeed === null ? 'provisional' : 'v1',
    release: http.release,
  }),
);
const deps = { db, platform, services, http };
const app = createApp({ modules, deps });

const server = await startServer(app, config.port);
await startScheduler(deps, platform.logger);
console.info(`[api] listening on port ${server.port} (db: ${db.driver})`);
