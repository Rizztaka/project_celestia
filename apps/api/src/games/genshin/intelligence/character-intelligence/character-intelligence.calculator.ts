// -------------------------------------------------------
// Types
// -------------------------------------------------------

export interface CharacterInput {
  characterKey: string;
  level: number; // 1–90
  ascension: number; // 0–6
  constellation: number; // 0–6
  talentNormal: number; // 1–10 (base, before C3/C5 bonus)
  talentSkill: number; // 1–10
  talentBurst: number; // 1–10
  equippedWeapon: {
    weaponKey: string;
    level: number; // 1–90
    refinement: number; // 1–5
  } | null;
}

export interface StaticCharacterProfile {
  metaTier: 1 | 2 | 3;
  role: 'dps' | 'sub_dps' | 'support' | 'healer';
  priorityTalent: 'normal' | 'skill' | 'burst';
  weaponRarity: 4 | 5;
}

export interface ScoreBreakdown {
  score: number;
  subScores: {
    ascensionGap: number; // 0–35
    talentNeglect: number; // 0–30
    metaWeight: number; // 0–20
    weaponMismatch: number; // 0–15
    levelCapHit: number; // 0 or –5
  };
  recommendationLabel: RecommendationLabel;
}

export type RecommendationLabel =
  'ASCEND_AND_LEVEL' | 'LEVEL_TALENTS' | 'CLOSE_LEVEL_GAP' | 'COMPLETE';

// -------------------------------------------------------
// Internal helpers
// -------------------------------------------------------

/**
 * Expected ascension phase for a given character level.
 * e.g. a level 60 character is "expected" to be Ascension 3.
 *
 * Level caps by ascension phase:
 *   Asc 0 → max 20 | Asc 1 → max 40 | Asc 2 → max 50
 *   Asc 3 → max 60 | Asc 4 → max 70 | Asc 5 → max 80 | Asc 6 → max 90
 */
function getExpectedAscension(level: number): number {
  if (level <= 20) return 0;
  if (level <= 40) return 1;
  if (level <= 50) return 2;
  if (level <= 60) return 3;
  if (level <= 70) return 4;
  if (level <= 80) return 5;
  return 6;
}

/** Maximum character level at the given ascension phase. */
const ASCENSION_LEVEL_CAP: Readonly<Record<number, number>> = {
  0: 20,
  1: 40,
  2: 50,
  3: 60,
  4: 70,
  5: 80,
  6: 90,
};

// -------------------------------------------------------
// Public API
// -------------------------------------------------------

/**
 * Pure scoring function — the "Calculator" layer.
 *
 * Accepts a player's character data and the character's static meta profile.
 * Returns a deterministic ScoreBreakdown: the numeric sub-scores, the total
 * clamped to [0, 100], and a human-readable recommendation label.
 *
 * This function must NEVER contain any string explanations or UI-facing text.
 */
export function calculateCharacterScore(
  character: CharacterInput,
  profile: StaticCharacterProfile,
): ScoreBreakdown {
  // ── Sub-score 1: Ascension Gap (max 35) ──────────────────────────────────
  // Measures how far behind the character's ascension is for their level.
  const expectedAsc = getExpectedAscension(character.level);
  const ascGap = Math.max(0, expectedAsc - character.ascension);
  const sub1 = Math.min(35, ascGap * 12);

  // ── Sub-score 2: Talent Neglect (max 30) ────────────────────────────────
  // Measures under-investment in the character's most important talent.
  // Endgame target: Level 8 (before weekly-boss materials become the bottleneck).
  const TALENT_TARGET = 8;
  let priorityTalentLevel: number;
  switch (profile.priorityTalent) {
    case 'normal':
      priorityTalentLevel = character.talentNormal;
      break;
    case 'skill':
      priorityTalentLevel = character.talentSkill;
      break;
    case 'burst':
    default:
      priorityTalentLevel = character.talentBurst;
      break;
  }
  const talentGap = Math.max(0, TALENT_TARGET - priorityTalentLevel);
  const sub2 = Math.min(30, talentGap * 5);

  // ── Sub-score 3: Meta Weight (max 20) ────────────────────────────────────
  // Tier-1 characters appear in a wider variety of endgame teams, so we apply
  // a static baseline boost that surfaces them even when partially built.
  let sub3: number;
  switch (profile.metaTier) {
    case 1:
      sub3 = 20;
      break;
    case 2:
      sub3 = 10;
      break;
    default:
      sub3 = 0;
  }

  // ── Sub-score 4: Weapon Mismatch (max 15) ────────────────────────────────
  // Detects a high-level weapon equipped on a low-level character — a clear
  // sign that the character is the bottleneck, not the gear.
  let sub4 = 0;
  if (character.equippedWeapon !== null) {
    const wLvl = character.equippedWeapon.level;
    const cLvl = character.level;
    if (wLvl >= 60 && cLvl < 60) {
      sub4 = 15;
    } else if (wLvl >= 40 && cLvl < 40) {
      sub4 = 8;
    }
  }

  // ── Sub-score 5: Level Cap Hit (−5 penalty) ──────────────────────────────
  // A character who has exactly hit their ascension phase level cap is already
  // at a plateau — they're "done" until ascended, making them slightly less
  // urgent than characters who still have room to level within the current phase.
  const levelCap = ASCENSION_LEVEL_CAP[character.ascension] ?? 90;
  const sub5 = character.level === levelCap && character.ascension < 6 ? -5 : 0;

  // ── Final Score ───────────────────────────────────────────────────────────
  const rawScore = sub1 + sub2 + sub3 + sub4 + sub5;
  const score = Math.max(0, Math.min(100, rawScore));

  // ── Recommendation Label ──────────────────────────────────────────────────
  // Derived from the dominant sub-score. Priority order mirrors investment ROI.
  let recommendationLabel: RecommendationLabel = 'COMPLETE';
  if (score >= 20) {
    if (sub1 >= 24) {
      // Ascension gap of 2+ phases — the most impactful possible investment.
      recommendationLabel = 'ASCEND_AND_LEVEL';
    } else if (sub2 >= 20) {
      // Priority talent gap of 4+ levels and ascension is fine.
      recommendationLabel = 'LEVEL_TALENTS';
    } else if (sub4 >= 8) {
      // Strong weapon on a weak character — level gap is the bottleneck.
      recommendationLabel = 'CLOSE_LEVEL_GAP';
    } else {
      // Score ≥ 20 driven by meta weight or small combined gaps.
      recommendationLabel = 'LEVEL_TALENTS';
    }
  }

  return {
    score,
    subScores: {
      ascensionGap: sub1,
      talentNeglect: sub2,
      metaWeight: sub3,
      weaponMismatch: sub4,
      levelCapHit: sub5,
    },
    recommendationLabel,
  };
}
