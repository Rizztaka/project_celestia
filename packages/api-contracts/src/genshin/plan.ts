import { z } from 'zod';

import type { AdviceDomain, MaterialAdviceResponse } from './advice.js';
import type { PeriodMetadata, RoutineTask, SupportedServerId } from './companion.js';
import { supportedServerIdSchema } from './companion.js';
import type { GoalRecord } from './goals.js';

export const PLAN_ROUTINE_KINDS = ['commissions', 'teapot', 'transformer', 'weeklyClaims'] as const;
export type PlanRoutineKind = (typeof PLAN_ROUTINE_KINDS)[number];
export const dailyResinBudgetSchema = z.number().finite().int().min(0).max(200).nullable();
export const planPreferencesSchema = z
  .object({
    enabledRoutineKinds: z
      .array(z.enum(PLAN_ROUTINE_KINDS))
      .max(4)
      .refine((kinds) => new Set(kinds).size === kinds.length, 'Choose each routine once.'),
    dailyResinBudget: dailyResinBudgetSchema,
  })
  .strict();
export type PlanPreferences = z.infer<typeof planPreferencesSchema>;
const revision = z.number().int().min(0).max(2147483646);
export const planSourceSchema = z.discriminatedUnion('kind', [
  z
    .object({ kind: z.literal('goal'), goalId: z.string().uuid(), expectedGoalRevision: revision })
    .strict(),
  z.object({ kind: z.literal('routine'), routineKind: z.enum(PLAN_ROUTINE_KINDS) }).strict(),
]);
export type PlanSource = z.infer<typeof planSourceSchema>;
const common = { contractVersion: z.literal(1), expectedRevision: revision };
export const planCommandSchema = z.discriminatedUnion('action', [
  z
    .object({ ...common, action: z.literal('preferences'), preferences: planPreferencesSchema })
    .strict(),
  z
    .object({
      ...common,
      action: z.literal('dismissal'),
      expectedRoutineRevision: revision,
      serverId: supportedServerIdSchema,
      dailyPeriodId: z.string().min(1).max(160),
      weeklyPeriodId: z.string().min(1).max(160),
      source: planSourceSchema,
      scope: z.enum(['day', 'week']),
      dismissed: z.boolean(),
    })
    .strict(),
]);
export type PlanCommand = z.infer<typeof planCommandSchema>;
export const planQuerySchema = z.object({ contractVersion: z.literal('1') }).strict();
export type PlanScope = 'day' | 'week';
export interface PlanGoal {
  goal: GoalRecord;
  dismissed: PlanScope[];
}
export interface PlanRoutine {
  kind: PlanRoutineKind;
  task: RoutineTask | null;
  scope: PlanScope;
  dismissed: boolean;
}
export interface PlanSnapshot {
  contractVersion: 1;
  revision: number;
  serverNow: string;
  routineRevision: number;
  serverId: SupportedServerId | null;
  period: PeriodMetadata | null;
  preferences: PlanPreferences;
  goalRevisions: { id: string; revision: number }[];
  goals: PlanGoal[];
  routines: PlanRoutine[];
  weekly: { rewardClaims: number | null; available: boolean };
}
export interface PlanGoalDemand {
  goalId: string;
  deficits: Record<string, number | null>;
  state: 'unavailable' | 'unknown' | 'covered' | 'deficit';
  reason: string | null;
}
export interface PlanSourceAllocation {
  domain: AdviceDomain;
  goalIds: string[];
  materialKeys: string[];
  claims: number;
  resin: number;
  reason: string;
}
export interface PlanAdvice {
  contractVersion: 1;
  revision: number;
  routineRevision: number;
  goalRevisions: { id: string; revision: number }[];
  serverNow: string;
  dailyPeriodId: string | null;
  materials: MaterialAdviceResponse;
  goalDemand: PlanGoalDemand[];
  budget: number | null;
  availableResin: number | null;
  ceiling: number | null;
  allocatedResin: number;
  sources: PlanSourceAllocation[];
  reason: string;
}
