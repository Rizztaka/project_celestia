import { Router } from 'express';

import { requireAuth, verifyBearer } from '@/core/middleware/auth.middleware.js';
import type { RequestSafety } from '@/core/middleware/request-admission.js';

import { GenshinImportController } from './importer.controller.js';

export function createImporterRoutes(safety: RequestSafety) {
  const router = Router();
  const importController = new GenshinImportController();

  /**
   * POST /import — Import a GOOD-format account export.
   *
   * Full path: POST /api/v1/games/genshin/import
   * Requires a valid JWT — userId is always taken from the verified token,
   * never from the request body, preventing cross-account data injection.
   */
  router.post('/import', verifyBearer, safety.import(importController.importGenshinAccount));
  router.post(
    '/import/preview',
    verifyBearer,
    safety.import(importController.previewGenshinImport),
  );
  router.get('/import/status', requireAuth, safety.ordinaryJson, importController.getImportStatus);

  return router;
}
