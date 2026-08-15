/**
 * Frontend static helpers for the Farming Planner (Milestone 3B).
 *
 * These are pure utility functions — no React, no side effects.
 * They convert raw backend values (phase numbers, goal types, material keys)
 * into human-readable display strings.
 */

import type { GoalType, TalentType } from './api';

// -------------------------------------------------------
// Phase → level display label
// -------------------------------------------------------

/** Maps ascension phase (0–6) to the character level cap it unlocks. */
const PHASE_TO_LEVEL: Record<number, number> = {
  0: 20,
  1: 40,
  2: 50,
  3: 60,
  4: 70,
  5: 80,
  6: 90,
};

export function phasesToLevelRange(fromPhase: number, toPhase: number): string {
  const from = PHASE_TO_LEVEL[fromPhase] ?? fromPhase;
  const to = PHASE_TO_LEVEL[toPhase] ?? toPhase;
  return `Lv. ${from} → ${to}`;
}

// -------------------------------------------------------
// Goal type → display label
// -------------------------------------------------------

export function goalTypeLabel(type: GoalType, talentType: TalentType | null): string {
  switch (type) {
    case 'CHARACTER_ASCENSION':
      return 'Ascension';
    case 'WEAPON_ASCENSION':
      return 'Ascension';
    case 'CHARACTER_TALENT': {
      const talent =
        talentType === 'normal'
          ? 'Normal Atk'
          : talentType === 'skill'
            ? 'Elemental Skill'
            : talentType === 'burst'
              ? 'Elemental Burst'
              : 'Talent';
      return talent;
    }
  }
}

// -------------------------------------------------------
// Material key → category + display name
// -------------------------------------------------------

export type MaterialCategory =
  | 'Boss'
  | 'Boss Weekly'
  | 'Talent Book'
  | 'Local Specialty'
  | 'Common'
  | 'Gem'
  | 'Billet'
  | 'Crown'
  | 'Other';

export const CATEGORY_COLORS: Record<MaterialCategory, string> = {
  Boss: 'bg-red-500/20 text-red-300 border-red-500/30',
  'Boss Weekly': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Talent Book': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'Local Specialty': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Common: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  Gem: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Billet: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  Crown: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
  Other: 'bg-zinc-700/20 text-zinc-400 border-zinc-700/30',
};

/** Known suffix patterns for categorisation. Order matters — more specific first. */
const GEM_SUFFIXES = ['Sliver', 'Fragment', 'Chunk', 'Gemstone'];
const BILLET_SUFFIXES = ['Billet', 'Prism'];
const BOOK_PREFIXES = [
  'Teachings',
  'Guides',
  'Philosophies',
  'FreedomBook',
  'BalladBook',
  'ResistanceBook',
  'TransienceBook',
  'EleganceBook',
  'LightBook',
  'ProsperityBook',
  'DiligenceBook',
  'GoldBook',
  'IngenuityBook',
  'PraxisBook',
  'AdmonitionBook',
  'OrderBook',
  'JusticeBook',
  'KindlingBook',
];

export function categoriseMaterial(itemKey: string): MaterialCategory {
  if (itemKey === 'CrownOfInsight') return 'Crown';
  if (GEM_SUFFIXES.some((s) => itemKey.endsWith(s))) return 'Gem';
  if (BILLET_SUFFIXES.some((s) => itemKey.includes(s))) return 'Billet';
  if (BOOK_PREFIXES.some((p) => itemKey.startsWith(p))) return 'Talent Book';

  // Heuristics for remaining categories
  if (
    /Jade|Branch|Pillar|Seed|Heart|Mirror|Debris|Core|Wing|Fang|Fin|Tusk|Bead|Shard|Feather|Eye|Claw|Plume|Storm|Icicle|Scale|Orb|Stone/.test(
      itemKey,
    )
  )
    return 'Boss';
  if (
    /Boreas|Caeli|Malphas|Dvalin|Childe|Signora|Shouki|Apep|Male|Female|Strings|Mudraa|General/.test(
      itemKey,
    )
  )
    return 'Boss Weekly';
  if (
    /Flower|Lotus|Berry|Mushroom|Radish|Mint|Pinecone|Crab|Lizard|Seagrass|Sakura|Lumi|Lapis/.test(
      itemKey,
    )
  )
    return 'Local Specialty';

  return 'Common';
}

/**
 * Converts a camelCase material key to a human-readable display name.
 * e.g. "AgnidusAgateFragment" → "Agnidus Agate Fragment"
 *      "TeachingsOfBallad"    → "Teachings Of Ballad"
 */
export function materialDisplayName(itemKey: string): string {
  return itemKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/^_/, '')
    .trim();
}
