import type { Request, Response } from 'express';

import { successResponse } from '@/core/utils/response.js';

import { hoyolabConnectSchema, hoyolabSelectSchema } from './hoyolab.schema.js';
import { HoyolabService } from './hoyolab.service.js';
export class HoyolabController {
  constructor(private readonly service = new HoyolabService()) {}
  status = async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json(
      successResponse(await this.service.status(req.user!.id), 'HoYoLAB connection updated.'),
    );
  };
  connect = async (req: Request, res: Response) => {
    const input = hoyolabConnectSchema.parse(req.body);
    res.setHeader('Cache-Control', 'no-store');
    res.json(
      successResponse(
        await this.service.connect(req.user!.id, input.cookies),
        'HoYoLAB connected.',
      ),
    );
  };
  select = async (req: Request, res: Response) => {
    res.json(
      successResponse(
        await this.service.select(req.user!.id, hoyolabSelectSchema.parse(req.body)),
        'Account selected.',
      ),
    );
  };
  sync = async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json(successResponse(await this.service.sync(req.user!.id), 'HoYoLAB connection updated.'));
  };
  disconnect = async (req: Request, res: Response) => {
    res.json(
      successResponse(await this.service.disconnect(req.user!.id), 'HoYoLAB connection updated.'),
    );
  };
}
