import { Request, Response } from 'express';
import { pullSimulatorService } from './pull-simulator.service.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const activeBannersData = require('../static/active-banners.json');

export const pullSimulatorController = {
  getBanners(req: Request, res: Response) {
    res.json({
      success: true,
      data: activeBannersData.banners,
    });
  },

  simulatePulls(req: Request, res: Response) {
    try {
      const { bannerId, count, currentPity5, currentPity4, guaranteed5, guaranteed4 } = req.body;

      if (!bannerId) {
        return res.status(400).json({ success: false, error: 'bannerId is required' });
      }

      const parsedCount = parseInt(count) || 1;

      const request = {
        bannerId: String(bannerId),
        count: parsedCount,
        currentPity5: parseInt(currentPity5) || 0,
        currentPity4: parseInt(currentPity4) || 0,
        guaranteed5: guaranteed5 === true || guaranteed5 === 'true',
        guaranteed4: guaranteed4 === true || guaranteed4 === 'true',
      };

      const result = pullSimulatorService.simulatePulls(request);

      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Unknown error occurred in simulation',
      });
    }
  },
};
