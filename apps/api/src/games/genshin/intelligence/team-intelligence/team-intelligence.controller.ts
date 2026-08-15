import type { Request, Response } from 'express';
import { successResponse } from '@/core/utils/response.js';
import { TeamIntelligenceService } from './team-intelligence.service.js';

export class TeamIntelligenceController {
  private readonly service: TeamIntelligenceService;

  constructor() {
    this.service = new TeamIntelligenceService();
  }

  /**
   * GET /api/v1/games/genshin/intelligence/teams
   *
   * Returns the top 3 most buildable, meta-relevant team compositions for the
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
      .json(successResponse(data, 'Team intelligence recommendations retrieved.'));
  };
}
