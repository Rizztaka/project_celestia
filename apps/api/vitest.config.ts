import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tooling/**/*.test.js'],
    // The serialized full suite includes real PostgreSQL, WASM and child-process
    // cases. Keep bounded timeouts without treating load-induced slowness as a hang.
    testTimeout: 15_000,
    hookTimeout: 30_000,
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    // passWithNoTests was removed — 20 tests now exist and the suite must not
    // silently pass if test files are accidentally deleted.
  },
});
