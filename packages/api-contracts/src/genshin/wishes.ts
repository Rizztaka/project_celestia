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
