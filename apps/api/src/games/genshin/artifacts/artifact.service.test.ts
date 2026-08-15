import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenshinArtifactService } from './artifact.service.js';
import { GenshinArtifactRepository } from './artifact.repository.js';
import { NotFoundError } from '@/core/errors/app-error.js';
import type { GenshinArtifact } from '@prisma/client';

vi.mock('./artifact.repository.js');

// -------------------------------------------------------
// Fixtures
// -------------------------------------------------------

const ACCOUNT_ID = 'account-abc-123';
const OTHER_ACCOUNT_ID = 'account-xyz-999';

const mockArtifact: GenshinArtifact = {
  id: 'artifact-abc-123',
  accountId: ACCOUNT_ID,
  setKey: 'ShimenawasReminiscence',
  slotKey: 'goblet',
  level: 20,
  rarity: 5,
  mainStatKey: 'pyro_dmg_',
  subStats: [
    { key: 'critRate_', value: 6.6 },
    { key: 'critDMG_', value: 13.2 },
    { key: 'atk_', value: 5.8 },
    { key: 'hp', value: 299 },
  ],
  locked: false,
  equippedCharacterId: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const addInput = {
  setKey: 'ShimenawasReminiscence',
  slotKey: 'goblet',
  level: 20,
  rarity: 5,
  mainStatKey: 'pyro_dmg_',
  subStats: [
    { key: 'critRate_', value: 6.6 },
    { key: 'critDMG_', value: 13.2 },
    { key: 'atk_', value: 5.8 },
    { key: 'hp', value: 299 },
  ],
};

// -------------------------------------------------------
// Tests
// -------------------------------------------------------

describe('GenshinArtifactService', () => {
  let service: GenshinArtifactService;
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

    vi.mocked(GenshinArtifactRepository).mockImplementation(
      () => mockRepo as unknown as GenshinArtifactRepository,
    );

    service = new GenshinArtifactService();
  });

  // ---------------------------------------------------
  // addArtifact
  // ---------------------------------------------------

  describe('addArtifact', () => {
    it('creates and returns the artifact, unequipped by default', async () => {
      mockRepo.create.mockResolvedValue(mockArtifact);

      const result = await service.addArtifact(ACCOUNT_ID, addInput);

      expect(result).toEqual(mockArtifact);
      expect(result.equippedCharacterId).toBeNull();
      expect(mockRepo.create).toHaveBeenCalledOnce();
    });

    it('allows multiple artifacts with the same setKey and slotKey', async () => {
      mockRepo.create.mockResolvedValue(mockArtifact);

      // A player can own many goblets from the same set
      await service.addArtifact(ACCOUNT_ID, addInput);
      await service.addArtifact(ACCOUNT_ID, addInput);

      expect(mockRepo.create).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------
  // getArtifacts
  // ---------------------------------------------------

  describe('getArtifacts', () => {
    it('returns all artifacts for the account', async () => {
      mockRepo.findByAccountId.mockResolvedValue([mockArtifact]);

      const result = await service.getArtifacts(ACCOUNT_ID);

      expect(result).toHaveLength(1);
      expect(result[0]?.setKey).toBe('ShimenawasReminiscence');
    });
  });

  // ---------------------------------------------------
  // getArtifactById
  // ---------------------------------------------------

  describe('getArtifactById', () => {
    it('returns the artifact when it belongs to the account', async () => {
      mockRepo.findById.mockResolvedValue(mockArtifact);

      const result = await service.getArtifactById(ACCOUNT_ID, mockArtifact.id);

      expect(result).toEqual(mockArtifact);
    });

    it('throws NotFoundError when artifact does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getArtifactById(ACCOUNT_ID, 'nonexistent-id')).rejects.toThrow(
        NotFoundError,
      );
    });

    it('throws NotFoundError when artifact belongs to a different account (cross-account guard)', async () => {
      mockRepo.findById.mockResolvedValue(mockArtifact); // accountId = ACCOUNT_ID

      await expect(service.getArtifactById(OTHER_ACCOUNT_ID, mockArtifact.id)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  // ---------------------------------------------------
  // updateArtifact
  // ---------------------------------------------------

  describe('updateArtifact', () => {
    it('updates and returns the artifact', async () => {
      const updated = { ...mockArtifact, level: 16, locked: true };
      mockRepo.findById.mockResolvedValue(mockArtifact);
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.updateArtifact(ACCOUNT_ID, mockArtifact.id, {
        level: 16,
        locked: true,
      });

      expect(result.level).toBe(16);
      expect(result.locked).toBe(true);
    });

    it('throws NotFoundError when artifact does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateArtifact(ACCOUNT_ID, 'nonexistent-id', { level: 16 }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ---------------------------------------------------
  // removeArtifact
  // ---------------------------------------------------

  describe('removeArtifact', () => {
    it('deletes and returns the removed artifact', async () => {
      mockRepo.findById.mockResolvedValue(mockArtifact);
      mockRepo.delete.mockResolvedValue(mockArtifact);

      const result = await service.removeArtifact(ACCOUNT_ID, mockArtifact.id);

      expect(result).toEqual(mockArtifact);
      expect(mockRepo.delete).toHaveBeenCalledWith(mockArtifact.id);
    });

    it('throws NotFoundError when artifact does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.removeArtifact(ACCOUNT_ID, 'nonexistent-id')).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
