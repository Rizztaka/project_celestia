import { Prisma, type PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/core/db/prisma.js', () => ({ prisma: {} }));

import {
  GenshinTeamPreferencesRepository,
  TeamPreferencesRevisionConflictError,
} from './team-preferences.repository.js';

describe('GenshinTeamPreferencesRepository', () => {
  it('turns an atomic revision miss into a repository conflict', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    const db = { genshinTeamPreferences: { updateMany } } as unknown as PrismaClient;
    const repository = new GenshinTeamPreferencesRepository(db);

    await expect(
      repository.update('owner-a', { uid: '800000001', accountId: null }, 3, {}),
    ).rejects.toBeInstanceOf(TeamPreferencesRevisionConflictError);
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'owner-a', scopeKey: 'uid:800000001', revision: 3 },
      }),
    );
  });

  it('serializes preferences containing goodEnoughCharacters into create payload', async () => {
    const create = vi.fn().mockResolvedValue({});
    const db = { genshinTeamPreferences: { create } } as unknown as PrismaClient;
    const repository = new GenshinTeamPreferencesRepository(db);

    const payload = {
      goodEnoughCharacters: ['avatar:10000046', 'avatar:10000089'],
      customProfiles: [],
      favoriteTeams: [],
    };

    await repository.create('owner-a', { uid: '800000001', accountId: null }, payload);

    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'owner-a',
        scopeKey: 'uid:800000001',
        uid: '800000001',
        accountId: null,
        revision: 1,
        payload,
      },
    });
  });

  it('serializes preferences containing goodEnoughCharacters into update payload with revision increment', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const db = { genshinTeamPreferences: { updateMany } } as unknown as PrismaClient;
    const repository = new GenshinTeamPreferencesRepository(db);

    const payload = {
      goodEnoughCharacters: ['avatar:10000046', 'avatar:10000089', 'avatar:10000103'],
      customProfiles: [],
      favoriteTeams: [],
    };

    await repository.update('owner-a', { uid: '800000001', accountId: null }, 1, payload);

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'owner-a',
        scopeKey: 'uid:800000001',
        revision: 1,
      },
      data: {
        payload,
        revision: { increment: 1 },
      },
    });
  });

  it('translates P2002 duplicate key constraint during create into revision conflict', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '7.9.1',
    });
    const create = vi.fn().mockRejectedValue(prismaError);
    const db = { genshinTeamPreferences: { create } } as unknown as PrismaClient;
    const repository = new GenshinTeamPreferencesRepository(db);

    await expect(
      repository.create('owner-a', { uid: '800000001', accountId: null }, {}),
    ).rejects.toBeInstanceOf(TeamPreferencesRevisionConflictError);
  });
});
