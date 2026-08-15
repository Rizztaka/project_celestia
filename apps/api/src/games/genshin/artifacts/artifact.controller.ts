import type { Request, Response } from 'express';
import { successResponse } from '@/core/utils/response.js';
import { GenshinArtifactService } from './artifact.service.js';

export class GenshinArtifactController {
  private artifactService: GenshinArtifactService;

  constructor() {
    this.artifactService = new GenshinArtifactService();
  }

  /**
   * GET /api/v1/games/genshin/artifacts
   *
   * Returns the authenticated user's full artifact inventory.
   * Artifacts are ordered by level descending, then rarity descending.
   *
   * Returns 200 with an empty array when the user has no Genshin account
   * yet — this is a valid state, not an error.
   *
   * Protected by requireAuth — req.user!.id is guaranteed to be set.
   * No try/catch: Express 5 propagates rejected async promises to the
   * global error handler in app.ts automatically.
   */
  listArtifacts = async (req: Request, res: Response) => {
    const artifacts = await this.artifactService.getArtifactsForUser(req.user!.id);
    res
      .status(200)
      .json(
        successResponse(
          { artifacts, total: artifacts.length },
          'Artifacts retrieved successfully.',
        ),
      );
  };
}
