import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const apiProxy = { '/api': { target: 'http://localhost:8787' } };

export default defineConfig({
  plugins: [
    react(),
    // Service worker from src/sw (injectManifest, architecture §9.4). The manifest is a static file in public/.
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/sw',
      filename: 'sw.ts',
      manifest: false,
      injectRegister: false,
      // Classic (iife) worker: module service workers are not supported everywhere we target.
      injectManifest: { globPatterns: ['**/*.{js,css,html,json,png,svg,webmanifest}'], rollupFormat: 'iife' },
      devOptions: { enabled: false },
    }),
  ],
  // Integration wave: split the main bundle into stable vendor and contracts chunks (cacheable
  // across releases); features stay in the entry, admin and board were already lazy (WP-10).
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/ },
            { name: 'vendor-query', test: /node_modules[\\/]@tanstack[\\/]/ },
            { name: 'vendor-zod', test: /node_modules[\\/]zod[\\/]/ },
            { name: 'contracts', test: /packages[\\/]contracts[\\/]/ },
            { name: 'core', test: /packages[\\/]core[\\/]/ },
          ],
        },
      },
    },
  },
  server: { port: 5173, strictPort: true, proxy: apiProxy },
  preview: { port: 4173, strictPort: true, proxy: apiProxy },
});
