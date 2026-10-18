import {
  COMPANION_ERROR_CODES as CODES,
  type PatchChecklistBody,
  patchChecklistBodySchema,
  type PatchResinBody,
  patchResinBodySchema,
  type PatchSettingsBody,
  patchSettingsBodySchema,
  type PatchWeeklyClaimsBody,
  patchWeeklyClaimsBodySchema,
  type RoutineSnapshotV2,
} from '@celestia/api-contracts';
import { Prisma, type PrismaClient } from '@prisma/client';

import type {
  ICompanionProvider,
  RoutineRowSnapshot,
} from '@/core/contracts/companion.interfaces.js';
import { prisma } from '@/core/db/prisma.js';
import { AppError, ConflictError } from '@/core/errors/app-error.js';

import { RoutineRepository, type RoutineStateUpdate } from './routine.repository.js';

type Command =
  | { kind: 'settings'; body: PatchSettingsBody }
  | { kind: 'checklist'; body: PatchChecklistBody }
  | { kind: 'resin'; body: PatchResinBody }
  | { kind: 'weekly'; body: PatchWeeklyClaimsBody };

function conflict(code: string, message: string): never {
  throw new AppError(message + ' Refresh before trying again.', 409, code);
}
function clockUnavailable(): never {
  throw new AppError(
    'Server reset tracking is unavailable. Resin and manual use records are still available.',
    400,
    CODES.CLOCK_UNAVAILABLE,
  );
}
function defaultRow(userId: string, now: Date): RoutineRowSnapshot {
  return {
    userId,
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
}

export class RoutineService {
  constructor(
    private readonly repository: RoutineRepository,
    private readonly provider: ICompanionProvider,
    private readonly clock: () => Date = () => new Date(),
    private readonly db: Pick<PrismaClient, '$transaction'> = prisma,
  ) {}

  async getSnapshot(userId: string): Promise<RoutineSnapshotV2> {
    const now = this.clock();
    const routineRow = await this.repository.findByUserId(userId);
    const legacySummary = await this.getLegacySummary(userId);
    return this.provider.projectSnapshot({ routineRow, legacySummary, now });
  }

  // Parse at the service boundary: HTTP and internal callers obey the same rules.
  patchSettings(userId: string, input: unknown) {
    return this.atomicWrite(userId, {
      kind: 'settings',
      body: patchSettingsBodySchema.parse(input),
    });
  }
  patchChecklist(userId: string, input: unknown) {
    return this.atomicWrite(userId, {
      kind: 'checklist',
      body: patchChecklistBodySchema.parse(input),
    });
  }
  patchResin(userId: string, input: unknown) {
    return this.atomicWrite(userId, { kind: 'resin', body: patchResinBodySchema.parse(input) });
  }
  patchWeeklyClaims(userId: string, input: unknown) {
    return this.atomicWrite(userId, {
      kind: 'weekly',
      body: patchWeeklyClaimsBodySchema.parse(input),
    });
  }

  private async atomicWrite(userId: string, command: Command): Promise<RoutineSnapshotV2> {
    try {
      return await this.db.$transaction(
        async (tx) => {
          const owners = await tx.$queryRaw<
            { id: string }[]
          >`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
          if (owners.length !== 1) throw new AppError('User not found.', 404, 'NOT_FOUND');
          const existing = await this.repository.findByUserIdInTx(tx, userId);
          // The acceptance instant is sampled after the owner lock and row read.
          const now = this.clock();
          const row = existing ?? defaultRow(userId, now);
          const { body } = command;
          if (row.revision !== body.expectedRevision)
            conflict(CODES.STALE_REVISION, 'Another save changed this record.');
          const update: RoutineStateUpdate = { revision: row.revision + 1 };
          if (command.kind === 'settings') {
            update.serverId = command.body.serverId;
            if (row.serverId !== command.body.serverId) {
              Object.assign(update, {
                dailyPeriodStart: null,
                commissionsDone: false,
                teapotChecked: false,
                weeklyPeriodStart: null,
                weeklyRewardClaims: null,
              });
              // Explicit server changes retire period visibility, including an Asia -> null -> Asia round trip.
              await tx.genshinPlanDismissal.deleteMany({ where: { userId } });
              await tx.genshinPlanPreferences.updateMany({
                where: { userId },
                data: { revision: { increment: 1 } },
              });
            }
          } else {
            const input = command.body;
            if (row.serverId !== input.serverId)
              conflict(CODES.SERVER_MISMATCH, 'Server selection changed.');
            const periods = this.provider.getPeriodBoundaries(row.serverId, now);
            const needsClock =
              command.kind === 'weekly' ||
              (command.kind === 'checklist' && command.body.action === 'setDaily');
            if (needsClock && !periods) clockUnavailable();
            // Manual actions work with a null period when the clock is unavailable.
            // If a clock is available, every action must carry its current period.
            if (input.dailyPeriodId !== (periods?.dailyPeriodId ?? null))
              conflict(CODES.STALE_PERIOD, 'The daily period or clock availability changed.');
            if (
              command.kind === 'weekly' &&
              command.body.weeklyPeriodId !== periods?.weeklyPeriodId
            )
              conflict(CODES.STALE_PERIOD, 'The weekly period changed.');
            Object.assign(
              update,
              this.provider.normalizeDailyState(row, row.serverId, now),
              this.provider.normalizeWeeklyState(row, row.serverId, now),
            );
            if (command.kind === 'resin') {
              update.resinAmount = command.body.amount;
              update.resinRecordedAt = now;
            } else if (command.kind === 'weekly') {
              update.weeklyPeriodStart = periods!.weeklyBoundary;
              update.weeklyRewardClaims = command.body.rewardClaims;
            } else if (command.body.action === 'setDaily') {
              update.dailyPeriodStart = periods!.dailyBoundary;
              if (command.body.commissionsDone !== undefined)
                update.commissionsDone = command.body.commissionsDone;
              if (command.body.teapotChecked !== undefined)
                update.teapotChecked = command.body.teapotChecked;
            } else {
              update.transformerLastUsedAt =
                command.body.action === 'recordTransformerUse' ? now : null;
            }
          }
          const saved = existing
            ? await this.repository.updateInTx(tx, userId, update)
            : await this.repository.createInTx(tx, { userId, ...update });
          // Read the frozen legacy rows through this transaction too: response
          // construction failures roll back the save rather than failing after commit.
          const legacySummary = await this.getLegacySummary(userId, tx);
          return this.provider.projectSnapshot({ routineRow: saved, legacySummary, now });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
          maxWait: 10000,
          timeout: 15000,
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2034', 'P2002'].includes(error.code)
      ) {
        throw new ConflictError('A concurrent save conflicted. Refresh before trying again.');
      }
      throw error;
    }
  }

  private async getLegacySummary(userId: string, tx?: Prisma.TransactionClient) {
    // Sequential reads avoid overlapping queries on a single pg transaction.
    const daily = await this.repository.findLegacyCompanion(userId, tx);
    const weekly = await this.repository.findLegacyWeeklyBossState(userId, tx);
    const keys = Array.isArray(weekly?.defeatedBossKeys)
      ? weekly.defeatedBossKeys.filter((key): key is string => typeof key === 'string')
      : [];
    return this.provider.buildLegacySummary({
      legacyResinAmount: daily?.resinAmount ?? null,
      legacyResinUpdatedAt: daily?.resinUpdatedAt ?? null,
      legacyCommissionsDone: daily?.commissionsDone ?? false,
      legacyTeapotClaimed: daily?.teapotClaimed ?? false,
      legacyTransformerClaimed: daily?.transformerClaimed ?? false,
      legacyDefeatedBossKeys: keys,
      hasAnyLegacyData: daily !== null || weekly !== null,
    });
  }
}
