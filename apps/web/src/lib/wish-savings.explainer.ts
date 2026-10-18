import type { calculateSavings } from './wish-savings.calculator';

export function savingsVerdict(result: NonNullable<ReturnType<typeof calculateSavings>>) {
  if (result.featuredGuaranteed) return 'Guaranteed featured 5★ budget';
  if (result.hardGuaranteed)
    return 'Hard pity guaranteed — a 5★, with featured still subject to the banner guarantee';
  if (result.softReached) return 'Soft pity range reached — higher chance, no guarantee';
  return 'Keep saving toward soft pity';
}
