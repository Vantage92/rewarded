// pnpm secrets:init — generates local peppers (architecture §10.9) into
// $REWARDED_SECRETS_DIR/peppers.json (default ~/.config/rewarded/secrets), outside the repo and outside .data/.
// Existing peppers are never overwritten unless --force is given: rotating breaks all stored hashes.
import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '../..');
const dir = resolve(process.env.REWARDED_SECRETS_DIR || join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'rewarded/secrets'));
const file = join(dir, 'peppers.json');
const force = process.argv.includes('--force');

if (dir === repoRoot || dir.startsWith(repoRoot + '/')) {
  console.error(`[peppers] Refusing to write secrets inside the repository (${dir}). Choose a REWARDED_SECRETS_DIR outside it.`);
  process.exit(1);
}
if (existsSync(file) && !force) {
  console.info(`[peppers] ${file} already exists; leaving it untouched (use --force to rotate).`);
  process.exit(0);
}

const pepper = () => randomBytes(32).toString('base64url');
mkdirSync(dir, { recursive: true, mode: 0o700 });
writeFileSync(
  file,
  JSON.stringify({ pepper_ip: pepper(), pepper_phone: pepper(), pepper_audit: pepper(), created_at: new Date().toISOString() }, null, 2) + '\n',
  { mode: 0o600 },
);
chmodSync(file, 0o600);
console.info(`[peppers] wrote ${file} (mode 0600). Back it up separately from the database.`);
