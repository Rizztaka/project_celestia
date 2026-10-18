/**
 * companion.interfaces.ts — Core contracts for the companion domain.
 *
 * Platform modules import from here; game-specific modules implement these.
 * The platform layer must NOT import from game-specific implementations.
 */

import type {
  AdviceGoalInput,
  GoalAdvice,
  GoalIntent,
  LegacySummary,
  PeriodMetadata,
  RecordedStockSnapshot,
  ResinState,
  RoutineSnapshotV2,
  RoutineTask,
} from '@celestia/api-contracts';
import type { Prisma } from '@prisma/client';

// ============================================================
// Static data types
// ============================================================

export interface StaticRewardTier {
  tierId: string;
  label: string;
  primogems: number;
  other: string[];
}

export interface StaticEvent {
  key: string;
  name: string;
  type: string;
  startUtc: string;
  endUtc: string;
  description: string;
  wikiUrl: string | null;
  rewardTiers: StaticRewardTier[];
}

export interface EventsFileData {
  availability?: { available: boolean; reason: string | null };
  patch: string;
  patchStartUtc: string;
  patchEndUtc: string;
  events: StaticEvent[];
}

export interface StaticWeeklyBoss {
  key: string;
  name: string;
  location: string;
  domainName: string;
  dropKeys: string[];
  wikiUrl: string | null;
}

export interface WeeklyBossesFileData {
  bosses: StaticWeeklyBoss[];
}

// ============================================================
// Shared routine state shape (platform-level, avoids importing Prisma model)
// ============================================================

/**
 * The portion of a routine row that the provider needs for projection/normalization.
 * Mirrors the GenshinRoutineState Prisma model fields; no Prisma import here.
 */
export interface RoutineRowSnapshot {
  userId: string;
  revision: number;
  serverId: string | null;
  dailyPeriodStart: Date | null;
  commissionsDone: boolean;
  teapotChecked: boolean;
  transformerLastUsedAt: Date | null;
  resinAmount: number | null;
  resinRecordedAt: Date | null;
  weeklyPeriodStart: Date | null;
  weeklyRewardClaims: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Period identifiers returned from the provider for a given instant and server.
 * Used by the platform service for period validation without importing clock helpers.
 */
export interface RoutinePeriodBoundaries {
  /** Opaque daily period ID (e.g. genshin:asia:v1:daily:2026-09-27T20:00:00.000Z) */
  dailyPeriodId: string;
  /** The exact UTC instant of the current daily boundary. */
  dailyBoundary: Date;
  /** Opaque weekly period ID */
  weeklyPeriodId: string;
  /** The exact UTC instant of the current weekly boundary. */
  weeklyBoundary: Date;
}

/**
 * The normalized daily state returned after expiring outdated flags.
 * Carries boolean flags only; revision increment happens in the service.
 */
export interface NormalizedDailyState {
  commissionsDone: boolean;
  teapotChecked: boolean;
  dailyPeriodStart: Date | null;
}

/**
 * The normalized weekly state returned after expiring outdated claims.
 */
export interface NormalizedWeeklyState {
  weeklyRewardClaims: number | null;
  weeklyPeriodStart: Date | null;
}

// ============================================================
// Provider interface
// ============================================================

export interface ICompanionProvider {
  /** Uniquely identifies the game this provider serves (e.g. 'genshin', 'hsr') */
  readonly gameId: string;

  getEventsData(): EventsFileData;
  getWeeklyBossesData(): WeeklyBossesFileData;
  /** Stored goal identity is distinct from eligibility for advice. */
  hasGoalTarget(goalType: string, targetKey: string): boolean;
  validateGoalIntent(input: unknown): GoalIntent;
  ownsGoalTarget(userId: string, goal: GoalIntent, tx: Prisma.TransactionClient): Promise<boolean>;
  /** Validated costs and separately verified source/weekday/resin assumptions. */
  getGoalAdvice(goal: AdviceGoalInput): GoalAdvice;
  /** Owned recorded quantities and their section receipt from one coherent read. */
  getRecordedStock(userId: string): Promise<RecordedStockSnapshot>;

  /**
   * Returns the game server weekday for the given instant and server selection.
   * 0=Monday … 6=Sunday. Returns null for unsupported/unselected servers.
   *
   * The provider samples no time — `now` is always injected by the caller.
   *
   * @param serverId  The stored server selection (null = unselected).
   * @param now       The current UTC instant (injected).
   */
  getServerWeekday(serverId: string | null, now: Date): number | null;

  /**
   * Returns the current period boundaries for a selected server, or null
   * when the clock gate is not available or the server is unsupported.
   *
   * Platform services use this to validate incoming period IDs without
   * importing Genshin clock helpers directly.
   *
   * @param serverId  The stored server selection.
   * @param now       The current UTC instant (injected, sampled AFTER lock).
   */
  getPeriodBoundaries(serverId: string | null, now: Date): RoutinePeriodBoundaries | null;

  /**
   * Normalizes the effective daily state in memory for a supported server.
   * If the stored dailyPeriodStart does not match the current daily boundary,
   * both flags are reset to false. If the server is not selected or boundaries
   * are unavailable, the stored values are returned unchanged.
   *
   * Transformer is NEVER affected by this normalization.
   *
   * Called inside the owner-locked transaction before applying a delta.
   */
  normalizeDailyState(
    row: Pick<RoutineRowSnapshot, 'commissionsDone' | 'teapotChecked' | 'dailyPeriodStart'>,
    serverId: string | null,
    now: Date,
  ): NormalizedDailyState;

  /**
   * Normalizes the effective weekly state in memory for a supported server.
   * If the stored weeklyPeriodStart does not match the current weekly boundary,
   * the weeklyRewardClaims is reset to null.
   *
   * Called inside the owner-locked transaction before applying a delta.
   */
  normalizeWeeklyState(
    row: Pick<RoutineRowSnapshot, 'weeklyRewardClaims' | 'weeklyPeriodStart'>,
    serverId: string | null,
    now: Date,
  ): NormalizedWeeklyState;

  /**
   * Builds the full V2 routine snapshot from a (possibly null) routine row
   * and optional legacy data.
   *
   * Pure projection — no database access. The platform service calls this
   * after reads and after writes without importing any Genshin policy modules.
   */
  projectSnapshot(params: {
    routineRow: RoutineRowSnapshot | null;
    legacySummary: LegacySummary | null;
    now: Date;
  }): RoutineSnapshotV2;

  /**
   * Builds the legacy summary for the V2 snapshot response.
   * Returns null when the user has no legacy companion data worth showing.
   *
   * Pure helper — no database access.
   */
  buildLegacySummary(params: {
    legacyResinAmount: number | null;
    legacyResinUpdatedAt: Date | null;
    legacyCommissionsDone: boolean;
    legacyTeapotClaimed: boolean;
    legacyTransformerClaimed: boolean;
    legacyDefeatedBossKeys: string[];
    hasAnyLegacyData: boolean;
  }): LegacySummary | null;
}

// Re-export for convenience so importers can get all companion contract types
// from this file without crossing the game boundary directly.
export type { LegacySummary, PeriodMetadata, ResinState, RoutineSnapshotV2, RoutineTask };
