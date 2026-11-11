import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { PlannerIntelligenceController } from './planner-intelligence.controller.js';

const router = Router();
const controller = new PlannerIntelligenceController();

/**
 * GET /api/v1/games/genshin/intelligence/planner
 *
 * Returns an optimised daily farming route for the authenticated user,
 * allocating their projected resin across active upgrade goals using
 * multi-objective marginal ROI, material deficits, and domain time-gating.
 *
 * @access Private (requireAuth)
 */
router.get('/intelligence/planner', requireAuth, controller.getRecommendations);

/**
 * POST /api/v1/games/genshin/intelligence/planner/optimize
 *
 * Computes a customizable multi-objective optimization plan with explicit
 * session time budgets, custom resin caps, goal focus filters, and structured
 * alternative pathways (condensed speedrun, zero-resin overworld prep, secondary goal).
 *
 * @access Private (requireAuth)
 */
router.post('/intelligence/planner/optimize', requireAuth, controller.optimizePlan);

export { router as plannerIntelligenceRoutes };
