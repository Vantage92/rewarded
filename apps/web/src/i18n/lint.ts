// i18n lint rules (WP-7, architecture §9.6). Pure functions over file contents, used by the
// Vitest suite (test/wp7-i18n.test.ts) and by `pnpm -F @rewarded/web lint:i18n` (lint-cli.ts).
//
// Rule 1 `no-hardcoded-text`: JSX text and user-facing string attributes must come from t().
//   Text without letters (punctuation, digits, symbols) is allowed. A line can opt out with a
//   comment `i18n-ignore` on that line or the line above (for brand names in tests, for example).
// Rule 2 `forbidden-words`: copy may not say "bewezen", "verdien geld" or "winnen" (outside the
//   draws namespace), nor the English equivalents (spec §3.3, rapport 04 §10).
// Rule 3 `missing-key`: every key exists in both nl and en.
import { parseSync } from 'vite';

export interface LintIssue {
  file: string;
  line: number;
  rule: 'no-hardcoded-text' | 'forbidden-words' | 'missing-key' | 'parse-error';
  message: string;
}

/** Attributes whose string value is read or shown to the user. */
const TEXT_ATTRIBUTES = new Set(['aria-label', 'aria-description', 'aria-valuetext', 'aria-roledescription', 'title', 'alt', 'placeholder', 'label']);
const HAS_LETTER = /\p{L}/u;

interface Node {
  type: string;
  start: number;
  [key: string]: unknown;
}

function lineAt(source: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < source.length; i++) if (source.charCodeAt(i) === 10) line++;
  return line;
}

function ignored(lines: string[], line: number): boolean {
  return (lines[line - 1] ?? '').includes('i18n-ignore') || (lines[line - 2] ?? '').includes('i18n-ignore');
}

function walk(node: unknown, visit: (n: Node) => void): void {
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit);
    return;
  }
  if (!node || typeof node !== 'object') return;
  const n = node as Node;
  if (typeof n.type === 'string') visit(n);
  for (const [key, value] of Object.entries(n)) {
    if (key === 'start' || key === 'end' || key === 'type') continue;
    if (value && typeof value === 'object') walk(value, visit);
  }
}

/** Finds hard-coded user-facing text in a .tsx source. */
export function lintSource(file: string, source: string): LintIssue[] {
  const result = parseSync(file, source, { lang: file.endsWith('.tsx') ? 'tsx' : 'ts' });
  const issues: LintIssue[] = [];
  for (const error of result.errors) issues.push({ file, line: 1, rule: 'parse-error', message: error.message });
  const lines = source.split('\n');
  const report = (offset: number, text: string) => {
    const line = lineAt(source, offset);
    if (ignored(lines, line)) return;
    issues.push({ file, line, rule: 'no-hardcoded-text', message: `Hard-coded text "${text.trim().slice(0, 60)}": use t() and common.json` });
  };
  walk(result.program, (n) => {
    if (n.type === 'JSXText') {
      const value = String(n.value);
      if (HAS_LETTER.test(value)) report(n.start, value);
    } else if (n.type === 'JSXAttribute') {
      const name = (n.name as { name?: unknown } | undefined)?.name;
      const value = n.value as { type?: string; value?: unknown; expression?: { type?: string; value?: unknown; quasis?: unknown[] } } | null;
      if (typeof name !== 'string' || !TEXT_ATTRIBUTES.has(name) || !value) return;
      if (value.type === 'Literal' && typeof value.value === 'string' && HAS_LETTER.test(value.value)) report(n.start, value.value);
      const expr = value.expression;
      if (value.type === 'JSXExpressionContainer' && expr?.type === 'Literal' && typeof expr.value === 'string' && HAS_LETTER.test(expr.value)) report(n.start, expr.value);
      if (value.type === 'JSXExpressionContainer' && expr?.type === 'TemplateLiteral') {
        const raw = (expr.quasis ?? []).map((q) => String((q as { value?: { raw?: string } }).value?.raw ?? '')).join('');
        if (HAS_LETTER.test(raw)) report(n.start, raw);
      }
    }
  });
  return issues;
}

type Catalog = { [key: string]: string | Catalog };

const FORBIDDEN: { pattern: RegExp; allowIn?: RegExp }[] = [
  { pattern: /\bbewezen\b/i },
  { pattern: /\bverdien(en)?\s+(je\s+)?geld\b/i },
  { pattern: /\bwinnen\b/i, allowIn: /^draws$/ },
  { pattern: /\bproven\b/i },
  { pattern: /\bearn\s+(real\s+)?money\b/i },
  { pattern: /\bwin(s|ning)?\b/i, allowIn: /^draws$/ },
];

export function flatten(catalog: Catalog, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(catalog)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out.set(path, value);
    else for (const [k, v] of flatten(value, path)) out.set(k, v);
  }
  return out;
}

/** Checks one namespace's copy for forbidden words. */
export function lintCopy(file: string, namespace: string, catalog: Catalog): LintIssue[] {
  const issues: LintIssue[] = [];
  for (const [key, text] of flatten(catalog)) {
    for (const rule of FORBIDDEN) {
      if (rule.allowIn?.test(namespace)) continue;
      if (rule.pattern.test(text)) issues.push({ file, line: 1, rule: 'forbidden-words', message: `${namespace}:${key} contains "${rule.pattern.source}"` });
    }
  }
  return issues;
}

/** Checks that nl and en have the same keys for one namespace. */
export function lintParity(namespace: string, nl: Catalog | undefined, en: Catalog | undefined): LintIssue[] {
  const a = nl ? flatten(nl) : new Map<string, string>();
  const b = en ? flatten(en) : new Map<string, string>();
  const issues: LintIssue[] = [];
  for (const key of a.keys()) if (!b.has(key)) issues.push({ file: `en/${namespace}.json`, line: 1, rule: 'missing-key', message: `${namespace}:${key} is missing in en` });
  for (const key of b.keys()) if (!a.has(key)) issues.push({ file: `nl/${namespace}.json`, line: 1, rule: 'missing-key', message: `${namespace}:${key} is missing in nl` });
  return issues;
}
