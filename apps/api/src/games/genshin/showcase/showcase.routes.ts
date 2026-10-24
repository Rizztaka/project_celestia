import { Router } from 'express';

import { ShowcaseController } from './showcase.controller.js';
import { ShowcaseService } from './showcase.service.js';

export function createShowcaseRoutes(service = new ShowcaseService()) {
  const router = Router();
  const controller = new ShowcaseController(service);
  // Public read only. A UID lookup does not authenticate or link account ownership.
  router.get('/showcase/:uid', controller.lookup);
  return router;
}
