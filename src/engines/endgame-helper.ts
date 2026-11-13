import type { Character } from '../types/genshin';
import { CHARACTERS } from '../data/characters';

export interface AbyssChamberGuide {
  floor: number;
  chamber: number;
  half: 'First Half' | 'Second Half';
  enemies: string[];
  shieldTypes: string[];
  recommendedElements: string[];
  tips: string;
}

export const CURRENT_ABYSS_CHAMBERS: AbyssChamberGuide[] = [
  {
    floor: 12,
    chamber: 1,
    half: 'First Half',
    enemies: ['Hydro Phantasm', 'Consecrated Beast'],
    shieldTypes: ['Hydro-Immunity'],
    recommendedElements: ['Dendro', 'Pyro', 'Cryo'],
    tips: 'Enemies have high Hydro resistance and deal aggressive physical/elemental burst damage. Use Dendro Bloom/Spread or Pyro Vaporize/Melt.',
  },
  {
    floor: 12,
    chamber: 1,
    half: 'Second Half',
    enemies: ['Abyss Lector: Fathomless Flames', 'Black Serpent Knights'],
    shieldTypes: ['Pyro Shield'],
    recommendedElements: ['Hydro', 'Electro'],
    tips: 'Bring rapid Hydro shield-breakers like Furina, Yelan, Neuvillette, or Xingqiu to shred the Pyro shield in seconds.',
  },
  {
    floor: 12,
    chamber: 2,
    half: 'First Half',
    enemies: ['Maguu Kenki Trio'],
    shieldTypes: ['Cryo / Anemo Burst'],
    recommendedElements: ['Pyro', 'Dendro', 'Geo'],
    tips: 'Tight grouping is critical. High burst damage teams like Mavuika, Arlecchino, or Navia eliminate all three before high incoming damage bursts.',
  },
  {
    floor: 12,
    chamber: 2,
    half: 'Second Half',
    enemies: ['Aeonblight Drake'],
    shieldTypes: ['Flying / High RES'],
    recommendedElements: ['Bow User Required'],
    tips: 'You MUST bring a Bow user (Yelan, Fischl, Chasca, Citlali, Diona) to shoot down its glowing wing thrusters when it flies.',
  },
  {
    floor: 12,
    chamber: 3,
    half: 'First Half',
    enemies: ['Local Legend: Natlan Wayob / Automaton'],
    shieldTypes: ['Nightspirit Shield'],
    recommendedElements: ['Nightsoul', 'Pyro', 'Dendro'],
    tips: 'Natlan characters (Nefer, Mavuika, Xilonen, Citlali, Kinich) drain Nightspirit shields 300% faster.',
  },
  {
    floor: 12,
    chamber: 3,
    half: 'Second Half',
    enemies: ['Iniquitous Baptist'],
    shieldTypes: ['Electro Shield', 'Pyro Shield', 'Cryo Shield'],
    recommendedElements: ['Hydro', 'Pyro', 'Dendro/Cryo'],
    tips: 'Multi-element team (like Hyperbloom, Rainbow, or International) required to counter the three rotating elemental barriers.',
  },
];

export interface RosterCounterAnalysis {
  chamber: AbyssChamberGuide;
  usableCounters: Character[];
  missingElements: string[];
  verdict: 'Ready to Clear' | 'Caution: Missing Elements';
}

export function analyzeEndgameReadiness(ownedIds: string[]): RosterCounterAnalysis[] {
  const ownedSet = new Set(ownedIds);
  const owned = CHARACTERS.filter((c) => ownedSet.has(c.id));

  return CURRENT_ABYSS_CHAMBERS.map((chamber) => {
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
