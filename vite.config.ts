/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
    testTimeout: 15000,
  },
  build: {
    chunkSizeWarningLimit: 2000,
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
          if (
            normalized.includes('src/data/artifacts-master.ts') ||
            normalized.includes('src/data/artifact-weights.ts')
          ) {
            return 'genshin-artifacts';
          }
          if (normalized.includes('src/data/character-rotations.ts')) {
            return 'genshin-rotations';
          }
          if (normalized.includes('node_modules/lucide-react')) {
            return 'vendor-lucide';
          }
        },
      },
    },
  },
});
