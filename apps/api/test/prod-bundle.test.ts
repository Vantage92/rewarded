import { readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'vite';
import { describe, expect, it } from 'vitest';
import { DEV_MODULE_MARKER } from '../src/modules/dev/index.ts';

const apiDir = join(import.meta.dirname, '..');

describe('production bundle', () => {
  it('contains no dev module, dev clock or dev inbox (architecture §10.3)', async () => {
    const outDir = join(apiDir, '.cache/prod-bundle-test');
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
    rmSync(outDir, { recursive: true, force: true });
  }, 60_000);
});
