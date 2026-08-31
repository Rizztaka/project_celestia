/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@/core/db/prisma.js';
import { NotFoundError, UnprocessableError } from '@/core/errors/app-error.js';

import {
  type ArtifactInput,
  type ArtifactWeightProfile,
  calculateArtifactScore,
  calculateSlotScore,
} from './artifact-intelligence.calculator.js';
import { ArtifactIntelligenceService } from './artifact-intelligence.service.js';

// Mock Prisma
vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    genshinAccount: {
      findUnique: vi.fn(),
    },
    genshinCharacter: {
      findMany: vi.fn(),
    },
  },
}));

describe('ArtifactIntelligenceService', () => {
  let service: ArtifactIntelligenceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ArtifactIntelligenceService();
  });

  describe('Service Logic', () => {
    it('throws NotFoundError if account is not found', async () => {
      vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValue(null);
      await expect(service.getRecommendations('user-1')).rejects.toThrow(NotFoundError);
    });

    it('throws UnprocessableError if roster is empty', async () => {
      vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValue({ id: 'acc-1' } as any);
      vi.mocked(prisma.genshinCharacter.findMany).mockResolvedValue([]);
      await expect(service.getRecommendations('user-1')).rejects.toThrow(UnprocessableError);
    });

    it('skips characters with no artifact profile', async () => {
      vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValue({ id: 'acc-1' } as any);
      vi.mocked(prisma.genshinCharacter.findMany).mockResolvedValue([
        { characterKey: 'UnknownChar', equippedArtifacts: [] } as any,
      ]);
      const res = await service.getRecommendations('user-1');
      expect(res.recommendations).toHaveLength(0);
      expect(res.skipped).toHaveLength(1);
      expect(res.skipped[0].reason).toContain('No artifact weight profile');
    });

    it('returns top 5 sorted by recommendationScore descending', async () => {
      vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValue({ id: 'acc-1' } as any);
      vi.mocked(prisma.genshinCharacter.findMany).mockResolvedValue([
        { characterKey: 'HuTao', equippedArtifacts: [] } as any,
        { characterKey: 'Furina', equippedArtifacts: [] } as any,
      ]);
      const res = await service.getRecommendations('user-1');
      expect(res.recommendations).toHaveLength(2);
      expect(res.recommendations[0].rank).toBe(1);
      expect(res.recommendations[1].rank).toBe(2);
      expect(res.recommendations[0].recommendationScore).toBeGreaterThanOrEqual(
        res.recommendations[1].recommendationScore,
      );
    });

    it('characters with AES >= 60 go to skipped', async () => {
      vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValue({ id: 'acc-1' } as any);
      // Mocking a perfect artifact loadout for HuTao
      vi.mocked(prisma.genshinCharacter.findMany).mockResolvedValue([
        {
          characterKey: 'HuTao',
          equippedArtifacts: [
            { slotKey: 'flower', mainStatKey: 'hp', subStats: [{ key: 'critRate_', value: 20 }] },
            { slotKey: 'plume', mainStatKey: 'atk', subStats: [{ key: 'critDMG_', value: 40 }] },
            { slotKey: 'sands', mainStatKey: 'hp_', subStats: [{ key: 'critRate_', value: 20 }] },
            {
              slotKey: 'goblet',
              mainStatKey: 'pyro_dmg_',
              subStats: [{ key: 'critDMG_', value: 40 }],
            },
            {
              slotKey: 'circlet',
              mainStatKey: 'critRate_',
              subStats: [{ key: 'critDMG_', value: 40 }],
            },
          ],
        } as any,
      ]);
      const res = await service.getRecommendations('user-1');
      expect(res.recommendations).toHaveLength(0);
      expect(res.skipped).toHaveLength(1);
      expect(res.skipped[0].reason).toContain('Artifact efficiency is');
    });

    it('analysedAt is a valid ISO string', async () => {
      vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValue({ id: 'acc-1' } as any);
      vi.mocked(prisma.genshinCharacter.findMany).mockResolvedValue([
        { characterKey: 'HuTao', equippedArtifacts: [] } as any,
      ]);
      const res = await service.getRecommendations('user-1');
      expect(() => new Date(res.analysedAt).toISOString()).not.toThrow();
    });
  });

  describe('Calculator Logic', () => {
    const profile: ArtifactWeightProfile = {
      subStatWeights: { critRate_: 1.0, critDMG_: 1.0, hp_: 0.75 },
      mainStatPriority: {
        sands: ['hp_'],
        goblet: ['pyro_dmg_'],
        circlet: ['critRate_', 'critDMG_'],
      },
    };

    it('Single slot: all priority sub-stats = high score', () => {
      const artifact: ArtifactInput = {
        slotKey: 'flower',
        mainStatKey: 'hp',
        subStats: [
          { key: 'critRate_', value: 15.6 },
          { key: 'critDMG_', value: 31.2 },
        ],
      };
      const res = calculateSlotScore(artifact, profile);
      expect(res.slotScore).toBeGreaterThan(80);
    });

    it('Single slot: all off-stat sub-stats = score 0', () => {
      const artifact: ArtifactInput = {
        slotKey: 'flower',
        mainStatKey: 'hp',
        subStats: [
          { key: 'def_', value: 20 },
          { key: 'def', value: 40 },
        ],
      };
      const res = calculateSlotScore(artifact, profile);
      expect(res.slotScore).toBe(0);
    });

    it('Single slot: correct main stat = +15 bonus applied', () => {
      const artifact: ArtifactInput = { slotKey: 'sands', mainStatKey: 'hp_', subStats: [] };
      const res = calculateSlotScore(artifact, profile);
      expect(res.slotScore).toBe(15);
      expect(res.mainStatBonus).toBe(15);
    });

    it('Single slot: wrong main stat = no bonus', () => {
      const artifact: ArtifactInput = { slotKey: 'sands', mainStatKey: 'def_', subStats: [] };
      const res = calculateSlotScore(artifact, profile);
      expect(res.slotScore).toBe(0);
      expect(res.mainStatBonus).toBe(0);
    });

    it('Single slot: unknown sub-stat key = treated as 0 contribution', () => {
      const artifact: ArtifactInput = {
        slotKey: 'flower',
        mainStatKey: 'hp',
        subStats: [{ key: 'unknown', value: 100 }],
      };
      const res = calculateSlotScore(artifact, profile);
      expect(res.slotScore).toBe(0);
    });

    it('Empty slot (null artifact) = 0', () => {
      const res = calculateSlotScore(null, profile);
      expect(res.slotScore).toBe(0);
    });

    it('4★ artifact scores lower than equivalent 5★', () => {
      // simulated by lower values
      const res4 = calculateSlotScore(
        { slotKey: 'flower', mainStatKey: 'hp', subStats: [{ key: 'critRate_', value: 2.6 }] },
        profile,
      );
      const res5 = calculateSlotScore(
        { slotKey: 'flower', mainStatKey: 'hp', subStats: [{ key: 'critRate_', value: 3.9 }] },
        profile,
      );
      expect(res4.slotScore).toBeLessThan(res5.slotScore);
    });

    it('AES = mean of 5 slot scores', () => {
      const artifacts: ArtifactInput[] = [
        { slotKey: 'flower', mainStatKey: 'hp', subStats: [{ key: 'critRate_', value: 3.9 }] },
        { slotKey: 'plume', mainStatKey: 'atk', subStats: [{ key: 'critRate_', value: 3.9 }] },
      ];
      const res = calculateArtifactScore(artifacts, profile);
      // only 2 slots filled, so mean is (Score + Score + 0 + 0 + 0) / 5
      expect(res.artifactEfficiencyScore).toBeGreaterThan(0);
      expect(res.artifactEfficiencyScore).toBeLessThan(40);
    });

    it('AES = 0 when all 5 slots empty', () => {
      const res = calculateArtifactScore([], profile);
      expect(res.artifactEfficiencyScore).toBe(0);
    });

    it('recommendationScore = 100 - AES', () => {
      const res = calculateArtifactScore([], profile);
      expect(res.recommendationScore).toBe(100);
    });

    it('Determinism: same input = same output', () => {
      const artifact: ArtifactInput = {
        slotKey: 'flower',
        mainStatKey: 'hp',
        subStats: [{ key: 'critRate_', value: 15.6 }],
      };
      const res1 = calculateSlotScore(artifact, profile);
      const res2 = calculateSlotScore(artifact, profile);
      expect(res1).toEqual(res2);
    });

    it('calculateArtifactScore handles mixed empty/filled slots correctly', () => {
      const artifacts: ArtifactInput[] = [
        { slotKey: 'sands', mainStatKey: 'hp_', subStats: [{ key: 'critRate_', value: 15.6 }] },
      ];
      const res = calculateArtifactScore(artifacts, profile);
      expect(res.slotScores['flower'].slotScore).toBe(0);
      expect(res.slotScores['sands'].slotScore).toBeGreaterThan(0);
    });
  });
});
