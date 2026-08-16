import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { ArtifactIntelligenceController } from './artifact-intelligence.controller.js';

const router = Router();
const controller = new ArtifactIntelligenceController();

// GET /api/v1/games/genshin/intelligence/artifacts
router.get('/', requireAuth, controller.getRecommendations);

export { router as artifactIntelligenceRoutes };
