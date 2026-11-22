/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('src/data/characters.ts')) {
            return 'genshin-characters';
          }
          if (normalized.includes('src/data/weapons.ts')) {
            return 'genshin-weapons';
          }
          if (normalized.includes('src/data/character-rotations.ts')) {
            return 'genshin-rotations';
          }
          if (normalized.includes('src/data/artifact-weights.ts')) {
            return 'genshin-artifact-weights';
          }
        },
      },
    },
  },
  test: {
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
    testTimeout: 15000,
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (
            normalized.includes('node_modules/react/') ||
            normalized.includes('node_modules/react-dom/') ||
            normalized.includes('node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }
          if (normalized.includes('node_modules/lucide-react')) {
            return 'vendor-lucide';
          }
          if (normalized.includes('src/data/characters.ts')) {
            return 'genshin-characters';
          }
          if (normalized.includes('src/data/weapons.ts')) {
            return 'genshin-weapons';
          }
          if (normalized.includes('src/data/artifacts-master.ts')) {
            return 'genshin-artifacts-master';
          }
          if (normalized.includes('src/data/artifact-weights.ts')) {
            return 'genshin-artifact-weights';
          }
          if (normalized.includes('src/data/character-rotations.ts')) {
            return 'genshin-rotations';
          }
          if (normalized.includes('src/services/solver-dispatcher.ts')) {
            return 'solver-dispatcher';
          }
        },
      },
    },
  },
});
