import { z } from 'zod';

// Enka's Genshin UID route accepts 9- or 10-digit numeric UIDs.
export const showcaseUidSchema = z
  .string()
  .regex(/^[1-9]\d{8,9}$/, 'Enter a 9- or 10-digit Genshin UID.');
export const showcaseStatSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    value: z.number().finite(),
    formatted: z.string(),
  })
  .strict();
export const showcaseEquipmentSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    icon: z.string().nullable(),
    rarity: z.number().int().nullable(),
    level: z.number().int().nullable(),
    ascension: z.number().int().nullable(),
    refinement: z.number().int().nullable(),
    slot: z.string().nullable(),
    setName: z.string().nullable(),
    stats: z.array(showcaseStatSchema),
    mainStat: showcaseStatSchema.nullable().default(null),
  })
  .strict();
export const showcaseCharacterSchema = z
  .object({
    key: z.string(),
    id: z.number().int(),
    skillDepotId: z.number().int().nullable(),
    name: z.string(),
    portrait: z.string().nullable(),
    element: z
      .enum(['Anemo', 'Geo', 'Electro', 'Dendro', 'Hydro', 'Pyro', 'Cryo'])
      .nullable()
      .default(null),
    metadataAvailable: z.boolean(),
    weaponType: z
      .enum(['Sword', 'Claymore', 'Polearm', 'Bow', 'Catalyst'])
      .nullable()
      .default(null),
    rarity: z
      .union([z.literal(4), z.literal(5)])
      .nullable()
      .default(null),
    level: z.number().int().nullable(),
    ascension: z.number().int().nullable(),
    constellation: z.number().int(),
    talents: z.array(
      z
        .object({
          id: z.string(),
          label: z.string(),
          kind: z.enum(['normal', 'skill', 'burst']).nullable().default(null),
          baseLevel: z.number().int(),
          bonusLevel: z.number().int().nullable(),
        })
        .strict(),
    ),
    equipmentAvailable: z.boolean(),
    weapon: showcaseEquipmentSchema.nullable(),
    artifacts: z.array(showcaseEquipmentSchema),
    stats: z.array(showcaseStatSchema),
  })
  .strict();
export const showcaseSnapshotSchema = z
  .object({
    uid: showcaseUidSchema,
    nickname: z.string(),
    adventureRank: z.number().int().nullable(),
    worldLevel: z.number().int().nullable(),
    signature: z.string().nullable(),
    characters: z.array(showcaseCharacterSchema),
  })
  .strict();
export const showcaseResultSchema = z
  .object({
    source: z.literal('enka.network'),
    delivery: z.enum(['fetched', 'cached', 'stale', 'unavailable']),
    fetchedAt: z.string().datetime().nullable(),
    nextRefreshAt: z.string().datetime(),
    snapshot: showcaseSnapshotSchema.nullable(),
    issue: z
      .object({
        code: z.string(),
        message: z.string(),
        status: z.number().int(),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type ShowcaseStat = z.infer<typeof showcaseStatSchema>;
export type ShowcaseEquipment = z.infer<typeof showcaseEquipmentSchema>;
export type ShowcaseCharacter = z.infer<typeof showcaseCharacterSchema>;
export type ShowcaseSnapshot = z.infer<typeof showcaseSnapshotSchema>;
export type ShowcaseResult = z.infer<typeof showcaseResultSchema>;
