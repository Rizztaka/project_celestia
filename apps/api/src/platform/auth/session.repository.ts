import type { Session } from '@prisma/client';

import { prisma } from '@/core/db/prisma.js';

export class SessionRepository {
  async create(
    data: Pick<Session, 'userId' | 'tokenHash' | 'userAgent' | 'ipAddress' | 'expiresAt'>,
    credential?: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const [user] = await tx.$queryRaw<
        { password: string }[]
      >`SELECT password FROM users WHERE id=${data.userId} FOR UPDATE`;
      if (!user || (credential !== undefined && user.password !== credential)) return null;
      const active = await tx.session.findMany({
        where: { userId: data.userId, revokedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
        skip: 99,
      });
      if (active.length)
        await tx.session.updateMany({
          where: { id: { in: active.map((session) => session.id) } },
          data: { revokedAt: new Date() },
        });
      return tx.session.create({ data });
    });
  }
  async rotate(hash: string, nextHash: string, now: Date, expiresAt: Date) {
    // History is retained so a rotated token still identifies its owner.
    const current = await prisma.session.findUnique({ where: { tokenHash: hash } });
    const previous = current
      ? null
      : await prisma.rotatedRefreshToken.findUnique({
          where: { tokenHash: hash },
          include: { session: true },
        });
    const candidate = current ?? previous?.session;
    if (!candidate) return null;
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id=${candidate.userId} FOR UPDATE`;
      const session = await tx.session.findUnique({ where: { id: candidate.id } });
      if (!session) return null;
      if (session.tokenHash !== hash) {
        // Return after committing revocations; throwing here would roll them back.
        await tx.session.updateMany({
          where: { userId: session.userId, revokedAt: null },
          data: { revokedAt: now },
        });
        return null;
      }
      if (session.revokedAt || session.expiresAt <= now) return null;
      await tx.rotatedRefreshToken.create({
        data: { tokenHash: hash, sessionId: session.id, expiresAt: session.expiresAt },
      });
      return tx.session.update({
        where: { id: session.id },
        data: { tokenHash: nextHash, expiresAt },
      });
    });
  }
  async revoke(userId: string, now: Date, options: { only?: string; except?: string } = {}) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id=${userId} FOR UPDATE`;
      return tx.session.updateMany({
        where: {
          userId,
          revokedAt: null,
          ...(options.only
            ? { id: options.only }
            : options.except
              ? { id: { not: options.except } }
              : {}),
        },
        data: { revokedAt: now },
      });
    });
  }
  list(userId: string, now: Date) {
    return prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: now } },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
