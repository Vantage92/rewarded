import { defineConfig } from 'vite';

// Production bundle: only server.prod.ts, so modules/dev and the dev platform never ship (architecture §10.3).
export default defineConfig({
  build: {
    ssr: 'src/server.prod.ts',
    outDir: 'dist',
    target: 'node22',
    emptyOutDir: true,
  },
});
