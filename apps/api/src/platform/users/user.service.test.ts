import type { User } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConflictError, NotFoundError } from '@/core/errors/app-error.js';

import { UserRepository } from './user.repository.js';
import { type CreateUserWithHashInput, UserService } from './user.service.js';

// ============================================================
// Mock the entire UserRepository module.
// This ensures UserService's business logic is tested in isolation
// — no real database connections are made during unit tests.
// ============================================================

vi.mock('./user.repository.js');

// ============================================================
// Helpers
// ============================================================

const mockUser: User = {
  id: 'test-user-id',
  email: 'rizzler@celestia.dev',
  username: 'rizzler',
  password: '$2a$12$hashedpasswordvalue.stored.in.db',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

/**
 * Valid input for createUser.
 * `passwordHash` must be a pre-computed hash — plain passwords are rejected
 * by the TypeScript type and are never accepted by UserService.
 */
const validHashedInput: CreateUserWithHashInput = {
  email: 'rizzler@celestia.dev',
  username: 'rizzler',
  passwordHash: '$2a$12$hashedpasswordvalue.stored.in.db',
};

// ============================================================
// Tests
// ============================================================

describe('UserService', () => {
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
    vi.mocked(UserRepository).mockImplementation(() => mockRepository as unknown as UserRepository);

    userService = new UserService();
  });

  // ----------------------------------------------------------
  // createUser
  // ----------------------------------------------------------

  describe('createUser', () => {
    it('creates and returns a user when email and username are unique', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.findByUsername.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockUser);

      const result = await userService.createUser(validHashedInput);

      expect(result).toEqual(mockUser);
      // Repository receives the CreateUserWithHashInput — it handles the mapping
      expect(mockRepository.create).toHaveBeenCalledWith(validHashedInput);
    });

    it('throws ConflictError when the email is already registered', async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(userService.createUser(validHashedInput)).rejects.toThrow(ConflictError);
      await expect(userService.createUser(validHashedInput)).rejects.toThrow(
        'Email is already registered.',
      );
    });

    it('throws ConflictError when the username is already taken', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.findByUsername.mockResolvedValue(mockUser);

      await expect(userService.createUser(validHashedInput)).rejects.toThrow(ConflictError);
      await expect(userService.createUser(validHashedInput)).rejects.toThrow(
        'Username is already taken.',
      );
    });

    it('does not call create when email is already taken', async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(userService.createUser(validHashedInput)).rejects.toThrow();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------
  // getUserById
  // ----------------------------------------------------------

  describe('getUserById', () => {
    it('returns the user without the password field', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById('test-user-id');

      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.username).toBe(mockUser.username);
      expect(mockRepository.findById).toHaveBeenCalledWith('test-user-id');
    });

    it('throws NotFoundError when the user does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById('nonexistent-id')).rejects.toThrow(NotFoundError);
      await expect(userService.getUserById('nonexistent-id')).rejects.toThrow('User not found.');
    });
  });

  // ----------------------------------------------------------
  // getOwnProfile (Platform Account Security milestone)
  //
  // Ownership is enforced BEFORE any DB lookup so that no information
  // about the target leaks through timing or error differentiation.
  // ----------------------------------------------------------

  describe('getOwnProfile', () => {
    it('returns the safe profile when requester and target IDs match', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getOwnProfile('test-user-id', 'test-user-id');

      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(mockUser.id);
      expect(mockRepository.findById).toHaveBeenCalledWith('test-user-id');
    });

    it('throws NotFoundError when requester ID differs from target ID (foreign profile)', async () => {
      await expect(
        userService.getOwnProfile('requester-id', 'different-target-id'),
      ).rejects.toThrow(NotFoundError);
      await expect(
        userService.getOwnProfile('requester-id', 'different-target-id'),
      ).rejects.toThrow('User not found.');
    });

    it('does NOT call findById when the requester is requesting a foreign profile', async () => {
      await userService.getOwnProfile('requester-id', 'different-target-id').catch(() => undefined); // suppress the expected error

      // Ownership check short-circuits before any DB access
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when the own profile does not exist in the database', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(userService.getOwnProfile('test-user-id', 'test-user-id')).rejects.toThrow(
        NotFoundError,
      );
      await expect(userService.getOwnProfile('test-user-id', 'test-user-id')).rejects.toThrow(
        'User not found.',
      );
    });
  });
});
