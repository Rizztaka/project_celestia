import { z } from 'zod';

import { type CharacterEquipmentResponse, characterKeySchema } from './character-equipment.js';

export const contextualPackVersion = 'k2-1';
export const contextualRoles = [
  'unknown',
  'on_field',
  'off_field',
  'burst_swap',
  'quickswap_support',
] as const;
export const contextualSets = ['MarechausseeHunter', 'GoldenTroupe', 'ViridescentVenerer'] as const;
const yesNo = z.enum(['unknown', 'yes', 'no']).default('unknown');
const element = z.enum(['unknown', 'pyro', 'hydro', 'electro', 'cryo', 'anemo', 'geo', 'dendro']);
export const teamSelectionSchema = z
  .array(
    z
      .object({ characterKey: characterKeySchema, selection: z.enum(['owned', 'hypothetical']) })
      .strict(),
  )
  .max(3)
  .refine(
    (members) => new Set(members.map((member) => member.characterKey)).size === members.length,
    'Duplicate team member.',
  );
const fields = {
  contractVersion: z.literal('2'),
  role: z.enum(contextualRoles).default('unknown'),
  burst: z.enum(['unknown', 'use', 'skip']).default('unknown'),
  setExample: z.enum(['recorded', ...contextualSets]).default('recorded'),
  examplePieces: z.enum(['unknown', '0', '1', '2', '3', '4', '5']).default('unknown'),
  hpChange: yesNo,
  mhOnField: yesNo,
  mhStacks: z.enum(['unknown', '0', '1', '2', '3']).default('unknown'),
  mhWindow: z.enum(['unknown', 'within_5s', 'expired']).default('unknown'),
  gtField: z
    .enum(['unknown', 'off_field', 'returned_under_2s_with_bonus', 'on_field_at_least_2s'])
    .default('unknown'),
  swirl: yesNo,
  swirlElement: element.default('unknown'),
  targetElement: element.default('unknown'),
  vvOnField: yesNo,
  vvWindow: z.enum(['unknown', 'within_10s', 'expired']).default('unknown'),
  activeCharacter: characterKeySchema.optional(),
  oz: yesNo,
  electroReaction: yesNo,
  exampleFischlA4: z.enum(['unknown', 'unlocked']).default('unknown'),
};
const validateScenario = (value: { setExample: string; examplePieces: string }) =>
  value.setExample !== 'recorded' || value.examplePieces === 'unknown';
export const contextualScenarioSchema = z
  .object({ ...fields, team: teamSelectionSchema.optional() })
  .strict()
  .refine(validateScenario, 'Piece assumptions require an explicit hypothetical set.');
export type ContextualScenario = z.infer<typeof contextualScenarioSchema>;
export const contextualQuerySchema = z
  .object({
    ...fields,
    team: z
      .string()
      .max(1500)
      .transform((value, ctx) => {
        try {
          return JSON.parse(value) as unknown;
        } catch {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid team JSON.' });
          return z.NEVER;
        }
      })
      .pipe(teamSelectionSchema)
      .optional(),
  })
  .strict()
  .refine(validateScenario, 'Piece assumptions require an explicit hypothetical set.');
export function normalizeContextualScenario(scenario: ContextualScenario): ContextualScenario {
  return {
    ...scenario,
    ...(scenario.team
      ? {
          team: [...scenario.team].sort((a, b) =>
            a.characterKey < b.characterKey ? -1 : a.characterKey > b.characterKey ? 1 : 0,
          ),
        }
      : {}),
  };
}
export function contextualEquipmentIdentity(equipment: CharacterEquipmentResponse) {
  return {
    characterKey: equipment.character.characterKey,
    ascension: equipment.character.ascension,
    talents: equipment.character.talents,
    talentBasis: equipment.character.talentBasis,
    artifacts: Object.fromEntries(
      Object.entries(equipment.artifacts)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([slot, value]) => [slot, { state: value.state, setKey: value.item?.setKey ?? null }]),
    ),
    artifactRelationsConsistent: equipment.artifactRelationsConsistent,
    charactersReceipt: equipment.provenance.characters,
    artifactsReceipt: equipment.provenance.artifacts,
  };
}
export const contextualTruthSchema = z.enum(['true', 'false', 'unknown']);
export const factValueSchema = z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.null(),
  z.object({ min: z.number().int().min(0).max(6), max: z.number().int().min(0).max(6) }).strict(),
]);
export const factOriginSchema = z.enum(['recorded', 'assumed', 'unknown', 'mixed']);
export const contextualTraceSchema = z
  .object({
    path: z.string(),
    op: z.enum(['all', 'any', 'not', 'equals', 'atLeast', 'known']),
    fact: z.string().nullable(),
    value: factValueSchema,
    expected: z.union([z.string(), z.number(), z.boolean(), z.null()]),
    origin: factOriginSchema,
    result: contextualTruthSchema,
  })
  .strict();
export const contextualSourceSchema = z
  .object({
    id: z.string().min(1).max(80),
    url: z.string().url().startsWith('https://'),
    revision: z.string().min(1).max(100),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    kind: z.enum(['mit_source', 'reference_observation']),
    upstreamVersion: z.string().min(1).max(200),
  })
  .strict();
export const contextualReviewSchema = z
  .object({
    state: z.enum(['reviewed', 'candidate', 'conflicted', 'unsupported']),
    reviewer: z.string().min(1).max(100),
    type: z.literal('agent'),
    date: z.string().date(),
    scope: z.string().min(1).max(1000),
  })
  .strict();
export const contextualEffectSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('crit_rate'),
      unit: z.literal('crit_rate_percentage_points'),
      perStack: z.number().positive().max(100),
      maxStacks: z.number().int().min(1).max(3),
      stackFact: z.literal('mh.stacks'),
      durationSeconds: z.number().positive().max(10),
    })
    .strict(),
  z
    .object({
      kind: z.literal('damage_bonus'),
      unit: z.literal('damage_bonus_percent'),
      amount: z.number().nonnegative().max(100),
      target: z.enum(['normal_charged', 'skill', 'anemo', 'ordinary_swirl']),
    })
    .strict(),
  z
    .object({
      kind: z.literal('resistance_reduction'),
      unit: z.literal('resistance_percentage_points'),
      amount: z.number().positive().max(100),
      elementFact: z.literal('vv.targetElement'),
      durationSeconds: z.number().positive().max(20),
    })
    .strict(),
  z
    .object({
      kind: z.literal('talent_relevance'),
      code: z.enum([
        'role_unknown',
        'on_field_attacks',
        'oz_skill',
        'plunge_support',
        'burst_swap',
      ]),
      relevant: z.array(z.enum(['normal', 'skill', 'burst'])).max(3),
    })
    .strict(),
  z
    .object({
      kind: z.literal('energy_context'),
      plan: z.enum(['unknown', 'use', 'skip']),
      purpose: z.enum(['personal_damage', 'oz_refresh', 'application']),
    })
    .strict(),
  z.object({ kind: z.literal('team_context'), code: z.literal('oz_reaction') }).strict(),
]);
export const contextualAdviceSchema = z
  .object({
    contractVersion: z.literal(2),
    packVersion: z.string(),
    fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    characterKey: characterKeySchema,
    coverage: z.enum(['supported', 'unsupported']),
    supportedRoles: z.array(z.enum(contextualRoles)),
    scenario: contextualScenarioSchema,
    observationFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    team: z
      .array(
        z
          .object({
            characterKey: characterKeySchema,
            selection: z.enum(['owned', 'hypothetical']),
            origin: factOriginSchema,
            ascension: z.number().int().min(0).max(6).nullable(),
          })
          .strict(),
      )
      .max(4),
    setBounds: z.array(
      z
        .object({
          setKey: z.enum(contextualSets),
          recorded: z.object({ min: z.number(), max: z.number() }).strict(),
          modeled: z.object({ min: z.number(), max: z.number() }).strict(),
          origin: factOriginSchema,
        })
        .strict(),
    ),
    cards: z.array(
      z
        .object({
          id: z.string(),
          topic: z.enum(['talents', 'energy', 'team', ...contextualSets]),
          kind: z.enum(['mechanical', 'editorial']),
          applicability: contextualTruthSchema,
          eligibility: contextualTruthSchema,
          conclusion: z.enum(['applies', 'conditional', 'inactive']),
          presentation: z.enum(['card', 'details']),
          effect: contextualEffectSchema,
          potential: z
            .object({
              amount: z.number().nullable(),
              maximum: z.number(),
              unit: z.enum([
                'crit_rate_percentage_points',
                'damage_bonus_percent',
                'resistance_percentage_points',
              ]),
              target: z.string(),
              durationSeconds: z.number().nullable(),
            })
            .strict()
            .nullable(),
          modeledAmount: z.number().nullable(),
          trace: z.array(contextualTraceSchema),
          sourceIds: z.array(z.string()),
          review: contextualReviewSchema,
          title: z.string(),
          summary: z.string(),
          explanation: z.string(),
        })
        .strict(),
    ),
    sources: z.array(contextualSourceSchema),
    excluded: z.array(z.object({ id: z.string(), reason: z.string() }).strict()),
    limitations: z.array(z.string()),
    externalReading: z.array(z.object({ label: z.string(), url: z.string().url() }).strict()),
  })
  .strict();
export type ContextualAdvice = z.infer<typeof contextualAdviceSchema>;
