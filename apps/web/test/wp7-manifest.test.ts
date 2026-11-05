// Architecture §9.4: manifest colours come from the tokens; the service worker leaves /api alone.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(join(root, 'public/manifest.webmanifest'), 'utf8')) as Record<string, unknown>;
const tokens = JSON.parse(readFileSync(join(root, 'src/design/tokens.json'), 'utf8')) as { color: Record<string, { light: string }> };
const sw = readFileSync(join(root, 'src/sw/sw.ts'), 'utf8');
const html = readFileSync(join(root, 'index.html'), 'utf8');

describe('PWA manifest and service worker (architecture §9.4)', () => {
  it('architecture §9.4: manifest colours are token values', () => {
    expect(manifest.background_color).toBe(tokens.color.bg!.light);
    expect(manifest.theme_color).toBe(tokens.color.primary!.light);
    expect(manifest.id).toBe('/');
  });

  it('architecture §9.4: index.html links the manifest and has lang="nl" (UX §5.8)', () => {
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(html).toContain('<html lang="nl">');
    // No inline scripts (architecture §10.3 CSP).
    expect(html).not.toMatch(/<script>(?!<\/script>)/);
  });

  it('architecture §9.4: the worker precaches, falls back to index.html and denies /api/*', () => {
    expect(sw).toContain('precacheAndRoute(self.__WB_MANIFEST)');
    expect(sw).toContain("createHandlerBoundToURL('index.html')");
    expect(sw).toContain('/^\\/api\\//');
    expect(sw).toMatch(/SKIP_WAITING/);
    // No runtime caching strategies: anything outside the precache goes to the network.
    expect(sw).not.toMatch(/CacheFirst|StaleWhileRevalidate|NetworkFirst/);
  });
});
