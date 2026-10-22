import { z } from 'zod';

const key = z.string().min(1).max(200);
const text = z.string().max(20000);
export const referenceSourceSchema = z
  .object({
    url: z.string().url().max(500),
    revision: z.string().max(100),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    license: z.literal('MIT'),
  })
  .strict();
export const referenceEntrySchema = z
  .object({
    key,
    name: z.string().min(1).max(300),
    description: text,
    kind: z.enum(['normal', 'skill', 'burst', 'passive', 'special', 'constellation']),
    constellation: z.number().int().min(1).max(6).nullable(),
    // The pinned talent records do not supply verified unlock requirements.
    unlock: z.enum(['constellation', 'unknown']),
  })
  .strict();
export const referenceOptionSchema = z.object({ key, name: z.string().max(300) }).strict();
export const characterProfileReferenceSchema = z
  .object({
    contractVersion: z.literal(1),
    key,
    gameId: z.number().int(),
    name: z.string().max(300),
    description: text,
    element: z.string().max(50),
    weaponType: z.string().max(50),
    rarity: z.number().int().min(1).max(5),
    forms: z.array(referenceOptionSchema).max(7),
    talents: z.array(referenceEntrySchema).max(30),
    constellations: z.array(referenceEntrySchema).max(6),
    weapons: z.array(referenceOptionSchema).max(300),
    artifactSets: z.array(referenceOptionSchema).max(100),
    sources: z.array(referenceSourceSchema).max(3),
    gaps: z.array(z.string().max(500)).max(10),
  })
  .strict();
export const weaponProfileReferenceSchema = z
  .object({
    contractVersion: z.literal(1),
    key,
    gameId: z.number().int(),
    name: z.string().max(300),
    description: text,
    weaponType: z.string().max(50),
    rarity: z.number().int().min(1).max(5),
    effectName: z.string().max(300),
    refinements: z
      .array(
        z
          .object({
            rank: z.number().int().min(1).max(5),
            description: text,
          })
          .strict(),
      )
      .max(5),
    source: referenceSourceSchema,
  })
  .strict();
export const artifactProfileReferenceSchema = z
  .object({
    contractVersion: z.literal(1),
    key,
    gameId: z.number().int(),
    name: z.string().max(300),
    pieces: z
      .array(z.object({ slot: key, name: z.string().max(300), description: text }).strict())
      .max(5),
    effects: z
      .array(z.object({ pieces: z.number().int().min(1).max(4), description: text }).strict())
      .max(3),
    source: referenceSourceSchema,
  })
  .strict();
export type CharacterProfileReference = z.infer<typeof characterProfileReferenceSchema>;
export type ProfileReferenceEntry = z.infer<typeof referenceEntrySchema>;
export type WeaponProfileReference = z.infer<typeof weaponProfileReferenceSchema>;
export type ArtifactProfileReference = z.infer<typeof artifactProfileReferenceSchema>;
