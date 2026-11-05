import {
  marginalInvestmentRequestSchema,
  marginalInvestmentResponseSchema,
} from '@celestia/api-contracts';
import type { Request, Response } from 'express';

import { successResponse } from '@/core/utils/response.js';

import { MarginalInvestmentService } from './marginal-investment.service.js';

export class MarginalInvestmentController {
  private readonly service: MarginalInvestmentService;

  constructor(service = new MarginalInvestmentService()) {
    this.service = service;
  }

  /**
   * POST /api/v1/games/genshin/intelligence/marginal-investment
   *
   * Recommends the highest-yield next investment action based on readiness score delta,
   * gap closure, and deterministic progression costs.
   *
   * @access Public
   */
  evaluate = async (req: Request, res: Response): Promise<void> => {
    const input = marginalInvestmentRequestSchema.parse(req.body);
    const result = this.service.evaluate(input);
    const response = marginalInvestmentResponseSchema.parse(result);

    res
      .status(200)
      .json(successResponse(response, 'Marginal investment recommendations evaluated.'));
  };
}
