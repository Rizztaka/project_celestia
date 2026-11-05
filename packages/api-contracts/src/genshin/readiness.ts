import { z } from 'zod';

export const readinessStatusSchema = z.enum([
  'ready_for_target',
  'needs_investment',
  'conditional',
  'insufficient_data',
]);
export type ReadinessStatus = z.infer<typeof readinessStatusSchema>;

export const readinessDimensionSchema = z.enum([
  'talents',
  'weapon',
  'main_stats',
  'set_activation',
  'rotation_energy',
  'support_output',
]);
export type ReadinessDimension = z.infer<typeof readinessDimensionSchema>;

export const readinessMissingDataSchema = z
  .object({
    dimension: readinessDimensionSchema,
    status: z.enum(['missing', 'unsupported', 'unmodeled', 'incomplete']),
    reason: z.string().min(1).max(200),
  })
  .strict();
export type ReadinessMissingData = z.infer<typeof readinessMissingDataSchema>;

export const readinessDimensionResultSchema = z
  .object({
    dimension: readinessDimensionSchema,
    status: readinessStatusSchema,
    score: z.number().min(0).max(100),
    isReady: z.boolean(),
    details: z.record(z.string(), z.unknown()).default({}),
    missingReasons: z.array(z.string()).default([]),
  })
  .strict();
export type ReadinessDimensionResult = z.infer<typeof readinessDimensionResultSchema>;

export const readinessArtifactSlotSchema = z.enum([
  'flower',
  'plume',
  'sands',
  'goblet',
  'circlet',
]);
export type ReadinessArtifactSlot = z.infer<typeof readinessArtifactSlotSchema>;

export const readinessArtifactInputSchema = z
  .object({
    slot: readinessArtifactSlotSchema,
    setKey: z.string().nullable().default(null),
    mainStatKey: z.string().nullable().default(null),
    level: z.number().int().min(0).max(20).nullable().optional(),
    rarity: z.number().int().min(1).max(5).nullable().optional(),
  })
  .strict();
export type ReadinessArtifactInput = z.infer<typeof readinessArtifactInputSchema>;

export const readinessWeaponInputSchema = z
  .object({
    weaponKey: z.string().min(1),
    level: z.number().int().min(1).max(90).nullable().optional(),
    refinement: z.number().int().min(1).max(5).nullable().optional().default(1),
    weaponType: z.string().optional(),
  })
  .strict();
export type ReadinessWeaponInput = z.infer<typeof readinessWeaponInputSchema>;

export const readinessCharacterTalentsSchema = z
  .object({
    normal: z.number().int().min(1).max(15).nullable().default(null),
    skill: z.number().int().min(1).max(15).nullable().default(null),
    burst: z.number().int().min(1).max(15).nullable().default(null),
  })
  .strict();
export type ReadinessCharacterTalents = z.infer<typeof readinessCharacterTalentsSchema>;

export const readinessCharacterBuildSchema = z
  .object({
    characterKey: z.string().min(1),
    level: z.number().int().min(1).max(90).nullable().optional(),
    ascension: z.number().int().min(0).max(6).nullable().optional(),
    constellation: z.number().int().min(0).max(6).nullable().optional().default(0),
    talents: readinessCharacterTalentsSchema.optional().default({
      normal: null,
      skill: null,
      burst: null,
    }),
    weapon: readinessWeaponInputSchema.nullable().optional().default(null),
    artifacts: z
      .record(readinessArtifactSlotSchema, readinessArtifactInputSchema.nullable())
      .optional()
      .default({
        flower: null,
        plume: null,
        sands: null,
        goblet: null,
        circlet: null,
      }),
    stats: z.record(z.string(), z.number()).optional().default({}),
  })
  .strict();
export type ReadinessCharacterBuild = z.infer<typeof readinessCharacterBuildSchema>;

export const roleBenchmarkProfileSchema = z
  .object({
    roleId: z.string().min(1),
    roleName: z.string().optional(),
    targetLevel: z.number().int().min(1).max(90).default(80),
    targetAscension: z.number().int().min(0).max(6).default(5),
    priorityTalents: z.array(z.enum(['normal', 'skill', 'burst'])).default([]),
    minTalentLevels: z
      .record(z.enum(['normal', 'skill', 'burst']), z.number().int().min(1).max(10))
      .default({}),
    recommendedWeapons: z.array(z.string()).default([]),
    minWeaponLevel: z.number().int().min(1).max(90).default(80),
    recommendedMainStats: z
      .record(z.enum(['sands', 'goblet', 'circlet']), z.array(z.string()))
      .default({}),
    conditionalMainStats: z
      .record(z.enum(['sands', 'goblet', 'circlet']), z.record(z.string(), z.string()))
      .optional(),
    recommendedSets: z
      .array(
        z
          .object({
            setKey: z.string(),
            pieces: z.union([z.literal(2), z.literal(4)]),
          })
          .strict(),
      )
      .default([]),
    energyRechargeThreshold: z.number().min(100).max(350).default(100),
    scalingStat: z.enum(['atk', 'def', 'hp', 'em', 'er']).default('atk'),
    minSupportStatThreshold: z.number().min(0).optional(),
  })
  .strict();
export type RoleBenchmarkProfile = z.infer<typeof roleBenchmarkProfileSchema>;

export const readinessRoleInputSchema = z.union([z.string().min(1), roleBenchmarkProfileSchema]);
export type ReadinessRoleInput = z.infer<typeof readinessRoleInputSchema>;

export const readinessTargetEncounterSchema = z
  .object({
    encounterId: z.string().optional().default('training_dummy'),
    name: z.string().optional().default('Benchmark Target'),
    difficulty: z
      .enum(['dummy_benchmark', 'overworld', 'abyss_11', 'abyss_12', 'theater'])
      .optional()
      .default('dummy_benchmark'),
    minCharacterLevel: z.number().int().min(1).max(90).optional().default(80),
    minWeaponLevel: z.number().int().min(1).max(90).optional().default(80),
    elementalAura: z.string().optional(),
  })
  .strict();
export type ReadinessTargetEncounter = z.infer<typeof readinessTargetEncounterSchema>;

export const readinessTeamEnergyContextSchema = z
  .object({
    partyMembers: z.array(z.string()).optional().default([]),
    particlesPerRotation: z.number().min(0).optional().default(0),
    favoniusWeaponCount: z.number().int().min(0).max(4).optional().default(0),
    sameElementCount: z.number().int().min(0).max(4).optional().default(1),
    rotationLengthSeconds: z.number().min(5).max(60).optional().default(20),
    estimatedErRequirement: z.number().min(100).max(350).optional(),
  })
  .strict();
export type ReadinessTeamEnergyContext = z.infer<typeof readinessTeamEnergyContextSchema>;

export const characterReadinessRequestSchema = z
  .object({
    character: readinessCharacterBuildSchema,
    roleProfile: readinessRoleInputSchema.optional(),
    targetEncounter: readinessTargetEncounterSchema.optional(),
    teamEnergyContext: readinessTeamEnergyContextSchema.optional(),
  })
  .strict();
export type CharacterReadinessRequest = z.infer<typeof characterReadinessRequestSchema>;
export type CharacterReadinessRequestInput = z.input<typeof characterReadinessRequestSchema>;

export const characterReadinessRecommendationSchema = z
  .object({
    status: readinessStatusSchema,
    dimensions: z.record(readinessDimensionSchema, readinessDimensionResultSchema),
    missingData: z.array(readinessMissingDataSchema),
  })
  .strict();
export type CharacterReadinessRecommendation = z.infer<
  typeof characterReadinessRecommendationSchema
>;

export const characterReadinessResponseSchema = z
  .object({
    status: readinessStatusSchema,
    score: z.number().min(0).max(100),
    dimensions: z.record(readinessDimensionSchema, readinessDimensionResultSchema),
    explanations: z.array(z.string()),
    missingData: z.array(readinessMissingDataSchema),
    recommendation: characterReadinessRecommendationSchema.optional(),
  })
  .strict();
export type CharacterReadinessResponse = z.infer<typeof characterReadinessResponseSchema>;
