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

export { router as characterRoutes };
