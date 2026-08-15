import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { GenshinWeaponController } from './weapon.controller.js';

const router = Router();
const weaponController = new GenshinWeaponController();

/**
 * GET /weapons — Retrieve the authenticated user's full weapon inventory.
 *
 * Full path: GET /api/v1/games/genshin/weapons
 * Requires a valid JWT — userId is always taken from the verified token.
 */
router.get('/weapons', requireAuth, weaponController.listWeapons);

export { router as weaponRoutes };
