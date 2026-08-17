import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { PullIntelligenceController } from './pull-intelligence.controller.js';

const router = Router();
const controller = new PullIntelligenceController();

/**
 * GET /api/v1/games/genshin/intelligence/pulls
 *
 * Returns Pull Value recommendations for all currently active banners,
 * scored by how much each banner's 5-star would improve the user's roster,
 * team compositions, and synergy with their most-invested characters.
 *
 * @access Private (requireAuth)
 * @milestone 4E — Pull Intelligence Engine
 */
router.get('/intelligence/pulls', requireAuth, controller.getRecommendations);

export { router as pullIntelligenceRoutes };
