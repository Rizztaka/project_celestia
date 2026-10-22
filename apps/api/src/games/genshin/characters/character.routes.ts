import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { GenshinCharacterController } from './character.controller.js';

const router = Router();
const characterController = new GenshinCharacterController();

/**
 * GET /characters — Retrieve the authenticated user's full character roster.
 *
 * Full path: GET /api/v1/games/genshin/characters
 * Requires a valid JWT — userId is always taken from the verified token.
 */
router.get('/characters', requireAuth, characterController.listCharacters);
router.get('/focus', requireAuth, characterController.listFocus);
router.patch('/characters/:characterKey/focus', requireAuth, characterController.setFocus);
router.get('/characters/:characterKey/equipment', requireAuth, characterController.getEquipment);
router.get('/characters/:characterKey/reference', requireAuth, characterController.getReference);
router.get('/references/weapons/:itemKey', requireAuth, characterController.getWeaponReference);
router.get('/references/artifacts/:itemKey', requireAuth, characterController.getArtifactReference);

export { router as characterRoutes };
