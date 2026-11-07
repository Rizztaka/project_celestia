import { showcaseUidSchema } from '@celestia/api-contracts';
import type { NextFunction, Request, Response } from 'express';

import { BadRequestError } from '@/core/errors/app-error.js';
import { successResponse } from '@/core/utils/response.js';

import { companionSummaryService } from './companion-summary.service.js';

export const companionSummaryController = {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new BadRequestError('User authentication required.');
      }
      res.setHeader('Cache-Control', 'no-store');
      const data = await companionSummaryService.getSummary(req.user.id);
      res.json(successResponse(data, 'Companion summary calculated.'));
    } catch (error) {
      next(error);
    }
  },

  async getPublicShowcaseSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const uidParsed = showcaseUidSchema.safeParse(req.params.uid);
      if (!uidParsed.success) {
        throw new BadRequestError('Invalid Genshin UID format.');
      }
      res.setHeader('Cache-Control', 'public, max-age=60');
      const data = await companionSummaryService.getPublicShowcaseSummary(uidParsed.data);
      res.json(successResponse(data, 'Public companion summary calculated.'));
    } catch (error) {
      next(error);
    }
  },
};
