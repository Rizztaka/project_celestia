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
    imaginariumTheaterRun: {
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

const makeAbyssRun = (overrides = {}) => ({
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

const makeTheaterRun = (overrides = {}) => ({
  id: 'theater-run-1',
  accountId: 'account-abc',
  seasonId: 'August 2024',
  difficulty: 'VISIONARY' as const,
  actsCleared: 10,
  stars: 10,
  cast: ['HuTao', 'Nahida', 'Xingqiu', 'Yelan'],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const validAbyssInput = {
  cycleId: '5.0-1',
  floor: 12 as const,
  chamber: 3 as const,
  half: 1 as 1 | 2,
  stars: 3,
  team: ['HuTao', 'Xingqiu', 'Yelan', 'Zhongli'],
};

const validTheaterInput = {
  seasonId: 'August 2024',
  difficulty: 'VISIONARY' as const,
  actsCleared: 10,
  stars: 10,
  cast: ['HuTao', 'Nahida', 'Xingqiu', 'Yelan'],
};

// -------------------------------------------------------
// Tests
// -------------------------------------------------------

describe('EndgameService', () => {
  let service: EndgameService;
  const mockPrisma = prisma as unknown as {
    genshinAccount: { findUnique: ReturnType<typeof vi.fn> };
    spiralAbyssRun: { upsert: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
    imaginariumTheaterRun: { upsert: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
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
      mockPrisma.spiralAbyssRun.upsert.mockResolvedValue(makeAbyssRun());

      const result = await service.logAbyssRun('user-xyz', validAbyssInput);

      expect(result.stars).toBe(3);
      expect(result.team).toEqual(['HuTao', 'Xingqiu', 'Yelan', 'Zhongli']);
      expect(mockPrisma.spiralAbyssRun.upsert).toHaveBeenCalledOnce();
    });

    it('throws NotFoundError when user has no Genshin account', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(null);

      await expect(service.logAbyssRun('user-xyz', validAbyssInput)).rejects.toThrow(NotFoundError);
      expect(mockPrisma.spiralAbyssRun.upsert).not.toHaveBeenCalled();
    });

    it('throws ValidationError for invalid floor', async () => {
      await expect(
        service.logAbyssRun('user-xyz', { ...validAbyssInput, floor: 8 as never }),
      ).rejects.toThrow(UnprocessableError);
    });

    it('throws ValidationError for invalid chamber', async () => {
      await expect(
        service.logAbyssRun('user-xyz', { ...validAbyssInput, chamber: 4 as never }),
      ).rejects.toThrow(UnprocessableError);
    });

    it('throws ValidationError for invalid half', async () => {
      await expect(
        service.logAbyssRun('user-xyz', { ...validAbyssInput, half: 3 as never }),
      ).rejects.toThrow(UnprocessableError);
    });

    it('throws ValidationError when stars > 3', async () => {
      await expect(
        service.logAbyssRun('user-xyz', { ...validAbyssInput, stars: 4 }),
      ).rejects.toThrow(UnprocessableError);
    });

    it('throws ValidationError when team exceeds 4 characters', async () => {
      await expect(
        service.logAbyssRun('user-xyz', {
          ...validAbyssInput,
          team: ['A', 'B', 'C', 'D', 'E'],
        }),
      ).rejects.toThrow(UnprocessableError);
    });

    it('throws ValidationError when cycleId is empty', async () => {
      await expect(
        service.logAbyssRun('user-xyz', { ...validAbyssInput, cycleId: '' }),
      ).rejects.toThrow(UnprocessableError);
    });

    it('allows an empty team (unentered)', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(ACCOUNT);
      mockPrisma.spiralAbyssRun.upsert.mockResolvedValue(makeAbyssRun({ team: [] }));

      const result = await service.logAbyssRun('user-xyz', { ...validAbyssInput, team: [] });
      expect(result.team).toEqual([]);
    });

    it('accepts all valid floor values (9, 10, 11, 12)', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(ACCOUNT);
      for (const floor of [9, 10, 11, 12]) {
        mockPrisma.spiralAbyssRun.upsert.mockResolvedValue(makeAbyssRun({ floor }));
        const result = await service.logAbyssRun('user-xyz', {
          ...validAbyssInput,
          floor: floor as never,
        });
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
        makeAbyssRun({ cycleId: '5.0-1', floor: 12, chamber: 3, half: 1, stars: 3 }),
        makeAbyssRun({ id: 'run-2', cycleId: '5.0-1', floor: 12, chamber: 3, half: 2, stars: 2 }),
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
        makeAbyssRun({ id: 'r1', cycleId: '5.0-1', floor: 12, chamber: 1, half: 1, stars: 3 }),
        makeAbyssRun({ id: 'r2', cycleId: '5.0-2', floor: 12, chamber: 1, half: 1, stars: 2 }),
      ]);

      const result = await service.getAbyssHistory('user-xyz');
      expect(result.cycles).toHaveLength(2);
    });

    it('reports maxStars of 36 for every cycle', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(ACCOUNT);
      mockPrisma.spiralAbyssRun.findMany.mockResolvedValue([makeAbyssRun()]);

      const result = await service.getAbyssHistory('user-xyz');
      expect(result.cycles[0].maxStars).toBe(36);
    });

    it('counts completedChambers across all floors in a cycle', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(ACCOUNT);
      mockPrisma.spiralAbyssRun.findMany.mockResolvedValue([
        makeAbyssRun({ id: 'r1', floor: 12, chamber: 1, half: 1 }),
        makeAbyssRun({ id: 'r2', floor: 12, chamber: 2, half: 1 }),
        makeAbyssRun({ id: 'r3', floor: 11, chamber: 3, half: 2 }),
      ]);

      const result = await service.getAbyssHistory('user-xyz');
      // 3 unique (floor, chamber) slots
      expect(result.cycles[0].completedChambers).toBe(3);
    });
  });

  // ──────────────────────────────────────────────────────
  // logTheaterRun
  // ──────────────────────────────────────────────────────

  describe('logTheaterRun', () => {
    it('creates and returns a run when input is valid', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(ACCOUNT);
      mockPrisma.imaginariumTheaterRun.upsert.mockResolvedValue(makeTheaterRun());

      const result = await service.logTheaterRun('user-xyz', validTheaterInput);

      expect(result.seasonId).toBe('August 2024');
      expect(result.difficulty).toBe('VISIONARY');
      expect(result.actsCleared).toBe(10);
      expect(result.stars).toBe(10);
      expect(result.cast).toEqual(['HuTao', 'Nahida', 'Xingqiu', 'Yelan']);
      expect(mockPrisma.imaginariumTheaterRun.upsert).toHaveBeenCalledOnce();
    });

    it('throws NotFoundError when user has no Genshin account', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(null);

      await expect(service.logTheaterRun('user-xyz', validTheaterInput)).rejects.toThrow(
        NotFoundError,
      );
      expect(mockPrisma.imaginariumTheaterRun.upsert).not.toHaveBeenCalled();
    });

    it('throws UnprocessableError when seasonId is empty', async () => {
      await expect(
        service.logTheaterRun('user-xyz', { ...validTheaterInput, seasonId: '' }),
      ).rejects.toThrow(UnprocessableError);
    });

    it('throws UnprocessableError for invalid difficulty', async () => {
      await expect(
        service.logTheaterRun('user-xyz', { ...validTheaterInput, difficulty: 'EXTREME' as never }),
      ).rejects.toThrow(UnprocessableError);
    });

    it('throws UnprocessableError when actsCleared = 0', async () => {
      await expect(
        service.logTheaterRun('user-xyz', { ...validTheaterInput, actsCleared: 0 }),
      ).rejects.toThrow(UnprocessableError);
    });

    it('throws UnprocessableError when actsCleared = 15 (exceeds max)', async () => {
      await expect(
        service.logTheaterRun('user-xyz', { ...validTheaterInput, actsCleared: 15 }),
      ).rejects.toThrow(UnprocessableError);
    });

    it('throws UnprocessableError when stars > 10', async () => {
      await expect(
        service.logTheaterRun('user-xyz', { ...validTheaterInput, stars: 11 }),
      ).rejects.toThrow(UnprocessableError);
    });

    it('throws UnprocessableError when cast exceeds 12 characters', async () => {
      await expect(
        service.logTheaterRun('user-xyz', {
          ...validTheaterInput,
          cast: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'],
        }),
      ).rejects.toThrow(UnprocessableError);
    });

    it('accepts all four valid difficulty values', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(ACCOUNT);
      for (const difficulty of ['EASY', 'NORMAL', 'HARD', 'VISIONARY'] as const) {
        mockPrisma.imaginariumTheaterRun.upsert.mockResolvedValue(makeTheaterRun({ difficulty }));
        const result = await service.logTheaterRun('user-xyz', {
          ...validTheaterInput,
          difficulty,
        });
        expect(result.difficulty).toBe(difficulty);
      }
    });

    it('allows an empty cast (unentered)', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(ACCOUNT);
      mockPrisma.imaginariumTheaterRun.upsert.mockResolvedValue(makeTheaterRun({ cast: [] }));

      const result = await service.logTheaterRun('user-xyz', { ...validTheaterInput, cast: [] });
      expect(result.cast).toEqual([]);
    });

    it('upserts on existing season (re-clear scenario)', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(ACCOUNT);
      // Return updated record with improved score
      mockPrisma.imaginariumTheaterRun.upsert.mockResolvedValue(
        makeTheaterRun({ actsCleared: 10, stars: 10 }),
      );

      const result = await service.logTheaterRun('user-xyz', {
        ...validTheaterInput,
        actsCleared: 10,
        stars: 10,
      });

      expect(result.actsCleared).toBe(10);
      expect(result.stars).toBe(10);
      // Upsert was called (not insert), confirming re-clear path
      expect(mockPrisma.imaginariumTheaterRun.upsert).toHaveBeenCalledOnce();
    });
  });

  // ──────────────────────────────────────────────────────
  // getTheaterHistory
  // ──────────────────────────────────────────────────────

  describe('getTheaterHistory', () => {
    it('returns empty runs array when no runs exist', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(ACCOUNT);
      mockPrisma.imaginariumTheaterRun.findMany.mockResolvedValue([]);

      const result = await service.getTheaterHistory('user-xyz');
      expect(result.runs).toHaveLength(0);
    });

    it('throws NotFoundError when user has no Genshin account', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(null);
      await expect(service.getTheaterHistory('user-xyz')).rejects.toThrow(NotFoundError);
    });

    it('returns all runs ordered as provided by the repository', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(ACCOUNT);
      mockPrisma.imaginariumTheaterRun.findMany.mockResolvedValue([
        makeTheaterRun({ id: 't1', seasonId: 'September 2024' }),
        makeTheaterRun({ id: 't2', seasonId: 'August 2024' }),
      ]);

      const result = await service.getTheaterHistory('user-xyz');
      expect(result.runs).toHaveLength(2);
      expect(result.runs[0].seasonId).toBe('September 2024');
      expect(result.runs[1].seasonId).toBe('August 2024');
    });

    it('correctly maps cast JSON to string array', async () => {
      mockPrisma.genshinAccount.findUnique.mockResolvedValue(ACCOUNT);
      mockPrisma.imaginariumTheaterRun.findMany.mockResolvedValue([
        makeTheaterRun({ cast: ['Nahida', 'Fischl'] }),
      ]);

      const result = await service.getTheaterHistory('user-xyz');
      expect(result.runs[0].cast).toEqual(['Nahida', 'Fischl']);
    });
  });
});
