import cors from 'cors';
import type { RequestHandler } from 'express';

import { normalizeOrigin } from '@/core/config/cors.js';
import { AppError } from '@/core/errors/app-error.js';

export function originPolicy(allowed: ReadonlySet<string>): RequestHandler {
  const allow = cors({
    origin: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
  });
  return (req, res, next) => {
    // Include absent and denied origins too: cached responses must not cross policy decisions.
    res.vary('Origin');
    const origin = req.headers.origin;
    if (origin === undefined) return next();
    let trusted = false;
    try {
      trusted = allowed.has(normalizeOrigin(origin));
    } catch {
      // Invalid request origins follow the same deliberate denial as untrusted origins.
    }
    if (!trusted)
      return next(new AppError('Request origin is not allowed.', 403, 'CORS_ORIGIN_DENIED'));
    return allow(req, res, next);
  };
}
