import type { Request, Response } from 'express';

import { successResponse } from '@/core/utils/response.js';

import { ArtifactIntelligenceService } from './artifact-intelligence.service.js';

export class ArtifactIntelligenceController {
  private readonly service: ArtifactIntelligenceService;

  constructor() {
    this.service = new ArtifactIntelligenceService();
  }

  getRecommendations = async (req: Request, res: Response) => {
    const userId = req.user!.id; // Guaranteed by requireAuth middleware
    const result = await this.service.getRecommendations(userId);
    res
      .status(200)
      .json(successResponse(result, 'Artifact recommendations generated successfully'));
  };
}
