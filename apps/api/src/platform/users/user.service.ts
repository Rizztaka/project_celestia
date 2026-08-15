import { UserRepository } from './user.repository.js';
import type { User } from '@prisma/client';
import type { CreateUserInput } from '@celestia/api-contracts';
import { ConflictError, NotFoundError } from '@/core/errors/app-error.js';

/**
 * A User with the password field removed.
 * Used as the return type for any method that surfaces user data to callers.
 * Defined here rather than imported from auth.service.ts to avoid a
 * circular module dependency (auth depends on users; users must not depend on auth).
 */
export type SafeUser = Omit<User, 'password'>;

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async createUser(data: CreateUserInput) {
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

    // If all rules pass, save to the database
    return this.userRepository.create(data);
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
