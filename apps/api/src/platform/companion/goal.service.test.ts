import { GoalType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BadRequestError, ConflictError } from '@/core/errors/app-error.js';

import { GoalService } from './goal.service.js';
import { companionRegistry } from './companion-registry.service.js';
import { GenshinCompanionProvider } from '../../games/genshin/companion/genshin-companion.provider.js';

companionRegistry.register(new GenshinCompanionProvider());

// Mock the repository
const mockCreate = vi.fn();
const mockFindAllByUserId = vi.fn();
const mockFindByIdAndUserId = vi.fn();
const mockDeleteById = vi.fn();

vi.mock('./goal.repository.js', () => {
  return {
    GoalRepository: vi.fn().mockImplementation(() => ({
      create: mockCreate,
      findAllByUserId: mockFindAllByUserId,
      findByIdAndUserId: mockFindByIdAndUserId,
      deleteById: mockDeleteById,
    })),
  };
});

// Mock Prisma
vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    genshinAccount: {
      findUnique: vi.fn(),
    },
    genshinMaterial: {
      findMany: vi.fn(),
    },
  },
}));

describe('GoalService', () => {
  let service: GoalService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GoalService();
  });

  describe('createGoal', () => {
    it('throws BadRequestError if input is invalid', async () => {
      await expect(
        service.createGoal('user-1', {
          goalType: 'INVALID_TYPE',
          targetKey: 'HuTao',
          fromPhase: 0,
          toPhase: 6,
          talentType: null,
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it('throws BadRequestError if character targetKey is unknown', async () => {
      await expect(
        service.createGoal('user-1', {
          goalType: GoalType.CHARACTER_ASCENSION,
          targetKey: 'UnknownCharacter',
          fromPhase: 0,
          toPhase: 6,
          talentType: null,
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it('throws BadRequestError if weapon targetKey is unknown', async () => {
      await expect(
        service.createGoal('user-1', {
          goalType: GoalType.WEAPON_ASCENSION,
          targetKey: 'UnknownWeapon',
          fromPhase: 0,
          toPhase: 6,
          talentType: null,
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it('throws BadRequestError if talentType is missing for CHARACTER_TALENT', async () => {
      await expect(
        service.createGoal('user-1', {
          goalType: GoalType.CHARACTER_TALENT,
          targetKey: 'HuTao',
          fromPhase: 1,
          toPhase: 10,
          talentType: null,
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it('successfully creates a valid character ascension goal', async () => {
      mockCreate.mockResolvedValue({ id: 'goal-1', userId: 'user-1', targetKey: 'HuTao' });

      const result = await service.createGoal('user-1', {
        goalType: GoalType.CHARACTER_ASCENSION,
        targetKey: 'HuTao',
        fromPhase: 0,
        toPhase: 6,
        talentType: null,
      });

      expect(mockCreate).toHaveBeenCalledWith('user-1', {
        goalType: GoalType.CHARACTER_ASCENSION,
        targetKey: 'HuTao',
        fromPhase: 0,
        toPhase: 6,
        talentType: null,
      });
      expect(result.targetKey).toBe('HuTao');
    });

    it('handles Prisma P2002 conflict error and throws ConflictError', async () => {
      mockCreate.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.createGoal('user-1', {
          goalType: GoalType.CHARACTER_ASCENSION,
          targetKey: 'HuTao',
          fromPhase: 0,
          toPhase: 6,
          talentType: null,
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('deleteGoal', () => {
    it('deletes goal if it exists and belongs to user', async () => {
      mockFindByIdAndUserId.mockResolvedValue({ id: 'goal-1', userId: 'user-1' });
      mockDeleteById.mockResolvedValue(undefined);

      await service.deleteGoal('user-1', 'goal-1');

      expect(mockFindByIdAndUserId).toHaveBeenCalledWith('goal-1', 'user-1');
      expect(mockDeleteById).toHaveBeenCalledWith('goal-1');
    });
  });
});
