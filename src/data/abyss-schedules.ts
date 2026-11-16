import type { Element } from '../types/genshin';
import type { ShieldType } from '../engines/combat-mechanics';

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
}

export interface AbyssChamberHalfConfig {
  enemies: AbyssEnemy[];
  mechanics: {
    requiresBow?: boolean;
    favorsNightsoul?: boolean;
    favorsAoE?: boolean;
    shieldType?: ShieldType;
    shieldUnits?: number;
    recommendedElements?: Element[];
    prohibitedElements?: Element[];
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

export const DEFAULT_ACTIVE_ABYSS_CYCLE_ID = 'cycle-7-2';

export const ABYSS_CYCLES: AbyssCycleConfig[] = [
  // Version 7.2 (Active Official Floor 12)
  {
    id: 'cycle-7-2',
    version: '7.2',
    phase: 'Phase 1',
    effectiveStartDate: '2026-11-16',
    effectiveEndDate: '2026-12-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verifiedAt: '2026-11-16',
    name: 'Version 7.2 · Phase 1: Stellar Fracture - Polestar Domain',
    buffDescription:
      'Characters with Polestar alignment or triggering Cryo/Hydro/Electro reactions gain +40% Polestar resonance DMG and +30% CRIT DMG. Triggering Hexerei or Lunar reactions unleashes a Stellar Nova shockwave.',
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
            },
            {
              id: 'eremite-floral-ring-dancer',
              name: 'Eremite Floral Ring-Dancer',
              level: 100,
              hp: 1150000,
              baseRes: { ...DEFAULT_RES, Dendro: 50 },
              weaknessNote: 'High Dendro RES; interrupt spirit summon with sustained heavy hits',
            },
          ],
          mechanics: {
            recommendedElements: ['Cryo', 'Pyro', 'Hydro'],
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
            },
            {
              id: 'pyro-abyss-mage',
              name: 'Pyro Abyss Mage',
              level: 100,
              hp: 420000,
              baseRes: { ...DEFAULT_RES, Pyro: 50 },
              shieldType: 'Pyro',
              shieldUnits: 12,
            },
          ],
          mechanics: {
            shieldType: 'Pyro',
            shieldUnits: 36,
            recommendedElements: ['Hydro', 'Electro'],
            prohibitedElements: ['Pyro'],
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
            },
          ],
          mechanics: {
            favorsAoE: true,
            recommendedElements: ['Pyro', 'Electro', 'Dendro'],
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
            },
          ],
          mechanics: {
            requiresBow: true,
            recommendedElements: ['Hydro', 'Cryo', 'Electro'],
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
            },
          ],
          mechanics: {
            favorsNightsoul: true,
            recommendedElements: ['Pyro', 'Hydro', 'Cryo'],
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
            },
          ],
          mechanics: {
            shieldType: 'Electro',
            shieldUnits: 32,
            recommendedElements: ['Pyro', 'Cryo', 'Dendro'],
            description: 'Sequential elemental barrier; multi-element reaction team required.',
          },
        },
      },
    ],
  },
  // Version 7.1 (Active Official Floor 12)
  {
    id: 'cycle-7-1',
    version: '7.1',
    phase: 'Phase 2',
    name: 'Version 7.1 · Phase 2: Lunar Gleam - Ascendant Radiance',
    buffDescription:
      'Triggering Lunar-Bloom, Lunar-Charged, or Lunar-Crystallize reactions increases active character ATK by 30% and Elemental Mastery by 120. When Moonsign reaches Ascendant Gleam, unleash a Moonburst shockwave.',
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
            },
            {
              id: 'consecrated-flying-serpent',
              name: 'Consecrated Flying Serpent',
              level: 98,
              hp: 1200000,
              baseRes: { ...DEFAULT_RES, Anemo: 40 },
            },
          ],
          mechanics: {
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
            },
          ],
          mechanics: {
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
            },
          ],
          mechanics: {
            favorsAoE: true,
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
            },
          ],
          mechanics: {
            requiresBow: true,
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
            },
          ],
          mechanics: {
            favorsNightsoul: true,
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
            },
          ],
          mechanics: {
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
    name: 'Version 5.3 · Phase 1: Blazing Nightspirit',
    buffDescription:
      'Characters in Nightsoul Blessing or triggering Pyro reactions gain +25% ATK and +30% Elemental DMG for 12s.',
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
            },
            {
              id: 'consecrated-flying-serpent',
              name: 'Consecrated Flying Serpent',
              level: 95,
              hp: 1100000,
              baseRes: { ...DEFAULT_RES, Anemo: 40 },
              weaknessNote: 'High Anemo RES; break energy block with matching element',
            },
          ],
          mechanics: {
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
            },
            {
              id: 'pyro-abyss-mage',
              name: 'Pyro Abyss Mage',
              level: 95,
              hp: 420000,
              baseRes: { ...DEFAULT_RES, Pyro: 50 },
              shieldType: 'Pyro',
              shieldUnits: 12,
            },
          ],
          mechanics: {
            shieldType: 'Pyro',
            shieldUnits: 36,
            recommendedElements: ['Hydro'],
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
              baseRes: { ...DEFAULT_RES, Anemo: 10, Cryo: 10 },
              weaknessNote: 'High burst damage in close proximity; heavy sustain required',
            },
          ],
          mechanics: {
            favorsAoE: true,
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
            },
          ],
          mechanics: {
            requiresBow: true,
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
            },
          ],
          mechanics: {
            favorsNightsoul: true,
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
            },
          ],
          mechanics: {
            favorsNightsoul: true,
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
    name: 'Version 5.2 · Phase 2: Soaring Gales',
    buffDescription:
      'Swirl reactions increase active character CRIT Rate by 15% and CRIT DMG by 30% for 8s; plunging attacks generate a vortex.',
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
            },
          ],
          mechanics: {
            favorsAoE: true,
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
            },
          ],
          mechanics: {
            shieldType: 'Pyro',
            shieldUnits: 32,
            recommendedElements: ['Hydro'],
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
            },
          ],
          mechanics: {
            favorsAoE: true,
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
            },
          ],
          mechanics: {
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
            },
          ],
          mechanics: {
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
            },
          ],
          mechanics: {
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
    name: 'Version 5.1 · Phase 1: Resonant Crystals',
    buffDescription:
      'Crystallize reactions trigger a resonant shockwave dealing True AoE damage; Geo DMG +40%.',
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
            },
          ],
          mechanics: {
            favorsAoE: true,
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
            },
          ],
          mechanics: {
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
            },
          ],
          mechanics: {
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
            },
          ],
          mechanics: {
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
            },
          ],
          mechanics: {
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
            },
          ],
          mechanics: {
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
