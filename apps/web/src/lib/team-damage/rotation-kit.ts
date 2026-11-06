import type { RotationStep } from './calculator';

export type RotationRole =
  | 'aura_setup'
  | 'buffer'
  | 'debuffer'
  | 'sub_dps'
  | 'battery'
  | 'driver';

export interface CharacterActionSequence {
  characterKey: string;
  role: RotationRole;
  burstCost: number;
  burstCooldownFrames: number;
  setupSteps: RotationStep[];
  fieldSteps: RotationStep[];
  energyPrerequisite?: {
    minErPercent: number;
    requiresFunnel?: boolean;
  };
}

const step = (
  characterKey: string,
  action: string,
  repeat = 1,
  params = '',
  waitFrames = 0,
): RotationStep => ({
  characterKey,
  action,
  repeat,
  params,
  waitFrames,
});

/**
 * Reviewed rotation kits mapped by canonical formKey (avatarId:depotId).
 * Guaranteed to only use actions valid in pinned engine metadata.
 */
export const reviewedRotationKits: Record<string, CharacterActionSequence> = {
  // Bennett: Burst (Noblesse / ATK buff zone) -> Skill (particle generation)
  '10000032:3201': {
    characterKey: '10000032:3201',
    role: 'buffer',
    burstCost: 60,
    burstCooldownFrames: 900, // 15s
    setupSteps: [
      step('10000032:3201', 'burst'),
      step('10000032:3201', 'skill'),
    ],
    fieldSteps: [],
    energyPrerequisite: { minErPercent: 200 },
  },

  // Xiangling: Burst (Pyronado snapshot) -> Skill (Guoba)
  '10000023:2301': {
    characterKey: '10000023:2301',
    role: 'sub_dps',
    burstCost: 80,
    burstCooldownFrames: 1200, // 20s
    setupSteps: [
      step('10000023:2301', 'burst'),
      step('10000023:2301', 'skill'),
    ],
    fieldSteps: [],
    energyPrerequisite: { minErPercent: 180, requiresFunnel: true },
  },

  // Xingqiu: Burst (Guhua Sword: Raincutter) -> Skill -> Normal Attack to trigger rainsword wave
  '10000025:2501': {
    characterKey: '10000025:2501',
    role: 'sub_dps',
    burstCost: 80,
    burstCooldownFrames: 1200, // 20s
    setupSteps: [
      step('10000025:2501', 'burst'),
      step('10000025:2501', 'skill'),
      step('10000025:2501', 'attack'),
    ],
    fieldSteps: [],
    energyPrerequisite: { minErPercent: 180 },
  },

  // Yelan: Burst (Exquisite Throw) -> Skill (Lingering Lifeline) -> Normal Attack
  '10000060:6001': {
    characterKey: '10000060:6001',
    role: 'sub_dps',
    burstCost: 70,
    burstCooldownFrames: 1080, // 18s
    setupSteps: [
      step('10000060:6001', 'burst'),
      step('10000060:6001', 'skill'),
      step('10000060:6001', 'attack'),
    ],
    fieldSteps: [],
    energyPrerequisite: { minErPercent: 180 },
  },

  // Furina: Skill (Salon Solitaire summons) -> Burst (Fanfare universal damage buff)
  '10000089:8901': {
    characterKey: '10000089:8901',
    role: 'buffer',
    burstCost: 60,
    burstCooldownFrames: 900, // 15s
    setupSteps: [
      step('10000089:8901', 'skill'),
      step('10000089:8901', 'burst'),
    ],
    fieldSteps: [],
    energyPrerequisite: { minErPercent: 160 },
  },

  // Kaedehara Kazuha: Skill -> High Plunge (swirl & grouping) -> Burst (elemental infusion)
  '10000047:4701': {
    characterKey: '10000047:4701',
    role: 'debuffer',
    burstCost: 60,
    burstCooldownFrames: 900, // 15s
    setupSteps: [
      step('10000047:4701', 'skill'),
      step('10000047:4701', 'high_plunge'),
      step('10000047:4701', 'burst'),
    ],
    fieldSteps: [],
    energyPrerequisite: { minErPercent: 160 },
  },

  // Nahida: Skill (Tri-Karma mark) -> Burst (Shrine of Maya EM buff)
  '10000073:7301': {
    characterKey: '10000073:7301',
    role: 'aura_setup',
    burstCost: 50,
    burstCooldownFrames: 810, // 13.5s
    setupSteps: [
      step('10000073:7301', 'skill'),
      step('10000073:7301', 'burst'),
    ],
    fieldSteps: [],
    energyPrerequisite: { minErPercent: 130 },
  },

  // Raiden Shogun: Setup Skill (Eye of Stormy Judgment), later Burst (Musou Shinsetsu combo)
  '10000052:5201': {
    characterKey: '10000052:5201',
    role: 'battery',
    burstCost: 90,
    burstCooldownFrames: 1080, // 18s
    setupSteps: [
      step('10000052:5201', 'skill'),
    ],
    fieldSteps: [
      step('10000052:5201', 'burst'),
      step('10000052:5201', 'attack', 9),
    ],
    energyPrerequisite: { minErPercent: 220 },
  },

  // Hu Tao: Guide to Afterlife E infusion + Charged Attack combo
  '10000046:4601': {
    characterKey: '10000046:4601',
    role: 'driver',
    burstCost: 60,
    burstCooldownFrames: 900, // 15s
    setupSteps: [],
    fieldSteps: [
      step('10000046:4601', 'skill'),
      step('10000046:4601', 'attack', 1),
      step('10000046:4601', 'charge', 1),
      step('10000046:4601', 'attack', 1),
      step('10000046:4601', 'charge', 1),
      step('10000046:4601', 'burst'),
    ],
    energyPrerequisite: { minErPercent: 110 },
  },

  // Zhongli: Dominance Earth Shield (Skill) + Planet Befall Burst
  '10000030:3001': {
    characterKey: '10000030:3001',
    role: 'buffer',
    burstCost: 40,
    burstCooldownFrames: 720, // 12s
    setupSteps: [
      step('10000030:3001', 'skill'),
      step('10000030:3001', 'burst'),
    ],
    fieldSteps: [],
    energyPrerequisite: { minErPercent: 120 },
  },

  // Fischl: Nightrider Skill (Oz summoning)
  '10000031:3101': {
    characterKey: '10000031:3101',
    role: 'sub_dps',
    burstCost: 60,
    burstCooldownFrames: 900,
    setupSteps: [
      step('10000031:3101', 'skill'),
    ],
    fieldSteps: [],
  },

  // Sucrose: Anemo swirl & EM sharing
  '10000043:4301': {
    characterKey: '10000043:4301',
    role: 'debuffer',
    burstCost: 80,
    burstCooldownFrames: 1200,
    setupSteps: [
      step('10000043:4301', 'skill'),
      step('10000043:4301', 'burst'),
    ],
    fieldSteps: [],
    energyPrerequisite: { minErPercent: 180 },
  },
};

/**
 * Resolves the character rotation kit, or synthesizes a safe fallback for unreviewed characters.
 */
export function getCharacterRotationKit(
  characterKey: string,
  _element?: string,
  burstCost = 60,
): CharacterActionSequence {
  const reviewed = reviewedRotationKits[characterKey];
  if (reviewed) {
    return {
      ...reviewed,
      setupSteps: reviewed.setupSteps.map((s) => ({ ...s })),
      fieldSteps: reviewed.fieldSteps.map((s) => ({ ...s })),
    };
  }

  // Safe unreviewed fallback: Skill on setup, Skill + Normal Attacks on field.
  return {
    characterKey,
    role: 'driver',
    burstCost,
    burstCooldownFrames: 900,
    setupSteps: [step(characterKey, 'skill')],
    fieldSteps: [
      step(characterKey, 'skill'),
      step(characterKey, 'attack', 6),
    ],
  };
}
