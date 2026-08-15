import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth } from './auth.middleware.js';
import { UnauthorizedError } from '@/core/errors/app-error.js';

// ============================================================
// Mocks
// ============================================================

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

// Provide a stable env so this test file never reads from process.env
vi.mock('@/core/config/env.js', () => ({
  env: {
    JWT_SECRET: 'test-secret-value-exactly-32-chars!',
    JWT_EXPIRY: '7d',
    PORT: '4000',
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://localhost/test',
  },
}));

// ============================================================
// Helpers
// ============================================================

/**
 * Builds minimal mock Request / Response / NextFunction objects.
 * We only mock what requireAuth actually reads or writes.
 */
const buildMocks = (authHeader?: string) => {
  const req = {
    headers: authHeader ? { authorization: authHeader } : {},
  } as Partial<Request>;

  const res = {} as Partial<Response>;
  const next = vi.fn() as NextFunction;

  return { req: req as Request, res: res as Response, next };
};

// ============================================================
// Tests
// ============================================================

describe('requireAuth middleware', () => {
  let jwt: { verify: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();
    const jwtModule = await import('jsonwebtoken');
    jwt = jwtModule.default as unknown as typeof jwt;
  });

  // ----------------------------------------------------------
  // Unauthenticated requests are rejected
  // ----------------------------------------------------------

  it('throws UnauthorizedError when no Authorization header is present', () => {
    const { req, res, next } = buildMocks();

    expect(() => requireAuth(req, res, next)).toThrow(UnauthorizedError);
    expect(next).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when Authorization header is not Bearer', () => {
    const { req, res, next } = buildMocks('Basic dXNlcjpwYXNz');

    expect(() => requireAuth(req, res, next)).toThrow(UnauthorizedError);
    expect(next).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when token has an invalid signature', () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid signature');
    });

    const { req, res, next } = buildMocks('Bearer bad.token.here');

    expect(() => requireAuth(req, res, next)).toThrow(UnauthorizedError);
    expect(next).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when token is expired', () => {
    const expiredError = new Error('jwt expired');
    expiredError.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => {
      throw expiredError;
    });

    const { req, res, next } = buildMocks('Bearer expired.token.here');

    expect(() => requireAuth(req, res, next)).toThrow(UnauthorizedError);
    expect(next).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------
  // Authenticated requests pass through
  // ----------------------------------------------------------

  it('attaches req.user and calls next() when token is valid', () => {
    jwt.verify.mockReturnValue({ sub: 'user-abc-123' });

    const { req, res, next } = buildMocks('Bearer valid.token.here');

    requireAuth(req, res, next);

    expect(req.user).toEqual({ id: 'user-abc-123' });
    expect(next).toHaveBeenCalledOnce();
  });

  it('does not attach req.user if token verification fails', () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    const { req, res, next } = buildMocks('Bearer garbage');

    expect(() => requireAuth(req, res, next)).toThrow();
    expect(req.user).toBeUndefined();
  });
});
