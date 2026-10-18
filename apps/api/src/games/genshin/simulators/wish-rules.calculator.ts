import type { WishBanner, WishItem, WishRequest } from '@celestia/api-contracts';
export interface WishState {
  endPity5: number;
  endPity4: number;
  endGuaranteed5: boolean;
  endGuaranteed4: boolean;
  endFatePoints: 0 | 1;
}
export interface WishCalculation extends WishState {
  pulls: WishItem[];
}
const threeStars = [
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
];
const fourStarWeapons = new Set([
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
]);
/** Explicit random stream makes every state transition reproducible. Soft pity is a modeling approximation. */
export function calculateWishes(
  banner: WishBanner,
  input: WishRequest,
  random: () => number,
): WishCalculation {
  const pick = (pool: readonly string[]) => pool[Math.floor(random() * pool.length)]!;
  let pity5 = input.currentPity5,
    pity4 = input.currentPity4;
  let guaranteed5 = input.guaranteed5,
    guaranteed4 = input.guaranteed4;
  let fate = input.fatePoints ?? 0;
  const target = input.pathTargetKey ?? banner.fiveStarKey;
  const weapon = banner.type === 'WEAPON';
  const chronicled = banner.type === 'CHRONICLED';
  const pulls: WishItem[] = [];
  for (let i = 0; i < input.count; i++) {
    pity5++;
    pity4++;
    const base5 = weapon ? 0.007 : 0.006;
    const soft = weapon ? 63 : 74;
    const probability5 =
      pity5 >= banner.hardPity
        ? 1
        : Math.min(1, base5 + Math.max(0, pity5 - soft + 1) * (weapon ? 0.07 : 0.06));
    if (random() < probability5) {
      let key: string;
      if (banner.fatePointCap && fate === 1) key = target;
      else if (chronicled)
        key = random() < 0.5 ? target : pick(banner.fiveStarKeys.filter((key) => key !== target));
      else
        key =
          guaranteed5 || random() < (weapon ? 0.75 : 0.5)
            ? pick(banner.fiveStarKeys)
            : pick(banner.standardFiveStarKeys);
      const featured = banner.fiveStarKeys.includes(key);
      guaranteed5 = chronicled ? false : !featured;
      if (banner.fatePointCap) fate = key === target ? 0 : 1;
      pulls.push({
        type: '5_STAR',
        itemKey: key,
        itemKind: weapon ? 'weapon' : 'character',
        isFeatured: chronicled ? key === target : featured,
      });
      pity5 = 0;
      continue;
    }
    const hard4 = weapon ? 9 : 10;
    const probability4 =
      pity4 >= hard4 ? 1 : pity4 === hard4 - 1 ? (weapon ? 0.66 : 0.561) : weapon ? 0.06 : 0.051;
    if (random() < probability4) {
      const featured = !chronicled && (guaranteed4 || random() < (weapon ? 0.75 : 0.5));
      const key = pick(featured ? banner.fourStarKeys : banner.standardFourStarKeys);
      pulls.push({
        type: '4_STAR',
        itemKey: key,
        itemKind: fourStarWeapons.has(key) ? 'weapon' : 'character',
        isFeatured: featured,
      });
      guaranteed4 = chronicled ? false : !featured;
      pity4 = 0;
    } else
      pulls.push({
        type: '3_STAR',
        itemKey: pick(threeStars),
        itemKind: 'weapon',
        isFeatured: false,
      });
  }
  return {
    pulls,
    endPity5: pity5,
    endPity4: pity4,
    endGuaranteed5: guaranteed5,
    endGuaranteed4: guaranteed4,
    endFatePoints: fate,
  };
}
