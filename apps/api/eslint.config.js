import { fileURLToPath } from 'node:url';

import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      boundaries: boundaries,
    },
    languageOptions: {
      globals: globals.node,
    },
    settings: {
      'import/resolver': {
        // Keep the source aliases: following tsconfig.node references loses them in this resolver.
        typescript: { project: fileURLToPath(new URL('./tsconfig.eslint.json', import.meta.url)) },
      },
      'boundaries/elements': [
        { type: 'platform', pattern: 'platform/*' },
        { type: 'core', pattern: 'core/*' },
        { type: 'genshin', pattern: 'games/genshin/*' },
        { type: 'hsr', pattern: 'games/hsr/*' },
        // Specific games must precede this fallback or cross-game policies never match.
        { type: 'games', pattern: 'games/*' },
      ],
      'boundaries/include': ['src/**/*'],
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          policies: [
            {
              from: { element: { type: 'platform' } },
              disallow: [
                { to: { element: { type: 'games' } } },
                { to: { element: { type: 'genshin' } } },
                { to: { element: { type: 'hsr' } } },
              ],
              message: 'Platform modules must never contain game-specific logic.',
            },
            {
              from: { element: { type: 'genshin' } },
              disallow: [{ to: { element: { type: 'hsr' } } }],
              message: 'Genshin must not import from HSR',
            },
            {
              from: { element: { type: 'hsr' } },
              disallow: [{ to: { element: { type: 'genshin' } } }],
              message: 'HSR must not import from Genshin',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/core/middleware/auth.middleware.ts'],
    rules: {
      // Express exposes its extensible Request interface in this ambient namespace.
      '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'boundaries/dependencies': 'off',
    },
  },
);
