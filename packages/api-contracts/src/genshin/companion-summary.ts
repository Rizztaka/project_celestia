import { z } from 'zod';

export const primaryActionCategorySchema = z.enum([
  'BUILD_INVESTMENT',
  'ENDGAME_READINESS',
  'PULL_STRATEGY',
  'FARMING_AVAILABLE',
  'TEAM_RECOMMENDATION',
]);
export type PrimaryActionCategory = z.infer<typeof primaryActionCategorySchema>;

export const companionSummaryPrimaryActionSchema = z
  .object({
    category: primaryActionCategorySchema,
    headline: z.string().min(1).max(200),
    subtext: z.string().min(1).max(500),
    targetRoute: z.string().min(1).max(200),
    priority: z.enum(['HIGH', 'MEDIUM', 'INFO']),
  })
  .strict();
export type CompanionSummaryPrimaryAction = z.infer<typeof companionSummaryPrimaryActionSchema>;

export const teamSuggestionSnapshotSchema = z
  .object({
    teamName: z.string().min(1).max(200),
    members: z.array(z.string().min(1).max(100)).min(1).max(4),
    archetype: z.string().min(1).max(100),
    comfortRating: z.string().max(100).optional(),
    keyAdvantage: z.string().min(1).max(300),
    targetRoute: z.string().min(1).max(200),
  })
  .strict();
export type TeamSuggestionSnapshot = z.infer<typeof teamSuggestionSnapshotSchema>;

export const readyBuildSummaryItemSchema = z
  .object({
    characterKey: z.string().min(1).max(100),
    role: z.string().min(1).max(100),
    readinessScore: z.number().min(0).max(100),
    status: z.enum(['ready_for_target', 'conditional', 'needs_investment', 'insufficient_data']),
  })
  .strict();
export type ReadyBuildSummaryItem = z.infer<typeof readyBuildSummaryItemSchema>;

export const topMarginalUpgradeSummarySchema = z
  .object({
    characterKey: z.string().min(1).max(100),
    actionType: z.enum(['TALENT_UPGRADE', 'WEAPON_ASCENSION', 'ENERGY_THRESHOLD']),
    actionDetail: z.string().min(1).max(200),
    efficiencyScore: z.number().min(0).max(100),
    todayDomainAvailable: z.boolean(),
    domainFamily: z.string().max(100).optional(),
  })
  .strict();
export type TopMarginalUpgradeSummary = z.infer<typeof topMarginalUpgradeSummarySchema>;

export const endgameStatusSnapshotSchema = z
  .object({
    abyssReady: z.boolean(),
    abyssScore: z.number().min(0).max(100),
    onslaughtReady: z.boolean(),
    theaterMaxActsEstimated: z.number().int().min(0).max(10),
    suggestedAction: z.string().min(1).max(300),
  })
  .strict();
export type EndgameStatusSnapshot = z.infer<typeof endgameStatusSnapshotSchema>;

export const pullAdviceSnapshotSchema = z
  .object({
    recommendation: z.enum([
      'HIGH_ACCOUNT_VALUE',
      'MODERATE_UPGRADE',
      'NICHE_OR_REDUNDANT',
      'SAVE_RECOMMENDED',
      'CONDITIONAL_DATA_GAP',
    ]),
    targetBannerName: z.string().min(1).max(200),
    targetCharacterKey: z.string().min(1).max(100),
    keyReason: z.string().min(1).max(400),
  })
  .strict();
export type PullAdviceSnapshot = z.infer<typeof pullAdviceSnapshotSchema>;

export const companionSummaryResponseSchema = z
  .object({
    contractVersion: z.literal(1),
    timestamp: z.string().datetime(),
    accountScope: z.enum(['authenticated', 'public_showcase']),
    isPartialAccount: z.boolean(),
    missingDataCaveats: z.array(z.string().min(1).max(300)),
    primaryAction: companionSummaryPrimaryActionSchema,
    readyBuildsSummary: z
      .object({
        readyCount: z.number().int().min(0),
        totalAssessed: z.number().int().min(0),
        targetEncounter: z.string().min(1).max(100),
        topReadyCharacters: z.array(readyBuildSummaryItemSchema),
      })
      .strict(),
    topMarginalInvestments: z.array(topMarginalUpgradeSummarySchema).max(5),
    teamSuggestion: teamSuggestionSnapshotSchema.optional(),
    endgameSnapshot: endgameStatusSnapshotSchema,
    pullAdviceSnapshot: pullAdviceSnapshotSchema.optional(),
    narrativeOverview: z.array(z.string().min(1).max(400)),
  })
  .strict();
export type CompanionSummaryResponse = z.infer<typeof companionSummaryResponseSchema>;
