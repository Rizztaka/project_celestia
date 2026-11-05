import { z } from 'zod';
export interface WishBanner {
  bannerId: string;
  name: string;
  type: 'CHARACTER' | 'WEAPON' | 'CHRONICLED';
  fiveStarKey: string;
  fiveStarKeys: string[];
  fourStarKeys: string[];
  startDate: string;
  endDate: string;
  historical: boolean;
  region?: string;
  sourceUrl: string;
  hardPity: number;
  fatePointCap: number;
  standardFiveStarKeys: string[];
  standardFourStarKeys: string[];
}
export const wishRequestSchema = z
  .object({
    bannerId: z.string().min(1).max(100),
    count: z.number().int().min(1).max(100),
    currentPity5: z.number().int().min(0).max(89),
    currentPity4: z.number().int().min(0).max(10000),
    guaranteed5: z.boolean(),
    guaranteed4: z.boolean(),
    pathTargetKey: z.string().min(1).max(100).optional(),
    fatePoints: z.union([z.literal(0), z.literal(1)]).optional(),
  })
  .strict();
export type WishRequest = z.infer<typeof wishRequestSchema>;
export interface WishItem {
  type: '3_STAR' | '4_STAR' | '5_STAR';
  itemKey: string;
  itemKind: 'character' | 'weapon';
  isFeatured: boolean;
}
export interface WishResultItem extends WishItem {
  id: string;
}
export interface WishResult {
  pulls: WishResultItem[];
  endPity5: number;
  endPity4: number;
  endGuaranteed5: boolean;
  endGuaranteed4: boolean;
  endFatePoints: 0 | 1;
}

/** Bump when sandbox probabilities, pools or state transitions change. */
export const WISH_SANDBOX_RULES_VERSION = 'historical-baseline-1';
export const wishThreeStarWeaponKeys = [
  'HarbingerOfDawn',
  'Slingshot',
  'ThrillingTalesOfDragonSlayers',
  'BlackTassel',
  'DebateClub',
  'BloodtaintedGreatsword',
  'CoolSteel',
  'SharpshootersOath',
  'MagicGuide',
  'FerrousShadow',
  'EmeraldOrb',
  'RavenBow',
  'SkyriderSword',
] as const;
export const wishFourStarWeaponKeys = [
  'FavoniusSword',
  'TheFlute',
  'SacrificialSword',
  'LionsRoar',
  'FavoniusGreatsword',
  'TheBell',
  'SacrificialGreatsword',
  'Rainslasher',
  'DragonsBane',
  'FavoniusLance',
  'FavoniusCodex',
  'TheWidsith',
  'SacrificialFragments',
  'EyeOfPerception',
  'FavoniusWarbow',
  'TheStringless',
  'SacrificialBow',
  'Rust',
  'LithicBlade',
] as const;
const itemKeySchema = z.string().min(1).max(100);
export const wishBannerSchema: z.ZodType<WishBanner> = z
  .object({
    bannerId: itemKeySchema,
    name: z.string().min(1).max(160),
    type: z.enum(['CHARACTER', 'WEAPON', 'CHRONICLED']),
    fiveStarKey: itemKeySchema,
    fiveStarKeys: z.array(itemKeySchema).min(1).max(30),
    fourStarKeys: z.array(itemKeySchema).max(100),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    historical: z.boolean(),
    region: z.string().max(100).optional(),
    sourceUrl: z.string().url(),
    hardPity: z.number().int().min(1).max(90),
    fatePointCap: z.number().int().min(0).max(1),
    standardFiveStarKeys: z.array(itemKeySchema).max(100),
    standardFourStarKeys: z.array(itemKeySchema).min(1).max(150),
  })
  .strict();

export const wishSandboxCatalogSchema = z
  .object({
    contractVersion: z.literal(1),
    rulesVersion: z.string().min(1).max(80),
    notices: z.array(z.string().min(1).max(600)).min(1).max(12),
    banners: z.array(wishBannerSchema).min(1).max(64),
  })
  .strict();
export type WishSandboxCatalog = z.infer<typeof wishSandboxCatalogSchema>;
export const wishSandboxRequestSchema = wishRequestSchema
  .extend({
    rulesVersion: z.string().min(1).max(80),
    currentPity4: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  })
  .refine((input) => input.currentPity4 <= Number.MAX_SAFE_INTEGER - input.count, {
    message: 'The fictional pity counter reached its numeric limit. Reset the sandbox.',
  });
export type WishSandboxRequest = z.infer<typeof wishSandboxRequestSchema>;
export const wishResultSchema: z.ZodType<WishResult> = z
  .object({
    pulls: z
      .array(
        z
          .object({
            id: z.string().min(1).max(100),
            type: z.enum(['3_STAR', '4_STAR', '5_STAR']),
            itemKey: itemKeySchema,
            itemKind: z.enum(['character', 'weapon']),
            isFeatured: z.boolean(),
          })
          .strict(),
      )
      .min(1)
      .max(100),
    endPity5: z.number().int().min(0).max(89),
    endPity4: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    endGuaranteed5: z.boolean(),
    endGuaranteed4: z.boolean(),
    endFatePoints: z.union([z.literal(0), z.literal(1)]),
  })
  .strict();
