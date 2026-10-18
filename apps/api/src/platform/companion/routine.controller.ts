/**
 * routine.controller.ts — HTTP controller for the C2a routine companion.
 *
 * GET requires contractVersion=2 in the query; PATCH requires it in the body.
 * Old endpoints (V1) return 409 COMPANION_CLIENT_UPDATE_REQUIRED.
 *
 * Routes:
 *   GET  /companion/routine?contractVersion=2        → V2 snapshot (read-only)
 *   PATCH /companion/routine/settings               → server selection
 *   PATCH /companion/routine/checklist              → daily flags + transformer
 *   PATCH /companion/routine/resin                  → resin checkpoint
 *   PATCH /companion/routine/weekly-claims          → weekly reward count
 *
 * V1 compatibility:
 *   GET  /companion/daily                           → 409 (client must update)
 *   GET  /companion/weekly-bosses                   → 409 (client must update)
 *   PATCH /companion/resin                          → 409 (client must update)
 *   PATCH /companion/checklist                      → 409 (client must update)
 *   PATCH /companion/weekly-bosses/:bossKey         → 409 (client must update)
 */

import { COMPANION_ERROR_CODES, contractV2QuerySchema } from '@celestia/api-contracts';
import type { Request, Response } from 'express';

import { errorResponse, successResponse } from '@/core/utils/response.js';

import { companionRegistry } from './companion-registry.service.js';
import { RoutineRepository } from './routine.repository.js';
import { RoutineService } from './routine.service.js';

// ============================================================
// Service factory (singleton within request lifecycle)
// ============================================================

let _routineService: RoutineService | null = null;

function getRoutineService(): RoutineService {
  if (!_routineService) {
    const provider = companionRegistry.getProvider('genshin');
    _routineService = new RoutineService(new RoutineRepository(), provider);
  }
  return _routineService;
}

// ============================================================
// V2 handlers
// ============================================================

export class RoutineController {
  /**
   * GET /companion/routine?contractVersion=2
   * Read-only snapshot. Never writes. Returns defaults when no row exists.
   */
  getSnapshot = async (req: Request, res: Response) => {
    const query = contractV2QuerySchema.safeParse(req.query);
    if (!query.success) {
      return res.status(400).json(errorResponse('BAD_REQUEST', 'contractVersion=2 is required.'));
    }

    const data = await getRoutineService().getSnapshot(req.user!.id);
    return res.status(200).json(successResponse(data, 'Routine snapshot fetched.'));
  };

  /**
   * PATCH /companion/routine/settings
   * Updates server selection only. No period ID required.
   */
  patchSettings = async (req: Request, res: Response) => {
    const data = await getRoutineService().patchSettings(req.user!.id, req.body);
    return res.status(200).json(successResponse(data, 'Server selection updated.'));
  };

  /**
   * PATCH /companion/routine/checklist
   * Updates daily checklist flags or Transformer state.
   */
  patchChecklist = async (req: Request, res: Response) => {
    const data = await getRoutineService().patchChecklist(req.user!.id, req.body);
    return res.status(200).json(successResponse(data, 'Checklist updated.'));
  };

  /**
   * PATCH /companion/routine/resin
   * Records a new resin checkpoint.
   */
  patchResin = async (req: Request, res: Response) => {
    const data = await getRoutineService().patchResin(req.user!.id, req.body);
    return res.status(200).json(successResponse(data, 'Resin checkpoint saved.'));
  };

  /**
   * PATCH /companion/routine/weekly-claims
   * Updates the user's weekly reward claim count.
   */
  patchWeeklyClaims = async (req: Request, res: Response) => {
    const data = await getRoutineService().patchWeeklyClaims(req.user!.id, req.body);
    return res.status(200).json(successResponse(data, 'Weekly claims updated.'));
  };
}

// ============================================================
// V1 compatibility handlers — returns 409 with error code
// ============================================================

const V1_UPDATE_REQUIRED = errorResponse(
  COMPANION_ERROR_CODES.CLIENT_UPDATE_REQUIRED,
  'This endpoint has been replaced by GET /companion/routine?contractVersion=2. ' +
    'Please update your client to use the new V2 companion API.',
);

export function v1GetDailyCompat(_req: Request, res: Response): void {
  res.status(409).json(V1_UPDATE_REQUIRED);
}

export function v1GetWeeklyBossesCompat(_req: Request, res: Response): void {
  res.status(409).json(V1_UPDATE_REQUIRED);
}

export function v1PatchResinCompat(_req: Request, res: Response): void {
  res.status(409).json(V1_UPDATE_REQUIRED);
}

export function v1PatchChecklistCompat(_req: Request, res: Response): void {
  res.status(409).json(V1_UPDATE_REQUIRED);
}

export function v1PatchWeeklyBossCompat(_req: Request, res: Response): void {
  res.status(409).json(V1_UPDATE_REQUIRED);
}
