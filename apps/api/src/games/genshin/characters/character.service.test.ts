import { describe, it, expect, vi, beforeEach } from "vitest";
import { GenshinCharacterService } from "./character.service.js";
import { GenshinCharacterRepository } from "./character.repository.js";
import { ConflictError, NotFoundError } from "@/core/errors/app-error.js";
import type { GenshinCharacter } from "@prisma/client";

vi.mock("./character.repository.js");

// -------------------------------------------------------
// Fixtures
// -------------------------------------------------------

const ACCOUNT_ID = "account-abc-123";
const OTHER_ACCOUNT_ID = "account-xyz-999";

const mockCharacter: GenshinCharacter = {
  id: "char-abc-123",
  accountId: ACCOUNT_ID,
  characterKey: "hutao",
  level: 90,
  ascension: 6,
  constellation: 1,
  talentNormal: 6,
  talentSkill: 9,
  talentBurst: 9,
  equippedWeaponId: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const addInput = {
  characterKey: "hutao",
  level: 90,
  ascension: 6,
  constellation: 1,
  talentNormal: 6,
  talentSkill: 9,
  talentBurst: 9,
};

// -------------------------------------------------------
// Tests
// -------------------------------------------------------

describe("GenshinCharacterService", () => {
  let service: GenshinCharacterService;
  let mockRepo: {
    findByKey: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findByAccountId: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepo = {
      findByKey: vi.fn(),
      findById: vi.fn(),
      findByAccountId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    vi.mocked(GenshinCharacterRepository).mockImplementation(
      () => mockRepo as unknown as GenshinCharacterRepository,
    );

    service = new GenshinCharacterService();
  });

  // ---------------------------------------------------
  // addCharacter
  // ---------------------------------------------------

  describe("addCharacter", () => {
    it("creates and returns a new character", async () => {
      mockRepo.findByKey.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(mockCharacter);

      const result = await service.addCharacter(ACCOUNT_ID, addInput);

      expect(result).toEqual(mockCharacter);
      expect(mockRepo.create).toHaveBeenCalledOnce();
    });

    it("throws ConflictError when character already exists in the roster", async () => {
      mockRepo.findByKey.mockResolvedValue(mockCharacter);

      await expect(
        service.addCharacter(ACCOUNT_ID, addInput),
      ).rejects.toThrow(ConflictError);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------
  // getCharacters
  // ---------------------------------------------------

  describe("getCharacters", () => {
    it("returns all characters for the account", async () => {
      mockRepo.findByAccountId.mockResolvedValue([mockCharacter]);

      const result = await service.getCharacters(ACCOUNT_ID);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockCharacter);
    });

    it("returns an empty array when the account has no characters", async () => {
      mockRepo.findByAccountId.mockResolvedValue([]);

      const result = await service.getCharacters(ACCOUNT_ID);

      expect(result).toHaveLength(0);
    });
  });

  // ---------------------------------------------------
  // getCharacterById
  // ---------------------------------------------------

  describe("getCharacterById", () => {
    it("returns the character when it exists and belongs to the account", async () => {
      mockRepo.findById.mockResolvedValue(mockCharacter);

      const result = await service.getCharacterById(ACCOUNT_ID, mockCharacter.id);

      expect(result).toEqual(mockCharacter);
    });

    it("throws NotFoundError when character does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.getCharacterById(ACCOUNT_ID, "nonexistent-id"),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when character belongs to a different account (cross-account guard)", async () => {
      // The character exists but belongs to a different account —
      // we must not reveal its existence to the requesting account.
      mockRepo.findById.mockResolvedValue(mockCharacter); // accountId = ACCOUNT_ID

      await expect(
        service.getCharacterById(OTHER_ACCOUNT_ID, mockCharacter.id),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ---------------------------------------------------
  // updateCharacter
  // ---------------------------------------------------

  describe("updateCharacter", () => {
    it("updates and returns the character", async () => {
      const updated = { ...mockCharacter, level: 80 };
      mockRepo.findById.mockResolvedValue(mockCharacter);
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.updateCharacter(ACCOUNT_ID, mockCharacter.id, {
        level: 80,
      });

      expect(result.level).toBe(80);
    });

    it("throws NotFoundError when character does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateCharacter(ACCOUNT_ID, "nonexistent-id", { level: 80 }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ---------------------------------------------------
  // removeCharacter
  // ---------------------------------------------------

  describe("removeCharacter", () => {
    it("deletes and returns the removed character", async () => {
      mockRepo.findById.mockResolvedValue(mockCharacter);
      mockRepo.delete.mockResolvedValue(mockCharacter);

      const result = await service.removeCharacter(ACCOUNT_ID, mockCharacter.id);

      expect(result).toEqual(mockCharacter);
      expect(mockRepo.delete).toHaveBeenCalledWith(mockCharacter.id);
    });

    it("throws NotFoundError when character does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.removeCharacter(ACCOUNT_ID, "nonexistent-id"),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
