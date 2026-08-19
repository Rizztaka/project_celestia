import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { EndgameController } from './endgame.controller.js';

const router = Router();
const controller = new EndgameController();

/**
 * GET /api/v1/games/genshin/endgame/abyss
 *
 * Returns the authenticated user's full Abyss run history, grouped by
 * cycle → floor → chamber. Optionally filtered by ?cycleId=5.0-1.
 *
 * @access Private (requireAuth)
 * @milestone 5A — Endgame Center: Spiral Abyss Tracker
 */
router.get('/endgame/abyss', requireAuth, controller.getAbyssHistory);

/**
 * POST /api/v1/games/genshin/endgame/abyss
 *
 * Logs or updates a single chamber-half run. Upserts on
 * [accountId, cycleId, floor, chamber, half] — re-clears are supported.
 *
 * Body: { cycleId: string, floor: 9-12, chamber: 1-3, half: 1|2, stars: 0-3, team: string[] }
 *
 * @access Private (requireAuth)
 * @milestone 5A — Endgame Center: Spiral Abyss Tracker
 */
router.post('/endgame/abyss', requireAuth, controller.logAbyssRun);

export { router as endgameRoutes };
