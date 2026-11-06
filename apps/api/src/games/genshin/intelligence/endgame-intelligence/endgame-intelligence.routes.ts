import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { EndgameIntelligenceController } from './endgame-intelligence.controller.js';

const router = Router();
const controller = new EndgameIntelligenceController();

/**
 * POST /api/v1/games/genshin/intelligence/endgame/abyss-joint
 *
 * Solves joint dual-chamber Abyss team assignment with character and gear exclusivity.
 *
 * @access Private (requireAuth)
 */
router.post('/intelligence/endgame/abyss-joint', requireAuth, controller.solveAbyssJoint);

/**
 * POST /api/v1/games/genshin/intelligence/endgame/onslaught-joint
 *
 * Solves 3-boss consecutive Onslaught allocation with 12-character exclusivity.
 *
 * @access Private (requireAuth)
 */
router.post('/intelligence/endgame/onslaught-joint', requireAuth, controller.solveOnslaughtJoint);

/**
 * POST /api/v1/games/genshin/intelligence/endgame/theater-plan
 *
 * Solves dynamic Imaginarium Theater act scheduling and vigor preservation.
 *
 * @access Private (requireAuth)
 */
router.post('/intelligence/endgame/theater-plan', requireAuth, controller.solveTheaterActPlan);

export { router as endgameIntelligenceRoutes };
