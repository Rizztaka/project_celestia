import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { UserController } from './user.controller.js';

const router = Router();
const userController = new UserController();

// Map endpoints to controller methods
router.post('/', userController.createUser); // public — registration
router.get('/:id', requireAuth, userController.getUser); // protected — requires JWT

export { router as userRoutes };
