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
  async subjectExists(id: string, sessionId?: string): Promise<boolean> {
    if (!sessionId) return false;
    return (
      (await prisma.user.findUnique({ where: { id }, select: { id: true } }))?.id === id &&
      !!(await prisma.session.findFirst({
        where: { id: sessionId, userId: id, revokedAt: null, expiresAt: { gt: new Date() } },
        select: { id: true },
      }))
    );
  }
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }
}
