import { optimizationPlannerRequestSchema } from '@celestia/api-contracts';
import type { NextFunction, Request, Response } from 'express';

import { BadRequestError } from '@/core/errors/app-error.js';
import { successResponse } from '@/core/utils/response.js';

import { PlannerIntelligenceService } from './planner-intelligence.service.js';

export class PlannerIntelligenceController {
  private readonly service: PlannerIntelligenceService;

  constructor(service = new PlannerIntelligenceService()) {
    this.service = service;
  }

  getRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const timeBudgetMinutes =
        typeof req.query.timeBudgetMinutes === 'string'
          ? Number(req.query.timeBudgetMinutes)
          : undefined;
      const customResinBudget =
        typeof req.query.customResinBudget === 'string'
          ? Number(req.query.customResinBudget)
          : undefined;

      const options = {
        ...(typeof timeBudgetMinutes === 'number' && Number.isFinite(timeBudgetMinutes)
          ? { timeBudgetMinutes }
          : {}),
        ...(typeof customResinBudget === 'number' && Number.isFinite(customResinBudget)
          ? { customResinBudget }
          : {}),
      };

      const data = await this.service.getRecommendations(req.user!.id, options);
      res.json(
        successResponse(data, 'Planner intelligence recommendations retrieved successfully.'),
      );
    } catch (err) {
      next(err);
    }
  };

  optimizePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = optimizationPlannerRequestSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        throw new BadRequestError(
          parsed.error.errors[0]?.message ?? 'Invalid optimization planner request payload.',
        );
      }

      const data = await this.service.getOptimizedPlan(req.user!.id, parsed.data);
      res.json(successResponse(data, 'Optimized farming and progression plan generated.'));
    } catch (err) {
      next(err);
    }
  };
}
