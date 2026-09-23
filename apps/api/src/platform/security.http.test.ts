/**
 * Platform Account Security — HTTP Regression Tests
 *
 * These tests exercise actual Express routing, authentication middleware,
 * controllers, and services end-to-end via Supertest.
 *
 * Mocked:  @/core/db/prisma.js  (persistence only — no real DB)
 *          @/core/config/env.js  (test-only JWT secret)
 * Real:    bcryptjs, jsonwebtoken, all middleware, services, controllers
 *
 * The test-only JWT_SECRET is 40 characters long so it satisfies the
 * 32-character minimum enforced by the env schema.
 *
 * IMPORTANT: vi.mock() factories are hoisted to the top of the file by
 * Vitest, so they cannot reference module-scope variables declared after
 * the import block.  Use vi.hoisted() to create objects that ARE available
 * inside hoisted factory functions.  Literal strings must be used for env
 * values inside the factory; the TEST_JWT_SECRET constant below repeats
 * the same literal for use in test helpers (both must stay in sync).
 *
 * Mock reset policy: vi.resetAllMocks() runs before each test, which clears
 * both call history AND registered implementations.  Every test that
 * depends on a specific DB return value must set it up explicitly.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ============================================================
// vi.hoisted() — creates values that are available inside
// vi.mock() factory functions (which are hoisted before imports).
// ============================================================

const { mockPrismaUser } = vi.hoisted(() => ({
  mockPrismaUser: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
}));

// ============================================================
// Env mock — literal values only (vi.mock is hoisted).
// Keep JWT_SECRET literal in sync with TEST_JWT_SECRET below.
// ============================================================

vi.mock('@/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: '4000',
    DATABASE_URL: 'postgresql://localhost/test',
    JWT_SECRET: 'test-only-jwt-secret-exactly-40-chars!!!',
    JWT_EXPIRY: '1h',
  },
}));

// ============================================================
// Prisma mock — intercept all DB calls; no real database needed.
// mockPrismaUser is declared via vi.hoisted() so it is available
// here in the factory and also in test bodies below.
// ============================================================

vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    user: mockPrismaUser,
  },
}));

// ============================================================
// App import — after mocks are registered.
// ============================================================

import { app } from '@/app.js';

// ============================================================
// Test-only constants and helpers
// ============================================================

// Must match the literal inside the vi.mock('@/core/config/env.js') factory.
const TEST_JWT_SECRET = 'test-only-jwt-secret-exactly-40-chars!!!';

const api = supertest(app);

const BASE_REGISTER_PAYLOAD = {
  email: 'alice@example.com',
  username: 'alice',
  password: 'CorrectHorse1',
};

const USER_A_ID = 'user-a-id-000000';
const USER_B_ID = 'user-b-id-111111';

/**
 * Build a minimal Prisma User row.
 * The password field should already be a bcrypt hash when used
 * to simulate a stored user.
 */
const makeDbUser = (overrides: {
  id?: string;
  email?: string;
  username?: string;
  password: string;
}) => ({
  id: overrides.id ?? USER_A_ID,
  email: overrides.email ?? BASE_REGISTER_PAYLOAD.email,
  username: overrides.username ?? BASE_REGISTER_PAYLOAD.username,
  password: overrides.password,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
});

/** Sign a JWT using the test secret. */
const signToken = (
  sub: unknown,
  opts: jwt.SignOptions & { algorithm?: jwt.Algorithm } = {},
): string => {
  const { algorithm = 'HS256', ...rest } = opts;
  return jwt.sign(typeof sub === 'string' ? { sub } : (sub as object), TEST_JWT_SECRET, {
    algorithm,
    expiresIn: '1h',
    ...rest,
  });
};

// ============================================================
// Reset mock implementations AND call history between tests.
// vi.resetAllMocks() clears implementations (return values,
// side effects) in addition to call counts.  Each test must
// configure its own DB behaviour explicitly.
// ============================================================

beforeEach(() => {
  vi.resetAllMocks();
});

// ============================================================
// 1. POST /api/v1/users is removed — route must not exist
// ============================================================

describe('Regression: POST /api/v1/users is unavailable', () => {
  it('returns 404 and performs no user creation', async () => {
    const res = await api.post('/api/v1/users').send(BASE_REGISTER_PAYLOAD);

    expect(res.status).toBe(404);
    // Persistence must never be touched
    expect(mockPrismaUser.create).not.toHaveBeenCalled();
    expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
  });
});

// ============================================================
// 2 & 3. Canonical registration stores a hash, not the plain text
// ============================================================

describe('Regression: canonical registration stores a hash, not the plain password', () => {
  it('stores a bcrypt hash and the hash verifies against the original password (real bcrypt)', async () => {
    // Arrange: no existing user (uniqueness checks pass)
    mockPrismaUser.findUnique.mockResolvedValue(null);

    // Capture the data that reaches prisma.user.create
    let capturedPasswordAtPersistence: string | undefined;
    mockPrismaUser.create.mockImplementation(
      (args: { data: { email: string; username: string; password: string } }) => {
        capturedPasswordAtPersistence = args.data.password;
        return Promise.resolve(makeDbUser({ password: args.data.password }));
      },
    );

    const res = await api.post('/api/v1/auth/register').send(BASE_REGISTER_PAYLOAD);

    expect(res.status).toBe(201);
    expect(capturedPasswordAtPersistence).toBeDefined();

    // Must NOT be the plain-text password
    expect(capturedPasswordAtPersistence).not.toBe(BASE_REGISTER_PAYLOAD.password);

    // Must be a valid bcrypt hash — real bcrypt.compare, no mock
    const isValidHash = await bcrypt.compare(
      BASE_REGISTER_PAYLOAD.password,
      capturedPasswordAtPersistence!,
    );
    expect(isValidHash).toBe(true);
  });
});

// ============================================================
// 4. Responses never expose the password field
// ============================================================

describe('Regression: password field never appears in API responses', () => {
  it('registration response does not contain a password field', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);
    const fakeHash = await bcrypt.hash(BASE_REGISTER_PAYLOAD.password, 1);
    mockPrismaUser.create.mockResolvedValue(makeDbUser({ password: fakeHash }));

    const res = await api.post('/api/v1/auth/register').send(BASE_REGISTER_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.data?.user).not.toHaveProperty('password');
    expect(res.body.data?.user).not.toHaveProperty('passwordHash');
  });

  it('login response does not contain a password field', async () => {
    const fakeHash = await bcrypt.hash(BASE_REGISTER_PAYLOAD.password, 1);
    mockPrismaUser.findUnique.mockResolvedValue(makeDbUser({ password: fakeHash }));

    const res = await api
      .post('/api/v1/auth/login')
      .send({ email: BASE_REGISTER_PAYLOAD.email, password: BASE_REGISTER_PAYLOAD.password });

    expect(res.status).toBe(200);
    expect(res.body.data?.user).not.toHaveProperty('password');
    expect(res.body.data?.user).not.toHaveProperty('passwordHash');
  });

  it('profile response does not contain password or passwordHash fields', async () => {
    const fakeHash = await bcrypt.hash(BASE_REGISTER_PAYLOAD.password, 1);
    const dbUser = makeDbUser({ id: USER_A_ID, password: fakeHash });
    mockPrismaUser.findUnique.mockResolvedValue(dbUser);

    const token = signToken(USER_A_ID);

    const res = await api.get(`/api/v1/users/${USER_A_ID}`).set('Authorization', `Bearer ${token}`);

    // Unconditional: ownership passes (requesterId === USER_A_ID === targetId)
    expect(res.status).toBe(200);
    expect(res.body.data?.id).toBe(USER_A_ID);
    expect(res.body.data).not.toHaveProperty('password');
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });
});

// ============================================================
// 5. Login works against the hash produced by registration
// ============================================================

describe('Regression: login works against the hash produced by registration', () => {
  it('login succeeds after registration (real bcrypt round-trip)', async () => {
    // Step 1 — Register and capture stored hash
    mockPrismaUser.findUnique.mockResolvedValue(null);
    let storedHash: string | undefined;
    mockPrismaUser.create.mockImplementation(
      (args: { data: { email: string; username: string; password: string } }) => {
        storedHash = args.data.password;
        return Promise.resolve(makeDbUser({ password: args.data.password }));
      },
    );

    const registerRes = await api.post('/api/v1/auth/register').send(BASE_REGISTER_PAYLOAD);
    expect(registerRes.status).toBe(201);
    expect(storedHash).toBeDefined();

    // Step 2 — Login: mock DB to return the user with the hash captured above
    mockPrismaUser.findUnique.mockResolvedValue(makeDbUser({ password: storedHash! }));

    const loginRes = await api
      .post('/api/v1/auth/login')
      .send({ email: BASE_REGISTER_PAYLOAD.email, password: BASE_REGISTER_PAYLOAD.password });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data?.token).toBeDefined();
    expect(loginRes.body.data?.user).not.toHaveProperty('password');
    expect(loginRes.body.data?.user).not.toHaveProperty('passwordHash');
  });
});

// ============================================================
// 6. Token validation: missing, expired, bad signature, bad subjects
// All invalid-token cases must return 401 and must NOT reach
// the database — middleware must reject before any profile lookup.
// ============================================================

describe('Regression: invalid tokens return 401 and do not reach persistence', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await api.get(`/api/v1/users/${USER_A_ID}`);
    expect(res.status).toBe(401);
    expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
  });

  it('returns 401 for an expired token', async () => {
    // expiresIn: -1 creates a token that expired 1 second ago
    const expiredToken = signToken(USER_A_ID, { expiresIn: -1 });
    const res = await api
      .get(`/api/v1/users/${USER_A_ID}`)
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
  });

  it('returns 401 for a token with an invalid signature', async () => {
    const wrongSecret = 'wrong-secret-totally-different-long-key!!';
    const badSigToken = jwt.sign({ sub: USER_A_ID }, wrongSecret, { algorithm: 'HS256' });
    const res = await api
      .get(`/api/v1/users/${USER_A_ID}`)
      .set('Authorization', `Bearer ${badSigToken}`);
    expect(res.status).toBe(401);
    expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
  });

  it('returns 401 for a token with a numeric sub (malformed subject)', async () => {
    // jwt.sign accepts arbitrary payloads — craft one with a numeric sub
    const numericSubToken = jwt.sign({ sub: 12345 }, TEST_JWT_SECRET, { algorithm: 'HS256' });
    const res = await api
      .get(`/api/v1/users/${USER_A_ID}`)
      .set('Authorization', `Bearer ${numericSubToken}`);
    expect(res.status).toBe(401);
    expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
  });

  it('returns 401 for a token with an empty-string sub', async () => {
    const emptySubToken = signToken('');
    const res = await api
      .get(`/api/v1/users/${USER_A_ID}`)
      .set('Authorization', `Bearer ${emptySubToken}`);
    expect(res.status).toBe(401);
    expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
  });

  it('returns 401 for a token with a whitespace-only sub', async () => {
    const whitespaceSubToken = signToken('   ');
    const res = await api
      .get(`/api/v1/users/${USER_A_ID}`)
      .set('Authorization', `Bearer ${whitespaceSubToken}`);
    expect(res.status).toBe(401);
    expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
  });

  it('returns 401 for a token with a missing sub claim', async () => {
    const noSubToken = jwt.sign({ userId: USER_A_ID }, TEST_JWT_SECRET, { algorithm: 'HS256' });
    const res = await api
      .get(`/api/v1/users/${USER_A_ID}`)
      .set('Authorization', `Bearer ${noSubToken}`);
    expect(res.status).toBe(401);
    expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
  });

  it('returns 401 for a completely malformed token string', async () => {
    const res = await api
      .get(`/api/v1/users/${USER_A_ID}`)
      .set('Authorization', 'Bearer not.a.valid.jwt.at.all');
    expect(res.status).toBe(401);
    expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
  });
});

// ============================================================
// 7. Algorithm restriction: HS384 token must be rejected
// ============================================================

describe('Regression: algorithm restriction — HS384 token rejected by HS256-only verifier', () => {
  it('returns 401 for a validly signed HS384 token', async () => {
    // Correctly signed with the right secret but a disallowed algorithm
    const hs384Token = jwt.sign({ sub: USER_A_ID }, TEST_JWT_SECRET, { algorithm: 'HS384' });
    const res = await api
      .get(`/api/v1/users/${USER_A_ID}`)
      .set('Authorization', `Bearer ${hs384Token}`);
    expect(res.status).toBe(401);
    expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
  });
});

// ============================================================
// 8 & 9. Self-only profile access
// ============================================================

describe('Regression: self-only profile access', () => {
  it('User A can read their own profile (returns 200)', async () => {
    const fakeHash = await bcrypt.hash('irrelevant', 1);
    const dbUserA = makeDbUser({ id: USER_A_ID, password: fakeHash });
    mockPrismaUser.findUnique.mockResolvedValue(dbUserA);

    const token = signToken(USER_A_ID);

    const res = await api.get(`/api/v1/users/${USER_A_ID}`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data?.id).toBe(USER_A_ID);
    expect(res.body.data).not.toHaveProperty('password');
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('User A cannot read User B profile (returns 404)', async () => {
    // Token identifies as User A — requesting User B's profile.
    // The ownership check rejects before any DB lookup, so findUnique
    // must not be called regardless of what it is configured to return.
    const tokenForA = signToken(USER_A_ID);

    const res = await api
      .get(`/api/v1/users/${USER_B_ID}`)
      .set('Authorization', `Bearer ${tokenForA}`);

    expect(res.status).toBe(404);
    expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
  });
});

// ============================================================
// 10. Nonexistent foreign ID produces the same response as an existing one
// Both must return 404 with identical error structure and must not
// trigger any DB lookup for the target (ownership check short-circuits).
// ============================================================

describe('Regression: nonexistent foreign ID behaves identically to an existing foreign ID', () => {
  it('both return 404 with identical complete error responses; no target lookup occurs', async () => {
    const tokenForA = signToken(USER_A_ID);

    // Foreign existing ID (User B exists in DB but is owned by B)
    const existingForeignRes = await api
      .get(`/api/v1/users/${USER_B_ID}`)
      .set('Authorization', `Bearer ${tokenForA}`);

    // Foreign nonexistent ID
    const nonexistentForeignRes = await api
      .get('/api/v1/users/completely-nonexistent-id-xyz')
      .set('Authorization', `Bearer ${tokenForA}`);

    expect(existingForeignRes.status).toBe(404);
    expect(nonexistentForeignRes.status).toBe(404);

    // Complete error response must be identical — no information leak
    expect(existingForeignRes.body.error).toEqual(nonexistentForeignRes.body.error);

    // Ownership check must reject before any DB access for either request
    expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
  });
});

// ============================================================
// 11. Denied foreign-profile requests must not call findUnique for the target
// (covered above as part of tests 9 and 10; standalone guard here)
// ============================================================

describe('Regression: ownership check short-circuits before any DB lookup for the target', () => {
  it('User A requesting User B profile performs NO findUnique call', async () => {
    const tokenForA = signToken(USER_A_ID);

    await api.get(`/api/v1/users/${USER_B_ID}`).set('Authorization', `Bearer ${tokenForA}`);

    // The ownership check must reject before any DB lookup
    expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
  });
});

// ============================================================
// 12. /auth/me returns the authenticated user's profile
// ============================================================

describe('Regression: /auth/me returns the authenticated user profile', () => {
  it('returns 200 with the authenticated user profile and queries persistence using the token identity', async () => {
    const fakeHash = await bcrypt.hash('irrelevant', 1);
    const dbUserA = makeDbUser({ id: USER_A_ID, password: fakeHash });
    mockPrismaUser.findUnique.mockResolvedValue(dbUserA);

    const token = signToken(USER_A_ID);

    const res = await api.get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data?.id).toBe(USER_A_ID);
    expect(res.body.data).not.toHaveProperty('password');
    expect(res.body.data).not.toHaveProperty('passwordHash');

    // Persistence must have been queried using the authenticated user's ID
    // (derived from the token, not from a URL parameter)
    expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({ where: { id: USER_A_ID } });
  });
});

// ============================================================
// 13. Duplicate email and username return 409 Conflict
// ============================================================

describe('Regression: duplicate registration returns 409 Conflict', () => {
  it('returns 409 with CONFLICT code when email is already registered', async () => {
    const fakeHash = await bcrypt.hash('irrelevant', 1);
    // findUnique returns an existing user on the email uniqueness check
    mockPrismaUser.findUnique.mockResolvedValueOnce(makeDbUser({ password: fakeHash }));

    const res = await api.post('/api/v1/auth/register').send(BASE_REGISTER_PAYLOAD);

    expect(res.status).toBe(409);
    expect(res.body.error?.code).toBe('CONFLICT');
  });

  it('returns 409 with CONFLICT code when username is already taken', async () => {
    const fakeHash = await bcrypt.hash('irrelevant', 1);
    // First findUnique (email check) returns null; second (username) returns a user
    mockPrismaUser.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeDbUser({ password: fakeHash }));

    const res = await api.post('/api/v1/auth/register').send(BASE_REGISTER_PAYLOAD);

    expect(res.status).toBe(409);
    expect(res.body.error?.code).toBe('CONFLICT');
  });
});
