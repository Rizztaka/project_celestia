import { wishRequestSchema } from '@celestia/api-contracts';
import type { NextFunction, Request, Response } from 'express';

import { UnprocessableError } from '@/core/errors/app-error.js';
import { successResponse } from '@/core/utils/response.js';

import { pullSimulatorService } from './pull-simulator.service.js';
export const pullSimulatorController = {
  getSandboxCatalog(_req: Request, res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    res.json(
      successResponse(pullSimulatorService.getSandboxCatalog(), 'Historical fictional sandbox.'),
    );
  },
  simulateSandbox(req: Request, res: Response, next: NextFunction) {
    try {
      res.setHeader('Cache-Control', 'no-store');
      res.json(
        successResponse(pullSimulatorService.simulateSandbox(req.body), 'Fictional wish results.'),
      );
    } catch (error) {
      next(error instanceof Error ? error : new Error('Wish simulation failed.'));
    }
  },
  getBanners(_req: Request, res: Response) {
    res.json(successResponse(pullSimulatorService.getBanners(), 'Historical wish scenarios.'));
  },
  simulatePulls(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = wishRequestSchema.safeParse(req.body);
      if (!parsed.success)
        throw new UnprocessableError(parsed.error.errors.map((e) => e.message).join('; '));
      res.json(
        successResponse(pullSimulatorService.simulatePulls(parsed.data), 'Fictional wish results.'),
      );
    } catch (error) {
      next(error instanceof Error ? error : new Error('Wish simulation failed.'));
    }
  },
};
