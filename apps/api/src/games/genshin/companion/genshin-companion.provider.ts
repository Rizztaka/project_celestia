/**
 * genshin-companion.provider.ts — Genshin-specific companion provider.
 *
 * Implements ICompanionProvider for the Genshin Impact game domain.
 * Supplies static data files and game-specific clock/policy helpers.
 * Platform layer imports this via the registry — never directly.
 *
 * Verified Asia policy: daily 20:00 UTC / weekly Sunday 20:00 UTC.
 * See docs/plans/c2a-clock-task-reliability/sources.md.
 * Unselected/unsupported servers and explicitly unverified test policies return null.
 */

import type {
  AdviceGoalInput,
  GoalAdvice,
  GoalIntent,
  LegacySummary,
  RecordedStockSnapshot,
  RoutineSnapshotV2,
} from '@celestia/api-contracts';
import { goalIntentSchema, isSupportedServerId } from '@celestia/api-contracts';
import type { Prisma } from '@prisma/client';
import { createRequire } from 'module';

import type {
  EventsFileData,
  ICompanionProvider,
  NormalizedDailyState,
  NormalizedWeeklyState,
  RoutinePeriodBoundaries,
  RoutineRowSnapshot,
  WeeklyBossesFileData,
} from '@/core/contracts/companion.interfaces.js';
import { BadRequestError } from '@/core/errors/app-error.js';

import { genshinCatalog } from './catalog-trust.js';
import { progressionCatalog } from './progression-catalog.js';
import { GenshinRecordedStockRepository } from './recorded-stock.repository.js';
import { projectRoutineSnapshot } from './routine-policy.js';
import {
  buildPeriodId,
  getLastDailyBoundary,
  getLastWeeklyBoundary,
  getServerWeekday,
  isDailyPeriodCurrent,
  isWeeklyPeriodCurrent,
} from './server-clock.js';

const require = createRequire(import.meta.url);

const eventsFile: EventsFileData = require('../static/events.json');
const weeklyBossesFile: WeeklyBossesFileData = require('../static/weekly-bosses.json');

/**
 * Whether the Asia server clock source gate is closed.
 *
 * Evidence accepted 2026-10-02: official timezone text, in-game weekly rules,
 * and the owner's explicit firsthand daily reset confirmation. See sources.md
 * for attribution and limits. All four fixed-offset server policies are enabled; see production-readiness/sources.md.
 *
 * Impact when false:
 *   - getPeriodBoundaries returns null → checklist setDaily and weekly-claims writes are rejected
 *   - getServerWeekday returns null → Planner Intelligence and Today Domains throw 422
 *   - normalizeDailyState / normalizeWeeklyState return stored values unchanged
 *   - projectSnapshot period metadata is null
 *
 * The resin projection and resin/transformer writes remain available because
 * they do not depend on the reset timezone.
 */
const RESET_CLOCK_ENABLED = true;

export class GenshinCompanionProvider implements ICompanionProvider {
  readonly gameId = 'genshin';

  // Availability can be disabled explicitly in tests; production uses the supported reset policies.
  constructor(private readonly clockVerified = RESET_CLOCK_ENABLED) {}

  getEventsData(): EventsFileData {
    return {
      ...eventsFile,
      events: [],
      availability: {
        available: false,
        reason: 'Current events and rewards have not been verified.',
      },
    };
  }

  getWeeklyBossesData(): WeeklyBossesFileData {
    return { ...weeklyBossesFile, bosses: [] };
  }

  hasGoalTarget(goalType: string, targetKey: string): boolean {
    return (
      progressionCatalog.hasTarget(goalType, targetKey) ||
      genshinCatalog.hasTarget(goalType, targetKey)
    );
  }

  validateGoalIntent(input: unknown): GoalIntent {
    const parsed = goalIntentSchema.safeParse(input);
    if (!parsed.success)
      throw new BadRequestError(parsed.error.errors[0]?.message ?? 'Invalid goal intent.');
    return parsed.data;
  }
  async ownsGoalTarget(
    userId: string,
    goal: GoalIntent,
    tx: Prisma.TransactionClient,
  ): Promise<boolean> {
    if (goal.goalType === 'WEAPON_ASCENSION')
      return (
        (await tx.genshinWeapon.count({
          where: { account: { userId }, weaponKey: goal.targetKey },
        })) > 0
      );
    return (
      (await tx.genshinCharacter.count({
        where: { account: { userId }, characterKey: goal.targetKey },
      })) > 0
    );
  }

  getGoalAdvice(goal: AdviceGoalInput): GoalAdvice {
    const parsed = goalIntentSchema.safeParse({
      goalType: goal.goalType,
      targetKey: goal.targetKey,
      talentType: goal.talentType,
      fromPhase: goal.fromPhase,
      toPhase: goal.toPhase,
    });
    if (!parsed.success)
      return {
        available: false,
        reason: 'Legacy intent is outside supported type/slot/range limits. Preserved for review.',
      };
    return progressionCatalog.hasTarget(goal.goalType, goal.targetKey)
      ? progressionCatalog.getAdvice(goal)
      : genshinCatalog.getAdvice(goal);
  }
  getRecordedStock(userId: string): Promise<RecordedStockSnapshot> {
    return new GenshinRecordedStockRepository().readForUser(userId);
  }

  /**
   * Returns the selected server weekday (0=Monday…6=Sunday) for the given instant.
   * Returns null if the clock gate is not closed or serverId is unsupported.
   */
  getServerWeekday(serverId: string | null, now: Date): number | null {
    if (!this.clockVerified) return null;
    if (!isSupportedServerId(serverId)) return null;
    return getServerWeekday(now, serverId);
  }

  /**
   * Returns period boundaries for the given instant and server.
   * Returns null while the clock source gate is not closed, or if
   * the serverId is unsupported.
   */
  getPeriodBoundaries(serverId: string | null, now: Date): RoutinePeriodBoundaries | null {
    if (!this.clockVerified) return null;
    if (!isSupportedServerId(serverId)) return null;

    const dailyBoundary = getLastDailyBoundary(now, serverId);
    const weeklyBoundary = getLastWeeklyBoundary(now, serverId);

    return {
      dailyPeriodId: buildPeriodId('daily', dailyBoundary, serverId),
      dailyBoundary,
      weeklyPeriodId: buildPeriodId('weekly', weeklyBoundary, serverId),
      weeklyBoundary,
    };
  }

  /**
   * Normalizes the effective daily state in memory.
   * If the stored dailyPeriodStart does not match the current daily boundary
   * (or the clock gate is not closed), the stored values are returned as-is
   * (projection handles display of stale data as false).
   * If the period IS expired and the server IS selected and gate IS closed,
   * both flags are reset to false and dailyPeriodStart is cleared.
   */
  normalizeDailyState(
    row: Pick<RoutineRowSnapshot, 'commissionsDone' | 'teapotChecked' | 'dailyPeriodStart'>,
    serverId: string | null,
    now: Date,
  ): NormalizedDailyState {
    if (!this.clockVerified || !isSupportedServerId(serverId)) {
      return {
        commissionsDone: row.commissionsDone,
        teapotChecked: row.teapotChecked,
        dailyPeriodStart: row.dailyPeriodStart,
      };
    }

    const periodCurrent = isDailyPeriodCurrent(row.dailyPeriodStart, now, serverId);
    if (periodCurrent) {
      return {
        commissionsDone: row.commissionsDone,
        teapotChecked: row.teapotChecked,
        dailyPeriodStart: row.dailyPeriodStart,
      };
    }

    // Expired period: reset both flags, clear the period start.
    // The new period start will be set when a setDaily action is applied.
    return {
      commissionsDone: false,
      teapotChecked: false,
      dailyPeriodStart: null,
    };
  }

  /**
   * Normalizes the effective weekly state in memory.
   * If the weekly period is expired or the clock gate is not closed,
   * returns stored values unchanged (projection handles stale display as null).
   * If the period IS expired and server IS selected and gate IS closed,
   * resets claims to null.
   */
  normalizeWeeklyState(
    row: Pick<RoutineRowSnapshot, 'weeklyRewardClaims' | 'weeklyPeriodStart'>,
    serverId: string | null,
    now: Date,
  ): NormalizedWeeklyState {
    if (!this.clockVerified || !isSupportedServerId(serverId)) {
      return {
        weeklyRewardClaims: row.weeklyRewardClaims,
        weeklyPeriodStart: row.weeklyPeriodStart,
      };
    }

    const periodCurrent = isWeeklyPeriodCurrent(row.weeklyPeriodStart, now, serverId);
    if (periodCurrent) {
      return {
        weeklyRewardClaims: row.weeklyRewardClaims,
        weeklyPeriodStart: row.weeklyPeriodStart,
      };
    }

    return {
      weeklyRewardClaims: null,
      weeklyPeriodStart: null,
    };
  }

  /**
   * Builds the full V2 snapshot from a routine row and optional legacy data.
   *
   * When the Asia clock source gate is not closed (RESET_CLOCK_ENABLED=false),
   * the period metadata in the snapshot is forced to null. This keeps the snapshot
   * consistent with getPeriodBoundaries (which also returns null) so the frontend
   * does not show periods that cannot be written to.
   *
   * The user's stored serverId is still returned so the UI can show the selection,
   * but the period block (day/week boundaries, IDs) is suppressed.
   */
  projectSnapshot(params: {
    routineRow: RoutineRowSnapshot | null;
    legacySummary: LegacySummary | null;
    now: Date;
  }): RoutineSnapshotV2 {
    // When the clock gate is not closed, mask the serverId used for period calculation
    // so that buildPeriodMetadata returns null. The stored serverId is still in the row
    // and will be visible in the outer snapshot field.
    const effectiveRow =
      !this.clockVerified && params.routineRow
        ? { ...params.routineRow, serverId: null }
        : params.routineRow;

    const base = projectRoutineSnapshot({
      routineRow: effectiveRow,
      legacySummary: params.legacySummary,
      now: params.now,
    });

    // Restore the actual stored serverId — the period suppression above must not
    // clobber what the user has selected; only the period block should be null.
    return {
      ...base,
      serverId: isSupportedServerId(params.routineRow?.serverId)
        ? params.routineRow.serverId
        : null,
      clockStatus:
        isSupportedServerId(params.routineRow?.serverId) && !this.clockVerified
          ? 'unverified'
          : params.routineRow?.serverId && !isSupportedServerId(params.routineRow.serverId)
            ? 'unsupported'
            : base.clockStatus,
    };
  }

  /**
   * Builds the legacy summary for the V2 snapshot.
   * Returns null when the user has no legacy data worth showing.
   */
  buildLegacySummary(params: {
    legacyResinAmount: number | null;
    legacyResinUpdatedAt: Date | null;
    legacyCommissionsDone: boolean;
    legacyTeapotClaimed: boolean;
    legacyTransformerClaimed: boolean;
    legacyDefeatedBossKeys: string[];
    hasAnyLegacyData: boolean;
  }): LegacySummary | null {
    if (!params.hasAnyLegacyData) return null;

    return {
      hadLegacyResin: params.legacyResinAmount !== null && params.legacyResinAmount > 0,
      legacyResinAmount: params.legacyResinAmount,
      legacyResinUpdatedAt: params.legacyResinUpdatedAt?.toISOString() ?? null,
      legacyCommissionsDone: params.legacyCommissionsDone,
      legacyTeapotClaimed: params.legacyTeapotClaimed,
      legacyTransformerClaimed: params.legacyTransformerClaimed,
      legacyDefeatedBossKeys: params.legacyDefeatedBossKeys,
    };
  }
}
