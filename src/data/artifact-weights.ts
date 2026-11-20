import type { ArtifactSlot, CharacterStatWeightConfig, StatKey } from '../types/genshin';
import { CHARACTERS } from './characters';

/**
 * Level 20 5-star maximum main stat values by slot.
 */
export const MAIN_STAT_MAX_VALUES: Record<ArtifactSlot, Partial<Record<StatKey, number>>> = {
  flower: { hp: 4780 },
  plume: { atk: 311 },
  sands: {
    hp_: 46.6,
    atk_: 46.6,
    def_: 58.3,
    enerRech_: 51.8,
    eleMas: 186.5,
  },
  goblet: {
    hp_: 46.6,
    atk_: 46.6,
    def_: 58.3,
    eleMas: 186.5,
    pyro_dmg_: 46.6,
    hydro_dmg_: 46.6,
    dendro_dmg_: 46.6,
    electro_dmg_: 46.6,
    anemo_dmg_: 46.6,
    cryo_dmg_: 46.6,
    geo_dmg_: 46.6,
    physical_dmg_: 58.3,
  },
  circlet: {
    hp_: 46.6,
    atk_: 46.6,
    def_: 58.3,
    critRate_: 31.1,
    critDMG_: 62.2,
    heal_: 35.9,
    eleMas: 186.5,
  },
};

/**
 * 100% Maximum 5-star Artifact Substat roll values (Akasha / KQM standard).
 * Any actual roll divided by this base gives its Roll Value (RV).
 * For example, a 3.5% Crit Rate roll = 3.5 / 3.89 = 89.97% RV.
 */
export const MAX_SUBSTAT_VALUES: Record<StatKey, number> = {
  critRate_: 3.89,
  critDMG_: 7.77,
  atk_: 5.83,
  hp_: 5.83,
  def_: 7.29,
  eleMas: 23.31,
  enerRech_: 6.48,
  atk: 19.45,
  hp: 298.75,
  def: 23.15,
  heal_: 0,
  physical_dmg_: 0,
  pyro_dmg_: 0,
  hydro_dmg_: 0,
  dendro_dmg_: 0,
  electro_dmg_: 0,
  anemo_dmg_: 0,
  cryo_dmg_: 0,
  geo_dmg_: 0,
};

/**
 * 4 Discrete 5-star Substat Roll Tiers (70%, 80%, 90%, 100%).
 * Every initial roll and subsequent level-up roll selects from one of these 4 values.
 */
export const SUBSTAT_ROLL_TIERS: Record<StatKey, number[]> = {
  critRate_: [2.72, 3.11, 3.50, 3.89],
  critDMG_: [5.44, 6.22, 6.99, 7.77],
  atk_: [4.08, 4.66, 5.25, 5.83],
  hp_: [4.08, 4.66, 5.25, 5.83],
  def_: [5.10, 5.83, 6.56, 7.29],
  eleMas: [16.32, 18.65, 20.98, 23.31],
  enerRech_: [4.53, 5.18, 5.83, 6.48],
  atk: [13.62, 15.56, 17.51, 19.45],
  hp: [209.13, 239.00, 268.88, 298.75],
  def: [16.20, 18.52, 20.84, 23.15],
  heal_: [],
  physical_dmg_: [],
  pyro_dmg_: [],
  hydro_dmg_: [],
  dendro_dmg_: [],
  electro_dmg_: [],
  anemo_dmg_: [],
  cryo_dmg_: [],
  geo_dmg_: [],
};

/**
 * Canonical Genshin Impact main stat eligibility by artifact slot.
 */
export const MAIN_STAT_ELIGIBILITY_TABLE: Record<ArtifactSlot, StatKey[]> = {
  flower: ['hp'],
  plume: ['atk'],
  sands: ['hp_', 'atk_', 'def_', 'enerRech_', 'eleMas'],
  goblet: [
    'hp_',
    'atk_',
    'def_',
    'eleMas',
    'pyro_dmg_',
    'hydro_dmg_',
    'cryo_dmg_',
    'electro_dmg_',
    'anemo_dmg_',
    'geo_dmg_',
    'dendro_dmg_',
    'physical_dmg_',
  ],
  circlet: [
    'hp_',
    'atk_',
    'def_',
    'eleMas',
    'critRate_',
    'critDMG_',
    'heal_',
  ],
};

export interface DomainPair {
  domainName: string;
  region: string;
  sets: [string, string];
}

/**
 * Mapping of all artifact farming domains to their dual 5-star set drops.
 */
export const DOMAIN_PAIRS_REGISTRY: DomainPair[] = [
  { domainName: 'Midsummer Courtyard', region: 'Mondstadt', sets: ['Thundering Fury', 'Thundersoother'] },
  { domainName: 'Valley of Remembrance', region: 'Mondstadt', sets: ['Viridescent Venerer', 'Maiden Beloved'] },
  { domainName: 'Domain of Guyun', region: 'Liyue', sets: ['Archaic Petra', 'Retracing Bolide'] },
  { domainName: 'Clear Pool and Mountain Cavern', region: 'Liyue', sets: ['Bloodstained Chivalry', 'Noblesse Oblige'] },
  { domainName: 'Hidden Palace of Zhou Formula', region: 'Liyue', sets: ['Crimson Witch of Flames', 'Lavawalker'] },
  { domainName: 'Peak of Vindagnyr', region: 'Dragonspine', sets: ['Blizzard Strayer', 'Heart of Depth'] },
  { domainName: 'Ridge Watch', region: 'Liyue', sets: ['Tenacity of the Millelith', 'Pale Flame'] },
  { domainName: 'Momiji-Dyed Court', region: 'Inazuma', sets: ['Emblem of Severed Fate', "Shimenawa's Reminiscence"] },
  { domainName: 'Slumbering Court', region: 'Inazuma', sets: ['Husk of Opulent Dreams', 'Ocean-Hued Clam'] },
  { domainName: 'The Lost Valley', region: 'The Chasm', sets: ['Vermillion Hereafter', 'Echoes of an Offering'] },
  { domainName: 'Spire of Solitary Enlightenment', region: 'Sumeru', sets: ['Deepwood Memories', 'Gilded Dreams'] },
  { domainName: 'City of Gold', region: 'Sumeru', sets: ['Desert Pavilion Chronicle', 'Flower of Paradise Lost'] },
  { domainName: 'Molten Iron Fortress', region: 'Sumeru', sets: ["Nymph's Dream", "Vourukasha's Glow"] },
  { domainName: 'Denouement of Sin', region: 'Fontaine', sets: ['Marechaussee Hunter', 'Golden Troupe'] },
  { domainName: 'Waterfall Wen', region: 'Fontaine', sets: ['Song of Days Past', 'Nighttime Whispers in the Echoing Woods'] },
  { domainName: 'Faded Theater', region: 'Fontaine', sets: ['Fragment of Harmonic Whimsy', 'Unfinished Reverie'] },
  { domainName: 'Sanctum of Rainbow Spirits', region: 'Natlan', sets: ['Scroll of the Hero of Cinder City', 'Obsidian Codex'] },
  { domainName: 'Blazing Ruins of Dawn', region: 'Natlan', sets: ['A Day Carved From Rising Winds', 'Disenchantment in Deep Shadow'] },
  { domainName: 'Frost-Veiled Sanctuary', region: 'Nod-Krai', sets: ["Silken Moon's Serenade", 'Finale of the Deep Galleries'] },
];

/**
 * Complete set of artifact set names eligible for Mystic Offering (Artifact Strongbox).
 */
export const STRONGBOX_SETS_SET = new Set<string>([
  "Gladiator's Finale",
  "Wanderer's Troupe",
  'Noblesse Oblige',
  'Bloodstained Chivalry',
  'Maiden Beloved',
  'Viridescent Venerer',
  'Archaic Petra',
  'Retracing Bolide',
  'Thundersoother',
  'Thundering Fury',
  'Lavawalker',
  'Crimson Witch of Flames',
  'Blizzard Strayer',
  'Heart of Depth',
  'Tenacity of the Millelith',
  'Pale Flame',
  "Shimenawa's Reminiscence",
  'Emblem of Severed Fate',
  'Husk of Opulent Dreams',
  'Ocean-Hued Clam',
  'Vermillion Hereafter',
  'Echoes of an Offering',
  'Deepwood Memories',
  'Gilded Dreams',
  'Desert Pavilion Chronicle',
  'Flower of Paradise Lost',
  "Nymph's Dream",
  "Vourukasha's Glow",
  'Marechaussee Hunter',
  'Golden Troupe',
  'Song of Days Past',
  'Nighttime Whispers in the Echoing Woods',
]);

/**
 * Realistic Genshin domain farming constants.
 */
export const DOMAIN_CONSTANTS = {
  DAILY_RESIN: 180,
  RESIN_PER_RUN: 20,
  RUNS_PER_DAY: 9, // 180 / 20
  FIVE_STAR_PER_RUN: 1.065, // Average 5-star drops per 20 resin domain run
  TARGET_SET_CHANCE: 0.5, // 50% chance of target set in a 2-set domain
  SLOT_CHANCE: 0.2, // 1 in 5 slots (Flower, Feather, Sands, Goblet, Circlet)
  FOUR_LINE_DROP_CHANCE: 0.2, // 20% of 5-star drops start with 4 lines, 80% start with 3
};

/**
 * Curated stat weight profiles for Celestia characters.
 * Useful stat weights are scaled between 0.0 (irrelevant) and 1.0 (primary priority).
 */
export const CHARACTER_STAT_WEIGHTS: Record<string, CharacterStatWeightConfig> = {
  Nefer: {
    characterId: 'Nefer',
    characterName: 'Nefer',
    preferredMainStats: {
      sands: ['eleMas', 'atk_'],
      goblet: ['dendro_dmg_', 'eleMas'],
      circlet: ['critRate_', 'critDMG_', 'eleMas'],
    },
    statWeights: {
      eleMas: 1.0,
      critRate_: 1.0,
      critDMG_: 1.0,
      enerRech_: 0.7,
      atk_: 0.5,
      atk: 0.15,
    },
    erRequirement: 130,
    targetSets: ['Deepwood Memories', 'Gilded Dreams', 'Flower of Paradise Lost'],
  },
  Furina: {
    characterId: 'Furina',
    characterName: 'Furina',
    preferredMainStats: {
      sands: ['hp_', 'enerRech_'],
      goblet: ['hydro_dmg_', 'hp_'],
      circlet: ['critRate_', 'critDMG_', 'hp_'],
    },
    statWeights: {
      hp_: 1.0,
      critRate_: 1.0,
      critDMG_: 1.0,
      enerRech_: 0.85,
      hp: 0.35,
      eleMas: 0.2,
    },
    erRequirement: 170,
    targetSets: ['Golden Troupe'],
  },
  Mavuika: {
    characterId: 'Mavuika',
    characterName: 'Mavuika',
    preferredMainStats: {
      sands: ['atk_', 'enerRech_'],
      goblet: ['pyro_dmg_'],
      circlet: ['critRate_', 'critDMG_'],
    },
    statWeights: {
      critRate_: 1.0,
      critDMG_: 1.0,
      atk_: 0.85,
      enerRech_: 0.75,
      eleMas: 0.65,
      atk: 0.25,
    },
    erRequirement: 140,
    targetSets: ['Obsidian Codex'],
  },
  Xilonen: {
    characterId: 'Xilonen',
    characterName: 'Xilonen',
    preferredMainStats: {
      sands: ['def_', 'enerRech_'],
      goblet: ['def_'],
      circlet: ['heal_', 'def_', 'critRate_'],
    },
    statWeights: {
      def_: 1.0,
      enerRech_: 0.95,
      def: 0.35,
      critRate_: 0.6,
      critDMG_: 0.4,
      hp_: 0.2,
    },
    erRequirement: 170,
    targetSets: ['Scroll of the Hero of Cinder City'],
  },
  Bennett: {
    characterId: 'Bennett',
    characterName: 'Bennett',
    preferredMainStats: {
      sands: ['enerRech_', 'hp_'],
      goblet: ['hp_'],
      circlet: ['heal_', 'hp_'],
    },
    statWeights: {
      enerRech_: 1.0,
      hp_: 0.85,
      hp: 0.4,
      critRate_: 0.35,
      critDMG_: 0.35,
    },
    erRequirement: 220,
    targetSets: ['Noblesse Oblige'],
  },
  Xiangling: {
    characterId: 'Xiangling',
    characterName: 'Xiangling',
    preferredMainStats: {
      sands: ['enerRech_', 'atk_', 'eleMas'],
      goblet: ['pyro_dmg_'],
      circlet: ['critRate_', 'critDMG_'],
    },
    statWeights: {
      enerRech_: 1.0,
      critRate_: 1.0,
      critDMG_: 1.0,
      atk_: 0.75,
      eleMas: 0.75,
      atk: 0.25,
    },
    erRequirement: 200,
    targetSets: ['Emblem of Severed Fate'],
  },
  Xingqiu: {
    characterId: 'Xingqiu',
    characterName: 'Xingqiu',
    preferredMainStats: {
      sands: ['atk_', 'enerRech_'],
      goblet: ['hydro_dmg_'],
      circlet: ['critRate_', 'critDMG_'],
    },
    statWeights: {
      critRate_: 1.0,
      critDMG_: 1.0,
      enerRech_: 0.9,
      atk_: 0.75,
      atk: 0.2,
    },
    erRequirement: 180,
    targetSets: ['Emblem of Severed Fate', 'Noblesse Oblige'],
  },
  Yelan: {
    characterId: 'Yelan',
    characterName: 'Yelan',
    preferredMainStats: {
      sands: ['hp_', 'enerRech_'],
      goblet: ['hydro_dmg_'],
      circlet: ['critRate_', 'critDMG_'],
    },
    statWeights: {
      critRate_: 1.0,
      critDMG_: 1.0,
      hp_: 1.0,
      enerRech_: 0.95,
      hp: 0.3,
    },
    erRequirement: 180,
    targetSets: ['Emblem of Severed Fate'],
  },
  Kazuha: {
    characterId: 'Kazuha',
    characterName: 'Kaedehara Kazuha',
    preferredMainStats: {
      sands: ['eleMas', 'enerRech_'],
      goblet: ['eleMas'],
      circlet: ['eleMas'],
    },
    statWeights: {
      eleMas: 1.0,
      enerRech_: 0.9,
      atk_: 0.25,
      critRate_: 0.35,
    },
    erRequirement: 160,
    targetSets: ['Viridescent Venerer'],
  },
  Nahida: {
    characterId: 'Nahida',
    characterName: 'Nahida',
    preferredMainStats: {
      sands: ['eleMas'],
      goblet: ['dendro_dmg_', 'eleMas'],
      circlet: ['critRate_', 'critDMG_', 'eleMas'],
    },
    statWeights: {
      eleMas: 1.0,
      critRate_: 0.95,
      critDMG_: 0.95,
      enerRech_: 0.6,
      atk_: 0.4,
    },
    erRequirement: 130,
    targetSets: ['Deepwood Memories', 'Gilded Dreams'],
  },
  HuTao: {
    characterId: 'HuTao',
    characterName: 'Hu Tao',
    preferredMainStats: {
      sands: ['hp_', 'eleMas'],
      goblet: ['pyro_dmg_'],
      circlet: ['critRate_', 'critDMG_'],
    },
    statWeights: {
      critRate_: 1.0,
      critDMG_: 1.0,
      hp_: 0.85,
      eleMas: 0.8,
      hp: 0.25,
      atk_: 0.3,
    },
    erRequirement: 110,
    targetSets: ['Crimson Witch of Flames', "Shimenawa's Reminiscence"],
  },
  Raiden: {
    characterId: 'Raiden',
    characterName: 'Raiden Shogun',
    preferredMainStats: {
      sands: ['enerRech_', 'atk_'],
      goblet: ['electro_dmg_', 'atk_'],
      circlet: ['critRate_', 'critDMG_'],
    },
    statWeights: {
      critRate_: 1.0,
      critDMG_: 1.0,
      enerRech_: 1.0,
      atk_: 0.75,
      atk: 0.2,
    },
    erRequirement: 250,
    targetSets: ['Emblem of Severed Fate'],
  },
  Arlecchino: {
    characterId: 'Arlecchino',
    characterName: 'Arlecchino',
    preferredMainStats: {
      sands: ['atk_'],
      goblet: ['pyro_dmg_'],
      circlet: ['critRate_', 'critDMG_'],
    },
    statWeights: {
      critRate_: 1.0,
      critDMG_: 1.0,
      atk_: 0.85,
      eleMas: 0.6,
      enerRech_: 0.4,
      atk: 0.25,
    },
    erRequirement: 120,
    targetSets: ['Fragment of Harmonic Whimsy'],
  },
  Nilou: {
    characterId: 'Nilou',
    characterName: 'Nilou',
    preferredMainStats: {
      sands: ['hp_'],
      goblet: ['hp_'],
      circlet: ['hp_'],
    },
    statWeights: {
      hp_: 1.0,
      hp: 0.45,
      eleMas: 0.8,
      enerRech_: 0.5,
    },
    erRequirement: 140,
    targetSets: ["Vourukasha's Glow", 'Tenacity of the Millelith'],
  },
  KukiShinobu: {
    characterId: 'KukiShinobu',
    characterName: 'Kuki Shinobu',
    preferredMainStats: {
      sands: ['eleMas'],
      goblet: ['eleMas'],
      circlet: ['eleMas', 'heal_'],
    },
    statWeights: {
      eleMas: 1.0,
      hp_: 0.65,
      hp: 0.3,
      enerRech_: 0.4,
    },
    erRequirement: 130,
    targetSets: ['Flower of Paradise Lost', 'Gilded Dreams'],
  },
  SangonomiyaKokomi: {
    characterId: 'SangonomiyaKokomi',
    characterName: 'Sangonomiya Kokomi',
    preferredMainStats: {
      sands: ['hp_', 'enerRech_'],
      goblet: ['hydro_dmg_', 'hp_'],
      circlet: ['heal_', 'hp_'],
    },
    statWeights: {
      hp_: 1.0,
      heal_: 1.0,
      enerRech_: 0.85,
      hp: 0.4,
      eleMas: 0.4,
      atk_: 0.2,
      critRate_: 0,
      critDMG_: 0,
    },
    erRequirement: 160,
    targetSets: ['Ocean-Hued Clam', 'Tenacity of the Millelith'],
  },
  Neuvillette: {
    characterId: 'Neuvillette',
    characterName: 'Neuvillette',
    preferredMainStats: {
      sands: ['hp_'],
      goblet: ['hydro_dmg_', 'hp_'],
      circlet: ['critRate_', 'critDMG_', 'hp_'],
    },
    statWeights: {
      hp_: 1.0,
      critRate_: 1.0,
      critDMG_: 1.0,
      enerRech_: 0.7,
      hp: 0.35,
    },
    erRequirement: 120,
    targetSets: ['Marechaussee Hunter'],
  },
  Gorou: {
    characterId: 'Gorou',
    characterName: 'Gorou',
    preferredMainStats: {
      sands: ['def_', 'enerRech_'],
      goblet: ['def_', 'geo_dmg_'],
      circlet: ['def_', 'critRate_'],
    },
    statWeights: {
      def_: 1.0,
      enerRech_: 1.0,
      def: 0.4,
      critRate_: 0.6,
      critDMG_: 0,
    },
    erRequirement: 220,
    targetSets: ['Husk of Opulent Dreams', 'The Exile', 'Noblesse Oblige'],
  },
  Faruzan: {
    characterId: 'Faruzan',
    characterName: 'Faruzan',
    preferredMainStats: {
      sands: ['enerRech_'],
      goblet: ['anemo_dmg_'],
      circlet: ['critRate_'],
    },
    statWeights: {
      enerRech_: 1.0,
      critRate_: 0.8,
      critDMG_: 0.7,
      atk_: 0.4,
    },
    erRequirement: 240,
    targetSets: ['The Exile', 'Tenacity of the Millelith', 'Emblem of Severed Fate', 'Viridescent Venerer'],
  },
  KamisatoAyaka: {
    characterId: 'KamisatoAyaka',
    characterName: 'Kamisato Ayaka',
    preferredMainStats: {
      sands: ['atk_'],
      goblet: ['cryo_dmg_'],
      circlet: ['critDMG_', 'atk_'],
    },
    statWeights: {
      critDMG_: 1.0,
      atk_: 0.85,
      critRate_: 0.7,
      enerRech_: 0.75,
      atk: 0.25,
    },
    erRequirement: 140,
    targetSets: ['Blizzard Strayer'],
  },
  AratakiItto: {
    characterId: 'AratakiItto',
    characterName: 'Arataki Itto',
    preferredMainStats: {
      sands: ['def_'],
      goblet: ['geo_dmg_'],
      circlet: ['critRate_', 'critDMG_'],
    },
    statWeights: {
      def_: 1.0,
      critRate_: 1.0,
      critDMG_: 1.0,
      enerRech_: 0.75,
      atk_: 0.3,
      def: 0.35,
    },
    erRequirement: 130,
    targetSets: ['Husk of Opulent Dreams'],
  },
};

export const CHARACTER_ALIASES: Record<string, string> = {
  kazuha: 'KaedeharaKazuha',
  raiden: 'RaidenShogun',
  ayaka: 'KamisatoAyaka',
  ayato: 'KamisatoAyato',
  itto: 'AratakiItto',
  kokomi: 'SangonomiyaKokomi',
  heizou: 'ShikanoinHeizou',
  sara: 'KujouSara',
  shinobu: 'KukiShinobu',
  mizuki: 'YumemizukiMizuki',
  childe: 'Tartaglia',
  yae: 'YaeMiko',
  baizhu: 'Baizhu',
  neuvillette: 'Neuvillette',
  gorou: 'Gorou',
  faruzan: 'Faruzan',
};

const GOBLET_STAT_MAP: Record<string, StatKey> = {
  'Pyro DMG Bonus': 'pyro_dmg_',
  'Hydro DMG Bonus': 'hydro_dmg_',
  'Dendro DMG Bonus': 'dendro_dmg_',
  'Electro DMG Bonus': 'electro_dmg_',
  'Anemo DMG Bonus': 'anemo_dmg_',
  'Cryo DMG Bonus': 'cryo_dmg_',
  'Geo DMG Bonus': 'geo_dmg_',
  'Physical DMG Bonus': 'physical_dmg_',
  'HP%': 'hp_',
  'DEF%': 'def_',
  'ATK%': 'atk_',
  'Elemental Mastery': 'eleMas',
};

const SANDS_STAT_MAP: Record<string, StatKey> = {
  'HP%': 'hp_',
  'DEF%': 'def_',
  'Energy Recharge': 'enerRech_',
  'Elemental Mastery': 'eleMas',
  'ATK%': 'atk_',
};

const STAT_WEIGHTS_CACHE = new Map<string, CharacterStatWeightConfig>();

/**
 * Returns character-specific stat weights if present, or synthesizes an authoritative config
 * from character SSOT data (roles, element, build sands/goblet/subStats).
 */
export function getCharacterStatWeights(characterIdOrName: string): CharacterStatWeightConfig {
  if (!characterIdOrName || typeof characterIdOrName !== 'string') {
    return {
      characterId: 'unknown',
      characterName: 'Unknown',
      preferredMainStats: {
        sands: ['atk_'],
        goblet: ['pyro_dmg_'],
        circlet: ['critRate_', 'critDMG_'],
      },
      statWeights: {
        critRate_: 1.0,
        critDMG_: 1.0,
        atk_: 0.75,
        enerRech_: 0.6,
        eleMas: 0.4,
        atk: 0.2,
      },
      erRequirement: 130,
      targetSets: [],
    };
  }

  const cached = STAT_WEIGHTS_CACHE.get(characterIdOrName);
  if (cached) return cached;

  const normalized = characterIdOrName.replace(/[\s\-_]/g, '').toLowerCase();
  const resolvedAlias = CHARACTER_ALIASES[normalized]?.toLowerCase() || normalized;

  for (const [key, config] of Object.entries(CHARACTER_STAT_WEIGHTS)) {
    const normKey = key.replace(/[\s\-_]/g, '').toLowerCase();
    const normName = config.characterName.replace(/[\s\-_]/g, '').toLowerCase();
    if (
      normKey === normalized ||
      normName === normalized ||
      normKey === resolvedAlias ||
      normName === resolvedAlias
    ) {
      STAT_WEIGHTS_CACHE.set(characterIdOrName, config);
      return config;
    }
  }

  // Look up character from SSOT data
  const char = CHARACTERS.find((c) => {
    const cId = c.id.toLowerCase();
    const cName = c.name.replace(/[\s\-_]/g, '').toLowerCase();
    return (
      cId === normalized ||
      cName === normalized ||
      cId === resolvedAlias ||
      cName === resolvedAlias ||
      cId.endsWith(normalized) ||
      cName.endsWith(normalized) ||
      (normalized.length >= 4 && (cId.includes(normalized) || cName.includes(normalized)))
    );
  });

  if (char) {
    const isKokomi =
      char.id === 'SangonomiyaKokomi' ||
      char.name.toLowerCase().includes('kokomi');

    // Dynamically infer sands from char.build?.mainStats?.sands
    const sandsStrings = char.build?.mainStats?.sands || [];
    const mappedSands: StatKey[] = sandsStrings
      .map((s) => SANDS_STAT_MAP[s])
      .filter((s): s is StatKey => !!s);
    const preferredSands: StatKey[] =
      mappedSands.length > 0 ? Array.from(new Set(mappedSands)) : ['atk_'];

    // Dynamically determine goblet from element and build
    const elemKey = `${char.element.toLowerCase()}_dmg_` as StatKey;
    const isPhysical = char.build?.mainStats?.goblet?.some((g) =>
      g.toLowerCase().includes('physical')
    );
    const preferredGoblet: StatKey[] = isPhysical ? ['physical_dmg_'] : [elemKey];

    if (char.build?.mainStats?.goblet) {
      for (const g of char.build.mainStats.goblet) {
        const mapped = GOBLET_STAT_MAP[g];
        if (mapped && !preferredGoblet.includes(mapped)) {
          if (
            mapped === elemKey ||
            mapped === 'physical_dmg_' ||
            ['hp_', 'def_', 'atk_', 'eleMas'].includes(mapped)
          ) {
            preferredGoblet.push(mapped);
          }
        }
      }
    }

    // Infer circlet
    const preferredCirclet: StatKey[] = isKokomi
      ? ['heal_', 'hp_']
      : ['critRate_', 'critDMG_'];
    if (preferredSands.includes('hp_') && !preferredCirclet.includes('hp_'))
      preferredCirclet.push('hp_');
    if (preferredSands.includes('def_') && !preferredCirclet.includes('def_'))
      preferredCirclet.push('def_');
    if (preferredSands.includes('eleMas') && !preferredCirclet.includes('eleMas'))
      preferredCirclet.push('eleMas');

    // Adjust statWeights accordingly
    const hasDef = preferredSands.includes('def_');
    const hasHp = preferredSands.includes('hp_');
    const hasEm = preferredSands.includes('eleMas');
    const hasEr = preferredSands.includes('enerRech_');

    const statWeights: Partial<Record<StatKey, number>> = {};

    if (isKokomi) {
      statWeights.hp_ = 1.0;
      statWeights.heal_ = 1.0;
      statWeights.enerRech_ = 0.85;
      statWeights.hp = 0.4;
      statWeights.eleMas = 0.4;
      statWeights.atk_ = 0.2;
      statWeights.critRate_ = 0;
      statWeights.critDMG_ = 0;
    } else if (hasDef) {
      statWeights.def_ = 1.0;
      statWeights.critRate_ = 1.0;
      statWeights.critDMG_ = 1.0;
      statWeights.enerRech_ = hasEr ? 0.85 : 0.6;
      statWeights.def = 0.35;
      statWeights.atk_ = 0.2;
      if (hasEm) statWeights.eleMas = 0.5;
    } else if (hasHp) {
      statWeights.hp_ = 1.0;
      statWeights.critRate_ = 1.0;
      statWeights.critDMG_ = 1.0;
      statWeights.enerRech_ = hasEr ? 0.85 : 0.6;
      statWeights.hp = 0.35;
      statWeights.atk_ = 0.2;
      if (hasEm) statWeights.eleMas = 0.5;
    } else if (hasEm) {
      statWeights.eleMas = 1.0;
      statWeights.critRate_ = 1.0;
      statWeights.critDMG_ = 1.0;
      statWeights.enerRech_ = hasEr ? 0.85 : 0.6;
      statWeights.atk_ = 0.6;
      statWeights.atk = 0.2;
    } else {
      // Default: balanced ATK% / Crit carry
      statWeights.critRate_ = 1.0;
      statWeights.critDMG_ = 1.0;
      statWeights.atk_ = 0.75;
      statWeights.enerRech_ = hasEr ? 0.85 : 0.6;
      statWeights.eleMas = 0.4;
      statWeights.atk = 0.2;
    }

    const targetSets = char.build?.artifacts?.map((a) => a.name) || [];
    const erRequirement = hasEr ? 160 : 130;

    const synthesized: CharacterStatWeightConfig = {
      characterId: char.id,
      characterName: char.name,
      preferredMainStats: {
        sands: preferredSands,
        goblet: preferredGoblet,
        circlet: preferredCirclet,
      },
      statWeights,
      erRequirement,
      targetSets,
    };
    STAT_WEIGHTS_CACHE.set(characterIdOrName, synthesized);
    return synthesized;
  }

  const isFallbackKokomi =
    normalized.includes('kokomi') || resolvedAlias.includes('kokomi');

  // Generic fallback if character is completely unknown
  const fallback: CharacterStatWeightConfig = {
    characterId: characterIdOrName,
    characterName: characterIdOrName,
    preferredMainStats: {
      sands: isFallbackKokomi ? ['hp_'] : ['atk_'],
      goblet: isFallbackKokomi ? ['hydro_dmg_'] : ['pyro_dmg_'],
      circlet: isFallbackKokomi ? ['heal_', 'hp_'] : ['critRate_', 'critDMG_'],
    },
    statWeights: isFallbackKokomi
      ? {
          hp_: 1.0,
          heal_: 1.0,
          enerRech_: 0.85,
          hp: 0.4,
          eleMas: 0.4,
          atk_: 0.2,
          critRate_: 0,
          critDMG_: 0,
        }
      : {
          critRate_: 1.0,
          critDMG_: 1.0,
          atk_: 0.75,
          enerRech_: 0.6,
          eleMas: 0.4,
          atk: 0.2,
        },
    erRequirement: 130,
    targetSets: [],
  };
  STAT_WEIGHTS_CACHE.set(characterIdOrName, fallback);
  return fallback;
}
