import type { Request, Response } from 'express';

import { successResponse } from '@/core/utils/response.js';

import {
  accountDataQuerySchema,
  deleteRequestSchema,
  exportRequestSchema,
} from './account-data.schema.js';
import type { AccountDataService } from './account-data.service.js';

export class AccountDataController {
  constructor(private readonly service: AccountDataService) {}
  export = async (req: Request, res: Response) => {
    accountDataQuerySchema.parse(req.query);
    const body = exportRequestSchema.parse(req.body);
    const result = await this.service.export(req.user!.id, body.password);
    if (!res.destroyed)
      res
        .status(200)
        .set('Content-Disposition', 'attachment; filename="celestia-account-v1.json"')
        .type('application/json')
        .send(result);
  };
  delete = async (req: Request, res: Response) => {
    accountDataQuerySchema.parse(req.query);
    const body = deleteRequestSchema.parse(req.body);
    const result = await this.service.delete(req.user!.id, body.password);
    if (!res.destroyed) res.status(200).json(successResponse(result, 'Celestia account deleted.'));
  };
}
