/** Accept an origin, never a URL with a path (even a trailing slash). */
export function normalizeOrigin(value: string): string {
  const match = /^(https?):\/\/(\[[0-9a-f:.]+\]|[a-z0-9.-]+)(?::([0-9]+))?$/i.exec(value);
  if (!match) throw new Error('Expected an HTTP(S) origin without credentials, path or wildcard.');
  const url = new URL(value);
  // URL parsing accepts shorthand/hex/encoded IPs. Only explicit host spellings are supported.
  if (url.hostname !== match[2]!.toLowerCase())
    throw new Error('Origin hostname must use its canonical spelling.');
  if (
    !url.hostname.startsWith('[') &&
    (url.hostname.length > 253 ||
      url.hostname
        .split('.')
        .some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)))
  )
    throw new Error('Origin hostname contains an invalid DNS label.');
  return url.origin;
}

const localOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:45449',
];

/** Called once at startup, after the existing required-secret environment validation. */
export function corsAllowedOrigins(
  mode: string,
  configured: string | undefined,
): ReadonlySet<string> {
  if (!['development', 'test', 'production'].includes(mode))
    throw new Error('CORS requires a validated application environment.');
  if (configured === undefined && mode !== 'production') return new Set(localOrigins);
  if (!configured?.trim()) throw new Error('CORS_ALLOWED_ORIGINS must be explicitly configured.');
  try {
    return new Set(configured.split(',').map((entry) => normalizeOrigin(entry.trim())));
  } catch {
    // Do not echo untrusted configuration values into startup logs.
    throw new Error('CORS_ALLOWED_ORIGINS contains an invalid origin.');
  }
}
