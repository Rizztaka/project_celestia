import { showcaseUidSchema } from '@celestia/api-contracts';
import type { Request, Response } from 'express';

import { ShowcaseService } from './showcase.service.js';

export class ShowcaseController {
  constructor(private readonly service: ShowcaseService) {}
  lookup = async (req: Request, res: Response) => {
    const uid = showcaseUidSchema.parse(req.params.uid);
    const result = await this.service.lookup(uid);
    res.set('Cache-Control', 'no-store');
    if (result.issue?.status === 429) {
      res.set(
        'Retry-After',
        String(Math.max(1, Math.ceil((Date.parse(result.nextRefreshAt) - Date.now()) / 1000))),
      );
    }
    // A stale snapshot remains a usable response; absence of a snapshot carries the failure status.
    res.status(result.snapshot ? 200 : (result.issue?.status ?? 200)).json(result);
  };
}
