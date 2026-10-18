import type { Request, Response } from 'express';

import { successResponse } from '@/core/utils/response.js';

import { GenshinCharacterService } from './character.service.js';
import { GenshinCharacterEquipmentService } from './character-equipment.service.js';
import { GenshinCharacterFocusService } from './character-focus.service.js';

export class GenshinCharacterController {
  private focusService = new GenshinCharacterFocusService();
  listFocus = async (req: Request, res: Response) => {
    res.json(successResponse(await this.focusService.list(req.user!.id), 'Focus retrieved.'));
  };
  setFocus = async (req: Request, res: Response) => {
    res.json(
      successResponse(
        await this.focusService.set(req.user!.id, req.params.characterKey, req.body),
        'Focus saved.',
      ),
    );
  };
  private equipmentService = new GenshinCharacterEquipmentService();
  getEquipment = async (req: Request, res: Response) => {
    const equipment = await this.equipmentService.read(req.user!.id, req.params.characterKey);
    res.status(200).json(successResponse(equipment, 'Recorded equipment retrieved.'));
  };
  private characterService: GenshinCharacterService;

  constructor() {
    this.characterService = new GenshinCharacterService();
  }

  /**
   * GET /api/v1/games/genshin/characters
   *
   * Returns the authenticated user's full character roster, each record
   * including its equipped weapon (or null).
   *
   * Returns 200 with an empty array when the user has no Genshin account
   * yet — this is a valid state, not an error.
   *
   * Protected by requireAuth — req.user!.id is guaranteed to be set.
   * No try/catch: Express 5 propagates rejected async promises to the
   * global error handler in app.ts automatically.
   */
  listCharacters = async (req: Request, res: Response) => {
    const characters = await this.characterService.getCharactersForUser(req.user!.id);
    res
      .status(200)
      .json(
        successResponse(
          { characters, total: characters.length },
          'Characters retrieved successfully.',
        ),
      );
  };
}
