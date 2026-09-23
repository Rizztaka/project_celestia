import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '@/core/config/env.js';
import { UnauthorizedError } from '@/core/errors/app-error.js';

// ============================================================
// Express Request Augmentation
//
// Extends the global Express Request type to carry the authenticated
// user's ID after this middleware has verified the JWT.
// This declaration must live in a file that is part of the TypeScript
// compilation — placing it here keeps it co-located with the middleware
// that populates it.
// ============================================================

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

// ============================================================
// Middleware
// ============================================================

/**
 * requireAuth — protects any route that should only be accessible
 * to authenticated users.
 *
 * Expects an Authorization header in the format:
 *   Authorization: Bearer <token>
 *
 * Security properties:
 *   - Explicitly restricts verification to HS256, preventing algorithm
 *     substitution attacks (e.g., RS256 or "none" algorithm).
 *   - After signature verification, performs runtime validation of the
 *     payload: `sub` must be a non-empty, non-whitespace string.
 *     A TypeScript cast alone does not enforce this at runtime.
 *   - Missing or malformed `Authorization` headers produce a distinct message
 *     from token-level failures (expired signature, disallowed algorithm,
 *     invalid `sub`).  Both paths return 401, but the message differs.
 *     Token-level failure reasons are not differentiated from each other
 *     to avoid leaking which specific check failed.
 *
 * On success: attaches { id: string } to req.user and calls next().
 * On failure: throws UnauthorizedError which the global handler converts to 401.
 *
 * Express v5 automatically catches synchronous throws in middleware,
 * so no try/catch wrapper is needed at the call site.
 *
 * Usage:
 *   router.get("/protected", requireAuth, controller.handler);
 */
export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError(
      'Missing or malformed authorization header. Expected: Bearer <token>',
    );
  }

  const token = authHeader.slice(7); // strip the "Bearer " prefix

  let payload: jwt.JwtPayload;

  try {
    // Explicitly restrict to HS256 — prevents algorithm substitution attacks
    // (e.g., a validly signed RS256 or "none"-algorithm token is rejected).
    const verified = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });

    // jwt.verify can return a string when the payload is a plain string JWT.
    // We require an object payload so we can validate `sub`.
    if (typeof verified !== 'object' || verified === null) {
      throw new UnauthorizedError('Invalid or expired token.');
    }

    payload = verified;
  } catch {
    // jwt.verify throws on expiry, bad signature, malformed token,
    // or disallowed algorithm — all treated identically.
    throw new UnauthorizedError('Invalid or expired token.');
  }

  // Runtime validation of the `sub` claim.
  // A TypeScript cast (as JwtPayload) does not protect against a token
  // whose `sub` is absent, null, a number, an empty string, or whitespace.
  const sub = payload.sub;

  if (typeof sub !== 'string' || sub.trim() === '') {
    throw new UnauthorizedError('Invalid or expired token.');
  }

  req.user = { id: sub };
  next();
};
