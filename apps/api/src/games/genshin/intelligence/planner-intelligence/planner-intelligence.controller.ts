import type { Request, Response, NextFunction } from 'express';

import { successResponse } from '@/core/utils/response.js';

import { PlannerIntelligenceService } from './planner-intelligence.service.js';

export class PlannerIntelligenceController {
  private readonly service: PlannerIntelligenceService;

  constructor() {
    this.service = new PlannerIntelligenceService();
  }

  getRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.getRecommendations(req.user!.id);
      res.json(successResponse(data, 'Planner intelligence recommendations retrieved successfully.'));
    } catch (err) {
      next(err);
    }
  };
}
