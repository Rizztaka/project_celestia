import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { UserController } from './user.controller.js';

const router = Router();
const userController = new UserController();

/**
 * GET /api/v1/users/:id — retrieve own profile (requires JWT)
 *
 * The canonical registration endpoint is POST /api/v1/auth/register.
 * The legacy public POST / route that bypassed password hashing has been
 * removed as part of the Platform Account Security milestone.
 */
router.get('/:id', requireAuth, userController.getUser);

export { router as userRoutes };
