import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { DailyCompanionController } from './companion.controller.js';
import { EventController } from './event.controller.js';
import { GoalController } from './goal.controller.js';
import { WeeklyBossController } from './weekly-boss.controller.js';

const router = Router();
const companionController = new DailyCompanionController();
const goalController = new GoalController();
const eventController = new EventController();
const weeklyBossController = new WeeklyBossController();

/**
 * Companion domain routes.
 * All routes are protected — userId is taken from the verified JWT.
 *
 * Full paths (mounted at /api/v1/companion in app.ts):
 *   GET    /api/v1/companion/daily              — fetch/init daily state
 *   PATCH  /api/v1/companion/resin              — update resin checkpoint
 *   PATCH  /api/v1/companion/checklist          — update checklist flags
 *
 *   POST   /api/v1/companion/goals              — create upgrade goal
 *   GET    /api/v1/companion/goals              — list all goals
 *   GET    /api/v1/companion/goals/materials    — full material delta
 *   GET    /api/v1/companion/goals/today        — today's farmable domains
 *   DELETE /api/v1/companion/goals/:id          — delete goal
 *
 *   GET    /api/v1/companion/events                              — fetch active events + user progress
 *   PATCH  /api/v1/companion/events/:eventKey/tiers/:tierId      — toggle a reward tier claim
 *
 *   GET    /api/v1/companion/weekly-bosses                       — fetch bosses + weekly defeat state
 *   PATCH  /api/v1/companion/weekly-bosses/:bossKey              — toggle a boss's defeated state
 *
 * IMPORTANT: /goals/materials and /goals/today are registered BEFORE /goals/:id
 * to prevent Express matching the literal strings "materials" and "today" as the :id param.
 */
router.get('/daily', requireAuth, companionController.getDaily);
router.patch('/resin', requireAuth, companionController.updateResin);
router.patch('/checklist', requireAuth, companionController.updateChecklist);

router.post('/goals', requireAuth, goalController.createGoal);
router.get('/goals', requireAuth, goalController.listGoals);
router.get('/goals/materials', requireAuth, goalController.getMaterials);
router.get('/goals/today', requireAuth, goalController.getTodayDomains);
router.delete('/goals/:id', requireAuth, goalController.deleteGoal);

router.get('/events', requireAuth, eventController.getEvents);
router.patch('/events/:eventKey/tiers/:tierId', requireAuth, eventController.patchTier);

router.get('/weekly-bosses', requireAuth, weeklyBossController.getWeeklyBosses);
router.patch('/weekly-bosses/:bossKey', requireAuth, weeklyBossController.patchBoss);

export { router as companionRoutes };
