import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { GuideKnowledgeController } from './guide-knowledge.controller.js';

const router = Router();
router.get('/guide-knowledge/release', requireAuth, new GuideKnowledgeController().release);
router.get(
  '/characters/:characterKey/guide-advice/v3',
  requireAuth,
  new GuideKnowledgeController().readV3,
);
router.get(
  '/characters/:characterKey/guide-advice',
  requireAuth,
  new GuideKnowledgeController().read,
);
export { router as guideKnowledgeRoutes };
router.get(
  '/characters/:characterKey/guide-advice/v2',
  requireAuth,
  new GuideKnowledgeController().readV2,
);
