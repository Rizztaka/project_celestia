import type { NextFunction, Request, Response } from 'express';

import { successResponse } from '@/core/utils/response.js';

import { PullIntelligenceService } from './pull-intelligence.service.js';

export class PullIntelligenceController {
  private readonly service: PullIntelligenceService;

  constructor() {
    this.service = new PullIntelligenceService();
  }

  getRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.getRecommendations(req.user!.id);
      res.json(successResponse(data, 'Pull intelligence recommendations retrieved successfully.'));
    } catch (err) {
      next(err);
    }
  };
}
