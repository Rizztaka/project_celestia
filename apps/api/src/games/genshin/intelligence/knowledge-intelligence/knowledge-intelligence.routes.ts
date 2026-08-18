import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { KnowledgeIntelligenceController } from './knowledge-intelligence.controller.js';

const router = Router();
const controller = new KnowledgeIntelligenceController();

/**
 * GET /api/v1/games/genshin/intelligence/knowledge
 *
 * Returns up to 3 personalized daily account insights, rotated by a
 * date-seeded selection. Insights cover elemental specialisation, neglected
 * talents, artifact hoarding, C6 characters, and roster diversity.
 *
 * @access Private (requireAuth)
 * @milestone 4F — Knowledge Intelligence Engine
 */
router.get('/intelligence/knowledge', requireAuth, controller.getInsights);

export { router as knowledgeIntelligenceRoutes };
