import { Router } from 'express';

import { optionalAuth, requireAuth } from '@/core/middleware/auth.middleware.js';

import { PullIntelligenceController } from './pull-intelligence.controller.js';

const router = Router();
const controller = new PullIntelligenceController();

/**
 * GET /api/v1/games/genshin/intelligence/pulls
 *
 * Returns Account-Value Pull recommendations for active banners.
 * @access Private (requireAuth)
 */
router.get('/intelligence/pulls', requireAuth, controller.getRecommendations);

/**
 * POST /api/v1/games/genshin/intelligence/pulls/compare
 *
 * Compares an explicit hypothetical target (C0 unlock, Constellation, or Weapon).
 * Supports both authenticated users and guest/showcase contexts.
 * @access Public / Optional Auth
 */
router.post('/intelligence/pulls/compare', optionalAuth, controller.compareHypothetical);

/**
 * GET /api/v1/games/genshin/public/uid/:uid/intelligence/pulls
 * GET /api/v1/games/genshin/intelligence/pulls/showcase/:uid
 *
 * Evaluates active banners for a public showcase account with partial-data guards.
 * @access Public
 */
router.get('/public/uid/:uid/intelligence/pulls', controller.getPublicShowcaseRecommendations);
router.get('/intelligence/pulls/showcase/:uid', controller.getPublicShowcaseRecommendations);

export { router as pullIntelligenceRoutes };
