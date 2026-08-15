import { z } from 'zod';
import { createRequire } from 'module';
import { BadRequestError, NotFoundError } from '@/core/errors/app-error.js';
import { WeeklyBossRepository } from './weekly-boss.repository.js';

// -------------------------------------------------------
// Static data (loaded once at module init)
// -------------------------------------------------------

const require = createRequire(import.meta.url);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const weeklybossesFile: WeeklyBossesFile = require('../../games/genshin/static/weekly-bosses.json');

// -------------------------------------------------------
// Static data types (mirrors weekly-bosses.json schema)
// -------------------------------------------------------

interface StaticWeeklyBoss {
  key: string;
  name: string;
  location: string;
  domainName: string;
  dropKeys: string[];
  wikiUrl: string | null;
}

interface WeeklyBossesFile {
  bosses: StaticWeeklyBoss[];
}

// -------------------------------------------------------
// Public response types
// -------------------------------------------------------

export interface HydratedWeeklyBoss {
  key: string;
  name: string;
  location: string;
  domainName: string;
  dropKeys: string[];
  wikiUrl: string | null;
  defeated: boolean;
}

export interface WeeklyBossesResponse {
  weeklyResetAt: string; // ISO UTC — when this week's state was last (lazily) reset
  nextResetAt: string; // ISO UTC — next Sunday 20:00 UTC boundary
  defeatedCount: number;
  discountedRemaining: number; // discounted fights left (0–3)
  nextFightCost: number; // 30 if discounts remain, else 60
  bosses: HydratedWeeklyBoss[];
}

export interface BossUpdateResult {
  bossKey: string;
  defeated: boolean;
}

// -------------------------------------------------------
// Input validation
// -------------------------------------------------------

const PatchBossSchema = z.object({
  defeated: z.boolean(),
});

// -------------------------------------------------------
// Weekly reset boundary helpers
// -------------------------------------------------------

const DISCOUNT_MAX = 3;
const RESIN_DISCOUNT = 30;
const RESIN_FULL = 60;

/**
 * Computes the most recent Sunday 20:00 UTC boundary (= Monday 04:00 UTC+8).
 * If today is exactly Sunday 20:00 UTC, that instant is the boundary.
 */
function getLastWeeklyResetBoundary(now: Date = new Date()): Date {
  // Day of week: 0 = Sunday, 1 = Monday … 6 = Saturday (UTC)
  const utcDay = now.getUTCDay(); // 0–6
  const utcHour = now.getUTCHours();

  // Days since the last Sunday 20:00 UTC
  // If today is Sunday and it is BEFORE 20:00 UTC, the last boundary was 7 days ago.
  // If today is Sunday at exactly 20:00:00 UTC, that instant IS the boundary (daysBack = 0).
  let daysBack = utcDay; // Sun=0, Mon=1 … Sat=6
  if (utcDay === 0 && utcHour < 20) {
    daysBack = 7;
  }

  const boundary = new Date(now);
  boundary.setUTCDate(boundary.getUTCDate() - daysBack);
  boundary.setUTCHours(20, 0, 0, 0);
  return boundary;
}

/**
 * Computes the NEXT Sunday 20:00 UTC boundary after `now`.
 */
function getNextWeeklyResetBoundary(now: Date = new Date()): Date {
  const last = getLastWeeklyResetBoundary(now);
  const next = new Date(last);
  next.setUTCDate(next.getUTCDate() + 7);
  return next;
}

// -------------------------------------------------------
// WeeklyBossService
// -------------------------------------------------------

export class WeeklyBossService {
  private readonly repository: WeeklyBossRepository;

  constructor() {
    this.repository = new WeeklyBossRepository();
  }

  /**
   * Returns all weekly bosses from the static JSON, hydrated with the user's
   * defeat status for the current week.
   *
   * Applies the lazy weekly reset: if `weeklyResetAt` is before the most recent
   * Sunday 20:00 UTC boundary, the defeatedBossKeys are cleared and persisted
   * before the response is built.
   */
  async getWeeklyBosses(userId: string): Promise<WeeklyBossesResponse> {
    const now = new Date();
    const lastBoundary = getLastWeeklyResetBoundary(now);
    const nextBoundary = getNextWeeklyResetBoundary(now);

    let row = await this.repository.findByUserId(userId);

    // ── Lazy weekly reset ────────────────────────────────────────────────────
    // If no row exists yet, OR if the stored weeklyResetAt is before the most
    // recent Sunday 20:00 UTC boundary, treat as a fresh week.
    if (!row || row.weeklyResetAt < lastBoundary) {
      row = await this.repository.upsert(userId, [], lastBoundary);
    }

    // ── Parse defeated keys ──────────────────────────────────────────────────
    const defeatedKeys = new Set<string>(
      Array.isArray(row.defeatedBossKeys) ? (row.defeatedBossKeys as string[]) : [],
    );

    // ── Hydrate bosses ───────────────────────────────────────────────────────
    const bosses: HydratedWeeklyBoss[] = weeklybossesFile.bosses.map((b) => ({
      key: b.key,
      name: b.name,
      location: b.location,
      domainName: b.domainName,
      dropKeys: b.dropKeys,
      wikiUrl: b.wikiUrl,
      defeated: defeatedKeys.has(b.key),
    }));

    const defeatedCount = defeatedKeys.size;
    const discountedRemaining = Math.max(0, DISCOUNT_MAX - defeatedCount);
    const nextFightCost = discountedRemaining > 0 ? RESIN_DISCOUNT : RESIN_FULL;

    return {
      weeklyResetAt: row.weeklyResetAt.toISOString(),
      nextResetAt: nextBoundary.toISOString(),
      defeatedCount,
      discountedRemaining,
      nextFightCost,
      bosses,
    };
  }

  /**
   * Toggles the defeated state of a single weekly boss.
   * Validates that bossKey exists in weekly-bosses.json.
   * The defeatedBossKeys array is treated as a set: toggling defeated=true
   * adds the key, defeated=false removes it. Idempotent.
   */
  async patchBoss(userId: string, bossKey: string, rawBody: unknown): Promise<BossUpdateResult> {
    // Validate request body
    const result = PatchBossSchema.safeParse(rawBody);
    if (!result.success) {
      throw new BadRequestError(
        result.error.errors[0]?.message ?? 'Invalid request body. Expected { defeated: boolean }.',
      );
    }

    // Validate bossKey against static data
    const staticBoss = weeklybossesFile.bosses.find((b) => b.key === bossKey);
    if (!staticBoss) {
      throw new NotFoundError(`Weekly boss "${bossKey}" was not found in the static boss data.`);
    }

    const { defeated } = result.data;

    // Load current state (or start fresh if the user has never viewed weekly bosses)
    const now = new Date();
    const lastBoundary = getLastWeeklyResetBoundary(now);

    let row = await this.repository.findByUserId(userId);

    // Apply lazy reset if the row is stale before writing — avoids a race
    // where a toggle after the weekly reset boundary would persist against the old week
    const currentKeys: string[] =
      row && row.weeklyResetAt >= lastBoundary && Array.isArray(row.defeatedBossKeys)
        ? (row.defeatedBossKeys as string[])
        : [];

    const keySet = new Set<string>(currentKeys);
    if (defeated) {
      keySet.add(bossKey);
    } else {
      keySet.delete(bossKey);
    }

    const weeklyResetAt =
      row && row.weeklyResetAt >= lastBoundary ? row.weeklyResetAt : lastBoundary;
    row = await this.repository.upsert(userId, Array.from(keySet), weeklyResetAt);

    return { bossKey, defeated };
  }
}

// Export boundary helpers for unit testing
export { getLastWeeklyResetBoundary, getNextWeeklyResetBoundary };
