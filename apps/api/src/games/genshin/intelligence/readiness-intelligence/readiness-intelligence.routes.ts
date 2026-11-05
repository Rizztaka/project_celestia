import { Router } from 'express';

import { ReadinessIntelligenceController } from './readiness-intelligence.controller.js';

const router = Router();
const controller = new ReadinessIntelligenceController();

/**
 * POST /api/v1/games/genshin/intelligence/readiness
 *
 * Evaluates whether a character is ready for a specific role and encounter.
 * Adheres strictly to ADR-0011 (pure calculator separated from explainer).
 *
 * @access Public
 * @milestone 2 — Subphase 2.1 (Contextual Readiness Engine)
 */
router.post('/intelligence/readiness', controller.evaluate);

export { router as readinessIntelligenceRoutes };
