import {
  abyssJointRequestSchema,
  onslaughtJointRequestSchema,
  theaterActPlanRequestSchema,
} from '@celestia/api-contracts';
import type { NextFunction, Request, Response } from 'express';

import { successResponse } from '@/core/utils/response.js';

import { EndgameIntelligenceService } from './endgame-intelligence.service.js';

export class EndgameIntelligenceController {
  private readonly service: EndgameIntelligenceService;

  constructor(service = new EndgameIntelligenceService()) {
    this.service = service;
  }

  /**
   * POST /api/v1/games/genshin/intelligence/endgame/abyss-joint
   *
   * Solves joint dual-chamber Abyss team assignment with character and gear exclusivity.
   */
  solveAbyssJoint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = abyssJointRequestSchema.parse(req.body);
      const result = this.service.evaluateAbyssJoint(input);
      res.status(200).json(successResponse(result, 'Spiral Abyss joint recommendation generated.'));
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/games/genshin/intelligence/endgame/onslaught-joint
   *
   * Solves 3-boss consecutive Onslaught allocation with 12-character exclusivity.
   */
  solveOnslaughtJoint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = onslaughtJointRequestSchema.parse(req.body);
      const result = this.service.evaluateOnslaughtJoint(input);
      res
        .status(200)
        .json(successResponse(result, 'Stygian Onslaught joint recommendation generated.'));
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/games/genshin/intelligence/endgame/theater-plan
   *
   * Solves dynamic Imaginarium Theater act scheduling and vigor preservation.
   */
  solveTheaterActPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = theaterActPlanRequestSchema.parse(req.body);
      const result = this.service.evaluateTheaterActPlan(input);
      res.status(200).json(successResponse(result, 'Imaginarium Theater act plan generated.'));
    } catch (err) {
      next(err);
    }
  };
}
