import { planQuerySchema } from '@celestia/api-contracts';
import type { Request, Response } from 'express';

import { BadRequestError } from '@/core/errors/app-error.js';
import { successResponse } from '@/core/utils/response.js';

import { companionRegistry } from './companion-registry.service.js';
import { PlanService } from './plan.service.js';

const service = () => new PlanService(companionRegistry.getProvider('genshin'));
export class PlanController {
  getSnapshot = async (req: Request, res: Response) => {
    if (!planQuerySchema.safeParse(req.query).success)
      throw new BadRequestError('contractVersion=1 is required.');
    res.json(successResponse(await service().getSnapshot(req.user!.id), 'Plan fetched.'));
  };
  getAdvice = async (req: Request, res: Response) => {
    if (!planQuerySchema.safeParse(req.query).success)
      throw new BadRequestError('contractVersion=1 is required.');
    res.json(successResponse(await service().getAdvice(req.user!.id), 'Plan advice fetched.'));
  };
  update = async (req: Request, res: Response) => {
    res.json(
      successResponse(await service().update(req.user!.id, req.body), 'Plan choices saved.'),
    );
  };
}
