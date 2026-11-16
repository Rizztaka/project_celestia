import type {
  EnhancedPullAdvice,
  OwnedCharacterProfile,
  OwnedWeapon,
  PullAdvice,
  PullBudgetState,
} from '../types/genshin';
import { CHARACTERS } from '../data/characters';
import { BANNER_PHASES } from '../data/banners';
import { getWeaponByKey } from '../data/weapons';
import {
  calculateCharacterBannerOdds,
  calculateWeaponBannerOdds,
  calculateTotalPulls,
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
      {
        key: 'FluteOfEzpitzal',
        minRefinement: 4,
        penaltyPct: 7,
        penaltyReason: 'Flute of Ezpitzal provides high DEF% bonus crafted specifically for Natlan Geo users.',
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
      {
        key: 'SerpentSpine',
        minRefinement: 4,
        penaltyPct: 9,
        penaltyReason: 'Serpent Spine (R4-R5) grants massive universal all-damage bonus stacks.',
      },
      {
        key: 'EarthShaker',
        minRefinement: 4,
        penaltyPct: 7,
        penaltyReason: 'Earth Shaker R5 provides high Skill DMG upon triggering Pyro reactions.',
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
    substitutes: [
      {
        key: 'FavoniusCodex',
        minRefinement: 1,
        penaltyPct: 8,
        penaltyReason: 'Favonius Codex guarantees smooth burst uptime for teamwide Cryo application.',
      },
      {
        key: 'SacrificialFragments',
        minRefinement: 3,
        penaltyPct: 7,
        penaltyReason: 'Sacrificial Fragments provides massive EM to buff Melt/Superconduct reactions.',
      },
    ],
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
      {
        key: 'LostPrayerToTheSacredWinds',
        minRefinement: 1,
        penaltyPct: 10,
        penaltyReason: 'Lost Prayer to the Sacred Winds provides high base CRIT Rate.',
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
      {
        key: 'IronSting',
        minRefinement: 4,
        penaltyPct: 6,
        penaltyReason: 'Iron Sting R5 provides free EM for elemental damage bonus scaling.',
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
        key: 'ElegyForTheEnd',
        minRefinement: 1,
        penaltyPct: 10,
        penaltyReason: 'Elegy for the End provides top-tier teamwide EM and ATK buffing alongside high ER.',
      },
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
      {
        key: 'StaffOfHoma',
        minRefinement: 1,
        penaltyPct: 9,
        penaltyReason: 'Staff of Homa provides immense 66.2% CRIT DMG and bonus ATK based on HP.',
      },
    ],
  },
  Chasca: {
    weaponKey: 'AstralVultureSCrimsonPlumage',
    name: "Astral Vulture's Crimson Plumage",
    baseUpliftPct: 20,
    substitutes: [
      {
        key: 'TheFirstGreatMagic',
        minRefinement: 1,
        penaltyPct: 10,
        penaltyReason: 'The First Great Magic provides 66.2% CRIT DMG and charged attack buffs.',
      },
      {
        key: 'AquaSimulacra',
        minRefinement: 1,
        penaltyPct: 10,
        penaltyReason: 'Aqua Simulacra provides 88.2% CRIT DMG and universal damage bonus.',
      },
    ],
  },
  Clorinde: {
    weaponKey: 'Absolution',
    name: 'Absolution',
    baseUpliftPct: 20,
    substitutes: [
      {
        key: 'MistsplitterReforged',
        minRefinement: 1,
        penaltyPct: 11,
        penaltyReason: 'Mistsplitter Reforged provides 44.1% CRIT DMG and massive elemental DMG bonus.',
      },
      {
        key: 'HaranGeppakuFutsu',
        minRefinement: 1,
        penaltyPct: 10,
        penaltyReason: 'Haran Geppaku Futsu provides 33.1% CRIT Rate and +40% normal attack DMG.',
      },
      {
        key: 'TheBlackSword',
        minRefinement: 4,
        penaltyPct: 8,
        penaltyReason: 'The Black Sword R4-R5 provides high CRIT Rate and normal attack damage.',
      },
    ],
  },
  HuTao: {
    weaponKey: 'StaffOfHoma',
    name: 'Staff of Homa',
    baseUpliftPct: 24,
    substitutes: [
      {
        key: 'DragonsBane',
        minRefinement: 4,
        penaltyPct: 12,
        penaltyReason: "Dragon's Bane (R4-R5) provides 221 EM and up to +36% DMG against Pyro/Hydro affected targets.",
      },
      {
        key: 'CrimsonMoonSSemblance',
        minRefinement: 1,
        penaltyPct: 10,
        penaltyReason: "Crimson Moon's Semblance provides high CRIT Rate and strong base attack.",
      },
      {
        key: 'Deathmatch',
        minRefinement: 4,
        penaltyPct: 9,
        penaltyReason: 'Deathmatch provides up to 36.8% CRIT Rate and consistent ATK boost.',
      },
    ],
  },
  Chiori: {
    weaponKey: 'UrakuMisugiri',
    name: 'Uraku Misugiri',
    baseUpliftPct: 22,
    substitutes: [
      {
        key: 'CinnabarSpindle',
        minRefinement: 1,
        penaltyPct: 12,
        penaltyReason: 'Cinnabar Spindle R5 provides massive DEF-scaled Elemental Skill damage.',
      },
      {
        key: 'PrimordialJadeCutter',
        minRefinement: 1,
        penaltyPct: 10,
        penaltyReason: 'Primordial Jade Cutter provides 44.1% CRIT Rate and bonus ATK.',
      },
      {
        key: 'HarbingerOfDawn',
        minRefinement: 5,
        penaltyPct: 8,
        penaltyReason: 'Harbinger of Dawn R5 gives 28% CRIT Rate and 46.9% CRIT DMG for off-field Chiori.',
      },
    ],
  },
  Lyney: {
    weaponKey: 'TheFirstGreatMagic',
    name: 'The First Great Magic',
    baseUpliftPct: 22,
    substitutes: [
      {
        key: 'AquaSimulacra',
        minRefinement: 1,
        penaltyPct: 10,
        penaltyReason: 'Aqua Simulacra provides 88.2% CRIT DMG and unconditional 20% all-DMG bonus.',
      },
      {
        key: 'SongOfStillness',
        minRefinement: 4,
        penaltyPct: 7,
        penaltyReason: 'Song of Stillness R5 craftable bow provides up to +32% DMG after receiving healing.',
      },
    ],
  },
  Navia: {
    weaponKey: 'Verdict',
    name: 'Verdict',
    baseUpliftPct: 22,
    substitutes: [
      {
        key: 'SerpentSpine',
        minRefinement: 4,
        penaltyPct: 12,
        penaltyReason: 'Serpent Spine (R4-R5) gives 27.6% CRIT Rate and up to +50% all-DMG bonus.',
      },
      {
        key: 'WolfSGravestone',
        minRefinement: 1,
        penaltyPct: 8,
        penaltyReason: "Wolf's Gravestone provides massive ATK% scaling and party buff.",
      },
    ],
  },
  Alhaitham: {
    weaponKey: 'LightOfFoliarIncision',
    name: 'Light of Foliar Incision',
    baseUpliftPct: 22,
    substitutes: [
      {
        key: 'PrimordialJadeCutter',
        minRefinement: 1,
        penaltyPct: 11,
        penaltyReason: 'Primordial Jade Cutter provides 44.1% CRIT Rate and universal high ATK.',
      },
      {
        key: 'MistsplitterReforged',
        minRefinement: 1,
        penaltyPct: 10,
        penaltyReason: 'Mistsplitter Reforged grants high elemental DMG bonus.',
      },
      {
        key: 'HarbingerOfDawn',
        minRefinement: 5,
        penaltyPct: 8,
        penaltyReason: 'Harbinger of Dawn R5 provides high CRIT Rate/DMG when protected by shields.',
      },
    ],
  },
  Kinich: {
    weaponKey: 'FangOfTheMountainKing',
    name: 'Fang of the MountainKing',
    baseUpliftPct: 22,
    substitutes: [
      {
        key: 'BeaconOfTheReedSea',
        minRefinement: 1,
        penaltyPct: 10,
        penaltyReason: 'Beacon of the Reed Sea provides 33.1% CRIT Rate and ATK stacking.',
      },
      {
        key: 'SerpentSpine',
        minRefinement: 4,
        penaltyPct: 10,
        penaltyReason: 'Serpent Spine provides 27.6% CRIT Rate and all-damage bonus stacks.',
      },
      {
        key: 'EarthShaker',
        minRefinement: 4,
        penaltyPct: 8,
        penaltyReason: 'Earth Shaker R5 provides up to +32% Skill DMG upon triggering Pyro reactions.',
      },
    ],
  },
  Xianyun: {
    weaponKey: 'CraneSEchoingCall',
    name: "Crane's Echoing Call",
    baseUpliftPct: 18,
    substitutes: [
      {
        key: 'OathswornEye',
        minRefinement: 4,
        penaltyPct: 9,
        penaltyReason: 'Oathsworn Eye R5 provides high ATK% and +48% Energy Recharge on skill cast.',
      },
      {
        key: 'FavoniusCodex',
        minRefinement: 1,
        penaltyPct: 8,
        penaltyReason: 'Favonius Codex generates neutral energy particles for the entire plunge team.',
      },
    ],
  },
  Mitya: {
    weaponKey: 'StarsealedEdict',
    name: 'Starsealed Edict',
    baseUpliftPct: 24,
    substitutes: [
      {
        key: 'AThousandFloatingDreams',
        minRefinement: 1,
        penaltyPct: 11,
        penaltyReason: 'A Thousand Floating Dreams provides massive 265 EM to cap reaction scaling.',
      },
      {
        key: 'KagurasVerity',
        minRefinement: 1,
        penaltyPct: 10,
        penaltyReason: "Kagura's Verity provides 66.2% CRIT DMG and skill-damage stacking.",
      },
      {
        key: 'TheWidsith',
        minRefinement: 4,
        penaltyPct: 8,
        penaltyReason: 'The Widsith R4-R5 provides high burst damage and massive random buffs.',
      },
      {
        key: 'LostPrayerToTheSacredWinds',
        minRefinement: 1,
        penaltyPct: 8,
        penaltyReason: 'Lost Prayer to the Sacred Winds provides high base CRIT Rate and movement speed.',
      },
    ],
  },
  Zibai: {
    weaponKey: 'LightOfFoliarIncision',
    name: 'Light of Foliar Incision',
    baseUpliftPct: 22,
    substitutes: [
      {
        key: 'PrimordialJadeCutter',
        minRefinement: 1,
        penaltyPct: 10,
        penaltyReason: 'Primordial Jade Cutter provides 44.1% CRIT Rate and universal attack.',
      },
      {
        key: 'MistsplitterReforged',
        minRefinement: 1,
        penaltyPct: 10,
        penaltyReason: 'Mistsplitter Reforged provides 44.1% CRIT DMG and all-elemental damage bonus.',
      },
      {
        key: 'FavoniusSword',
        minRefinement: 1,
        penaltyPct: 8,
        penaltyReason: 'Favonius Sword ensures reliable burst rotations and team energy generation.',
      },
    ],
  },
  Linnea: {
    weaponKey: 'AquaSimulacra',
    name: 'Aqua Simulacra',
    baseUpliftPct: 22,
    substitutes: [
      {
        key: 'TheStringless',
        minRefinement: 4,
        penaltyPct: 9,
        penaltyReason: 'The Stringless R4-R5 provides high EM and +48% Skill/Burst DMG for reactions.',
      },
      {
        key: 'FavoniusWarbow',
        minRefinement: 1,
        penaltyPct: 8,
        penaltyReason: 'Favonius Warbow fixes energy requirements and batteries teammates.',
      },
    ],
  },
  Mualani: {
    weaponKey: 'SurfSUp',
    name: "Surf's Up",
    baseUpliftPct: 24,
    substitutes: [
      {
        key: 'SacrificialJade',
        minRefinement: 3,
        penaltyPct: 12,
        penaltyReason: 'Sacrificial Jade provides CRIT Rate and massive +48% Max HP when off-field.',
      },
      {
        key: 'LostPrayerToTheSacredWinds',
        minRefinement: 1,
        penaltyPct: 9,
        penaltyReason: 'Lost Prayer to the Sacred Winds provides high CRIT Rate and movement speed.',
      },
    ],
  },
  Varesa: {
    weaponKey: 'VividNotions',
    name: 'Vivid Notions',
    baseUpliftPct: 24,
    substitutes: [
      {
        key: 'TheWidsith',
        minRefinement: 4,
        penaltyPct: 9,
        penaltyReason: 'The Widsith provides 55.1% CRIT DMG and huge burst scaling.',
      },
      {
        key: 'LostPrayerToTheSacredWinds',
        minRefinement: 1,
        penaltyPct: 8,
        penaltyReason: 'Lost Prayer to the Sacred Winds provides high base CRIT Rate and movement speed.',
      },
      {
        key: 'SacrificialJade',
        minRefinement: 3,
        penaltyPct: 8,
        penaltyReason: 'Sacrificial Jade provides CRIT Rate and HP/EM bonuses.',
      },
    ],
  },
  Columbina: {
    weaponKey: 'AThousandFloatingDreams',
    name: 'A Thousand Floating Dreams',
    baseUpliftPct: 22,
    substitutes: [
      {
        key: 'SacrificialFragments',
        minRefinement: 3,
        penaltyPct: 9,
        penaltyReason: 'Sacrificial Fragments provides high EM and skill cooldown reset.',
      },
      {
        key: 'TheWidsith',
        minRefinement: 4,
        penaltyPct: 8,
        penaltyReason: 'The Widsith provides huge burst spikes with CRIT DMG substat.',
      },
    ],
  },
  Sandrone: {
    weaponKey: 'WolfSGravestone',
    name: "Wolf's Gravestone",
    baseUpliftPct: 22,
    substitutes: [
      {
        key: 'SerpentSpine',
        minRefinement: 4,
        penaltyPct: 10,
        penaltyReason: 'Serpent Spine (R4-R5) grants massive universal all-damage bonus stacks.',
      },
      {
        key: 'RedhornStonethresher',
        minRefinement: 1,
        penaltyPct: 9,
        penaltyReason: 'Redhorn Stonethresher provides 88.2% CRIT DMG and normal/charged attack boost.',
      },
    ],
  },
  Varka: {
    weaponKey: 'WolfSGravestone',
    name: "Wolf's Gravestone",
    baseUpliftPct: 24,
    substitutes: [
      {
        key: 'SerpentSpine',
        minRefinement: 4,
        penaltyPct: 10,
        penaltyReason: 'Serpent Spine R4-R5 provides +50% DMG and high CRIT Rate.',
      },
      {
        key: 'RedhornStonethresher',
        minRefinement: 1,
        penaltyPct: 9,
        penaltyReason: 'Redhorn Stonethresher gives 88.2% CRIT DMG.',
      },
    ],
  },
  Skirk: {
    weaponKey: 'Absolution',
    name: 'Absolution',
    baseUpliftPct: 24,
    substitutes: [
      {
        key: 'MistsplitterReforged',
        minRefinement: 1,
        penaltyPct: 11,
        penaltyReason: 'Mistsplitter Reforged provides 44.1% CRIT DMG and huge elemental damage bonus.',
      },
      {
        key: 'PrimordialJadeCutter',
        minRefinement: 1,
        penaltyPct: 10,
        penaltyReason: 'Primordial Jade Cutter provides 44.1% CRIT Rate and high attack.',
      },
    ],
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
  // Furina C1 & C2
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

  // Nahida C1 & C2
  {
    characterId: 'Nahida',
    name: 'Nahida',
    targetLevel: 1,
    targetLevelText: 'C1 Seed of Stored Knowledge',
    baseUpliftPct: 12,
    baseScore: 82,
    description: 'Party member elemental types count +1 for Pyro, Electro, and Hydro under Shrine of Maya.',
    benefits: [
      'Unlocks maximum Tri-Karma trigger interval and elemental bonus even without double-element teams.',
      'Direct stepping-stone to C2 DEF Shred and Crit reactions.',
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

  // Neuvillette C1 & C2
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
    characterId: 'Neuvillette',
    name: 'Neuvillette',
    targetLevel: 2,
    targetLevelText: 'C2 Draconic Crit Amplification',
    baseUpliftPct: 18,
    baseScore: 89,
    description: 'Past Draconic Glories grants +14% CRIT DMG per stack, up to +42% CRIT DMG on charged attacks.',
    benefits: [
      'Massive raw CRIT DMG scaling on Neuvillette continuous hydro beam.',
      'Elevates personal hypercarry DPS ceiling without additional setup.',
    ],
  },

  // Raiden Shogun C1 & C2
  {
    characterId: 'RaidenShogun',
    name: 'Raiden Shogun',
    targetLevel: 1,
    targetLevelText: 'C1 Ominous Inscription',
    baseUpliftPct: 10,
    baseScore: 81,
    description: 'Chakra Desiderata gathers Resolve 80% faster from Electro bursts and 20% faster from other elements.',
    benefits: [
      'Allows maximum Resolve stacks in fast rotations without requiring 80-cost bursts.',
      'Direct prerequisite stepping-stone to C2 DEF Ignore.',
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

  // Xilonen C1 & C2
  {
    characterId: 'Xilonen',
    name: 'Xilonen',
    targetLevel: 1,
    targetLevelText: "C1 Sabre-Tooth's Tenacity",
    baseUpliftPct: 10,
    baseScore: 82,
    description: 'Nightsoul point and Phlogiston consumption reduced by 30%, with complete stagger resistance during Nightsoul.',
    benefits: [
      'Enhanced overworld exploration mobility and rock-climbing longevity.',
      'Poise resistance prevents stagger during buff setup rotations.',
      'Direct path to C2 Element Specific Amplification.',
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

  // Arlecchino C1 & C2
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
    characterId: 'Arlecchino',
    name: 'Arlecchino',
    targetLevel: 2,
    targetLevelText: 'C2 All Desires, Ashen',
    baseUpliftPct: 20,
    baseScore: 88,
    description: 'Blood-Debt Direct upgrades immediately to Blood-Debt Due; absorbing it triggers 900% AoE Pyro DMG and +20% resistances.',
    benefits: [
      'Zero delay setup: immediately absorbs maximum Bond of Life on skill cast.',
      'Explosive 900% ATK AoE Pyro nuke on every rotation.',
    ],
  },

  // Mavuika C1 & C2
  {
    characterId: 'Mavuika',
    name: 'Mavuika',
    targetLevel: 1,
    targetLevelText: 'C1 Ancient Name Awakening',
    baseUpliftPct: 12,
    baseScore: 83,
    description: 'Fighting Spirit cap increased to 200, and immediately grants 40 Fighting Spirit upon burst cast.',
    benefits: [
      'Faster maximum burst scaling and higher uptime.',
      'Direct stepping-stone to C2 Nightsoul DEF shred.',
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

  // Nefer C1 & C2
  {
    characterId: 'Nefer',
    name: 'Nefer',
    targetLevel: 1,
    targetLevelText: 'C1 Veil of Deceit',
    baseUpliftPct: 12,
    baseScore: 81,
    description: 'Initial Phantasm stack threshold reduced and elevates reaction damage scaling.',
    benefits: [
      'Accelerates Lunar-Bloom reaction setup speed.',
      'Direct stepping-stone to C2 Veil Expansion.',
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

  // Kaedehara Kazuha C1 & C2
  {
    characterId: 'KaedeharaKazuha',
    name: 'Kaedehara Kazuha',
    targetLevel: 1,
    targetLevelText: 'C1 Senzan Hashi',
    baseUpliftPct: 12,
    baseScore: 84,
    description: 'Chihayaburu CD reduced by 10%, and using Kazuha Slash resets Chihayaburu CD.',
    benefits: [
      'Double swirl skill cast per rotation generates massive energy particles.',
      'Double grouping pulls and smooth rotation reset.',
      'Direct stepping-stone to C2 EM field.',
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

  // Hu Tao C1
  {
    characterId: 'HuTao',
    name: 'Hu Tao',
    targetLevel: 1,
    targetLevelText: 'C1 Crimson Bouquet',
    baseUpliftPct: 22,
    baseScore: 92,
    description: 'Paramita Papilio Charge Attacks do not consume stamina.',
    benefits: [
      'Completely eliminates stamina management during burst window.',
      'Enables dash cancels instead of jump cancels, boosting combo count and DPS by ~22%.',
    ],
  },

  // Zhongli C1 & C2
  {
    characterId: 'Zhongli',
    name: 'Zhongli',
    targetLevel: 1,
    targetLevelText: 'C1 Echoes of the Earth',
    baseUpliftPct: 8,
    baseScore: 78,
    description: 'Increases maximum Stone Stele count to 2 simultaneously.',
    benefits: [
      'Doubles Geo resonance pulses and Tenacity of the Millelith trigger consistency.',
      'Improves Geo particle battery generation.',
    ],
  },
  {
    characterId: 'Zhongli',
    name: 'Zhongli',
    targetLevel: 2,
    targetLevelText: 'C2 Whatever, Stones and Jade',
    baseUpliftPct: 15,
    baseScore: 86,
    description: 'Planet Befall grants a Jade Shield to all party members on cast.',
    benefits: [
      'Provides instant zero-downtime shields on burst without holding Skill.',
      'Top-tier multiplayer and co-op teamwide shielding.',
    ],
  },

  // Yelan C1 & C2
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
  {
    characterId: 'Yelan',
    name: 'Yelan',
    targetLevel: 2,
    targetLevelText: 'C2 Taking All Comers',
    baseUpliftPct: 20,
    baseScore: 91,
    description: 'Coordinated attacks fire an additional water arrow dealing 14% Max HP Hydro DMG every 1.8s.',
    benefits: [
      'Enables solo-Hydro Vaporize with Hu Tao by eliminating Pyro aura override.',
      'Substantial +20% personal damage uplift across entire burst duration.',
    ],
  },

  // Chasca C1
  {
    characterId: 'Chasca',
    name: 'Chasca',
    targetLevel: 1,
    targetLevelText: "C1 Cylinder's Floating Feather",
    baseUpliftPct: 18,
    baseScore: 88,
    description: 'Nightsoul point consumption reduced by 30% and guarantees elemental conversion on shadow bullets.',
    benefits: [
      'Guarantees all 6 conversion bullets in rainbow compositions.',
      'Significantly extended flight and sniping duration.',
    ],
  },

  // Clorinde C1
  {
    characterId: 'Clorinde',
    name: 'Clorinde',
    targetLevel: 1,
    targetLevelText: "C1 Pass the Candle's Flame",
    baseUpliftPct: 15,
    baseScore: 85,
    description: 'Nightvigil normal attacks trigger 2 additional Shadowpiercing strikes dealing 30% ATK Electro DMG.',
    benefits: [
      'Increases hit count and Electro reaction triggers during Nightvigil state.',
      '+15% sustained personal damage output.',
    ],
  },

  // Citlali C1
  {
    characterId: 'Citlali',
    name: 'Citlali',
    targetLevel: 1,
    targetLevelText: "C1 Dawn's Frosty Whisper",
    baseUpliftPct: 14,
    baseScore: 84,
    description: 'Opal Shield absorption increased by 20% and triggers additional Cryo damage pulses.',
    benefits: [
      'Thicker shield protection and reliable off-field Cryo application.',
      'Higher Melt reaction consistency for Pyro teammates.',
    ],
  },

  // Chiori C1
  {
    characterId: 'Chiori',
    name: 'Chiori',
    targetLevel: 1,
    targetLevelText: 'C1 Six-Spun Silk Applique',
    baseUpliftPct: 18,
    baseScore: 88,
    description: 'Automaton Yoto trigger AoE +50%, and summons an additional doll if another Geo character is in party (no construct needed).',
    benefits: [
      'Removes the Geo construct restriction entirely, unlocking dual dolls with Navia or Noelle.',
      'Massive ~35% off-field damage increase in non-construct Geo teams.',
    ],
  },

  // Lyney C1
  {
    characterId: 'Lyney',
    name: 'Lyney',
    targetLevel: 1,
    targetLevelText: 'C1 Whimsical Wonders',
    baseUpliftPct: 16,
    baseScore: 85,
    description: 'Can have up to 2 Grin-Malkin Hats simultaneously, and Prop Arrows summon an extra hat every 15s.',
    benefits: [
      'Double taunts and double Pyrotechnic Strike explosions.',
      'Accelerates Prop Surplus stack generation.',
    ],
  },

  // Mitya C1 & C2 (7.2 Snezhnaya)
  {
    characterId: 'Mitya',
    name: 'Mitya',
    targetLevel: 1,
    targetLevelText: 'C1 The Observer Seeking What Is Missing',
    baseUpliftPct: 15,
    baseScore: 86,
    description: 'Increases maximum Gradient Beacons to 5 and grants additional energy on Polestar Field activation.',
    benefits: [
      'Extends Polestar Field uptime and energy battery generation.',
      'Smooths rotation cycles for Stellar-Conduct reaction teams.',
    ],
  },
  {
    characterId: 'Mitya',
    name: 'Mitya',
    targetLevel: 2,
    targetLevelText: 'C2 Reagent Overload Detonation',
    baseUpliftPct: 24,
    baseScore: 92,
    description: 'Stellar-Conduct reactions in Polestar Field shred 25% Electro and Cryo RES for all nearby opponents.',
    benefits: [
      'Massive dual-element resistance shred for Snezhnaya reaction teams.',
      '+24% teamwide damage output during burst duration.',
    ],
  },

  // Zibai C1 & C2
  {
    characterId: 'Zibai',
    name: 'Zibai',
    targetLevel: 1,
    targetLevelText: 'C1 Resonant Jade Petals',
    baseUpliftPct: 14,
    baseScore: 84,
    description: 'Increases skill charge frequency and extends Lunar-Crystallize resonance duration.',
    benefits: [
      'Enhances personal Geo damage consistency.',
      'Accelerates shield generation for comfort.',
    ],
  },
  {
    characterId: 'Zibai',
    name: 'Zibai',
    targetLevel: 2,
    targetLevelText: 'C2 Harmonious Crystal Array',
    baseUpliftPct: 22,
    baseScore: 91,
    description: 'Resonant shockwaves grant +35% Geo DMG bonus and shred opponent DEF by 15%.',
    benefits: [
      'Teamwide DEF shred and colossal Geo damage amplification.',
      'Elevates Zibai into a premier hybrid carry.',
    ],
  },

  // Linnea C1 & C2
  {
    characterId: 'Linnea',
    name: 'Linnea',
    targetLevel: 1,
    targetLevelText: 'C1 Provisional Classification',
    baseUpliftPct: 15,
    baseScore: 86,
    description: 'Gains 6 stacks of Field Catalog increasing Lunar-Crystallize Reaction DMG by 75% of Linnea DEF.',
    benefits: [
      'Substantial DEF-scaling reaction damage boost.',
      'Elevates Lumi Ultimate Power Form burst damage.',
    ],
  },
  {
    characterId: 'Linnea',
    name: 'Linnea',
    targetLevel: 2,
    targetLevelText: 'C2 Tidings of Joy and Sorrow',
    baseUpliftPct: 24,
    baseScore: 92,
    description: 'Grants +40% CRIT DMG to all Hydro and Geo party members after triggering Moondrift Harmony.',
    benefits: [
      'Colossal +40% CRIT DMG party buff for Hydro and Geo units.',
      'Massive +150% CRIT DMG boost to Lumi Million Ton Crush.',
    ],
  },

  // Columbina C1 & C2
  {
    characterId: 'Columbina',
    name: 'Columbina',
    targetLevel: 1,
    targetLevelText: 'C1 Lunar Benediction',
    baseUpliftPct: 16,
    baseScore: 88,
    description: 'Increases party Moonsign level by 1 upon casting Elemental Skill and reduces cooldown by 20%.',
    benefits: [
      'Accelerates Ascendant Gleam state activation.',
      'Provides permanent Moonsign level scaling for Nod-Krai units.',
    ],
  },
  {
    characterId: 'Columbina',
    name: 'Columbina',
    targetLevel: 2,
    targetLevelText: 'C2 Welkin Moon Domain Expansion',
    baseUpliftPct: 28,
    baseScore: 96,
    description: 'Lunar Domain elevates all Lunar reaction damage multipliers by +45% and shreds Hydro RES by 30%.',
    benefits: [
      'Unrivaled reaction amplifier for Lunar-Bloom, Lunar-Charged, and Lunar-Crystallize.',
      '+28% total team damage uplift across all rotations.',
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
  const totalPulls = calculateTotalPulls(budget.primogems, budget.fates);
  const charOdds = calculateCharacterBannerOdds(
    totalPulls,
    budget.characterPity,
    budget.characterGuaranteed,
    budget.consecutiveLossCount ?? 0,
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
    candidateCharIds = [
      ...selectedBanner.characterBanners.map((cb) => cb.characterId),
      ...(selectedBanner.featured4StarIds || []),
    ];
    candidateWeaponKeys = selectedBanner.weaponBanner.featuredWeapons;
  } else {
    // Universal sandbox mode: evaluates all 122 playable gacha characters (omitting free story Travelers) & 5★ signature weapons
    candidateCharIds = CHARACTERS.filter((c) => !c.id.startsWith('Traveler')).map((c) => c.id);
    candidateWeaponKeys = Array.from(
      new Set([
        ...Object.values(SIGNATURE_WEAPONS).map((sw) => sw.weaponKey),
        ...CHARACTERS.flatMap((c) => {
          const topW = c.build?.weapons?.[0];
          const dbW = topW ? getWeaponByKey(topW.name) : undefined;
          return dbW && dbW.rarity === 5 ? [dbW.key] : [];
        }),
      ]),
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
      } else if (char.id === 'RaidenShogun') {
        score = 92;
        uplift = 25;
        unlocked.push('Universal Battery & Burst DPS');
        benefits.push('Recharges whole party bursts while dealing devastating on-field Electro damage.');
      } else if (char.id === 'Xianyun') {
        score = 91;
        uplift = 25;
        unlocked.push('Universal Plunge Archetype & Teamwide Healing');
        benefits.push('Unlocks plunging attacks for any DPS character alongside continuous party healing.');
      } else if (char.id === 'HuTao') {
        score = 89;
        uplift = 26;
        unlocked.push('Top-Tier Single-Target Pyro Carry');
        benefits.push('Devastating Vaporize and Melt damage scaling with unmatched single-target DPS.');
      } else if (char.id === 'Chasca') {
        score = 88;
        uplift = 24;
        unlocked.push('Multi-Elemental Nightsoul Conversion Shelling');
        benefits.push('High damage multi-elemental conversion bullets adaptable to any party composition.');
      } else if (char.id === 'Kinich') {
        score = 88;
        uplift = 24;
        unlocked.push('Nightsoul Burgeon & Burning DPS');
        benefits.push('Acrobatic high-mobility grapple loops with massive Dendro scaling in Burning/Burgeon.');
      } else if (char.id === 'Clorinde') {
        score = 88;
        uplift = 24;
        unlocked.push('Bond of Life Electro Carry');
        benefits.push('Rapid piercing gunshot and thrust normal attacks with self-sustaining Bond of Life.');
      } else if (char.id === 'Alhaitham') {
        score = 88;
        uplift = 25;
        unlocked.push('Premier Spread & Hyperbloom Dendro Carry');
        benefits.push('Mirror sword projection rain providing top-tier Dendro application and personal damage.');
      } else if (char.id === 'Navia') {
        score = 87;
        uplift = 24;
        unlocked.push('Crystallize Shrapnel Burst DPS');
        benefits.push('Instant 6-shrapnel blast hits delivering massive burst damage with flexible teammates.');
      } else if (char.id === 'Baizhu') {
        score = 88;
        uplift = 18;
        unlocked.push('Dendro Shielding & Reaction DMG Buffing');
        benefits.push('Continuous healing, interruption shields, and reaction damage amplification for Bloom/Quicken.');
      } else if (char.id === 'Lyney') {
        score = 86;
        uplift = 24;
        unlocked.push('Mono-Pyro Trickster DPS');
        benefits.push('High charged shot Prop Arrow damage amplified by Pyro teammates.');
      } else if (char.id === 'Chiori') {
        score = 85;
        uplift = 22;
        unlocked.push('Geo Sub-DPS & Dual Doll Off-Field Damage');
        benefits.push('Zero-effort off-field Geo damage that scales with DEF and ATK.');
      } else if (char.id === 'Mitya') {
        score = 94;
        uplift = 30;
        unlocked.push('Stellar-Conduct Polestar Field & Electro Reaction Core');
        benefits.push(
          'Premier Snezhnaya Electro catalyst creating Polestar Fields that elevate Superconduct into Stellar-Conduct with massive EM and energy recharge.',
        );
      } else if (char.id === 'Valeriy') {
        score = 82;
        uplift = 18;
        unlocked.push('Snezhnaya Electro Battery & Team Sustain');
        benefits.push('Smooth Electro burst battery and party sustain with flexible rotation synergy.');
      } else if (char.id === 'Zibai') {
        score = 90;
        uplift = 25;
        unlocked.push('Lunar-Crystallize Resonant Shockwaves');
        benefits.push('High-scaling Geo sword carry generating continuous resonant shockwaves with elemental teammates.');
      } else if (char.id === 'Linnea') {
        score = 91;
        uplift = 26;
        unlocked.push('Moondrift Harmony & DEF-Scaling Support');
        benefits.push(
          'Nod-Krai Geo bow adventurer providing partywide DEF-scaled healing, Geo RES shred, and Lunar-Crystallize elevation.',
        );
      } else if (char.id === 'Columbina') {
        score = 97;
        uplift = 36;
        unlocked.push('Welkin Moon Lunar Domain');
        benefits.push(
          'Welkin Moon maiden elevating Bloom, Electro-Charged, and Crystallize into hyper-dense Lunar variants with HP scaling.',
        );
      } else if (char.id === 'Sandrone') {
        score = 91;
        uplift = 28;
        unlocked.push('Automaton Command Heavy Cryo Cleave');
        benefits.push('Devastating Snezhnaya Cryo claymore carry commanding automaton constructs with high multi-hit scaling.');
      } else if (char.id === 'Varka') {
        score = 93;
        uplift = 30;
        unlocked.push('Gest of the Mighty Wolf Sweeping Carry');
        benefits.push('Grand Master of Favonius delivering colossal Anemo physical hybrid cleaves with high-impact poise breaking.');
      } else if (char.id === 'Skirk') {
        score = 95;
        uplift = 34;
        unlocked.push('Abyssal Void-Severing Carry');
        benefits.push('Flawless high-speed Cryo sword strikes with self-sustaining Bond of Life and Abyssal reaction supremacy.');
      } else if (char.id === 'Mualani') {
        score = 90;
        uplift = 26;
        unlocked.push('Nightsoul Shark Surf Vaporize Burst');
        benefits.push('High mobility shark bite attacks delivering colossal Vaporize burst numbers scaling with Max HP.');
      } else if (char.id === 'Varesa') {
        score = 89;
        uplift = 24;
        unlocked.push('Nightsoul Electro Artillery');
        benefits.push('Acrobatic Electro catalyst driver triggering continuous Nightsoul chain detonations.');
      } else {
        const isDPS = char.roles.includes('On-Field DPS');
        const isBuffer = char.roles.includes('Buffer/Shred');
        const isSustain = char.roles.includes('Sustain');
        if (char.rarity === 5) {
          score = isBuffer ? (hasUniversalBuffer ? 85 : 93) : isSustain ? (hasTopSustain ? 80 : 89) : isDPS ? 84 : 80;
          uplift = isBuffer ? 25 : isDPS ? 24 : 16;
          unlocked.push(`${char.element} ${char.roles[0] || 'Combat Specialist'}`);
          benefits.push(`High-impact 5★ ${char.element} ${char.weapon} unit with comprehensive scaling for endgame content.`);
        } else {
          score = isBuffer ? 75 : isSustain ? 72 : 68;
          uplift = 12;
          benefits.push(`Versatile 4★ ${char.element} support and sub-DPS for roster flexibility.`);
        }
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
        } else if (char.constellations && char.constellations.length > currentConst) {
          const nextConst = char.constellations[currentConst];
          const isDPS = char.roles.includes('On-Field DPS');
          const isBuffer = char.roles.includes('Buffer/Shred');
          const baseScore = char.rarity === 5 ? (isBuffer ? 82 : isDPS ? 78 : 75) : 60;
          const baseUplift = char.rarity === 5 ? (isBuffer ? 16 : isDPS ? 18 : 12) : 8;

          let tier: EnhancedPullAdvice['tier'] = 'Situational';
          if (baseScore >= 90) tier = 'Must Pull';
          else if (baseScore >= 75) tier = 'High Value';
          else if (baseScore < 50) tier = 'Skip / Redundant';

          adviceList.push({
            id: `const_${charId}_${nextConst.level}`,
            name: `${char.name} C${nextConst.level}`,
            targetType: 'Constellation',
            characterId: charId,
            targetLevelText: `C${nextConst.level} ${nextConst.name}`,
            score: baseScore,
            tier,
            teamDamageUpliftPct: baseUplift,
            unlockedArchetypes: [],
            accountBenefits: [
              `Unlocks ${char.name}'s C${nextConst.level}: ${nextConst.name}`,
              nextConst.description.slice(0, 140) + (nextConst.description.length > 140 ? '...' : ''),
            ],
            caution: `Evaluating next constellation step for owned C${currentConst} ${char.name}.`,
            odds: charOdds,
          });
        }
      }
    }
  }

  // 2. Evaluate Signature Weapons
  const evaluatedWeaponKeys = new Set<string>();

  const evaluateSignature = (charId: string, sigConfig: SignatureWeaponConfig) => {
    const sigCanonicalKey =
      (getWeaponByKey(sigConfig.weaponKey) || getWeaponByKey(sigConfig.name))?.key ||
      sigConfig.weaponKey;

    const isCandidate = candidateWeaponKeys.some(
      (k) => ((getWeaponByKey(k)?.key || k) === sigCanonicalKey) || k === sigConfig.weaponKey,
    );
    if (!isCandidate) {
      return;
    }
    if (evaluatedWeaponKeys.has(sigCanonicalKey)) {
      return;
    }
    evaluatedWeaponKeys.add(sigCanonicalKey);

    const char = CHARACTERS.find((c) => c.id === charId);
    const dbWeapon = getWeaponByKey(sigConfig.weaponKey) || getWeaponByKey(sigConfig.name);

    // Check if player already owns this signature weapon (matching canonical or alias keys)
    const ownsSignature =
      ownedWeapons.some((w) => {
        const wKey = (getWeaponByKey(w.key) || getWeaponByKey(w.name))?.key || w.key;
        return wKey === sigCanonicalKey;
      }) ||
      Object.values(ownedProfiles).some((p) => {
        if (!p.weapon) return false;
        const pKey =
          (getWeaponByKey(p.weapon.key) || getWeaponByKey(p.weapon.name))?.key || p.weapon.key;
        return pKey === sigCanonicalKey;
      });

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
      return;
    }

    let uplift = sigConfig.baseUpliftPct;
    let score = 88;
    const benefits = [
      `${dbWeapon?.name ?? sigConfig.name} is the tailored best-in-slot weapon for ${char?.name ?? charId}.`,
    ];
    let caution: string | undefined;

    // Check substitutes across all owned weapons and profiles (using highest refinement owned)
    for (const sub of sigConfig.substitutes) {
      const subCanonicalKey = getWeaponByKey(sub.key)?.key || sub.key;
      const ownedMatches = ownedWeapons.filter((w) => {
        const wKey = (getWeaponByKey(w.key) || getWeaponByKey(w.name))?.key || w.key;
        return wKey === subCanonicalKey;
      });
      const equippedMatches = Object.values(ownedProfiles)
        .map((p) => p.weapon)
        .filter((w): w is NonNullable<typeof w> => {
          if (!w) return false;
          const wKey = (getWeaponByKey(w.key) || getWeaponByKey(w.name))?.key || w.key;
          return wKey === subCanonicalKey;
        });

      const allMatches = [...ownedMatches, ...equippedMatches];
      if (allMatches.length > 0) {
        const maxRef = Math.max(...allMatches.map((w) => w.refinement ?? 1));
        if (!sub.minRefinement || maxRef >= sub.minRefinement) {
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
  };

  if (selectedBanner) {
    // When a specific banner is selected, evaluate weapons directly from the banner's character lineup
    // This prevents cross-character weapon hijacking (e.g. Alhaitham/Yelan on 7.2 P2, or Citlali on Natlan Chronicled)
    for (const cb of selectedBanner.characterBanners) {
      const sigConfig = SIGNATURE_WEAPONS[cb.characterId] ?? {
        weaponKey: cb.signatureWeaponKey,
        name: getWeaponByKey(cb.signatureWeaponKey)?.name ?? cb.signatureWeaponKey,
        baseUpliftPct: 22,
        substitutes: [],
      };
      evaluateSignature(cb.characterId, sigConfig);
    }
  } else {
    // In sandbox / all mode:
    // 1. Evaluate explicit SIGNATURE_WEAPONS entries
    for (const [charId, sigConfig] of Object.entries(SIGNATURE_WEAPONS)) {
      evaluateSignature(charId, sigConfig);
    }

    // 2. Dynamic signature weapon evaluation for remaining candidate characters (restricted to 5★ characters)
    for (const charId of candidateCharIds) {
      if (SIGNATURE_WEAPONS[charId]) continue;
      const char = CHARACTERS.find((c) => c.id === charId);
      if (!char || char.rarity !== 5) continue;

      const topWeapon = char.build?.weapons?.[0];
      if (!topWeapon) continue;
      const dbWeapon = getWeaponByKey(topWeapon.name);
      if (!dbWeapon || dbWeapon.rarity < 5) continue;

      const dynamicConfig: SignatureWeaponConfig = {
        weaponKey: dbWeapon.key,
        name: dbWeapon.name,
        baseUpliftPct: 20,
        substitutes: (char.build?.weapons.slice(1) || []).map((subW, i) => {
          const dbSub = getWeaponByKey(subW.name);
          return {
            key: dbSub?.key ?? subW.name,
            minRefinement: (dbSub?.rarity ?? 4) <= 4 ? 3 : 1,
            penaltyPct: Math.max(5, 12 - i * 3),
            penaltyReason: `You already own ${subW.name}, an effective alternative for ${char.name}.`,
          };
        }),
      };
      evaluateSignature(charId, dynamicConfig);
    }
  }

  // Sort descending by score, tiebreaker on teamDamageUpliftPct
  return adviceList.sort((a, b) => b.score - a.score || b.teamDamageUpliftPct - a.teamDamageUpliftPct);
}
