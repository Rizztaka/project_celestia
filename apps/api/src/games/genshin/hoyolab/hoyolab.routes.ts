import { Router } from 'express';

import { requireAuth, verifyBearer } from '@/core/middleware/auth.middleware.js';
import type { RequestSafety } from '@/core/middleware/request-admission.js';

import { HoyolabController } from './hoyolab.controller.js';
export function createHoyolabRoutes(safety: RequestSafety) {
  const router = Router(),
    controller = new HoyolabController();
  router.get('/hoyolab', requireAuth, controller.status);
  router.post('/hoyolab/connect', verifyBearer, safety.hoyolab(controller.connect));
  router.post('/hoyolab/select', verifyBearer, safety.hoyolab(controller.select));
  router.post('/hoyolab/sync', verifyBearer, safety.hoyolab(controller.sync));
  router.delete('/hoyolab', verifyBearer, safety.hoyolab(controller.disconnect));
  return router;
}
