import type { Character, Element } from '../types/genshin';

export type ShieldType = Element | 'Nightspirit' | 'Geo' | 'Phlogiston';

export interface ShieldBreakResult {
  seconds: number;
  rating: 'Fast' | 'Medium' | 'Slow' | 'Ineffective';
  breakdown: string;
  effectiveRate: number;
}

export interface CharacterGaugeRate {
  element: Element;
  guPerSec: number;
  isNightsoul?: boolean;
}

export const NATLAN_NIGHTSOUL_IDS = new Set<string>([
  'Mavuika',
  'Xilonen',
  'Citlali',
  'Kinich',
  'Chasca',
  'Kachina',
  'Mualani',
  'Ororon',
  'Iansan',
  'Ifa',
  'LanYan',
  'YumemizukiMizuki',
  'Varesa',
  'Ineffa',
  'Escoffier',
  'Dahlia',
  'Skirk',
]);

/**
 * Checks whether a character possesses Natlan Nightsoul mechanics.
 */
export function isNightsoulCharacter(
  char: Pick<Character, 'id'> & { tags?: string[] },
): boolean {
  return NATLAN_NIGHTSOUL_IDS.has(char.id) || (char.tags?.includes('Nightsoul') ?? false);
}

/**
 * Elemental Gauge Application Rates (GU/s).
 * Incorporates typical rotation uptime, internal cooldowns (ICD), and off-field triggers.
 */
export const CHARACTER_GAUGE_RATES: Record<string, CharacterGaugeRate> = {
  // Hydro
  Xingqiu: { element: 'Hydro', guPerSec: 2.5 },
  Yelan: { element: 'Hydro', guPerSec: 1.5 },
  Furina: { element: 'Hydro', guPerSec: 1.3 },
  SangonomiyaKokomi: { element: 'Hydro', guPerSec: 1.2 },
  Neuvillette: { element: 'Hydro', guPerSec: 1.2 },
  Tartaglia: { element: 'Hydro', guPerSec: 2.0 },
  KamisatoAyato: { element: 'Hydro', guPerSec: 1.4 },
  Mona: { element: 'Hydro', guPerSec: 1.0 },
  Barbara: { element: 'Hydro', guPerSec: 0.8 },
  Candace: { element: 'Hydro', guPerSec: 0.8 },
  Sigewinne: { element: 'Hydro', guPerSec: 0.8 },
  Mualani: { element: 'Hydro', guPerSec: 1.2, isNightsoul: true },

  // Pyro
  Xiangling: { element: 'Pyro', guPerSec: 2.2 },
  Bennett: { element: 'Pyro', guPerSec: 1.0 },
  HuTao: { element: 'Pyro', guPerSec: 1.8 },
  Arlecchino: { element: 'Pyro', guPerSec: 1.5 },
  Yoimiya: { element: 'Pyro', guPerSec: 1.2 },
  Mavuika: { element: 'Pyro', guPerSec: 2.0, isNightsoul: true },
  Lyney: { element: 'Pyro', guPerSec: 1.3 },
  Yanfei: { element: 'Pyro', guPerSec: 1.4 },
  Klee: { element: 'Pyro', guPerSec: 2.2 },
  Diluc: { element: 'Pyro', guPerSec: 1.2 },
  Gaming: { element: 'Pyro', guPerSec: 1.1 },
  Thoma: { element: 'Pyro', guPerSec: 1.0 },
  Dehya: { element: 'Pyro', guPerSec: 0.8 },
  Chevreuse: { element: 'Pyro', guPerSec: 0.8 },

  // Cryo
  KamisatoAyaka: { element: 'Cryo', guPerSec: 2.5 },
  Ganyu: { element: 'Cryo', guPerSec: 1.5 },
  Shenhe: { element: 'Cryo', guPerSec: 1.0 },
  Wriothesley: { element: 'Cryo', guPerSec: 1.4 },
  Citlali: { element: 'Cryo', guPerSec: 1.6, isNightsoul: true },
  Rosaria: { element: 'Cryo', guPerSec: 1.2 },
  Kaeya: { element: 'Cryo', guPerSec: 1.3 },
  Layla: { element: 'Cryo', guPerSec: 1.0 },
  Diona: { element: 'Cryo', guPerSec: 0.8 },
  Chongyun: { element: 'Cryo', guPerSec: 1.0 },
  Escoffier: { element: 'Cryo', guPerSec: 1.5, isNightsoul: true },

  // Electro
  Fischl: { element: 'Electro', guPerSec: 2.0 },
  RaidenShogun: { element: 'Electro', guPerSec: 1.4 },
  YaeMiko: { element: 'Electro', guPerSec: 1.4 },
  KukiShinobu: { element: 'Electro', guPerSec: 1.0 },
  Clorinde: { element: 'Electro', guPerSec: 1.8 },
  Cyno: { element: 'Electro', guPerSec: 1.4 },
  Keqing: { element: 'Electro', guPerSec: 1.6 },
  Beidou: { element: 'Electro', guPerSec: 1.2 },
  Ororon: { element: 'Electro', guPerSec: 1.2, isNightsoul: true },
  Iansan: { element: 'Electro', guPerSec: 1.4, isNightsoul: true },
  Dori: { element: 'Electro', guPerSec: 0.9 },
  Razor: { element: 'Electro', guPerSec: 1.0 },

  // Dendro
  Nahida: { element: 'Dendro', guPerSec: 2.0 },
  Alhaitham: { element: 'Dendro', guPerSec: 1.8 },
  Kinich: { element: 'Dendro', guPerSec: 1.6, isNightsoul: true },
  Emilie: { element: 'Dendro', guPerSec: 1.4 },
  Baizhu: { element: 'Dendro', guPerSec: 1.0 },
  Tighnari: { element: 'Dendro', guPerSec: 1.4 },
  Yaoyao: { element: 'Dendro', guPerSec: 1.2 },
  Collei: { element: 'Dendro', guPerSec: 1.2 },
  Kirara: { element: 'Dendro', guPerSec: 0.9 },
  Kaveh: { element: 'Dendro', guPerSec: 1.0 },

  // Geo
  Zhongli: { element: 'Geo', guPerSec: 1.0 },
  Navia: { element: 'Geo', guPerSec: 1.5 },
  Xilonen: { element: 'Geo', guPerSec: 1.4, isNightsoul: true },
  Chiori: { element: 'Geo', guPerSec: 1.4 },
  AratakiItto: { element: 'Geo', guPerSec: 1.4 },
  Albedo: { element: 'Geo', guPerSec: 1.0 },
  Kachina: { element: 'Geo', guPerSec: 1.2, isNightsoul: true },
  Ningguang: { element: 'Geo', guPerSec: 1.2 },
  Noelle: { element: 'Geo', guPerSec: 1.0 },
  Gorou: { element: 'Geo', guPerSec: 0.6 },
  YunJin: { element: 'Geo', guPerSec: 0.6 },

  // Anemo
  KaedeharaKazuha: { element: 'Anemo', guPerSec: 1.8 },
  Sucrose: { element: 'Anemo', guPerSec: 1.6 },
  Venti: { element: 'Anemo', guPerSec: 2.0 },
  Wanderer: { element: 'Anemo', guPerSec: 1.5 },
  Chasca: { element: 'Anemo', guPerSec: 1.6, isNightsoul: true },
  Xianyun: { element: 'Anemo', guPerSec: 1.0 },
  Xiao: { element: 'Anemo', guPerSec: 1.2 },
  Jean: { element: 'Anemo', guPerSec: 1.0 },
  ShikanoinHeizou: { element: 'Anemo', guPerSec: 1.2 },
  Lynette: { element: 'Anemo', guPerSec: 1.0 },
  Faruzan: { element: 'Anemo', guPerSec: 1.0 },
  Sayu: { element: 'Anemo', guPerSec: 0.8 },
};

/**
 * Returns gauge rate specification for any character, falling back to weapon/element baselines.
 */
export function getCharacterGaugeRate(character: Character): {
  element: Element;
  guPerSec: number;
  isNightsoul: boolean;
} {
  const custom = CHARACTER_GAUGE_RATES[character.id];
  const isNightsoul = isNightsoulCharacter(character);

  if (custom) {
    return {
      element: custom.element,
      guPerSec: custom.guPerSec,
      isNightsoul: custom.isNightsoul ?? isNightsoul,
    };
  }

  // Fallback estimation
  const guPerSec = character.weapon === 'Catalyst' ? 1.0 : 0.8;
  return {
    element: character.element,
    guPerSec,
    isNightsoul,
  };
}

/**
 * Standard KeqingMains piecewise enemy resistance curve.
 * 
 * Effective resistance = (Base RES - RES Shred) / 100
 * - If effectiveRes < 0:      Multiplier = 1 - (effectiveRes / 2)  [Half shred effect in negative]
 * - If 0 <= effectiveRes <= 0.75: Multiplier = 1 - effectiveRes        [Linear 1-to-1 damage reduction]
 * - If effectiveRes > 0.75:   Multiplier = 1 / (4 * effectiveRes + 1) [Extreme resistance diminishing decay]
 */
export function calculateEffectiveResMultiplier(baseRes: number, shred: number): number {
  const safeBase = Number.isFinite(baseRes) ? baseRes : 10;
  const safeShred = Number.isFinite(shred) ? shred : 0;
  const effectiveRes = (safeBase - safeShred) / 100;
  if (effectiveRes < 0) {
    return 1 - effectiveRes / 2;
  }
  if (effectiveRes <= 0.75) {
    return 1 - effectiveRes;
  }
  return 1 / (4 * effectiveRes + 1);
}

/**
 * Elemental reaction multiplier against specific shield types.
 */
export function getShieldReactionMultiplier(
  shieldType: ShieldType,
  attacker: { element: Element; weapon?: string; isNightsoul?: boolean },
): number {
  const { element, weapon, isNightsoul } = attacker;

  // Natlan Nightspirit Ward or Phlogiston Barrier
  if (shieldType === 'Nightspirit' || shieldType === 'Phlogiston') {
    // Natlan characters apply a 3.0x multiplier to Nightspirit ward gauge depletion
    return isNightsoul ? 3.0 : 1.0;
  }

  if (shieldType === 'Pyro') {
    if (element === 'Hydro') return 2.0; // Vaporize 2x
    if (element === 'Electro') return 1.0; // Overload
    if (element === 'Cryo') return 0.5; // Melt reverse
    if (element === 'Anemo' || element === 'Geo') return 0.5;
    return 0.0; // Pyro / Dendro ineffective
  }

  if (shieldType === 'Hydro') {
    if (element === 'Dendro') return 2.0; // Bloom 2x
    if (element === 'Cryo') return 1.0; // Freeze
    if (element === 'Electro') return 1.0; // Electro-Charged
    if (element === 'Pyro') return 0.5; // Vaporize reverse
    if (element === 'Anemo' || element === 'Geo') return 0.5;
    return 0.0; // Hydro immune
  }

  if (shieldType === 'Cryo') {
    if (element === 'Pyro') return 2.0; // Melt 2x
    if (element === 'Electro') return 1.0; // Superconduct
    if (element === 'Geo' || weapon === 'Claymore') return 1.5; // Shatter / Heavy blunt
    if (element === 'Anemo') return 0.5;
    return 0.0; // Cryo immune, Hydro/Dendro ineffective
  }

  if (shieldType === 'Electro') {
    if (element === 'Pyro') return 1.0; // Overload
    if (element === 'Cryo') return 1.0; // Superconduct
    if (element === 'Dendro') return 1.0; // Quicken
    if (element === 'Hydro') return 0.8; // Electro-Charged
    if (element === 'Anemo' || element === 'Geo') return 0.5;
    return 0.0; // Electro immune
  }

  if (shieldType === 'Geo') {
    if (element === 'Geo') return 2.0; // Heavy Geo
    if (weapon === 'Claymore') return 1.5; // Claymore blunt
    return 0.2; // Minor elemental chip
  }

  if (shieldType === 'Dendro') {
    if (element === 'Pyro') return 2.0; // Burning
    if (element === 'Electro' || element === 'Hydro') return 1.0;
    if (element === 'Anemo' || element === 'Geo') return 0.5;
    return 0.0; // Dendro immune
  }

  if (shieldType === 'Anemo') {
    if (['Pyro', 'Hydro', 'Electro', 'Cryo'].includes(element)) return 1.0;
    if (element === 'Geo') return 0.5;
    return 0.0;
  }

  return 0.0;
}

/**
 * Calculates time (seconds) and efficiency rating for breaking a shield with given Gauge Units.
 */
export function calculateShieldBreakTime(
  shieldType: ShieldType,
  shieldUnits: number,
  teamMembers: Character[],
): ShieldBreakResult {
  if (!Number.isFinite(shieldUnits) || shieldUnits <= 0) {
    return {
      seconds: 0,
      rating: 'Fast',
      breakdown: shieldUnits === 0 ? 'No shield active' : 'Shield already broken',
      effectiveRate: 0,
    };
  }

  if (!teamMembers || teamMembers.length === 0) {
    return {
      seconds: Infinity,
      rating: 'Ineffective',
      breakdown: 'No characters in team',
      effectiveRate: 0,
    };
  }

  let totalEffectiveRate = 0;
  const contributorList: string[] = [];

  for (const member of teamMembers) {
    const rateInfo = getCharacterGaugeRate(member);
    const reactionMult = getShieldReactionMultiplier(shieldType, {
      element: rateInfo.element,
      weapon: member.weapon,
      isNightsoul: rateInfo.isNightsoul,
    });

    const memberEffectiveRate = rateInfo.guPerSec * reactionMult;
    if (memberEffectiveRate > 0) {
      totalEffectiveRate += memberEffectiveRate;
      contributorList.push(`${member.name}: ${memberEffectiveRate.toFixed(1)} GU/s`);
    }
  }

  if (totalEffectiveRate <= 0.05) {
    return {
      seconds: Infinity,
      rating: 'Ineffective',
      breakdown: 'No effective shield-breaking elements in team',
      effectiveRate: 0,
    };
  }

  const rawSeconds = shieldUnits / totalEffectiveRate;
  const seconds = Math.round(rawSeconds * 10) / 10;

  let rating: 'Fast' | 'Medium' | 'Slow' | 'Ineffective';
  if (seconds <= 6.0) {
    rating = 'Fast';
  } else if (seconds <= 15.0) {
    rating = 'Medium';
  } else if (seconds <= 35.0) {
    rating = 'Slow';
  } else {
    rating = 'Ineffective';
  }

  const breakdown = contributorList.length > 0
    ? contributorList.join(', ')
    : 'Ineffective';

  return {
    seconds,
    rating,
    breakdown,
    effectiveRate: Math.round(totalEffectiveRate * 10) / 10,
  };
}

/**
 * Computes estimated team RES shred for an element.
 */
export function calculateTeamResShred(
  teamMembers: Character[],
  targetElement?: Element | 'Physical',
): { totalShred: number; sources: string[] } {
  let totalShred = 0;
  const sources: string[] = [];

  const memberIds = new Set(teamMembers.map((m) => m.id));

  // Anemo 4pc Viridescent Venerer (40% shred for swirlable elements)
  const hasAnemo = teamMembers.some((m) => m.element === 'Anemo');
  if (hasAnemo) {
    if (!targetElement || ['Pyro', 'Hydro', 'Electro', 'Cryo'].includes(targetElement)) {
      totalShred += 40;
      sources.push('4pc VV (-40%)');
    }
  }

  // Zhongli Dominance Mineral (-20% all elemental & phys)
  if (memberIds.has('Zhongli')) {
    totalShred += 20;
    sources.push('Zhongli Shield (-20%)');
  }

  // Xilonen Source Samples (-36% RES shred for PECH elements)
  if (memberIds.has('Xilonen')) {
    if (!targetElement || ['Pyro', 'Hydro', 'Electro', 'Cryo', 'Geo'].includes(targetElement)) {
      totalShred += 36;
      sources.push('Xilonen Source Samples (-36%)');
    }
  }

  // Chevreuse (-40% Pyro & Electro if pure Pyro/Electro team)
  if (memberIds.has('Chevreuse')) {
    const isPurePyroElectro = teamMembers.length > 0 &&
      teamMembers.every((m) => m.element === 'Pyro' || m.element === 'Electro');
    if (isPurePyroElectro && (!targetElement || targetElement === 'Pyro' || targetElement === 'Electro')) {
      totalShred += 40;
      sources.push('Chevreuse Overload (-40%)');
    }
  }

  // Shenhe (-15% Cryo & Phys)
  if (memberIds.has('Shenhe') && (!targetElement || targetElement === 'Cryo')) {
    totalShred += 15;
    sources.push('Shenhe Burst (-15%)');
  }

  // Faruzan (-30% Anemo)
  if (memberIds.has('Faruzan') && (!targetElement || targetElement === 'Anemo')) {
    totalShred += 30;
    sources.push('Faruzan Burst (-30%)');
  }

  // 4pc Deepwood Memories (-30% Dendro RES if Dendro character present)
  const hasDendro = teamMembers.some((m) => m.element === 'Dendro');
  if (hasDendro && (!targetElement || targetElement === 'Dendro')) {
    totalShred += 30;
    sources.push('4pc Deepwood (-30%)');
  }

  // Geo Resonance (-20% Geo RES if 2+ Geo characters in team)
  const geoCount = teamMembers.filter((m) => m.element === 'Geo').length;
  if (geoCount >= 2 && (!targetElement || targetElement === 'Geo')) {
    totalShred += 20;
    sources.push('Geo Resonance (-20%)');
  }

  // Superconduct (-40% Physical RES if Electro + Cryo)
  const hasElectro = teamMembers.some((m) => m.element === 'Electro');
  const hasCryo = teamMembers.some((m) => m.element === 'Cryo');
  if (hasElectro && hasCryo && (!targetElement || targetElement === 'Physical')) {
    totalShred += 40;
    sources.push('Superconduct (-40%)');
  }

  return { totalShred, sources };
}
