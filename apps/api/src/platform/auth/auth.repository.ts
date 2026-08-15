import type { User } from '@prisma/client';

import { prisma } from '@/core/db/prisma.js';

/**
 * AuthRepository is responsible only for data access operations
 * that belong to the authentication domain.
 *
 * Looking up a user by email for login is an auth concern, not a
 * user-management concern, so it lives here rather than in UserRepository.
 */
export class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }
}
