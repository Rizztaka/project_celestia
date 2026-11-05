import {
  characterReadinessRequestSchema,
  characterReadinessResponseSchema,
} from '@celestia/api-contracts';
import type { Request, Response } from 'express';

import { successResponse } from '@/core/utils/response.js';

import { ReadinessIntelligenceService } from './readiness-intelligence.service.js';

export class ReadinessIntelligenceController {
  private readonly service: ReadinessIntelligenceService;

  constructor(service = new ReadinessIntelligenceService()) {
    this.service = service;
  }

  /**
   * POST /api/v1/games/genshin/intelligence/readiness
   *
   * Evaluates a character's contextual readiness against a target encounter, role benchmark,
   * and rotation energy requirements. Adheres strictly to ADR-0011.
   *
   * @access Public
   */
  evaluate = async (req: Request, res: Response): Promise<void> => {
    const input = characterReadinessRequestSchema.parse(req.body);
    const result = this.service.evaluateReadiness(input);
    const response = characterReadinessResponseSchema.parse(result);

    res.status(200).json(successResponse(response, 'Character readiness evaluated.'));
  };
}
