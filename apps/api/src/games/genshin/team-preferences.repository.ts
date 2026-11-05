import { teamPreferencesScopeSchema } from '@celestia/api-contracts';
import { Prisma, type PrismaClient } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/core/db/prisma.js';

export type TeamPreferenceScope = z.infer<typeof teamPreferencesScopeSchema>;
export type TeamPreferenceRow = {
  userId: string;
  scopeKey: string;
  uid: string | null;
  accountId: string | null;
  revision: number;
  payload: unknown;
};

export class TeamPreferencesRevisionConflictError extends Error {
  constructor() {
    super('Preferences changed. Refresh before saving.');
    this.name = 'TeamPreferencesRevisionConflictError';
  }
}

export function teamPreferencesScopeKey({ uid, accountId }: TeamPreferenceScope) {
  return accountId ? `account:${accountId}` : `uid:${uid}`;
}

/** Owns all persistence and atomic revision operations for authenticated preferences. */
export class GenshinTeamPreferencesRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  find(userId: string, scopeKey: string): Promise<TeamPreferenceRow | null> {
    return this.db.genshinTeamPreferences.findUnique({
      where: { userId_scopeKey: { userId, scopeKey } },
    });
  }

  findAccount(accountId: string, userId: string): Promise<{ uid: string | null } | null> {
    return this.db.genshinAccount.findFirst({
      where: { id: accountId, userId },
      select: { uid: true },
    });
  }

  async create(
    userId: string,
    scope: TeamPreferenceScope,
    payload: Prisma.InputJsonValue,
  ): Promise<void> {
    try {
      await this.db.genshinTeamPreferences.create({
        data: {
          userId,
          scopeKey: teamPreferencesScopeKey(scope),
          uid: scope.uid,
          accountId: scope.accountId,
          revision: 1,
          payload,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new TeamPreferencesRevisionConflictError();
      throw error;
    }
  }

  async update(
    userId: string,
    scope: TeamPreferenceScope,
    expectedRevision: number,
    payload: Prisma.InputJsonValue,
  ): Promise<void> {
    const updated = await this.db.genshinTeamPreferences.updateMany({
      where: {
        userId,
        scopeKey: teamPreferencesScopeKey(scope),
        revision: expectedRevision,
      },
      data: { payload, revision: { increment: 1 } },
    });
    if (updated.count !== 1) throw new TeamPreferencesRevisionConflictError();
  }

  findOrThrow(userId: string, scopeKey: string): Promise<TeamPreferenceRow> {
    return this.db.genshinTeamPreferences.findUniqueOrThrow({
      where: { userId_scopeKey: { userId, scopeKey } },
    });
  }
}
