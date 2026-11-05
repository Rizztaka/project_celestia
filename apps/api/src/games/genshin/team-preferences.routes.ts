import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { requireAuth } from '@/core/middleware/auth.middleware.js';

import { GenshinTeamPreferencesController } from './team-preferences.controller.js';

const controller = new GenshinTeamPreferencesController();
const router = Router();
const noStore = (_req: Request, res: Response, next: NextFunction) => {
  res.set('Cache-Control', 'no-store');
  next();
};
router.get('/team-preferences', noStore, requireAuth, controller.read);
router.patch('/team-preferences', noStore, requireAuth, controller.write);
export { router as teamPreferencesRoutes };
