// Architecture §9.6: i18n helper, ICU subset, key parity and the lint rules against hard-coded text.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { catalogFor, format, formatTime, splitKey, translate } from '../src/i18n/index.tsx';
import { lintCopy, lintParity, lintSource } from '../src/i18n/lint.ts';

const src = join(import.meta.dirname, '../src');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

describe('i18n helper (architecture §9.6)', () => {
  it('translates common keys in NL and EN, falling back to NL', () => {
    expect(translate('nl', 'nav.rewards')).toBe('Beloningen');
    expect(translate('en', 'nav.rewards')).toBe('Rewards');
    expect(translate('en', 'does.not.exist')).toBe('does.not.exist');
  });

  it('supports the ICU plural subset with Dutch and English rules', () => {
    expect(translate('nl', 'timer.remaining_min', { count: 1 })).toBe('Nog 1 minuut');
    expect(translate('nl', 'timer.remaining_min', { count: 25 })).toBe('Nog 25 minuten');
    expect(translate('en', 'timer.remaining_min', { count: 1 })).toBe('1 minute left');
    expect(format('nl', '{n, plural, =0 {geen} one {# lid} other {# leden}}', { n: 0 })).toBe('geen');
    expect(format('nl', '{arm, select, a {A} other {B}}', { arm: 'a' })).toBe('A');
    expect(format('nl', '{x} van {y}', { x: 212, y: 300 })).toBe('212 van 300');
    expect(format('nl', '{missing}')).toBe('{missing}');
  });

  it('maps API message keys to the errors/<module> namespace, with a generic fallback (§9.6)', () => {
    expect(splitKey('errors.sessions.session_closed')).toEqual(['errors/sessions', 'session_closed']);
    expect(splitKey('focus:start')).toEqual(['focus', 'start']);
    expect(translate('nl', 'errors.nope.unknown_code')).toBe('Dit konden we niet ophalen. Je gegevens zijn veilig.');
  });

  it('shows times in Europe/Amsterdam (§9.6)', () => {
    expect(formatTime('nl', '2026-12-02T13:32:00Z')).toBe('14:32');
    expect(formatTime('nl', '2026-07-01T12:32:00Z')).toBe('14:32');
  });

  it('common.json has the same keys in nl and en', () => {
    expect(lintParity('common', catalogFor('nl', 'common'), catalogFor('en', 'common'))).toEqual([]);
  });

  it('common.json has no forbidden words (spec §3.3, architecture §9.6)', () => {
    expect(lintCopy('nl/common.json', 'common', catalogFor('nl', 'common')!)).toEqual([]);
    expect(lintCopy('en/common.json', 'common', catalogFor('en', 'common')!)).toEqual([]);
  });
});

describe('lint rule no-hardcoded-text (architecture §9.6)', () => {
  it('flags JSX text and user-facing attributes', () => {
    const issues = lintSource('x.tsx', `export const A = () => <div aria-label="Sluiten" title={'Hoi'}>Start focussessie {n}</div>;`);
    expect(issues.map((i) => i.rule)).toEqual(['no-hardcoded-text', 'no-hardcoded-text', 'no-hardcoded-text']);
  });

  it('allows t(), symbols, digits and an explicit i18n-ignore', () => {
    const code = [
      'export const A = ({ t }: { t: (k: string) => string }) => (',
      '  <div aria-label={t("x")}>',
      '    {t("y")} · 25 — 50%',
      '    {/* i18n-ignore */}',
      '    Rewarded',
      '  </div>',
      ');',
    ].join('\n');
    expect(lintSource('x.tsx', code)).toEqual([]);
  });

  it('flags forbidden words, except "winnen" in the draws namespace', () => {
    expect(lintCopy('f', 'focus', { a: 'Bewezen focus' })).toHaveLength(1);
    expect(lintCopy('f', 'focus', { a: 'Verdien geld met studeren' })).toHaveLength(1);
    expect(lintCopy('f', 'squads', { a: 'Wie gaat er winnen?' })).toHaveLength(1);
    expect(lintCopy('f', 'draws', { a: 'Kans om te winnen' })).toHaveLength(0);
  });

  it('WP-7 sources (app, design, lib/api) contain no hard-coded text', () => {
    const owned = ['app', 'design', 'lib/api'].flatMap((d) => walk(join(src, d))).filter((f) => f.endsWith('.tsx'));
    expect(owned.length).toBeGreaterThan(10);
    const issues = owned.flatMap((f) => lintSource(relative(src, f), readFileSync(f, 'utf8')));
    expect(issues).toEqual([]);
  });
});
