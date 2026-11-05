import { z } from 'zod';

import {
  readinessCharacterBuildSchema,
  readinessDimensionResultSchema,
  readinessDimensionSchema,
  readinessMissingDataSchema,
  readinessRoleInputSchema,
  readinessStatusSchema,
  readinessTargetEncounterSchema,
  readinessTeamEnergyContextSchema,
} from './readiness.js';

export const upgradeCategorySchema = z.enum([
  'talent',
  'weapon_level',
  'weapon_ascension',
  'character_ascension',
  'character_level',
  'artifact_main_stat',
  'artifact_level',
]);
export type UpgradeCategory = z.infer<typeof upgradeCategorySchema>;

export const resourceCostItemSchema = z
  .object({
    materialKey: z.string().min(1),
    name: z.string().min(1),
    count: z.number().int().nonnegative(),
  })
  .strict();
export type ResourceCostItem = z.infer<typeof resourceCostItemSchema>;

export const upgradeCandidateSchema = z
  .object({
    id: z.string().min(1),
    category: upgradeCategorySchema,
    target: z.string().min(1),
    currentLevel: z.number().int().min(0).max(90),
    targetLevel: z.number().int().min(1).max(90),
    costs: z.array(resourceCostItemSchema),
    expectedScoreDelta: z.number(),
    closesGap: z.boolean(),
    efficiencyScore: z.number(),
  })
  .strict();
export type UpgradeCandidate = z.infer<typeof upgradeCandidateSchema>;

export const marginalReadinessSummarySchema = z
  .object({
    status: readinessStatusSchema,
    score: z.number().min(0).max(100),
    dimensions: z.record(readinessDimensionSchema, readinessDimensionResultSchema),
    missingData: z.array(readinessMissingDataSchema).default([]),
  })
  .strict();
export type MarginalReadinessSummary = z.infer<typeof marginalReadinessSummarySchema>;

export const marginalInvestmentRequestSchema = z
  .object({
    character: readinessCharacterBuildSchema,
    roleProfile: readinessRoleInputSchema.optional(),
    targetEncounter: readinessTargetEncounterSchema.optional(),
    teamEnergyContext: readinessTeamEnergyContextSchema.optional(),
  })
  .strict();
export type MarginalInvestmentRequest = z.infer<typeof marginalInvestmentRequestSchema>;
export type MarginalInvestmentRequestInput = z.input<typeof marginalInvestmentRequestSchema>;

export const marginalInvestmentRecommendationSchema = z
  .object({
    recommendedNextAction: upgradeCandidateSchema.nullable(),
    rankedUpgrades: z.array(upgradeCandidateSchema),
  })
  .strict();
export type MarginalInvestmentRecommendation = z.infer<
  typeof marginalInvestmentRecommendationSchema
>;

export const marginalInvestmentResponseSchema = z
  .object({
    currentReadiness: marginalReadinessSummarySchema,
    rankedUpgrades: z.array(upgradeCandidateSchema),
    recommendedNextAction: upgradeCandidateSchema.nullable(),
    explanations: z.array(z.string()),
    recommendation: marginalInvestmentRecommendationSchema.optional(),
    score: z.number().optional(),
  })
  .strict();
export type MarginalInvestmentResponse = z.infer<typeof marginalInvestmentResponseSchema>;
