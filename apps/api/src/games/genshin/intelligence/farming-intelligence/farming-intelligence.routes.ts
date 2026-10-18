import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { FarmingIntelligenceController } from './farming-intelligence.controller.js';

const router = Router();
const controller = new FarmingIntelligenceController();
router.get('/intelligence/farming', requireAuth, controller.getRecommendations);
export { router as farmingIntelligenceRoutes };
