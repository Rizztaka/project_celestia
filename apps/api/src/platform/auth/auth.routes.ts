import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';
import type { RequestSafety } from '@/core/middleware/request-admission.js';

import { AuthController } from './auth.controller.js';
import { SecurityController } from './security.controller.js';

export function createAuthRoutes(safety: RequestSafety) {
  const router = Router();
  const authController = new AuthController();
  const security = new SecurityController();
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('Referrer-Policy', 'no-referrer');
    next();
  });

  /**
   * POST /api/v1/auth/register — create a new account
   * POST /api/v1/auth/login    — authenticate and receive a JWT
   * GET  /api/v1/auth/me       — return the current user's profile (requires JWT)
   */
  router.post('/register', safety.register(authController.register));
  router.post('/login', safety.login(authController.login));
  router.get('/me', requireAuth, safety.ordinaryJson, authController.me);
  router.post('/refresh', safety.login(security.refresh));
  router.post('/forgot-password', safety.login(security.forgot));
  router.post('/reset-password', safety.login(security.reset));
  router.post('/verify-email', safety.login(security.verify));
  router.post('/verification-email', requireAuth, safety.login(security.resend));
  router.get('/sessions', requireAuth, security.list);
  router.post('/logout', requireAuth, security.logout);
  router.post('/logout-all', requireAuth, security.logoutAll);
  router.post('/logout-others', requireAuth, security.logoutOthers);
  router.get('/oauth/providers', security.providers);
  router.get('/oauth/:provider/callback', safety.login(security.callback));
  router.get('/oauth/:provider', safety.login(security.start));
  router.post('/oauth/:provider/link', requireAuth, safety.login(security.start));

  return router;
}
