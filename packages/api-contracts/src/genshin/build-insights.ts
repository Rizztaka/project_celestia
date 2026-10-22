import { z } from 'zod';

const key = z.string().min(1).max(200);
export const buildInsightQuerySchema = z
  .object({
    weapon: key.optional(),
    refinement: z.coerce.number().int().min(1).max(5).optional(),
    artifactSet: key.optional(),
    pieces: z.coerce.number().int().min(1).max(5).optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      (v.weapon && v.artifactSet) ||
      (v.refinement && !v.weapon) ||
      (v.pieces && !v.artifactSet) ||
      (v.artifactSet && !v.pieces)
    )
      ctx.addIssue({
        code: 'custom',
        message: 'Choose one hypothetical weapon or a set with an explicit piece count.',
      });
  });
export type BuildInsightQuery = z.infer<typeof buildInsightQuerySchema>;
export const insightSourceSchema = z
  .object({
    url: z.string().url(),
    revision: z.string(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    license: z.literal('MIT'),
  })
  .strict();
export const buildInsightCardSchema = z
  .object({
    id: key,
    title: z.string(),
    state: z.enum(['applies', 'conditional', 'not_applicable', 'unavailable', 'reference']),
    basis: z.enum(['recorded', 'hypothetical', 'reference']),
    explanations: z.array(z.string()),
    conditions: z.array(
      z.object({ key: key, truth: z.enum(['true', 'false', 'unknown']) }).strict(),
    ),
    sourceText: z.string().nullable(),
    source: insightSourceSchema.nullable(),
  })
  .strict();
export type BuildInsightCard = z.infer<typeof buildInsightCardSchema>;
export const buildInsightsResponseSchema = z
  .object({
    contractVersion: z.literal(1),
    engineVersion: z.literal('deterministic-build-v1'),
    characterKey: key,
    characterName: z.string(),
    weaponType: z.string(),
    recorded: z.boolean(),
    observation: z.string().regex(/^[a-f0-9]{64}$/),
    cards: z.array(buildInsightCardSchema),
    comparison: z.array(buildInsightCardSchema).nullable(),
    weaponOptions: z.array(z.object({ key, name: z.string() }).strict()),
    artifactOptions: z.array(z.object({ key, name: z.string() }).strict()),
    limitations: z.array(z.string()),
  })
  .strict();
export type BuildInsightsResponse = z.infer<typeof buildInsightsResponseSchema>;
