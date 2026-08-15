import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BadRequestError, NotFoundError } from '@/core/errors/app-error.js';

import { GenshinCompanionProvider } from '../../games/genshin/companion/genshin-companion.provider.js';
import { companionRegistry } from './companion-registry.service.js';
import {
  getLastWeeklyResetBoundary,
  getNextWeeklyResetBoundary,
  WeeklyBossService,
} from './weekly-boss.service.js';

companionRegistry.register(new GenshinCompanionProvider());

// -------------------------------------------------------
// Mock repository
// -------------------------------------------------------

const mockFindByUserId = vi.fn();
const mockUpsert = vi.fn();

vi.mock('./weekly-boss.repository.js', () => ({
  WeeklyBossRepository: vi.fn().mockImplementation(() => ({
    findByUserId: mockFindByUserId,
    upsert: mockUpsert,
  })),
}));

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

/** Build a mock WeeklyBossState row */
function makeRow(defeatedBossKeys: string[], weeklyResetAt: Date) {
  return {
    id: 'row-1',
    userId: 'user-1',
    defeatedBossKeys,
    weeklyResetAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// -------------------------------------------------------
// Boundary helper tests (pure functions — no mocks needed)
// -------------------------------------------------------

describe('getLastWeeklyResetBoundary', () => {
  it('returns Sunday 20:00 UTC when called on a Monday UTC', () => {
    // Monday 2026-08-10 10:00 UTC
    const now = new Date('2026-08-10T10:00:00Z');
    const boundary = getLastWeeklyResetBoundary(now);
    // Most recent Sunday 20:00 UTC = 2026-08-09T20:00:00Z
    expect(boundary.toISOString()).toBe('2026-08-09T20:00:00.000Z');
  });

  it('returns Sunday 20:00 UTC when called on a Saturday UTC', () => {
    // Saturday 2026-08-15 15:00 UTC
    const now = new Date('2026-08-15T15:00:00Z');
    const boundary = getLastWeeklyResetBoundary(now);
    // Most recent Sunday 20:00 UTC = 2026-08-09T20:00:00Z
    expect(boundary.toISOString()).toBe('2026-08-09T20:00:00.000Z');
  });

  it('returns Sunday 20:00 UTC when called exactly at the boundary', () => {
    const now = new Date('2026-08-09T20:00:00Z'); // exactly on boundary
    const boundary = getLastWeeklyResetBoundary(now);
    expect(boundary.toISOString()).toBe('2026-08-09T20:00:00.000Z');
  });

  it("returns the PREVIOUS week's boundary when called on Sunday before 20:00 UTC", () => {
    // Sunday 2026-08-09 15:00 UTC — not yet at the boundary
    const now = new Date('2026-08-09T15:00:00Z');
    const boundary = getLastWeeklyResetBoundary(now);
    // Previous Sunday 20:00 UTC = 2026-08-02T20:00:00Z
    expect(boundary.toISOString()).toBe('2026-08-02T20:00:00.000Z');
  });
});

describe('getNextWeeklyResetBoundary', () => {
  it('returns 7 days after the last boundary', () => {
    const now = new Date('2026-08-10T10:00:00Z'); // Monday
    const next = getNextWeeklyResetBoundary(now);
    // Last boundary: 2026-08-09T20:00:00Z → next: 2026-08-16T20:00:00Z
    expect(next.toISOString()).toBe('2026-08-16T20:00:00.000Z');
  });
});

// -------------------------------------------------------
// WeeklyBossService tests
// -------------------------------------------------------

describe('WeeklyBossService', () => {
  let service: WeeklyBossService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WeeklyBossService();
    // Default: upsert returns what was given
    mockUpsert.mockImplementation((userId, defeatedBossKeys, weeklyResetAt) =>
      Promise.resolve(makeRow(defeatedBossKeys, weeklyResetAt)),
    );
  });

  // ─────────────────────────────────────────────────────
  // getWeeklyBosses
  // ─────────────────────────────────────────────────────

  describe('getWeeklyBosses', () => {
    it('returns all bosses with defeated=false when no row exists (new user)', async () => {
      mockFindByUserId.mockResolvedValue(null);

      const result = await service.getWeeklyBosses('user-1');

      expect(result.bosses.length).toBeGreaterThan(0);
      for (const boss of result.bosses) {
        expect(boss.defeated).toBe(false);
      }
      // Should have upserted a fresh row
      expect(mockUpsert).toHaveBeenCalledWith('user-1', [], expect.any(Date));
    });

    it('correctly marks defeated bosses from the stored row', async () => {
      const now = new Date();
      const lastBoundary = getLastWeeklyResetBoundary(now);
      // weeklyResetAt is AFTER the boundary — no reset needed
      const futureReset = new Date(lastBoundary.getTime() + 1000);

      mockFindByUserId.mockResolvedValue(makeRow(['Dvalin', 'Lupus'], futureReset));

      const result = await service.getWeeklyBosses('user-1');

      const dvalin = result.bosses.find((b) => b.key === 'Dvalin');
      const lupus = result.bosses.find((b) => b.key === 'Lupus');
      const shogun = result.bosses.find((b) => b.key === 'Shogun');

      expect(dvalin!.defeated).toBe(true);
      expect(lupus!.defeated).toBe(true);
      expect(shogun!.defeated).toBe(false);
    });

    it('applies lazy reset when weeklyResetAt is before the last boundary', async () => {
      // Simulate a stale row from the previous week
      const staleDate = new Date('2020-01-01T00:00:00Z');
      mockFindByUserId.mockResolvedValue(makeRow(['Dvalin', 'Shogun'], staleDate));

      const result = await service.getWeeklyBosses('user-1');

      // All bosses should be reset to not defeated
      for (const boss of result.bosses) {
        expect(boss.defeated).toBe(false);
      }
      // Should have upserted with empty keys
      expect(mockUpsert).toHaveBeenCalledWith('user-1', [], expect.any(Date));
    });

    it('does NOT apply reset when weeklyResetAt is after the boundary', async () => {
      const now = new Date();
      const lastBoundary = getLastWeeklyResetBoundary(now);
      const freshReset = new Date(lastBoundary.getTime() + 60_000); // 1 minute after boundary

      mockFindByUserId.mockResolvedValue(makeRow(['Dvalin'], freshReset));

      await service.getWeeklyBosses('user-1');

      // upsert should NOT have been called (row is current week)
      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('computes discountedRemaining and nextFightCost correctly', async () => {
      const now = new Date();
      const lastBoundary = getLastWeeklyResetBoundary(now);
      const freshReset = new Date(lastBoundary.getTime() + 1000);

      // 2 bosses defeated → 1 discounted fight remaining
      mockFindByUserId.mockResolvedValue(makeRow(['Dvalin', 'Lupus'], freshReset));
      const result2 = await service.getWeeklyBosses('user-1');
      expect(result2.defeatedCount).toBe(2);
      expect(result2.discountedRemaining).toBe(1);
      expect(result2.nextFightCost).toBe(30);

      // 3 bosses defeated → no discounts remaining
      mockFindByUserId.mockResolvedValue(makeRow(['Dvalin', 'Lupus', 'Shogun'], freshReset));
      const result3 = await service.getWeeklyBosses('user-1');
      expect(result3.defeatedCount).toBe(3);
      expect(result3.discountedRemaining).toBe(0);
      expect(result3.nextFightCost).toBe(60);

      // 0 bosses defeated → all discounts available
      mockFindByUserId.mockResolvedValue(makeRow([], freshReset));
      const result0 = await service.getWeeklyBosses('user-1');
      expect(result0.defeatedCount).toBe(0);
      expect(result0.discountedRemaining).toBe(3);
      expect(result0.nextFightCost).toBe(30);
    });

    it('returns nextResetAt 7 days after the last boundary', async () => {
      mockFindByUserId.mockResolvedValue(null);

      const result = await service.getWeeklyBosses('user-1');

      const last = getLastWeeklyResetBoundary();
      const expectedNext = new Date(last);
      expectedNext.setUTCDate(expectedNext.getUTCDate() + 7);

      expect(result.nextResetAt).toBe(expectedNext.toISOString());
    });
  });

  // ─────────────────────────────────────────────────────
  // patchBoss
  // ─────────────────────────────────────────────────────

  describe('patchBoss', () => {
    it('throws BadRequestError for malformed body', async () => {
      await expect(service.patchBoss('user-1', 'Dvalin', {})).rejects.toThrow(BadRequestError);

      await expect(service.patchBoss('user-1', 'Dvalin', { defeated: 'yes' })).rejects.toThrow(
        BadRequestError,
      );
    });

    it('throws NotFoundError for an unknown bossKey', async () => {
      await expect(service.patchBoss('user-1', 'FakeBoss', { defeated: true })).rejects.toThrow(
        NotFoundError,
      );
    });

    it('adds bossKey to defeated set when defeated=true', async () => {
      const now = new Date();
      const lastBoundary = getLastWeeklyResetBoundary(now);
      const freshReset = new Date(lastBoundary.getTime() + 1000);

      mockFindByUserId.mockResolvedValue(makeRow(['Lupus'], freshReset));

      await service.patchBoss('user-1', 'Dvalin', { defeated: true });

      expect(mockUpsert).toHaveBeenCalledWith(
        'user-1',
        expect.arrayContaining(['Lupus', 'Dvalin']),
        expect.any(Date),
      );
    });

    it('removes bossKey from defeated set when defeated=false', async () => {
      const now = new Date();
      const lastBoundary = getLastWeeklyResetBoundary(now);
      const freshReset = new Date(lastBoundary.getTime() + 1000);

      mockFindByUserId.mockResolvedValue(makeRow(['Dvalin', 'Lupus'], freshReset));

      await service.patchBoss('user-1', 'Dvalin', { defeated: false });

      const calledWith = mockUpsert.mock.calls[0]![1] as string[];
      expect(calledWith).not.toContain('Dvalin');
      expect(calledWith).toContain('Lupus');
    });

    it('is idempotent — marking an already-defeated boss as defeated again is safe', async () => {
      const now = new Date();
      const lastBoundary = getLastWeeklyResetBoundary(now);
      const freshReset = new Date(lastBoundary.getTime() + 1000);

      mockFindByUserId.mockResolvedValue(makeRow(['Dvalin'], freshReset));

      await service.patchBoss('user-1', 'Dvalin', { defeated: true });

      const calledWith = mockUpsert.mock.calls[0]![1] as string[];
      // Should still only have Dvalin once
      expect(calledWith.filter((k) => k === 'Dvalin').length).toBe(1);
    });

    it('resets stale week before applying the toggle', async () => {
      const staleDate = new Date('2020-01-01T00:00:00Z');
      mockFindByUserId.mockResolvedValue(makeRow(['Lupus', 'Shogun'], staleDate));

      await service.patchBoss('user-1', 'Dvalin', { defeated: true });

      // Old keys from stale week should be discarded; only the new toggle applied
      const calledWith = mockUpsert.mock.calls[0]![1] as string[];
      expect(calledWith).toContain('Dvalin');
      expect(calledWith).not.toContain('Lupus');
      expect(calledWith).not.toContain('Shogun');
    });

    it('returns the correct BossUpdateResult', async () => {
      const now = new Date();
      const lastBoundary = getLastWeeklyResetBoundary(now);
      const freshReset = new Date(lastBoundary.getTime() + 1000);

      mockFindByUserId.mockResolvedValue(makeRow([], freshReset));

      const result = await service.patchBoss('user-1', 'Dvalin', { defeated: true });
      expect(result).toEqual({ bossKey: 'Dvalin', defeated: true });
    });
  });
});
