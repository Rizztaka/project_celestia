import type {
  Element,
  EncounterTargetProfile,
  TheaterDifficulty,
  TheaterSeasonConfig,
} from '../types/genshin';
import { CURRENT_GAME_VERSION } from './game-version';

export interface BossEncounterInfo {
  name: string;
  title: string;
  hazard: string;
  weakness: string;
  recommendedArchetypes: string[];
  targetingProfile?: EncounterTargetProfile;
  immuneElements?: Element[];
  resistedElements?: Element[];
  counterElements?: Element[];
  requiresNightsoul?: boolean;
  requiresMultiElement?: boolean;
  requiresSustain?: boolean;
  preservationNote?: string;
}

export const THEATER_BOSS_INFO: Record<string, BossEncounterInfo> = {
  'Maguu Kenki': {
    name: 'Maguu Kenki',
    title: 'Automaton Swordsman',
    hazard: 'High close-quarters Anemo/Cryo slashes and illusion bursts',
    weakness: 'Vulnerable to sustained ranged DPS and frontloaded single-target burst',
    recommendedArchetypes: ['Vaporize', 'Melt', 'Lunar-Bloom', 'Electro-Charged'],
    targetingProfile: 'Single-Target',
    resistedElements: ['Anemo', 'Cryo'],
    requiresSustain: true,
    preservationNote: 'Save a shielder or reliable healer for Act 3 to prevent burst deaths during its Cryo phase.',
  },
  'Jadeplume Terrorshroom': {
    name: 'Jadeplume Terrorshroom',
    title: 'Lord of the Fungi',
    hazard: 'Enraged State unleashes rapid charges; high Dendro RES (80%)',
    weakness: 'Electro attacks induce Activated state followed by paralyzed collapse',
    recommendedArchetypes: ['Aggravate', 'Overload', 'Vaporize', 'Electro-Charged'],
    targetingProfile: 'Single-Target',
    resistedElements: ['Dendro'],
    counterElements: ['Electro', 'Pyro'],
    preservationNote: 'Reserve an Electro applicator to force Activated collapse; avoid committing pure Dendro carries here.',
  },
  'Icewind Suite: Coppelia': {
    name: 'Icewind Suite: Coppelia',
    title: 'Dirge of Coppelia',
    hazard: 'Ousia kinetic pulses with severe Cryo/Anemo arena-wide shredding',
    weakness: 'Pneuma attacks interrupt climax; heavy Pyro/Melt breaks shield barriers',
    recommendedArchetypes: ['Vaporize', 'Melt', 'Nightsoul Burst', 'Overload'],
    targetingProfile: 'Single-Target',
    resistedElements: ['Anemo', 'Cryo'],
    counterElements: ['Pyro'],
    requiresSustain: true,
    preservationNote: 'Keep a Pyro/Pneuma breaker plus healing/shielding ready for Coppelia’s climax pulses.',
  },
  'Centaur Automaton': {
    name: 'Centaur Automaton',
    title: 'Secret Source Automaton: Configuration Device',
    hazard: 'Solid Phlogiston pillar and crushing shockwave rings',
    weakness: 'Nightsoul attacks rapidly overload energy nodes causing vulnerability',
    recommendedArchetypes: ['Nightsoul Overload', 'Vaporize', 'Lunar-Bloom'],
    targetingProfile: 'Single-Target',
    requiresNightsoul: true,
    preservationNote: 'Preserve a Natlan Nightsoul unit to overload its Accretion pillars 3x faster.',
  },
  'Millennial Pearl Seahorse': {
    name: 'Millennial Pearl Seahorse',
    title: 'Fontemer Aberrant Overlord',
    hazard: 'High Electro RES while Fontemer Pearl is active; aerial bombardment',
    weakness: 'Pyro, Cryo, and Dendro reactions shatter the Fontemer Pearl',
    recommendedArchetypes: ['Lunar-Bloom', 'Quicken', 'Hyperbloom', 'Melt'],
    targetingProfile: 'Single-Target',
    resistedElements: ['Electro'],
    counterElements: ['Pyro', 'Cryo', 'Dendro'],
    preservationNote: 'Save a Pyro, Cryo, or Dendro shield-shredder to crack the Fontemer Pearl before unleashing carries.',
  },
  'Algorithm of Semi-Intransient Matrix': {
    name: 'Algorithm of Semi-Intransient Matrix',
    title: 'Overseer Network Tomb Guard',
    hazard: 'Enters invisible camouflage state and deploys laser turrets',
    weakness: 'Catalyze (Quicken/Spread/Aggravate) or Electro on repair parts forces recovery',
    recommendedArchetypes: ['Quicken', 'Aggravate', 'Spread', 'Hyperbloom'],
    targetingProfile: 'Single-Target',
    counterElements: ['Electro', 'Dendro'],
    preservationNote: 'Keep at least one Electro (ideally + Dendro) unit with vigor for ASIMON’s invisibility phase.',
  },
  'Iniquitous Baptist': {
    name: 'Iniquitous Baptist',
    title: 'Abyssal Chanter of Tri-Elements',
    hazard: 'Consecutive rotating elemental shields: Pyro, Cryo, Electro',
    weakness: 'Multi-element team compositions break wards swiftly to stun him',
    recommendedArchetypes: ['Rainbow', 'Hyperbloom', 'National', 'Electro-Charged'],
    targetingProfile: 'Single-Target',
    counterElements: ['Hydro', 'Pyro', 'Cryo', 'Dendro', 'Geo'],
    requiresMultiElement: true,
    preservationNote: 'Preserve a 3-element team (avoid Mono comps) to shred each rotating barrier quickly.',
  },
  'Hydro Tulpa': {
    name: 'Hydro Tulpa',
    title: 'Wrathful Ocean Sovereign',
    hazard: 'Permanent Hydro aura, high Hydro immunity, huge cleave strikes',
    weakness: 'Constant Hydro allows 100% Vaporize forward hits and Dendro Bloom triggers',
    recommendedArchetypes: ['Vaporize', 'Burgeon', 'Lunar-Bloom', 'Hyperbloom', 'Electro-Charged'],
    targetingProfile: 'Single-Target',
    immuneElements: ['Hydro'],
    counterElements: ['Pyro', 'Dendro', 'Electro', 'Geo'],
    requiresSustain: true,
    preservationNote: 'CRITICAL: Save your strongest non-Hydro carry (Electro/Geo/Pyro/Dendro) and a shielder/healer for Act 10; Hydro carries deal 0 DMG.',
  },
};

export const THEATER_DIFFICULTIES: Record<
  TheaterDifficulty,
  { acts: number; requiredCharacters: number; bossActs: number[] }
> = {
  Normal: { acts: 6, requiredCharacters: 14, bossActs: [3, 6] },
  Hard: { acts: 8, requiredCharacters: 18, bossActs: [3, 6, 8] },
  Visionary: { acts: 10, requiredCharacters: 22, bossActs: [3, 6, 8, 10] },
};

export const DEFAULT_ACTIVE_THEATER_SEASON_ID = 'season-7-2-hydro-electro-geo';

export const THEATER_SEASONS: TheaterSeasonConfig[] = [
  {
    id: 'season-7-2-hydro-electro-geo',
    name: 'Version 7.2 · November 2026 (Hydro / Electro / Geo)',
    version: CURRENT_GAME_VERSION,
    effectiveStartDate: '2026-11-01',
    effectiveEndDate: '2026-12-01',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verifiedAt: '2026-11-16',
    blessingSummary: 'Brilliant Blessings amplify Electro-Charged, Lunar-Charged, and Crystallize/Lunar-Crystallize procs.',
    elements: ['Hydro', 'Electro', 'Geo'],
    openingCastIds: [
      'Columbina',
      'Clorinde',
      'Navia',
      'Furina',
      'Mitya',
      'Zhongli',
    ],
    specialGuestIds: ['Mavuika', 'Nahida', 'Chasca', 'KaedeharaKazuha'],
    bosses: {
      3: 'Maguu Kenki',
      6: 'Icewind Suite: Coppelia',
      8: 'Iniquitous Baptist',
      10: 'Hydro Tulpa',
    },
  },
  {
    id: 'season-7-2-dec-pyro-hydro-geo',
    name: 'Version 7.2 · December 2026 (Pyro / Hydro / Geo)',
    version: CURRENT_GAME_VERSION,
    effectiveStartDate: '2026-12-01',
    effectiveEndDate: '2027-01-01',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verifiedAt: '2026-11-16',
    blessingSummary: 'Brilliant Blessings supercharge Vaporize and Pyro/Hydro Crystallize shockwaves.',
    elements: ['Pyro', 'Hydro', 'Geo'],
    openingCastIds: [
      'Mavuika',
      'Linnea',
      'Navia',
      'Furina',
      'Zhongli',
      'Bennett',
    ],
    specialGuestIds: ['Citlali', 'Nahida', 'Clorinde', 'KaedeharaKazuha'],
    bosses: {
      3: 'Jadeplume Terrorshroom',
      6: 'Centaur Automaton',
      8: 'Algorithm of Semi-Intransient Matrix',
      10: 'Icewind Suite: Coppelia',
    },
  },
  {
    id: 'season-7-snezhnaya-cryo-hydro-electro',
    name: 'Version 7.2 · Frost & Thunder (Cryo / Hydro / Electro)',
    version: CURRENT_GAME_VERSION,
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verifiedAt: '2026-11-16',
    blessingSummary: 'Brilliant Blessings boost Freeze, Superconduct, and Electro-Charged/Lunar-Charged.',
    elements: ['Cryo', 'Hydro', 'Electro'],
    openingCastIds: [
      'Columbina',
      'Sandrone',
      'Clorinde',
      'Skirk',
      'Tartaglia',
      'Mitya',
    ],
    specialGuestIds: ['Mavuika', 'KaedeharaKazuha', 'Nahida', 'Zhongli'],
    bosses: {
      3: 'Maguu Kenki',
      6: 'Icewind Suite: Coppelia',
      8: 'Iniquitous Baptist',
      10: 'Hydro Tulpa',
    },
  },
  {
    id: 'season-7-nod-krai-anemo-pyro-geo',
    name: 'Version 7.1 · Astral Zephyr & Wildfire (Anemo / Pyro / Geo)',
    version: '7.1',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verifiedAt: '2026-10-01',
    blessingSummary: 'Brilliant Blessings enhance Pyro Swirl and Pyro Crystallize combos.',
    elements: ['Anemo', 'Pyro', 'Geo'],
    openingCastIds: [
      'Mavuika',
      'Linnea',
      'Chasca',
      'Xilonen',
      'Bennett',
      'Varka',
    ],
    specialGuestIds: ['Furina', 'Nefer', 'Columbina', 'RaidenShogun'],
    bosses: {
      3: 'Jadeplume Terrorshroom',
      6: 'Centaur Automaton',
      8: 'Algorithm of Semi-Intransient Matrix',
      10: 'Icewind Suite: Coppelia',
    },
  },
  {
    id: 'season-natlan-pyro-hydro-anemo',
    name: 'Season 1 · Blazing Winds (Pyro / Hydro / Anemo)',
    version: '5.2',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verifiedAt: '2024-11-01',
    blessingSummary: 'Brilliant Blessings boost Vaporize and Pyro/Hydro Swirl.',
    elements: ['Pyro', 'Hydro', 'Anemo'],
    openingCastIds: [
      'Mavuika',
      'Chasca',
      'Xiangling',
      'Furina',
      'Bennett',
      'KaedeharaKazuha',
    ],
    specialGuestIds: ['Xilonen', 'Nahida', 'Zhongli', 'Nefer'],
    bosses: {
      3: 'Maguu Kenki',
      6: 'Jadeplume Terrorshroom',
      8: 'Icewind Suite: Coppelia',
      10: 'Centaur Automaton',
    },
  },
  {
    id: 'season-bloom-hydro-electro-dendro',
    name: 'Season 2 · Lunar Bloom & Tempest (Hydro / Electro / Dendro)',
    version: '5.0',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verifiedAt: '2024-09-01',
    blessingSummary: 'Brilliant Blessings amplify Bloom, Hyperbloom, Quicken, and Electro-Charged.',
    elements: ['Hydro', 'Electro', 'Dendro'],
    openingCastIds: [
      'Nefer',
      'Clorinde',
      'RaidenShogun',
      'Xingqiu',
      'KukiShinobu',
      'Nahida',
    ],
    specialGuestIds: ['KaedeharaKazuha', 'Bennett', 'Mavuika', 'Chasca'],
    bosses: {
      3: 'Millennial Pearl Seahorse',
      6: 'Algorithm of Semi-Intransient Matrix',
      8: 'Iniquitous Baptist',
      10: 'Hydro Tulpa',
    },
  },
];

/**
 * Validates a Theater season configuration's element restrictions, opening cast,
 * special guests, boss metadata, and date range.
 */
export function validateTheaterSeasonConfig(
  season: TheaterSeasonConfig,
  validCharacterIds?: Set<string>,
): string[] {
  const errors: string[] = [];

  if (!season.id || !season.name) {
    errors.push('Season must define non-empty id and name.');
  }

  const uniqueElements = new Set(season.elements);
  if (uniqueElements.size !== 3) {
    errors.push(`Season ${season.id}: expected 3 distinct elements, got ${uniqueElements.size}.`);
  }

  if (
    season.effectiveStartDate &&
    season.effectiveEndDate &&
    season.effectiveStartDate >= season.effectiveEndDate
  ) {
    errors.push(
      `Season ${season.id}: effectiveStartDate (${season.effectiveStartDate}) must precede effectiveEndDate (${season.effectiveEndDate}).`,
    );
  }

  const isCustom = season.id.startsWith('custom-');
  if (!isCustom && season.openingCastIds.length !== 6) {
    errors.push(
      `Season ${season.id}: expected 6 opening cast characters, got ${season.openingCastIds.length}.`,
    );
  }

  if (new Set(season.openingCastIds).size !== season.openingCastIds.length) {
    errors.push(`Season ${season.id}: duplicate character ID in openingCastIds.`);
  }

  if (new Set(season.specialGuestIds).size !== season.specialGuestIds.length) {
    errors.push(`Season ${season.id}: duplicate character ID in specialGuestIds.`);
  }

  const openingSet = new Set(season.openingCastIds);
  for (const guestId of season.specialGuestIds) {
    if (openingSet.has(guestId)) {
      errors.push(`Season ${season.id}: "${guestId}" appears in both openingCastIds and specialGuestIds.`);
    }
  }

  if (validCharacterIds) {
    for (const id of [...season.openingCastIds, ...season.specialGuestIds]) {
      if (!validCharacterIds.has(id)) {
        errors.push(`Season ${season.id}: unknown character ID "${id}".`);
      }
    }
  }

  for (const actNum of [3, 6, 8, 10]) {
    const bossName = season.bosses[actNum];
    if (!bossName) {
      errors.push(`Season ${season.id}: missing boss definition for Act ${actNum}.`);
    } else if (!THEATER_BOSS_INFO[bossName]) {
      errors.push(`Season ${season.id}: Act ${actNum} boss "${bossName}" has no THEATER_BOSS_INFO entry.`);
    }
  }

  return errors;
}

export function createCustomSeason(
  elements: Element[],
  guestIds: string[] = ['Zhongli', 'KaedeharaKazuha', 'Nahida', 'Furina'],
): TheaterSeasonConfig {
  return {
    id: `custom-${elements.join('-').toLowerCase()}`,
    name: `Custom Cycle (${elements.join(' / ')})`,
    elements,
    openingCastIds: [],
    specialGuestIds: guestIds,
    bosses: {
      3: 'Maguu Kenki',
      6: 'Jadeplume Terrorshroom',
      8: 'Icewind Suite: Coppelia',
      10: 'Centaur Automaton',
    },
  };
}

export function getActiveTheaterSeason(date: Date = new Date()): TheaterSeasonConfig {
  const dateStr = date.toISOString().slice(0, 10);
  const matched = THEATER_SEASONS.find((s) => {
    if (!s.effectiveStartDate || !s.effectiveEndDate) return false;
    return dateStr >= s.effectiveStartDate && dateStr < s.effectiveEndDate;
  });
  return matched ?? THEATER_SEASONS[0];
}
