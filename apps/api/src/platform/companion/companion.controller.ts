import type { Request, Response } from 'express';

import { successResponse } from '@/core/utils/response.js';

import { DailyCompanionService } from './companion.service.js';

export class DailyCompanionController {
  private readonly companionService: DailyCompanionService;

  constructor() {
    this.companionService = new DailyCompanionService();
  }

  /**
   * GET /api/v1/companion/daily
   *
   * Returns the authenticated user's daily companion state.
   * Creates the record with safe defaults if this is the user's first visit.
   * Applies a lazy daily reset if the Asia server reset boundary (20:00 UTC)
   * has passed since the last reset.
   *
   * Protected by requireAuth — req.user!.id is guaranteed to be set.
   * Express 5 propagates rejected async promises to the global error handler.
   */
  getDaily = async (req: Request, res: Response) => {
    const state = await this.companionService.getDailyState(req.user!.id);
    res.status(200).json(successResponse(state, 'Daily state retrieved successfully.'));
  };

  /**
   * PATCH /api/v1/companion/resin
   *
   * Updates the resin checkpoint for the authenticated user.
   * Body: { amount: number } — must be an integer in [0, 200].
   */
  updateResin = async (req: Request, res: Response) => {
    const state = await this.companionService.updateResin(req.user!.id, req.body?.amount);
    res.status(200).json(successResponse(state, 'Resin updated successfully.'));
  };

  /**
   * PATCH /api/v1/companion/checklist
   *
   * Updates one or more daily checklist flags for the authenticated user.
   * Body: Partial<{ commissionsDone, teapotClaimed, transformerClaimed }>
   * At least one field must be present.
   */
  updateChecklist = async (req: Request, res: Response) => {
    const state = await this.companionService.updateChecklist(req.user!.id, req.body);
    res.status(200).json(successResponse(state, 'Checklist updated successfully.'));
  };
}
