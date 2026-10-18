import { createServer, request as httpRequest, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  credential: vi.fn(),
  export: vi.fn(),
  delete: vi.fn(),
  subject: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@/core/config/env.js', () => ({
  env: { NODE_ENV: 'test', JWT_SECRET: 'c5d-http-synthetic-secret-at-least-32-characters' },
}));
vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    session: { findFirst: async () => ({ id: 'fixture-session' }) },
    user: { findUnique: mocks.subject },
  },
}));
vi.mock('@/core/logger/logger.js', () => ({ logger: { info: vi.fn(), error: mocks.error } }));
vi.mock('./account-data.repository.js', () => ({
  AccountDataRepository: class {
    credential = mocks.credential;
    export = mocks.export;
    delete = mocks.delete;
  },
}));

import { createApp } from '@/app.js';

const root = '/api/v1/users/me';
const password = 'C5d-synthetic-only!';
const input = { requestVersion: 1, password };
const deletion = { ...input, confirmation: 'DELETE MY CELESTIA ACCOUNT' };
const token = (id = 'a') =>
  jwt.sign({ sid: 'fixture-session' }, 'c5d-http-synthetic-secret-at-least-32-characters', {
    subject: id,
  });
let api: ReturnType<typeof supertest>,
  now = 0,
  hash: string;
const servers: Server[] = [];
function post(body: unknown = input, owner = 'a') {
  return api
    .post(`${root}/export`)
    .auth(token(owner), { type: 'bearer' })
    .send(body as object);
}
function remove(body: unknown = deletion, owner = 'a') {
  return api
    .delete(`${root}/account`)
    .auth(token(owner), { type: 'bearer' })
    .send(body as object);
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
beforeAll(async () => {
  hash = await bcrypt.hash(password, 4);
});
beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  now = 0;
  api = supertest(createApp({ clock: () => now }));
  mocks.subject.mockImplementation(async ({ where }) => ({ id: where.id }));
  mocks.credential.mockResolvedValue(hash);
  mocks.export.mockResolvedValue('{"success":true,"data":{"exportVersion":1}}');
  mocks.delete.mockResolvedValue(undefined);
});
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>((done) => server.close(() => done()));
  }
});

describe('C5d actual composed account-data routes', () => {
  it('authenticates before parsing or domain/password work', async () => {
    expect(
      (
        await api
          .post(`${root}/export`)
          .set('Content-Type', 'application/json')
          .send('x'.repeat(9000))
      ).status,
    ).toBe(401);
    expect(mocks.subject).not.toHaveBeenCalled();
    expect(mocks.credential).not.toHaveBeenCalled();
  });
  it('requires current password and returns an honest no-store attachment', async () => {
    const compare = vi.spyOn(bcrypt, 'compare');
    expect((await post({ ...input, password: 'wrong' })).status).toBe(401);
    expect(mocks.export).not.toHaveBeenCalled();
    const res = await post();
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['content-disposition']).toBe(
      'attachment; filename="celestia-account-v1.json"',
    );
    expect(compare).toHaveBeenCalledTimes(2);
    expect(mocks.export.mock.calls[0][0]).toBe('a');
  });
  it.each([
    {},
    { ...deletion, confirmation: 'DELETE' },
    { ...deletion, confirmation: true },
    { ...deletion, userId: 'b' },
    { ...deletion, requestVersion: 2 },
  ])('rejects invalid deletion intent before credentials (%#)', async (body) => {
    expect((await remove(body)).status).toBe(400);
    expect(mocks.credential).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });
  it('requires the password as well as fixed confirmation for deletion', async () => {
    expect((await remove({ ...deletion, password: 'wrong' })).status).toBe(401);
    expect(mocks.delete).not.toHaveBeenCalled();
    expect((await remove()).body.data).toEqual({ responseVersion: 1, deleted: true });
    expect(mocks.delete.mock.calls[0][0]).toBe('a');
  });
  it.each([
    { ...input, ownerId: 'b' },
    { ...input, userId: 'b' },
    { ...input, password: '' },
  ])('rejects ownership/password extras before bcrypt (%#)', async (body) => {
    expect((await post(body)).status).toBe(400);
    expect(mocks.credential).not.toHaveBeenCalled();
  });
  it('rejects query ownership and counts it in the shared budget', async () => {
    expect(
      (await api.post(`${root}/export?userId=b`).auth(token(), { type: 'bearer' }).send(input))
        .status,
    ).toBe(400);
    expect(mocks.credential).not.toHaveBeenCalled();
    await remove({});
    await post({});
    expect((await remove()).status).toBe(429);
  });
  it.each([
    ['malformed', '{', 'application/json', undefined, 400],
    ['oversized', ' '.repeat(8193), 'application/json', undefined, 413],
    ['media', '{}', 'text/plain', undefined, 415],
    ['compressed', '{}', 'application/json', 'gzip', 415],
    ['charset', '{}', 'application/json; charset=iso-8859-1', undefined, 415],
  ])('safely rejects %s without password work', async (_name, body, media, encoding, status) => {
    const req = api
      .post(`${root}/export`)
      .auth(token(), { type: 'bearer' })
      .set('Content-Type', media as string);
    if (encoding) req.set('Content-Encoding', encoding as string);
    expect((await req.send(body)).status).toBe(status);
    expect(mocks.credential).not.toHaveBeenCalled();
    expect(mocks.error).not.toHaveBeenCalled();
  });
  it('enforces shared default burst/refill before identity DB, bcrypt, read or serialization', async () => {
    for (let i = 0; i < 3; i++) expect((await post({})).status).toBe(400);
    mocks.subject.mockClear();
    const compare = vi.spyOn(bcrypt, 'compare');
    const res = await remove();
    expect(res.status).toBe(429);
    expect(res.headers['retry-after']).toBe('60');
    expect(mocks.subject).not.toHaveBeenCalled();
    expect(compare).not.toHaveBeenCalled();
    expect(mocks.export).not.toHaveBeenCalled();
    expect((await post(input, 'b')).status).toBe(200);
    now = 59999;
    expect((await post()).status).toBe(429);
    now = 60000;
    expect((await post()).status).toBe(200);
  });
  it('fails closed for missing subjects and unavailable identity lookup', async () => {
    mocks.subject
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error('private diagnostic'));
    expect((await post()).status).toBe(401);
    expect((await remove()).status).toBe(401);
    expect(mocks.credential).not.toHaveBeenCalled();
    expect(mocks.error).not.toHaveBeenCalled();
  });
  it('bounds malformed or high-cost stored hashes before bcrypt', async () => {
    const compare = vi.spyOn(bcrypt, 'compare');
    mocks.credential.mockResolvedValue(hash.replace('$04$', '$31$'));
    expect((await post()).status).toBe(401);
    expect(compare).not.toHaveBeenCalled();
  });
  it('does not claim success after a repository failure; releases permit and omits diagnostics', async () => {
    mocks.delete.mockRejectedValueOnce(new Error('synthetic private row'));
    const res = await remove();
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.text.includes('synthetic private row')).toBe(false);
    expect(mocks.error).not.toHaveBeenCalled();
    expect((await post()).status).toBe(200);
  });
  it('holds owner/global/shared auth permits until disconnected work settles', async () => {
    const started = deferred(),
      pending = deferred();
    mocks.export.mockImplementationOnce(async () => {
      started.resolve();
      await pending.promise;
      return '{}';
    });
    const server = createApp({ clock: () => now }).listen(0, '127.0.0.1');
    servers.push(server);
    await new Promise<void>((done) => server.once('listening', done));
    const port = (server.address() as AddressInfo).port;
    api = supertest(`http://127.0.0.1:${port}`);
    const req = httpRequest({
      host: '127.0.0.1',
      port,
      path: `${root}/export`,
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    });
    req.on('error', () => {});
    req.end(JSON.stringify(input));
    await started.promise;
    req.destroy();
    expect((await remove()).status).toBe(429);
    expect((await post(input, 'b')).status).toBe(200);
    pending.resolve();
    await new Promise(setImmediate);
    expect((await post()).status).toBe(200);
  });
  it('caps simultaneous owners at two and shares password admission with login', async () => {
    const started = deferred(),
      pending = deferred();
    let active = 0;
    mocks.export.mockImplementation(async () => {
      if (++active === 2) started.resolve();
      await pending.promise;
      return '{}';
    });
    const first = post(input, 'a').then((response) => response.status);
    const second = post(input, 'b').then((response) => response.status);
    await started.promise;
    try {
      mocks.subject.mockClear();
      mocks.credential.mockClear();
      expect((await post(input, 'c')).status).toBe(429);
      expect((await api.post('/api/v1/auth/login').send({})).status).toBe(429);
      expect(mocks.subject).not.toHaveBeenCalled();
      expect(mocks.credential).not.toHaveBeenCalled();
    } finally {
      pending.resolve();
    }
    expect(await Promise.all([first, second])).toEqual([200, 200]);
    expect((await post(input, 'c')).status).toBe(200);
    expect((await api.post('/api/v1/auth/login').send({})).status).toBe(400);
  });
  it('retains response buffer permit while the reader is paused, then releases on close', async () => {
    mocks.export.mockResolvedValue(' '.repeat(16_000_000));
    const held = deferred();
    let releaseResponse!: () => void;
    let first = true;
    const app = createApp({ clock: () => now });
    const server = createServer((req, res) => {
      if (first) {
        first = false;
        const end = res.end.bind(res);
        // Deterministically hold Node's response completion after serialization.
        // Kernel buffering on loopback otherwise varies by Windows TCP settings.
        res.end = ((...args: Parameters<typeof end>) => {
          releaseResponse = () => {
            end(...args);
          };
          held.resolve();
          return res;
        }) as typeof res.end;
      }
      app(req, res);
    }).listen(0, '127.0.0.1');
    servers.push(server);
    await new Promise<void>((done) => server.once('listening', done));
    const port = (server.address() as AddressInfo).port;
    api = supertest(`http://127.0.0.1:${port}`);
    const req = httpRequest(
      {
        host: '127.0.0.1',
        port,
        path: `${root}/export`,
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      },
      (res) => {
        res.resume();
      },
    );
    req.on('error', () => {});
    req.end(JSON.stringify(input));
    await held.promise;
    expect((await remove()).status).toBe(429);
    req.destroy();
    releaseResponse();
    await new Promise((done) => setTimeout(done, 30));
    mocks.export.mockResolvedValue('{}');
    expect((await post()).status).toBe(200);
  });
  it('releases permits after an aborted partial JSON body before password work', async () => {
    const compare = vi.spyOn(bcrypt, 'compare');
    const subjectChecked = deferred(),
      aborted = deferred(),
      closed = deferred();
    mocks.subject.mockImplementationOnce(async ({ where }) => {
      subjectChecked.resolve();
      return { id: where.id };
    });
    const server = createApp({ clock: () => now }).listen(0, '127.0.0.1');
    servers.push(server);
    await new Promise<void>((done) => server.once('listening', done));
    server.once('request', (incoming, res) => {
      incoming.once('aborted', () => aborted.resolve());
      res.once('close', () => closed.resolve());
    });
    const port = (server.address() as AddressInfo).port;
    api = supertest(`http://127.0.0.1:${port}`);
    const req = httpRequest({
      host: '127.0.0.1',
      port,
      path: `${root}/export`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token()}`,
        'Content-Type': 'application/json',
        'Content-Length': '500',
      },
    });
    req.on('error', () => {});
    try {
      req.write('{"requestVersion":1,');
      await subjectChecked.promise;
      await new Promise(setImmediate);
      req.destroy();
      await Promise.all([aborted.promise, closed.promise]);
      await new Promise(setImmediate);
      expect(mocks.subject).toHaveBeenCalledTimes(1);
      expect(mocks.credential).not.toHaveBeenCalled();
      expect(compare).not.toHaveBeenCalled();
      expect(mocks.export).not.toHaveBeenCalled();
      expect(mocks.delete).not.toHaveBeenCalled();
      expect(mocks.error).not.toHaveBeenCalled();
      expect((await post()).status).toBe(200);
      expect(mocks.subject).toHaveBeenCalledTimes(2);
      expect(mocks.credential).toHaveBeenCalledTimes(1);
      expect(mocks.export).toHaveBeenCalledTimes(1);
      expect((await api.post('/api/v1/auth/login').send({})).status).toBe(400);
      expect(mocks.error).not.toHaveBeenCalled();
    } finally {
      req.destroy();
    }
  });
  it('closes on the 30s response deadline and retains permits until work settles', async () => {
    const started = deferred(),
      pending = deferred(),
      closed = deferred();
    const realTimer = globalThis.setTimeout;
    let deadline: (() => void) | undefined;
    let deadlineMs: number | undefined;
    const spy = ((callback: () => void, ms?: number) => {
      if (ms === 30_000 && !deadline) {
        deadlineMs = ms;
        deadline = callback;
      }
      return realTimer(callback, ms);
    }) as unknown as typeof setTimeout;
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(spy);
    mocks.export.mockImplementationOnce(async () => {
      started.resolve();
      await pending.promise;
      return '{}';
    });
    const server = createApp({ clock: () => now }).listen(0, '127.0.0.1');
    servers.push(server);
    await new Promise<void>((done) => server.once('listening', done));
    const port = (server.address() as AddressInfo).port;
    api = supertest(`http://127.0.0.1:${port}`);
    const req = httpRequest({
      host: '127.0.0.1',
      port,
      path: `${root}/export`,
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    });
    req.on('error', () => closed.resolve());
    req.once('close', () => closed.resolve());
    try {
      req.end(JSON.stringify(input));
      await started.promise;
      expect(deadlineMs).toBe(30_000);
      expect(deadline).toBeTypeOf('function');
      expect(req.destroyed).toBe(false);
      deadline!();
      await closed.promise;
      const busy = await remove();
      expect(busy.status).toBe(429);
      expect(busy.body.error.code).toBe('REQUEST_BUSY');
      expect(busy.headers['retry-after']).toBe('1');
      expect(mocks.delete).not.toHaveBeenCalled();
      pending.resolve();
      await new Promise(setImmediate);
      expect((await post()).status).toBe(200);
      expect(mocks.error).not.toHaveBeenCalled();
    } finally {
      pending.resolve();
      req.destroy();
    }
  });
});
