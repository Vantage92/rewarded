// Turns src/design/tokens.json into tokens.css (CSS custom properties) and tokens.gen.ts (token names).
// Light values on :root, dark values under prefers-color-scheme and [data-theme] (architecture §9.7).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

type Scale = Record<string, string>;
interface Tokens {
  color: Record<string, { light: string; dark: string }>;
  space: Scale;
  radius: Scale;
  font: Scale;
  shadow: Record<string, { light: string; dark: string }>;
}

const dir = join(import.meta.dirname, '../src/design');
const tokens = JSON.parse(readFileSync(join(dir, 'tokens.json'), 'utf8')) as Tokens;

const themed = (mode: 'light' | 'dark') => [
  ...Object.entries(tokens.color).map(([k, v]) => `  --color-${k}: ${v[mode]};`),
  ...Object.entries(tokens.shadow).map(([k, v]) => `  --shadow-${k}: ${v[mode]};`),
];
const fixed = [
  ...Object.entries(tokens.space).map(([k, v]) => `  --space-${k}: ${v};`),
  ...Object.entries(tokens.radius).map(([k, v]) => `  --radius-${k}: ${v};`),
  ...Object.entries(tokens.font).map(([k, v]) => `  --font-${k}: ${v};`),
];

const css = `/* GENERATED from tokens.json by scripts/build-tokens.ts. Do not edit. */
:root {
  color-scheme: light dark;
${[...fixed, ...themed('light')].join('\n')}
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
${themed('dark').map((l) => '  ' + l).join('\n')}
  }
}
:root[data-theme='dark'] {
${themed('dark').join('\n')}
}
`;

const names = [
  ...Object.keys(tokens.color).map((k) => `color-${k}`),
  ...Object.keys(tokens.shadow).map((k) => `shadow-${k}`),
  ...Object.keys(tokens.space).map((k) => `space-${k}`),
  ...Object.keys(tokens.radius).map((k) => `radius-${k}`),
  ...Object.keys(tokens.font).map((k) => `font-${k}`),
];
const ts = `// GENERATED from tokens.json by scripts/build-tokens.ts. Do not edit.
export type TokenName =
${names.map((n) => `  | '${n}'`).join('\n')};

/** CSS reference to a token, e.g. token('color-primary') -> 'var(--color-primary)'. */
export const token = (name: TokenName): string => \`var(--\${name})\`;
`;

const write = (file: string, content: string) => {
  const path = join(dir, file);
  if (!existsSync(path) || readFileSync(path, 'utf8') !== content) writeFileSync(path, content);
};
write('tokens.css', css);
write('tokens.gen.ts', ts);
console.info(`[build-tokens] ${names.length} tokens`);
