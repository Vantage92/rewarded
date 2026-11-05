// UX §5.2 / WCAG 2.2 1.4.3 and 1.4.11: contrast of every token pair, in light and dark, computed
// with the WCAG relative-luminance formula on tokens.json, plus tokens.css in sync with tokens.json.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const dir = join(import.meta.dirname, '../src/design');
const tokens = JSON.parse(readFileSync(join(dir, 'tokens.json'), 'utf8')) as {
  color: Record<string, { light: string; dark: string }>;
  $contrast: [string, string, number][];
};
const css = readFileSync(join(dir, 'tokens.css'), 'utf8');

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
export function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`not a hex colour: ${hex}`);
  const n = parseInt(m[1]!, 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('design tokens (UX §5.2)', () => {
  it('computes WCAG contrast correctly', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrast('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  for (const mode of ['light', 'dark'] as const) {
    it.each(tokens.$contrast)(`UX §5.2 ${mode}: %s on %s is at least %d:1`, (fg, bg, min) => {
      const ratio = contrast(tokens.color[fg]![mode], tokens.color[bg]![mode]);
      expect(ratio).toBeGreaterThanOrEqual(min);
    });
  }

  it('UX §5.2 card-share-bg: dark text and dark primary-text reach 4.5:1 on the share card', () => {
    const bg = tokens.color['card-share-bg']!.light;
    expect(contrast(tokens.color.text!.dark, bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens.color['primary-text']!.dark, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('UX §5.2: the session screen is dark in both themes', () => {
    for (const key of ['session-bg', 'session-text', 'session-accent', 'end-bg', 'end-text']) {
      expect([key, tokens.color[key]!.light]).toEqual([key, tokens.color[key]!.dark]);
    }
    expect(luminance(tokens.color['session-bg']!.light)).toBe(0);
  });

  it('UX §5.2: every colour is a 6-digit hex value', () => {
    for (const [key, v] of Object.entries(tokens.color)) {
      expect([key, v.light, v.dark]).toEqual([key, expect.stringMatching(/^#[0-9A-F]{6}$/i), expect.stringMatching(/^#[0-9A-F]{6}$/i)]);
    }
  });

  it('architecture §9.7: tokens.css carries every colour in light and dark (regenerate with pnpm gen)', () => {
    const [lightBlock, darkBlock] = [css.split('@media')[0]!, css.split(":root[data-theme='dark']")[1]!];
    for (const [key, v] of Object.entries(tokens.color)) {
      expect(lightBlock).toContain(`--color-${key}: ${v.light};`);
      expect(darkBlock).toContain(`--color-${key}: ${v.dark};`);
    }
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain(":root:not([data-theme='light'])");
  });

  it('UX §5.3: the type scale is in rem so text follows the system setting', () => {
    for (const style of ['display', 'title-l', 'title-m', 'body-l', 'body', 'label', 'caption']) {
      expect(css).toMatch(new RegExp(`--font-size-${style}: [0-9.]+rem;`));
    }
  });
});
