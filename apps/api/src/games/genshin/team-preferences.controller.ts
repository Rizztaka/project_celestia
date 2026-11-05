import type { Request, Response } from 'express';

import { successResponse } from '@/core/utils/response.js';

import { GenshinTeamPreferencesService } from './team-preferences.service.js';

export class GenshinTeamPreferencesController {
  private readonly service = new GenshinTeamPreferencesService();

  read = async (req: Request, res: Response) => {
    res.json(
      successResponse(await this.service.read(req.user!.id, req.query), 'Preferences retrieved.'),
    );
  };

  write = async (req: Request, res: Response) => {
    res.json(
      successResponse(await this.service.write(req.user!.id, req.body), 'Preferences saved.'),
    );
  };
}
