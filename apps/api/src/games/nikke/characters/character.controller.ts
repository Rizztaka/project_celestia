import type { NextFunction, Request, Response } from 'express';

import { successResponse } from '@/core/utils/response.js';

import { nikkeCharacterService } from './character.service.js';

export class NikkeCharacterController {
  async getMyRoster(req: Request, res: Response, next: NextFunction) {
    try {
      const roster = await nikkeCharacterService.getCharactersForUser(req.user!.id);
      res.json(successResponse(roster, 'Success'));
    } catch (error) {
      next(error);
    }
  }

  async addNikke(req: Request, res: Response, next: NextFunction) {
    try {
      const { characterKey, level, limitBreak, coreEnhance } = req.body;
      const character = await nikkeCharacterService.addCharacter(
        req.user!.id,
        characterKey,
        level,
        limitBreak,
        coreEnhance,
      );
      res.status(201).json(successResponse(character, 'Character added'));
    } catch (error) {
      next(error);
    }
  }
}

export const nikkeCharacterController = new NikkeCharacterController();
