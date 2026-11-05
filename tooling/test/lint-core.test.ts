// Proves the lint guard from architecture §2: no Node or DOM APIs, no Date.now()/Math.random() in core.
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '../..');

function lint(file: string): string {
  try {
    execFileSync(join(root, 'node_modules/.bin/oxlint'), ['--deny-warnings', file], { cwd: root, encoding: 'utf8' });
    return '';
  } catch (err) {
    return String((err as { stdout?: string }).stdout);
  }
}

describe('core lint rules', () => {
  it('rejects Node, DOM and nondeterministic APIs in packages/core', () => {
    const dir = join(root, 'packages/core/src/.lint-probe');
    const file = join(dir, 'probe.ts');
    mkdirSync(dir, { recursive: true });
    try {
      writeFileSync(
        file,
        "import { readFileSync } from 'node:fs';\nimport path from 'path';\n" +
          'export const probe = [readFileSync, path, document.title, process.env, Date.now(), Math.random()];\n',
      );
      const out = lint(file);
      expect(out).toContain("'node:fs' import is restricted");
      expect(out).toContain("'path' import is restricted");
      expect(out).toContain("Unexpected use of 'document'");
      expect(out).toContain("Unexpected use of 'process'");
      expect(out).toContain("'Date.now' is restricted");
      expect(out).toContain("'Math.random' is restricted");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
