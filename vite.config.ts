import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (
            normalized.includes('src/data/characters.ts') ||
            normalized.includes('src/data/weapons.ts') ||
            normalized.includes('src/data/artifacts-master.ts') ||
            normalized.includes('src/data/character-rotations.ts')
          ) {
            return 'genshin-database';
          }
        },
      },
    },
  },
});
