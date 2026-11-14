import type { ArtifactSlot, CharacterStatWeightConfig, StatKey } from '../types/genshin';

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
    targetSets: ['Scroll of the Hero of City of Cinder'],
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
    targetSets: ['Crimson Witch of Flames', 'Shimenawas Reminiscence'],
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
    targetSets: ['Vourukashas Glow', 'Tenacity of the Millelith'],
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
};

/**
 * Returns character-specific stat weights if present, or synthesizes a reasonable default.
 */
export function getCharacterStatWeights(characterIdOrName: string): CharacterStatWeightConfig {
  const normalized = characterIdOrName.replace(/[\s\-_]/g, '');
  for (const [key, config] of Object.entries(CHARACTER_STAT_WEIGHTS)) {
    if (
      key.toLowerCase() === normalized.toLowerCase() ||
      config.characterName.replace(/[\s\-_]/g, '').toLowerCase() === normalized.toLowerCase()
    ) {
      return config;
    }
  }

  // Generic fallback: Balanced Crit Carry
  return {
    characterId: characterIdOrName,
    characterName: characterIdOrName,
    preferredMainStats: {
      sands: ['atk_'],
      goblet: ['pyro_dmg_'], // placeholder elemental dmg
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
  };
}
