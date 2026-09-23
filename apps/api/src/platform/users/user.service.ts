import type { User } from '@prisma/client';

import { ConflictError, NotFoundError } from '@/core/errors/app-error.js';

import { UserRepository } from './user.repository.js';

// ============================================================
// Types
// ============================================================

/**
 * A User with the password field removed.
 * Used as the return type for any method that surfaces user data to callers.
 * Defined here rather than imported from auth.service.ts to avoid a
 * circular module dependency (auth depends on users; users must not depend on auth).
 */
export type SafeUser = Omit<User, 'password'>;

/**
 * Internal contract for creating a new user account.
 *
 * The field is named `passwordHash` (not `password`) to communicate at the
 * call site that the value is expected to be a pre-computed bcrypt hash.
 * This is a naming convention that makes the intent unambiguous during code
 * review; it does not prevent a caller from passing a plain-text string at
 * runtime.  The enforcement relies on AuthService being the sole caller of
 * `UserService.createUser`.
 *
 * The mapping from `passwordHash` to the Prisma schema's `password` column
 * happens at the persistence boundary inside UserRepository — it does not
 * leak into callers.
 */
export interface CreateUserWithHashInput {
  email: string;
  username: string;
  passwordHash: string;
}

// ============================================================
// Service
// ============================================================

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Creates a new user account.
   *
   * The caller (AuthService) is responsible for hashing the password
   * exactly once before passing it here.  The `passwordHash` field name
   * in `CreateUserWithHashInput` enforces this at the TypeScript level.
   *
   * Uniqueness enforcement (email, username) lives here because it is a
   * user-domain business rule, not an auth concern.
   */
  async createUser(data: CreateUserWithHashInput): Promise<User> {
    // Business Rule 1: Email must be unique
    const existingEmail = await this.userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('Email is already registered.');
    }

    // Business Rule 2: Username must be unique
    const existingUsername = await this.userRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new ConflictError('Username is already taken.');
    }

    // If all rules pass, persist via repository (maps passwordHash → password)
    return this.userRepository.create(data);
  }

  /**
   * Returns the safe profile for a user, enforcing self-only access.
   *
   * @param requesterId - The ID of the authenticated user making the request
   *                      (sourced from req.user.id — never from the URL).
   * @param targetId    - The ID requested in the URL parameter.
   *
   * If `requesterId !== targetId`, throws NotFoundError — the same error
   * returned for a nonexistent user.  This prevents foreign-ID enumeration:
   * an attacker cannot distinguish "user exists but you cannot see it" from
   * "user does not exist".
   *
   * The ownership check is evaluated BEFORE any database lookup so that no
   * information about the target leaks through timing or error differences.
   */
  async getOwnProfile(requesterId: string, targetId: string): Promise<SafeUser> {
    if (requesterId !== targetId) {
      throw new NotFoundError('User not found.');
    }
    return this.getUserById(targetId);
  }

  async getUserById(id: string): Promise<SafeUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found.');
    }
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }
}
