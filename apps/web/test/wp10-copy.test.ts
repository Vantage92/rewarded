// WP-10 copy rules (spec §4.6 founder J3; architecture §9.6, §12.1 WP-10): NL/EN parity, forbidden
// words, no "verified" wording on the board dashboard, no hard-coded UI text, every literal key exists.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { catalogFor, hasKey } from '../src/i18n/index.tsx';
import { flatten, lintCopy, lintParity, lintSource } from '../src/i18n/lint.ts';

const NAMESPACES = ['board', 'admin'] as const;
const src = join(import.meta.dirname, '../src/features');
const files = (dir: string): string[] => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : [join(dir, n)]));
const strings = (ns: string, locale: 'nl' | 'en') => flatten(catalogFor(locale, ns) ?? {});

describe('WP-10 copy', () => {
  it.each(NAMESPACES)('%s.json exists with the same keys in nl and en', (ns) => {
    expect(catalogFor('nl', ns)).toBeTruthy();
    expect(lintParity(ns, catalogFor('nl', ns), catalogFor('en', ns))).toEqual([]);
  });

  it.each(NAMESPACES)('%s.json has no forbidden words (spec §3.3)', (ns) => {
    expect(lintCopy(`nl/${ns}.json`, ns, catalogFor('nl', ns)!)).toEqual([]);
    expect(lintCopy(`en/${ns}.json`, ns, catalogFor('en', ns)!)).toEqual([]);
  });

  it('spec §4.6 (founder J3): the board dashboard never says verified, geverifieerd or verificatie', () => {
    for (const locale of ['nl', 'en'] as const) {
      for (const [key, text] of Object.entries(strings('board', locale))) expect(`${key}: ${text}`).not.toMatch(/verifi/i);
    }
  });

  it('spec §4.6 Promotiekit: board copy has no amounts, draws or individual rewards', () => {
    for (const locale of ['nl', 'en'] as const) {
      for (const text of Object.values(strings('board', locale))) expect(text).not.toMatch(/€|\beuro\b|\bkans\b|\bchance\b/i);
    }
  });

  it.each(['board', 'admin'])('features/%s has no hard-coded UI text', (feature) => {
    for (const file of files(join(src, feature)).filter((f) => f.endsWith('.tsx'))) expect(lintSource(file, readFileSync(file, 'utf8'))).toEqual([]);
  });

  it.each([
    ['admin', /\bta\('([a-z0-9_.]+)'/g],
    ['board', /\btb\('([a-z0-9_.]+)'/g],
  ] as const)('every literal key used in features/%s exists in nl and en', (feature, pattern) => {
    const missing: string[] = [];
    for (const file of files(join(src, feature)).filter((f) => f.endsWith('.tsx'))) {
      for (const m of readFileSync(file, 'utf8').matchAll(pattern)) {
        for (const locale of ['nl', 'en'] as const) if (!hasKey(locale, `${feature}:${m[1]}`)) missing.push(`${locale}:${feature}:${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every value of the dynamic admin keys has a label (reason codes, statuses, flags, KPI names)', async () => {
    const { FLAG_REASON_CODES, SAMPLE_REASON_CODES } = await import('@rewarded/core/fraud');
    const { FeatureFlagKey, FlagCode, FlagStatus, WaitlistPriority, ChallengeStatus, RewardKind, SupportLabel } = await import('@rewarded/contracts/common');
    const { KPI_QUERIES } = await import('../src/features/admin/sections/ops.tsx');
    const { ADMIN_SECTIONS } = await import('../src/features/admin/routes.tsx');
    const keys = [
      ...Object.values(FLAG_REASON_CODES).flat().map((c) => `reasons.${c}`),
      ...Object.values(SAMPLE_REASON_CODES).flat().map((c) => `reasons.${c}`),
      ...FeatureFlagKey.options.map((k) => `flag.${k}`),
      ...FlagCode.options.map((k) => `flag_code.${k}`),
      ...FlagStatus.options.map((k) => `flag_status.${k}`),
      ...WaitlistPriority.options.map((k) => `priority.${k}`),
      ...ChallengeStatus.options.map((k) => `challenge_status.${k}`),
      ...RewardKind.options.map((k) => `reward_kind.${k}`),
      ...SupportLabel.options.map((k) => `support_label.${k}`),
      ...KPI_QUERIES.map((q) => `kpi_name.${q}`),
      ...ADMIN_SECTIONS.map(([, , k]) => `nav.${k}`),
    ];
    const missing = keys.flatMap((k) => (['nl', 'en'] as const).filter((l) => !hasKey(l, `admin:${k}`)).map((l) => `${l}:${k}`));
    expect(missing).toEqual([]);
  });
});
