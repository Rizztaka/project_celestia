import type { Request, Response } from 'express';

import { successResponse } from '@/core/utils/response.js';

import { GenshinImportService } from './importer.service.js';

export class GenshinImportController {
  private readonly importService = new GenshinImportService();

  getImportStatus = async (req: Request, res: Response) => {
    res
      .status(200)
      .json(
        successResponse(await this.importService.status(req.user!.id), 'Import status retrieved.'),
      );
  };

  // Authenticated owner comes exclusively from the verified access token.
  importGenshinAccount = async (req: Request, res: Response) => {
    const result = await this.importService.importAccount(req.user!.id, req.body);
    res.status(200).json(successResponse(result, 'Account imported successfully.'));
  };

  previewGenshinImport = async (req: Request, res: Response) => {
    const result = await this.importService.preview(req.user!.id, req.body);
    res.status(200).json(successResponse(result, 'Import preview ready.'));
  };
}
