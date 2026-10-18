import { prisma } from '@/core/db/prisma.js';

export type EmailTokenKind = 'reset' | 'verification';
export class PasswordResetRepository {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }
  issue(userId: string, tokenHash: string, expiresAt: Date, now: Date, kind: EmailTokenKind) {
    return prisma.$transaction(async (tx) => {
      const users = await tx.$queryRaw`SELECT id FROM users WHERE id=${userId} FOR UPDATE`;
      if (!Array.isArray(users) || !users.length) return;
      // These tables deliberately share the same scalar shape and user relation.
      const table = (
        kind === 'reset' ? tx.passwordResetToken : tx.emailVerificationToken
      ) as typeof tx.passwordResetToken;
      await table.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } });
      await table.create({ data: { userId, tokenHash, expiresAt } });
    });
  }
  async consume(tokenHash: string, now: Date, kind: EmailTokenKind, password?: string) {
    const table = (
      kind === 'reset' ? prisma.passwordResetToken : prisma.emailVerificationToken
    ) as typeof prisma.passwordResetToken;
    const candidate = await table.findUnique({ where: { tokenHash } });
    if (!candidate) return false;
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id=${candidate.userId} FOR UPDATE`;
      const tokens = (
        kind === 'reset' ? tx.passwordResetToken : tx.emailVerificationToken
      ) as typeof tx.passwordResetToken;
      const consumed = await tokens.updateMany({
        where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (consumed.count !== 1) return false;
      if (kind === 'reset') {
        await tx.user.update({ where: { id: candidate.userId }, data: { password: password! } });
        await tx.session.updateMany({
          where: { userId: candidate.userId, revokedAt: null },
          data: { revokedAt: now },
        });
      } else {
        await tx.user.update({ where: { id: candidate.userId }, data: { emailVerifiedAt: now } });
      }
      await tokens.updateMany({
        where: { userId: candidate.userId, usedAt: null },
        data: { usedAt: now },
      });
      return true;
    });
  }
}
