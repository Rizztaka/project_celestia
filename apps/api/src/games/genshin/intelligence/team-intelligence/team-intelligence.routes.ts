import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth.middleware.js';
import { TeamIntelligenceController } from './team-intelligence.controller.js';

const router = Router();
const controller = new TeamIntelligenceController();

/**
 * GET /api/v1/games/genshin/intelligence/teams
 *
 * Returns the top 3 most buildable, meta-relevant team compositions for the
 * authenticated user.
 *
 * @access Private (requireAuth)
 * @milestone 4B — Team Intelligence Engine
 */
router.get('/intelligence/teams', requireAuth, controller.getRecommendations);

export { router as teamIntelligenceRoutes };
