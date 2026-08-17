import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { PlannerIntelligenceController } from './planner-intelligence.controller.js';

const router = Router();
const controller = new PlannerIntelligenceController();

/**
 * GET /api/v1/games/genshin/intelligence/planner
 *
 * Returns an optimised daily farming route for the authenticated user,
 * allocating their projected resin across their active upgrade goals ranked
 * by character priority and domain time-gating.
 *
 * @access Private (requireAuth)
 * @milestone 4D — Planner Intelligence Engine
 */
router.get('/intelligence/planner', requireAuth, controller.getRecommendations);

export { router as plannerIntelligenceRoutes };
