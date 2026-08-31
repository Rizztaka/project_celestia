import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
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
      'boundaries/elements': [
        { type: 'platform', pattern: 'platform/*' },
        { type: 'core', pattern: 'core/*' },
        { type: 'games', pattern: 'games/*' },
        { type: 'genshin', pattern: 'games/genshin/*' },
        { type: 'hsr', pattern: 'games/hsr/*' },
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
              from: { type: 'platform' },
              disallow: [
                { to: { type: 'games' } },
                { to: { type: 'genshin' } },
                { to: { type: 'hsr' } },
              ],
              message: 'Platform modules must never contain game-specific logic.',
            },
            {
              from: { type: 'genshin' },
              disallow: [{ to: { type: 'hsr' } }],
              message: 'Genshin must not import from HSR',
            },
            {
              from: { type: 'hsr' },
              disallow: [{ to: { type: 'genshin' } }],
              message: 'HSR must not import from Genshin',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'boundaries/dependencies': 'off',
    },
  },
);
