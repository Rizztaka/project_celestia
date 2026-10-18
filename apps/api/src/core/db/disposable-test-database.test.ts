import { expect, it } from 'vitest';

import { disposableTestDatabase } from './disposable-test-database.js';

const environment = (url: string): NodeJS.ProcessEnv => ({
  NODE_ENV: 'test',
  DOTENV_CONFIG_PATH: 'NUL',
  DATABASE_URL: url,
  CELESTIA_TEST_DATABASE_URL: url,
});
it('requires an explicit dedicated fixture and does not fall back to DATABASE_URL', () => {
  expect(disposableTestDatabase({ DATABASE_URL: 'postgresql://normal/db' })).toBeNull();
  expect(
    disposableTestDatabase(environment('postgresql://fixture@127.0.0.1:55448/celestia_test_c4')),
  ).toContain('/celestia_test_c4');
});
it.each([
  'postgresql://remote:55448/celestia_test_c4',
  'postgresql://localhost:55448/normal',
  'postgresql://localhost:55448/celestia_test_',
  'postgresql://localhost/celestia_test_c4',
  'postgresql://localhost:55448/celestia_test_c4?host=remote',
  'http://localhost:55448/celestia_test_c4',
])('fails closed for unsafe %s', (url) => {
  expect(() => disposableTestDatabase(environment(url))).toThrow();
});
it.each([
  { NODE_ENV: 'production' },
  { DOTENV_CONFIG_PATH: '.env' },
  { DATABASE_URL: 'postgresql://normal/db' },
])('requires isolated environment %s', (override) => {
  expect(() =>
    disposableTestDatabase({
      ...environment('postgresql://fixture@127.0.0.1:55448/celestia_test_c4'),
      ...override,
    }),
  ).toThrow();
});
