import type {
  CharacterInput,
  ScoreBreakdown,
  StaticCharacterProfile,
} from './character-intelligence.calculator.js';

// -------------------------------------------------------
// Internal helpers
// -------------------------------------------------------

/**
 * Converts a camelCase characterKey into a readable display name.
 * e.g. "RaidenShogun" → "Raiden Shogun", "HuTao" → "Hu Tao"
 */
function toDisplayName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').trim();
}

function toTalentLabel(talent: 'normal' | 'skill' | 'burst'): string {
  switch (talent) {
    case 'normal':
      return 'Normal Attack';
    case 'skill':
      return 'Elemental Skill';
    case 'burst':
      return 'Elemental Burst';
  }
}

// -------------------------------------------------------
// Public API
// -------------------------------------------------------

/**
 * Pure explanation function — the "Explainer" layer.
 *
 * Translates a ScoreBreakdown (produced by the Calculator) into an ordered
 * array of human-readable string bullets, explaining *why* the character is
 * recommended.
 *
 * Rules:
 * - Each bullet references concrete values from the character's data.
 * - If a sub-score is 0, no bullet is generated for that category.
 * - Bullets are ordered from highest-impact sub-score to lowest.
 * - This function must NEVER perform any arithmetic scoring.
 */
export function explainCharacterScore(
  character: CharacterInput,
  profile: StaticCharacterProfile,
  breakdown: ScoreBreakdown,
  hasFallbackProfile = false,
): string[] {
  const explanations: string[] = [];
  const name = toDisplayName(character.characterKey);
  const { subScores } = breakdown;

  // ── 1. Ascension Gap ─────────────────────────────────────────────────────
  if (subScores.ascensionGap > 0) {
    explanations.push(
      `${name} is Level ${character.level} but only Ascension ${character.ascension} — ` +
        `ascending them will raise their stats and unlock a higher level cap.`,
    );
  }

  // ── 2. Talent Neglect ────────────────────────────────────────────────────
  if (subScores.talentNeglect > 0) {
    const talentLabel = toTalentLabel(profile.priorityTalent);
    let currentTalentLevel: number;
    switch (profile.priorityTalent) {
      case 'normal':
        currentTalentLevel = character.talentNormal;
        break;
      case 'skill':
        currentTalentLevel = character.talentSkill;
        break;
      case 'burst':
      default:
        currentTalentLevel = character.talentBurst;
        break;
    }

    explanations.push(
      `${name}'s ${talentLabel} is Level ${currentTalentLevel}. ` +
        `Raising it to 8+ is one of the highest-ROI investments for this character.`,
    );
    explanations.push(
      `As a ${profile.role.replace('_', ' ')}, ` +
        `their ${talentLabel} directly scales their primary contribution to the team.`,
    );
  }

  // ── 3. Meta Weight ───────────────────────────────────────────────────────
  if (subScores.metaWeight === 20) {
    explanations.push(
      `${name} is a top-tier ${profile.role.replace('_', ' ')} featured in ` +
        `a wide variety of endgame team compositions.`,
    );
  }

  // ── 4. Weapon Mismatch ───────────────────────────────────────────────────
  if (subScores.weaponMismatch > 0 && character.equippedWeapon !== null) {
    const weaponName = toDisplayName(character.equippedWeapon.weaponKey);
    explanations.push(
      `${name} is equipped with ${weaponName} (Level ${character.equippedWeapon.level}) ` +
        `but is only Level ${character.level} — ` +
        `ascending the character will allow their weapon's stats to land properly.`,
    );
  }

  // ── 5. Fallback profile warning ──────────────────────────────────────────
  // Emitted last, as it's informational rather than a priority signal.
  if (hasFallbackProfile) {
    explanations.push(
      `Note: No detailed meta profile exists for ${name} yet. ` +
        `The score above uses generic fallback values — upgrade their profile for a more accurate analysis.`,
    );
  }

  return explanations;
}
