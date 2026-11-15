import type {
  Character,
  EnhancedPullAdvice,
  OwnedCharacterProfile,
  OwnedWeapon,
  PullAdvice,
  PullBudgetState,
  PullTargetType,
} from '../types/genshin';
import { CHARACTERS } from '../data/characters';
import { BANNER_PHASES } from '../data/banners';
import { getWeaponByKey } from '../data/weapons';
import {
  calculateCharacterBannerOdds,
  calculateWeaponBannerOdds,
} from './gacha-math';

// Notable 5-star target pool for accounts
const PULL_CANDIDATES = [
  'Xilonen',
  'Mavuika',
  'Citlali',
  'Nefer',
  'Lauma',
  'Furina',
  'Neuvillette',
  'Nahida',
  'KaedeharaKazuha',
  'Zhongli',
  'Yelan',
  'Arlecchino',
  'RaidenShogun',
  'Baizhu',
  'Xianyun',
  'Navia',
  'Alhaitham',
  'Clorinde',
  'Chasca',
  'Kinich',
];

interface SignatureWeaponConfig {
  weaponKey: string;
  name: string;
  baseUpliftPct: number;
  substitutes: Array<{
    key: string;
    minRefinement?: number;
    penaltyPct: number;
    penaltyReason: string;
  }>;
}

const SIGNATURE_WEAPONS: Record<string, SignatureWeaponConfig> = {
  Neuvillette: {
    weaponKey: 'TomeOfTheEternalFlow',
    name: 'Tome of the Eternal Flow',
    baseUpliftPct: 24,
    substitutes: [
      {
        key: 'SacrificialJade',
        minRefinement: 4,
        penaltyPct: 18,
        penaltyReason: 'You already own Sacrificial Jade (R4-R5), which is within ~6% of Tome of the Eternal Flow.',
      },
      {
        key: 'SacrificialJade',
        minRefinement: 1,
        penaltyPct: 12,
        penaltyReason: 'You already own Sacrificial Jade, an outstanding CRIT Rate & HP substitute.',
      },
      {
        key: 'LostPrayerToTheSacredWinds',
        minRefinement: 1,
        penaltyPct: 10,
        penaltyReason: 'You already own Lost Prayer to the Sacred Winds (5-star alternative).',
      },
    ],
  },
  Furina: {
    weaponKey: 'SplendorOfTranquilWaters',
    name: 'Splendor of Tranquil Waters',
    baseUpliftPct: 16,
    substitutes: [
      {
        key: 'FavoniusSword',
        minRefinement: 1,
        penaltyPct: 8,
        penaltyReason: 'Favonius Sword provides crucial team energy and solves Furina high ER requirement.',
      },
      {
        key: 'FleuveCendreFerryman',
        minRefinement: 4,
        penaltyPct: 7,
        penaltyReason: 'Fleuve Cendre Ferryman R5 provides high ER and Skill Crit Rate for free.',
      },
    ],
  },
  Xilonen: {
    weaponKey: 'PeakPatrolSong',
    name: 'Peak Patrol Song',
    baseUpliftPct: 20,
    substitutes: [
      {
        key: 'FavoniusSword',
        minRefinement: 1,
        penaltyPct: 8,
        penaltyReason: 'Favonius Sword provides team energy recharge and smooth burst rotations.',
      },
    ],
  },
  Mavuika: {
    weaponKey: 'AThousandBlazingSuns',
    name: 'A Thousand Blazing Suns',
    baseUpliftPct: 22,
    substitutes: [
      {
        key: 'BeaconOfTheReedSea',
        minRefinement: 1,
        penaltyPct: 10,
        penaltyReason: 'Beacon of the Reed Sea provides strong high CRIT Rate alternative.',
      },
    ],
  },
  Arlecchino: {
    weaponKey: 'CrimsonMoonSSemblance',
    name: "Crimson Moon's Semblance",
    baseUpliftPct: 22,
    substitutes: [
      {
        key: 'StaffOfHoma',
        minRefinement: 1,
        penaltyPct: 11,
        penaltyReason: 'Staff of Homa is an exceptional 5-star polearm with comparable high damage.',
      },
      {
        key: 'PrimordialJadeWingedSpear',
        minRefinement: 1,
        penaltyPct: 10,
        penaltyReason: 'PJWS provides high CRIT Rate and ATK stacking.',
      },
      {
        key: 'Deathmatch',
        minRefinement: 4,
        penaltyPct: 9,
        penaltyReason: 'Deathmatch (high refinement) provides high CRIT Rate and ATK bonus.',
      },
    ],
  },
  Nahida: {
    weaponKey: 'AThousandFloatingDreams',
    name: 'A Thousand Floating Dreams',
    baseUpliftPct: 15,
    substitutes: [
      {
        key: 'SacrificialFragments',
        minRefinement: 3,
        penaltyPct: 8,
        penaltyReason: 'Sacrificial Fragments provides 221 EM to easily cap 1,000 EM.',
      },
      {
        key: 'TheWidsith',
        minRefinement: 4,
        penaltyPct: 7,
        penaltyReason: 'The Widsith provides high burst potential and massive EM/DMG rolls.',
      },
    ],
  },
  Citlali: {
    weaponKey: 'StarcallerSWatch',
    name: "Starcaller's Watch",
    baseUpliftPct: 18,
    substitutes: [],
  },
  Nefer: {
    weaponKey: 'ReliquaryOfTruth',
    name: 'Reliquary of Truth',
    baseUpliftPct: 24,
    substitutes: [
      {
        key: 'SacrificialJade',
        minRefinement: 1,
        penaltyPct: 12,
        penaltyReason: 'Sacrificial Jade provides CRIT Rate and 80 EM.',
      },
    ],
  },
  KaedeharaKazuha: {
    weaponKey: 'FreedomSworn',
    name: 'Freedom-Sworn',
    baseUpliftPct: 16,
    substitutes: [
      {
        key: 'XiphosMoonlight',
        minRefinement: 3,
        penaltyPct: 9,
        penaltyReason: 'Xiphos Moonlight gives EM and party ER conversion.',
      },
      {
        key: 'FavoniusSword',
        minRefinement: 1,
        penaltyPct: 8,
        penaltyReason: 'Favonius Sword ensures reliable burst uptime.',
      },
    ],
  },
  Zhongli: {
    weaponKey: 'VortexVanquisher',
    name: 'Vortex Vanquisher',
    baseUpliftPct: 8,
    substitutes: [
      {
        key: 'FavoniusLance',
        minRefinement: 1,
        penaltyPct: 5,
        penaltyReason: 'Favonius Lance provides battery utility superior to Vortex Vanquisher.',
      },
      {
        key: 'BlackTassel',
        minRefinement: 1,
        penaltyPct: 4,
        penaltyReason: 'Black Tassel provides maximum HP% for unbreakable shields.',
      },
    ],
  },
  Yelan: {
    weaponKey: 'AquaSimulacra',
    name: 'Aqua Simulacra',
    baseUpliftPct: 20,
    substitutes: [
      {
        key: 'FavoniusWarbow',
        minRefinement: 3,
        penaltyPct: 8,
        penaltyReason: 'Favonius Warbow fixes high energy requirements without ER sands.',
      },
    ],
  },
  RaidenShogun: {
    weaponKey: 'EngulfingLightning',
    name: 'Engulfing Lightning',
    baseUpliftPct: 22,
    substitutes: [
      {
        key: 'TheCatch',
        minRefinement: 4,
        penaltyPct: 10,
        penaltyReason: 'The Catch R5 provides +32% Burst DMG and +12% Burst CRIT Rate for free.',
      },
    ],
  },
  Chasca: {
    weaponKey: 'AstralVultureSCrimsonPlumage',
    name: "Astral Vulture's Crimson Plumage",
    baseUpliftPct: 20,
    substitutes: [],
  },
  Clorinde: {
    weaponKey: 'Absolution',
    name: 'Absolution',
    baseUpliftPct: 20,
    substitutes: [],
  },
};

interface ConstellationSpike {
  characterId: string;
  name: string;
  targetLevel: number;
  targetLevelText: string;
  baseUpliftPct: number;
  baseScore: number;
  description: string;
  benefits: string[];
}

const CONSTELLATION_SPIKES: ConstellationSpike[] = [
  {
    characterId: 'Furina',
    name: 'Furina',
    targetLevel: 1,
    targetLevelText: 'C1 Fanfare Amplifier',
    baseUpliftPct: 18,
    baseScore: 89,
    description: 'Instantly grants 150 Fanfare upon Burst cast and elevates maximum Fanfare ceiling by 100.',
    benefits: [
      'Guarantees immediate +37.5% teamwide damage bonus the moment burst is cast.',
      'Increases maximum teamwide damage ceiling up to +100%.',
    ],
  },
  {
    characterId: 'Furina',
    name: 'Furina',
    targetLevel: 2,
    targetLevelText: 'C2 Peak Sovereign Spike',
    baseUpliftPct: 28,
    baseScore: 94,
    description: 'Triple Fanfare accumulation speed and up to +140% Max HP for autonomous high-DPS off-field hits.',
    benefits: [
      'Accelerates Fanfare from 0 to 300/400 in seconds even with single-target healers.',
      'Massive personal off-field damage increase (+140% HP cap).',
      'Transforms Furina into one of the highest personal DPS sub-carries in Genshin.',
    ],
  },
  {
    characterId: 'Nahida',
    name: 'Nahida',
    targetLevel: 2,
    targetLevelText: 'C2 Reaction Crit & DEF Shred',
    baseUpliftPct: 22,
    baseScore: 93,
    description: 'Allows Burning, Bloom, Hyperbloom, and Burgeon to CRIT (20% CR / 100% CD) and reduces enemy DEF by 30% on Quicken.',
    benefits: [
      'Transforms Hyperbloom and Bloom into explosive critical reaction hits.',
      '30% flat DEF reduction boosts entire team damage across Quicken/Aggravate/Spread.',
    ],
  },
  {
    characterId: 'Neuvillette',
    name: 'Neuvillette',
    targetLevel: 1,
    targetLevelText: 'C1 Interruption Immunity & Draconic Stack',
    baseUpliftPct: 22,
    baseScore: 92,
    description: 'Instantly gains 1 stack of Past Draconic Glories and complete interruption resistance during beam attacks.',
    benefits: [
      'Zero knockback without needing a dedicated shielder like Zhongli.',
      'Unlocks full 3-stack beam damage multiplier with Hydro teammates (e.g. Furina).',
    ],
  },
  {
    characterId: 'RaidenShogun',
    name: 'Raiden Shogun',
    targetLevel: 2,
    targetLevelText: 'C2 60% DEF Ignore',
    baseUpliftPct: 26,
    baseScore: 92,
    description: 'Musou no Hitotachi and Musou Isshin attacks completely ignore 60% of enemy DEF.',
    benefits: [
      'Colossal +43% personal DPS uplift elevating Raiden into premier hypercarry status.',
      'Shreds through Spiral Abyss Floor 12 bosses in a single burst window.',
    ],
  },
  {
    characterId: 'Xilonen',
    name: 'Xilonen',
    targetLevel: 2,
    targetLevelText: 'C2 Element Specific Amplification',
    baseUpliftPct: 25,
    baseScore: 93,
    description: 'Enhances Geo +50% Crit DMG, Pyro +40% ATK, Hydro +40% Max HP, and Electro +20 Energy.',
    benefits: [
      'Unlocks teamwide elemental specialization buffs matching each party member.',
      'Universal +40% HP bonus directly supercharges Neuvillette and Furina.',
    ],
  },
  {
    characterId: 'Arlecchino',
    name: 'Arlecchino',
    targetLevel: 1,
    targetLevelText: 'C1 Masque Scaling & Poise',
    baseUpliftPct: 24,
    baseScore: 91,
    description: 'Masque of the Red Death scaling is increased by 100%, and normal attacks grant interruption resistance.',
    benefits: [
      'Massive ~24% personal DPS increase across normal attack combos.',
      'High interruption resistance allows aggressive unshielded play.',
    ],
  },
  {
    characterId: 'Mavuika',
    name: 'Mavuika',
    targetLevel: 2,
    targetLevelText: 'C2 Nightsoul Shred & Burst Boost',
    baseUpliftPct: 25,
    baseScore: 93,
    description: 'Massive DEF reduction and Nightsoul amplification during Ancient Name release.',
    benefits: [
      'Teamwide DEF shred during burst state.',
      'Elevates Pyro on-field and off-field supremacy.',
    ],
  },
  {
    characterId: 'Nefer',
    name: 'Nefer',
    targetLevel: 2,
    targetLevelText: 'C2 Lunar-Bloom Veil Expansion',
    baseUpliftPct: 25,
    baseScore: 91,
    description: 'Increases Veil of Falsehood stack limit to 5 and grants up to 140% Phantasm damage.',
    benefits: [
      'Extends Veil duration and increases EM buff to +200.',
      'Colossal Lunar-Bloom reaction damage spikes.',
    ],
  },
  {
    characterId: 'KaedeharaKazuha',
    name: 'Kaedehara Kazuha',
    targetLevel: 2,
    targetLevelText: 'C2 +200 Team EM Field',
    baseUpliftPct: 16,
    baseScore: 86,
    description: 'Autumn Whirlwind field increases Kazuha and active character EM by 200.',
    benefits: [
      '+200 EM supercharges Vaporize, Melt, and Aggravate reactions.',
      'Further increases Kazuha personal elemental DMG bonus share.',
    ],
  },
  {
    characterId: 'Yelan',
    name: 'Yelan',
    targetLevel: 1,
    targetLevelText: 'C1 Extra Skill Charge',
    baseUpliftPct: 15,
    baseScore: 87,
    description: 'Lingering Lifeline gains 1 additional charge, slashing ER requirements and doubling overworld mobility.',
    benefits: [
      'Lowers energy recharge needs down to ~140-150%, allowing HP% or offensive sands.',
      'Top-tier overworld sprint chaining.',
    ],
  },
];

export function evaluatePullRecommendations(ownedIds: string[]): PullAdvice[] {
  const ownedSet = new Set(ownedIds);
  const ownedCharacters = CHARACTERS.filter((c) => ownedSet.has(c.id));

  // Analyze account gaps
  const hasUniversalBuffer = ownedCharacters.some(
    (c) => c.tags.includes('Universal-Buffer') || c.tags.includes('Cinder-City') || c.tags.includes('VV'),
  );
  const hasOfffieldHydro = ownedCharacters.some(
    (c) => c.element === 'Hydro' && c.roles.includes('Off-Field DPS'),
  );
  const hasTopSustain = ownedCharacters.some(
    (c) => c.roles.includes('Sustain') && (c.rarity === 5 || c.id === 'Bennett' || c.id === 'KukiShinobu'),
  );
  const hasDendroCore = ownedCharacters.some(
    (c) => c.element === 'Dendro' && (c.id === 'Nahida' || c.id === 'Baizhu'),
  );
  const hasNefer = ownedSet.has('Nefer');

  const adviceList: PullAdvice[] = [];

  for (const candidateId of PULL_CANDIDATES) {
    const char = CHARACTERS.find((c) => c.id === candidateId);
    if (!char) continue;

    // RULE 1: IF THE PLAYER ALREADY OWNS THIS CHARACTER, NEVER TELL THEM TO PULL C0!
    if (ownedSet.has(candidateId)) {
      continue;
    }

    let score = 50;
    const unlocked: string[] = [];
    const benefits: string[] = [];
    let caution: string | undefined;

    // Specific character synergy evaluations
    if (char.id === 'Lauma') {
      if (hasNefer) {
        score = 98;
        unlocked.push('Optimal Nefer Lunar-Bloom');
        benefits.push('Your account has Nefer! Lauma elevates Moonsign and shreds Dendro/Hydro resistance simultaneously.');
      } else {
        score = 75;
        benefits.push('Strong off-field Hydro enabler and Moonsign booster for Nod-Krai archetypes.');
      }
    } else if (char.id === 'Furina') {
      if (!hasOfffieldHydro || !hasUniversalBuffer) {
        score = 97;
        unlocked.push('Universal Team Damage Amplification');
        benefits.push('Provides up to +75% all-element damage bonus and autonomous off-field Hydro damage.');
      } else {
        score = 90;
        benefits.push('Top-tier universal support slotting into almost any team.');
      }
      if (!hasTopSustain) {
        caution = 'Requires a teamwide healer (like Baizhu, Xianyun, or Charlotte) to maximize Fanfare stacks.';
      }
    } else if (char.id === 'Xilonen') {
      if (!hasUniversalBuffer) {
        score = 96;
        unlocked.push('Cinder City 40% DMG Buff & 36% Res Shred');
        benefits.push('Zero-energy 36% resistance shred + 40% damage bonus with high-frequency healing.');
      } else {
        score = 88;
        benefits.push('Top-tier Geo and PHEC buffer who replaces or complements Kazuha.');
      }
    } else if (char.id === 'Mavuika') {
      score = 95;
      unlocked.push('Nightsoul Burst & Pyro Supremacy');
      benefits.push('Unrivaled off-field Pyro application with massive teamwide burst damage amplification.');
    } else if (char.id === 'Nahida') {
      if (!hasDendroCore) {
        score = 96;
        unlocked.push('Hyperbloom, Quicken & Bountiful Bloom');
        benefits.push('Absolute cornerstone of all Dendro teams with 1.5U Tri-Karma cleansing and 250 EM share.');
      } else {
        score = 85;
      }
    } else if (char.id === 'KaedeharaKazuha') {
      if (!hasUniversalBuffer) {
        score = 94;
        unlocked.push('Elemental Damage Buffing & CC');
        benefits.push('40% VV resistance shred with tight grouping and smooth rotations.');
      } else {
        score = 82;
      }
    } else if (char.id === 'Zhongli') {
      if (!hasTopSustain) {
        score = 93;
        unlocked.push('Unbreakable Survivability & Universal Shred');
        benefits.push('100% uptime shield that makes your account immune to interruption and shreds 20% all resistances.');
      } else {
        score = 78;
        benefits.push('Premier comfort pick for carry characters vulnerable to knockback.');
      }
    } else if (char.id === 'Neuvillette') {
      score = 92;
      unlocked.push('Self-Sustaining Hydro Hypercarry');
      benefits.push('Extremely easy floor clear with immense area beam damage and built-in healing.');
    } else if (char.id === 'Yelan') {
      if (!hasOfffieldHydro) {
        score = 91;
        unlocked.push('Double Hydro & High Single-Target DPS');
        benefits.push('Coordinated Hydro attacks paired with an escalating 1%–50% damage buff for on-field carries.');
      } else {
        score = 80;
      }
    } else if (char.id === 'Nefer') {
      score = 88;
      unlocked.push('Lunar-Bloom Special Reaction DPS');
      benefits.push('Devastating Dendro on-field carry with unique Seed of Deceit reaction mechanics.');
    } else {
      score = 70;
      benefits.push(`High personal DPS and elemental versatility for endgame challenges.`);
    }

    let tier: PullAdvice['tier'] = 'Situational';
    if (score >= 94) tier = 'Must Pull';
    else if (score >= 85) tier = 'High Value';
    else if (score < 70) tier = 'Skip / Redundant';

    adviceList.push({
      character: char,
      score,
      tier,
      unlockedArchetypes: unlocked,
      accountBenefits: benefits,
      caution,
    });
  }

  // Sort descending by value score
  return adviceList.sort((a, b) => b.score - a.score);
}

export function evaluateComprehensivePullROI(
  ownedProfiles: Record<string, OwnedCharacterProfile>,
  ownedWeapons: OwnedWeapon[],
  budget: PullBudgetState,
  bannerFilter?: string,
): EnhancedPullAdvice[] {
  const totalPulls = Math.max(0, Math.floor(budget.primogems / 160) + budget.fates);
  const charOdds = calculateCharacterBannerOdds(
    totalPulls,
    budget.characterPity,
    budget.characterGuaranteed,
  );
  const weapOdds = calculateWeaponBannerOdds(
    totalPulls,
    budget.weaponPity,
    budget.weaponFatePoints,
  );

  const ownedIds = Object.keys(ownedProfiles);
  const ownedSet = new Set(ownedIds);
  const ownedCharacters = CHARACTERS.filter((c) => ownedSet.has(c.id));

  const hasUniversalBuffer = ownedCharacters.some(
    (c) =>
      c.tags.includes('Universal-Buffer') ||
      c.tags.includes('Cinder-City') ||
      c.tags.includes('VV') ||
      c.id === 'KaedeharaKazuha' ||
      c.id === 'Xilonen',
  );
  const hasOfffieldHydro = ownedCharacters.some(
    (c) => c.element === 'Hydro' && c.roles.includes('Off-Field DPS'),
  );
  const hasTopSustain = ownedCharacters.some(
    (c) =>
      c.roles.includes('Sustain') &&
      (c.rarity === 5 || c.id === 'Bennett' || c.id === 'KukiShinobu' || c.id === 'Zhongli'),
  );
  const hasDendroCore = ownedCharacters.some(
    (c) => c.element === 'Dendro' && (c.id === 'Nahida' || c.id === 'Baizhu'),
  );
  const hasNefer = ownedSet.has('Nefer');

  // Determine candidate scope
  const selectedBanner =
    bannerFilter && bannerFilter !== 'all' && bannerFilter !== 'sandbox'
      ? BANNER_PHASES.find((b) => b.id === bannerFilter)
      : undefined;

  let candidateCharIds: string[] = [];
  let candidateWeaponKeys: string[] = [];

  if (selectedBanner) {
    candidateCharIds = selectedBanner.characterBanners.map((cb) => cb.characterId);
    candidateWeaponKeys = selectedBanner.weaponBanner.featuredWeapons;
  } else {
    candidateCharIds = Array.from(
      new Set([
        ...PULL_CANDIDATES,
        ...BANNER_PHASES.flatMap((b) => b.characterBanners.map((cb) => cb.characterId)),
      ]),
    );
    candidateWeaponKeys = Array.from(
      new Set(Object.values(SIGNATURE_WEAPONS).map((sw) => sw.weaponKey)),
    );
  }

  const adviceList: EnhancedPullAdvice[] = [];

  // 1. Evaluate Characters (C0 for unowned, Constellations for owned)
  for (const charId of candidateCharIds) {
    const char = CHARACTERS.find((c) => c.id === charId);
    if (!char) continue;

    if (!ownedSet.has(charId)) {
      // Unowned -> Evaluate C0
      let score = 70;
      let uplift = 20;
      const unlocked: string[] = [];
      const benefits: string[] = [];
      let caution: string | undefined;

      if (char.id === 'Lauma') {
        if (hasNefer) {
          score = 98;
          uplift = 35;
          unlocked.push('Optimal Nefer Lunar-Bloom');
          benefits.push(
            'Your account has Nefer! Lauma elevates Moonsign and shreds Dendro/Hydro resistance simultaneously.',
          );
        } else {
          score = 75;
          uplift = 22;
          benefits.push('Strong off-field Hydro enabler and Moonsign booster for Nod-Krai archetypes.');
        }
      } else if (char.id === 'Furina') {
        if (!hasOfffieldHydro || !hasUniversalBuffer) {
          score = 97;
          uplift = 38;
          unlocked.push('Universal Team Damage Amplification');
          benefits.push(
            'Provides up to +75% all-element damage bonus and autonomous off-field Hydro damage.',
          );
        } else {
          score = 90;
          uplift = 28;
          benefits.push('Top-tier universal support slotting into almost any team.');
        }
        if (!hasTopSustain) {
          caution =
            'Requires a teamwide healer (like Baizhu, Xianyun, or Charlotte) to maximize Fanfare stacks.';
        }
      } else if (char.id === 'Xilonen') {
        if (!hasUniversalBuffer) {
          score = 96;
          uplift = 36;
          unlocked.push('Cinder City 40% DMG Buff & 36% Res Shred');
          benefits.push(
            'Zero-energy 36% resistance shred + 40% damage bonus with high-frequency healing.',
          );
        } else {
          score = 88;
          uplift = 26;
          benefits.push('Top-tier Geo and PHEC buffer who replaces or complements Kazuha.');
        }
      } else if (char.id === 'Mavuika') {
        score = 95;
        uplift = 32;
        unlocked.push('Nightsoul Burst & Pyro Supremacy');
        benefits.push(
          'Unrivaled off-field Pyro application with massive teamwide burst damage amplification.',
        );
      } else if (char.id === 'Nahida') {
        if (!hasDendroCore) {
          score = 96;
          uplift = 30;
          unlocked.push('Hyperbloom, Quicken & Bountiful Bloom');
          benefits.push(
            'Absolute cornerstone of all Dendro teams with 1.5U Tri-Karma cleansing and 250 EM share.',
          );
        } else {
          score = 85;
          uplift = 22;
          benefits.push('Premier Dendro support and applicator.');
        }
      } else if (char.id === 'KaedeharaKazuha') {
        if (!hasUniversalBuffer) {
          score = 94;
          uplift = 28;
          unlocked.push('Elemental Damage Buffing & CC');
          benefits.push('40% VV resistance shred with tight grouping and smooth rotations.');
        } else {
          score = 82;
          uplift = 20;
          benefits.push('High utility Anemo grouper and buffer.');
        }
      } else if (char.id === 'Zhongli') {
        if (!hasTopSustain) {
          score = 93;
          uplift = 15;
          unlocked.push('Unbreakable Survivability & Universal Shred');
          benefits.push(
            '100% uptime shield that makes your account immune to interruption and shreds 20% all resistances.',
          );
        } else {
          score = 78;
          uplift = 10;
          benefits.push('Premier comfort pick for carry characters vulnerable to knockback.');
        }
      } else if (char.id === 'Neuvillette') {
        score = 92;
        uplift = 28;
        unlocked.push('Self-Sustaining Hydro Hypercarry');
        benefits.push('Extremely easy floor clear with immense area beam damage and built-in healing.');
      } else if (char.id === 'Yelan') {
        if (!hasOfffieldHydro) {
          score = 91;
          uplift = 25;
          unlocked.push('Double Hydro & High Single-Target DPS');
          benefits.push(
            'Coordinated Hydro attacks paired with an escalating 1%–50% damage buff for on-field carries.',
          );
        } else {
          score = 80;
          uplift = 18;
          benefits.push('High personal damage and mobility.');
        }
      } else if (char.id === 'Arlecchino') {
        score = 90;
        uplift = 26;
        unlocked.push('Bond of Life Pyro Carry');
        benefits.push('Devastating Pyro normal attack strings with self-healing on burst.');
      } else if (char.id === 'Citlali') {
        score = 88;
        uplift = 22;
        unlocked.push('Cryo Shielding & Elemental Mastery Buffing');
        benefits.push('Provides durable Cryo shielding and massive EM buffs for Melt and Superconduct.');
      } else if (char.id === 'Nefer') {
        score = 88;
        uplift = 25;
        unlocked.push('Lunar-Bloom Special Reaction DPS');
        benefits.push('Devastating Dendro on-field carry with unique Seed of Deceit reaction mechanics.');
      } else {
        score = 70;
        uplift = 18;
        benefits.push('High personal DPS and elemental versatility for endgame challenges.');
      }

      let tier: EnhancedPullAdvice['tier'] = 'Situational';
      if (score >= 90) tier = 'Must Pull';
      else if (score >= 75) tier = 'High Value';
      else if (score < 50) tier = 'Skip / Redundant';

      adviceList.push({
        id: `char_c0_${char.id}`,
        name: char.name,
        targetType: 'C0_Character',
        characterId: char.id,
        targetLevelText: 'C0 New Unlock',
        score,
        tier,
        teamDamageUpliftPct: uplift,
        unlockedArchetypes: unlocked,
        accountBenefits: benefits,
        caution,
        odds: charOdds,
      });
    } else {
      // Character is OWNED -> Evaluate Constellations (up to C6)
      const currentProfile = ownedProfiles[charId];
      const currentConst = currentProfile ? currentProfile.constellation : 0;

      if (currentConst < 6) {
        const availableSpikes = CONSTELLATION_SPIKES.filter(
          (s) => s.characterId === charId && s.targetLevel > currentConst,
        );
        availableSpikes.sort((a, b) => a.targetLevel - b.targetLevel);

        if (availableSpikes.length > 0) {
          const nextSpike = availableSpikes[0];
          let tier: EnhancedPullAdvice['tier'] = 'Situational';
          if (nextSpike.baseScore >= 90) tier = 'Must Pull';
          else if (nextSpike.baseScore >= 75) tier = 'High Value';
          else if (nextSpike.baseScore < 50) tier = 'Skip / Redundant';

          adviceList.push({
            id: `const_${charId}_${nextSpike.targetLevel}`,
            name: `${char.name} ${nextSpike.targetLevelText.split(' ')[0]}`,
            targetType: 'Constellation',
            characterId: charId,
            targetLevelText: nextSpike.targetLevelText,
            score: nextSpike.baseScore,
            tier,
            teamDamageUpliftPct: nextSpike.baseUpliftPct,
            unlockedArchetypes: [],
            accountBenefits: nextSpike.benefits,
            caution: nextSpike.description,
            odds: charOdds,
          });
        }
      }
    }
  }

  // 2. Evaluate Signature Weapons
  for (const [charId, sigConfig] of Object.entries(SIGNATURE_WEAPONS)) {
    if (!candidateWeaponKeys.includes(sigConfig.weaponKey)) {
      continue;
    }

    const char = CHARACTERS.find((c) => c.id === charId);
    const dbWeapon = getWeaponByKey(sigConfig.weaponKey);

    // Check if player already owns this signature weapon
    const ownsSignature =
      ownedWeapons.some((w) => w.key === sigConfig.weaponKey) ||
      ownedProfiles[charId]?.weapon?.key === sigConfig.weaponKey;

    if (ownsSignature) {
      if (selectedBanner) {
        adviceList.push({
          id: `weap_${sigConfig.weaponKey}`,
          name: dbWeapon?.name ?? sigConfig.name,
          targetType: 'Signature_Weapon',
          characterId: charId,
          weaponKey: sigConfig.weaponKey,
          targetLevelText: 'R1 Signature',
          score: 20,
          tier: 'Skip / Redundant',
          teamDamageUpliftPct: 0,
          unlockedArchetypes: [],
          accountBenefits: ['Already owned in your weapon inventory or equipped.'],
          odds: weapOdds,
        });
      }
      continue;
    }

    let uplift = sigConfig.baseUpliftPct;
    let score = 88;
    const benefits = [
      `${dbWeapon?.name ?? sigConfig.name} is the tailored best-in-slot weapon for ${char?.name ?? charId}.`,
    ];
    let caution: string | undefined;

    // Check substitutes
    for (const sub of sigConfig.substitutes) {
      const matchingWeapon =
        ownedWeapons.find((w) => w.key === sub.key) ||
        (ownedProfiles[charId]?.weapon?.key === sub.key
          ? ownedProfiles[charId].weapon
          : undefined);

      if (matchingWeapon) {
        const ref = matchingWeapon.refinement ?? 1;
        if (!sub.minRefinement || ref >= sub.minRefinement) {
          uplift = Math.max(4, uplift - sub.penaltyPct);
          score = Math.max(35, score - sub.penaltyPct * 2);
          caution = sub.penaltyReason;
          break;
        }
      }
    }

    // Account does not own the character
    if (!ownedSet.has(charId)) {
      score = Math.max(30, score - 20);
      if (!caution) {
        caution = `Your account does not yet own ${char?.name ?? charId}.`;
      }
    }

    let tier: EnhancedPullAdvice['tier'] = 'Situational';
    if (score >= 90) tier = 'Must Pull';
    else if (score >= 75) tier = 'High Value';
    else if (score < 50) tier = 'Skip / Redundant';

    adviceList.push({
      id: `weap_${sigConfig.weaponKey}`,
      name: dbWeapon?.name ?? sigConfig.name,
      targetType: 'Signature_Weapon',
      characterId: charId,
      weaponKey: sigConfig.weaponKey,
      targetLevelText: 'R1 Signature',
      score,
      tier,
      teamDamageUpliftPct: uplift,
      unlockedArchetypes: [],
      accountBenefits: benefits,
      caution,
      odds: weapOdds,
    });
  }

  // Sort descending by score, tiebreaker on teamDamageUpliftPct
  return adviceList.sort((a, b) => b.score - a.score || b.teamDamageUpliftPct - a.teamDamageUpliftPct);
}
