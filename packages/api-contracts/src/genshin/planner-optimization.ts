import { z } from 'zod';

export const plannerActionTypeSchema = z.enum([
  'domain_talent',
  'domain_weapon',
  'domain_artifact',
  'world_boss',
  'weekly_boss',
  'leyline',
  'overworld_gather',
]);
export type PlannerActionType = z.infer<typeof plannerActionTypeSchema>;

export const optimizationPlanActionSchema = z
  .object({
    actionId: z.string().min(1),
    goalId: z.string().nullable().optional(),
    actionType: plannerActionTypeSchema,
    targetKey: z.string().min(1),
    domainName: z.string().min(1),
    runs: z.number().int().min(1),
    resinCost: z.number().int().min(0),
    estimatedMinutes: z.number().min(0),
    efficiencyScore: z.number().min(0),
    timeGated: z.boolean(),
    materialDeficitRatio: z.number().min(0).max(1),
    marginalScoreDelta: z.number().min(0).optional(),
    closesReadinessGap: z.boolean().optional(),
    resourceName: z.string().optional(),
    inventoryStatus: z.enum(['observed', 'unknown']).optional(),
    explanations: z.array(z.string()),
  })
  .strict();
export type OptimizationPlanAction = z.infer<typeof optimizationPlanActionSchema>;

export const optimizationPlanAlternativeKindSchema = z.enum([
  'speedrun_condensed',
  'overworld_prep',
  'secondary_goal',
]);
export type OptimizationPlanAlternativeKind = z.infer<typeof optimizationPlanAlternativeKindSchema>;

export const optimizationPlanAlternativeSchema = z
  .object({
    kind: optimizationPlanAlternativeKindSchema,
    title: z.string().min(1),
    description: z.string().min(1),
    totalResinCost: z.number().int().min(0).optional(),
    totalEstimatedMinutes: z.number().min(0).optional(),
    actions: z.array(optimizationPlanActionSchema),
  })
  .strict();
export type OptimizationPlanAlternative = z.infer<typeof optimizationPlanAlternativeSchema>;

export const optimizationPlannerRequestSchema = z
  .object({
    timeBudgetMinutes: z.number().int().min(5).max(240).optional(),
    customResinBudget: z.number().int().min(0).max(200).optional(),
    focusGoalIds: z.array(z.string().min(1)).optional(),
  })
  .strict();
export type OptimizationPlannerRequest = z.infer<typeof optimizationPlannerRequestSchema>;
export type OptimizationPlannerRequestInput = z.input<typeof optimizationPlannerRequestSchema>;

export const optimizationPlannerResponseSchema = z
  .object({
    summary: z.string().min(1),
    currentResin: z.number().int().min(0),
    effectiveResinBudget: z.number().int().min(0),
    timeBudgetMinutes: z.number().min(0),
    timeUntilCapped: z.string().optional(),
    rankedPlan: z.array(optimizationPlanActionSchema),
    allocatedPlan: z.array(optimizationPlanActionSchema).optional(),
    alternatives: z.array(optimizationPlanAlternativeSchema),
    unallocatedResin: z.number().int().min(0),
    totalEstimatedMinutes: z.number().min(0),
    analysedAt: z.string().datetime(),
  })
  .strict();
export type OptimizationPlannerResponse = z.infer<typeof optimizationPlannerResponseSchema>;
