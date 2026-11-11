import { z } from 'zod';

// =======================================================
// Base Enums & Primitives
// =======================================================

export const encounterGeometrySchema = z.enum(['aoe_crowd', 'single_target_boss', 'mixed']);
export type EncounterGeometry = z.infer<typeof encounterGeometrySchema>;

export const elementalShieldTypeSchema = z.enum([
  'Pyro',
  'Hydro',
  'Cryo',
  'Electro',
  'Geo',
  'Dendro',
]);
export type ElementalShieldType = z.infer<typeof elementalShieldTypeSchema>;

export const crowdControlDemandSchema = z.enum(['essential', 'recommended', 'optional']);
export type CrowdControlDemand = z.infer<typeof crowdControlDemandSchema>;

// =======================================================
// Encounter Configuration Schemas
// =======================================================

export const encounterWaveSchema = z
  .object({
    waveNumber: z.number().int().min(1).default(1),
    enemies: z.array(z.string().min(1)).default([]),
    shields: z.array(elementalShieldTypeSchema).default([]),
    aura: z.string().nullable().default(null),
    geometry: encounterGeometrySchema.default('mixed'),
    ccDemand: crowdControlDemandSchema.default('optional'),
    resistanceProfile: z.record(z.string(), z.number()).default({}),
  })
  .strict();
export type EncounterWave = z.infer<typeof encounterWaveSchema>;

export const abyssChamberHalfConfigSchema = z
  .object({
    half: z.union([z.literal(1), z.literal(2)]),
    targetTimeSeconds: z.number().int().min(1).default(90),
    waves: z.array(encounterWaveSchema).min(1),
  })
  .strict();
export type AbyssChamberHalfConfig = z.infer<typeof abyssChamberHalfConfigSchema>;

export const abyssChamberConfigSchema = z
  .object({
    chamber: z.number().int().min(1).max(3),
    firstHalf: abyssChamberHalfConfigSchema,
    secondHalf: abyssChamberHalfConfigSchema,
  })
  .strict();
export type AbyssChamberConfig = z.infer<typeof abyssChamberConfigSchema>;

export const abyssFloorConfigSchema = z
  .object({
    floor: z.number().int().min(9).max(12),
    chambers: z.array(abyssChamberConfigSchema).min(1).max(3),
  })
  .strict();
export type AbyssFloorConfig = z.infer<typeof abyssFloorConfigSchema>;

export const onslaughtBossConfigSchema = z
  .object({
    stage: z.number().int().min(1).max(3),
    bossKey: z.string().min(1),
    bossName: z.string().min(1),
    mechanics: z
      .array(
        z.enum(['corrosion', 'heavy_stagger', 'flying_mobile', 'elemental_shield', 'dps_check']),
      )
      .default([]),
    recommendedElements: z.array(elementalShieldTypeSchema).default([]),
    resistanceProfile: z.record(z.string(), z.number()).default({}),
  })
  .strict();
export type OnslaughtBossConfig = z.infer<typeof onslaughtBossConfigSchema>;

export const theaterSeasonConfigSchema = z
  .object({
    seasonId: z.string().min(1),
    validUntil: z.string().min(1),
    openingKeys: z.array(z.string().min(1)).max(6).default([]),
    guestKeys: z.array(z.string().min(1)).max(8).default([]),
    allowedElements: z.array(elementalShieldTypeSchema).length(3),
    actCount: z.union([z.literal(8), z.literal(10)]).default(10),
    bossActs: z.array(z.number().int().min(1).max(10)).default([3, 6, 8, 10]),
  })
  .strict();
export type TheaterSeasonConfig = z.infer<typeof theaterSeasonConfigSchema>;

export const endgameEncounterPackSchema = z
  .object({
    version: z.string().min(1),
    cycleId: z.string().min(1),
    effectiveDate: z.string().min(1),
    expiryDate: z.string().min(1),
    isExpired: z.boolean().default(false),
    abyssFloors: z.array(abyssFloorConfigSchema).default([]),
    onslaughtBosses: z.array(onslaughtBossConfigSchema).default([]),
    theaterSeason: theaterSeasonConfigSchema.nullable().default(null),
  })
  .strict();
export type EndgameEncounterPack = z.infer<typeof endgameEncounterPackSchema>;

// =======================================================
// Candidate Teams & Gear Exclusivity Schemas
// =======================================================

export const memberGearSummarySchema = z
  .object({
    weaponId: z.union([z.string(), z.number()]).nullable().optional(),
    weaponInstanceId: z.string().nullable().optional(),
    artifactInstanceIds: z.array(z.string()).default([]),
  })
  .strict();
export type MemberGearSummary = z.infer<typeof memberGearSummarySchema>;

export const candidateEndgameTeamSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().default('Candidate Team'),
    memberKeys: z.array(z.string().min(1)).length(4),
    primaryElement: elementalShieldTypeSchema.optional(),
    baseDps: z.number().min(0).default(0),
    comfortScore: z.number().min(0).max(100).default(50),
    gear: z.array(memberGearSummarySchema).default([]),
  })
  .strict();
export type CandidateEndgameTeam = z.infer<typeof candidateEndgameTeamSchema>;
export type CandidateEndgameTeamInput = z.input<typeof candidateEndgameTeamSchema>;

// =======================================================
// Spiral Abyss Joint Schemas
// =======================================================

export const abyssJointRequestSchema = z
  .object({
    cycleId: z.string().min(1),
    floor: z.number().int().min(9).max(12).default(12),
    chamber: z.number().int().min(1).max(3).default(1),
    candidateTeams: z.array(candidateEndgameTeamSchema).min(2),
    encounterOverride: abyssChamberConfigSchema.optional(),
    referenceDate: z.string().optional(),
  })
  .strict();
export type AbyssJointRequest = z.infer<typeof abyssJointRequestSchema>;
export type AbyssJointRequestInput = z.input<typeof abyssJointRequestSchema>;

export const abyssTeamEvaluationSchema = z
  .object({
    team: candidateEndgameTeamSchema,
    half: z.union([z.literal(1), z.literal(2)]),
    score: z.number(),
    multipliers: z
      .object({
        shield: z.number(),
        resistance: z.number(),
        geometry: z.number(),
        comfort: z.number(),
      })
      .strict(),
    shieldCounters: z.array(z.string()).default([]),
    geometryNotes: z.array(z.string()).default([]),
  })
  .strict();
export type AbyssTeamEvaluation = z.infer<typeof abyssTeamEvaluationSchema>;

export const abyssJointResponseSchema = z
  .object({
    cycleId: z.string(),
    floor: z.number(),
    chamber: z.number(),
    status: z.enum(['CURRENT_CYCLE', 'HISTORICAL_BENCHMARK']).optional(),
    isCurrentCycle: z.boolean().default(true),
    isExpired: z.boolean().default(false),
    expirationNote: z.string().nullable().default(null),
    firstHalf: abyssTeamEvaluationSchema,
    secondHalf: abyssTeamEvaluationSchema,
    jointScore: z.number(),
    isJointOptimal: z.boolean(),
    greedyComparison: z
      .object({
        greedyFirstHalfScore: z.number(),
        greedySecondHalfScore: z.number(),
        greedyJointScore: z.number(),
        scoreDeltaPercent: z.number(),
      })
      .strict()
      .nullable()
      .default(null),
    explanations: z.array(z.string()),
    provenanceNotices: z.array(z.string()).optional(),
  })
  .strict();
export type AbyssJointResponse = z.infer<typeof abyssJointResponseSchema>;

// =======================================================
// Stygian Onslaught Schemas
// =======================================================

export const onslaughtJointRequestSchema = z
  .object({
    cycleId: z.string().min(1),
    candidateTeams: z.array(candidateEndgameTeamSchema).min(3),
    bossOverrides: z.array(onslaughtBossConfigSchema).length(3).optional(),
  })
  .strict();
export type OnslaughtJointRequest = z.infer<typeof onslaughtJointRequestSchema>;
export type OnslaughtJointRequestInput = z.input<typeof onslaughtJointRequestSchema>;

export const onslaughtStageEvaluationSchema = z
  .object({
    stage: z.number().int().min(1).max(3),
    bossKey: z.string(),
    bossName: z.string(),
    team: candidateEndgameTeamSchema,
    stageScore: z.number(),
    mechanicCounters: z.array(z.string()),
    unsupportedMechanics: z.array(z.string()).default([]),
    gapNotes: z.array(z.string()).default([]),
  })
  .strict();
export type OnslaughtStageEvaluation = z.infer<typeof onslaughtStageEvaluationSchema>;

export const onslaughtJointResponseSchema = z
  .object({
    cycleId: z.string(),
    isCurrentCycle: z.boolean().default(true),
    isExpired: z.boolean().default(false),
    expirationNote: z.string().nullable().default(null),
    stages: z.array(onslaughtStageEvaluationSchema).length(3),
    jointScore: z.number(),
    allStagesCleared: z.boolean(),
    hasMechanicGaps: z.boolean().default(false),
    explanations: z.array(z.string()),
  })
  .strict();
export type OnslaughtJointResponse = z.infer<typeof onslaughtJointResponseSchema>;

// =======================================================
// Imaginarium Theater Dynamic Act & Vigor Schemas
// =======================================================

export const theaterActPlanRequestSchema = z
  .object({
    seasonId: z.string().min(1),
    difficulty: z.enum(['EASY', 'NORMAL', 'HARD', 'VISIONARY']).default('VISIONARY'),
    castKeys: z.array(z.string().min(1)).min(10),
    currentAct: z.number().int().min(1).max(10).default(1),
    remainingVigor: z.record(z.string(), z.number().int().min(0).max(2)),
    completedActs: z
      .array(
        z
          .object({
            act: z.number().int().min(1).max(10),
            teamKeys: z.array(z.string().min(1)).length(4),
          })
          .strict(),
      )
      .default([]),
  })
  .strict();
export type TheaterActPlanRequest = z.infer<typeof theaterActPlanRequestSchema>;
export type TheaterActPlanRequestInput = z.input<typeof theaterActPlanRequestSchema>;

export const theaterActScheduleItemSchema = z
  .object({
    act: z.number().int().min(1).max(10),
    isBoss: z.boolean(),
    bossName: z.string().nullable().default(null),
    recommendedTeam: z.array(z.string().min(1)).length(4),
    roleTags: z.record(z.string(), z.string()).default({}),
    rationale: z.string(),
  })
  .strict();
export type TheaterActScheduleItem = z.infer<typeof theaterActScheduleItemSchema>;

export const theaterActPlanResponseSchema = z
  .object({
    seasonId: z.string(),
    isCurrentSeason: z.boolean().default(true),
    isExpired: z.boolean().default(false),
    expirationNote: z.string().nullable().default(null),
    currentAct: z.number(),
    nextRecommendedTeam: z.array(z.string().min(1)).length(4),
    projectedSchedule: z.array(theaterActScheduleItemSchema),
    reservedForBosses: z.record(z.string(), z.number()),
    vigorExhaustionRisk: z.boolean(),
    ineligibleCastExcluded: z
      .array(
        z.object({
          characterKey: z.string(),
          reason: z.string(),
        }),
      )
      .default([]),
    explanations: z.array(z.string()),
  })
  .strict();
export type TheaterActPlanResponse = z.infer<typeof theaterActPlanResponseSchema>;
