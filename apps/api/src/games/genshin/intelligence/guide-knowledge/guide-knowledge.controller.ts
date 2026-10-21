import type { Request, Response } from 'express';

import { BadRequestError } from '@/core/errors/app-error.js';
import { successResponse } from '@/core/utils/response.js';

import { ContextualAdviceService } from './contextual.service.js';
import { GuideKnowledgeService } from './guide-knowledge.service.js';

export class GuideKnowledgeController {
  private readonly contextual = new ContextualAdviceService();
  release = (req: Request, res: Response) => {
    if (Object.keys(req.query).length)
      throw new BadRequestError('Release metadata accepts no query fields.');
    res.setHeader('Cache-Control', 'no-store');
    res.json(
      successResponse(
        this.contextual.metadata(),
        'Loaded contextual release. API restart required after local activation.',
      ),
    );
  };
  readV3 = async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json(
      successResponse(
        await this.contextual.readV3(req.user!.id, req.params.characterKey, req.query),
        'Contextual guidance v3 retrieved.',
      ),
    );
  };
  readV2 = async (req: Request, res: Response) => {
    res.json(
      successResponse(
        await this.contextual.read(req.user!.id, req.params.characterKey, req.query),
        'Contextual guidance v2 retrieved.',
      ),
    );
  };
  constructor(private readonly service = new GuideKnowledgeService()) {}
  read = async (req: Request, res: Response) => {
    res.json(
      successResponse(
        await this.service.read(req.user!.id, req.params.characterKey, req.query),
        'Contextual guidance retrieved.',
      ),
    );
  };
}
