import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { ZodError } from 'zod';

import { corsAllowedOrigins } from '@/core/config/cors.js';
import { env } from '@/core/config/env.js';
import type { RequestSafetyPolicy } from '@/core/config/request-safety.js';
import { AppError } from '@/core/errors/app-error.js';
import { liveness, readiness } from '@/core/health/health.controller.js';
import { logger } from '@/core/logger/logger.js';
import { originPolicy } from '@/core/middleware/origin.middleware.js';
import { createRequestSafety } from '@/core/middleware/request-admission.js';
import { errorResponse } from '@/core/utils/response.js';

import { genshinAccountData } from './games/genshin/account-data/genshin-account-data.js';
import { GenshinCompanionProvider } from './games/genshin/companion/genshin-companion.provider.js';
import { createGenshinRoutes } from './games/genshin/genshin.routes.js';
import { nikkeAccountData } from './games/nikke/account-data/nikke-account-data.js';
import { nikkeRoutes } from './games/nikke/nikke.routes.js';
import { createAccountDataRoutes } from './platform/account-data/account-data.routes.js';
import { createAuthRoutes } from './platform/auth/auth.routes.js';
import { companionRoutes } from './platform/companion/companion.routes.js';
import { companionRegistry } from './platform/companion/companion-registry.service.js';
import { userRoutes } from './platform/users/user.routes.js';

// Register companion providers
companionRegistry.register(new GenshinCompanionProvider());

export function createApp(options: { policy?: RequestSafetyPolicy; clock?: () => number } = {}) {
  const app = express();
  app.set('trust proxy', env.TRUST_PROXY ?? false);
  const safety = createRequestSafety(options.policy, options.clock);

  // ============================================================
  // Security and Core Middleware
  // ============================================================

  app.use(helmet());
  app.use(originPolicy(corsAllowedOrigins(env.NODE_ENV, process.env.CORS_ALLOWED_ORIGINS)));

  // Request Logging
  app.use((req, _res, next) => {
    logger.info({ method: req.method }, 'Incoming request');
    next();
  });

  // ============================================================
  // API v1 Router
  //
  // All domain routes are mounted here so they share the /api/v1 prefix
  // and can be managed consistently as new modules are added.
  // ============================================================

  const v1Router = express.Router();

  v1Router.get(['/health', '/health/live'], liveness);
  v1Router.get('/health/ready', readiness);

  // Platform routes
  v1Router.use('/auth', createAuthRoutes(safety));
  v1Router.use('/users', createAccountDataRoutes(safety, [genshinAccountData, nikkeAccountData]));
  v1Router.use('/games/genshin', createGenshinRoutes(safety));
  // Expensive routes above own their parser. No earlier middleware consumes their bodies.
  v1Router.use(safety.ordinaryJson);
  v1Router.use('/users', userRoutes);
  v1Router.use('/companion', companionRoutes); // Phase 3

  // Game routes
  v1Router.use('/games/nikke', nikkeRoutes);

  app.use('/api/v1', v1Router);

  // ============================================================
  // Global Error Handler
  //
  // Order matters — most specific checks must come first.
  //
  // 1. AppError  → domain errors with a known HTTP status code
  // 2. ZodError  → validation failures from request parsing
  // 3. Everything else → unexpected 500
  // ============================================================

  // Express recognizes error middleware by its four-argument arity.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (res.destroyed || res.headersSent) return;
    // Domain errors thrown by services — carry their own status code
    if (err instanceof AppError) {
      return res.status(err.statusCode).json(errorResponse(err.errorCode, err.message));
    }

    // Zod validation errors thrown by schema.parse() in controllers
    if (err instanceof ZodError) {
      return res
        .status(400)
        .json(errorResponse('VALIDATION_ERROR', err.errors[0]?.message ?? 'Validation failed'));
    }

    // Unexpected errors — log them, never expose internals to the client
    logger.error({ err }, 'Unhandled server error');

    return res
      .status(500)
      .json(errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred'));
  });
  return app;
}

export const app = createApp();
