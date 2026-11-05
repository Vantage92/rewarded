// CLI for the i18n lint rules: `pnpm -F @rewarded/web lint:i18n`. Scans every .tsx file under
// apps/web/src and every catalog under src/i18n; exits with 1 when an issue is found.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { lintCopy, lintParity, lintSource, type LintIssue } from './lint.ts';

const src = join(import.meta.dirname, '..');
const i18nDir = import.meta.dirname;

function files(dir: string, ext: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...files(path, ext));
    else if (name.endsWith(ext)) out.push(path);
  }
  return out;
}

const issues: LintIssue[] = [];
for (const file of files(src, '.tsx')) issues.push(...lintSource(relative(src, file), readFileSync(file, 'utf8')));

type Catalog = Parameters<typeof lintCopy>[2];
const catalogs: Record<string, Record<string, Catalog>> = { nl: {}, en: {} };
for (const locale of ['nl', 'en'] as const) {
  const dir = join(i18nDir, locale);
  for (const file of files(dir, '.json')) {
    const ns = relative(dir, file).replace(/\.json$/, '');
    const catalog = JSON.parse(readFileSync(file, 'utf8')) as Catalog;
    catalogs[locale]![ns] = catalog;
    issues.push(...lintCopy(relative(src, file), ns, catalog));
  }
}
for (const ns of new Set([...Object.keys(catalogs.nl!), ...Object.keys(catalogs.en!)])) issues.push(...lintParity(ns, catalogs.nl![ns], catalogs.en![ns]));

for (const issue of issues) console.error(`${issue.file}:${issue.line} [${issue.rule}] ${issue.message}`);
console.info(`[lint:i18n] ${issues.length} issue(s)`);
if (issues.length) process.exitCode = 1;
