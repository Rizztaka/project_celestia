import {
  pullBudgetInputSchema,
  pullCompareRequestSchema,
  pullUserWeightsSchema,
  showcaseUidSchema,
} from '@celestia/api-contracts';
import type { NextFunction, Request, Response } from 'express';

import { successResponse } from '@/core/utils/response.js';

import { PullIntelligenceService } from './pull-intelligence.service.js';

export class PullIntelligenceController {
  private readonly service: PullIntelligenceService;

  constructor(service = new PullIntelligenceService()) {
    this.service = service;
  }

  getRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let weights;
      if (req.query.weights) {
        try {
          weights = pullUserWeightsSchema.parse(JSON.parse(req.query.weights as string));
        } catch {
          // fallback to undefined
        }
      }

      let budget;
      if (req.query.budget) {
        try {
          budget = pullBudgetInputSchema.parse(JSON.parse(req.query.budget as string));
        } catch {
          // fallback to undefined
        }
      }

      const data = await this.service.getRecommendations(req.user!.id, { weights, budget });
      res.json(successResponse(data, 'Account-value pull recommendations retrieved successfully.'));
    } catch (err) {
      next(err);
    }
  };

  getPublicShowcaseRecommendations = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const uid = showcaseUidSchema.parse(req.params.uid);
      const data = await this.service.getPublicShowcaseRecommendations(uid);
      res.json(successResponse(data, 'Showcase pull recommendations retrieved successfully.'));
    } catch (err) {
      next(err);
    }
  };

  compareHypothetical = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = pullCompareRequestSchema.parse(req.body);
      const userIdOrUid = req.user?.id || (req.query.uid as string) || '';
      const isPublic = !req.user?.id;
      const data = await this.service.compareCustomHypothetical(userIdOrUid, input, isPublic);
      res.json(successResponse(data, 'Hypothetical comparison calculated successfully.'));
    } catch (err) {
      next(err);
    }
  };
}
