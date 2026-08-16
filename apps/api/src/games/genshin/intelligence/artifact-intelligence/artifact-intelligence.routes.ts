import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { ArtifactIntelligenceController } from './artifact-intelligence.controller.js';

const router = Router();
const controller = new ArtifactIntelligenceController();

/**
 * GET /api/v1/games/genshin/intelligence/artifacts
 *
 * Returns the top 5 characters with the lowest artifact efficiency scores,
 * each with per-slot breakdowns and plain-language improvement suggestions.
 *
 * @access Private (requireAuth)
 * @milestone 4C — Artifact Intelligence Engine
 */
router.get('/intelligence/artifacts', requireAuth, controller.getRecommendations);

export { router as artifactIntelligenceRoutes };
