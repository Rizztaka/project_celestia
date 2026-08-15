import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { requireAuth } from '@/core/middleware/auth.middleware.js';

const router = Router();
const authController = new AuthController();

/**
 * POST /api/v1/auth/register — create a new account
 * POST /api/v1/auth/login    — authenticate and receive a JWT
 * GET  /api/v1/auth/me       — return the current user's profile (requires JWT)
 */
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', requireAuth, authController.me);

export { router as authRoutes };
