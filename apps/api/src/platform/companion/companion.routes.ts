import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { EventController } from './event.controller.js';
import { GoalController } from './goal.controller.js';
import { PlanController } from './plan.controller.js';
import {
  RoutineController,
  v1GetDailyCompat,
  v1GetWeeklyBossesCompat,
  v1PatchChecklistCompat,
  v1PatchResinCompat,
  v1PatchWeeklyBossCompat,
} from './routine.controller.js';

const router = Router();
const routineController = new RoutineController();
const goalController = new GoalController();
const eventController = new EventController();
const planController = new PlanController();

router.get('/plan', requireAuth, planController.getSnapshot);
router.get('/plan/advice', requireAuth, planController.getAdvice);
router.patch('/plan', requireAuth, planController.update);

/**
 * Companion domain routes.
 * All routes are protected — userId is taken from the verified JWT.
 *
 * Full paths (mounted at /api/v1/companion in app.ts):
 *
 * ── C2a V2 Routine API ──────────────────────────────────────────────
 *   GET    /api/v1/companion/routine?contractVersion=2   — read-only snapshot
 *   PATCH  /api/v1/companion/routine/settings            — server selection
 *   PATCH  /api/v1/companion/routine/checklist           — daily flags + transformer
 *   PATCH  /api/v1/companion/routine/resin               — resin checkpoint
 *   PATCH  /api/v1/companion/routine/weekly-claims       — weekly reward count
 *
 * ── V1 Compatibility (returns 409 CLIENT_UPDATE_REQUIRED) ───────────
 *   GET    /api/v1/companion/daily              — replaced by /routine
 *   PATCH  /api/v1/companion/resin              — replaced by /routine/resin
 *   PATCH  /api/v1/companion/checklist          — replaced by /routine/checklist
 *   GET    /api/v1/companion/weekly-bosses      — replaced by /routine
 *   PATCH  /api/v1/companion/weekly-bosses/:bossKey  — replaced by /routine/weekly-claims
 *
 * ── Unaffected routes ─────────────────────────────────────────────────
 *   POST   /api/v1/companion/goals              — create upgrade goal
 *   GET    /api/v1/companion/goals              — list all goals
 *   GET    /api/v1/companion/goals/materials    — full material delta
 *   GET    /api/v1/companion/goals/today        — today's farmable domains
 *   DELETE /api/v1/companion/goals/:id          — delete goal
 *
 *   GET    /api/v1/companion/events                              — active events
 *   PATCH  /api/v1/companion/events/:eventKey/tiers/:tierId      — tier claim
 *
 * IMPORTANT: /goals/materials and /goals/today are registered BEFORE /goals/:id
 * to prevent Express matching literal strings as the :id param.
 */

// ── V2 Routine API
router.get('/routine', requireAuth, routineController.getSnapshot);
router.patch('/routine/settings', requireAuth, routineController.patchSettings);
router.patch('/routine/checklist', requireAuth, routineController.patchChecklist);
router.patch('/routine/resin', requireAuth, routineController.patchResin);
router.patch('/routine/weekly-claims', requireAuth, routineController.patchWeeklyClaims);

// ── V1 compatibility — returns 409 COMPANION_CLIENT_UPDATE_REQUIRED
router.get('/daily', requireAuth, v1GetDailyCompat);
router.patch('/resin', requireAuth, v1PatchResinCompat);
router.patch('/checklist', requireAuth, v1PatchChecklistCompat);
router.get('/weekly-bosses', requireAuth, v1GetWeeklyBossesCompat);
router.patch('/weekly-bosses/:bossKey', requireAuth, v1PatchWeeklyBossCompat);

// ── Goals (unaffected)
router.post('/goals', requireAuth, goalController.createGoal);
router.get('/goals', requireAuth, goalController.listGoals);
router.get('/goals/materials', requireAuth, goalController.getMaterials);
router.get('/goals/today', requireAuth, goalController.getTodayDomains);
router.patch('/goals/:id', requireAuth, goalController.updateGoal);
router.delete('/goals/:id', requireAuth, goalController.deleteGoal);

// ── Events (unaffected)
router.get('/events', requireAuth, eventController.getEvents);
router.patch('/events/:eventKey/tiers/:tierId', requireAuth, eventController.patchTier);

export { router as companionRoutes };
