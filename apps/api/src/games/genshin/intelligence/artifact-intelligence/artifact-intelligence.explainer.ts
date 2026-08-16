import type {
  ArtifactInput,
  ArtifactScoreBreakdown,
  ArtifactWeightProfile,
} from './artifact-intelligence.calculator.js';

// -------------------------------------------------------
// Internal helpers
// -------------------------------------------------------

function toDisplayName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').trim();
}

function toStatName(key: string): string {
  const map: Record<string, string> = {
    critRate_: 'Crit Rate',
    critDMG_: 'Crit DMG',
    enerRech_: 'Energy Recharge',
    eleMas: 'Elemental Mastery',
    hp_: 'HP%',
    atk_: 'ATK%',
    def_: 'DEF%',
    hp: 'Flat HP',
    atk: 'Flat ATK',
    def: 'Flat DEF',
    pyro_dmg_: 'Pyro DMG Bonus',
    hydro_dmg_: 'Hydro DMG Bonus',
    electro_dmg_: 'Electro DMG Bonus',
    cryo_dmg_: 'Cryo DMG Bonus',
    anemo_dmg_: 'Anemo DMG Bonus',
    geo_dmg_: 'Geo DMG Bonus',
    dendro_dmg_: 'Dendro DMG Bonus',
    phys_dmg_: 'Physical DMG Bonus',
    heal_: 'Healing Bonus',
  };
  return map[key] ?? key;
}

// -------------------------------------------------------
// Public API
// -------------------------------------------------------

/**
 * Pure function: Translates an ArtifactScoreBreakdown into human-readable bullets.
 */
export function explainArtifactScore(
  characterKey: string,
  breakdown: ArtifactScoreBreakdown,
  profile: ArtifactWeightProfile,
  equippedArtifacts: ArtifactInput[],
): string[] {
  const explanations: string[] = [];
  const name = toDisplayName(characterKey);
  const aes = breakdown.artifactEfficiencyScore;

  // 1. Overall summary
  if (aes === 0) {
    explanations.push(`${name} currently has no artifacts equipped.`);
    return explanations; // Fast exit if completely empty
  } else {
    explanations.push(
      `${name}'s equipped artifacts average ${aes}/100 efficiency — well below the recommended 60+ threshold.`,
    );
  }

  // 2. Missing slot check
  const missingSlots = ['flower', 'plume', 'sands', 'goblet', 'circlet'].filter(
    (slot) => !equippedArtifacts.some((a) => a.slotKey === slot),
  );
  if (missingSlots.length > 0) {
    const slotNames = missingSlots.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
    explanations.push(`Missing artifacts in: ${slotNames}. Equipping any 5★ piece here will instantly improve the build.`);
  }

  // 3. Find highest priority stats for context
  const topStats = Object.entries(profile.subStatWeights)
    .sort(([, wA], [, wB]) => wB - wA)
    .slice(0, 3)
    .filter(([, w]) => w >= 0.7)
    .map(([k]) => toStatName(k));

  if (topStats.length > 0) {
    explanations.push(`This character's highest priority sub-stats are: ${topStats.join(', ')}.`);
  }

  // 4. Worst slot analysis
  let worstSlot: { key: string; score: number } | null = null;
  let bestSlot: { key: string; score: number } | null = null;

  for (const [slotKey, slotBreakdown] of Object.entries(breakdown.slotScores)) {
    // Only consider equipped slots for worst/best
    if (equippedArtifacts.some((a) => a.slotKey === slotKey)) {
      if (!worstSlot || slotBreakdown.slotScore < worstSlot.score) {
        worstSlot = { key: slotKey, score: slotBreakdown.slotScore };
      }
      if (!bestSlot || slotBreakdown.slotScore > bestSlot.score) {
        bestSlot = { key: slotKey, score: slotBreakdown.slotScore };
      }
    }
  }

  if (worstSlot && worstSlot.score < 50) {
    const capitalizedSlot = worstSlot.key.charAt(0).toUpperCase() + worstSlot.key.slice(1);
    explanations.push(`The ${capitalizedSlot} is currently the weakest piece (Score: ${worstSlot.score}/100). Focus on replacing this first.`);
  }

  // 5. Wrong main stat detection (only on Sands, Goblet, Circlet)
  for (const slotKey of ['sands', 'goblet', 'circlet'] as const) {
    const artifact = equippedArtifacts.find((a) => a.slotKey === slotKey);
    const validMainStats = profile.mainStatPriority[slotKey];
    
    if (artifact && validMainStats && validMainStats.length > 0) {
      if (!validMainStats.includes(artifact.mainStatKey)) {
        const capitalizedSlot = slotKey.charAt(0).toUpperCase() + slotKey.slice(1);
        const desiredStr = validMainStats.map(toStatName).join(' or ');
        const currentStr = toStatName(artifact.mainStatKey);
        explanations.push(`The ${capitalizedSlot} has a ${currentStr} main stat. Switching to ${desiredStr} would yield a significant damage increase.`);
      }
    }
  }

  // 6. Positive reinforcement (Best slot)
  if (bestSlot && bestSlot.score >= 70) {
    const capitalizedSlot = bestSlot.key.charAt(0).toUpperCase() + bestSlot.key.slice(1);
    explanations.push(`On a positive note, the ${capitalizedSlot} is an excellent piece (Score: ${bestSlot.score}/100).`);
  }

  return explanations;
}
