import type { GenshinAccount } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BadRequestError } from '@/core/errors/app-error.js';

import { GenshinImportService } from './importer.service.js';

// ============================================================
// Transaction context mock
//
// All operations inside prisma.$transaction receive this object
// as their `tx` argument. We define it here so tests can configure
// return values per-scenario.
// ============================================================

const mockTx = {
  genshinCharacter: {
    updateMany: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  genshinWeapon: {
    deleteMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
  },
  genshinArtifact: {
    deleteMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
  },
  genshinMaterial: {
    deleteMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
  },
};

// ============================================================
// Module-level mocks
// ============================================================

vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    genshinAccount: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    // $transaction executes the interactive callback immediately with mockTx.
    // This lets us test the inner logic without a real database.
    $transaction: vi
      .fn()
      .mockImplementation((callback: (tx: typeof mockTx) => Promise<unknown>) => callback(mockTx)),
  },
}));

// ============================================================
// Helpers
// ============================================================

const mockAccount: GenshinAccount = {
  id: 'account-abc-123',
  userId: 'user-abc-123',
  uid: null,
  nickname: null,
  adventureRank: null,
  worldLevel: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const VALID_GOOD_PAYLOAD = JSON.stringify({
  format: 'GOOD',
  version: 2,
  source: 'Genshin Optimizer',
  characters: [
    {
      key: 'HuTao',
      level: 90,
      constellation: 1,
      ascension: 6,
      talent: { auto: 6, skill: 9, burst: 9 },
    },
  ],
  weapons: [
    {
      key: 'StaffOfHoma',
      level: 90,
      ascension: 6,
      refinement: 1,
      location: 'HuTao',
      lock: false,
    },
  ],
  artifacts: [
    {
      setKey: 'ShimenawasReminiscence',
      slotKey: 'goblet',
      level: 20,
      rarity: 5,
      mainStatKey: 'pyro_dmg_',
      lock: false,
      location: 'HuTao',
      substats: [
        { key: 'critRate_', value: 6.6 },
        { key: 'critDMG_', value: 13.2 },
      ],
    },
  ],
});

const EMPTY_GOOD_PAYLOAD = JSON.stringify({
  format: 'GOOD',
  version: 2,
  characters: [],
  weapons: [],
  artifacts: [],
});

// ============================================================
// Test setup
// ============================================================

// Import prisma after mocking so we get the mocked version
const { prisma } = await import('@/core/db/prisma.js');

describe('GenshinImportService', () => {
  let service: GenshinImportService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: no existing account
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.genshinAccount.create).mockResolvedValue(mockAccount);

    // Default transaction internals
    mockTx.genshinCharacter.updateMany.mockResolvedValue({ count: 0 });
    mockTx.genshinWeapon.deleteMany.mockResolvedValue({ count: 0 });
    mockTx.genshinArtifact.deleteMany.mockResolvedValue({ count: 0 });
    mockTx.genshinMaterial.deleteMany.mockResolvedValue({ count: 0 });
    mockTx.genshinWeapon.createMany.mockResolvedValue({ count: 1 });
    mockTx.genshinArtifact.createMany.mockResolvedValue({ count: 1 });
    mockTx.genshinMaterial.createMany.mockResolvedValue({ count: 0 });
    mockTx.genshinCharacter.upsert.mockResolvedValue({
      id: 'char-abc-123',
      accountId: mockAccount.id,
      characterKey: 'HuTao',
      level: 90,
      ascension: 6,
      constellation: 1,
      talentNormal: 6,
      talentSkill: 9,
      talentBurst: 9,
      equippedWeaponId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockTx.genshinWeapon.create.mockResolvedValue({
      id: 'weapon-abc-123',
      accountId: mockAccount.id,
      weaponKey: 'StaffOfHoma',
      level: 90,
      ascension: 6,
      refinement: 1,
      locked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockTx.genshinArtifact.create.mockResolvedValue({
      id: 'artifact-abc-123',
      accountId: mockAccount.id,
      setKey: 'ShimenawasReminiscence',
      slotKey: 'goblet',
      level: 20,
      rarity: 5,
      mainStatKey: 'pyro_dmg_',
      subStats: [],
      locked: false,
      equippedCharacterId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockTx.genshinCharacter.update.mockResolvedValue({});
    mockTx.genshinArtifact.update.mockResolvedValue({});

    service = new GenshinImportService();
  });

  // ----------------------------------------------------------
  // Validation
  // ----------------------------------------------------------

  describe('validation', () => {
    it('throws BadRequestError when input is not valid JSON', async () => {
      await expect(service.importAccount('user-abc-123', '{ this is not json }')).rejects.toThrow(
        BadRequestError,
      );

      await expect(service.importAccount('user-abc-123', '{ this is not json }')).rejects.toThrow(
        'not valid JSON',
      );

      // No DB calls should have been made
      expect(prisma.genshinAccount.findUnique).not.toHaveBeenCalled();
    });

    it("throws BadRequestError when JSON is valid but format is not 'GOOD'", async () => {
      const wrongFormat = JSON.stringify({ format: 'NOTGOOD', version: 1 });

      await expect(service.importAccount('user-abc-123', wrongFormat)).rejects.toThrow(
        BadRequestError,
      );

      expect(prisma.genshinAccount.findUnique).not.toHaveBeenCalled();
    });

    it('throws BadRequestError when artifact has an invalid slotKey', async () => {
      const invalidSlot = JSON.stringify({
        format: 'GOOD',
        version: 2,
        artifacts: [
          {
            setKey: 'GladiatorsFinale',
            slotKey: 'invalidSlot', // not in the enum
            level: 20,
            rarity: 5,
            mainStatKey: 'atk',
            substats: [],
          },
        ],
      });

      await expect(service.importAccount('user-abc-123', invalidSlot)).rejects.toThrow(
        BadRequestError,
      );
    });
  });

  // ----------------------------------------------------------
  // Account creation
  // ----------------------------------------------------------

  describe('account management', () => {
    it('creates a new GenshinAccount when the user has none', async () => {
      vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValue(null);

      await service.importAccount('user-abc-123', VALID_GOOD_PAYLOAD);

      expect(prisma.genshinAccount.create).toHaveBeenCalledOnce();
    });

    it('uses the existing account when the user already has one', async () => {
      vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValue(mockAccount);

      await service.importAccount('user-abc-123', VALID_GOOD_PAYLOAD);

      expect(prisma.genshinAccount.create).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------
  // Import algorithm
  // ----------------------------------------------------------

  describe('import algorithm', () => {
    it('clears equippedWeaponId on characters before deleting weapons', async () => {
      await service.importAccount('user-abc-123', VALID_GOOD_PAYLOAD);

      // updateMany (clear weapon FKs) must be called BEFORE deleteMany (weapons)
      const updateManyOrder = vi.mocked(mockTx.genshinCharacter.updateMany).mock
        .invocationCallOrder[0];
      const deleteManyOrder = vi.mocked(mockTx.genshinWeapon.deleteMany).mock
        .invocationCallOrder[0];

      expect(updateManyOrder).toBeLessThan(deleteManyOrder!);
    });

    it('upserts characters using the accountId_characterKey index', async () => {
      await service.importAccount('user-abc-123', VALID_GOOD_PAYLOAD);

      expect(mockTx.genshinCharacter.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            accountId_characterKey: {
              accountId: mockAccount.id,
              characterKey: 'HuTao',
            },
          },
        }),
      );
    });

    it('maps GOOD talent field names to database field names correctly', async () => {
      await service.importAccount('user-abc-123', VALID_GOOD_PAYLOAD);

      expect(mockTx.genshinCharacter.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            talentNormal: 6, // from talent.auto
            talentSkill: 9, // from talent.skill
            talentBurst: 9, // from talent.burst
          }),
        }),
      );
    });

    it('maps GOOD lock field to database locked field', async () => {
      await service.importAccount('user-abc-123', VALID_GOOD_PAYLOAD);

      // Production uses createMany with a pre-generated UUID batch; validate
      // the first element in the data array contains the expected locked flag.
      expect(mockTx.genshinWeapon.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([expect.objectContaining({ locked: false })]),
        }),
      );
    });

    it('resolves weapon location to equippedWeaponId on the character', async () => {
      await service.importAccount('user-abc-123', VALID_GOOD_PAYLOAD);

      // The character should have been updated with the weapon's DB id.
      // The weapon ID is a randomUUID() generated at import time, so we
      // check the shape rather than the exact value.
      expect(mockTx.genshinCharacter.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'char-abc-123' },
          data: { equippedWeaponId: expect.any(String) },
        }),
      );
    });

    it('resolves artifact location to equippedCharacterId on the artifact', async () => {
      await service.importAccount('user-abc-123', VALID_GOOD_PAYLOAD);

      // The artifact ID is a randomUUID() generated at import time, so we
      // check the shape rather than the exact value.
      expect(mockTx.genshinArtifact.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: expect.any(String) },
          data: { equippedCharacterId: 'char-abc-123' },
        }),
      );
    });

    it('returns the correct import summary', async () => {
      const result = await service.importAccount('user-abc-123', VALID_GOOD_PAYLOAD);

      expect(result).toEqual({
        charactersImported: 1,
        weaponsImported: 1,
        artifactsImported: 1,
        materialsImported: 0, // VALID_GOOD_PAYLOAD has no materials block
      });
    });
  });

  // ----------------------------------------------------------
  // Edge cases
  // ----------------------------------------------------------

  describe('edge cases', () => {
    it('handles an empty payload without errors and returns zeros', async () => {
      const result = await service.importAccount('user-abc-123', EMPTY_GOOD_PAYLOAD);

      expect(result).toEqual({
        charactersImported: 0,
        weaponsImported: 0,
        artifactsImported: 0,
        materialsImported: 0,
      });
    });

    it('leaves weapon unequipped when location references a character not in the payload', async () => {
      const payloadWithUnknownLocation = JSON.stringify({
        format: 'GOOD',
        version: 2,
        characters: [], // HuTao is NOT in the payload
        weapons: [
          {
            key: 'StaffOfHoma',
            level: 90,
            ascension: 6,
            refinement: 1,
            location: 'HuTao', // refers to a character not exported
            lock: false,
          },
        ],
        artifacts: [],
      });

      await service.importAccount('user-abc-123', payloadWithUnknownLocation);

      // Weapon was bulk-inserted but character update for equipping was NOT called
      expect(mockTx.genshinWeapon.createMany).toHaveBeenCalledOnce();
      expect(mockTx.genshinCharacter.update).not.toHaveBeenCalled();
    });

    it('leaves artifact unequipped when location references a character not in the payload', async () => {
      const payloadWithUnknownLocation = JSON.stringify({
        format: 'GOOD',
        version: 2,
        characters: [],
        weapons: [],
        artifacts: [
          {
            setKey: 'ShimenawasReminiscence',
            slotKey: 'goblet',
            level: 20,
            rarity: 5,
            mainStatKey: 'pyro_dmg_',
            lock: false,
            location: 'HuTao', // character not in payload
            substats: [],
          },
        ],
      });

      await service.importAccount('user-abc-123', payloadWithUnknownLocation);

      // Artifact was bulk-inserted but the equip update was NOT called
      expect(mockTx.genshinArtifact.createMany).toHaveBeenCalledOnce();
      expect(mockTx.genshinArtifact.update).not.toHaveBeenCalled();
    });
  });
});
