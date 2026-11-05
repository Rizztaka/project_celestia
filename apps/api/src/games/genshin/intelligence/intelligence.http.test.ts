import supertest from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'synthetic-intelligence-test-secret-min-32-chars!!',
    JWT_EXPIRY: '1h',
  },
}));

vi.mock('@/core/db/prisma.js', () => ({
  prisma: {},
}));

import { createApp } from '@/app.js';

describe('Genshin Intelligence HTTP Routes Integration', () => {
  const app = createApp();
  const api = supertest(app);

  const validReadinessPayload = {
    character: {
      characterKey: 'HuTao',
      level: 80,
      ascension: 5,
      constellation: 0,
      talents: {
        normal: 8,
        skill: 8,
        burst: 6,
      },
      weapon: {
        weaponKey: 'StaffOfHoma',
        level: 80,
        refinement: 1,
        weaponType: 'Polearm',
      },
      artifacts: {
        flower: {
          slot: 'flower',
          setKey: 'CrimsonWitchOfFlames',
          mainStatKey: 'hp',
          level: 20,
        },
        plume: {
          slot: 'plume',
          setKey: 'CrimsonWitchOfFlames',
          mainStatKey: 'atk',
          level: 20,
        },
        sands: {
          slot: 'sands',
          setKey: 'CrimsonWitchOfFlames',
          mainStatKey: 'hpPercent',
          level: 20,
        },
        goblet: {
          slot: 'goblet',
          setKey: 'CrimsonWitchOfFlames',
          mainStatKey: 'pyroDmg',
          level: 20,
        },
        circlet: {
          slot: 'circlet',
          setKey: 'CrimsonWitchOfFlames',
          mainStatKey: 'critDmg',
          level: 20,
        },
      },
      stats: {
        hp: 31000,
        energyRecharge: 110,
        critRate: 65,
        critDmg: 210,
      },
    },
    roleProfile: 'on_field_damage',
  };

  const validMarginalPayload = {
    ...validReadinessPayload,
  };

  describe('POST /api/v1/games/genshin/intelligence/readiness', () => {
    it('returns HTTP 200 with structured readiness calculation without authentication', async () => {
      const response = await api
        .post('/api/v1/games/genshin/intelligence/readiness')
        .send(validReadinessPayload);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: expect.any(String),
          score: expect.any(Number),
          dimensions: expect.objectContaining({
            talents: expect.any(Object),
            weapon: expect.any(Object),
            main_stats: expect.any(Object),
            set_activation: expect.any(Object),
            rotation_energy: expect.any(Object),
            support_output: expect.any(Object),
          }),
          explanations: expect.any(Array),
        },
      });
    });

    it('returns HTTP 400 with structured validation error on malformed payload', async () => {
      const response = await api.post('/api/v1/games/genshin/intelligence/readiness').send({
        character: {
          characterKey: '',
          level: 150, // invalid level > 90
        },
      });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
        },
      });
    });

    it('returns HTTP 400 when character payload is completely missing', async () => {
      const response = await api.post('/api/v1/games/genshin/intelligence/readiness').send({});

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
        },
      });
    });
  });

  describe('POST /api/v1/games/genshin/intelligence/marginal-investment', () => {
    it('returns HTTP 200 with ranked upgrades and recommendations without authentication', async () => {
      const response = await api
        .post('/api/v1/games/genshin/intelligence/marginal-investment')
        .send(validMarginalPayload);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          currentReadiness: expect.any(Object),
          rankedUpgrades: expect.any(Array),
          recommendedNextAction: expect.any(Object),
          explanations: expect.any(Array),
        },
      });
      expect(response.body.data.rankedUpgrades.length).toBeGreaterThan(0);
    });

    it('returns HTTP 400 with validation errors on malformed input', async () => {
      const response = await api
        .post('/api/v1/games/genshin/intelligence/marginal-investment')
        .send({
          character: {
            characterKey: 'HuTao',
            level: -1, // invalid level < 1
          },
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
        },
      });
    });
  });
});
