import { defineConfig } from 'vitest/config';

// `pnpm test` runs every package; each has its own vitest.config.ts.
export default defineConfig({
  test: { projects: ['packages/*', 'apps/*', 'tooling'] },
});
