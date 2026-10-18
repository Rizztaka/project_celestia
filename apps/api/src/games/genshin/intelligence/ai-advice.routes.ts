import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';
import type { RequestSafety } from '@/core/middleware/request-admission.js';

import { aiSummary } from './ai-advice.controller.js';

export function createAiAdviceRoutes(safety: RequestSafety) {
  const router = Router();
  router.post('/intelligence/ai-summary', requireAuth, safety.aiSummary(aiSummary));
  return router;
}
