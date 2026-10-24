import { randomUUID } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { disposableTestDatabase } from '@/core/db/disposable-test-database.js';

const shared = vi.hoisted(() => ({
  db: null as PrismaClient | null,
  mails: [] as { kind: string; email: string; url: string }[],
}));
vi.mock('@/core/db/prisma.js', () => ({
  prisma: new Proxy(
    {},
    {
      get(_target, key) {
        if (!shared.db) throw new Error('Fixture not initialized');
        const value = Reflect.get(shared.db, key);
        return typeof value === 'function' ? value.bind(shared.db) : value;
      },
    },
  ),
}));
vi.mock('@/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'section2-auth-fixture-secret-at-least-32-characters',
    WEB_ORIGIN: 'http://localhost:5173',
    API_ORIGIN: 'http://localhost:4000',
    DISCORD_CLIENT_ID: 'test-discord',
    DISCORD_CLIENT_SECRET: 'synthetic-only',
    GOOGLE_CLIENT_ID: 'test-google',
    GOOGLE_CLIENT_SECRET: 'synthetic-only',
  },
}));
vi.mock('@/core/logger/logger.js', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
vi.mock('@/core/mail/mailer.service.js', () => ({
  MailerService: class {
    async sendPasswordResetEmail(email: string, url: string) {
      shared.mails.push({ kind: 'reset', email, url });
    }
    async sendVerificationEmail(email: string, url: string) {
      shared.mails.push({ kind: 'verification', email, url });
    }
  },
}));
const database = disposableTestDatabase();
const secret = 'section2-auth-fixture-secret-at-least-32-characters';
const password = 'Synthetic-password-2!';

describe.skipIf(!database)('Section 2 actual PostgreSQL sessions, recovery and OAuth', () => {
  let db: PrismaClient,
    api: ReturnType<typeof supertest>,
    createApp: typeof import('@/app.js').createApp;
  let sessions: import('./session.service.js').SessionService;
  let hashToken: typeof import('./session.service.js').hashToken;
  let Recovery: typeof import('./password-reset.service.js').PasswordResetService;
  let owner: { id: string; email: string },
    other: { id: string; email: string },
    credential: string;
  const owners: string[] = [];
  const user = async (verified = false) => {
    const id = randomUUID();
    owners.push(id);
    return db.user.create({
      data: {
        id,
        email: `${id}@test.invalid`,
        username: `security-${id}`,
        password: credential,
        emailVerifiedAt: verified ? new Date() : null,
      },
    });
  };
  const issued = () =>
    sessions.create(owner.id, {
      userAgent: 'Synthetic Chrome/120 Windows',
      ipAddress: '127.0.0.1',
    });
  const recovery = () => new Recovery(undefined, undefined, undefined, async () => undefined);
  const mailToken = () => new URL(shared.mails.at(-1)!.url).searchParams.get('token')!;
  beforeAll(async () => {
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: database! }) });
    shared.db = db;
    ({ createApp } = await import('@/app.js'));
    const module = await import('./session.service.js');
    sessions = new module.SessionService();
    hashToken = module.hashToken;
    Recovery = (await import('./password-reset.service.js')).PasswordResetService;
    credential = await bcrypt.hash(password, 4);
  });
  beforeEach(async () => {
    vi.unstubAllGlobals();
    shared.mails.length = 0;
    api = supertest(createApp());
    owner = await user();
    other = await user();
  });
  afterAll(async () => {
    vi.unstubAllGlobals();
    if (db) {
      await db.user.deleteMany({ where: { id: { in: owners } } });
      await db.$disconnect();
    }
    shared.db = null;
  });

  it('issues a 15-minute access token and hashed 30-day refresh credential at login', async () => {
    const response = await api.post('/api/v1/auth/login').send({ email: owner.email, password });
    expect(response.status).toBe(200);
    const tokens = response.body.data;
    const claims = jwt.verify(tokens.token, secret) as jwt.JwtPayload;
    expect(claims.exp! - claims.iat!).toBe(900);
    expect(tokens.refreshToken).toMatch(/^[a-f0-9]{80}$/);
    const record = await db.session.findUniqueOrThrow({ where: { id: claims.sid } });
    expect(record.tokenHash).toBe(hashToken(tokens.refreshToken));
    expect(record.tokenHash).not.toBe(tokens.refreshToken);
    expect(record.expiresAt.getTime() - record.createdAt.getTime()).toBeGreaterThan(29 * 86400000);
    expect(tokens.user).not.toHaveProperty('password');
  });
  it('returns refresh cookies with HttpOnly, SameSite and scoped path without exposing them to browser JSON', async () => {
    const response = await api
      .post('/api/v1/auth/login')
      .set('Origin', 'http://localhost:5173')
      .send({ email: owner.email, password });
    expect(response.status).toBe(200);
    expect(response.body.data.refreshToken).toBeUndefined();
    const cookie = String(response.headers['set-cookie']);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/api/v1/auth');
    expect(response.headers['cache-control']).toBe('no-store');
  });
  it('rotates tokens atomically while retaining a hash for replay detection', async () => {
    const first = await issued(),
      next = await sessions.refresh(first.refreshToken);
    expect(next.refreshToken).not.toBe(first.refreshToken);
    const claims = jwt.decode(next.token) as jwt.JwtPayload;
    expect(
      await db.rotatedRefreshToken.findUnique({
        where: { tokenHash: hashToken(first.refreshToken) },
      }),
    ).toMatchObject({ sessionId: claims.sid });
    expect(await db.session.findUnique({ where: { id: claims.sid } })).toMatchObject({
      tokenHash: hashToken(next.refreshToken),
    });
  });
  it('commits revocation of every owner session on replay without affecting another user', async () => {
    const first = await issued(),
      second = await issued(),
      foreign = await sessions.create(other.id);
    await sessions.refresh(first.refreshToken);
    await expect(sessions.refresh(first.refreshToken)).rejects.toMatchObject({ statusCode: 401 });
    expect(await db.session.count({ where: { userId: owner.id, revokedAt: null } })).toBe(0);
    expect((await api.get('/api/v1/auth/me').auth(second.token, { type: 'bearer' })).status).toBe(
      401,
    );
    expect((await api.get('/api/v1/auth/me').auth(foreign.token, { type: 'bearer' })).status).toBe(
      200,
    );
  });
  it('detects simultaneous rotation of one refresh token as reuse and revokes the family', async () => {
    const first = await issued();
    const result = await Promise.allSettled([
      sessions.refresh(first.refreshToken),
      sessions.refresh(first.refreshToken),
    ]);
    expect(result.filter((item) => item.status === 'fulfilled')).toHaveLength(1);
    expect(await db.session.count({ where: { userId: owner.id, revokedAt: null } })).toBe(0);
  });
  it.each(['expired', 'revoked'] as const)(
    'rejects %s sessions even with an unexpired access JWT',
    async (kind) => {
      const tokens = await issued();
      const claims = jwt.decode(tokens.token) as jwt.JwtPayload;
      await db.session.update({
        where: { id: claims.sid },
        data: kind === 'expired' ? { expiresAt: new Date(0) } : { revokedAt: new Date() },
      });
      await expect(sessions.refresh(tokens.refreshToken)).rejects.toMatchObject({
        statusCode: 401,
      });
      expect((await api.get('/api/v1/auth/me').auth(tokens.token, { type: 'bearer' })).status).toBe(
        401,
      );
    },
  );
  it('rejects legacy JWTs without a session and a foreign session ID', async () => {
    const tokens = await issued();
    const sid = (jwt.decode(tokens.token) as jwt.JwtPayload).sid;
    for (const token of [
      jwt.sign({}, secret, { subject: owner.id }),
      jwt.sign({ sid }, secret, { subject: other.id }),
    ])
      expect((await api.get('/api/v1/auth/me').auth(token, { type: 'bearer' })).status).toBe(401);
  });
  it('does not revoke valid sessions for an unknown or malformed refresh token', async () => {
    await issued();
    for (const token of ['a'.repeat(80), 'bad'])
      await expect(sessions.refresh(token)).rejects.toMatchObject({ statusCode: 401 });
    expect(await db.session.count({ where: { userId: owner.id, revokedAt: null } })).toBe(1);
  });
  it('requires an allowed Origin for cookie refresh and keeps the token out of browser JSON', async () => {
    const tokens = await issued();
    const cookie = `celestia_refresh=${tokens.refreshToken}`;
    expect((await api.post('/api/v1/auth/refresh').set('Cookie', cookie).send({})).status).toBe(
      403,
    );
    expect(
      (
        await api
          .post('/api/v1/auth/refresh')
          .set('Origin', 'https://evil.invalid')
          .set('Cookie', cookie)
          .send({})
      ).status,
    ).toBe(403);
    const response = await api
      .post('/api/v1/auth/refresh')
      .set('Origin', 'http://localhost:5173')
      .set('Cookie', cookie)
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.data.refreshToken).toBeUndefined();
    expect(response.headers['set-cookie']).toBeDefined();
  });
  it('lists only the owner’s active devices and never serializes credential hashes', async () => {
    const tokens = await issued();
    await issued();
    await sessions.create(other.id);
    const response = await api.get('/api/v1/auth/sessions').auth(tokens.token, { type: 'bearer' });
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(
      response.body.data.filter((item: { isCurrent: boolean }) => item.isCurrent),
    ).toHaveLength(1);
    expect(JSON.stringify(response.body)).not.toMatch(/tokenHash|password|refreshToken/);
  });
  it('signs out other devices while preserving the current session', async () => {
    const current = await issued(),
      second = await issued();
    expect(
      (await api.post('/api/v1/auth/logout-others').auth(current.token, { type: 'bearer' })).status,
    ).toBe(200);
    expect((await api.get('/api/v1/auth/me').auth(current.token, { type: 'bearer' })).status).toBe(
      200,
    );
    expect((await api.get('/api/v1/auth/me').auth(second.token, { type: 'bearer' })).status).toBe(
      401,
    );
  });
  it.each(['/logout', '/logout-all'])(
    'revokes the current session immediately through %s',
    async (path) => {
      const tokens = await issued();
      expect(
        (await api.post('/api/v1/auth' + path).auth(tokens.token, { type: 'bearer' })).status,
      ).toBe(200);
      expect((await api.get('/api/v1/auth/me').auth(tokens.token, { type: 'bearer' })).status).toBe(
        401,
      );
    },
  );
  it('returns identical recovery messages for present and absent emails and stores only a 15-minute hash', async () => {
    const service = recovery();
    expect(await service.forgot(owner.email)).toBe(await service.forgot('absent@test.invalid'));
    expect(shared.mails).toHaveLength(1);
    const token = mailToken();
    const row = await db.passwordResetToken.findUniqueOrThrow({
      where: { tokenHash: hashToken(token) },
    });
    expect(row.tokenHash).not.toBe(token);
    expect(row.expiresAt.getTime() - row.createdAt.getTime()).toBeLessThanOrEqual(15 * 60000);
    expect(row.expiresAt.getTime() - row.createdAt.getTime()).toBeGreaterThan(14 * 60000);
  });
  it('consumes reset links once, hashes the new password with cost 12 and revokes all existing sessions', async () => {
    const tokens = await issued();
    const service = recovery();
    await service.forgot(owner.email);
    const token = mailToken();
    await service.reset(token, 'New-password-2!');
    const user = await db.user.findUniqueOrThrow({ where: { id: owner.id } });
    expect(bcrypt.getRounds(user.password)).toBe(12);
    expect(await bcrypt.compare('New-password-2!', user.password)).toBe(true);
    expect((await api.get('/api/v1/auth/me').auth(tokens.token, { type: 'bearer' })).status).toBe(
      401,
    );
    await expect(service.reset(token, 'Other-password-2!')).rejects.toMatchObject({
      statusCode: 401,
    });
  });
  it('permits only one winner when a reset link is submitted concurrently', async () => {
    const service = recovery();
    await service.forgot(owner.email);
    const token = mailToken();
    const results = await Promise.allSettled([
      service.reset(token, 'Concurrent-password-2!'),
      service.reset(token, 'Concurrent-password-3!'),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
  });
  it('invalidates previous reset links on reissue and rejects expired links', async () => {
    const service = recovery();
    await service.forgot(owner.email);
    const first = mailToken();
    await service.forgot(owner.email);
    await expect(service.reset(first, 'New-password-2!')).rejects.toMatchObject({
      statusCode: 401,
    });
    const second = mailToken();
    await db.passwordResetToken.updateMany({
      where: { userId: owner.id },
      data: { expiresAt: new Date(0) },
    });
    await expect(service.reset(second, 'New-password-2!')).rejects.toMatchObject({
      statusCode: 401,
    });
  });
  it('uses separate single-use verification tokens and leaves the password unchanged', async () => {
    const service = recovery();
    await service.sendVerification(owner.id);
    const token = mailToken();
    await expect(service.reset(token, 'New-password-2!')).rejects.toMatchObject({
      statusCode: 401,
    });
    await service.verify(token);
    const user = await db.user.findUniqueOrThrow({ where: { id: owner.id } });
    expect(user.emailVerifiedAt).not.toBeNull();
    expect(user.password).toBe(credential);
    await expect(service.verify(token)).rejects.toMatchObject({ statusCode: 401 });
  });
  it('creates a signed HttpOnly state cookie and S256 challenge for each OAuth provider', async () => {
    for (const provider of ['discord', 'google']) {
      const response = await api.get(`/api/v1/auth/oauth/${provider}`);
      expect(response.status).toBe(302);
      const url = new URL(response.headers.location);
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
      expect(url.searchParams.get('state')).toBeTruthy();
      const cookie = String(response.headers['set-cookie']);
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
    }
  });
  it('rejects missing, tampered and mismatched OAuth state before any network exchange', async () => {
    const started = await api.get('/api/v1/auth/oauth/google');
    const cookie = String(started.headers['set-cookie']).split(';')[0]!;
    const network = vi.fn();
    vi.stubGlobal('fetch', network);
    for (const value of [undefined, cookie + 'tampered', cookie]) {
      let request = api.get(
        '/api/v1/auth/oauth/google/callback?code=synthetic&state=incorrect-state-value',
      );
      if (value) request = request.set('Cookie', value);
      expect((await request).headers.location).toBe(
        'http://localhost:5173/workspace/login?oauth=failed',
      );
    }
    const state = new URL(started.headers.location).searchParams.get('state')!;
    expect(
      (
        await api
          .get(
            `/api/v1/auth/oauth/google/callback?code=synthetic&state=${state}&iss=https%3A%2F%2Fevil.invalid`,
          )
          .set('Cookie', cookie)
      ).headers.location,
    ).toBe('http://localhost:5173/workspace/login?oauth=failed');
    expect(network).not.toHaveBeenCalled();
  });
  it.each(['discord', 'google'] as const)(
    'completes %s OAuth with mocked network and redirects without tokens',
    async (provider) => {
      const started = await api.get(`/api/v1/auth/oauth/${provider}`);
      const state = new URL(started.headers.location).searchParams.get('state')!;
      const cookie = String(started.headers['set-cookie']).split(';')[0]!;
      const email = `${randomUUID()}@test.invalid`;
      vi.stubGlobal(
        'fetch',
        vi.fn(async (input: string | Request) => {
          const url = typeof input === 'string' ? input : input.url;
          return new Response(
            JSON.stringify(
              url.includes('/token')
                ? {
                    access_token: 'synthetic-provider-access',
                    token_type: 'Bearer',
                    expires_in: 3600,
                  }
                : provider === 'discord'
                  ? {
                      id: `provider-${randomUUID()}`,
                      email,
                      username: 'Discord traveler',
                      verified: true,
                    }
                  : {
                      sub: `provider-${randomUUID()}`,
                      email,
                      name: 'Google traveler',
                      email_verified: true,
                    },
            ),
            { headers: { 'Content-Type': 'application/json' } },
          );
        }),
      );
      const response = await api
        .get(`/api/v1/auth/oauth/${provider}/callback?code=synthetic&state=${state}`)
        .set('Cookie', cookie);
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('http://localhost:5173/auth/callback');
      expect(response.headers.location).not.toMatch(/token|code=/);
      const user = await db.user.findUniqueOrThrow({ where: { email } });
      owners.push(user.id);
      expect(user.emailVerifiedAt).not.toBeNull();
      expect(await db.oAuthAccount.count({ where: { userId: user.id } })).toBe(1);
      expect(await db.session.count({ where: { userId: user.id, revokedAt: null } })).toBe(1);
    },
  );
  it('prevents silent OAuth linking to an unverified password account or another owner’s provider', async () => {
    const { OAuthRepository } = await import('./oauth/oauth.repository.js');
    const repository = new OAuthRepository();
    const identity = {
      id: 'identity-' + randomUUID(),
      email: owner.email,
      username: 'traveler',
      verified: true,
    };
    await expect(repository.resolve('google', identity, credential)).rejects.toMatchObject({
      statusCode: 409,
    });
    await db.user.update({ where: { id: owner.id }, data: { emailVerifiedAt: new Date() } });
    expect((await repository.resolve('google', identity, credential)).id).toBe(owner.id);
    const foreign = await sessions.create(other.id);
    const sessionId = (jwt.decode(foreign.token) as jwt.JwtPayload).sid;
    await expect(
      repository.resolve('google', identity, credential, { userId: other.id, sessionId }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
  it('refuses stale-password session creation after credentials change', async () => {
    await db.user.update({ where: { id: owner.id }, data: { password: 'replacement' } });
    await expect(sessions.create(owner.id, {}, credential)).rejects.toMatchObject({
      statusCode: 401,
    });
  });
  it('cascades session, replay, OAuth and email-token records on account deletion', async () => {
    const tokens = await issued();
    await sessions.refresh(tokens.refreshToken);
    const service = recovery();
    await service.forgot(owner.email);
    await service.sendVerification(owner.id);
    await db.oAuthAccount.create({
      data: { userId: owner.id, provider: 'discord', providerAccountId: randomUUID() },
    });
    const sessionIds = (await db.session.findMany({ where: { userId: owner.id } })).map(
      (row) => row.id,
    );
    await db.user.delete({ where: { id: owner.id } });
    expect(await db.session.count({ where: { userId: owner.id } })).toBe(0);
    expect(await db.rotatedRefreshToken.count({ where: { sessionId: { in: sessionIds } } })).toBe(
      0,
    );
    expect(await db.passwordResetToken.count({ where: { userId: owner.id } })).toBe(0);
    expect(await db.emailVerificationToken.count({ where: { userId: owner.id } })).toBe(0);
    expect(await db.oAuthAccount.count({ where: { userId: owner.id } })).toBe(0);
  });
});
