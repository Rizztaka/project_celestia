import { createServer, request as httpRequest, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/platform/auth/password-reset.service.js', () => ({
  PasswordResetService: class {
    async sendVerification() {}
  },
}));

import { requestSafetyPolicy } from '@/core/config/request-safety.js';
import { UnauthorizedError } from '@/core/errors/app-error.js';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  preview: vi.fn(),
  commit: vi.fn(),
  status: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@/core/config/env.js', () => ({
  env: { NODE_ENV: 'test', JWT_SECRET: 'c5c-http-only-synthetic-secret-at-least-32-characters' },
}));
vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    session: { findFirst: async () => ({ id: 'fixture-session' }) },
    user: { findUnique: async ({ where }: { where: { id: string } }) => ({ id: where.id }) },
  },
}));
vi.mock('@/core/logger/logger.js', () => ({ logger: { info: mocks.info, error: mocks.error } }));
vi.mock('@/platform/auth/auth.service.js', () => ({
  AuthService: class {
    login = mocks.login;
    register = mocks.register;
  },
}));
vi.mock('@/games/genshin/importer/importer.service.js', () => ({
  GenshinImportService: class {
    preview = mocks.preview;
    importAccount = mocks.commit;
    status = mocks.status;
  },
}));

import { createApp } from '@/app.js';

const loginPath = '/api/v1/auth/login';
const registerPath = '/api/v1/auth/register';
const importPath = '/api/v1/games/genshin/import';
const token = (owner = 'a') =>
  jwt.sign({ sid: 'fixture-session' }, 'c5c-http-only-synthetic-secret-at-least-32-characters', {
    subject: owner,
  });
const loginBody = { email: 'c5c@test.invalid', password: 'synthetic-password' };
const servers: Server[] = [];
let now: number;
beforeEach(() => {
  now = 0;
  vi.resetAllMocks();
  mocks.login.mockResolvedValue({ user: { id: 'a' } });
  mocks.register.mockResolvedValue({ user: { id: 'a' } });
  mocks.preview.mockResolvedValue({});
  mocks.commit.mockResolvedValue({});
  mocks.status.mockResolvedValue({});
});
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
function application(overrides: Partial<typeof requestSafetyPolicy> = {}) {
  return createApp({ policy: { ...requestSafetyPolicy, ...overrides }, clock: () => now });
}
function padded(body: object, bytes: number) {
  const text = JSON.stringify(body);
  return text + ' '.repeat(bytes - Buffer.byteLength(text));
}
async function listen(app = application()) {
  const server = createServer(app);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, port: (server.address() as AddressInfo).port };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
describe('Composed application request safety', () => {
  it.each([-1, 0, 1])('bounds auth at 8192 bytes (%s)', async (offset) => {
    const res = await supertest(application())
      .post(loginPath)
      .set('Content-Type', 'application/json')
      .send(padded(loginBody, 8192 + offset));
    expect(res.status).toBe(offset > 0 ? 413 : 200);
    expect(mocks.login).toHaveBeenCalledTimes(offset > 0 ? 0 : 1);
  });
  it.each([-1, 0, 1])('bounds ordinary requests at 65536 bytes (%s)', async (offset) => {
    const res = await supertest(application())
      .post('/api/v1/missing')
      .set('Content-Type', 'application/json')
      .send(padded({}, 65536 + offset));
    expect(res.status).toBe(offset > 0 ? 413 : 404);
  });
  it.each([-1, 0, 1])('bounds authenticated import at 4194304 bytes (%s)', async (offset) => {
    const res = await supertest(application())
      .post(`${importPath}/preview`)
      .auth(token(), { type: 'bearer' })
      .set('Content-Type', 'application/json')
      .send(padded({}, 4194304 + offset));
    expect(res.status).toBe(offset > 0 ? 413 : 200);
    expect(mocks.preview).toHaveBeenCalledTimes(offset > 0 ? 0 : 1);
  });
  it.each([importPath, `${importPath}/preview`, `${importPath}/preview/?caller=ignored`])(
    'authenticates before malformed/large body at %s',
    async (path) => {
      const api = supertest(application());
      for (const body of ['{SECRET', 'X'.repeat(100000)]) {
        const res = await api.post(path).set('Content-Type', 'application/json').send(body);
        expect(res.status).toBe(401);
      }
      expect(mocks.preview).not.toHaveBeenCalled();
      expect(mocks.commit).not.toHaveBeenCalled();
      expect(mocks.error).not.toHaveBeenCalled();
    },
  );
  it.each(['{ "password": "NEVER-LOG-THIS",', 'null', '1'])(
    'safely maps malformed/strict JSON',
    async (body) => {
      const res = await supertest(application())
        .post(loginPath)
        .set('Content-Type', 'application/json')
        .send(body);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        error: { code: 'INVALID_JSON', message: 'Request body must contain valid JSON.' },
      });
      expect(mocks.error).not.toHaveBeenCalled();
      expect(JSON.stringify(mocks.info.mock.calls)).not.toContain('NEVER-LOG-THIS');
      expect(mocks.login).not.toHaveBeenCalled();
    },
  );
  it.each([
    'text/plain',
    'application/x-www-form-urlencoded',
    'application/json; charset=iso-8859-1',
    'application/json; charset=utf-16',
  ])('rejects media %s', async (type) => {
    const res = await supertest(application()).post(loginPath).set('Content-Type', type).send('{}');
    expect(res.status).toBe(415);
    expect(mocks.login).not.toHaveBeenCalled();
  });
  it.each(['gzip', 'br', 'deflate', 'unknown'])(
    'rejects content encoding %s without inflation',
    async (encoding) => {
      const res = await supertest(application())
        .post(loginPath)
        .set('Content-Encoding', encoding)
        .send(loginBody);
      expect(res.status).toBe(415);
      expect(mocks.login).not.toHaveBeenCalled();
    },
  );
  it.each([8192, 8193])('bounds actual chunked transfer at %s bytes', async (length) => {
    const { port } = await listen();
    const body = padded(loginBody, length);
    const result = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      const req = httpRequest(
        {
          host: '127.0.0.1',
          port,
          path: loginPath,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked' },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => resolve({ status: res.statusCode!, body: data }));
        },
      );
      req.on('error', reject);
      req.write(body.slice(0, 4000));
      req.write(body.slice(4000));
      req.end();
    });
    expect(result.status).toBe(length > 8192 ? 413 : 200);
    if (length > 8192) expect(JSON.parse(result.body).error.code).toBe('BODY_TOO_LARGE');
  });
  it('counts invalid attempts before parsing; forwarded headers cannot change the peer budget', async () => {
    const api = supertest(application({ login: { burst: 2, refillMs: 1500, capacity: 2 } }));
    expect((await api.post(loginPath).send({})).status).toBe(400);
    expect(
      (
        await api
          .post(`${loginPath}/?email=different`)
          .set('X-Forwarded-For', '192.0.2.1')
          .set('Forwarded', 'for=192.0.2.2')
          .set('X-Real-IP', '192.0.2.3')
          .set('Content-Type', 'application/json')
          .send('{')
      ).status,
    ).toBe(400);
    const res = await api
      .post('/API/V1/AUTH/LOGIN')
      .set('X-Forwarded-For', '198.51.100.2')
      .send(loginBody);
    expect(res.status).toBe(429);
    expect(res.headers['retry-after']).toBe('2');
    expect(res.body.error.message).toContain('2 seconds');
    expect(mocks.login).not.toHaveBeenCalled();
    now = 1499;
    expect((await api.post(loginPath).send(loginBody)).headers['retry-after']).toBe('1');
    now = 1500;
    expect((await api.post(loginPath).send(loginBody)).status).toBe(200);
  });
  it('keeps login/register budgets separate, accounts failed credentials, and isolates fresh apps', async () => {
    const app = application({ login: { burst: 1, refillMs: 1000, capacity: 2 } });
    expect(app.get('trust proxy')).toBe(false);
    const api = supertest(app);
    mocks.login.mockRejectedValueOnce(new UnauthorizedError('Invalid email or password.'));
    const failed = await api.post(loginPath).send(loginBody);
    expect(failed.status).toBe(401);
    expect(failed.body.error.message).toBe('Invalid email or password.');
    expect((await api.post(loginPath).send(loginBody)).status).toBe(429);
    expect(
      (await api.post(registerPath).send({ ...loginBody, username: 'Synthetic' })).status,
    ).toBe(201);
    expect((await supertest(application()).post(loginPath).send(loginBody)).status).toBe(200);
  });
  it('shares preview/commit budget using verified owners only; status, health and preflight stay usable', async () => {
    const api = supertest(application({ import: { burst: 1, refillMs: 1000, capacity: 2 } }));
    expect(
      (
        await api
          .post(`${importPath}/preview`)
          .auth(token(), { type: 'bearer' })
          .send({ userId: 'victim' })
      ).status,
    ).toBe(200);
    expect(mocks.preview).toHaveBeenCalledWith('a', { userId: 'victim' });
    expect(
      (await api.post(`${importPath}/?userId=b`).auth(token(), { type: 'bearer' }).send({})).status,
    ).toBe(429);
    expect(mocks.commit).not.toHaveBeenCalled();
    expect((await api.post(importPath).auth(token('b'), { type: 'bearer' }).send({})).status).toBe(
      200,
    );
    expect((await api.get(`${importPath}/status`).auth(token(), { type: 'bearer' })).status).toBe(
      200,
    );
    expect((await api.get('/api/v1/health')).status).toBe(200);
    expect(
      (
        await api
          .options(importPath)
          .set('Origin', 'http://localhost:5173')
          .set('Access-Control-Request-Method', 'POST')
          .set('Access-Control-Request-Headers', 'Authorization,Content-Type')
      ).status,
    ).toBe(204);
    expect(
      (
        await api
          .post(importPath)
          .set('Origin', 'https://untrusted.invalid')
          .auth(token(), { type: 'bearer' })
          .send({})
      ).status,
    ).toBe(403);
  });
  it('rejects new authenticated identities at capacity without growing or evicting active penalties', async () => {
    const api = supertest(application({ import: { burst: 1, refillMs: 1000, capacity: 1 } }));
    expect((await api.post(importPath).auth(token('a'), { type: 'bearer' }).send({})).status).toBe(
      200,
    );
    for (const owner of ['b', 'c', 'd', 'a'])
      expect(
        (await api.post(importPath).auth(token(owner), { type: 'bearer' }).send({})).status,
      ).toBe(429);
    expect(mocks.commit).toHaveBeenCalledTimes(1);
    now = 1000;
    expect((await api.post(importPath).auth(token('b'), { type: 'bearer' }).send({})).status).toBe(
      200,
    );
  });
  it.each([
    `${importPath}/preview/extra`,
    `${importPath}x`,
    `${importPath}/%70review`,
    `${loginPath}/extra`,
  ])('does not grant the large parser to unmatched path %s', async (path) => {
    expect(
      (
        await supertest(application())
          .post(path)
          .auth(token(), { type: 'bearer' })
          .set('Content-Type', 'application/json')
          .send(padded({}, 65537))
      ).status,
    ).toBe(413);
    expect(mocks.preview).not.toHaveBeenCalled();
    expect(mocks.commit).not.toHaveBeenCalled();
  });
  it('does not run a POST handler via GET/PUT and retains NIKKE/endgame authentication', async () => {
    const api = supertest(application());
    expect((await api.put(importPath).send({})).status).toBe(404);
    expect((await api.get(`${importPath}/preview`)).status).toBe(404);
    for (const path of [
      '/api/v1/games/nikke/accounts/me',
      '/api/v1/games/genshin/endgame/abyss',
      '/api/v1/games/genshin/endgame/theater',
    ])
      expect((await api.post(path).send({})).status).toBe(401);
  });
  it('retains auth permit after disconnect until the password/service promise settles', async () => {
    const started = deferred<void>(),
      pending = deferred<{ user: { id: string } }>();
    mocks.login.mockImplementationOnce(() => {
      started.resolve();
      return pending.promise;
    });
    const { port } = await listen(application({ authConcurrency: { global: 1, perIdentity: 1 } }));
    const first = httpRequest({
      host: '127.0.0.1',
      port,
      path: loginPath,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    first.on('error', () => {});
    first.end(JSON.stringify(loginBody));
    await started.promise;
    first.destroy();
    const api = supertest(`http://127.0.0.1:${port}`);
    const busy = await api.post(registerPath).send({ ...loginBody, username: 'Synthetic' });
    expect(busy.status).toBe(429);
    expect(busy.body.error.code).toBe('REQUEST_BUSY');
    expect(busy.headers['retry-after']).toBe('1');
    expect(mocks.register).not.toHaveBeenCalled();
    pending.resolve({ user: { id: 'a' } });
    await new Promise(setImmediate);
    expect(
      (await api.post(registerPath).send({ ...loginBody, username: 'Synthetic' })).status,
    ).toBe(201);
  });
  it('holds shared import permits across preview/commit and releases after thrown service errors', async () => {
    const started = deferred<void>(),
      pending = deferred<void>();
    mocks.preview.mockImplementationOnce(async () => {
      started.resolve();
      await pending.promise;
      throw new Error('synthetic failure');
    });
    const api = supertest(application({ importConcurrency: { global: 1, perIdentity: 1 } }));
    const first = api
      .post(`${importPath}/preview`)
      .auth(token(), { type: 'bearer' })
      .send({})
      .then((res) => res);
    await started.promise;
    expect((await api.post(importPath).auth(token('b'), { type: 'bearer' }).send({})).status).toBe(
      429,
    );
    pending.resolve();
    expect((await first).status).toBe(500);
    expect((await api.post(importPath).auth(token('b'), { type: 'bearer' }).send({})).status).toBe(
      200,
    );
  });
  it('releases permits for aborted partial bodies, parser and validation failures', async () => {
    const { server, port } = await listen(
      application({ authConcurrency: { global: 1, perIdentity: 1 } }),
    );
    const received = deferred<void>(),
      aborted = deferred<void>();
    server.once('request', (req) => {
      req.once('aborted', () => aborted.resolve());
      received.resolve();
    });
    const req = httpRequest({
      host: '127.0.0.1',
      port,
      path: loginPath,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': '500' },
    });
    req.on('error', () => {});
    req.write('{');
    await received.promise;
    req.destroy();
    await aborted.promise;
    await new Promise(setImmediate);
    const api = supertest(`http://127.0.0.1:${port}`);
    expect(
      (await api.post(loginPath).set('Content-Type', 'application/json').send('{')).status,
    ).toBe(400);
    expect((await api.post(loginPath).send({})).status).toBe(400);
    expect((await api.post(loginPath).send(loginBody)).status).toBe(200);
    expect(mocks.login).toHaveBeenCalledTimes(1);
    expect(mocks.error).not.toHaveBeenCalled();
  });
  it('does not classify arbitrary downstream parser-looking errors as client errors', async () => {
    mocks.login.mockRejectedValueOnce(
      Object.assign(new Error('synthetic internal failure'), {
        type: 'entity.too.large',
        status: 413,
      }),
    );
    const res = await supertest(application()).post(loginPath).send(loginBody);
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
