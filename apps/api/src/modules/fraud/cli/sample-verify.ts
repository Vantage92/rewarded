// Recomputes every stored weekly sample from the seed and the sessions in the database and reports
// whether the stored draw is reproduced (architecture §6.5, voorregistratie §7.1).
//   node apps/api/src/modules/fraud/cli/sample-verify.ts            (DATABASE_PATH, REWARDED_SECRETS_DIR)
// Without a registered experiment seed the derived seed (from pepper_audit) is used, as in the API.
// A sample drawn before an account was deleted can no longer be reproduced exactly; that is reported.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, loadDotEnv } from '../../../config.ts';
import { openDb } from '../../../db/open.ts';
import type { ModuleDeps } from '../../../module.ts';
import { DEV_PEPPERS, DEV_EXPERIMENT_SEED } from '../../../platform/dev.ts';
import { HmacHasher, loadSecrets } from '../../../platform/system.ts';
import { createServices } from '../../../services/index.ts';
import { verifyStoredSample } from '../lib/sample.ts';

loadDotEnv();
const config = loadConfig();
const secrets = existsSync(join(config.secretsDir, 'peppers.json')) ? loadSecrets(config.secretsDir) : null;
const db = openDb({ path: config.databasePath, driver: config.dbDriver });
const services = createServices();
services.sampleSeed = secrets?.experimentSeed ? { seed: secrets.experimentSeed, version: 'v1' } : { seed: secrets ? new HmacHasher(secrets.peppers).hash('audit', 'rewarded-sample-seed') : DEV_EXPERIMENT_SEED, version: secrets ? 'derived' : 'dev' };
const deps = { db, services, platform: { hasher: new HmacHasher(secrets?.peppers ?? DEV_PEPPERS) } } as unknown as ModuleDeps;
let failed = 0;
for (const s of db.all<{ id: string; week_key: string }>("SELECT id, week_key FROM fraud_sample WHERE kind = 'weekly' ORDER BY week_key")) {
  const r = verifyStoredSample(deps, s.id);
  if (!r.ok) failed += 1;
  console.info(`[sample-verify] ${s.week_key} ${r.ok ? 'reproduced' : `DIFFERENT (stored ${r.stored.length}, recomputed ${r.expected.length})`}`);
}
db.close();
process.exitCode = failed > 0 ? 1 : 0;
