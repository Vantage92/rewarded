// Installability without Lighthouse (architecture §9.4): required manifest fields and real icon sizes.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const publicDir = join(import.meta.dirname, '../public');
const manifest = JSON.parse(readFileSync(join(publicDir, 'manifest.webmanifest'), 'utf8')) as {
  name: string;
  lang: string;
  start_url: string;
  scope: string;
  display: string;
  orientation: string;
  icons: { src: string; sizes: string; purpose: string }[];
};

const pngSize = (file: string) => {
  const buf = readFileSync(join(publicDir, file));
  return `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`;
};

describe('web app manifest', () => {
  it('has the fields from architecture §9.4', () => {
    expect(manifest).toMatchObject({ name: 'Rewarded', lang: 'nl', start_url: '/?bron=pwa', display: 'standalone', orientation: 'portrait' });
    expect(new URL(manifest.start_url, 'https://x.test').pathname.startsWith(manifest.scope)).toBe(true);
  });

  it('has 192, 512 and maskable 512 icons with matching pixel sizes', () => {
    const icons = manifest.icons.map((i) => `${i.sizes}:${i.purpose}`);
    expect(icons).toEqual(expect.arrayContaining(['192x192:any', '512x512:any', '512x512:maskable']));
    for (const icon of manifest.icons) expect(pngSize(icon.src)).toBe(icon.sizes);
  });
});
