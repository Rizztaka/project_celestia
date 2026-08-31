import { prisma } from '@/core/db/prisma.js';

// -------------------------------------------------------
// Types — Abyss
// -------------------------------------------------------

export interface CreateAbyssRunInput {
  accountId: string;
  cycleId: string;
  floor: number;
  chamber: number;
  half: number;
  stars: number;
  team: string[];
}

export type AbyssRunRecord = {
  id: string;
  accountId: string;
  cycleId: string;
  floor: number;
  chamber: number;
  half: number;
  stars: number;
  team: unknown; // Prisma returns Json as unknown; service casts to string[]
  createdAt: Date;
  updatedAt: Date;
};

// -------------------------------------------------------
// Types — Theater
// -------------------------------------------------------

export type TheaterDifficulty = 'EASY' | 'NORMAL' | 'HARD' | 'VISIONARY';

export interface UpsertTheaterRunInput {
  accountId: string;
  seasonId: string;
  difficulty: TheaterDifficulty;
  actsCleared: number;
  stars: number;
  cast: string[];
}

export type TheaterRunRecord = {
  id: string;
  accountId: string;
  seasonId: string;
  difficulty: TheaterDifficulty;
  actsCleared: number;
  stars: number;
  cast: unknown; // Prisma returns Json as unknown; service casts to string[]
  createdAt: Date;
  updatedAt: Date;
};

// -------------------------------------------------------
// Repository — Abyss
// -------------------------------------------------------

/**
 * Upserts a single chamber-half run for the given account + cycle slot.
 * If a row already exists for [accountId, cycleId, floor, chamber, half],
 * it will be overwritten with the new stars + team.
 *
 * This matches the "update-in-place" gameplay pattern — a player can re-clear
 * the same chamber with a different team to improve their star rating.
 */
export async function upsertAbyssRun(input: CreateAbyssRunInput): Promise<AbyssRunRecord> {
  return prisma.spiralAbyssRun.upsert({
    where: {
      accountId_cycleId_floor_chamber_half: {
        accountId: input.accountId,
        cycleId: input.cycleId,
        floor: input.floor,
        chamber: input.chamber,
        half: input.half,
      },
    },
    update: {
      stars: input.stars,
      team: input.team,
    },
    create: {
      accountId: input.accountId,
      cycleId: input.cycleId,
      floor: input.floor,
      chamber: input.chamber,
      half: input.half,
      stars: input.stars,
      team: input.team,
    },
  });
}

/**
 * Returns all abyss runs for an account, ordered by cycleId → floor → chamber → half.
 * The service layer is responsible for grouping these into a human-readable structure.
 */
export async function findAbyssRunsByAccount(accountId: string): Promise<AbyssRunRecord[]> {
  return prisma.spiralAbyssRun.findMany({
    where: { accountId },
    orderBy: [{ cycleId: 'desc' }, { floor: 'asc' }, { chamber: 'asc' }, { half: 'asc' }],
  });
}

/**
 * Returns all abyss runs for a specific cycle (e.g. "5.0-1") for an account.
 */
export async function findAbyssRunsByCycle(
  accountId: string,
  cycleId: string,
): Promise<AbyssRunRecord[]> {
  return prisma.spiralAbyssRun.findMany({
    where: { accountId, cycleId },
    orderBy: [{ floor: 'asc' }, { chamber: 'asc' }, { half: 'asc' }],
  });
}

// -------------------------------------------------------
// Repository — Theater
// -------------------------------------------------------

/**
 * Upserts an Imaginarium Theater run for the given account + season.
 * If a row already exists for [accountId, seasonId] it will be overwritten.
 *
 * This allows a player to update their run if they replay the Theater
 * and achieve a better score within the same season.
 */
export async function upsertTheaterRun(input: UpsertTheaterRunInput): Promise<TheaterRunRecord> {
  return prisma.imaginariumTheaterRun.upsert({
    where: {
      accountId_seasonId: {
        accountId: input.accountId,
        seasonId: input.seasonId,
      },
    },
    update: {
      difficulty: input.difficulty,
      actsCleared: input.actsCleared,
      stars: input.stars,
      cast: input.cast,
    },
    create: {
      accountId: input.accountId,
      seasonId: input.seasonId,
      difficulty: input.difficulty,
      actsCleared: input.actsCleared,
      stars: input.stars,
      cast: input.cast,
    },
  }) as Promise<TheaterRunRecord>;
}

/**
 * Returns all Theater runs for an account, ordered by seasonId descending
 * (most recent season first).
 */
export async function findTheaterRunsByAccount(accountId: string): Promise<TheaterRunRecord[]> {
  return prisma.imaginariumTheaterRun.findMany({
    where: { accountId },
    orderBy: [{ seasonId: 'desc' }],
  }) as Promise<TheaterRunRecord[]>;
}
