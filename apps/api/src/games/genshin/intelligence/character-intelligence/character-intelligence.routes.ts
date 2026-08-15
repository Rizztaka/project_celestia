import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { CharacterIntelligenceController } from './character-intelligence.controller.js';

const router = Router();
const controller = new CharacterIntelligenceController();

/**
 * GET /api/v1/games/genshin/intelligence/characters
 *
 * Returns the top 5 highest-ROI character build recommendations for the
 * authenticated user.
 *
 * @access Private (requireAuth)
 * @milestone 4A — Character Intelligence Engine
 */
router.get('/intelligence/characters', requireAuth, controller.getRecommendations);

export { router as characterIntelligenceRoutes };
