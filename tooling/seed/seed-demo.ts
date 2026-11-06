// pnpm seed:demo [--empty] — builds the demo data (architecture §11 "Seeddata") in the database of
// the dev server (DATABASE_PATH, default .data/rewarded.sqlite). Stop `pnpm dev` first. The run is
// deterministic and idempotent: it empties the database and builds the same data every time.
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, loadDotEnv } from '../../apps/api/src/config.ts';
import { resetDatabase } from '../../apps/api/src/modules/dev/index.ts';
import type { ModuleDeps } from '../../apps/api/src/module.ts';
import { DEV_PEPPERS, DevClock } from '../../apps/api/src/platform/dev.ts';
import { HmacHasher, loadSecrets } from '../../apps/api/src/platform/system.ts';
import { openMigratedDb } from '../../apps/api/src/server.ts';
import { DEMO_ADMINS, adminSecretBase32 } from './admins.ts';
import { DEMO_NOW, DEMO_SETUP_AT } from './demo.ts';
import { seedDemoOn, seedEmpty } from './index.ts';

loadDotEnv();
const config = loadConfig();
const empty = process.argv.includes('--empty');
const quiet = process.argv.includes('--quiet');
const clock = new DevClock(new Date(DEMO_SETUP_AT));
const hasPeppers = existsSync(join(config.secretsDir, 'peppers.json'));
const secrets = hasPeppers ? loadSecrets(config.secretsDir) : undefined;
// Idempotent: start from a new file every run (an emptied file would keep SQLite sequences).
if (config.databasePath !== ':memory:') for (const suffix of ['', '-wal', '-shm']) rmSync(config.databasePath + suffix, { force: true });
const db = openMigratedDb(config, clock);
const started = Date.now();
if (config.databasePath === ':memory:') resetDatabase({ db } as ModuleDeps);
const base = {
  db,
  clock,
  hasher: new HmacHasher(secrets?.peppers ?? DEV_PEPPERS),
  ...(secrets ? { totpKey: secrets.totpKey } : {}),
  ...(secrets?.experimentSeed ? { experimentSeed: secrets.experimentSeed } : {}),
  ...(quiet ? {} : { log: (m: string) => console.info(`[seed] ${m}`) }),
};
if (empty) {
  seedEmpty(base);
} else {
  const r = await seedDemoOn(base);
  console.info(`[seed:demo] ${r.students} studenten, ${r.squads} squads, ${Object.keys(r.clubs).length} verenigingen, ${r.sessions} geplande sessies, red team ${r.redTeam}, wachtlijst ${r.waitlistWaiting}.`);
  for (const [k, c] of Object.entries(r.clubs)) console.info(`[seed:demo] vereniging ${k}: code ${c.code}`);
  console.info(`[seed:demo] bestuursleden: ${r.boardMembers.join(', ')}`);
}
for (const a of DEMO_ADMINS) console.info(`[seed:${empty ? 'empty' : 'demo'}] beheerder ${a.email} (${a.role}), TOTP-geheim ${adminSecretBase32(a.key)}`);
console.info(`[seed] klaar in ${((Date.now() - started) / 1000).toFixed(1)} s in ${config.databasePath} (${db.driver}).`);
console.info(`[seed] Zet na \`pnpm dev\` de klok op de demo: POST /api/v1/dev/clock {"set":"${new Date(empty ? DEMO_SETUP_AT : DEMO_NOW).toISOString()}"}, of gebruik POST /api/v1/dev/reset {"seed":"demo"} op de draaiende server.`);
db.close();
