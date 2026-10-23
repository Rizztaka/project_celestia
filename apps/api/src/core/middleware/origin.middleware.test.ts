import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/platform/auth/password-reset.service.js', () => ({
  PasswordResetService: class {
    async sendVerification() {}
  },
}));

import { corsAllowedOrigins, normalizeOrigin } from '@/core/config/cors.js';

const mocks = vi.hoisted(() => ({ database: vi.fn(), error: vi.fn() }));
// Origin tests isolate domain persistence; C5d auth existence is independently covered.
vi.mock('@/platform/auth/auth.repository.js', () => ({
  AuthRepository: class {
    async subjectExists() {
      return true;
    }
  },
}));
vi.mock('@/core/db/prisma.js', () => ({
  prisma: new Proxy(
    {},
    {
      get: () => {
        mocks.database();
        throw new Error('Unexpected database access');
      },
    },
  ),
}));
vi.mock('@/core/logger/logger.js', () => ({ logger: { info: vi.fn(), error: mocks.error } }));

const secret = 'c5a-synthetic-http-secret-at-least-32-characters';
async function application(
  mode = 'production',
  origins: string | undefined = mode === 'production'
    ? 'https://trusted.example, https://preview-42.vercel.app'
    : undefined,
) {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', mode);
  vi.stubEnv('CORS_ALLOWED_ORIGINS', origins);
  return supertest((await import('@/app.js')).app);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('DOTENV_CONFIG_PATH', process.platform === 'win32' ? 'NUL' : '/dev/null');
  vi.stubEnv('DATABASE_URL', 'postgresql://synthetic:synthetic@127.0.0.1:55448/celestia_test_cors');
  vi.stubEnv('JWT_SECRET', secret);
  vi.stubEnv('OPENROUTER_API_KEY', 'synthetic-unused');
  vi.stubEnv('WEB_ORIGIN', 'https://trusted.example');
  vi.stubEnv('API_ORIGIN', 'https://api.trusted.example');
});
afterEach(() => {
  expect(mocks.database).not.toHaveBeenCalled();
  expect(mocks.error).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
});

describe('Actual application origin policy', () => {
  it.each([
    'https://trusted.example',
    'HTTPS://TRUSTED.EXAMPLE:443',
    'https://preview-42.vercel.app',
  ])(
    'allows configured origin %s',
    async (origin) => {
      const res = await (await application()).get('/api/v1/health').set('Origin', origin);
      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe(origin);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers.vary).toContain('Origin');
    },
    15_000,
  ); // Includes a cold import and validation of pinned knowledge files.

  it.each([
    'https://safe.example',
    'https://localhost.attacker.example',
    'https://127.0.0.1.attacker.example',
    'http://127.0.0.10:5173',
    'https://vercel.app.attacker.example',
    'https://unrelated.vercel.app',
    'https://trusted.example.attacker.example',
    'http://trusted.example',
    'https://trusted.example:444',
    'null',
    'not-an-origin',
    'file://trusted.example',
    'https://user@trusted.example',
    'https://trusted.example/',
    'https://trusted.example/path',
    'https://trusted.example?x=1',
    'https://trusted.example#x',
    'https://safe.example/https://trusted.example',
    'https://trusted.example, https://safe.example',
    'http://localhost:5173',
  ])('deliberately denies %s', async (origin) => {
    const res = await (await application()).get('/api/v1/health').set('Origin', origin);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'CORS_ORIGIN_DENIED', message: 'Request origin is not allowed.' },
    });
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.headers['access-control-allow-credentials']).toBeUndefined();
    expect(res.headers.vary).toContain('Origin');
  });

  it('permits absent Origin without granting cross-origin browser access', async () => {
    const api = await application();
    const health = await api.get('/api/v1/health');
    expect(health.status).toBe(200);
    expect(health.headers['access-control-allow-origin']).toBeUndefined();
    expect(health.headers.vary).toContain('Origin');
    expect((await api.get('/api/v1/companion/plan?contractVersion=1')).status).toBe(401);
  });

  it.each(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])(
    'permits %s preflight with required headers',
    async (method) => {
      const res = await (
        await application()
      )
        .options('/api/v1/companion/plan')
        .set('Origin', 'https://trusted.example')
        .set('Access-Control-Request-Method', method)
        .set('Access-Control-Request-Headers', 'authorization,content-type');
      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('https://trusted.example');
      expect(res.headers['access-control-allow-methods'].split(',')).toContain(method);
      expect(res.headers['access-control-allow-headers'].toLowerCase()).toBe(
        'authorization,content-type',
      );
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers.vary).toContain('Origin');
    },
  );

  it('denies untrusted preflight before any route runs', async () => {
    const res = await (
      await application()
    )
      .options('/api/v1/companion/plan')
      .set('Origin', 'https://unrelated.vercel.app')
      .set('Access-Control-Request-Method', 'PATCH');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CORS_ORIGIN_DENIED');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.headers.vary).toContain('Origin');
  });

  it.each([undefined, 'invalid-token'])(
    'allowed origin still requires authentication (%s)',
    async (token) => {
      const api = await application();
      const read = api
        .get('/api/v1/companion/plan?contractVersion=1')
        .set('Origin', 'https://trusted.example');
      const write = api
        .patch('/api/v1/companion/plan')
        .set('Origin', 'https://trusted.example')
        .send({});
      if (token) {
        read.auth(token, { type: 'bearer' });
        write.auth(token, { type: 'bearer' });
      }
      for (const res of [await read, await write]) {
        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe(token ? 'AUTH_SESSION_INVALID' : 'UNAUTHORIZED');
        expect(res.headers['access-control-allow-origin']).toBe('https://trusted.example');
      }
    },
  );

  it('an allowed authenticated origin cannot read another owner', async () => {
    const res = await (
      await application()
    )
      .get('/api/v1/users/victim')
      .set('Origin', 'https://trusted.example')
      .auth(jwt.sign({ sid: 'fixture-session' }, secret, { subject: 'owner' }), { type: 'bearer' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it.each(['development', 'test'])(
    'supports only documented local defaults in %s',
    async (mode) => {
      const api = await application(mode, undefined);
      for (const origin of [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:4173',
        'http://127.0.0.1:4173',
        'http://127.0.0.1:45449',
      ]) {
        expect((await api.get('/api/v1/health').set('Origin', origin)).status).toBe(200);
      }
      for (const origin of [
        'http://localhost:3000',
        'https://localhost:5173',
        'http://127.1:5173',
        'http://2130706433:5173',
        'http://localhost.attacker.example:5173',
      ]) {
        expect((await api.get('/api/v1/health').set('Origin', origin)).status).toBe(403);
      }
    },
  );

  it('explicit configuration replaces development defaults', async () => {
    const api = await application('development', 'http://localhost:3000');
    expect((await api.get('/api/v1/health').set('Origin', 'http://localhost:3000')).status).toBe(
      200,
    );
    expect((await api.get('/api/v1/health').set('Origin', 'http://localhost:5173')).status).toBe(
      403,
    );
  });

  it.each([
    undefined,
    '',
    ' ',
    '*',
    'https://*.vercel.app',
    'null',
    'https://user:password@example.com',
    'file://example.com',
    'https://example.com/',
    'https://example.com?x',
    'https://example.com#x',
    'https://example.com,',
    'https://example.com:99999',
    'https://bad..example',
    'https://-example.com',
    'https://.',
    'https://example.com\\path',
  ])('fails production startup for invalid configuration %s', async (value) => {
    // Pass through a separate variable: undefined must not activate the helper's default.
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CORS_ALLOWED_ORIGINS', value);
    await expect(import('@/app.js')).rejects.toThrow('CORS_ALLOWED_ORIGINS');
  });

  it('rejects malformed supplied development configuration', async () => {
    await expect(application('development', '*')).rejects.toThrow('CORS_ALLOWED_ORIGINS');
  });
  it.each(['WEB_ORIGIN', 'API_ORIGIN'] as const)(
    'requires a secure production callback origin in %s',
    async (field) => {
      vi.stubEnv(field, 'http://localhost:4000');
      await expect(application()).rejects.toThrow(field);
      vi.stubEnv(field, 'https://trusted.example/path');
      await expect(application()).rejects.toThrow(field);
    },
  );
  it('requires the JWT secret but starts without optional AI credentials', async () => {
    vi.stubEnv('JWT_SECRET', 'short');
    await expect(application()).rejects.toThrow('JWT_SECRET');
    vi.stubEnv('JWT_SECRET', secret);
    vi.stubEnv('OPENROUTER_API_KEY', '');
    await expect(application()).resolves.toBeDefined();
  });
  it('normalizes case/default ports and trims configuration entries only', () => {
    expect([
      ...corsAllowedOrigins('production', ' HTTPS://TRUSTED.EXAMPLE:443 ,http://localhost:80'),
    ]).toEqual(['https://trusted.example', 'http://localhost']);
    expect(() => normalizeOrigin(' https://trusted.example')).toThrow();
    expect(() => normalizeOrigin('https://trusted.example ')).toThrow();
  });
});
