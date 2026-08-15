import type { Request, Response } from 'express';

import { successResponse } from '@/core/utils/response.js';

import { WeeklyBossService } from './weekly-boss.service.js';

export class WeeklyBossController {
  private readonly weeklyBossService: WeeklyBossService;

  constructor() {
    this.weeklyBossService = new WeeklyBossService();
  }

  /**
   * GET /api/v1/companion/weekly-bosses
   * Returns all weekly bosses merged with the user's defeat state for this week.
   * Applies the lazy weekly reset if the boundary has passed.
   */
  getWeeklyBosses = async (req: Request, res: Response) => {
    const data = await this.weeklyBossService.getWeeklyBosses(req.user!.id);
    res.status(200).json(successResponse(data, 'Weekly bosses fetched.'));
  };

  /**
   * PATCH /api/v1/companion/weekly-bosses/:bossKey
   * Toggles the defeated state of a single weekly boss.
   */
  patchBoss = async (req: Request, res: Response) => {
    const { bossKey } = req.params as { bossKey: string };
    const result = await this.weeklyBossService.patchBoss(req.user!.id, bossKey, req.body);
    res.status(200).json(successResponse(result, 'Boss state updated.'));
  };
}
