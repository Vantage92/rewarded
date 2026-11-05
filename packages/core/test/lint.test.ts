// Checks the core lint rules (packages/core/.oxlintrc.json, architecture §2: no I/O, no Node or DOM
// APIs, no Date.now() or Math.random() in core). Core has no Node types on purpose, so Node modules
// are loaded through a variable specifier and typed with the few members this test uses.
import { describe, expect, it } from 'vitest';

interface Fs {
  mkdtempSync(prefix: string): string;
  mkdirSync(path: string, options: { recursive: boolean }): void;
  writeFileSync(path: string, data: string): void;
  readFileSync(path: string, encoding: 'utf8'): string;
  rmSync(path: string, options: { recursive: boolean; force: boolean }): void;
  existsSync(path: string): boolean;
}
interface ChildProcess {
  spawnSync(cmd: string, args: readonly string[], options: { cwd: string; encoding: 'utf8' }): { status: number | null; stdout: string; stderr: string };
}
interface PathMod {
  join(...parts: string[]): string;
  dirname(p: string): string;
}
interface UrlMod {
  fileURLToPath(url: string): string;
}
interface OsMod {
  tmpdir(): string;
}

const load = async <T>(name: string): Promise<T> => (await import(/* @vite-ignore */ name)) as T;
const fs = await load<Fs>('node:fs');
const cp = await load<ChildProcess>('node:child_process');
const path = await load<PathMod>('node:path');
const url = await load<UrlMod>('node:url');
const os = await load<OsMod>('node:os');

const coreDir = path.dirname(path.dirname(url.fileURLToPath((import.meta as unknown as { url: string }).url)));
const repoRoot = path.dirname(path.dirname(coreDir));
const oxlint = path.join(repoRoot, 'node_modules', '.bin', 'oxlint');

/** Lints the given sources with a copy of the core config placed at the same relative spot (src/**). */
function lintCore(files: Record<string, string>): { status: number | null; out: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-core-lint-'));
  try {
    const config = JSON.parse(fs.readFileSync(path.join(coreDir, '.oxlintrc.json'), 'utf8')) as Record<string, unknown>;
    config.extends = [path.join(repoRoot, '.oxlintrc.json')];
    delete config.$schema;
    fs.writeFileSync(path.join(dir, '.oxlintrc.json'), JSON.stringify(config));
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    for (const [name, src] of Object.entries(files)) fs.writeFileSync(path.join(dir, 'src', name), src);
    const r = cp.spawnSync(oxlint, ['--deny-warnings', '-c', path.join(dir, '.oxlintrc.json'), path.join(dir, 'src')], { cwd: dir, encoding: 'utf8' });
    return { status: r.status, out: r.stdout + r.stderr };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const hasOxlint = fs.existsSync(oxlint);

describe.skipIf(!hasOxlint)('core lint rules (arch §2 Mag niet: I/O, Date.now(), Math.random(), DOM, Node-API)', () => {
  const forbidden: [string, string, string][] = [
    ['node-prefixed import', "import { readFileSync } from 'node:fs';\nexport const f = readFileSync;\n", 'no-restricted-imports'],
    ['bare Node built-in import', "import { createHash } from 'crypto';\nexport const h = createHash;\n", 'no-restricted-imports'],
    ['path import', "import * as p from 'path';\nexport const j = p.join;\n", 'no-restricted-imports'],
    ['dynamic Node import', "export const m = await import('node:child_process');\n", 'no-restricted-imports'],
    ['re-export from Node', "export { join } from 'node:path';\n", 'no-restricted-imports'],
    ['UI library', "import { useState } from 'react';\nexport const u = useState;\n", 'no-restricted-imports'],
    ['contracts (wrong direction)', "import * as c from '@rewarded/contracts';\nexport const x = c;\n", 'no-restricted-imports'],
    ['DOM document', 'export const t = (): string => document.title;\n', 'no-restricted-globals'],
    ['DOM window', 'export const w = (): number => window.innerWidth;\n', 'no-restricted-globals'],
    ['DOM navigator', 'export const n = (): boolean => navigator.onLine;\n', 'no-restricted-globals'],
    ['DOM localStorage', "export const s = (): string | null => localStorage.getItem('x');\n", 'no-restricted-globals'],
    ['fetch', "export const g = (): Promise<unknown> => fetch('/x');\n", 'no-restricted-globals'],
    ['Node process', 'export const e = (): unknown => process.env;\n', 'no-restricted-globals'],
    ['Node Buffer', "export const b = (): unknown => Buffer.from('x');\n", 'no-restricted-globals'],
    ['timers', 'export const t = (): unknown => setTimeout(() => 0, 1);\n', 'no-restricted-globals'],
    ['performance clock', 'export const p = (): number => performance.now();\n', 'no-restricted-globals'],
    ['web crypto', 'export const r = (): unknown => crypto.getRandomValues(new Uint8Array(4));\n', 'no-restricted-globals'],
    ['Date.now()', 'export const n = (): number => Date.now();\n', 'no-restricted-properties'],
    ['Math.random()', 'export const r = (): number => Math.random();\n', 'no-restricted-properties'],
  ];

  for (const [name, src, rule] of forbidden) {
    it(`arch §2: rejects ${name}`, () => {
      const r = lintCore({ 'probe.ts': src });
      expect(r.status).not.toBe(0);
      expect(r.out).toContain(rule);
    });
  }

  it('arch §2: allows zod, pure Date maths and relative imports', () => {
    const r = lintCore({
      'a.ts': "import { z } from 'zod';\nexport const S = z.string();\nexport const t = (y: number): number => Date.UTC(y, 0, 1);\n",
      'b.ts': "import { S } from './a.ts';\nexport const parse = (v: unknown): string => S.parse(v);\n",
    });
    expect({ status: r.status, out: r.out }).toMatchObject({ status: 0 });
  });

  it('arch §2: the real packages/core/src passes the core rules', () => {
    const r = cp.spawnSync(oxlint, ['--deny-warnings', path.join(coreDir, 'src')], { cwd: repoRoot, encoding: 'utf8' });
    expect({ status: r.status, out: r.stdout + r.stderr }).toMatchObject({ status: 0 });
  });
});
