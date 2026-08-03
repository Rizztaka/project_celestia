import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { User } from "@prisma/client";
import { env } from "@/core/config/env.js";
import { UnauthorizedError } from "@/core/errors/app-error.js";
import { AuthRepository } from "./auth.repository.js";
import { UserService } from "../users/user.service.js";
import type { SafeUser } from "../users/user.service.js";
import type { RegisterInput, LoginInput } from "@celestia/api-contracts";

// ============================================================
// Types
// ============================================================

// SafeUser is defined in user.service.ts — the domain that owns the User
// entity. Re-exported from there to keep the definition in one place.
export type { SafeUser };

export interface AuthResult {
  user: SafeUser;
  token: string;
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
  async register(data: RegisterInput): Promise<AuthResult> {
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await this.userService.createUser({
      email: data.email,
      username: data.username,
      password: hashedPassword,
    });

    const token = this.generateToken(user.id);
    const safeUser = this.stripPassword(user);

    return { user: safeUser, token };
  }

  /**
   * Authenticates an existing user by email and password.
   *
   * Both "user not found" and "wrong password" produce the same error message
   * to prevent email-enumeration attacks.
   */
  async login(data: LoginInput): Promise<AuthResult> {
    const user = await this.authRepository.findByEmail(data.email);

    if (!user) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const token = this.generateToken(user.id);
    const safeUser = this.stripPassword(user);

    return { user: safeUser, token };
  }

  // ============================================================
  // Private helpers
  // ============================================================

  /**
   * Signs a JWT with the user's ID as the subject claim.
   * Uses the HS256 algorithm (symmetric, suitable for a single-service backend).
   */
  private generateToken(userId: string): string {
    return jwt.sign({ sub: userId }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRY as jwt.SignOptions["expiresIn"],
    });
  }

  /**
   * Returns the user object without the password hash.
   * This is called before every response — passwords never leave the server.
   */
  private stripPassword(user: User): SafeUser {
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }
}
