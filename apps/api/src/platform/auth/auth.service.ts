import type { LoginInput, RegisterInput } from '@celestia/api-contracts';
import type { User } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { UnauthorizedError } from '@/core/errors/app-error.js';

import type { SafeUser } from '../users/user.service.js';
import { UserService } from '../users/user.service.js';
import { AuthRepository } from './auth.repository.js';
import { type DeviceInfo, SessionService } from './session.service.js';

// ============================================================
// Types
// ============================================================

// SafeUser is defined in user.service.ts — the domain that owns the User
// entity. Re-exported from there to keep the definition in one place.
export type { SafeUser };

export interface AuthResult {
  user: SafeUser;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================================
// Constants
// ============================================================

/**
 * bcrypt cost factor. 12 is a good default: expensive enough to
 * resist brute-force attacks, fast enough not to degrade API response times.
 * Raise to 13-14 on dedicated hardware if performance allows.
 */
const SALT_ROUNDS = 12;

// ============================================================
// Service
// ============================================================

export class AuthService {
  private sessions = new SessionService();
  private authRepository: AuthRepository;
  private userService: UserService;

  constructor() {
    this.authRepository = new AuthRepository();
    // Cross-module communication via the users domain's public interface.
    // AuthService never imports UserRepository directly — it delegates all
    // user-creation business rules to UserService (uniqueness checks, etc.).
    this.userService = new UserService();
  }

  /**
   * Registers a new user.
   *
   * Password hashing is an auth concern, so it happens here before
   * delegating to UserService. UserService handles uniqueness enforcement
   * (email, username) and will throw ConflictError if violated.
   */
  async register(data: RegisterInput, device: DeviceInfo = {}): Promise<AuthResult> {
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await this.userService.createUser({
      email: data.email,
      username: data.username,
      passwordHash: hashedPassword, // explicit: already hashed exactly once above
    });

    const tokens = await this.sessions.create(user.id, device, user.password);
    const safeUser = this.stripPassword(user);

    return { user: safeUser, ...tokens };
  }

  /**
   * Authenticates an existing user by email and password.
   *
   * Both "user not found" and "wrong password" produce the same error message
   * to prevent email-enumeration attacks.
   */
  async login(data: LoginInput, device: DeviceInfo = {}): Promise<AuthResult> {
    const user = await this.authRepository.findByEmail(data.email);

    const isPasswordValid = await bcrypt.compare(
      data.password,
      user?.password ?? '$2b$12$C6UzMDM.H6dfI/f/IKcEe.5W6zOXwvbeStW5SAoFhuLhUmWzjDxVS',
    );

    if (!user || !isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const tokens = await this.sessions.create(user.id, device, user.password);
    const safeUser = this.stripPassword(user);

    return { user: safeUser, ...tokens };
  }

  // ============================================================
  // Private helpers
  // ============================================================

  /**
   * Returns the user object without the password hash.
   * This is called before every response — passwords never leave the server.
   */
  private stripPassword(user: User): SafeUser {
    // Omit the password hash while preserving every other profile field.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }
}
