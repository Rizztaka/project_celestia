import type {
  Character,
  Element,
  EncounterTargetProfile,
  EnemyMovementTrait,
} from '../types/genshin';
import { CHARACTERS } from '../data/characters';
import {
  getActiveAbyssCycle,
  type AbyssCycleConfig,
  type AbyssChamberHalfConfig,
} from '../data/abyss-schedules';

export interface AbyssChamberGuide {
  floor: number;
  chamber: number;
  half: 'First Half' | 'Second Half';
  enemies: string[];
  shieldTypes: string[];
  recommendedElements: string[];
  prohibitedElements?: Element[];
  highResWarnings?: string[];
  targetProfile?: EncounterTargetProfile;
  waveCount?: number;
  movementTraits?: EnemyMovementTrait[];
  positioningTip?: string;
  chamberBuff?: string;
  tips: string;
}

function deriveHighResWarnings(half: AbyssChamberHalfConfig): string[] {
  const warnings = new Set<string>();
  const elements: Array<Element | 'Physical'> = [
    'Pyro',
    'Hydro',
    'Anemo',
    'Electro',
    'Dendro',
    'Cryo',
    'Geo',
    'Physical',
  ];

  for (const enemy of half.enemies) {
    for (const el of elements) {
      const res = enemy.baseRes[el] ?? 10;
      if (res >= 100) {
        warnings.add(`${enemy.name}: ${el} Immune`);
      } else if (res >= 40) {
        warnings.add(`${enemy.name}: ${res}% ${el} RES`);
      }
    }
  }
  return Array.from(warnings);
}

function halfConfigToGuide(
  chamberNum: number,
  halfName: 'First Half' | 'Second Half',
  half: AbyssChamberHalfConfig,
): AbyssChamberGuide {
  const shieldSet = new Set<string>();
  if (half.mechanics.shieldType) {
    shieldSet.add(`${half.mechanics.shieldType} Shield`);
  }
  for (const rShield of half.mechanics.rotatingShields ?? []) {
    shieldSet.add(`${rShield} Shield`);
  }
  for (const enemy of half.enemies) {
    if (enemy.shieldType) {
      shieldSet.add(`${enemy.shieldType} Shield`);
    }
  }

  const recElements = [
    ...(half.mechanics.recommendedElements || []),
    ...(half.mechanics.requiresBow ? ['Bow User Required'] : []),
  ];

  const weaknessNotes = half.enemies
    .filter((e) => e.weaknessNote)
    .map((e) => e.weaknessNote)
    .join('. ');

  const tips = half.mechanics.description + (weaknessNotes ? ` ${weaknessNotes}` : '');
  const targetProfile: EncounterTargetProfile =
    half.mechanics.targetProfile ??
    (half.mechanics.favorsAoE || half.enemies.length > 1 ? 'AoE' : 'Single-Target');

  const movementTraits = Array.from(
    new Set([
      ...(half.mechanics.movementTraits ?? []),
      ...half.enemies.flatMap((e) => e.movementTraits ?? []),
    ]),
  );

  const waveCount =
    half.mechanics.waveCount ??
    Math.max(1, ...half.enemies.map((e) => e.wave ?? 1));

  return {
    floor: 12,
    chamber: chamberNum,
    half: halfName,
    enemies: half.enemies.map((e) => e.name),
    shieldTypes: Array.from(shieldSet),
    recommendedElements: recElements,
    prohibitedElements: half.mechanics.prohibitedElements,
    highResWarnings: deriveHighResWarnings(half),
    targetProfile,
    waveCount,
    movementTraits,
    positioningTip: half.mechanics.positioningTip,
    chamberBuff: half.mechanics.chamberBuff?.description,
    tips,
  };
}

export function deriveAbyssChamberGuides(
  cycle: AbyssCycleConfig = getActiveAbyssCycle(),
): AbyssChamberGuide[] {
  const guides: AbyssChamberGuide[] = [];
  for (const c of cycle.chambers) {
    guides.push(halfConfigToGuide(c.chamber, 'First Half', c.firstHalf));
    guides.push(halfConfigToGuide(c.chamber, 'Second Half', c.secondHalf));
  }
  return guides;
}

export const CURRENT_ABYSS_CHAMBERS: AbyssChamberGuide[] = deriveAbyssChamberGuides();

export interface RosterCounterAnalysis {
  chamber: AbyssChamberGuide;
  usableCounters: Character[];
  missingElements: string[];
  verdict: 'Ready to Clear' | 'Caution: Missing Elements';
}

export function analyzeEndgameReadiness(
  ownedIds: string[],
  cycle: AbyssCycleConfig = getActiveAbyssCycle(),
): RosterCounterAnalysis[] {
  const ownedSet = new Set(ownedIds);
  const owned = CHARACTERS.filter((c) => ownedSet.has(c.id));
  const chamberGuides = deriveAbyssChamberGuides(cycle);

  return chamberGuides.map((chamber) => {
    const prohibitedSet = new Set(chamber.prohibitedElements ?? []);
    const usable = owned.filter((c) => {
      if (prohibitedSet.has(c.element)) return false;
      return chamber.recommendedElements.some(
        (elem) =>
          c.element === elem || (elem === 'Bow User Required' && c.weapon === 'Bow'),
      );
    });

    const missing = chamber.recommendedElements.filter((elem) => {
      if (elem === 'Bow User Required') {
        return !owned.some((c) => c.weapon === 'Bow');
      }
      return !owned.some((c) => c.element === elem);
    });

    return {
      chamber,
      usableCounters: usable.slice(0, 5),
      missingElements: missing,
      verdict: missing.length === 0 ? 'Ready to Clear' : 'Caution: Missing Elements',
    };
  });
}
