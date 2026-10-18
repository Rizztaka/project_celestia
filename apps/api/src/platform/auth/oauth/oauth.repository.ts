import { randomBytes } from 'node:crypto';

import type { OAuthProvider } from '@celestia/api-contracts';

import { prisma } from '@/core/db/prisma.js';
import { ConflictError, UnauthorizedError } from '@/core/errors/app-error.js';

export interface OAuthIdentity {
  id: string;
  email: string;
  username: string;
  verified: boolean;
}
export class OAuthRepository {
  async resolve(
    provider: OAuthProvider,
    identity: OAuthIdentity,
    password: string,
    link?: { userId: string; sessionId: string },
  ) {
    return prisma.$transaction(async (tx) => {
      if (link) {
        await tx.$queryRaw`SELECT id FROM users WHERE id=${link.userId} FOR UPDATE`;
        const session = await tx.session.findFirst({
          where: {
            id: link.sessionId,
            userId: link.userId,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
        });
        if (!session) throw new UnauthorizedError('Sign in again before connecting an account.');
      }
      const linked = await tx.oAuthAccount.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId: identity.id } },
        include: { user: true },
      });
      if (linked) {
        if (link && linked.userId !== link.userId)
          throw new ConflictError('This provider account is already connected.');
        return linked.user;
      }
      if (!identity.verified) throw new UnauthorizedError('A verified provider email is required.');
      let user = link
        ? await tx.user.findUnique({ where: { id: link.userId } })
        : await tx.user.findUnique({ where: { email: identity.email } });
      if (user && !link && !user.emailVerifiedAt)
        throw new ConflictError(
          'Sign in with your password, then connect this provider in your profile.',
        );
      if (!user) {
        const prefix = identity.username.replace(/[^A-Za-z0-9_]/g, '').slice(0, 18) || 'traveler';
        user = await tx.user.create({
          data: {
            email: identity.email,
            username: `${prefix}_${randomBytes(5).toString('hex')}`,
            password,
            emailVerifiedAt: new Date(),
          },
        });
      }
      await tx.oAuthAccount.create({
        data: { userId: user.id, provider, providerAccountId: identity.id },
      });
      return user;
    });
  }
}
