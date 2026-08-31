import type { Request, Response, NextFunction } from 'express';
import { nikkeAccountService } from './account.service.js';
import { successResponse } from '@/core/utils/response.js';

export class NikkeAccountController {
  async getMyAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const account = await nikkeAccountService.getAccountByUserId(req.user!.id);
      res.json(successResponse(account, 'Success'));
    } catch (error) {
      next(error);
    }
  }

  async createMyAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { commanderName, commanderLevel } = req.body;
      const account = await nikkeAccountService.createAccount(
        req.user!.id,
        commanderName,
        commanderLevel,
      );
      res.status(201).json(successResponse(account, 'Account created'));
    } catch (error) {
      next(error);
    }
  }
}

export const nikkeAccountController = new NikkeAccountController();
