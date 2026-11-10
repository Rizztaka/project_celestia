import {
  type CharacterReadinessRequest,
  type CharacterReadinessRequestInput,
  characterReadinessRequestSchema,
  type ReadinessCharacterBuild,
  type ReadinessDimension,
  type ReadinessDimensionResult,
  type ReadinessMissingData,
  type ReadinessStatus,
  type ReadinessTargetEncounter,
  type ReadinessTeamEnergyContext,
  type RoleBenchmarkProfile,
} from '@celestia/api-contracts';

// ---------------------------------------------------------------------------
// Internal Calculator Types (adhering strictly to ADR-0011: no UI/prose text)
// ---------------------------------------------------------------------------

export interface CalculatorDimensionEvaluation extends ReadinessDimensionResult {
  dimension: ReadinessDimension;
  status: ReadinessStatus;
  score: number;
  isReady: boolean;
  details: Record<string, unknown>;
  missingReasons: string[];
}

export interface ReadinessCalculatorResult {
  status: ReadinessStatus;
  score: number;
  dimensions: Record<ReadinessDimension, CalculatorDimensionEvaluation>;
  missingData: ReadinessMissingData[];
  metadata: {
    characterKey: string;
    roleId: string;
    roleName: string;
    encounterId: string;
    encounterName: string;
    hasEnergyDeficit: boolean;
    energyDeficitPp: number;
    observedEr: number | null;
    effectiveErThreshold: number;
    priorityTalents: string[];
    observedTalents: Record<string, number | null>;
    weaponKey: string | null;
    weaponLevel: number | null;
    scalingStat: string;
    observedScalingStat: number | null;
    supportThreshold: number | null;
  };
}

// ---------------------------------------------------------------------------
// Stat and Slot Normalization Helpers
// ---------------------------------------------------------------------------

export function normalizeStatKey(key: string): string {
  const k = key.trim().toLowerCase();
  switch (k) {
    case 'hp%':
    case 'hppercent':
    case 'hp_percent':
      return 'hpPercent';
    case 'atk%':
    case 'atkpercent':
    case 'atk_percent':
      return 'atkPercent';
    case 'def%':
    case 'defpercent':
    case 'def_percent':
      return 'defPercent';
    case 'er':
    case 'energyrecharge':
    case 'energy_recharge':
      return 'energyRecharge';
    case 'em':
    case 'elementalmastery':
    case 'elemental_mastery':
      return 'elementalMastery';
    case 'critrate':
    case 'crit_rate':
    case 'cr':
      return 'critRate';
    case 'critdmg':
    case 'crit_dmg':
    case 'cd':
      return 'critDmg';
    case 'healingbonus':
    case 'healing_bonus':
      return 'healingBonus';
    case 'hydrodmg':
    case 'hydro_dmg':
      return 'hydroDmg';
    case 'pyrodmg':
    case 'pyro_dmg':
      return 'pyroDmg';
    case 'cryodmg':
    case 'cryo_dmg':
      return 'cryoDmg';
    case 'electrodmg':
    case 'electro_dmg':
      return 'electroDmg';
    case 'anemodmg':
    case 'anemo_dmg':
      return 'anemoDmg';
    case 'geodmg':
    case 'geo_dmg':
      return 'geoDmg';
    case 'dendrodmg':
    case 'dendro_dmg':
      return 'dendroDmg';
    case 'physicaldmg':
    case 'physical_dmg':
      return 'physicalDmg';
    case 'maxhp':
    case 'hp':
      return 'maxHp';
    case 'basedef':
    case 'def':
      return 'def';
    case 'baseatk':
    case 'atk':
      return 'atk';
    default:
      return key;
  }
}

export function normalizeSlot(slot: string): 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet' {
  const s = slot.trim().toLowerCase();
  if (s === 'flower' || s === 'plume' || s === 'sands' || s === 'goblet' || s === 'circlet') {
    return s;
  }
  return 'sands';
}

// ---------------------------------------------------------------------------
// Benchmark Role Definitions
// ---------------------------------------------------------------------------

const defaultBenchmarks: Record<string, RoleBenchmarkProfile> = {
  // Furina
  'furina:party_buff': {
    roleId: 'party_buff',
    roleName: 'Party Buff / Off-field Support',
    targetLevel: 80,
    targetAscension: 5,
    priorityTalents: ['burst', 'skill'],
    minTalentLevels: { burst: 8, skill: 8 },
    recommendedWeapons: [
      'SplendorOfTranquilWaters',
      'FesteringDesire',
      'FleuveCendreFerryman',
      'FavoniusSword',
      'KeyOfKhajNisut',
      'TheDockhandsAssistant',
    ],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['hpPercent', 'energyRecharge'],
      goblet: ['hpPercent', 'hydroDmg'],
      circlet: ['critRate', 'critDmg', 'hpPercent'],
    },
    recommendedSets: [{ setKey: 'GoldenTroupe', pieces: 4 }],
    energyRechargeThreshold: 180,
    scalingStat: 'hp',
    minSupportStatThreshold: 30000,
  },
  'furina:off_field_damage': {
    roleId: 'off_field_damage',
    roleName: 'Off-Field Hydro Damage',
    targetLevel: 80,
    targetAscension: 5,
    priorityTalents: ['skill', 'burst'],
    minTalentLevels: { skill: 8, burst: 8 },
    recommendedWeapons: [
      'SplendorOfTranquilWaters',
      'FesteringDesire',
      'FleuveCendreFerryman',
      'FavoniusSword',
      'KeyOfKhajNisut',
    ],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['hpPercent', 'energyRecharge'],
      goblet: ['hydroDmg', 'hpPercent'],
      circlet: ['critRate', 'critDmg'],
    },
    recommendedSets: [{ setKey: 'GoldenTroupe', pieces: 4 }],
    energyRechargeThreshold: 180,
    scalingStat: 'hp',
    minSupportStatThreshold: 30000,
  },

  // Bennett
  'bennett:healing_support': {
    roleId: 'healing_support',
    roleName: 'Healing & Attack Buffer',
    targetLevel: 80,
    targetAscension: 5,
    priorityTalents: ['burst', 'skill'],
    minTalentLevels: { burst: 8, skill: 6 },
    recommendedWeapons: [
      'AquilaFavonia',
      'MistsplitterReforged',
      'SkywardBlade',
      'SapwoodBlade',
      'FavoniusSword',
      'TheAlleyFlash',
    ],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['energyRecharge', 'hpPercent'],
      goblet: ['hpPercent'],
      circlet: ['healingBonus', 'hpPercent', 'critRate'],
    },
    recommendedSets: [{ setKey: 'NoblesseOblige', pieces: 4 }],
    energyRechargeThreshold: 200,
    scalingStat: 'er',
    minSupportStatThreshold: 200,
  },

  // Xiangling
  'xiangling:off_field_damage': {
    roleId: 'off_field_damage',
    roleName: 'Off-Field Pyro DPS',
    targetLevel: 80,
    targetAscension: 5,
    priorityTalents: ['burst', 'skill'],
    minTalentLevels: { burst: 8, skill: 6 },
    recommendedWeapons: [
      'StaffOfTheScarletSands',
      'TheCatch',
      'EngulfingLightning',
      'WavebreakersFin',
      'FavoniusLance',
      'DragonBane',
    ],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['energyRecharge', 'atkPercent', 'elementalMastery'],
      goblet: ['pyroDmg'],
      circlet: ['critRate', 'critDmg'],
    },
    conditionalMainStats: {
      sands: { elementalMastery: 'reaction_context' },
    },
    recommendedSets: [{ setKey: 'EmblemOfSeveredFate', pieces: 4 }],
    energyRechargeThreshold: 200,
    scalingStat: 'atk',
  },

  // Xingqiu
  'xingqiu:off_field_damage': {
    roleId: 'off_field_damage',
    roleName: 'Off-Field Hydro Sub-DPS',
    targetLevel: 80,
    targetAscension: 5,
    priorityTalents: ['burst', 'skill'],
    minTalentLevels: { burst: 8, skill: 8 },
    recommendedWeapons: [
      'SacrificialSword',
      'FavoniusSword',
      'FleuveCendreFerryman',
      'PrimordialJadeCutter',
    ],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['energyRecharge', 'atkPercent'],
      goblet: ['hydroDmg'],
      circlet: ['critRate', 'critDmg'],
    },
    recommendedSets: [{ setKey: 'EmblemOfSeveredFate', pieces: 4 }],
    energyRechargeThreshold: 180,
    scalingStat: 'atk',
  },

  // Kaedehara Kazuha
  'kaedeharakazuha:resistance_shred': {
    roleId: 'resistance_shred',
    roleName: 'Anemo VV Shred & Swirl Buffer',
    targetLevel: 80,
    targetAscension: 5,
    priorityTalents: ['skill', 'burst'],
    minTalentLevels: { skill: 8, burst: 8 },
    recommendedWeapons: [
      'FreedomSworn',
      'XiphosMoonlight',
      'IronSting',
      'FavoniusSword',
      'SacrificialSword',
      'ToukabouShigure',
    ],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['elementalMastery', 'energyRecharge'],
      goblet: ['elementalMastery'],
      circlet: ['elementalMastery', 'critRate'],
    },
    recommendedSets: [{ setKey: 'ViridescentVenerer', pieces: 4 }],
    energyRechargeThreshold: 160,
    scalingStat: 'em',
    minSupportStatThreshold: 600,
  },

  // Sucrose
  'sucrose:resistance_shred': {
    roleId: 'resistance_shred',
    roleName: 'Anemo Swirl & VV Shred Support',
    targetLevel: 80,
    targetAscension: 5,
    priorityTalents: ['skill', 'burst'],
    minTalentLevels: { skill: 6, burst: 6 },
    recommendedWeapons: [
      'SacrificialFragments',
      'AThousandFloatingDreams',
      'MappaMare',
      'FavoniusCodex',
      'MagicGuide',
    ],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['elementalMastery', 'energyRecharge'],
      goblet: ['elementalMastery'],
      circlet: ['elementalMastery'],
    },
    recommendedSets: [{ setKey: 'ViridescentVenerer', pieces: 4 }],
    energyRechargeThreshold: 140,
    scalingStat: 'em',
    minSupportStatThreshold: 500,
  },

  // Hu Tao
  'hutao:on_field_damage': {
    roleId: 'on_field_damage',
    roleName: 'On-Field Pyro Hypercarry',
    targetLevel: 80,
    targetAscension: 5,
    priorityTalents: ['normal', 'skill', 'burst'],
    minTalentLevels: { normal: 8, skill: 8, burst: 8 },
    recommendedWeapons: [
      'StaffOfHoma',
      'StaffOfTheScarletSands',
      'BalladOfTheFjords',
      'DragonsBane',
      'DragonBane',
      'PrimordialJadeWingedSpear',
      'Deathmatch',
      'WhiteTassel',
      'BlackcliffPole',
    ],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['hpPercent', 'elementalMastery'],
      goblet: ['pyroDmg'],
      circlet: ['critRate', 'critDmg'],
    },
    conditionalMainStats: {
      sands: { elementalMastery: 'reaction_context' },
    },
    recommendedSets: [
      { setKey: 'CrimsonWitchOfFlames', pieces: 4 },
      { setKey: 'MarechausseeHunter', pieces: 4 },
      { setKey: 'ShimenawasReminiscence', pieces: 4 },
      { setKey: 'GildedDreams', pieces: 4 },
    ],
    energyRechargeThreshold: 110,
    scalingStat: 'hp',
    minSupportStatThreshold: 28000,
  },

  // Raiden Shogun
  'raidenshogun:on_field_damage': {
    roleId: 'on_field_damage',
    roleName: 'On-Field Electro Burst Carry',
    targetLevel: 80,
    targetAscension: 5,
    priorityTalents: ['burst', 'skill'],
    minTalentLevels: { burst: 8, skill: 8 },
    recommendedWeapons: [
      'EngulfingLightning',
      'TheCatch',
      'StaffOfTheScarletSands',
      'StaffOfHoma',
      'PrimordialJadeWingedSpear',
      'SkywardSpine',
      'WavebreakersFin',
      'FavoniusLance',
    ],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['energyRecharge', 'atkPercent'],
      goblet: ['electroDmg', 'atkPercent'],
      circlet: ['critRate', 'critDmg'],
    },
    recommendedSets: [{ setKey: 'EmblemOfSeveredFate', pieces: 4 }],
    energyRechargeThreshold: 200,
    scalingStat: 'er',
    minSupportStatThreshold: 200,
  },
  'raidenshogun:off_field_damage': {
    roleId: 'off_field_damage',
    roleName: 'Off-Field Hyperbloom Trigger',
    targetLevel: 90,
    targetAscension: 6,
    priorityTalents: ['skill'],
    minTalentLevels: { skill: 8 },
    recommendedWeapons: [
      'DragonsBane',
      'DragonBane',
      'Moonpiercer',
      'KitainCrossSpear',
      'BalladOfTheFjords',
    ],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['elementalMastery'],
      goblet: ['elementalMastery'],
      circlet: ['elementalMastery'],
    },
    recommendedSets: [
      { setKey: 'FlowerOfParadiseLost', pieces: 4 },
      { setKey: 'GildedDreams', pieces: 4 },
    ],
    energyRechargeThreshold: 100,
    scalingStat: 'em',
    minSupportStatThreshold: 700,
  },
  'raidenshogun:party_buff': {
    roleId: 'party_buff',
    roleName: 'Universal Battery & Burst Buffer',
    targetLevel: 80,
    targetAscension: 5,
    priorityTalents: ['burst', 'skill'],
    minTalentLevels: { burst: 8, skill: 8 },
    recommendedWeapons: ['EngulfingLightning', 'TheCatch', 'FavoniusLance'],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['energyRecharge'],
      goblet: ['electroDmg', 'atkPercent'],
      circlet: ['critRate', 'critDmg'],
    },
    recommendedSets: [{ setKey: 'EmblemOfSeveredFate', pieces: 4 }],
    energyRechargeThreshold: 220,
    scalingStat: 'er',
    minSupportStatThreshold: 220,
  },

  // Sandrone
  'sandrone:on_field_damage': {
    roleId: 'on_field_damage',
    roleName: 'On-Field Stellar-Conduct Carry',
    targetLevel: 80,
    targetAscension: 5,
    priorityTalents: ['normal', 'burst', 'skill'],
    minTalentLevels: { normal: 8, burst: 8, skill: 6 },
    recommendedWeapons: [
      'ATeaspoonOfTranscendence',
      'AThousandBlazingSuns',
      'ForgedByTheGoldenMelody',
      'BladeOfAtonement',
      'TidalShadow',
      'SerpentSpine',
      'RedhornStonethresher',
    ],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['atkPercent'],
      goblet: ['atkPercent'],
      circlet: ['critRate', 'critDmg'],
    },
    recommendedSets: [
      { setKey: 'DisenchantmentInDeepShadow', pieces: 4 },
      { setKey: 'GildedDreams', pieces: 4 },
      { setKey: 'ADayCarvedFromRisingWinds', pieces: 4 },
    ],
    energyRechargeThreshold: 100,
    scalingStat: 'atk',
    minSupportStatThreshold: 2000,
  },

  // Odette
  'odette:off_field_damage': {
    roleId: 'off_field_damage',
    roleName: 'Off-Field Cryo Sub-DPS & Stellar Glimmer Buffer',
    targetLevel: 80,
    targetAscension: 5,
    priorityTalents: ['skill', 'burst'],
    minTalentLevels: { skill: 8, burst: 6 },
    recommendedWeapons: [
      'WhitelakeFrostfeather',
      'Absolution',
      'Azurelight',
      'UrakuMisugiri',
      'LightOfFoliarIncision',
      'CinnabarSpindle',
      'WolfFang',
      'FinaleOfTheDeep',
      'AmenomaKageuchi',
      'HarbingerOfDawn',
    ],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['atkPercent'],
      goblet: ['atkPercent'],
      circlet: ['critRate', 'critDmg'],
    },
    recommendedSets: [
      { setKey: 'HeartOfTheFurnace', pieces: 4 },
      { setKey: 'DisenchantmentInDeepShadow', pieces: 4 },
      { setKey: 'TenacityOfTheMillelith', pieces: 4 },
    ],
    energyRechargeThreshold: 100,
    scalingStat: 'atk',
    minSupportStatThreshold: 2200,
  },

  // Vodyanitsa
  'vodyanitsa:healing_support': {
    roleId: 'healing_support',
    roleName: 'Off-Field Hydro Healer & Additive Base DMG Buffer',
    targetLevel: 80,
    targetAscension: 5,
    priorityTalents: ['skill', 'burst'],
    minTalentLevels: { skill: 8, burst: 6 },
    recommendedWeapons: [
      'HymnOfTheMaelstrom',
      'ThrillingTalesOfDragonSlayers',
      'ThrillingTales',
      'PrototypeAmber',
      'AshGravenDrinkingHorn',
      'SacrificialJade',
    ],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['hpPercent'],
      goblet: ['hpPercent'],
      circlet: ['hpPercent', 'healingBonus'],
    },
    recommendedSets: [
      { setKey: 'TenacityOfTheMillelith', pieces: 4 },
      { setKey: 'ScrollOfTheHeroOfCinderCity', pieces: 4 },
      { setKey: 'VourukashasGlow', pieces: 2 },
    ],
    energyRechargeThreshold: 100,
    scalingStat: 'hp',
    minSupportStatThreshold: 40000,
  },
  'vodyanitsa:party_buff': {
    roleId: 'party_buff',
    roleName: 'Hydro RES Shred & Team Additive Buffer',
    targetLevel: 80,
    targetAscension: 5,
    priorityTalents: ['skill', 'burst'],
    minTalentLevels: { skill: 8, burst: 6 },
    recommendedWeapons: [
      'HymnOfTheMaelstrom',
      'ThrillingTalesOfDragonSlayers',
      'ThrillingTales',
      'PrototypeAmber',
      'AshGravenDrinkingHorn',
    ],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['hpPercent'],
      goblet: ['hpPercent'],
      circlet: ['hpPercent'],
    },
    recommendedSets: [
      { setKey: 'TenacityOfTheMillelith', pieces: 4 },
      { setKey: 'ScrollOfTheHeroOfCinderCity', pieces: 4 },
    ],
    energyRechargeThreshold: 100,
    scalingStat: 'hp',
    minSupportStatThreshold: 40000,
  },

  // Chevreuse
  'chevreuse:resistance_shred': {
    roleId: 'resistance_shred',
    roleName: 'Overload Shredder & Attack Buffer',
    targetLevel: 80,
    targetAscension: 5,
    priorityTalents: ['skill', 'burst'],
    minTalentLevels: { skill: 8, burst: 6 },
    recommendedWeapons: [
      'FavoniusLance',
      'BlackTassel',
      'RightfulReward',
      'DialoguesOfTheDesertSages',
      'SymphonistOfScents',
    ],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['hpPercent', 'energyRecharge'],
      goblet: ['hpPercent'],
      circlet: ['hpPercent', 'healingBonus', 'critRate'],
    },
    conditionalMainStats: {
      circlet: { critRate: 'favonius_proc' },
    },
    recommendedSets: [
      { setKey: 'NoblesseOblige', pieces: 4 },
      { setKey: 'SongOfDaysPast', pieces: 4 },
      { setKey: 'ScrollOfTheHeroOfCinderCity', pieces: 4 },
      { setKey: 'TenacityOfTheMillelith', pieces: 4 },
    ],
    energyRechargeThreshold: 100,
    scalingStat: 'hp',
    minSupportStatThreshold: 40000,
  },
  'chevreuse:healing_support': {
    roleId: 'healing_support',
    roleName: 'Chevreuse Healing Support',
    targetLevel: 80,
    targetAscension: 5,
    priorityTalents: ['skill', 'burst'],
    minTalentLevels: { skill: 8, burst: 6 },
    recommendedWeapons: [
      'FavoniusLance',
      'BlackTassel',
      'RightfulReward',
      'DialoguesOfTheDesertSages',
    ],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['hpPercent'],
      goblet: ['hpPercent'],
      circlet: ['hpPercent', 'healingBonus'],
    },
    recommendedSets: [
      { setKey: 'SongOfDaysPast', pieces: 4 },
      { setKey: 'NoblesseOblige', pieces: 4 },
      { setKey: 'TenacityOfTheMillelith', pieces: 4 },
    ],
    energyRechargeThreshold: 100,
    scalingStat: 'hp',
    minSupportStatThreshold: 40000,
  },

  // generic archetypes
  generic_dps: {
    roleId: 'on_field_damage',
    roleName: 'On-Field Damage Dealer',
    targetLevel: 80,
    targetAscension: 5,
    priorityTalents: ['normal', 'skill', 'burst'],
    minTalentLevels: { normal: 8, skill: 8, burst: 8 },
    recommendedWeapons: [],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['atkPercent', 'hpPercent', 'defPercent', 'elementalMastery', 'energyRecharge'],
      goblet: [
        'pyroDmg',
        'hydroDmg',
        'cryoDmg',
        'electroDmg',
        'anemoDmg',
        'geoDmg',
        'dendroDmg',
        'physicalDmg',
        'atkPercent',
      ],
      circlet: ['critRate', 'critDmg'],
    },
    recommendedSets: [],
    energyRechargeThreshold: 120,
    scalingStat: 'atk',
  },
  generic_sub_dps: {
    roleId: 'off_field_damage',
    roleName: 'Off-Field Damage Dealer',
    targetLevel: 80,
    targetAscension: 5,
    priorityTalents: ['skill', 'burst'],
    minTalentLevels: { skill: 8, burst: 8 },
    recommendedWeapons: [],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['atkPercent', 'energyRecharge', 'elementalMastery', 'hpPercent'],
      goblet: ['pyroDmg', 'hydroDmg', 'cryoDmg', 'electroDmg', 'anemoDmg', 'geoDmg', 'dendroDmg'],
      circlet: ['critRate', 'critDmg'],
    },
    recommendedSets: [],
    energyRechargeThreshold: 160,
    scalingStat: 'atk',
  },
  generic_support: {
    roleId: 'party_buff',
    roleName: 'Support & Buffer',
    targetLevel: 80,
    targetAscension: 5,
    priorityTalents: ['burst', 'skill'],
    minTalentLevels: { burst: 8, skill: 6 },
    recommendedWeapons: [],
    minWeaponLevel: 80,
    recommendedMainStats: {
      sands: ['energyRecharge', 'hpPercent', 'defPercent', 'elementalMastery'],
      goblet: ['hpPercent', 'defPercent', 'elementalMastery'],
      circlet: ['healingBonus', 'hpPercent', 'defPercent', 'elementalMastery', 'critRate'],
    },
    recommendedSets: [],
    energyRechargeThreshold: 180,
    scalingStat: 'er',
  },
};

export function resolveRoleBenchmark(
  characterKey: string,
  roleInput?: string | RoleBenchmarkProfile,
): RoleBenchmarkProfile | null {
  if (roleInput && typeof roleInput === 'object') {
    return roleInput;
  }

  const cleanAlphanumeric = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanWithUnderscores = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[-\s]/g, '_')
      .replace(/[^a-z0-9_]/g, '');

  const rawChar = cleanAlphanumeric(characterKey);
  const aliasMap: Record<string, string> = {
    hutao: 'hutao',
    raiden: 'raidenshogun',
    raidenshogun: 'raidenshogun',
    chevreuse: 'chevreuse',
    sandrone: 'sandrone',
    odette: 'odette',
    vodyanitsa: 'vodyanitsa',
    kazuha: 'kaedeharakazuha',
    kaedeharakazuha: 'kaedeharakazuha',
    kokomi: 'sangonomiyakokomi',
    ayaka: 'kamisatoayaka',
    ayato: 'kamisatoayato',
    itto: 'aratakiitto',
    heizou: 'shikanoinheizou',
    yae: 'yaemiko',
    childe: 'tartaglia',
    scaramouche: 'wanderer',
  };
  const normalizedChar = aliasMap[rawChar] ?? rawChar;
  const roleStr = roleInput ? cleanWithUnderscores(roleInput) : '';
  const roleAlphanumeric = roleInput ? cleanAlphanumeric(roleInput) : '';

  // 1. Check exact character:role key (e.g. "hutao:on_field_damage")
  if (roleStr && roleStr !== 'unspecified' && roleStr !== 'general_checks') {
    const combinedKey = `${normalizedChar}:${roleStr}`;
    if (defaultBenchmarks[combinedKey]) {
      return defaultBenchmarks[combinedKey];
    }

    // Also match ignoring underscores/dashes across all defined benchmarks
    for (const [key, profile] of Object.entries(defaultBenchmarks)) {
      const [bChar, bRole] = key.split(':');
      if (bChar && bRole) {
        if (
          cleanAlphanumeric(bChar) === normalizedChar &&
          cleanAlphanumeric(bRole) === roleAlphanumeric
        ) {
          return profile;
        }
      }
    }
  }

  // 2. If no explicit role was selected, check if character has a reviewed default benchmark profile
  if (!roleStr || roleStr === 'unspecified' || roleStr === 'general_checks') {
    for (const [key, profile] of Object.entries(defaultBenchmarks)) {
      if (key.startsWith(`${normalizedChar}:`)) {
        return profile;
      }
    }
    // No role selected and no reviewed benchmark exists for this character:
    // DO NOT silently fall back to generic_support! Return null so caller reports insufficient_data.
    return null;
  }

  // 3. Fallback generic roles
  if (
    roleStr.includes('dps') ||
    roleStr.includes('on_field') ||
    roleAlphanumeric.includes('onfield')
  ) {
    return defaultBenchmarks.generic_dps;
  }
  if (
    roleStr.includes('sub_dps') ||
    roleStr.includes('off_field') ||
    roleAlphanumeric.includes('offfield') ||
    roleAlphanumeric.includes('subdps')
  ) {
    return defaultBenchmarks.generic_sub_dps;
  }
  if (
    roleStr.includes('support') ||
    roleStr.includes('buff') ||
    roleStr.includes('healer') ||
    roleStr.includes('shield') ||
    roleStr.includes('shred') ||
    roleStr.includes('trigger') ||
    roleStr.includes('reaction')
  ) {
    return defaultBenchmarks.generic_support;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Dimension Evaluators (Pure Functions)
// ---------------------------------------------------------------------------

function evaluateTalents(
  build: ReadinessCharacterBuild,
  benchmark: RoleBenchmarkProfile,
): CalculatorDimensionEvaluation {
  const priority = benchmark.priorityTalents;
  const missingReasons: string[] = [];

  if (priority.length === 0) {
    return {
      dimension: 'talents',
      status: 'ready_for_target',
      score: 100,
      isReady: true,
      details: { priorityTalents: [], levels: build.talents },
      missingReasons: [],
    };
  }

  // Check whether priority talent levels are recorded
  for (const t of priority) {
    const val = build.talents[t];
    if (val === null || val === undefined) {
      missingReasons.push(`unrecorded_priority_talent_${t}`);
    }
  }

  if (missingReasons.length > 0) {
    return {
      dimension: 'talents',
      status: 'insufficient_data',
      score: 0,
      isReady: false,
      details: { priorityTalents: priority, levels: build.talents },
      missingReasons,
    };
  }

  let totalRatio = 0;
  let allTargetMet = true;
  let allConditionalMet = true;

  for (const t of priority) {
    const val = build.talents[t] as number;
    const target = benchmark.minTalentLevels[t] ?? 8;
    const conditionalMin = Math.max(1, target - 2);

    totalRatio += Math.min(1.0, val / target);
    if (val < target) allTargetMet = false;
    if (val < conditionalMin) allConditionalMet = false;
  }

  const score = Math.round((totalRatio / priority.length) * 100);

  if (allTargetMet) {
    return {
      dimension: 'talents',
      status: 'ready_for_target',
      score: 100,
      isReady: true,
      details: { priorityTalents: priority, levels: build.talents },
      missingReasons: [],
    };
  }

  if (allConditionalMet) {
    return {
      dimension: 'talents',
      status: 'conditional',
      score: Math.max(65, score),
      isReady: false,
      details: { priorityTalents: priority, levels: build.talents },
      missingReasons: [],
    };
  }

  return {
    dimension: 'talents',
    status: 'needs_investment',
    score: Math.min(60, score),
    isReady: false,
    details: { priorityTalents: priority, levels: build.talents },
    missingReasons: [],
  };
}

function evaluateWeapon(
  build: ReadinessCharacterBuild,
  benchmark: RoleBenchmarkProfile,
  encounter: ReadinessTargetEncounter,
): CalculatorDimensionEvaluation {
  if (!build.weapon) {
    return {
      dimension: 'weapon',
      status: 'insufficient_data',
      score: 0,
      isReady: false,
      details: {},
      missingReasons: ['unrecorded_weapon'],
    };
  }

  const weapon = build.weapon;
  if (weapon.level === null || weapon.level === undefined) {
    return {
      dimension: 'weapon',
      status: 'insufficient_data',
      score: 0,
      isReady: false,
      details: { weaponKey: weapon.weaponKey },
      missingReasons: ['unrecorded_weapon_level'],
    };
  }

  const targetLevel = Math.max(benchmark.minWeaponLevel, encounter.minWeaponLevel || 80);
  const cleanW = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const weaponKeyClean = cleanW(weapon.weaponKey);
  const isRecommended =
    benchmark.recommendedWeapons.length === 0 ||
    benchmark.recommendedWeapons.some((w) => {
      const recClean = cleanW(w);
      return (
        recClean === weaponKeyClean ||
        weaponKeyClean.includes(recClean) ||
        recClean.includes(weaponKeyClean)
      );
    });

  const levelRatio = Math.min(1.0, weapon.level / targetLevel);
  const baseScore = Math.round(levelRatio * 100);

  if (weapon.level < targetLevel - 10) {
    return {
      dimension: 'weapon',
      status: 'needs_investment',
      score: Math.min(50, baseScore),
      isReady: false,
      details: { weaponKey: weapon.weaponKey, level: weapon.level, targetLevel, isRecommended },
      missingReasons: [],
    };
  }

  if (weapon.level < targetLevel) {
    return {
      dimension: 'weapon',
      status: 'needs_investment',
      score: Math.min(70, baseScore),
      isReady: false,
      details: { weaponKey: weapon.weaponKey, level: weapon.level, targetLevel, isRecommended },
      missingReasons: [],
    };
  }

  if (!isRecommended) {
    return {
      dimension: 'weapon',
      status: 'conditional',
      score: 75,
      isReady: false,
      details: { weaponKey: weapon.weaponKey, level: weapon.level, targetLevel, isRecommended },
      missingReasons: [],
    };
  }

  return {
    dimension: 'weapon',
    status: 'ready_for_target',
    score: 100,
    isReady: true,
    details: { weaponKey: weapon.weaponKey, level: weapon.level, targetLevel, isRecommended },
    missingReasons: [],
  };
}

function evaluateMainStats(
  build: ReadinessCharacterBuild,
  benchmark: RoleBenchmarkProfile,
): CalculatorDimensionEvaluation {
  const keySlots: Array<'sands' | 'goblet' | 'circlet'> = ['sands', 'goblet', 'circlet'];
  const missingReasons: string[] = [];

  const observedMainStats: Record<string, string | null> = {};
  for (const slot of keySlots) {
    const art = build.artifacts[slot];
    if (!art || !art.mainStatKey) {
      missingReasons.push(`missing_main_stat_${slot}`);
      observedMainStats[slot] = null;
    } else {
      observedMainStats[slot] = normalizeStatKey(art.mainStatKey);
    }
  }

  if (missingReasons.length > 0) {
    return {
      dimension: 'main_stats',
      status: 'insufficient_data',
      score: 0,
      isReady: false,
      details: { observedMainStats },
      missingReasons,
    };
  }

  let matches = 0;
  let conditionalMatches = 0;

  for (const slot of keySlots) {
    const observed = observedMainStats[slot]!;
    const recommendedList = (benchmark.recommendedMainStats[slot] ?? []).map(normalizeStatKey);
    const conditionalMap = benchmark.conditionalMainStats?.[slot] ?? {};

    if (recommendedList.length === 0 || recommendedList.includes(observed)) {
      matches += 1;
    } else if (Object.keys(conditionalMap).map(normalizeStatKey).includes(observed)) {
      conditionalMatches += 1;
    }
  }

  if (matches === 3) {
    return {
      dimension: 'main_stats',
      status: 'ready_for_target',
      score: 100,
      isReady: true,
      details: { observedMainStats, matches, conditionalMatches },
      missingReasons: [],
    };
  }

  if (matches + conditionalMatches === 3) {
    return {
      dimension: 'main_stats',
      status: 'conditional',
      score: 80,
      isReady: false,
      details: { observedMainStats, matches, conditionalMatches },
      missingReasons: [],
    };
  }

  const score = Math.round(((matches * 25 + conditionalMatches * 15) / 75) * 100);
  return {
    dimension: 'main_stats',
    status: 'needs_investment',
    score: Math.min(60, score),
    isReady: false,
    details: { observedMainStats, matches, conditionalMatches },
    missingReasons: [],
  };
}

function evaluateSetActivation(
  build: ReadinessCharacterBuild,
  benchmark: RoleBenchmarkProfile,
): CalculatorDimensionEvaluation {
  const slots: Array<'flower' | 'plume' | 'sands' | 'goblet' | 'circlet'> = [
    'flower',
    'plume',
    'sands',
    'goblet',
    'circlet',
  ];

  let recordedCount = 0;
  const setCounts: Record<string, number> = {};

  for (const slot of slots) {
    const art = build.artifacts[slot];
    if (art && art.setKey) {
      recordedCount += 1;
      const k = art.setKey.trim();
      setCounts[k] = (setCounts[k] || 0) + 1;
    }
  }

  if (recordedCount < 4) {
    return {
      dimension: 'set_activation',
      status: 'insufficient_data',
      score: 0,
      isReady: false,
      details: { recordedArtifactCount: recordedCount, setCounts },
      missingReasons: ['incomplete_artifact_inventory'],
    };
  }

  if (benchmark.recommendedSets.length === 0) {
    return {
      dimension: 'set_activation',
      status: 'ready_for_target',
      score: 100,
      isReady: true,
      details: { setCounts },
      missingReasons: [],
    };
  }

  let has4pcMatch = false;
  let has2pcMatch = false;

  const cleanW = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const rec of benchmark.recommendedSets) {
    const normalizedRecSet = cleanW(rec.setKey);
    for (const [observedSet, count] of Object.entries(setCounts)) {
      if (cleanW(observedSet) === normalizedRecSet) {
        if (rec.pieces === 4 && count >= 4) {
          has4pcMatch = true;
        } else if (count >= 2) {
          has2pcMatch = true;
        }
      }
    }
  }

  if (has4pcMatch) {
    return {
      dimension: 'set_activation',
      status: 'ready_for_target',
      score: 100,
      isReady: true,
      details: { setCounts, has4pcMatch, has2pcMatch },
      missingReasons: [],
    };
  }

  if (has2pcMatch) {
    return {
      dimension: 'set_activation',
      status: 'conditional',
      score: 70,
      isReady: false,
      details: { setCounts, has4pcMatch, has2pcMatch },
      missingReasons: [],
    };
  }

  return {
    dimension: 'set_activation',
    status: 'needs_investment',
    score: 30,
    isReady: false,
    details: { setCounts, has4pcMatch, has2pcMatch },
    missingReasons: [],
  };
}

interface RotationEnergyEvalResult {
  evaluation: CalculatorDimensionEvaluation;
  deficitPp: number;
  observedEr: number | null;
  effectiveThreshold: number;
}

function evaluateRotationEnergy(
  build: ReadinessCharacterBuild,
  benchmark: RoleBenchmarkProfile,
  teamEnergy: ReadinessTeamEnergyContext,
): RotationEnergyEvalResult {
  // Check if ER is recorded
  let observedEr: number | null = null;
  for (const [key, val] of Object.entries(build.stats)) {
    const norm = normalizeStatKey(key);
    if (norm === 'energyRecharge') {
      observedEr = val;
      break;
    }
  }

  // Handle ratio vs percentage points: e.g. 1.8 -> 180
  if (observedEr !== null && observedEr > 0 && observedEr < 5) {
    observedEr = Math.round(observedEr * 100);
  }

  // Calculate base threshold
  const baseThreshold =
    teamEnergy.estimatedErRequirement ?? benchmark.energyRechargeThreshold ?? 100;

  // Calculate adjustment from party battery, Favonius weapons, party size, particles, and rotation length
  let effectiveThreshold = baseThreshold;
  if (teamEnergy.sameElementCount > 1) {
    effectiveThreshold -= (teamEnergy.sameElementCount - 1) * 15;
  }
  if (teamEnergy.favoniusWeaponCount > 0) {
    effectiveThreshold -= teamEnergy.favoniusWeaponCount * 10;
  }
  if (teamEnergy.partyMembers && teamEnergy.partyMembers.length === 1) {
    effectiveThreshold += 20;
  }
  if (teamEnergy.particlesPerRotation > 0) {
    if (teamEnergy.particlesPerRotation >= 20) {
      effectiveThreshold -= 15;
    } else if (teamEnergy.particlesPerRotation >= 15) {
      effectiveThreshold -= 10;
    } else if (teamEnergy.particlesPerRotation <= 6) {
      effectiveThreshold += 15;
    } else if (teamEnergy.particlesPerRotation <= 10) {
      effectiveThreshold += 10;
    }
  }
  if (teamEnergy.rotationLengthSeconds > 0) {
    if (teamEnergy.rotationLengthSeconds < 18) {
      effectiveThreshold += 10;
    } else if (teamEnergy.rotationLengthSeconds >= 25) {
      effectiveThreshold -= 10;
    }
  }
  effectiveThreshold = Math.max(100, Math.min(350, effectiveThreshold));

  if (observedEr === null || observedEr <= 0) {
    return {
      evaluation: {
        dimension: 'rotation_energy',
        status: 'insufficient_data',
        score: 0,
        isReady: false,
        details: { effectiveThreshold, baseThreshold },
        missingReasons: ['unrecorded_energy_recharge_stat'],
      },
      deficitPp: 0,
      observedEr: null,
      effectiveThreshold,
    };
  }

  const deficitPp = Math.max(0, effectiveThreshold - observedEr);

  if (deficitPp === 0) {
    return {
      evaluation: {
        dimension: 'rotation_energy',
        status: 'ready_for_target',
        score: 100,
        isReady: true,
        details: { observedEr, effectiveThreshold, baseThreshold, deficitPp: 0 },
        missingReasons: [],
      },
      deficitPp: 0,
      observedEr,
      effectiveThreshold,
    };
  }

  if (deficitPp <= 10) {
    return {
      evaluation: {
        dimension: 'rotation_energy',
        status: 'conditional',
        score: 75,
        isReady: false,
        details: { observedEr, effectiveThreshold, baseThreshold, deficitPp },
        missingReasons: [],
      },
      deficitPp,
      observedEr,
      effectiveThreshold,
    };
  }

  const ratio = Math.max(0.1, observedEr / effectiveThreshold);
  return {
    evaluation: {
      dimension: 'rotation_energy',
      status: 'needs_investment',
      score: Math.min(50, Math.round(ratio * 100)),
      isReady: false,
      details: { observedEr, effectiveThreshold, baseThreshold, deficitPp },
      missingReasons: [],
    },
    deficitPp,
    observedEr,
    effectiveThreshold,
  };
}

interface SupportOutputEvalResult {
  evaluation: CalculatorDimensionEvaluation;
  observedScalingStat: number | null;
}

function evaluateSupportOutput(
  build: ReadinessCharacterBuild,
  benchmark: RoleBenchmarkProfile,
): SupportOutputEvalResult {
  if (!benchmark.minSupportStatThreshold || benchmark.minSupportStatThreshold <= 0) {
    return {
      evaluation: {
        dimension: 'support_output',
        status: 'ready_for_target',
        score: 100,
        isReady: true,
        details: { notApplicable: true },
        missingReasons: [],
      },
      observedScalingStat: null,
    };
  }

  const scaling = benchmark.scalingStat;
  let observed: number | null = null;

  for (const [k, v] of Object.entries(build.stats)) {
    const norm = normalizeStatKey(k);
    if (scaling === 'hp' && (norm === 'maxHp' || norm === 'hpPercent')) {
      observed = v;
      break;
    }
    if (scaling === 'em' && norm === 'elementalMastery') {
      observed = v;
      break;
    }
    if (scaling === 'def' && (norm === 'def' || norm === 'defPercent')) {
      observed = v;
      break;
    }
    if (scaling === 'er' && norm === 'energyRecharge') {
      observed = v;
      break;
    }
    if (scaling === 'atk' && (norm === 'atk' || norm === 'atkPercent')) {
      observed = v;
      break;
    }
  }

  if (observed === null) {
    return {
      evaluation: {
        dimension: 'support_output',
        status: 'insufficient_data',
        score: 0,
        isReady: false,
        details: { scalingStat: scaling, threshold: benchmark.minSupportStatThreshold },
        missingReasons: [`unrecorded_scaling_stat_${scaling}`],
      },
      observedScalingStat: null,
    };
  }

  const threshold = benchmark.minSupportStatThreshold;
  if (observed >= threshold) {
    return {
      evaluation: {
        dimension: 'support_output',
        status: 'ready_for_target',
        score: 100,
        isReady: true,
        details: { scalingStat: scaling, observed, threshold },
        missingReasons: [],
      },
      observedScalingStat: observed,
    };
  }

  if (observed >= threshold * 0.85) {
    return {
      evaluation: {
        dimension: 'support_output',
        status: 'conditional',
        score: 75,
        isReady: false,
        details: { scalingStat: scaling, observed, threshold },
        missingReasons: [],
      },
      observedScalingStat: observed,
    };
  }

  const ratio = Math.max(0.1, observed / threshold);
  return {
    evaluation: {
      dimension: 'support_output',
      status: 'needs_investment',
      score: Math.min(60, Math.round(ratio * 100)),
      isReady: false,
      details: { scalingStat: scaling, observed, threshold },
      missingReasons: [],
    },
    observedScalingStat: observed,
  };
}

// ---------------------------------------------------------------------------
// Pure Calculator: Master Evaluation Function
// ---------------------------------------------------------------------------

export function calculateReadiness(
  input: CharacterReadinessRequestInput,
): ReadinessCalculatorResult {
  const request: CharacterReadinessRequest = characterReadinessRequestSchema.parse(input);
  const benchmark = resolveRoleBenchmark(request.character.characterKey, request.roleProfile);
  const encounter: ReadinessTargetEncounter = request.targetEncounter ?? {
    encounterId: 'training_dummy',
    name: 'Benchmark Target',
    difficulty: 'dummy_benchmark',
    minCharacterLevel: 80,
    minWeaponLevel: 80,
  };
  const teamEnergy: ReadinessTeamEnergyContext = request.teamEnergyContext ?? {
    partyMembers: [],
    particlesPerRotation: 0,
    favoniusWeaponCount: 0,
    sameElementCount: 1,
    rotationLengthSeconds: 20,
  };

  if (!benchmark) {
    const dimensions: Record<ReadinessDimension, CalculatorDimensionEvaluation> = {
      talents: {
        dimension: 'talents',
        status: 'insufficient_data',
        score: 0,
        isReady: false,
        details: {},
        missingReasons: ['unspecified_role_profile'],
      },
      weapon: {
        dimension: 'weapon',
        status: 'insufficient_data',
        score: 0,
        isReady: false,
        details: {},
        missingReasons: ['unspecified_role_profile'],
      },
      main_stats: {
        dimension: 'main_stats',
        status: 'insufficient_data',
        score: 0,
        isReady: false,
        details: {},
        missingReasons: ['unspecified_role_profile'],
      },
      set_activation: {
        dimension: 'set_activation',
        status: 'insufficient_data',
        score: 0,
        isReady: false,
        details: {},
        missingReasons: ['unspecified_role_profile'],
      },
      rotation_energy: {
        dimension: 'rotation_energy',
        status: 'insufficient_data',
        score: 0,
        isReady: false,
        details: {},
        missingReasons: ['unspecified_role_profile'],
      },
      support_output: {
        dimension: 'support_output',
        status: 'insufficient_data',
        score: 0,
        isReady: false,
        details: {},
        missingReasons: ['unspecified_role_profile'],
      },
    };

    return {
      status: 'insufficient_data',
      score: 0,
      dimensions,
      missingData: [
        {
          dimension: 'talents',
          status: 'missing',
          reason: 'unspecified_role_profile',
        },
      ],
      metadata: {
        characterKey: request.character.characterKey,
        roleId: 'unspecified',
        roleName: 'Unspecified Role',
        encounterId: encounter.encounterId,
        encounterName: encounter.name,
        hasEnergyDeficit: false,
        energyDeficitPp: 0,
        observedEr: null,
        effectiveErThreshold: 100,
        priorityTalents: [],
        observedTalents: request.character.talents ?? {},
        weaponKey: request.character.weapon?.weaponKey ?? null,
        weaponLevel: request.character.weapon?.level ?? null,
        scalingStat: 'atk',
        observedScalingStat: null,
        supportThreshold: null,
      },
    };
  }

  const talentsEval = evaluateTalents(request.character, benchmark);
  const weaponEval = evaluateWeapon(request.character, benchmark, encounter);
  const mainStatsEval = evaluateMainStats(request.character, benchmark);
  const setActivationEval = evaluateSetActivation(request.character, benchmark);
  const energyResult = evaluateRotationEnergy(request.character, benchmark, teamEnergy);
  const supportResult = evaluateSupportOutput(request.character, benchmark);

  const dimensions: Record<ReadinessDimension, CalculatorDimensionEvaluation> = {
    talents: talentsEval,
    weapon: weaponEval,
    main_stats: mainStatsEval,
    set_activation: setActivationEval,
    rotation_energy: energyResult.evaluation,
    support_output: supportResult.evaluation,
  };

  // Missing data collection
  const missingData: ReadinessMissingData[] = [];
  for (const [dimKey, evalResult] of Object.entries(dimensions) as Array<
    [ReadinessDimension, CalculatorDimensionEvaluation]
  >) {
    if (evalResult.status === 'insufficient_data') {
      for (const reason of evalResult.missingReasons) {
        missingData.push({
          dimension: dimKey,
          status: 'missing',
          reason,
        });
      }
    }
  }

  if (request.character.level === null || request.character.level === undefined) {
    missingData.push({
      dimension: 'talents',
      status: 'missing',
      reason: 'unrecorded_character_level',
    });
  }
  if (request.character.ascension === null || request.character.ascension === undefined) {
    missingData.push({
      dimension: 'talents',
      status: 'missing',
      reason: 'unrecorded_character_ascension',
    });
  }

  // Weight distribution
  const weights: Record<ReadinessDimension, number> = {
    rotation_energy: 0.3,
    talents: 0.2,
    weapon: 0.15,
    main_stats: 0.15,
    set_activation: 0.1,
    support_output: 0.1,
  };

  let compositeScore = 0;
  for (const [dimKey, evalResult] of Object.entries(dimensions) as Array<
    [ReadinessDimension, CalculatorDimensionEvaluation]
  >) {
    compositeScore += evalResult.score * weights[dimKey];
  }
  compositeScore = Math.round(compositeScore);

  // Invariant 1: Energy Recharge Deficit Defeats Offensive Stats
  const hasEnergyDeficit = energyResult.deficitPp > 0;
  if (energyResult.evaluation.status === 'needs_investment') {
    // Heavy penalty for rotation energy failure: clamp to max 58
    compositeScore = Math.min(58, Math.min(compositeScore, energyResult.evaluation.score + 25));
  } else if (energyResult.evaluation.status === 'conditional') {
    compositeScore = Math.min(75, compositeScore);
  }

  // Encounter minCharacterLevel check
  const minCharLevel = encounter.minCharacterLevel ?? 80;
  const hasLevelDeficit =
    request.character.level !== null &&
    request.character.level !== undefined &&
    request.character.level < minCharLevel;

  if (hasLevelDeficit) {
    if (request.character.level! < minCharLevel - 10) {
      compositeScore = Math.min(50, compositeScore);
    } else {
      compositeScore = Math.min(75, compositeScore);
    }
  }

  // Status Determination
  let overallStatus: ReadinessStatus;

  // Incomplete set or unrecorded support scaling prevents ready_for_target
  const isSetRequired = benchmark.recommendedSets.length > 0;
  const isSupportRequired = Boolean(
    benchmark.minSupportStatThreshold && benchmark.minSupportStatThreshold > 0,
  );

  const coreDimensions: ReadinessDimension[] = [
    'talents',
    'weapon',
    'main_stats',
    'rotation_energy',
    ...(isSetRequired ? (['set_activation'] as const) : []),
    ...(isSupportRequired ? (['support_output'] as const) : []),
  ];
  const hasCoreMissingData = coreDimensions.some(
    (dim) => dimensions[dim].status === 'insufficient_data',
  );

  const hasUnrecordedProgression =
    request.character.level === null ||
    request.character.level === undefined ||
    request.character.ascension === null ||
    request.character.ascension === undefined;

  const hasNeedsInvestment = Object.values(dimensions).some((d) => d.status === 'needs_investment');
  const hasConditional = Object.values(dimensions).some((d) => d.status === 'conditional');

  // INVARIANT ENFORCEMENT
  if (hasCoreMissingData || hasUnrecordedProgression) {
    // Core missing data MUST return insufficient_data rather than a false positive
    overallStatus = 'insufficient_data';
  } else if (energyResult.evaluation.status === 'needs_investment') {
    // Energy deficit ALWAYS marks build needs_investment regardless of other stats
    overallStatus = 'needs_investment';
  } else if (
    hasNeedsInvestment ||
    (hasLevelDeficit && request.character.level! < minCharLevel - 10)
  ) {
    overallStatus = 'needs_investment';
  } else if (
    energyResult.evaluation.status === 'conditional' ||
    hasConditional ||
    hasLevelDeficit
  ) {
    overallStatus = 'conditional';
  } else {
    overallStatus = 'ready_for_target';
  }

  return {
    status: overallStatus,
    score: compositeScore,
    dimensions,
    missingData,
    metadata: {
      characterKey: request.character.characterKey,
      roleId: benchmark.roleId,
      roleName: benchmark.roleName || benchmark.roleId,
      encounterId: encounter.encounterId,
      encounterName: encounter.name,
      hasEnergyDeficit,
      energyDeficitPp: energyResult.deficitPp,
      observedEr: energyResult.observedEr,
      effectiveErThreshold: energyResult.effectiveThreshold,
      priorityTalents: benchmark.priorityTalents,
      observedTalents: request.character.talents,
      weaponKey: request.character.weapon?.weaponKey ?? null,
      weaponLevel: request.character.weapon?.level ?? null,
      scalingStat: benchmark.scalingStat,
      observedScalingStat: supportResult.observedScalingStat,
      supportThreshold: benchmark.minSupportStatThreshold ?? null,
    },
  };
}
