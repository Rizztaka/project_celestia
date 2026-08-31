import type { User } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConflictError, UnauthorizedError } from '@/core/errors/app-error.js';

import { UserService } from '../users/user.service.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';

// ============================================================
// Module Mocks
//
// bcryptjs and jsonwebtoken are mocked so tests are:
//   - Fast (no actual hashing — bcrypt is intentionally slow)
//   - Deterministic (tokens and hashes have predictable values)
//   - Isolated (no external dependencies)
// ============================================================

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock.jwt.token'),
  },
}));

vi.mock('./auth.repository.js');
vi.mock('../users/user.service.js');

// ============================================================
// Helpers
// ============================================================

const mockUser: User = {
  id: 'user-abc-123',
  email: 'traveler@celestia.dev',
  username: 'traveler',
  password: '$2a$12$hashedpasswordvalue',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

// What gets returned to clients — password is stripped
const mockSafeUser = {
  id: mockUser.id,
  email: mockUser.email,
  username: mockUser.username,
  createdAt: mockUser.createdAt,
  updatedAt: mockUser.updatedAt,
};

// ============================================================
// Tests
// ============================================================

describe('AuthService', () => {
  let authService: AuthService;
  let mockAuthRepository: { findByEmail: ReturnType<typeof vi.fn> };
  let mockUserService: { createUser: ReturnType<typeof vi.fn> };

  // Import mocked modules once — we reference them to configure return values
  let bcrypt: { hash: ReturnType<typeof vi.fn>; compare: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Resolve the mocked bcryptjs module
    const bcryptModule = await import('bcryptjs');
    bcrypt = bcryptModule.default as unknown as typeof bcrypt;

    // Build typed mocks for repositories and services
    mockAuthRepository = { findByEmail: vi.fn() };
    mockUserService = { createUser: vi.fn() };

    vi.mocked(AuthRepository).mockImplementation(
      () => mockAuthRepository as unknown as AuthRepository,
    );

    vi.mocked(UserService).mockImplementation(() => mockUserService as unknown as UserService);

    authService = new AuthService();
  });

  // ----------------------------------------------------------
  // register
  // ----------------------------------------------------------

  describe('register', () => {
    const registerInput = {
      email: 'traveler@celestia.dev',
      username: 'traveler',
      password: 'plainpassword',
    };

    it('returns safeUser and token on successful registration', async () => {
      bcrypt.hash.mockResolvedValue('hashed_password');
      mockUserService.createUser.mockResolvedValue(mockUser);

      const result = await authService.register(registerInput);

      expect(result.token).toBe('mock.jwt.token');
      expect(result.user).toEqual(mockSafeUser);
      // Verify the password was NEVER sent back to the client
      expect(result.user).not.toHaveProperty('password');
    });

    it('hashes the password before calling UserService', async () => {
      bcrypt.hash.mockResolvedValue('hashed_password');
      mockUserService.createUser.mockResolvedValue(mockUser);

      await authService.register(registerInput);

      expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', 12);
      expect(mockUserService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashed_password' }),
      );
    });

    it('propagates ConflictError when email is already registered', async () => {
      bcrypt.hash.mockResolvedValue('hashed_password');
      mockUserService.createUser.mockRejectedValue(
        new ConflictError('Email is already registered.'),
      );

      await expect(authService.register(registerInput)).rejects.toThrow(ConflictError);
    });

    it('propagates ConflictError when username is already taken', async () => {
      bcrypt.hash.mockResolvedValue('hashed_password');
      mockUserService.createUser.mockRejectedValue(new ConflictError('Username is already taken.'));

      await expect(authService.register(registerInput)).rejects.toThrow(ConflictError);
    });
  });

  // ----------------------------------------------------------
  // login
  // ----------------------------------------------------------

  describe('login', () => {
    const loginInput = {
      email: 'traveler@celestia.dev',
      password: 'correctpassword',
    };

    it('returns safeUser and token on successful login', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const result = await authService.login(loginInput);

      expect(result.token).toBe('mock.jwt.token');
      expect(result.user).toEqual(mockSafeUser);
      expect(result.user).not.toHaveProperty('password');
    });

    it('throws UnauthorizedError when the email is not found', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginInput)).rejects.toThrow(UnauthorizedError);
      // Confirm the generic message — prevents email enumeration
      await expect(authService.login(loginInput)).rejects.toThrow('Invalid email or password.');
    });

    it('throws UnauthorizedError when the password is incorrect', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.login(loginInput)).rejects.toThrow(UnauthorizedError);
      await expect(authService.login(loginInput)).rejects.toThrow('Invalid email or password.');
    });

    it('uses the same error message for wrong-email and wrong-password (anti-enumeration)', async () => {
      // Test that both paths produce identical messages
      // This prevents attackers from discovering valid emails
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      const notFoundError = await authService.login(loginInput).catch((e: Error) => e.message);

      mockAuthRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);
      const wrongPasswordError = await authService.login(loginInput).catch((e: Error) => e.message);

      expect(notFoundError).toBe(wrongPasswordError);
    });
  });
});
