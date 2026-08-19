import { prisma } from '@/core/db/prisma.js';
import { NotFoundError, UnprocessableError } from '@/core/errors/app-error.js';

import {
  findAbyssRunsByAccount,
  findAbyssRunsByCycle,
  upsertAbyssRun,
  type AbyssRunRecord,
  type CreateAbyssRunInput,
} from './endgame.repository.js';

// -------------------------------------------------------
// Constants
// -------------------------------------------------------

const VALID_FLOORS = [9, 10, 11, 12] as const;
const VALID_CHAMBERS = [1, 2, 3] as const;
const VALID_HALVES = [1, 2] as const;
const MAX_STARS = 3;
const MAX_TEAM_SIZE = 4;

// -------------------------------------------------------
// Response types
// -------------------------------------------------------

/** A single logged chamber-half run with its team and star rating. */
export interface AbyssHalfRun {
  id: string;
  half: 1 | 2;
  stars: number;
  team: string[];
}

/** Groups the two halves of a chamber together. */
export interface AbyssChamber {
  chamber: number;
  totalStars: number;
  halves: AbyssHalfRun[];
}

/** Groups chambers by floor. */
export interface AbyssFloor {
  floor: number;
  totalStars: number;
  chambers: AbyssChamber[];
}

/** Top-level grouping by Abyss cycle (e.g. "5.0-1"). */
export interface AbyssCycleResult {
  cycleId: string;
  totalStars: number;
  maxStars: number; // always 36 (12 floors × 3 chambers × 3 stars × 2 halves... wait — correct is 3 stars per chamber)
  completedChambers: number;
  floors: AbyssFloor[];
}

/** Full history response. */
export interface AbyssHistoryResponse {
  cycles: AbyssCycleResult[];
}

// -------------------------------------------------------
// Input type for logging a run (service-level)
// -------------------------------------------------------

export interface LogAbyssRunInput {
  cycleId: string;
  floor: number;
  chamber: number;
  half: 1 | 2;
  stars: number;
  team: string[];
}

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

function castTeam(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  return [];
}

/**
 * Groups a flat list of AbyssRunRecords into the nested cycle → floor → chamber structure.
 * The records are assumed to be ordered by cycleId desc, floor asc, chamber asc, half asc.
 */
function groupRuns(records: AbyssRunRecord[]): AbyssCycleResult[] {
  const cycleMap = new Map<string, Map<number, Map<number, AbyssHalfRun[]>>>();

  for (const record of records) {
    if (!cycleMap.has(record.cycleId)) {
      cycleMap.set(record.cycleId, new Map());
    }
    const floorMap = cycleMap.get(record.cycleId)!;

    if (!floorMap.has(record.floor)) {
      floorMap.set(record.floor, new Map());
    }
    const chamberMap = floorMap.get(record.floor)!;

    if (!chamberMap.has(record.chamber)) {
      chamberMap.set(record.chamber, []);
    }
    chamberMap.get(record.chamber)!.push({
      id: record.id,
      half: record.half as 1 | 2,
      stars: record.stars,
      team: castTeam(record.team),
    });
  }

  const cycles: AbyssCycleResult[] = [];

  for (const [cycleId, floorMap] of cycleMap.entries()) {
    const floors: AbyssFloor[] = [];

    for (const [floor, chamberMap] of [...floorMap.entries()].sort((a, b) => a[0] - b[0])) {
      const chambers: AbyssChamber[] = [];

      for (const [chamber, halves] of [...chamberMap.entries()].sort((a, b) => a[0] - b[0])) {
        const chamberStars = halves.reduce((sum, h) => sum + h.stars, 0);
        chambers.push({ chamber, totalStars: chamberStars, halves });
      }

      const floorStars = chambers.reduce((sum, c) => sum + c.totalStars, 0);
      floors.push({ floor, totalStars: floorStars, chambers });
    }

    const cycleStars = floors.reduce((sum, f) => sum + f.totalStars, 0);
    const completedChambers = floors.reduce((sum, f) => sum + f.chambers.length, 0);

    cycles.push({
      cycleId,
      totalStars: cycleStars,
      maxStars: 36, // 4 floors × 3 chambers × 3 stars
      completedChambers,
      floors,
    });
  }

  return cycles;
}

// -------------------------------------------------------
// Service
// -------------------------------------------------------

export class EndgameService {
  /**
   * Validates and upserts a single Abyss chamber-half run for the authenticated user.
   *
   * Throws:
   *  - NotFoundError (404) if the user has no Genshin account.
   *  - ValidationError (422) if floor/chamber/half/stars values are out of range.
   */
  async logAbyssRun(userId: string, input: LogAbyssRunInput): Promise<AbyssHalfRun> {
    // ── 1. Validate input ranges ──────────────────────────────────────────
    if (!(VALID_FLOORS as readonly number[]).includes(input.floor)) {
      throw new UnprocessableError(`Floor must be one of ${VALID_FLOORS.join(', ')}.`);
    }
    if (!(VALID_CHAMBERS as readonly number[]).includes(input.chamber)) {
      throw new UnprocessableError(`Chamber must be one of ${VALID_CHAMBERS.join(', ')}.`);
    }
    if (!(VALID_HALVES as readonly number[]).includes(input.half)) {
      throw new UnprocessableError('Half must be 1 or 2.');
    }
    if (input.stars < 0 || input.stars > MAX_STARS) {
      throw new UnprocessableError(`Stars must be between 0 and ${MAX_STARS}.`);
    }
    if (input.team.length > MAX_TEAM_SIZE) {
      throw new UnprocessableError(`Team cannot exceed ${MAX_TEAM_SIZE} characters.`);
    }
    if (input.team.some((k) => typeof k !== 'string' || k.trim() === '')) {
      throw new UnprocessableError('All team members must be non-empty strings.');
    }
    if (input.cycleId.trim() === '') {
      throw new UnprocessableError('cycleId must not be empty.');
    }

    // ── 2. Resolve account ────────────────────────────────────────────────
    const account = await prisma.genshinAccount.findUnique({ where: { userId } });
    if (!account) {
      throw new NotFoundError(
        'No Genshin Impact account found. Please import your data first.',
      );
    }

    // ── 3. Upsert the run ─────────────────────────────────────────────────
    const repoInput: CreateAbyssRunInput = {
      accountId: account.id,
      cycleId: input.cycleId.trim(),
      floor: input.floor,
      chamber: input.chamber,
      half: input.half,
      stars: input.stars,
      team: input.team.map((k) => k.trim()),
    };

    const record = await upsertAbyssRun(repoInput);

    return {
      id: record.id,
      half: record.half as 1 | 2,
      stars: record.stars,
      team: castTeam(record.team),
    };
  }

  /**
   * Returns the full Abyss run history for the authenticated user, grouped by
   * cycle → floor → chamber.
   *
   * Throws:
   *  - NotFoundError (404) if the user has no Genshin account.
   */
  async getAbyssHistory(userId: string): Promise<AbyssHistoryResponse> {
    const account = await prisma.genshinAccount.findUnique({ where: { userId } });
    if (!account) {
      throw new NotFoundError(
        'No Genshin Impact account found. Please import your data first.',
      );
    }

    const records = await findAbyssRunsByAccount(account.id);
    return { cycles: groupRuns(records) };
  }

  /**
   * Returns runs for a single Abyss cycle (e.g. "5.0-1") for the authenticated user.
   *
   * Throws:
   *  - NotFoundError (404) if the user has no Genshin account.
   */
  async getAbyssCycle(userId: string, cycleId: string): Promise<AbyssCycleResult | null> {
    const account = await prisma.genshinAccount.findUnique({ where: { userId } });
    if (!account) {
      throw new NotFoundError(
        'No Genshin Impact account found. Please import your data first.',
      );
    }

    const records = await findAbyssRunsByCycle(account.id, cycleId);
    if (records.length === 0) return null;

    const grouped = groupRuns(records);
    return grouped[0] ?? null;
  }
}
