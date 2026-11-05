// WP-9 copy rules (spec §3.5 step 2, §4.7, §4.8; UX §6.1, §6.3; architecture §9.6): NL/EN parity,
// forbidden words, no points or prizes in invitations, no euro value next to points, no chance
// language, and every literal key used in the WP-9 features exists in both languages.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { catalogFor, hasKey } from '../src/i18n/index.tsx';
import { flatten, lintCopy, lintParity, lintSource } from '../src/i18n/lint.ts';

const NAMESPACES = ['points', 'squads', 'duels', 'club', 'challenges', 'belofte', 'cards', 'profile'] as const;
const FEATURES = ['points', 'squads', 'duels', 'club', 'challenges', 'belofte', 'cards', 'draws', 'profile'] as const;
const src = join(import.meta.dirname, '../src/features');
const files = (dir: string): string[] => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : [join(dir, n)]));
const strings = (ns: string, locale: 'nl' | 'en') => flatten(catalogFor(locale, ns) ?? {});

describe('WP-9 namespaces (architecture §9.6)', () => {
  it.each(NAMESPACES)('%s.json exists with the same keys in nl and en', (ns) => {
    expect(catalogFor('nl', ns)).toBeTruthy();
    expect(lintParity(ns, catalogFor('nl', ns), catalogFor('en', ns))).toEqual([]);
  });

  it.each(NAMESPACES)('%s.json has no forbidden words (spec §6.1, UX §6.1 rule 6)', (ns) => {
    expect(lintCopy(`nl/${ns}.json`, ns, catalogFor('nl', ns)!)).toEqual([]);
    expect(lintCopy(`en/${ns}.json`, ns, catalogFor('en', ns)!)).toEqual([]);
  });

  it.each(FEATURES)('features/%s has no hard-coded UI text', (feature) => {
    for (const file of files(join(src, feature)).filter((f) => f.endsWith('.tsx'))) expect(lintSource(file, readFileSync(file, 'utf8'))).toEqual([]);
  });

  it('every literal t() key in the WP-9 features exists in nl and en', () => {
    const missing: string[] = [];
    for (const feature of FEATURES) {
      for (const file of files(join(src, feature)).filter((f) => /\.tsx?$/.test(f))) {
        for (const m of readFileSync(file, 'utf8').matchAll(/\bt\(\s*'([a-z_]+:[a-zA-Z0-9_.]+|[a-z_]+\.[a-zA-Z0-9_.]+)'/g)) {
          const key = m[1]!;
          if (!hasKey('nl', key) || !hasKey('en', key)) missing.push(`${feature}: ${key}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('copy rules of spec and UX', () => {
  it('spec §3.5 step 2, §4.9: invitation and share texts mention no points, prizes or money', () => {
    const texts = (['nl', 'en'] as const).flatMap((l) => [strings('squads', l).get('invite.text'), strings('duels', l).get('link_text'), strings('profile', l).get('referral.share_text')]);
    for (const text of texts) {
      expect(text).toBeTruthy();
      expect(text!.replace('geen punten op het spel', '').replace('no points at stake', '')).not.toMatch(/punt|prijs|beloning|geld|€|\bpoints?\b|\bprizes?\b|\brewards?\b|money/i);
    }
  });

  it('UX principle P7: a euro amount appears only on the Plus fake door', () => {
    const hits: string[] = [];
    for (const ns of NAMESPACES) for (const l of ['nl', 'en'] as const) for (const [k, v] of strings(ns, l)) if (/€|\beuro/i.test(v)) hits.push(`${ns}:${k}`);
    expect([...new Set(hits)]).toEqual(['points:plus.text']);
  });

  it('UX §6.1 rule 5, spec §4.7: no "kans", "verloot" or lottery words; earned prizes say "Verdiend"', () => {
    for (const ns of NAMESPACES) for (const l of ['nl', 'en'] as const) for (const [k, v] of strings(ns, l)) expect(`${ns}:${k} ${v}`).not.toMatch(/\bkans(en)?\b|verlo(o)?t|trekking|lottery|raffle|\bdraws?\b|\bchance\b/i);
    expect(strings('club', 'nl').get('prize.earned')).toBe('Verdiend');
  });

  it('UX §6.1 rule 6: no shame, scarcity or urgency words', () => {
    for (const ns of NAMESPACES) for (const [k, v] of strings(ns, 'nl')) expect(`${ns}:${k} ${v}`).not.toMatch(/gefaald|mis het niet|nog maar|gratis geld|alleen echte focus telt|nodig uit en verdien|jij bent de enige|\bbewezen\b/i);
  });

  it('spec §4.8: the verification statement says what the card does not show', () => {
    const statements = [...strings('cards', 'nl')].filter(([k]) => k.startsWith('verify.statement')).map(([, v]) => v);
    expect(statements.length).toBeGreaterThan(1);
    for (const v of statements) expect(v).toMatch(/Dat bewijst niet dat er geen ander apparaat gebruikt is en ook niet wat er geleerd is\./);
  });

  it('spec §3.9: draws have no namespace and no route', async () => {
    expect(catalogFor('nl', 'draws')).toBeUndefined();
    const { routes } = await import('../src/features/draws/routes.tsx');
    expect(routes).toEqual([]);
  });
});
