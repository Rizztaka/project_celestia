import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { DailyCompanionController } from "./companion.controller.js";

const router = Router();
const companionController = new DailyCompanionController();

/**
 * Companion domain routes.
 * All routes are protected — userId is taken from the verified JWT.
 *
 * Full paths (mounted at /api/v1/companion in app.ts):
 *   GET    /api/v1/companion/daily      — fetch/init daily state
 *   PATCH  /api/v1/companion/resin      — update resin checkpoint
 *   PATCH  /api/v1/companion/checklist  — update checklist flags
 */
router.get("/daily",       requireAuth, companionController.getDaily);
router.patch("/resin",     requireAuth, companionController.updateResin);
router.patch("/checklist", requireAuth, companionController.updateChecklist);

export { router as companionRoutes };
