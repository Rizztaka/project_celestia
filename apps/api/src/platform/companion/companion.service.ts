import type { DailyCompanion } from '@prisma/client';
import { z } from 'zod';

import { BadRequestError } from '@/core/errors/app-error.js';

import { type CompanionScalars,DailyCompanionRepository } from './companion.repository.js';

// -------------------------------------------------------
// Zod validation schemas (per ADR 0007 — service-level)
// -------------------------------------------------------

const UpdateResinSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'amount must be a number' })
    .int('amount must be an integer')
    .min(0, 'amount must be at least 0')
    .max(200, 'amount must be at most 200'),
});

const UpdateChecklistSchema = z
  .object({
    commissionsDone: z.boolean().optional(),
    teapotClaimed: z.boolean().optional(),
    transformerClaimed: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one checklist field must be provided.',
  });

// -------------------------------------------------------
// Daily reset boundary (lazy reset, per spec Decision 3)
// -------------------------------------------------------

/**
 * Returns the most recent 20:00 UTC boundary (= 04:00 Asia/Shanghai UTC+8).
 *
 * This is Genshin Impact's Asia server daily reset time.
 * If the current time is before today's 20:00 UTC, the last boundary was
 * yesterday at 20:00 UTC.
 */
function getLastResetBoundary(): Date {
  const now = new Date();
  const boundary = new Date(now);
  boundary.setUTCHours(20, 0, 0, 0);
  if (now < boundary) {
    boundary.setUTCDate(boundary.getUTCDate() - 1);
  }
  return boundary;
}

// -------------------------------------------------------
// Service
// -------------------------------------------------------

export class DailyCompanionService {
  private readonly repository: DailyCompanionRepository;

  constructor() {
    this.repository = new DailyCompanionRepository();
  }

  /**
   * Returns the current daily companion state for the user.
   *
   * On first call for a new user, the upsert creates the record with safe
   * defaults (0 resin, all checklist flags false) and returns it.
   *
   * Lazy daily reset: if the stored `dailyResetAt` is before the most recent
   * 20:00 UTC boundary, all checklist flags are reset to false and
   * `dailyResetAt` is updated to now() before the record is returned.
   * This happens within the same HTTP request — no background job needed.
   */
  async getDailyState(userId: string): Promise<DailyCompanion> {
    // Ensure the record exists for this user (idempotent upsert with defaults)
    let companion = await this.repository.upsert(userId, {});

    // Lazy daily reset check
    const lastReset = getLastResetBoundary();
    if (companion.dailyResetAt < lastReset) {
      companion = await this.repository.upsert(userId, {
        commissionsDone: false,
        teapotClaimed: false,
        transformerClaimed: false,
        dailyResetAt: new Date(),
      });
    }

    return companion;
  }

  /**
   * Updates the resin checkpoint.
   *
   * Stores the new amount and refreshes resinUpdatedAt to now().
   * The frontend will project forward from this new checkpoint.
   *
   * Throws ValidationError if amount is not an integer in [0, 200].
   */
  async updateResin(userId: string, rawAmount: unknown): Promise<DailyCompanion> {
    const result = UpdateResinSchema.safeParse({ amount: rawAmount });
    if (!result.success) {
      throw new BadRequestError(result.error.errors[0]?.message ?? 'Invalid amount');
    }

    return this.repository.upsert(userId, {
      resinAmount: result.data.amount,
      resinUpdatedAt: new Date(),
    });
  }

  /**
   * Updates one or more daily checklist flags.
   *
   * Accepts a partial update — only the fields present in the request body
   * are changed. Throws ValidationError if the body is empty.
   */
  async updateChecklist(userId: string, rawInput: unknown): Promise<DailyCompanion> {
    const result = UpdateChecklistSchema.safeParse(rawInput);
    if (!result.success) {
      throw new BadRequestError(result.error.errors[0]?.message ?? 'Invalid checklist update');
    }

    // Strip undefined keys so Prisma receives only the fields to change
    const update = Object.fromEntries(
      Object.entries(result.data).filter(([, v]) => v !== undefined),
    );

    return this.repository.upsert(userId, update);
  }
}
