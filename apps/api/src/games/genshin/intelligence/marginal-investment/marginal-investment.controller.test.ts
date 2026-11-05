import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { MarginalInvestmentController } from './marginal-investment.controller.js';

describe('Marginal Investment Controller', () => {
  it('validates input and returns 200 with structured marginal investment response', async () => {
    const controller = new MarginalInvestmentController();

    const req = {
      body: {
        character: {
          characterKey: 'Xiangling',
          level: 80,
          ascension: 5,
          talents: { normal: 1, skill: 6, burst: 6 },
          weapon: { weaponKey: 'TheCatch', level: 90 },
          artifacts: {
            flower: { slot: 'flower', setKey: 'EmblemOfSeveredFate', mainStatKey: 'hp' },
            plume: { slot: 'plume', setKey: 'EmblemOfSeveredFate', mainStatKey: 'atk' },
            sands: { slot: 'sands', setKey: 'EmblemOfSeveredFate', mainStatKey: 'energyRecharge' },
            goblet: { slot: 'goblet', setKey: 'EmblemOfSeveredFate', mainStatKey: 'pyroDmg' },
            circlet: { slot: 'circlet', setKey: 'EmblemOfSeveredFate', mainStatKey: 'critRate' },
          },
          stats: { energyRecharge: 220, atk: 1400 },
        },
        roleProfile: 'off_field_damage',
      },
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    await controller.evaluate(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          currentReadiness: expect.any(Object),
          rankedUpgrades: expect.any(Array),
          recommendedNextAction: expect.any(Object),
          explanations: expect.any(Array),
        }),
      }),
    );
  });
});
