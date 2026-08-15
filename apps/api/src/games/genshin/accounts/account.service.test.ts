import type { GenshinAccount } from '@prisma/client';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import { ConflictError, NotFoundError } from '@/core/errors/app-error.js';

import { GenshinAccountRepository } from './account.repository.js';
import { GenshinAccountService } from './account.service.js';

vi.mock('./account.repository.js');

// -------------------------------------------------------
// Fixtures
// -------------------------------------------------------

const mockAccount: GenshinAccount = {
  id: 'account-abc-123',
  userId: 'user-abc-123',
  uid: '123456789',
  nickname: 'Traveler',
  adventureRank: 60,
  worldLevel: 8,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

// -------------------------------------------------------
// Tests
// -------------------------------------------------------

describe('GenshinAccountService', () => {
  let service: GenshinAccountService;
  let mockRepo: {
    findByUserId: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepo = {
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };

    vi.mocked(GenshinAccountRepository).mockImplementation(
      () => mockRepo as unknown as GenshinAccountRepository,
    );

    service = new GenshinAccountService();
  });

  // ---------------------------------------------------
  // createAccount
  // ---------------------------------------------------

  describe('createAccount', () => {
    const input = { userId: 'user-abc-123', nickname: 'Traveler' };

    it('creates and returns a new account', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(mockAccount);

      const result = await service.createAccount(input);

      expect(result).toEqual(mockAccount);
      expect(mockRepo.create).toHaveBeenCalledOnce();
    });

    it('throws ConflictError when the user already has an account', async () => {
      mockRepo.findByUserId.mockResolvedValue(mockAccount);

      await expect(service.createAccount(input)).rejects.toThrow(ConflictError);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------
  // getAccountByUserId
  // ---------------------------------------------------

  describe('getAccountByUserId', () => {
    it('returns the account when it exists', async () => {
      mockRepo.findByUserId.mockResolvedValue(mockAccount);

      const result = await service.getAccountByUserId('user-abc-123');

      expect(result).toEqual(mockAccount);
    });

    it('throws NotFoundError when the account does not exist', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);

      await expect(service.getAccountByUserId('user-abc-123')).rejects.toThrow(NotFoundError);
    });
  });

  // ---------------------------------------------------
  // updateAccount
  // ---------------------------------------------------

  describe('updateAccount', () => {
    it('updates and returns the account', async () => {
      const updated = { ...mockAccount, adventureRank: 59 };
      mockRepo.findByUserId.mockResolvedValue(mockAccount);
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.updateAccount('user-abc-123', {
        adventureRank: 59,
      });

      expect(result.adventureRank).toBe(59);
      expect(mockRepo.update).toHaveBeenCalledWith(mockAccount.id, {
        adventureRank: 59,
      });
    });

    it('throws NotFoundError when the account does not exist', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);

      await expect(service.updateAccount('user-abc-123', { adventureRank: 59 })).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
