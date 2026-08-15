import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { GenshinArtifactController } from './artifact.controller.js';

const router = Router();
const artifactController = new GenshinArtifactController();

/**
 * GET /artifacts — Retrieve the authenticated user's full artifact inventory.
 *
 * Full path: GET /api/v1/games/genshin/artifacts
 * Requires a valid JWT — userId is always taken from the verified token.
 */
router.get('/artifacts', requireAuth, artifactController.listArtifacts);

export { router as artifactRoutes };
