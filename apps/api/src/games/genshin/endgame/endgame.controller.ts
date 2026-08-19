import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { UnprocessableError } from '@/core/errors/app-error.js';
import { successResponse } from '@/core/utils/response.js';

import { EndgameService } from './endgame.service.js';

// -------------------------------------------------------
// Zod schemas
// -------------------------------------------------------

const LogAbyssRunSchema = z.object({
  cycleId: z.string().min(1, 'cycleId is required'),
  floor: z.number().int().min(9).max(12),
  chamber: z.number().int().min(1).max(3),
  half: z.union([z.literal(1), z.literal(2)]),
  stars: z.number().int().min(0).max(3),
  team: z.array(z.string().min(1)).max(4).default([]),
});

// -------------------------------------------------------
// Controller
// -------------------------------------------------------

export class EndgameController {
  private readonly service: EndgameService;

  constructor() {
    this.service = new EndgameService();
  }

  /**
   * GET /api/v1/games/genshin/endgame/abyss
   *
   * Returns the full Abyss run history for the authenticated user,
   * grouped by cycle → floor → chamber.
   *
   * Optional query param: ?cycleId=5.0-1  → returns only that cycle.
   */
  getAbyssHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { cycleId } = req.query as { cycleId?: string };

      if (cycleId) {
        const data = await this.service.getAbyssCycle(req.user!.id, cycleId);
        res.json(
          successResponse(
            data,
            data ? `Cycle ${cycleId} retrieved.` : `No runs logged for cycle ${cycleId}.`,
          ),
        );
        return;
      }

      const data = await this.service.getAbyssHistory(req.user!.id);
      res.json(successResponse(data, 'Abyss history retrieved successfully.'));
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/games/genshin/endgame/abyss
   *
   * Logs (or updates) a single chamber-half run.
   * Body: { cycleId, floor, chamber, half, stars, team[] }
   */
  logAbyssRun = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = LogAbyssRunSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new UnprocessableError(parsed.error.errors.map((e) => e.message).join('; '));
      }

      const data = await this.service.logAbyssRun(req.user!.id, parsed.data);
      res.status(201).json(successResponse(data, 'Abyss run logged successfully.'));
    } catch (err) {
      next(err);
    }
  };
}
