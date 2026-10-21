import { z } from 'zod';

export const guideScenarioSchema = z
  .object({
    contractVersion: z.literal('1'),
    hp: z.enum(['unknown', 'above_90', 'at_or_below_90']).default('unknown'),
    example: z.literal('harbinger').optional(),
    refinement: z.enum(['unknown', '1', '2', '3', '4', '5']).optional(),
  })
  .strict()
  .refine((value) => value.example || value.refinement === undefined, {
    message: 'Refinement assumptions require an explicit hypothetical example.',
  });
export type GuideScenario = z.infer<typeof guideScenarioSchema>;
export const truthSchema = z.enum(['true', 'false', 'unknown']);
const receipt = z
  .object({
    status: z.enum(['unknown', 'imported']),
    importedAt: z.string().datetime().nullable(),
    source: z.string().nullable(),
    entryCount: z.number().int().nonnegative().nullable(),
    scope: z.enum(['merged_entries', 'replacement_section']),
  })
  .strict();
export const guideAdviceSchema = z
  .object({
    contractVersion: z.literal(1),
    characterKey: z.string(),
    packVersion: z.string(),
    fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    coverage: z.enum(['supported', 'unsupported']),
    scenario: guideScenarioSchema,
    observation: z
      .object({
        weaponState: z.enum(['recorded_assigned', 'unrecorded', 'unknown']),
        weaponKey: z.string().nullable(),
        refinement: z.number().nullable(),
        charactersReceipt: receipt,
        weaponsReceipt: receipt,
      })
      .strict(),
    basis: z.enum(['recorded', 'hypothetical', 'no_weapon_scenario']),
    refinement: z.number().int().min(1).max(5).nullable(),
    applicability: truthSchema,
    conclusion: z.enum(['unsupported', 'no_weapon_scenario', 'active', 'inactive', 'conditional']),
    conditionalCritRatePp: z.number().min(0).max(100).nullable(),
    modeledCritRatePp: z.number().min(0).max(100).nullable(),
    trace: z.array(z.object({ predicate: z.string(), result: truthSchema }).strict()),
    explanations: z.array(z.string()),
    evidence: z.array(
      z
        .object({
          id: z.string(),
          url: z.string().url(),
          revision: z.string(),
          sha256: z.string(),
        })
        .strict(),
    ),
    review: z
      .object({
        reviewer: z.string(),
        type: z.literal('agent'),
        date: z.string(),
        scope: z.string(),
      })
      .strict(),
    limitations: z.array(z.string()),
    externalReading: z.string().url(),
  })
  .strict();
export type GuideAdvice = z.infer<typeof guideAdviceSchema>;
