import type { Request, Response } from 'express';
import { successResponse } from '@/core/utils/response.js';
import { CharacterIntelligenceService } from './character-intelligence.service.js';

export class CharacterIntelligenceController {
  private readonly service: CharacterIntelligenceService;

  constructor() {
    this.service = new CharacterIntelligenceService();
  }

  /**
   * GET /api/v1/games/genshin/intelligence/characters
   *
   * Returns the top 5 highest-ROI character build recommendations for the
   * authenticated user, along with plain-language explanations for each.
   *
   * Protected by requireAuth — req.user!.id is guaranteed to be set.
   * No try/catch: Express 5 propagates rejected async promises to the
   * global error handler in app.ts automatically.
   */
  getRecommendations = async (req: Request, res: Response): Promise<void> => {
    const data = await this.service.getRecommendations(req.user!.id);
    res
      .status(200)
      .json(successResponse(data, 'Character intelligence recommendations retrieved.'));
  };
}
