import { z } from 'zod';

import { contextualAdviceSchema, contextualReviewSchema } from './contextual-advice.js';

export const contextualReleaseIdentitySchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]{0,79}$/),
    digest: z.string().regex(/^[a-f0-9]{64}$/),
    packHash: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export type ContextualReleaseIdentity = z.infer<typeof contextualReleaseIdentitySchema>;
export const contextualReleaseMetadataSchema = z
  .object({
    contractVersion: z.literal(1),
    release: contextualReleaseIdentitySchema,
    packVersion: z.string().max(80),
    subjects: z.array(z.string().max(80)).max(8),
    activeClaims: z.number().int().nonnegative().max(80),
    excludedClaims: z.number().int().nonnegative().max(80),
    reviewerTypes: z.array(z.enum(['agent', 'human'])).max(2),
    reviewScope: z.array(z.string().max(1000)).max(80),
    limitations: z.array(z.string().max(1000)).max(20),
    activation: z.literal('startup_snapshot_restart_required'),
  })
  .strict();
export type ContextualReleaseMetadata = z.infer<typeof contextualReleaseMetadataSchema>;
// V1/V2 remain strict and unchanged. V3 alone permits an actual human release review.
export const contextualReleaseAdviceDataSchema = contextualAdviceSchema.extend({
  contractVersion: z.literal(3),
  cards: z.array(
    contextualAdviceSchema.shape.cards.element.extend({
      review: contextualReviewSchema.extend({ type: z.enum(['agent', 'human']) }),
    }),
  ),
});
export type ContextualReleaseAdviceData = z.infer<typeof contextualReleaseAdviceDataSchema>;
export const contextualReleaseAdviceSchema = z
  .object({
    contractVersion: z.literal(3),
    release: contextualReleaseIdentitySchema,
    advice: contextualReleaseAdviceDataSchema,
  })
  .strict();
