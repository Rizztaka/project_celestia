import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { buildInsightsHandler } from './build-insights.controller.js';

export const buildInsightsRoutes = Router();
buildInsightsRoutes.get(
  '/characters/:characterKey/build-insights',
  requireAuth,
  buildInsightsHandler(),
);
