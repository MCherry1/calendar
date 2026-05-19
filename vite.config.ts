import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// The calendar web app. Roll20 script build is separate (build.mjs).
// Source for the new web UI lives in `web/`; shared core logic
// (worlds, moons, planes, weather, time-of-day) lives in `src/` and
// is imported by both targets.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'web',
  base: '/calendar/',
  publicDir: '../public',
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src'),
      '@web': path.resolve(__dirname, 'web'),
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
  },
});
