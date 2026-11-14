import type { Element, TheaterDifficulty, TheaterSeasonConfig } from '../types/genshin';

export interface BossEncounterInfo {
  name: string;
  title: string;
  hazard: string;
  weakness: string;
  recommendedArchetypes: string[];
}

export const THEATER_BOSS_INFO: Record<string, BossEncounterInfo> = {
  'Maguu Kenki': {
    name: 'Maguu Kenki',
    title: 'Automaton Swordsman',
    hazard: 'High close-quarters Anemo/Cryo slashes and illusion bursts',
    weakness: 'Vulnerable to sustained ranged DPS and frontloaded single-target burst',
    recommendedArchetypes: ['Vaporize', 'Melt', 'Lunar-Bloom'],
  },
  'Jadeplume Terrorshroom': {
    name: 'Jadeplume Terrorshroom',
    title: 'Lord of the Fungi',
    hazard: 'Enraged State unleashes rapid charges; high Dendro RES (80%)',
    weakness: 'Electro attacks induce Activated state followed by paralyzed collapse',
    recommendedArchetypes: ['Aggravate', 'Overload', 'Vaporize'],
  },
  'Icewind Suite: Coppelia': {
    name: 'Icewind Suite: Coppelia',
    title: 'Dirge of Coppelia',
    hazard: 'Ousia kinetic pulses with severe Cryo/Anemo arena-wide shredding',
    weakness: 'Pneuma attacks interrupt climax; heavy Pyro/Melt breaks shield barriers',
    recommendedArchetypes: ['Vaporize', 'Melt', 'Nightsoul Burst'],
  },
  'Centaur Automaton': {
    name: 'Centaur Automaton',
    title: 'Secret Source Automaton: Configuration Device',
    hazard: 'Solid Phlogiston pillar and crushing shockwave rings',
    weakness: 'Nightsoul attacks rapidly overload energy nodes causing vulnerability',
    recommendedArchetypes: ['Nightsoul Overload', 'Vaporize', 'Lunar-Bloom'],
  },
  'Millennial Pearl Seahorse': {
    name: 'Millennial Pearl Seahorse',
    title: 'Fontemer Aberrant Overlord',
    hazard: 'High Electro RES while Fontemer Pearl is active; aerial bombardment',
    weakness: 'Pyro, Cryo, and Dendro reactions shatter the Fontemer Pearl',
    recommendedArchetypes: ['Lunar-Bloom', 'Quicken', 'Hyperbloom'],
  },
  'Algorithm of Semi-Intransient Matrix': {
    name: 'Algorithm of Semi-Intransient Matrix',
    title: 'Overseer Network Tomb Guard',
    hazard: 'Enters invisible camouflage state and deploys laser turrets',
    weakness: 'Catalyze (Quicken/Spread/Aggravate) or Electro on repair parts forces recovery',
    recommendedArchetypes: ['Quicken', 'Aggravate', 'Spread', 'Hyperbloom'],
  },
  'Iniquitous Baptist': {
    name: 'Iniquitous Baptist',
    title: 'Abyssal Chanter of Tri-Elements',
    hazard: 'Consecutive rotating elemental shields: Pyro, Cryo, Electro',
    weakness: 'Multi-element team compositions break wards swiftly to stun him',
    recommendedArchetypes: ['Rainbow', 'Hyperbloom', 'National'],
  },
  'Hydro Tulpa': {
    name: 'Hydro Tulpa',
    title: 'Wrathful Ocean Sovereign',
    hazard: 'Permanent Hydro aura, high Hydro immunity, huge cleave strikes',
    weakness: 'Constant Hydro allows 100% Vaporize forward hits and Dendro Bloom triggers',
    recommendedArchetypes: ['Vaporize', 'Burgeon', 'Lunar-Bloom', 'Hyperbloom'],
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

export const THEATER_SEASONS: TheaterSeasonConfig[] = [
  {
    id: 'season-natlan-pyro-hydro-anemo',
    name: 'Season 1 · Blazing Winds (Pyro / Hydro / Anemo)',
    elements: ['Pyro', 'Hydro', 'Anemo'],
    openingCastIds: [
      'Mavuika',
      'Chasca',
      'Citlali',
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
