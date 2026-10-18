/**
 * @celestia/api-contracts — Genshin companion V2 contract
 *
 * contractVersion 2 companion schemas and response types.
 * Independent of import requestVersion: 1.
 *
 * Consumed by both apps/api and apps/web.
 */

import { z } from 'zod';

// ============================================================
// Supported server IDs
// ============================================================

export const SUPPORTED_SERVER_IDS = ['asia', 'america', 'europe', 'tw_hk_mo'] as const;
export type SupportedServerId = (typeof SUPPORTED_SERVER_IDS)[number];
export const supportedServerIdSchema = z.enum(SUPPORTED_SERVER_IDS);
export const SERVER_POLICIES = {
  asia: { label: 'Asia', utcOffsetHours: 8, timezone: 'UTC+8' },
  america: { label: 'America', utcOffsetHours: -5, timezone: 'UTC−5' },
  europe: { label: 'Europe', utcOffsetHours: 1, timezone: 'UTC+1' },
  tw_hk_mo: { label: 'TW/HK/MO', utcOffsetHours: 8, timezone: 'UTC+8' },
} as const;
export function isSupportedServerId(value: unknown): value is SupportedServerId {
  return typeof value === 'string' && Object.hasOwn(SERVER_POLICIES, value);
}

// ============================================================
// Task cadence discriminator
// ============================================================

export type TaskCadence = 'daily' | 'daily_reminder' | 'manual' | 'weekly';

// ============================================================
// Resin checkpoint state
// ============================================================

/** Known resin checkpoint: amount has been explicitly entered by the user. */
export interface KnownResinState {
  known: true;
  /** Projected current amount (0–200). */
  currentAmount: number;
  checkpointAmount: number;
  recordedAt: string;
  regenIntervalMs: number;
  cap: number;
  /** ISO UTC timestamp at which the projection was computed. */
  projectedAt: string;
  /** ISO UTC timestamp when resin reaches 200, or null if already at cap. */
  capAt: string | null;
}

/** Unknown resin state: no confirmed checkpoint exists. */
export interface UnknownResinState {
  known: false;
  reason: 'no_checkpoint' | 'future_timestamp' | 'invalid_checkpoint';
}

export type ResinState = KnownResinState | UnknownResinState;

// ============================================================
// Task descriptors
// ============================================================

export interface RoutineTask {
  id: string;
  label: string;
  cadence: TaskCadence;
  /** Current checked state (false for expired periods). Null for Transformer (manual, no period). */
  done: boolean | null;
  /**
   * ISO UTC timestamp of last manual record action.
   * Only present for cadence='manual' (Transformer).
   */
  lastRecordedAt: string | null;
}

// ============================================================
// Weekly claims state
// ============================================================

export interface WeeklyClaimsState {
  /**
   * User-reported total for the current game week.
   * null = unknown (no entry or new week).
   */
  rewardClaims: number | null;
  /**
   * Discounted fights remaining (max(0, 3 - n)), or null if unverified rule or unknown claims.
   * NOTE: Discount rule NOT yet verified from primary source; always null in C2a.
   */
  discountedRemaining: number | null;
  /**
   * Next claim cost (30 or 60), or null if unverified rule or unknown claims.
   * NOTE: Always null in C2a until discount rule is sourced.
   */
  nextRewardClaimCost: number | null;
  /** Reason why discount/cost are unavailable. */
  unavailableReason: string | null;
}

// ============================================================
// Period metadata (only present when server is selected and supported)
// ============================================================

export interface PeriodMetadata {
  serverId: SupportedServerId;
  /** ISO UTC timestamp sampled from the injected clock. */
  serverNow: string;
  /** Policy version string used in period IDs. */
  policyVersion: string;
  dailyPeriodId: string;
  dailyStart: string;
  dailyEnd: string;
  weeklyPeriodId: string;
  weeklyStart: string;
  weeklyEnd: string;
  /** 0=Monday … 6=Sunday on the game server. */
  serverWeekday: number;
}

// ============================================================
// Legacy summary (read-only, shown to help user migrate)
// ============================================================

export interface LegacySummary {
  /** True if the old DailyCompanion row exists with non-default resin. */
  hadLegacyResin: boolean;
  legacyResinAmount: number | null;
  legacyResinUpdatedAt: string | null;
  legacyCommissionsDone: boolean;
  legacyTeapotClaimed: boolean;
  legacyTransformerClaimed: boolean;
  /** Raw defeated boss keys from WeeklyBossState (never converted to claims). */
  legacyDefeatedBossKeys: string[];
}

// ============================================================
// Full V2 routine snapshot response
// ============================================================

export interface RoutineSnapshotV2 {
  contractVersion: 2;
  serverNow: string;
  clockStatus: 'available' | 'unselected' | 'unverified' | 'unsupported';
  /** Monotonically increasing; 0 = no row created yet. */
  revision: number;
  /** null = server not selected. */
  serverId: SupportedServerId | null;
  /** null = no server selected or server not supported for clock-based guidance. */
  period: PeriodMetadata | null;
  tasks: RoutineTask[];
  resin: ResinState;
  weeklyClaims: WeeklyClaimsState;
  /** Present when the user has legacy companion data. */
  legacy: LegacySummary | null;
}

// ============================================================
// Common concurrency fields for all mutations
// ============================================================

export const companionConcurrencySchema = z.object({
  contractVersion: z.literal(2),
  expectedRevision: z.number().int().min(0).max(2147483646),
});

export const patchSettingsBodySchema = companionConcurrencySchema
  .extend({
    serverId: supportedServerIdSchema.nullable(),
  })
  .strict();
export type PatchSettingsBody = z.infer<typeof patchSettingsBodySchema>;

// Null period is permitted for manual actions while the selected clock is
// unavailable. The service compares this with the provider's availability.
const actionFields = {
  ...companionConcurrencySchema.shape,
  serverId: supportedServerIdSchema.nullable(),
  dailyPeriodId: z.string().min(1).nullable(),
};
export const patchChecklistBodySchema = z
  .discriminatedUnion('action', [
    z
      .object({
        ...actionFields,
        action: z.literal('setDaily'),
        commissionsDone: z.boolean().optional(),
        teapotChecked: z.boolean().optional(),
      })
      .strict(),
    z.object({ ...actionFields, action: z.literal('recordTransformerUse') }).strict(),
    z.object({ ...actionFields, action: z.literal('clearTransformerUse') }).strict(),
  ])
  .refine(
    (d) =>
      d.action !== 'setDaily' || d.commissionsDone !== undefined || d.teapotChecked !== undefined,
    { message: 'setDaily requires at least one daily field.' },
  );
export type PatchChecklistBody = z.infer<typeof patchChecklistBodySchema>;

export const patchResinBodySchema = z
  .object({
    ...actionFields,
    amount: z.number().int().min(0).max(200),
  })
  .strict();
export type PatchResinBody = z.infer<typeof patchResinBodySchema>;

export const patchWeeklyClaimsBodySchema = z
  .object({
    ...actionFields,
    serverId: supportedServerIdSchema,
    dailyPeriodId: z.string().min(1),
    weeklyPeriodId: z.string().min(1),
    rewardClaims: z.number().int().min(0).max(1000).nullable(),
  })
  .strict();
export type PatchWeeklyClaimsBody = z.infer<typeof patchWeeklyClaimsBodySchema>;

export const contractV2QuerySchema = z.object({ contractVersion: z.literal('2') }).strict();

// ============================================================
// Error codes used in the companion domain
// ============================================================

export const COMPANION_ERROR_CODES = {
  /** Client must reload — sent for V1 GET requests or old PATCH routes. */
  CLIENT_UPDATE_REQUIRED: 'COMPANION_CLIENT_UPDATE_REQUIRED',
  /** expectedRevision did not match the stored revision. */
  STALE_REVISION: 'COMPANION_STALE_REVISION',
  /** dailyPeriodId or weeklyPeriodId did not match current period. */
  STALE_PERIOD: 'COMPANION_STALE_PERIOD',
  /** serverId in request does not match stored selection. */
  SERVER_MISMATCH: 'COMPANION_SERVER_MISMATCH',
  /** Requested server is not supported. */
  UNSUPPORTED_SERVER: 'COMPANION_UNSUPPORTED_SERVER',
  /**
   * Clock source gate not yet closed. Clock-dependent writes (setDaily, weekly-claims)
   * are disabled until the Asia reset policy is verified from a primary source.
   * Resin and Transformer actions remain available.
   */
  CLOCK_UNAVAILABLE: 'COMPANION_CLOCK_UNAVAILABLE',
} as const;

export type CompanionErrorCode = (typeof COMPANION_ERROR_CODES)[keyof typeof COMPANION_ERROR_CODES];
