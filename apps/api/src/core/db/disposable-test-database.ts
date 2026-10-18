/** Validate before importing the app, opening a connection or invoking migrations. */
export function disposableTestDatabase(env: NodeJS.ProcessEnv = process.env): string | null {
  const value = env.CELESTIA_TEST_DATABASE_URL;
  if (!value) return null;
  const url = new URL(value);
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
    !/^\/celestia_test_[a-zA-Z0-9_]+$/.test(url.pathname) ||
    !url.port ||
    url.search ||
    url.hash ||
    env.DATABASE_URL !== value ||
    env.NODE_ENV !== 'test' ||
    !['NUL', '/dev/null'].includes(env.DOTENV_CONFIG_PATH ?? '')
  ) {
    throw new Error(
      'Explicit disposable loopback celestia_test_* database and isolated test environment required.',
    );
  }
  return value;
}
