import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth.middleware.js';
import accountRoutes from './accounts/account.routes.js';
import characterRoutes from './characters/character.routes.js';

const router = Router();

// All NIKKE routes require authentication
router.use(requireAuth);

router.use('/accounts', accountRoutes);
router.use('/characters', characterRoutes);

export const nikkeRoutes = router;
