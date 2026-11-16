import type { Character } from '../types/genshin';
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
  tips: string;
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

  return {
    floor: 12,
    chamber: chamberNum,
    half: halfName,
    enemies: half.enemies.map((e) => e.name),
    shieldTypes: Array.from(shieldSet),
    recommendedElements: recElements,
    tips,
  };
}

export function deriveAbyssChamberGuides(cycle: AbyssCycleConfig = getActiveAbyssCycle()): AbyssChamberGuide[] {
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
    const usable = owned.filter((c) =>
      chamber.recommendedElements.some(
        (elem) => c.element === elem || (elem === 'Bow User Required' && c.weapon === 'Bow'),
      ),
    );

    const missing = chamber.recommendedElements.filter(
      (elem) =>
        elem !== 'Bow User Required' &&
        !owned.some((c) => c.element === elem),
    );

    return {
      chamber,
      usableCounters: usable.slice(0, 5),
      missingElements: missing,
      verdict: missing.length === 0 ? 'Ready to Clear' : 'Caution: Missing Elements',
    };
  });
}
