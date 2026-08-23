import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { EndgameController } from './endgame.controller.js';

const router = Router();
const controller = new EndgameController();

// ─────────────────────────────────────────────────────
// Spiral Abyss routes (Milestone 5A)
// ─────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────
// Imaginarium Theater routes (Milestone 5C)
// ─────────────────────────────────────────────────────

/**
 * GET /api/v1/games/genshin/endgame/theater
 *
 * Returns the authenticated user's full Theater run history,
 * ordered by seasonId descending (most recent season first).
 *
 * @access Private (requireAuth)
 * @milestone 5C — Endgame Center: Imaginarium Theater Tracker
 */
router.get('/endgame/theater', requireAuth, controller.getTheaterHistory);

/**
 * POST /api/v1/games/genshin/endgame/theater
 *
 * Logs or updates a Theater run for the given season. Upserts on
 * [accountId, seasonId] — re-clearing a season overwrites the previous entry.
 *
 * Body: { seasonId: string, difficulty: EASY|NORMAL|HARD|VISIONARY, actsCleared: 1-10, stars: 0-10, cast: string[] }
 *
 * @access Private (requireAuth)
 * @milestone 5C — Endgame Center: Imaginarium Theater Tracker
 */
router.post('/endgame/theater', requireAuth, controller.logTheaterRun);

export { router as endgameRoutes };
