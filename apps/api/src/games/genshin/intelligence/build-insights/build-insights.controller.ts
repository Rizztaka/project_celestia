import type { Request, Response } from 'express';

import { successResponse } from '@/core/utils/response.js';

import {
  buildInsightQuerySchema,
  buildInsightsResponseSchema,
  characterKeySchema,
} from './build-insights.schema.js';
import { BuildInsightsService } from './build-insights.service.js';

export function buildInsightsHandler(service = new BuildInsightsService()) {
  return async (req: Request, res: Response) => {
    const key = characterKeySchema.parse(req.params.characterKey);
    const query = buildInsightQuerySchema.parse(req.query);
    res.json(
      successResponse(
        buildInsightsResponseSchema.parse(await service.read(req.user!.id, key, query)),
        'Build insights evaluated.',
      ),
    );
  };
}
