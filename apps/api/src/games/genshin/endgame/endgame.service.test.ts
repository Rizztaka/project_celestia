import { beforeEach, describe, expect, it, vi } from 'vitest';

// -------------------------------------------------------
// Mock Prisma
// -------------------------------------------------------

vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    genshinAccount: {
      findUnique: vi.fn(),
    },
    spiralAbyssRun: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/core/db/prisma.js';
import { NotFoundError, UnprocessableError } from '@/core/errors/app-error.js';

import { EndgameService } from './endgame.service.js';

// -------------------------------------------------------
// Fixtures
// -------------------------------------------------------

const ACCOUNT = { id: 'account-abc', userId: 'user-xyz' };

const makeRun = (overrides = {}) => ({
  id: 'run-1',
  accountId: 'account-abc',
  cycleId: '5.0-1',
  floor: 12,
  chamber: 3,
  half: 1,
  stars: 3,
  team: ['HuTao', 'Xingqiu', 'Yelan', 'Zhongli'],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const validInput = {
  cycleId: '5.0-1',
  floor: 12 as const,
  chamber: 3 as const,
  half: 1 as 1 | 2,
  stars: 3,
  team: ['HuTao', 'Xingqiu', 'Yelan', 'Zhongli'],
};

// -------------------------------------------------------
// Tests
// -------------------------------------------------------

describe('EndgameService', () => {
  let service: EndgameService;
  const mockPrisma = prisma as unknown as {
    genshinAccount: { findUnique: ReturnType<typeof vi.fn> };
    spiralAbyssRun: { upsert: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    service = new EndgameService();
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────
  // logAbyssRun
  // ──────────────────────────────────────────────────────

  describe('logAbyssRun', () => {
    it('creates and returns a run when input is valid', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(ACCOUNT);
      mockPrisma.spiralAbyssRun.upsert.mockResolvedValue(makeRun());

      const result = await service.logAbyssRun('user-xyz', validInput);

      expect(result.stars).toBe(3);
      expect(result.team).toEqual(['HuTao', 'Xingqiu', 'Yelan', 'Zhongli']);
      expect(mockPrisma.spiralAbyssRun.upsert).toHaveBeenCalledOnce();
    });

    it('throws NotFoundError when user has no Genshin account', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(null);

      await expect(service.logAbyssRun('user-xyz', validInput)).rejects.toThrow(NotFoundError);
      expect(mockPrisma.spiralAbyssRun.upsert).not.toHaveBeenCalled();
    });

    it('throws ValidationError for invalid floor', async () => {
      await expect(
        service.logAbyssRun('user-xyz', { ...validInput, floor: 8 as never }),
      ).rejects.toThrow(UnprocessableError);
    });

    it('throws ValidationError for invalid chamber', async () => {
      await expect(
        service.logAbyssRun('user-xyz', { ...validInput, chamber: 4 as never }),
      ).rejects.toThrow(UnprocessableError);
    });

    it('throws ValidationError for invalid half', async () => {
      await expect(
        service.logAbyssRun('user-xyz', { ...validInput, half: 3 as never }),
      ).rejects.toThrow(UnprocessableError);
    });

    it('throws ValidationError when stars > 3', async () => {
      await expect(
        service.logAbyssRun('user-xyz', { ...validInput, stars: 4 }),
      ).rejects.toThrow(UnprocessableError);
    });

    it('throws ValidationError when team exceeds 4 characters', async () => {
      await expect(
        service.logAbyssRun('user-xyz', {
          ...validInput,
          team: ['A', 'B', 'C', 'D', 'E'],
        }),
      ).rejects.toThrow(UnprocessableError);
    });

    it('throws ValidationError when cycleId is empty', async () => {
      await expect(
        service.logAbyssRun('user-xyz', { ...validInput, cycleId: '' }),
      ).rejects.toThrow(UnprocessableError);
    });

    it('allows an empty team (unentered)', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(ACCOUNT);
      mockPrisma.spiralAbyssRun.upsert.mockResolvedValue(makeRun({ team: [] }));

      const result = await service.logAbyssRun('user-xyz', { ...validInput, team: [] });
      expect(result.team).toEqual([]);
    });

    it('accepts all valid floor values (9, 10, 11, 12)', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(ACCOUNT);
      for (const floor of [9, 10, 11, 12]) {
        mockPrisma.spiralAbyssRun.upsert.mockResolvedValue(makeRun({ floor }));
        const result = await service.logAbyssRun('user-xyz', { ...validInput, floor: floor as never });
        expect(result).toBeDefined();
      }
    });
  });

  // ──────────────────────────────────────────────────────
  // getAbyssHistory — grouping logic
  // ──────────────────────────────────────────────────────

  describe('getAbyssHistory', () => {
    it('returns empty cycles array when no runs exist', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(ACCOUNT);
      mockPrisma.spiralAbyssRun.findMany.mockResolvedValue([]);

      const result = await service.getAbyssHistory('user-xyz');
      expect(result.cycles).toHaveLength(0);
    });

    it('throws NotFoundError when user has no Genshin account', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(null);
      await expect(service.getAbyssHistory('user-xyz')).rejects.toThrow(NotFoundError);
    });

    it('groups runs into the correct cycle → floor → chamber hierarchy', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(ACCOUNT);
      mockPrisma.spiralAbyssRun.findMany.mockResolvedValue([
        makeRun({ cycleId: '5.0-1', floor: 12, chamber: 3, half: 1, stars: 3 }),
        makeRun({ id: 'run-2', cycleId: '5.0-1', floor: 12, chamber: 3, half: 2, stars: 2 }),
      ]);

      const result = await service.getAbyssHistory('user-xyz');

      expect(result.cycles).toHaveLength(1);
      const cycle = result.cycles[0];
      expect(cycle.cycleId).toBe('5.0-1');
      expect(cycle.totalStars).toBe(5); // 3 + 2
      expect(cycle.floors).toHaveLength(1);

      const floor = cycle.floors[0];
      expect(floor.floor).toBe(12);
      expect(floor.chambers).toHaveLength(1);

      const chamber = floor.chambers[0];
      expect(chamber.chamber).toBe(3);
      expect(chamber.totalStars).toBe(5);
      expect(chamber.halves).toHaveLength(2);
    });

    it('separates runs from different cycles into distinct groups', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(ACCOUNT);
      mockPrisma.spiralAbyssRun.findMany.mockResolvedValue([
        makeRun({ id: 'r1', cycleId: '5.0-1', floor: 12, chamber: 1, half: 1, stars: 3 }),
        makeRun({ id: 'r2', cycleId: '5.0-2', floor: 12, chamber: 1, half: 1, stars: 2 }),
      ]);

      const result = await service.getAbyssHistory('user-xyz');
      expect(result.cycles).toHaveLength(2);
    });

    it('reports maxStars of 36 for every cycle', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(ACCOUNT);
      mockPrisma.spiralAbyssRun.findMany.mockResolvedValue([makeRun()]);

      const result = await service.getAbyssHistory('user-xyz');
      expect(result.cycles[0].maxStars).toBe(36);
    });

    it('counts completedChambers across all floors in a cycle', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(ACCOUNT);
      mockPrisma.spiralAbyssRun.findMany.mockResolvedValue([
        makeRun({ id: 'r1', floor: 12, chamber: 1, half: 1 }),
        makeRun({ id: 'r2', floor: 12, chamber: 2, half: 1 }),
        makeRun({ id: 'r3', floor: 11, chamber: 3, half: 2 }),
      ]);

      const result = await service.getAbyssHistory('user-xyz');
      // 3 unique (floor, chamber) slots
      expect(result.cycles[0].completedChambers).toBe(3);
    });
  });
});
