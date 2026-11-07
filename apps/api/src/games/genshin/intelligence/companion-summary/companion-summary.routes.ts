import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { companionSummaryController } from './companion-summary.controller.js';

const router = Router();

// Authenticated companion summary
router.get('/intelligence/summary', requireAuth, companionSummaryController.getSummary);

// Public showcase companion summary
router.get(
  '/public/uid/:uid/intelligence/summary',
  companionSummaryController.getPublicShowcaseSummary,
);

export { router as companionSummaryRoutes };
