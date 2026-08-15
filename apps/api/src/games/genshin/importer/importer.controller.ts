import type { Request, Response } from 'express';
import { successResponse } from '@/core/utils/response.js';
import { GenshinImportService } from './importer.service.js';

export class GenshinImportController {
  private importService: GenshinImportService;

  constructor() {
    this.importService = new GenshinImportService();
  }

  /**
   * POST /api/v1/games/genshin/import
   *
   * Accepts a GOOD-format JSON object from the request body.
   * Re-serializes to a string and delegates to the import service,
   * which performs its own Zod validation — keeping the service
   * self-contained and callable from any context (HTTP, tests, CLI).
   *
   * Protected by requireAuth — req.user!.id is guaranteed to be set.
   * No try/catch: Express 5 propagates rejected async promises to the
   * global error handler in app.ts automatically.
   */
  importGenshinAccount = async (req: Request, res: Response) => {
    // req.body is already parsed by express.json() middleware.
    // JSON.stringify re-serializes it so the service receives a raw
    // JSON string, which it parses and validates internally.
    const rawJson = JSON.stringify(req.body);
    const result = await this.importService.importAccount(req.user!.id, rawJson);
    res.status(200).json(successResponse(result, 'Account imported successfully.'));
  };
}
