// Architecture §9.6, §12.3: every error code of a WP-5 module has a text in its own namespace
// errors/<module>.json, in Dutch and English, and nothing more.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ERROR_CODES, ERROR_CODE_LIST } from '@rewarded/contracts';

const MODULES = ['squads', 'invites', 'duels', 'clubs', 'challenges', 'leaderboards', 'belofte', 'cards', 'referral', 'reminders'] as const;
const file = (lang: string, ns: string) => fileURLToPath(new URL(`../../../web/src/i18n/${lang}/errors/${ns}.json`, import.meta.url));

describe('architecture §12.3 error namespaces of WP-5', () => {
  for (const lang of ['nl', 'en']) {
    it(`§9.6 every code of the ten social modules has a ${lang} text`, () => {
      for (const ns of MODULES) {
        const texts = JSON.parse(readFileSync(file(lang, ns), 'utf8')) as Record<string, string>;
        const codes = ERROR_CODE_LIST.filter((c) => ERROR_CODES[c].module === ns).map((c) => c.toLowerCase());
        expect(Object.keys(texts).sort(), `${lang}/${ns}`).toEqual([...codes].sort());
        for (const t of Object.values(texts)) expect(t.trim().length).toBeGreaterThan(0);
      }
    });
  }
});
