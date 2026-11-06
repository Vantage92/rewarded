import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'vite';
import { describe, expect, it } from 'vitest';
import { DEV_MODULE_MARKER } from '../src/modules/dev/index.ts';

const apiDir = join(import.meta.dirname, '..');

describe('production bundle', () => {
  it('contains no dev module, dev clock or dev inbox (architecture §10.3)', async () => {
    // Same depth as dist/: config.ts finds the repository root three folders up from the bundle.
    const outDir = join(apiDir, '.prod-bundle-test');
    rmSync(outDir, { recursive: true, force: true });
    await build({ root: apiDir, configFile: join(apiDir, 'vite.config.ts'), logLevel: 'silent', build: { outDir } });
    const code = readdirSync(outDir, { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('.js'))
      .map((f) => readFileSync(join(outDir, f), 'utf8'))
      .join('\n');
    expect(code).toContain('/api/v1');
    expect(code).not.toContain(DEV_MODULE_MARKER);
    expect(code).not.toContain('DevClock');
    expect(code).not.toContain('DevInbox');

    // Integration wave: the bundle also starts, serves /health and has no dev routes (§10.3).
    const tmp = mkdtempSync(join(tmpdir(), 'rw-prod-'));
    const pep = () => Buffer.from(Array.from({ length: 32 }, (_, i) => (i * 37 + 11) % 256)).toString('base64url');
    writeFileSync(join(tmp, 'peppers.json'), JSON.stringify({ pepper_ip: `${pep()}i`, pepper_phone: `${pep()}p`, pepper_audit: `${pep()}a` }));
    const port = 18_000 + Math.floor(Math.random() * 1000);
    const child = spawn(process.execPath, [join(outDir, 'server.prod.js')], {
      env: { ...process.env, PORT: String(port), DATABASE_PATH: join(tmp, 'prod.sqlite'), REWARDED_SECRETS_DIR: tmp, TRUST_PROXY: '0', APP_ORIGIN: 'https://rewarded.test' },
      stdio: 'pipe',
    });
    try {
      let health: Response | undefined;
      for (let i = 0; i < 50 && !health; i++) {
        await new Promise((r) => setTimeout(r, 200));
        health = await fetch(`http://127.0.0.1:${port}/api/v1/health`).catch(() => undefined);
      }
      expect(health?.status).toBe(200);
      const body = (await health!.json()) as { modules: string[] };
      expect(body.modules).not.toContain('dev');
      for (const path of ['/dev/inbox', '/dev/clock', '/dev/jobs/sweep/run', '/dev/reset']) {
        expect((await fetch(`http://127.0.0.1:${port}/api/v1${path}`)).status).toBe(404);
      }
    } finally {
      child.kill();
      rmSync(tmp, { recursive: true, force: true });
      rmSync(outDir, { recursive: true, force: true });
    }
  }, 90_000);
});
