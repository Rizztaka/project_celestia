// ADR-0011 compliant: pure math, no string literals.
import type { CharacterInput } from '../character-intelligence/character-intelligence.calculator.js';

export type { CharacterInput };

// -------------------------------------------------------
// Types
// -------------------------------------------------------

export type InsightKey =
  | 'ELEMENTAL_SPECIALIST'
  | 'TALENT_NEGLECTOR'
  | 'ARTIFACT_HOARDER'
  | 'MAX_CONSTELLATION'
  | 'DIVERSE_ROSTER';

export interface KnowledgeInsightData {
  key: InsightKey;
  /** Primary subject — e.g., the dominant element, the neglected character name */
  subject: string;
  /** Supporting numeric value for the explainer to use */
  value: number;
  /** Optional secondary value */
  valueAlt?: number;
}

// -------------------------------------------------------
// Individual insight calculators
// -------------------------------------------------------

/**
 * ELEMENTAL_SPECIALIST
 * Detects if the user has heavily invested in one element.
 * "Heavily" = that element accounts for ≥ 40% of ascension-6 characters.
 *
 * @returns insight if threshold met, null otherwise.
 */
export function detectElementalSpecialist(
  roster: CharacterInput[],
  elementMap: Record<string, string>,
): KnowledgeInsightData | null {
  const fullyBuilt = roster.filter((c) => c.ascension >= 6);
  if (fullyBuilt.length < 2) return null;

  const counts: Record<string, number> = {};
  for (const char of fullyBuilt) {
    const element = elementMap[char.characterKey] ?? 'Unknown';
    if (element === 'Unknown' || element === 'Adaptive') continue;
    counts[element] = (counts[element] ?? 0) + 1;
  }

  let topElement = '';
  let topCount = 0;
  for (const [el, cnt] of Object.entries(counts)) {
    if (cnt > topCount) {
      topCount = cnt;
      topElement = el;
    }
  }

  const pct = Math.round((topCount / fullyBuilt.length) * 100);
  if (pct < 40) return null;

  return { key: 'ELEMENTAL_SPECIALIST', subject: topElement, value: pct };
}

/**
 * TALENT_NEGLECTOR
 * Finds the most-neglected character: ascended to 6 but all talents ≤ 4.
 */
export function detectTalentNeglector(roster: CharacterInput[]): KnowledgeInsightData | null {
  const neglected = roster.filter(
    (c) => c.ascension >= 6 && c.talentNormal <= 4 && c.talentSkill <= 4 && c.talentBurst <= 4,
  );

  if (neglected.length === 0) return null;

  // Pick the one with highest level (most "obvious" neglect)
  const worst = neglected.reduce((a, b) => (a.level > b.level ? a : b));
  const avgTalent = Math.round((worst.talentNormal + worst.talentSkill + worst.talentBurst) / 3);

  return {
    key: 'TALENT_NEGLECTOR',
    subject: worst.characterKey,
    value: avgTalent,
    valueAlt: neglected.length,
  };
}

/**
 * ARTIFACT_HOARDER
 * Counts how many artifacts are in inventory (unequipped).
 * Threshold: > 50 unequipped artifacts.
 */
export function detectArtifactHoarder(
  totalArtifactCount: number,
  equippedArtifactCount: number,
): KnowledgeInsightData | null {
  const unequipped = totalArtifactCount - equippedArtifactCount;
  if (unequipped < 50) return null;

  return {
    key: 'ARTIFACT_HOARDER',
    subject: 'artifacts',
    value: unequipped,
    valueAlt: totalArtifactCount,
  };
}

/**
 * MAX_CONSTELLATION
 * Detects if the user has any C6 character.
 */
export function detectMaxConstellation(roster: CharacterInput[]): KnowledgeInsightData | null {
  const c6 = roster.filter((c) => c.constellation === 6);
  if (c6.length === 0) return null;

  // Pick the most-invested c6 by ascension then level
  const top = c6.reduce((a, b) => {
    if (a.ascension !== b.ascension) return a.ascension > b.ascension ? a : b;
    return a.level > b.level ? a : b;
  });

  return {
    key: 'MAX_CONSTELLATION',
    subject: top.characterKey,
    value: c6.length,
  };
}

/**
 * DIVERSE_ROSTER
 * Counts how many unique elements the user has built characters in (ascension >= 4).
 * Triggers when ≥ 5 unique elements are represented.
 */
export function detectDiverseRoster(
  roster: CharacterInput[],
  elementMap: Record<string, string>,
): KnowledgeInsightData | null {
  const built = roster.filter((c) => c.ascension >= 4);
  const elements = new Set<string>();
  for (const char of built) {
    const el = elementMap[char.characterKey];
    if (el && el !== 'Unknown' && el !== 'Adaptive') elements.add(el);
  }

  if (elements.size < 5) return null;

  return {
    key: 'DIVERSE_ROSTER',
    subject: [...elements].sort().join(', '),
    value: elements.size,
  };
}

// -------------------------------------------------------
// Main export — runs all analyzers and returns found insights
// -------------------------------------------------------

/**
 * Runs all insight analyzers and returns every triggered insight.
 * The service layer is responsible for selecting/sampling from these.
 *
 * ADR-0011 compliant: pure math, no string generation.
 */
export function runAllAnalyzers(
  roster: CharacterInput[],
  elementMap: Record<string, string>,
  totalArtifactCount: number,
  equippedArtifactCount: number,
): KnowledgeInsightData[] {
  const insights: KnowledgeInsightData[] = [];

  const specialist = detectElementalSpecialist(roster, elementMap);
  if (specialist) insights.push(specialist);

  const neglector = detectTalentNeglector(roster);
  if (neglector) insights.push(neglector);

  const hoarder = detectArtifactHoarder(totalArtifactCount, equippedArtifactCount);
  if (hoarder) insights.push(hoarder);

  const c6 = detectMaxConstellation(roster);
  if (c6) insights.push(c6);

  const diverse = detectDiverseRoster(roster, elementMap);
  if (diverse) insights.push(diverse);

  return insights;
}
