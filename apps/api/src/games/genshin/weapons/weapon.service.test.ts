import type { GenshinWeapon } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundError } from '@/core/errors/app-error.js';

import { GenshinWeaponRepository } from './weapon.repository.js';
import { GenshinWeaponService } from './weapon.service.js';

vi.mock('./weapon.repository.js');

// Mock prisma for getWeaponsForUser (which queries genshinAccount directly)
vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    genshinAccount: {
      findUnique: vi.fn(),
    },
  },
}));

// -------------------------------------------------------
// Fixtures
// -------------------------------------------------------

const ACCOUNT_ID = 'account-abc-123';
const OTHER_ACCOUNT_ID = 'account-xyz-999';

const mockWeapon: GenshinWeapon = {
  id: 'weapon-abc-123',
  accountId: ACCOUNT_ID,
  weaponKey: 'StaffOfHoma',
  level: 90,
  ascension: 6,
  refinement: 1,
  locked: false,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const addInput = {
  weaponKey: 'StaffOfHoma',
  level: 90,
  ascension: 6,
  refinement: 1,
};

// -------------------------------------------------------
// Tests
// -------------------------------------------------------

describe('GenshinWeaponService', () => {
  let service: GenshinWeaponService;
  let mockRepo: {
    findByAccountId: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepo = {
      findByAccountId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    vi.mocked(GenshinWeaponRepository).mockImplementation(
      () => mockRepo as unknown as GenshinWeaponRepository,
    );

    service = new GenshinWeaponService();
  });

  // ---------------------------------------------------
  // addWeapon
  // ---------------------------------------------------

  describe('addWeapon', () => {
    it('creates and returns the weapon', async () => {
      mockRepo.create.mockResolvedValue(mockWeapon);

      const result = await service.addWeapon(ACCOUNT_ID, addInput);

      expect(result).toEqual(mockWeapon);
      expect(mockRepo.create).toHaveBeenCalledOnce();
    });

    it('allows duplicate weaponKeys in the same account (multiple copies)', async () => {
      mockRepo.create.mockResolvedValue(mockWeapon);

      // Calling twice should both succeed — no duplicate check on weapons
      await service.addWeapon(ACCOUNT_ID, addInput);
      await service.addWeapon(ACCOUNT_ID, addInput);

      expect(mockRepo.create).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------
  // getWeapons
  // ---------------------------------------------------

  describe('getWeapons', () => {
    it('returns all weapons for the account', async () => {
      mockRepo.findByAccountId.mockResolvedValue([mockWeapon]);

      const result = await service.getWeapons(ACCOUNT_ID);

      expect(result).toHaveLength(1);
    });
  });

  // ---------------------------------------------------
  // getWeaponsForUser (Milestone 2E — HTTP read API)
  // ---------------------------------------------------

  describe('getWeaponsForUser', () => {
    it('returns weapons when the user has a Genshin account', async () => {
      const { prisma } = await import('@/core/db/prisma.js');
      vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValue({
        id: ACCOUNT_ID,
        userId: 'user-abc-123',
        uid: '700000001',
        nickname: null,
        adventureRank: null,
        worldLevel: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      });
      mockRepo.findByAccountId.mockResolvedValue([mockWeapon]);

      const result = await service.getWeaponsForUser('user-abc-123');

      expect(result).toHaveLength(1);
      expect(result[0]?.weaponKey).toBe('StaffOfHoma');
    });

    it('returns an empty array when the user has no Genshin account', async () => {
      const { prisma } = await import('@/core/db/prisma.js');
      vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValue(null);

      const result = await service.getWeaponsForUser('user-no-account');

      expect(result).toEqual([]);
      expect(mockRepo.findByAccountId).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------
  // getWeaponById
  // ---------------------------------------------------

  describe('getWeaponById', () => {
    it('returns the weapon when it belongs to the account', async () => {
      mockRepo.findById.mockResolvedValue(mockWeapon);

      const result = await service.getWeaponById(ACCOUNT_ID, mockWeapon.id);

      expect(result).toEqual(mockWeapon);
    });

    it('throws NotFoundError when weapon does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getWeaponById(ACCOUNT_ID, 'nonexistent-id')).rejects.toThrow(
        NotFoundError,
      );
    });

    it('throws NotFoundError when weapon belongs to a different account (cross-account guard)', async () => {
      mockRepo.findById.mockResolvedValue(mockWeapon); // accountId = ACCOUNT_ID

      await expect(service.getWeaponById(OTHER_ACCOUNT_ID, mockWeapon.id)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  // ---------------------------------------------------
  // updateWeapon
  // ---------------------------------------------------

  describe('updateWeapon', () => {
    it('updates and returns the weapon', async () => {
      const updated = { ...mockWeapon, refinement: 5 };
      mockRepo.findById.mockResolvedValue(mockWeapon);
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.updateWeapon(ACCOUNT_ID, mockWeapon.id, {
        refinement: 5,
      });

      expect(result.refinement).toBe(5);
    });

    it('throws NotFoundError when weapon does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateWeapon(ACCOUNT_ID, 'nonexistent-id', { refinement: 5 }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ---------------------------------------------------
  // removeWeapon
  // ---------------------------------------------------

  describe('removeWeapon', () => {
    it('deletes and returns the removed weapon', async () => {
      mockRepo.findById.mockResolvedValue(mockWeapon);
      mockRepo.delete.mockResolvedValue(mockWeapon);

      const result = await service.removeWeapon(ACCOUNT_ID, mockWeapon.id);

      expect(result).toEqual(mockWeapon);
      expect(mockRepo.delete).toHaveBeenCalledWith(mockWeapon.id);
    });

    it('throws NotFoundError when weapon does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.removeWeapon(ACCOUNT_ID, 'nonexistent-id')).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
