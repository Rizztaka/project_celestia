/**
 * routine-policy.ts — Pure Genshin routine projection helpers.
 *
 * Stateless functions: no database access, no clock reads.
 * All time inputs are explicit parameters.
 *
 * Verified Asia clock policy — evidence accepted 2026-10-02.
 * See docs/plans/c2a-clock-task-reliability/sources.md.
 *
 * Resin:
 *   Regeneration: 1 resin per 480 000 ms (8 minutes).
 *   Cap: 200 resin (primary source: HoYoverse Help Center, verified 2026-09-27).
 *   Amount 0–200 is the valid range for manual checkpoints.
 *
 * Weekly discount:
 *   NOT verified from primary source in C2a.
 *   discountedRemaining and nextRewardClaimCost return null with reason.
 */

import type {
  KnownResinState,
  LegacySummary,
  PeriodMetadata,
  ResinState,
  RoutineSnapshotV2,
  RoutineTask,
  SupportedServerId,
  WeeklyClaimsState,
} from '@celestia/api-contracts';
import { isSupportedServerId } from '@celestia/api-contracts';
import type { GenshinRoutineState } from '@prisma/client';

import {
  ASIA_SERVER_ID,
  buildPeriodId,
  CLOCK_POLICY_VERSION,
  getLastDailyBoundary,
  getLastWeeklyBoundary,
  getNextDailyBoundary,
  getNextWeeklyBoundary,
  getServerWeekday,
  isDailyPeriodCurrent,
  isWeeklyPeriodCurrent,
} from './server-clock.js';

// ============================================================
// Constants
// ============================================================

/** Milliseconds per resin tick — primary source verified. */
export const RESIN_REGEN_MS = 8 * 60 * 1000; // 480 000 ms

/** Maximum resin — primary source verified. */
export const MAX_RESIN = 200;

/** Discount rule unverified message. */
const DISCOUNT_UNAVAILABLE_REASON =
  'Weekly discount rule not yet verified from a primary source (C2a gate). ' +
  'Discount estimates will be available after verification.';

// ============================================================
// Resin projection
// ============================================================

/**
 * Projects the current resin amount from a stored checkpoint.
 *
 * Formula: min(200, max(0, amount + floor(max(0, now - recordedAt) / 480000)))
 *
 * Returns unknown if:
 *   - No checkpoint (resinAmount or resinRecordedAt is null)
 *   - resinRecordedAt is in the future relative to `now`
 *   - resinAmount is out of [0, 200] range
 */
export function projectResinState(
  resinAmount: number | null,
  resinRecordedAt: Date | null,
  now: Date,
): ResinState {
  if (resinAmount === null || resinRecordedAt === null) {
    return { known: false, reason: 'no_checkpoint' };
  }
  if (
    !Number.isInteger(resinAmount) ||
    !Number.isFinite(resinRecordedAt.getTime()) ||
    !Number.isFinite(now.getTime())
  ) {
    return { known: false, reason: 'invalid_checkpoint' };
  }
  if (resinRecordedAt > now) {
    return { known: false, reason: 'future_timestamp' };
  }
  if (resinAmount < 0 || resinAmount > MAX_RESIN) {
    return { known: false, reason: 'invalid_checkpoint' };
  }

  const elapsedMs = now.getTime() - resinRecordedAt.getTime();
  const ticks = Math.floor(Math.max(0, elapsedMs) / RESIN_REGEN_MS);
  const currentAmount = Math.min(MAX_RESIN, Math.max(0, resinAmount + ticks));

  // Cap time: how many ms until next tick takes us from currentAmount to MAX_RESIN
  let capAt: string | null = null;
  if (currentAmount < MAX_RESIN) {
    const remaining = MAX_RESIN - currentAmount;
    // Time already elapsed in the current partial tick
    const partialElapsed = elapsedMs % RESIN_REGEN_MS;
    const msToNextTick = RESIN_REGEN_MS - partialElapsed;
    // Time to fill = next tick + (remaining - 1) full ticks
    const msToFull = msToNextTick + (remaining - 1) * RESIN_REGEN_MS;
    capAt = new Date(now.getTime() + msToFull).toISOString();
  }

  const known: KnownResinState = {
    known: true,
    currentAmount,
    checkpointAmount: resinAmount,
    recordedAt: resinRecordedAt.toISOString(),
    regenIntervalMs: RESIN_REGEN_MS,
    cap: MAX_RESIN,
    projectedAt: now.toISOString(),
    capAt,
  };
  return known;
}

// ============================================================
// Weekly claims projection
// ============================================================

/**
 * Projects the weekly claims state for display.
 *
 * C2a: discount rule is not verified; discountedRemaining and nextRewardClaimCost
 * are always null with an unavailable reason. This function is ready to enable
 * estimates once the rule is sourced.
 */
export function projectWeeklyClaimsState(rewardClaims: number | null): WeeklyClaimsState {
  // Discount rule NOT verified in C2a — always return unavailable estimates.
  return {
    rewardClaims,
    discountedRemaining: null,
    nextRewardClaimCost: null,
    unavailableReason: DISCOUNT_UNAVAILABLE_REASON,
  };
}

// ============================================================
// Task descriptors
// ============================================================

/**
 * Builds the routine task list from a routine state row and period context.
 *
 * Transformer is never affected by period resets.
 * Daily flags are projected as false when the daily period has changed.
 */
export function buildTaskDescriptors(
  state: Pick<
    GenshinRoutineState,
    'commissionsDone' | 'teapotChecked' | 'transformerLastUsedAt' | 'dailyPeriodStart'
  >,
  now: Date,
  serverSelected: boolean,
  serverId: SupportedServerId = ASIA_SERVER_ID,
): RoutineTask[] {
  // When server is selected, check if the stored period is current
  const dailyCurrent = serverSelected
    ? isDailyPeriodCurrent(state.dailyPeriodStart, now, serverId)
    : false;

  return [
    {
      id: 'commissions',
      label: 'Daily Commissions',
      cadence: 'daily',
      done: dailyCurrent ? state.commissionsDone : false,
      lastRecordedAt: null,
    },
    {
      id: 'teapot',
      label: 'Check Teapot Today',
      cadence: 'daily_reminder',
      done: dailyCurrent ? state.teapotChecked : false,
      lastRecordedAt: null,
    },
    {
      id: 'transformer',
      label: 'Parametric Transformer',
      cadence: 'manual',
      // null = no period semantics; user sees last-use timestamp separately
      done: null,
      lastRecordedAt: state.transformerLastUsedAt?.toISOString() ?? null,
    },
  ];
}

// ============================================================
// Period metadata
// ============================================================

/**
 * Builds PeriodMetadata for the Asia server.
 * Returns null if serverId is not 'asia'.
 */
export function buildPeriodMetadata(serverId: string | null, now: Date): PeriodMetadata | null {
  if (!isSupportedServerId(serverId)) return null;

  const dailyStart = getLastDailyBoundary(now, serverId);
  const dailyEnd = getNextDailyBoundary(now, serverId);
  const weeklyStart = getLastWeeklyBoundary(now, serverId);
  const weeklyEnd = getNextWeeklyBoundary(now, serverId);
  const serverWeekday = getServerWeekday(now, serverId);

  return {
    serverId,
    serverNow: now.toISOString(),
    policyVersion: CLOCK_POLICY_VERSION,
    dailyPeriodId: buildPeriodId('daily', dailyStart, serverId),
    dailyStart: dailyStart.toISOString(),
    dailyEnd: dailyEnd.toISOString(),
    weeklyPeriodId: buildPeriodId('weekly', weeklyStart, serverId),
    weeklyStart: weeklyStart.toISOString(),
    weeklyEnd: weeklyEnd.toISOString(),
    serverWeekday,
  };
}

// ============================================================
// Full snapshot projection
// ============================================================

/**
 * Builds a full V2 routine snapshot from a (possibly null) routine row,
 * optional legacy data, and the current server time.
 *
 * This is a pure projection — it never writes to the database.
 */
export function projectRoutineSnapshot(params: {
  routineRow: GenshinRoutineState | null;
  legacySummary: LegacySummary | null;
  now: Date;
}): RoutineSnapshotV2 {
  const { routineRow, legacySummary, now } = params;

  // Default in-memory values when no row exists
  const row = routineRow ?? {
    userId: '',
    revision: 0,
    serverId: null,
    dailyPeriodStart: null,
    commissionsDone: false,
    teapotChecked: false,
    transformerLastUsedAt: null,
    resinAmount: null,
    resinRecordedAt: null,
    weeklyPeriodStart: null,
    weeklyRewardClaims: null,
    createdAt: now,
    updatedAt: now,
  };

  const serverId = isSupportedServerId(row.serverId) ? row.serverId : null;
  const serverSelected = serverId !== null;

  // Period metadata
  const period = buildPeriodMetadata(serverId, now);

  // Weekly claims: project as null if period has changed
  const weeklyClaimsEffective =
    serverId !== null && isWeeklyPeriodCurrent(row.weeklyPeriodStart, now, serverId)
      ? row.weeklyRewardClaims
      : null;

  return {
    contractVersion: 2,
    serverNow: now.toISOString(),
    clockStatus: serverSelected
      ? 'available'
      : row.serverId === null
        ? 'unselected'
        : 'unsupported',
    revision: row.revision,
    serverId,
    period,
    tasks: buildTaskDescriptors(row, now, serverSelected, serverId ?? ASIA_SERVER_ID),
    resin: projectResinState(row.resinAmount, row.resinRecordedAt, now),
    weeklyClaims: projectWeeklyClaimsState(weeklyClaimsEffective),
    legacy: legacySummary,
  };
}
