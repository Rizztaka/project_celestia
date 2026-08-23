import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth.middleware.js';
import { progressionIntelligenceController } from './progression-intelligence.controller.js';

const router = Router();

// Retrieve account progression intelligence
router.get(
  '/intelligence/progression',
  requireAuth,
  progressionIntelligenceController.getProgressionAnalysis
);

export { router as progressionIntelligenceRoutes };
