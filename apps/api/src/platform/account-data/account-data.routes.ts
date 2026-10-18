import { Router } from 'express';

import type { AccountDataDomain } from '@/core/contracts/account-data.js';
import { verifyBearer } from '@/core/middleware/auth.middleware.js';
import type { RequestSafety } from '@/core/middleware/request-admission.js';

import { AccountDataController } from './account-data.controller.js';
import { AccountDataRepository } from './account-data.repository.js';
import { AccountDataService } from './account-data.service.js';

export function createAccountDataRoutes(
  safety: RequestSafety,
  domains: readonly AccountDataDomain[],
) {
  const router = Router();
  const controller = new AccountDataController(
    new AccountDataService(new AccountDataRepository(domains)),
  );
  const noStore = (
    _req: unknown,
    res: import('express').Response,
    next: import('express').NextFunction,
  ) => {
    res.set('Cache-Control', 'no-store');
    next();
  };
  router.post('/me/export', noStore, verifyBearer, safety.accountData(controller.export));
  router.delete('/me/account', noStore, verifyBearer, safety.accountData(controller.delete));
  return router;
}
