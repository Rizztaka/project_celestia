import type { NextFunction, Request, Response } from 'express';

import { BadRequestError } from '@/core/errors/app-error.js';
import { successResponse } from '@/core/utils/response.js';

import { farmingQuerySchema } from './farming-intelligence.schema.js';
import { FarmingIntelligenceService } from './farming-intelligence.service.js';

export class FarmingIntelligenceController {
  constructor(private readonly service = new FarmingIntelligenceService()) {}
  getRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = farmingQuerySchema.safeParse(req.query);
      if (!parsed.success)
        throw new BadRequestError(
          'Invalid farming options. Choose domain tiers and a bounded route size.',
        );
      res.json(
        successResponse(
          await this.service.getRecommendations(req.user!.id, parsed.data),
          'Farming planning estimates retrieved.',
        ),
      );
    } catch (error) {
      next(error);
    }
  };
}
