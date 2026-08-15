import type { NextFunction,Request, Response } from 'express';
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
// JWT Payload Shape
// ============================================================

interface JwtPayload {
  sub: string;
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

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = { id: payload.sub };
    next();
  } catch {
    // jwt.verify throws on expiry, bad signature, malformed token, etc.
    throw new UnauthorizedError('Invalid or expired token.');
  }
};
