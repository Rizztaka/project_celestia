import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "./user.service.js";
import { UserRepository } from "./user.repository.js";
import { ConflictError, NotFoundError } from "@/core/errors/app-error.js";
import type { User } from "@prisma/client";

// ============================================================
// Mock the entire UserRepository module.
// This ensures UserService's business logic is tested in isolation
// — no real database connections are made during unit tests.
// ============================================================

vi.mock("./user.repository.js");

// ============================================================
// Helpers
// ============================================================

const mockUser: User = {
  id: "test-user-id",
  email: "rizzler@celestia.dev",
  username: "rizzler",
  password: "hashed_password_value",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const validInput = {
  email: "rizzler@celestia.dev",
  username: "rizzler",
  password: "securepassword123",
};

// ============================================================
// Tests
// ============================================================

describe("UserService", () => {
  let userService: UserService;
  let mockRepository: {
    findByEmail: ReturnType<typeof vi.fn>;
    findByUsername: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Build a typed mock of the repository methods
    mockRepository = {
      findByEmail: vi.fn(),
      findByUsername: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    };

    // Make the UserRepository constructor return our mock
    vi.mocked(UserRepository).mockImplementation(
      () => mockRepository as unknown as UserRepository,
    );

    userService = new UserService();
  });

  // ----------------------------------------------------------
  // createUser
  // ----------------------------------------------------------

  describe("createUser", () => {
    it("creates and returns a user when email and username are unique", async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.findByUsername.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockUser);

      const result = await userService.createUser(validInput);

      expect(result).toEqual(mockUser);
      expect(mockRepository.create).toHaveBeenCalledWith(validInput);
    });

    it("throws ConflictError when the email is already registered", async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(userService.createUser(validInput)).rejects.toThrow(
        ConflictError,
      );
      await expect(userService.createUser(validInput)).rejects.toThrow(
        "Email is already registered.",
      );
    });

    it("throws ConflictError when the username is already taken", async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.findByUsername.mockResolvedValue(mockUser);

      await expect(userService.createUser(validInput)).rejects.toThrow(
        ConflictError,
      );
      await expect(userService.createUser(validInput)).rejects.toThrow(
        "Username is already taken.",
      );
    });

    it("does not call create when email is already taken", async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(userService.createUser(validInput)).rejects.toThrow();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------
  // getUserById
  // ----------------------------------------------------------

  describe("getUserById", () => {
    it("returns the user without the password field", async () => {
      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById("test-user-id");

      expect(result).not.toHaveProperty("password");
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.username).toBe(mockUser.username);
      expect(mockRepository.findById).toHaveBeenCalledWith("test-user-id");
    });

    it("throws NotFoundError when the user does not exist", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById("nonexistent-id")).rejects.toThrow(
        NotFoundError,
      );
      await expect(userService.getUserById("nonexistent-id")).rejects.toThrow(
        "User not found.",
      );
    });
  });
});
