import type {
  Element,
  EncounterTargetProfile,
  EnemyMovementTrait,
} from '../types/genshin';
import type { ShieldType } from '../engines/combat-mechanics';
import { CURRENT_GAME_VERSION } from './game-version';

export interface AbyssEnemy {
  id: string;
  name: string;
  level: number;
  hp: number;
  baseRes: Record<Element | 'Physical', number>;
  shieldType?: ShieldType;
  shieldUnits?: number;
  weaknessNote?: string;
  icon?: string;
  wave?: number;
  count?: number;
  movementTraits?: EnemyMovementTrait[];
  targetingNote?: string;
}

export interface AbyssChamberBuff {
  description: string;
  favoredElements?: Element[];
  favoredTags?: string[];
  favoredArchetypes?: string[];
}

export interface AbyssLeyLineBuff {
  favoredElements?: Element[];
  favoredTags?: string[];
  favoredArchetypes?: string[];
  firstHalfBonus?: string;
  secondHalfBonus?: string;
}

export interface AbyssChamberHalfConfig {
  enemies: AbyssEnemy[];
  mechanics: {
    requiresBow?: boolean;
    favorsNightsoul?: boolean;
    favorsAoE?: boolean;
    targetProfile?: EncounterTargetProfile;
    waveCount?: number;
    movementTraits?: EnemyMovementTrait[];
    positioningTip?: string;
    shieldType?: ShieldType;
    shieldUnits?: number;
    rotatingShields?: ShieldType[];
    punishesShields?: boolean;
    recommendedElements?: Element[];
    prohibitedElements?: Element[];
    chamberBuff?: AbyssChamberBuff;
    description: string;
  };
}

export interface AbyssChamberConfig {
  chamber: number; // 1, 2, 3
  firstHalf: AbyssChamberHalfConfig;
  secondHalf: AbyssChamberHalfConfig;
}

export interface AbyssCycleConfig {
  id: string;
  name: string;
  version: string;
  phase: string;
  buffDescription: string;
  leyLineBuff?: AbyssLeyLineBuff;
  chambers: AbyssChamberConfig[];
  isCustom?: boolean;
  effectiveStartDate?: string;
  effectiveEndDate?: string;
  sourceUrl?: string;
  verifiedAt?: string;
}

const DEFAULT_RES: Record<Element | 'Physical', number> = {
  Pyro: 10,
  Hydro: 10,
  Anemo: 10,
  Electro: 10,
  Dendro: 10,
  Cryo: 10,
  Geo: 10,
  Physical: 10,
};

const ALL_RES_KEYS: Array<Element | 'Physical'> = [
  'Pyro',
  'Hydro',
  'Anemo',
  'Electro',
  'Dendro',
  'Cryo',
  'Geo',
  'Physical',
];

export const DEFAULT_ACTIVE_ABYSS_CYCLE_ID = 'cycle-7-2';

export const ABYSS_CYCLES: AbyssCycleConfig[] = [
  // Version 7.2 (Active Official Floor 12)
  {
    id: 'cycle-7-2',
    version: CURRENT_GAME_VERSION,
    phase: 'Phase 1',
    effectiveStartDate: '2026-11-16',
    effectiveEndDate: '2026-12-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verifiedAt: '2026-11-16',
    name: 'Version 7.2 · Phase 1: Stellar Fracture - Polestar Domain',
    buffDescription:
      'Characters with Polestar alignment or triggering Cryo/Hydro/Electro reactions gain +40% Polestar resonance DMG and +30% CRIT DMG. Triggering Hexerei or Lunar reactions unleashes a Stellar Nova shockwave.',
    leyLineBuff: {
      favoredElements: ['Cryo', 'Hydro', 'Electro'],
      favoredTags: ['Polestar', 'Hexerei', 'Lunar-Bloom', 'Lunar-Charged', 'Lunar-Crystallize', 'Moonsign'],
      favoredArchetypes: ['Freeze', 'Electro-Charged', 'Superconduct', 'Lunar-Charged', 'Lunar-Bloom', 'Hyperbloom'],
      firstHalfBonus: 'Rewards frontloaded AoE and Polestar/Lunar burst chains.',
      secondHalfBonus: 'Rewards multi-element reaction application and Hydro/Cryo/Pyro shield breaks.',
    },
    chambers: [
      {
        chamber: 1,
        firstHalf: {
          enemies: [
            {
              id: 'consecrated-scorpion',
              name: 'Consecrated Scorpion',
              level: 100,
              hp: 1450000,
              baseRes: { ...DEFAULT_RES, Electro: 40 },
              weaknessNote: 'High Electro RES; destroy Phagocytic Energy Block to paralyze',
              wave: 1,
              count: 1,
              movementTraits: ['Aggressive', 'Burrowing'],
              targetingNote: 'Bait its tail-dive into the Eremite spawn so AoE hits both.',
            },
            {
              id: 'eremite-floral-ring-dancer',
              name: 'Eremite Floral Ring-Dancer',
              level: 100,
              hp: 1150000,
              baseRes: { ...DEFAULT_RES, Dendro: 50 },
              weaknessNote: 'High Dendro RES; interrupt spirit summon with sustained heavy hits',
              wave: 2,
              count: 1,
              movementTraits: ['Multi-Wave', 'Aggressive'],
              targetingNote: 'Focus the summoned Spirit of Omen to inflict RES drop and stun.',
            },
          ],
          mechanics: {
            targetProfile: 'Mixed',
            waveCount: 2,
            movementTraits: ['Aggressive', 'Multi-Wave'],
            positioningTip: 'Play near the arena edge to keep the Scorpion from pushing you out of buff circles.',
            recommendedElements: ['Cryo', 'Pyro', 'Hydro'],
            chamberBuff: {
              description: 'Favors Cryo/Hydro/Pyro frontload with interruption resistance.',
              favoredElements: ['Cryo', 'Hydro', 'Pyro'],
              favoredTags: ['Shielder', 'Hyperarmor', 'AoE'],
            },
            description: 'Aggressive multi-target beasts requiring strong crowd control and frontloaded bursts.',
          },
        },
        secondHalf: {
          enemies: [
            {
              id: 'abyss-lector-pyro',
              name: 'Abyss Lector: Fathomless Flames',
              level: 100,
              hp: 1350000,
              baseRes: { ...DEFAULT_RES, Pyro: 50 },
              shieldType: 'Pyro',
              shieldUnits: 36,
              weaknessNote: 'Rapid Hydro shield breaking (Furina, Xingqiu, Yelan)',
              wave: 2,
              count: 1,
              movementTraits: ['Stationary', 'Multi-Wave'],
              targetingNote: 'Destroy the Darkfire Furnace meteor immediately to strip ~25% of its Pyro ward.',
            },
            {
              id: 'pyro-abyss-mage',
              name: 'Pyro Abyss Mage',
              level: 100,
              hp: 420000,
              baseRes: { ...DEFAULT_RES, Pyro: 50 },
              shieldType: 'Pyro',
              shieldUnits: 12,
              wave: 1,
              count: 2,
              movementTraits: ['Teleporting', 'Multi-Wave'],
              targetingNote: 'Run to the arena edge so both Pyro Mages teleport together for an AoE Hydro swirl.',
            },
          ],
          mechanics: {
            targetProfile: 'Mixed',
            waveCount: 2,
            movementTraits: ['Teleporting', 'Multi-Wave'],
            positioningTip: 'Pull wave 1 Mages to the wall, then hug the Lector to cleave its Darkfire Furnace.',
            shieldType: 'Pyro',
            shieldUnits: 36,
            recommendedElements: ['Hydro', 'Electro'],
            prohibitedElements: ['Pyro'],
            chamberBuff: {
              description: 'Rapid Hydro application accelerates both waves and triggers Polestar resonance.',
              favoredElements: ['Hydro', 'Electro'],
              favoredArchetypes: ['Electro-Charged', 'Lunar-Charged', 'Freeze', 'Hyperbloom'],
            },
            description: 'Intense Pyro shields requiring rapid Hydro or elemental shield-shredding.',
          },
        },
      },
      {
        chamber: 2,
        firstHalf: {
          enemies: [
            {
              id: 'maguu-kenki-trio',
              name: 'Maguu Kenki: Lone Gale & Galloping Frost',
              level: 100,
              hp: 2200000,
              baseRes: { ...DEFAULT_RES, Anemo: 30, Cryo: 30 },
              weaknessNote: 'High burst AoE damage; keep both targets grouped during sword wave slashes',
              wave: 1,
              count: 2,
              movementTraits: ['Aggressive', 'Teleporting'],
              targetingNote: 'Open by dashing toward Galloping Frost so Lone Gale dashes onto your position.',
            },
          ],
          mechanics: {
            favorsAoE: true,
            targetProfile: 'AoE',
            waveCount: 1,
            movementTraits: ['Aggressive', 'Teleporting'],
            positioningTip: 'Avoid standing inside Cryo field ticks; iframe synchronized dash slashes.',
            recommendedElements: ['Pyro', 'Electro', 'Dendro'],
            chamberBuff: {
              description: 'Strong AoE cleave and defensive sustain minimize downtime.',
              favoredElements: ['Pyro', 'Electro', 'Dendro'],
              favoredTags: ['AoE', 'Sustain', 'Shielder'],
            },
            description: 'Close-quarters dual automaton burst; heavy sustained survivability and AoE required.',
          },
        },
        secondHalf: {
          enemies: [
            {
              id: 'ruin-drake-skywatch',
              name: 'Ruin Drake: Skywatch',
              level: 100,
              hp: 1750000,
              baseRes: { ...DEFAULT_RES, Physical: 50 },
              weaknessNote: 'Requires Bow aimed shot to hit wing turbines and ground unit',
              wave: 1,
              count: 1,
              movementTraits: ['Airborne'],
              targetingNote: 'Aim at both glowing wing cores right after lift-off to trigger a long stun and clear absorbed RES.',
            },
          ],
          mechanics: {
            requiresBow: true,
            targetProfile: 'Single-Target',
            waveCount: 1,
            movementTraits: ['Airborne'],
            positioningTip: 'Bring a Bow user to ground the Drake before committing long burst windows.',
            recommendedElements: ['Hydro', 'Cryo', 'Electro'],
            chamberBuff: {
              description: 'Single-target burst during the grounded stun window maximizes DPS.',
              favoredElements: ['Hydro', 'Cryo', 'Electro'],
              favoredTags: ['Single-Target', 'Polestar'],
            },
            description: 'Airborne Ruin Drake demands ranged bow shot on exposed power core to force crash.',
          },
        },
      },
      {
        chamber: 3,
        firstHalf: {
          enemies: [
            {
              id: 'stellar-abyss-sovereign',
              name: 'Stellar Sovereign: Polestar Core',
              level: 100,
              hp: 3100000,
              baseRes: { ...DEFAULT_RES },
              weaknessNote: 'High single-target HP pool; Nightsoul and Polestar attacks accelerate shield shatter',
              wave: 1,
              count: 1,
              movementTraits: ['Stationary', 'Aggressive'],
              targetingNote: 'Stay behind its frontal shockwave cone and unload sustained single-target rotations.',
            },
          ],
          mechanics: {
            favorsNightsoul: true,
            targetProfile: 'Single-Target',
            waveCount: 1,
            movementTraits: ['Stationary', 'Aggressive'],
            positioningTip: 'Time Nightsoul or Polestar burst hits during core exposure to maximize stagger uptime.',
            recommendedElements: ['Pyro', 'Hydro', 'Cryo'],
            chamberBuff: {
              description: 'Rewards Nightsoul/Polestar single-target hypercarries with high sustained DPS.',
              favoredElements: ['Pyro', 'Hydro', 'Cryo'],
              favoredTags: ['Nightsoul', 'Polestar', 'Single-Target'],
            },
            description: 'Single-target massive HP boss with high kinetic shockwaves; rewards focused carry rotation.',
          },
        },
        secondHalf: {
          enemies: [
            {
              id: 'iniquitous-baptist-polestar',
              name: 'Iniquitous Baptist: Polestar Ward',
              level: 100,
              hp: 2700000,
              baseRes: { ...DEFAULT_RES, Electro: 50 },
              shieldType: 'Electro',
              shieldUnits: 32,
              weaknessNote: 'Electro ward broken swiftly by Cryo, Pyro, and Dendro',
              wave: 1,
              count: 1,
              movementTraits: ['Teleporting'],
              targetingNote: 'It teleports to the center before channeling elemental rings; save off-field applicators for shield phases.',
            },
          ],
          mechanics: {
            targetProfile: 'Single-Target',
            waveCount: 1,
            movementTraits: ['Teleporting'],
            positioningTip: 'Break the elemental ward immediately to trigger an extended low-RES stun window.',
            shieldType: 'Electro',
            shieldUnits: 32,
            rotatingShields: ['Electro', 'Cryo', 'Pyro'],
            recommendedElements: ['Pyro', 'Cryo', 'Dendro'],
            chamberBuff: {
              description: 'Multi-element reaction teams rapidly cycle through Baptist elemental wards.',
              favoredElements: ['Pyro', 'Cryo', 'Dendro', 'Hydro'],
              favoredArchetypes: ['Hyperbloom', 'National', 'Melt', 'Lunar-Bloom', 'Rainbow'],
            },
            description: 'Sequential elemental barrier; multi-element reaction team required.',
          },
        },
      },
    ],
  },
  // Version 7.1 (Official Floor 12 Archive)
  {
    id: 'cycle-7-1',
    version: '7.1',
    phase: 'Phase 2',
    effectiveStartDate: '2026-10-16',
    effectiveEndDate: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verifiedAt: '2026-10-16',
    name: 'Version 7.1 · Phase 2: Lunar Gleam - Ascendant Radiance',
    buffDescription:
      'Triggering Lunar-Bloom, Lunar-Charged, or Lunar-Crystallize reactions increases active character ATK by 30% and Elemental Mastery by 120. When Moonsign reaches Ascendant Gleam, unleash a Moonburst shockwave.',
    leyLineBuff: {
      favoredElements: ['Dendro', 'Hydro', 'Electro', 'Geo'],
      favoredTags: ['Lunar-Bloom', 'Lunar-Charged', 'Lunar-Crystallize', 'Moonsign'],
      favoredArchetypes: ['Lunar-Bloom', 'Lunar-Charged', 'Lunar-Crystallize', 'Hyperbloom', 'Quicken'],
    },
    chambers: [
      {
        chamber: 1,
        firstHalf: {
          enemies: [
            {
              id: 'hydro-phantasm-v7',
              name: 'Hydro Phantasm Sovereign',
              level: 98,
              hp: 1550000,
              baseRes: { ...DEFAULT_RES, Hydro: 100 },
              weaknessNote: 'Immune to Hydro; weak to Dendro, Cryo, Pyro',
              wave: 1,
              count: 2,
              movementTraits: ['Aggressive'],
              targetingNote: 'Permanent Hydro aura grants free Vaporize/Bloom/Freeze triggers.',
            },
            {
              id: 'consecrated-flying-serpent',
              name: 'Consecrated Flying Serpent',
              level: 98,
              hp: 1200000,
              baseRes: { ...DEFAULT_RES, Anemo: 40 },
              wave: 2,
              count: 1,
              movementTraits: ['Aggressive', 'Multi-Wave'],
              targetingNote: 'Break its Anemo energy block when dropped to strip elevated RES.',
            },
          ],
          mechanics: {
            targetProfile: 'Mixed',
            waveCount: 2,
            movementTraits: ['Aggressive', 'Multi-Wave'],
            positioningTip: 'Use the Phantasms’ innate Hydro aura to fuel non-Hydro reaction carries.',
            prohibitedElements: ['Hydro'],
            recommendedElements: ['Dendro', 'Cryo', 'Pyro', 'Electro'],
            description: 'Hydro-immune targets; non-Hydro DPS required with high reaction potential.',
          },
        },
        secondHalf: {
          enemies: [
            {
              id: 'abyss-herald-frostfall',
              name: 'Abyss Herald: Frostfall',
              level: 98,
              hp: 1400000,
              baseRes: { ...DEFAULT_RES, Cryo: 50 },
              shieldType: 'Cryo',
              shieldUnits: 36,
              weaknessNote: 'Cryo shield rapidly melted by Pyro attacks',
              wave: 1,
              count: 2,
              movementTraits: ['Aggressive'],
              targetingNote: 'Avoid Bennett self-Pyro + Cryo stamina drain; group both Heralds for shared Pyro application.',
            },
          ],
          mechanics: {
            targetProfile: 'AoE',
            waveCount: 1,
            movementTraits: ['Aggressive'],
            positioningTip: 'Dodge frost waves to preserve stamina and apply sustained Pyro on both shields.',
            shieldType: 'Cryo',
            shieldUnits: 36,
            recommendedElements: ['Pyro', 'Electro'],
            prohibitedElements: ['Cryo'],
            description: 'Rapid Cryo shield melting required to interrupt frost blades.',
          },
        },
      },
      {
        chamber: 2,
        firstHalf: {
          enemies: [
            {
              id: 'centaur-automaton-v7',
              name: 'Secret Source Automaton: Configuration Device',
              level: 98,
              hp: 2400000,
              baseRes: { ...DEFAULT_RES },
              wave: 1,
              count: 1,
              movementTraits: ['Stationary'],
              targetingNote: 'Climb or jump onto the Solid Phlogiston pillars to destroy Accretion Mechanisms.',
            },
          ],
          mechanics: {
            favorsAoE: true,
            targetProfile: 'Single-Target',
            waveCount: 1,
            movementTraits: ['Stationary'],
            positioningTip: 'Nightsoul or vertical mobility characters break its pillar phase fastest.',
            recommendedElements: ['Hydro', 'Electro', 'Dendro'],
            description: 'Phlogiston pillar shockwaves; heavy sustained DPS.',
          },
        },
        secondHalf: {
          enemies: [
            {
              id: 'ruin-drake-blaster',
              name: 'Ruin Drake: Skywatch Variant',
              level: 98,
              hp: 1800000,
              baseRes: { ...DEFAULT_RES, Physical: 50 },
              weaknessNote: 'Requires Bow shot to wing weakpoints',
              wave: 1,
              count: 1,
              movementTraits: ['Airborne'],
              targetingNote: 'Shoot both glowing wing turbines immediately on takeoff.',
            },
          ],
          mechanics: {
            requiresBow: true,
            targetProfile: 'Single-Target',
            waveCount: 1,
            movementTraits: ['Airborne'],
            positioningTip: 'Ground the Drake with a Bow charged shot before using melee bursts.',
            recommendedElements: ['Electro', 'Dendro', 'Pyro'],
            description: 'Flying unit requiring precision bow strikes.',
          },
        },
      },
      {
        chamber: 3,
        firstHalf: {
          enemies: [
            {
              id: 'lunar-bloom-beast',
              name: 'Kuuvahki Primeval Fiend',
              level: 98,
              hp: 2900000,
              baseRes: { ...DEFAULT_RES },
              wave: 1,
              count: 1,
              movementTraits: ['Aggressive'],
              targetingNote: 'Trigger Lunar reactions continuously to accelerate stagger bars.',
            },
          ],
          mechanics: {
            favorsNightsoul: true,
            targetProfile: 'Single-Target',
            waveCount: 1,
            movementTraits: ['Aggressive'],
            positioningTip: 'Maintain sustained off-field aura for non-stop Lunar/Nightsoul procs.',
            recommendedElements: ['Dendro', 'Hydro', 'Electro'],
            description: 'Massive Moonsign fiend highly vulnerable to Lunar reaction cascades.',
          },
        },
        secondHalf: {
          enemies: [
            {
              id: 'hydro-tulpa-ascendant',
              name: 'Hydro Tulpa: Ascendant Tide',
              level: 98,
              hp: 3100000,
              baseRes: { ...DEFAULT_RES, Hydro: 100 },
              wave: 1,
              count: 1,
              movementTraits: ['Stationary', 'Aggressive'],
              targetingNote: 'Destroy Half-Tulpas with Cryo/Dendro/Pyro before the boss absorbs them for a RES/ATK buff.',
            },
          ],
          mechanics: {
            targetProfile: 'Single-Target',
            waveCount: 1,
            movementTraits: ['Stationary', 'Aggressive'],
            positioningTip: 'Watch out for self-Vaporize hits inside Bennett Burst; clear Half-Tulpas promptly.',
            prohibitedElements: ['Hydro'],
            recommendedElements: ['Pyro', 'Dendro', 'Cryo'],
            description: 'High HP Hydro Sovereign; forward Vaporize and Dendro reaction checks.',
          },
        },
      },
    ],
  },
  // Version 5.3 (Official Floor 12 Baseline Archive)
  {
    id: 'cycle-5-3',
    version: '5.3',
    phase: 'Phase 1',
    effectiveStartDate: '2025-01-01',
    effectiveEndDate: '2025-02-01',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verifiedAt: '2025-01-01',
    name: 'Version 5.3 · Phase 1: Blazing Nightspirit',
    buffDescription:
      'Characters in Nightsoul Blessing or triggering Pyro reactions gain +25% ATK and +30% Elemental DMG for 12s.',
    leyLineBuff: {
      favoredElements: ['Pyro'],
      favoredTags: ['Nightsoul'],
      favoredArchetypes: ['Vaporize', 'Melt', 'Overload', 'Burning'],
    },
    chambers: [
      {
        chamber: 1,
        firstHalf: {
          enemies: [
            {
              id: 'hydro-phantasm',
              name: 'Hydro Phantasm',
              level: 95,
              hp: 1450000,
              baseRes: { ...DEFAULT_RES, Hydro: 100 },
              weaknessNote: 'Immune to Hydro; weak to Pyro, Dendro, Cryo, Electro',
              wave: 1,
              count: 2,
              movementTraits: ['Aggressive'],
            },
            {
              id: 'consecrated-flying-serpent',
              name: 'Consecrated Flying Serpent',
              level: 95,
              hp: 1100000,
              baseRes: { ...DEFAULT_RES, Anemo: 40 },
              weaknessNote: 'High Anemo RES; break energy block with matching element',
              wave: 2,
              count: 1,
              movementTraits: ['Aggressive', 'Multi-Wave'],
            },
          ],
          mechanics: {
            targetProfile: 'Mixed',
            waveCount: 2,
            movementTraits: ['Aggressive', 'Multi-Wave'],
            positioningTip: 'Exploit innate Hydro aura on Wave 1 with Pyro/Dendro carries.',
            prohibitedElements: ['Hydro'],
            recommendedElements: ['Pyro', 'Dendro', 'Cryo', 'Electro'],
            description: 'Hydro-immune Phantasms and aggressive beasts; non-Hydro DPS required.',
          },
        },
        secondHalf: {
          enemies: [
            {
              id: 'abyss-lector-pyro',
              name: 'Abyss Lector: Fathomless Flames',
              level: 95,
              hp: 1300000,
              baseRes: { ...DEFAULT_RES, Pyro: 50 },
              shieldType: 'Pyro',
              shieldUnits: 36,
              weaknessNote: 'Rapid Hydro shield breaking (Furina, Xingqiu, Yelan)',
              wave: 2,
              count: 1,
              movementTraits: ['Stationary', 'Multi-Wave'],
            },
            {
              id: 'pyro-abyss-mage',
              name: 'Pyro Abyss Mage',
              level: 95,
              hp: 420000,
              baseRes: { ...DEFAULT_RES, Pyro: 50 },
              shieldType: 'Pyro',
              shieldUnits: 12,
              wave: 1,
              count: 2,
              movementTraits: ['Teleporting', 'Multi-Wave'],
            },
          ],
          mechanics: {
            targetProfile: 'Mixed',
            waveCount: 2,
            movementTraits: ['Teleporting', 'Multi-Wave'],
            positioningTip: 'Group Pyro Mages at the wall, then keep Hydro uptime constant on the Lector.',
            shieldType: 'Pyro',
            shieldUnits: 36,
            recommendedElements: ['Hydro'],
            prohibitedElements: ['Pyro'],
            description: 'Pyro Lector activates 36 GU Pyro shield; rapid Hydro shield shredder mandatory.',
          },
        },
      },
      {
        chamber: 2,
        firstHalf: {
          enemies: [
            {
              id: 'maguu-kenki-trio',
              name: 'Maguu Kenki Trio',
              level: 98,
              hp: 1600000,
              baseRes: { ...DEFAULT_RES, Anemo: 30, Cryo: 30 },
              weaknessNote: 'High burst damage in close proximity; heavy sustain required',
              wave: 1,
              count: 3,
              movementTraits: ['Aggressive', 'Teleporting'],
              targetingNote: 'Dash slightly left of Galloping Frost at start so all three Kenkis converge.',
            },
          ],
          mechanics: {
            favorsAoE: true,
            targetProfile: 'AoE',
            waveCount: 1,
            movementTraits: ['Aggressive', 'Teleporting'],
            positioningTip: 'Hug the Cryo Kenki so the Anemo and Mask variants jump into your AoE.',
            description: 'Triple Kenki close-range melee assault; requires strong AoE and sustain/healing.',
          },
        },
        secondHalf: {
          enemies: [
            {
              id: 'aeonblight-drake',
              name: 'Aeonblight Drake',
              level: 98,
              hp: 2350000,
              baseRes: { ...DEFAULT_RES, Physical: 50 },
              weaknessNote: 'Takes flight; shoot exposed wing cores with Bow user',
              wave: 1,
              count: 1,
              movementTraits: ['Airborne'],
              targetingNote: 'Hit both wing cores with aimed Bow shots immediately after takeoff.',
            },
          ],
          mechanics: {
            requiresBow: true,
            targetProfile: 'Single-Target',
            waveCount: 1,
            movementTraits: ['Airborne'],
            positioningTip: 'Ground immediately to prevent 70% elemental RES absorption.',
            description: 'Takes flight at start of combat; Bow user strictly required to ground it.',
          },
        },
      },
      {
        chamber: 3,
        firstHalf: {
          enemies: [
            {
              id: 'centaur-automaton',
              name: 'Secret Source Automaton: Configuration Device',
              level: 100,
              hp: 2600000,
              baseRes: { ...DEFAULT_RES },
              shieldType: 'Nightspirit',
              shieldUnits: 18,
              weaknessNote: 'Natlan Nightsoul attacks deplete energy nodes 3x faster',
              wave: 1,
              count: 1,
              movementTraits: ['Stationary'],
            },
          ],
          mechanics: {
            favorsNightsoul: true,
            targetProfile: 'Single-Target',
            waveCount: 1,
            movementTraits: ['Stationary'],
            positioningTip: 'Use Nightsoul state to accelerate pillar spawning and trigger RES-down collapse.',
            shieldType: 'Nightspirit',
            shieldUnits: 18,
            description: 'Nightspirit energy ward; Natlan characters break ward 300% faster to trigger prolonged collapse.',
          },
        },
        secondHalf: {
          enemies: [
            {
              id: 'tenebrous-papilla',
              name: 'Local Legend: Tenebrous Papilla',
              level: 100,
              hp: 2400000,
              baseRes: { ...DEFAULT_RES },
              shieldType: 'Phlogiston',
              shieldUnits: 24,
              weaknessNote: 'Phlogiston barrier; Nightsoul or rapid elemental reactions',
              wave: 1,
              count: 1,
              movementTraits: ['Teleporting'],
              targetingNote: 'Void Ward tracks elemental hit count (Nightsoul hits count 3x); prioritize fast multi-hit units.',
            },
          ],
          mechanics: {
            favorsNightsoul: true,
            targetProfile: 'Single-Target',
            waveCount: 1,
            movementTraits: ['Teleporting'],
            positioningTip: 'Frontload multi-hit elemental skills or Nightsoul attacks to break Void Ward before nuke.',
            shieldType: 'Phlogiston',
            shieldUnits: 24,
            description: 'Phlogiston-infused entity vulnerable to multi-elemental burst or Nightsoul mechanics.',
          },
        },
      },
    ],
  },

  // Version 5.2 (Historical Archive)
  {
    id: 'cycle-5-2',
    version: '5.2',
    phase: 'Phase 2',
    effectiveStartDate: '2024-11-20',
    effectiveEndDate: '2024-12-20',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verifiedAt: '2024-11-20',
    name: 'Version 5.2 · Phase 2: Soaring Gales',
    buffDescription:
      'Swirl reactions increase active character CRIT Rate by 15% and CRIT DMG by 30% for 8s; plunging attacks generate a vortex.',
    leyLineBuff: {
      favoredElements: ['Anemo'],
      favoredTags: ['VV', 'Crowd-Control', 'Plunge'],
      favoredArchetypes: ['Swirl', 'Plunge', 'Taser'],
    },
    chambers: [
      {
        chamber: 1,
        firstHalf: {
          enemies: [
            {
              id: 'eremite-galehunter',
              name: 'Eremite Galehunter & Flora Ring-Dancer',
              level: 95,
              hp: 1350000,
              baseRes: { ...DEFAULT_RES, Anemo: -20, Dendro: -20 },
              wave: 1,
              count: 2,
              movementTraits: ['Multi-Wave', 'Aggressive'],
            },
          ],
          mechanics: {
            favorsAoE: true,
            targetProfile: 'AoE',
            waveCount: 2,
            movementTraits: ['Multi-Wave', 'Aggressive'],
            positioningTip: 'Use Anemo grouping to cleave both Eremites and their summons simultaneously.',
            description: 'Scattered humanoid mob waves; Anemo crowd-control and high AoE highly recommended.',
          },
        },
        secondHalf: {
          enemies: [
            {
              id: 'emperor-fire-iron',
              name: 'Emperor of Fire and Iron',
              level: 95,
              hp: 2200000,
              baseRes: { ...DEFAULT_RES, Pyro: 60 },
              shieldType: 'Pyro',
              shieldUnits: 32,
              weaknessNote: 'Twin-horn Pyro armor broken swiftly by Hydro attacks',
              wave: 1,
              count: 1,
              movementTraits: ['Aggressive'],
            },
          ],
          mechanics: {
            targetProfile: 'Single-Target',
            waveCount: 1,
            movementTraits: ['Aggressive'],
            positioningTip: 'Hold Hydro bursts until it lowers its twin horns to shred armor quickly.',
            shieldType: 'Pyro',
            shieldUnits: 32,
            recommendedElements: ['Hydro'],
            prohibitedElements: ['Pyro'],
            description: 'Armored crab with 32 GU Pyro twin-horn shield; Hydro application essential.',
          },
        },
      },
      {
        chamber: 2,
        firstHalf: {
          enemies: [
            {
              id: 'ruin-grader-duo',
              name: 'Ruin Grader & Ruin Guard',
              level: 98,
              hp: 1750000,
              baseRes: { ...DEFAULT_RES, Physical: 70 },
              wave: 1,
              count: 2,
              movementTraits: ['Stationary'],
            },
          ],
          mechanics: {
            favorsAoE: true,
            targetProfile: 'AoE',
            waveCount: 1,
            movementTraits: ['Stationary'],
            positioningTip: 'Stand beside the Ruin Grader so the Ruin Guard walks into cleave range.',
            description: 'Automaton heavy units with high Physical resistance; elemental reactions shine.',
          },
        },
        secondHalf: {
          enemies: [
            {
              id: 'golden-wolflord',
              name: 'Golden Wolflord',
              level: 98,
              hp: 1900000,
              baseRes: { ...DEFAULT_RES, Geo: 25 },
              shieldType: 'Geo',
              shieldUnits: 24,
              weaknessNote: 'Riftstalker Skulls require Geo attacks or heavy blunt hits',
              wave: 1,
              count: 1,
              movementTraits: ['Airborne'],
              targetingNote: 'Either burst it down before 70% HP or bring Geo to break all 3 Riftstalker Skulls.',
            },
          ],
          mechanics: {
            targetProfile: 'Single-Target',
            waveCount: 1,
            movementTraits: ['Airborne'],
            positioningTip: 'Bring a healer for Corrosion and Geo application for the 3-skull shield phase.',
            shieldType: 'Geo',
            shieldUnits: 24,
            recommendedElements: ['Geo'],
            description: 'Airborne Wolflord summons 3 Riftstalker Skulls; Geo character strictly required.',
          },
        },
      },
      {
        chamber: 3,
        firstHalf: {
          enemies: [
            {
              id: 'jadeplume-terrorshroom',
              name: 'Jadeplume Terrorshroom',
              level: 100,
              hp: 2100000,
              baseRes: { ...DEFAULT_RES, Dendro: 80 },
              weaknessNote: '80% Dendro RES; Electro activates and paralyzes it',
              wave: 1,
              count: 1,
              movementTraits: ['Aggressive'],
            },
          ],
          mechanics: {
            targetProfile: 'Single-Target',
            waveCount: 1,
            movementTraits: ['Aggressive'],
            positioningTip: 'Fill its Activation bar with Electro to force a collapsed DPS window.',
            prohibitedElements: ['Dendro'],
            recommendedElements: ['Electro', 'Pyro'],
            description: 'Immense Dendro RES; use Electro to activate and knock down into vulnerable state.',
          },
        },
        secondHalf: {
          enemies: [
            {
              id: 'iniquitous-baptist',
              name: 'Iniquitous Baptist',
              level: 100,
              hp: 2300000,
              baseRes: { ...DEFAULT_RES },
              shieldType: 'Pyro',
              shieldUnits: 16,
              weaknessNote: 'Rotates Pyro, Cryo, Electro shields',
              wave: 1,
              count: 1,
              movementTraits: ['Teleporting'],
            },
          ],
          mechanics: {
            targetProfile: 'Single-Target',
            waveCount: 1,
            movementTraits: ['Teleporting'],
            positioningTip: 'Bring 3+ distinct counter elements so every rotating shield breaks in seconds.',
            shieldType: 'Pyro',
            shieldUnits: 16,
            rotatingShields: ['Pyro', 'Cryo', 'Electro'],
            recommendedElements: ['Hydro', 'Pyro', 'Cryo', 'Dendro'],
            description: 'Tri-elemental rotating shields; rainbow team composition required.',
          },
        },
      },
    ],
  },

  // Version 5.1
  {
    id: 'cycle-5-1',
    version: '5.1',
    phase: 'Phase 1',
    effectiveStartDate: '2024-10-09',
    effectiveEndDate: '2024-11-09',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verifiedAt: '2024-10-09',
    name: 'Version 5.1 · Phase 1: Resonant Crystals',
    buffDescription:
      'Crystallize reactions trigger a resonant shockwave dealing True AoE damage; Geo DMG +40%.',
    leyLineBuff: {
      favoredElements: ['Geo'],
      favoredArchetypes: ['Mono Geo', 'Navia', 'Crystallize', 'Lunar-Crystallize'],
    },
    chambers: [
      {
        chamber: 1,
        firstHalf: {
          enemies: [
            {
              id: 'kairagi-duo',
              name: 'Kairagi: Dancing Thunder & Fiery Might',
              level: 95,
              hp: 1200000,
              baseRes: { ...DEFAULT_RES },
              wave: 1,
              count: 2,
              movementTraits: ['Aggressive'],
            },
          ],
          mechanics: {
            favorsAoE: true,
            targetProfile: 'AoE',
            waveCount: 1,
            movementTraits: ['Aggressive'],
            positioningTip: 'Even out HP on both Kairagi so neither triggers enraged self-healing.',
            description: 'Dual samurai pair; defeat both simultaneously to prevent enraged healing.',
          },
        },
        secondHalf: {
          enemies: [
            {
              id: 'cryo-hypostasis',
              name: 'Cryo Hypostasis',
              level: 95,
              hp: 1800000,
              baseRes: { ...DEFAULT_RES, Cryo: 100 },
              shieldType: 'Cryo',
              shieldUnits: 24,
              weaknessNote: 'Cryo immune; Pyro attacks melt core, heavy attacks launch frostfruits',
              wave: 1,
              count: 1,
              movementTraits: ['Teleporting'],
            },
          ],
          mechanics: {
            targetProfile: 'Single-Target',
            waveCount: 1,
            movementTraits: ['Teleporting'],
            positioningTip: 'Stand close during the revival phase so Frostfruits spawn near the boss for Charged Attack knockback.',
            shieldType: 'Cryo',
            shieldUnits: 24,
            prohibitedElements: ['Cryo'],
            recommendedElements: ['Pyro'],
            description: 'Cryo-immune core with reviving frostfruits; rapid Pyro burst essential.',
          },
        },
      },
      {
        chamber: 2,
        firstHalf: {
          enemies: [
            {
              id: 'shadowy-husks',
              name: 'Shadowy Husks & Black Serpent Knights',
              level: 98,
              hp: 1500000,
              baseRes: { ...DEFAULT_RES },
              wave: 1,
              count: 3,
              movementTraits: ['Shield-Punishing', 'Aggressive'],
            },
          ],
          mechanics: {
            favorsAoE: true,
            targetProfile: 'AoE',
            waveCount: 1,
            movementTraits: ['Shield-Punishing', 'Aggressive'],
            punishesShields: true,
            positioningTip: 'Prefer healers or iframe dodging; hitting active player shields heals/buffs the Husks.',
            description: 'Buff themselves upon hitting shields; prioritize dodge or pure healer over shielders.',
          },
        },
        secondHalf: {
          enemies: [
            {
              id: 'setekh-wenut',
              name: 'Setekh Wenut',
              level: 98,
              hp: 2100000,
              baseRes: { ...DEFAULT_RES, Anemo: 60, Physical: 60 },
              weaknessNote: 'Burrows underground; destroy floating Windbite Bullets with swirlable elements',
              wave: 1,
              count: 1,
              movementTraits: ['Burrowing', 'Airborne'],
              targetingNote: 'Hit 2 Windbite Bullets with Pyro/Hydro/Electro/Cryo to crash it and shred matching RES by 45%.',
            },
          ],
          mechanics: {
            targetProfile: 'Single-Target',
            waveCount: 1,
            movementTraits: ['Burrowing', 'Airborne'],
            positioningTip: 'Save main burst for the Windbite stun window; bring ranged/AoE skills to pop bullets reliably.',
            recommendedElements: ['Pyro', 'Hydro', 'Electro', 'Cryo'],
            description: 'Burrowing worm with high base RES; shoot Swirlable element at floating Anemo bullets to paralyze.',
          },
        },
      },
      {
        chamber: 3,
        firstHalf: {
          enemies: [
            {
              id: 'mountain-matus',
              name: 'Local Legend: Mountain Matus',
              level: 100,
              hp: 2500000,
              baseRes: { ...DEFAULT_RES, Geo: 70 },
              shieldType: 'Geo',
              shieldUnits: 30,
              weaknessNote: 'Massive Geo armor; shatter with Geo or Claymore',
              wave: 1,
              count: 1,
              movementTraits: ['Aggressive'],
            },
          ],
          mechanics: {
            targetProfile: 'Single-Target',
            waveCount: 1,
            movementTraits: ['Aggressive'],
            positioningTip: 'Use Geo, Claymore, or Overload plunges to crack armor before committing main DPS burst.',
            shieldType: 'Geo',
            shieldUnits: 30,
            recommendedElements: ['Geo'],
            description: 'Heavy Geo crust barrier; Geo or Claymore user required to crack armor.',
          },
        },
        secondHalf: {
          enemies: [
            {
              id: 'coppelius-dirge',
              name: 'Icewind Suite: Nemesis of Coppelius',
              level: 100,
              hp: 2400000,
              baseRes: { ...DEFAULT_RES, Cryo: 70, Anemo: 70 },
              shieldType: 'Cryo',
              shieldUnits: 16,
              weaknessNote: 'Ousia attacks strip shield immediately; heavy Pyro breaks Cryo barrier',
              wave: 1,
              count: 1,
              movementTraits: ['Aggressive'],
            },
          ],
          mechanics: {
            targetProfile: 'Single-Target',
            waveCount: 1,
            movementTraits: ['Aggressive'],
            positioningTip: 'Strip the Cryo barrier with Pyro or Ousia to interrupt Coppelius’s high-damage frost burst.',
            shieldType: 'Cryo',
            shieldUnits: 16,
            recommendedElements: ['Pyro'],
            description: 'Ousia-aligned Cryo dancer barrier; heavy Pyro or Ousia archetype strips shield instantly.',
          },
        },
      },
    ],
  },
];

/**
 * Validates an Abyss cycle's waves, resistances, shield units, and date bounds.
 * Returns an empty array when valid, or human-readable error strings otherwise.
 */
export function validateAbyssCycleConfig(cycle: AbyssCycleConfig): string[] {
  const errors: string[] = [];

  if (!cycle.id || !cycle.name) {
    errors.push('Cycle must define non-empty id and name.');
  }

  if (
    cycle.effectiveStartDate &&
    cycle.effectiveEndDate &&
    cycle.effectiveStartDate > cycle.effectiveEndDate
  ) {
    errors.push(
      `Cycle ${cycle.id}: effectiveStartDate (${cycle.effectiveStartDate}) is after effectiveEndDate (${cycle.effectiveEndDate}).`,
    );
  }

  if (!cycle.chambers || cycle.chambers.length !== 3) {
    errors.push(`Cycle ${cycle.id}: expected 3 Floor 12 chambers, found ${cycle.chambers?.length ?? 0}.`);
  }

  const seenChambers = new Set<number>();
  for (const ch of cycle.chambers ?? []) {
    if (seenChambers.has(ch.chamber)) {
      errors.push(`Cycle ${cycle.id}: duplicate chamber ${ch.chamber}.`);
    }
    seenChambers.add(ch.chamber);

    const halves: Array<['First Half' | 'Second Half', AbyssChamberHalfConfig]> = [
      ['First Half', ch.firstHalf],
      ['Second Half', ch.secondHalf],
    ];

    for (const [halfLabel, half] of halves) {
      if (!half.enemies || half.enemies.length === 0) {
        errors.push(`Cycle ${cycle.id} C${ch.chamber} ${halfLabel}: must list at least one enemy.`);
      }

      if (half.mechanics.shieldType && (!half.mechanics.shieldUnits || half.mechanics.shieldUnits <= 0)) {
        errors.push(
          `Cycle ${cycle.id} C${ch.chamber} ${halfLabel}: shieldType "${half.mechanics.shieldType}" requires shieldUnits > 0.`,
        );
      }

      for (const enemy of half.enemies) {
        if (enemy.hp <= 0) {
          errors.push(`Cycle ${cycle.id} C${ch.chamber} ${halfLabel} (${enemy.name}): HP must be > 0.`);
        }
        if (enemy.level < 1 || enemy.level > 120) {
          errors.push(`Cycle ${cycle.id} C${ch.chamber} ${halfLabel} (${enemy.name}): invalid level ${enemy.level}.`);
        }
        for (const resKey of ALL_RES_KEYS) {
          const val = enemy.baseRes?.[resKey];
          if (typeof val !== 'number' || Number.isNaN(val) || val < -100 || val > 250) {
            errors.push(
              `Cycle ${cycle.id} C${ch.chamber} ${halfLabel} (${enemy.name}): invalid ${resKey} RES (${String(val)}).`,
            );
          }
          if (
            resKey !== 'Physical' &&
            val >= 100 &&
            !half.mechanics.prohibitedElements?.includes(resKey)
          ) {
            errors.push(
              `Cycle ${cycle.id} C${ch.chamber} ${halfLabel} (${enemy.name}): immune to ${resKey} (RES ${val}) but ${resKey} is missing from prohibitedElements.`,
            );
          }
        }
        if (enemy.shieldType && (!enemy.shieldUnits || enemy.shieldUnits <= 0)) {
          errors.push(
            `Cycle ${cycle.id} C${ch.chamber} ${halfLabel} (${enemy.name}): shieldType "${enemy.shieldType}" requires shieldUnits > 0.`,
          );
        }
      }
    }
  }

  return errors;
}

/**
 * Creates a fresh deep copy of the default Custom Sandbox cycle.
 */
export function createCustomSandboxCycle(): AbyssCycleConfig {
  const base = ABYSS_CYCLES[0]; // Clone from latest active Floor 12 cycle (v7.2)
  return {
    id: 'custom-sandbox',
    version: 'Custom',
    phase: 'Sandbox',
    name: 'Custom Sandbox · Interactive Simulator',
    buffDescription: 'User-configured combat sandbox with custom enemy shields, resistances, and mechanics.',
    isCustom: true,
    chambers: JSON.parse(JSON.stringify(base.chambers)),
  };
}

export function getActiveAbyssCycle(date: Date = new Date()): AbyssCycleConfig {
  const dateStr = date.toISOString().slice(0, 10);
  const matched = ABYSS_CYCLES.find((c) => {
    if (!c.effectiveStartDate || !c.effectiveEndDate) return false;
    return dateStr >= c.effectiveStartDate && dateStr <= c.effectiveEndDate;
  });
  return matched ?? ABYSS_CYCLES[0];
}
