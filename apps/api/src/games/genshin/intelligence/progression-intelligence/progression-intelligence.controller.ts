import { Request, Response } from 'express';

import { NotFoundError } from '@/core/errors/app-error.js';

import { progressionIntelligenceService } from './progression-intelligence.service.js';

export const progressionIntelligenceController = {
  async getProgressionAnalysis(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const result = await progressionIntelligenceService.analyzeProgression(userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (err: unknown) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ success: false, error: err.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
      }
    }
  },
};
