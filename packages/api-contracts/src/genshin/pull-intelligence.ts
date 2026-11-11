import { z } from 'zod';

// =======================================================
// Target & Mode Schemas
// =======================================================

export const pullTargetModeSchema = z.enum(['c0_unlock', 'constellation', 'signature_weapon']);
export type PullTargetMode = z.infer<typeof pullTargetModeSchema>;

export const pullTargetTypeSchema = z.enum(['character', 'weapon']);
export type PullTargetType = z.infer<typeof pullTargetTypeSchema>;

// =======================================================
// User Weights & Priorities
// =======================================================

export const pullUserWeightsSchema = z
  .object({
    weightEndgame: z.number().min(0).max(1).default(0.35),
    weightFlexibility: z.number().min(0).max(1).default(0.25),
    weightComfort: z.number().min(0).max(1).default(0.2),
    weightFavorites: z.number().min(0).max(1).default(0.2),
  })
  .strict();
export type PullUserWeights = z.infer<typeof pullUserWeightsSchema>;

// =======================================================
// Wish Budget Input
// =======================================================

export const pullBudgetInputSchema = z
  .object({
    primogems: z.number().int().min(0).default(0),
    fates: z.number().int().min(0).default(0),
    pity: z.number().int().min(0).max(89).default(0),
    guaranteed: z.boolean().default(false),
    targetDate: z.string().optional(),
  })
  .strict();
export type PullBudgetInput = z.infer<typeof pullBudgetInputSchema>;

// =======================================================
// Multi-Objective Breakdown & Strategic Verdict
// =======================================================

export const strategicRecommendationSchema = z.enum([
  'HIGH_ACCOUNT_VALUE',
  'MODERATE_UPGRADE',
  'NICHE_OR_REDUNDANT',
  'SAVE_RECOMMENDED',
  'CONDITIONAL_DATA_GAP',
]);
export type StrategicRecommendation = z.infer<typeof strategicRecommendationSchema>;

export const pullConfidenceSchema = z.enum([
  'VERIFIED',
  'UNVERIFIED',
  'STALE',
  'SIMULATED_SCENARIO',
]);
export type PullConfidence = z.infer<typeof pullConfidenceSchema>;

export const pullResponseStatusSchema = z.enum([
  'AVAILABLE',
  'UNAVAILABLE',
  'CONDITIONAL',
  'HISTORICAL_BENCHMARK',
]);
export type PullResponseStatus = z.infer<typeof pullResponseStatusSchema>;

export const accountValueBreakdownSchema = z
  .object({
    endgameCoverageImpact: z.number().min(0).max(100),
    supportFlexibility: z.number().min(0).max(100),
    redundancyPenalty: z.number().min(0).max(50),
    comfortImpact: z.number().min(0).max(100),
    favoriteSynergy: z.number().min(0).max(100),
    investmentFriction: z.number().min(0).max(25),
    unlockedTeamsCount: z.number().int().min(0),
    unlockedArchetypes: z.array(z.string()),
    redundantWithOwned: z.array(z.string()),
    totalScore: z.number().min(0).max(100),
  })
  .strict();
export type AccountValueBreakdown = z.infer<typeof accountValueBreakdownSchema>;

export const pullBudgetForecastSchema = z
  .object({
    currentPullsAvailable: z.number().int().min(0),
    medianPullsNeeded: z.number().int().min(1),
    hardPityNeeded: z.number().int().min(1),
    acquisitionProbability: z.number().min(0).max(1),
    savingsAdvice: z.string(),
  })
  .strict();
export type PullBudgetForecast = z.infer<typeof pullBudgetForecastSchema>;

// =======================================================
// Pull Recommendation Item
// =======================================================

export const pullRecommendationSchema = z
  .object({
    targetKey: z.string().min(1),
    targetName: z.string().min(1),
    targetType: pullTargetTypeSchema,
    mode: pullTargetModeSchema,
    targetConstellation: z.number().int().min(0).max(6).optional(),
    currentConstellation: z.number().int().min(0).max(6).optional(),
    bannerId: z.string().min(1),
    bannerName: z.string().min(1),
    fourStarKeys: z.array(z.string()),
    accountValueScore: z.number().min(0).max(100),
    strategicRecommendation: strategicRecommendationSchema,
    breakdown: accountValueBreakdownSchema,
    explanations: z.array(z.string()),
    budgetForecast: pullBudgetForecastSchema,
    isPartialAccount: z.boolean(),
    missingDataNotes: z.array(z.string()),
    simulation: z.boolean().optional(),
    confidence: pullConfidenceSchema.optional(),
    provenanceNotices: z.array(z.string()).optional(),
    // Backwards-compatibility aliases for legacy consumers:
    fiveStarKey: z.string().optional(),
    pullValueScore: z.number().optional(),
    recommendation: z.string().optional(),
  })
  .strict();
export type PullRecommendation = z.infer<typeof pullRecommendationSchema>;

// =======================================================
// API Request & Response Schemas
// =======================================================

export const pullIntelligenceResponseSchema = z
  .object({
    available: z.boolean().default(true),
    reason: z.string().optional(),
    status: pullResponseStatusSchema.optional(),
    confidence: pullConfidenceSchema.optional(),
    recommendations: z.array(pullRecommendationSchema),
    userWeights: pullUserWeightsSchema,
    isPartialAccount: z.boolean(),
    analyzedAt: z.string(),
  })
  .strict();
export type PullIntelligenceResponse = z.infer<typeof pullIntelligenceResponseSchema>;

export const pullCompareRequestSchema = z
  .object({
    targetKey: z.string().min(1),
    targetType: pullTargetTypeSchema.default('character'),
    mode: pullTargetModeSchema.default('c0_unlock'),
    targetConstellation: z.number().int().min(0).max(6).optional(),
    weights: pullUserWeightsSchema.optional(),
    budget: pullBudgetInputSchema.optional(),
  })
  .strict();
export type PullCompareRequest = z.infer<typeof pullCompareRequestSchema>;

export const pullCompareResponseSchema = z
  .object({
    comparison: pullRecommendationSchema,
    analyzedAt: z.string(),
  })
  .strict();
export type PullCompareResponse = z.infer<typeof pullCompareResponseSchema>;
