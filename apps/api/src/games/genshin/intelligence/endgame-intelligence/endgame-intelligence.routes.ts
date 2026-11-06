import { Router } from 'express';

import { optionalAuth } from '@/core/middleware/auth.middleware.js';

import { EndgameIntelligenceController } from './endgame-intelligence.controller.js';

const router = Router();
const controller = new EndgameIntelligenceController();

/**
 * POST /api/v1/games/genshin/intelligence/endgame/abyss-joint
 *
 * Solves joint dual-chamber Abyss team assignment with character and gear exclusivity.
 * Supports both authenticated users and public showcase guest sessions.
 */
router.post('/intelligence/endgame/abyss-joint', optionalAuth, controller.solveAbyssJoint);

/**
 * POST /api/v1/games/genshin/intelligence/endgame/onslaught-joint
 *
 * Solves 3-boss consecutive Onslaught allocation with 12-character exclusivity.
 * Supports both authenticated users and public showcase guest sessions.
 */
router.post('/intelligence/endgame/onslaught-joint', optionalAuth, controller.solveOnslaughtJoint);

/**
 * POST /api/v1/games/genshin/intelligence/endgame/theater-plan
 *
 * Solves dynamic Imaginarium Theater act scheduling and vigor preservation.
 * Supports both authenticated users and public showcase guest sessions.
 */
router.post('/intelligence/endgame/theater-plan', optionalAuth, controller.solveTheaterActPlan);

export { router as endgameIntelligenceRoutes };
