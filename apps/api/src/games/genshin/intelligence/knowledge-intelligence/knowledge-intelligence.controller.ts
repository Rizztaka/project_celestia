import type { NextFunction, Request, Response } from 'express';

import { successResponse } from '@/core/utils/response.js';

import { KnowledgeIntelligenceService } from './knowledge-intelligence.service.js';

export class KnowledgeIntelligenceController {
  private readonly service: KnowledgeIntelligenceService;

  constructor() {
    this.service = new KnowledgeIntelligenceService();
  }

  getInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.getInsights(req.user!.id);
      res.json(successResponse(data, 'Account insights retrieved successfully.'));
    } catch (err) {
      next(err);
    }
  };
}
