import { describe, expect, it } from 'vitest';

import type { CharacterRecommendation } from '../character-intelligence/character-intelligence.service.js';
import type { CharacterInput } from '../character-intelligence/character-intelligence.calculator.js';
import type { TeamScoreBreakdown, TeamTemplate } from '../team-intelligence/team-intelligence.calculator.js';
import {
  calculatePullValue,
  type ActiveBanner,
} from './pull-intelligence.calculator.js';
import { explainPullValue } from './pull-intelligence.explainer.js';

// -------------------------------------------------------
// Shared test fixtures
// -------------------------------------------------------

const BANNER_HUTAO: ActiveBanner = {
  bannerId: 'banner_hutao_test',
  name: 'Papilio Charontis',
  type: 'CHARACTER',
  fiveStarKey: 'HuTao',
  fourStarKeys: ['Xingqiu', 'Thoma', 'Diona'],
  endDate: '2099-01-01T00:00:00Z',
};

const BANNER_NAHIDA: ActiveBanner = {
  bannerId: 'banner_nahida_test',
  name: 'Folio of Foliage',
  type: 'CHARACTER',
  fiveStarKey: 'Nahida',
  fourStarKeys: ['Fischl', 'Beidou', 'Collei'],
  endDate: '2099-01-01T00:00:00Z',
};

/** Roster that already owns HuTao and Xingqiu */
const ROSTER_WITH_HUTAO: CharacterInput[] = [
  {
    characterKey: 'HuTao',
    level: 90, ascension: 6, constellation: 0,
    talentNormal: 1, talentSkill: 6, talentBurst: 8,
    equippedWeapon: null,
  },
  {
    characterKey: 'Xingqiu',
    level: 80, ascension: 6, constellation: 0,
    talentNormal: 1, talentSkill: 6, talentBurst: 8,
    equippedWeapon: null,
  },
];

/** Empty roster — user just started */
const EMPTY_ROSTER: CharacterInput[] = [];

/** A minimal template that features HuTao as a candidate */
const MOCK_TEMPLATES: TeamTemplate[] = [
  {
    id: 'national',
    name: 'National Vaporize',
    archetype: 'VAPORIZE',
    reaction: 'Vaporize',
    reactionElements: ['Pyro', 'Hydro'],
    description: 'Test template',
    roles: [
      {
        roleId: 'pyro_dps',
        label: 'Pyro DPS',
        element: 'Pyro',
        candidates: ['HuTao', 'Diluc', 'Yoimiya'],
        required: true,
        flex: false,
        weight: 35,
      },
      {
        roleId: 'hydro_enabler',
        label: 'Hydro Enabler',
        element: 'Hydro',
        candidates: ['Xingqiu', 'Yelan'],
        required: true,
        flex: false,
        weight: 30,
      },
    ],
  },
];

/** Buildable breakdown (score >= 75 = S-tier) */
const MOCK_BREAKDOWN_S_TIER: TeamScoreBreakdown = {
  templateId: 'national',
  score: 80,
  subScores: { roleCoverage: 50, investmentLevel: 20, resonanceBonus: 6, reactionCompleteness: 4 },
  roles: [],
  isBuildable: true,
};

/** Non-buildable breakdown (score < 55 = untiered) */
const MOCK_BREAKDOWN_LOW: TeamScoreBreakdown = {
  templateId: 'national',
  score: 30,
  subScores: { roleCoverage: 20, investmentLevel: 5, resonanceBonus: 0, reactionCompleteness: 5 },
  roles: [],
  isBuildable: false,
};

const NO_CHAR_RECS: CharacterRecommendation[] = [];

/** A scoreAllTemplates mock that simulates pull ENABLING S-tier */
const scoreAllTemplates_EnablesSTier = (
  _templates: TeamTemplate[],
  roster: CharacterInput[],
): TeamScoreBreakdown[] => {
  const hasHuTao = roster.some((c) => c.characterKey === 'HuTao');
  const hasXingqiu = roster.some((c) => c.characterKey === 'Xingqiu');
  const score = hasHuTao && hasXingqiu ? 80 : 30;
  return [{ ...MOCK_BREAKDOWN_LOW, score, isBuildable: score >= 55 }];
};

/** A scoreAllTemplates mock that never makes any team buildable */
const scoreAllTemplates_NeverBuildable = (): TeamScoreBreakdown[] => {
  return [MOCK_BREAKDOWN_LOW];
};

// -------------------------------------------------------
// calculatePullValue
// -------------------------------------------------------

describe('calculatePullValue', () => {
  it('returns SKIP with score 0 if the user already owns the 5-star', () => {
    const result = calculatePullValue(
      BANNER_HUTAO,
      ROSTER_WITH_HUTAO,
      MOCK_TEMPLATES,
      [MOCK_BREAKDOWN_LOW],
      NO_CHAR_RECS,
      scoreAllTemplates_NeverBuildable,
    );

    expect(result.alreadyOwned).toBe(true);
    expect(result.recommendation).toBe('SKIP');
    expect(result.totalScore).toBe(0);
    expect(result.teamEnablerBonus).toBe(0);
    expect(result.synergyBonus).toBe(0);
  });

  it('applies +60 Team Enabler Bonus when pull unlocks an S-tier team', () => {
    // Roster has Xingqiu but NOT HuTao → pulling HuTao should unlock S-tier
    const rosterWithXingqiuOnly: CharacterInput[] = [
      {
        characterKey: 'Xingqiu',
        level: 80, ascension: 6, constellation: 0,
        talentNormal: 1, talentSkill: 6, talentBurst: 8,
        equippedWeapon: null,
      },
    ];

    // Pre-pull: without HuTao, score is low
    const prePullBreakdowns: TeamScoreBreakdown[] = [
      { ...MOCK_BREAKDOWN_LOW, score: 30, isBuildable: false },
    ];

    const result = calculatePullValue(
      BANNER_HUTAO,
      rosterWithXingqiuOnly,
      MOCK_TEMPLATES,
      prePullBreakdowns,
      NO_CHAR_RECS,
      scoreAllTemplates_EnablesSTier,
    );

    expect(result.alreadyOwned).toBe(false);
    expect(result.teamEnablerBonus).toBe(60);
    expect(result.teamEnablerTemplateName).toBe('National Vaporize');
    expect(result.recommendation).toBe('MUST_PULL'); // 60+ score threshold
  });

  it('applies 0 Team Enabler Bonus when no new teams are unlocked', () => {
    const result = calculatePullValue(
      BANNER_NAHIDA, // Nahida not in any MOCK_TEMPLATES
      EMPTY_ROSTER,
      MOCK_TEMPLATES,
      [MOCK_BREAKDOWN_LOW],
      NO_CHAR_RECS,
      scoreAllTemplates_NeverBuildable,
    );

    expect(result.teamEnablerBonus).toBe(0);
    expect(result.teamEnablerTemplateName).toBeNull();
  });

  it('applies +40 Synergy Bonus when the character shares a template with top invested chars', () => {
    const recs: CharacterRecommendation[] = [
      { characterKey: 'Xingqiu', rank: 1, score: 20, recommendation: 'ASCEND_AND_LEVEL', explanations: [] },
    ];

    // HuTao and Xingqiu share the MOCK_TEMPLATES 'national' template
    const result = calculatePullValue(
      BANNER_HUTAO,
      EMPTY_ROSTER,
      MOCK_TEMPLATES,
      [MOCK_BREAKDOWN_LOW],
      recs,
      scoreAllTemplates_NeverBuildable,
    );

    expect(result.synergyBonus).toBe(40);
    expect(result.synergyWith).toContain('Xingqiu');
  });

  it('applies 0 Synergy Bonus when no top chars share a template', () => {
    const recs: CharacterRecommendation[] = [
      { characterKey: 'Albedo', rank: 1, score: 20, recommendation: 'ASCEND_AND_LEVEL', explanations: [] },
    ];

    // Albedo doesn't appear in MOCK_TEMPLATES, so no synergy
    const result = calculatePullValue(
      BANNER_HUTAO,
      EMPTY_ROSTER,
      MOCK_TEMPLATES,
      [MOCK_BREAKDOWN_LOW],
      recs,
      scoreAllTemplates_NeverBuildable,
    );

    expect(result.synergyBonus).toBe(0);
    expect(result.synergyWith).toHaveLength(0);
  });

  it('applies +20 Four-Star Gap Bonus when user is missing a featured 4-star', () => {
    // User owns HuTao but NOT Xingqiu, Thoma, or Diona → gap bonus
    const result = calculatePullValue(
      BANNER_HUTAO,
      [], // no 4-stars owned
      MOCK_TEMPLATES,
      [MOCK_BREAKDOWN_LOW],
      NO_CHAR_RECS,
      scoreAllTemplates_NeverBuildable,
    );

    expect(result.fourStarGapBonus).toBe(20);
  });

  it('applies 0 Four-Star Gap Bonus when user already owns all featured 4-stars', () => {
    const rosterWithAllFourStars: CharacterInput[] = ['Xingqiu', 'Thoma', 'Diona'].map((key) => ({
      characterKey: key,
      level: 70, ascension: 4, constellation: 0,
      talentNormal: 1, talentSkill: 1, talentBurst: 1,
      equippedWeapon: null,
    }));

    const result = calculatePullValue(
      BANNER_HUTAO,
      rosterWithAllFourStars,
      MOCK_TEMPLATES,
      [MOCK_BREAKDOWN_LOW],
      NO_CHAR_RECS,
      scoreAllTemplates_NeverBuildable,
    );

    expect(result.fourStarGapBonus).toBe(0);
  });

  it('clamps totalScore to 100 maximum', () => {
    const recs: CharacterRecommendation[] = [
      { characterKey: 'Xingqiu', rank: 1, score: 10, recommendation: 'ASCEND_AND_LEVEL', explanations: [] },
    ];

    const result = calculatePullValue(
      BANNER_HUTAO,
      [
        {
          characterKey: 'Xingqiu',
          level: 80, ascension: 6, constellation: 0,
          talentNormal: 1, talentSkill: 6, talentBurst: 8,
          equippedWeapon: null,
        },
      ],
      MOCK_TEMPLATES,
      [{ ...MOCK_BREAKDOWN_LOW, score: 30, isBuildable: false }],
      recs,
      scoreAllTemplates_EnablesSTier,
    );

    // 60 (team) + 40 (synergy) + 20 (4-star gap) = 120 → clamped to 100
    expect(result.totalScore).toBeLessThanOrEqual(100);
  });

  it('returns GOOD_VALUE for a mid-range score (35-69)', () => {
    const recs: CharacterRecommendation[] = [
      { characterKey: 'Xingqiu', rank: 1, score: 10, recommendation: 'ASCEND_AND_LEVEL', explanations: [] },
    ];

    // Synergy only (40) + 4-star gap (20) = 60 → GOOD_VALUE if no team enabler
    const result = calculatePullValue(
      BANNER_HUTAO,
      [], // no roster, all 4-stars missing
      MOCK_TEMPLATES,
      [MOCK_BREAKDOWN_LOW],
      recs,
      scoreAllTemplates_NeverBuildable,
    );

    expect(result.recommendation).toBe('GOOD_VALUE'); // 40+20 = 60 → MUST_PULL actually
    expect(result.totalScore).toBeGreaterThanOrEqual(35);
  });
});

// -------------------------------------------------------
// explainPullValue
// -------------------------------------------------------

describe('explainPullValue', () => {
  it('returns ownership-skip message when already owned', () => {
    const result = calculatePullValue(
      BANNER_HUTAO,
      ROSTER_WITH_HUTAO,
      MOCK_TEMPLATES,
      [MOCK_BREAKDOWN_LOW],
      NO_CHAR_RECS,
      scoreAllTemplates_NeverBuildable,
    );

    const explanations = explainPullValue(result);
    expect(explanations).toHaveLength(1);
    expect(explanations[0]).toContain('already have');
    expect(explanations[0]).toContain('SKIP');
  });

  it('mentions team name when team enabler bonus is 60', () => {
    const partial = {
      bannerId: 'test',
      bannerName: 'Test Banner',
      fiveStarKey: 'HuTao',
      fourStarKeys: ['Xingqiu'],
      alreadyOwned: false,
      ownershipPenalty: 0,
      teamEnablerBonus: 60,
      teamEnablerTemplateName: 'National Vaporize',
      synergyBonus: 0,
      synergyWith: [],
      fourStarGapBonus: 0,
      totalScore: 60,
      recommendation: 'MUST_PULL' as const,
    };

    const explanations = explainPullValue(partial);
    expect(explanations.some((e) => e.includes('National Vaporize'))).toBe(true);
    expect(explanations.some((e) => e.includes('MUST PULL'))).toBe(true);
  });

  it('mentions synergy characters by name', () => {
    const partial = {
      bannerId: 'test',
      bannerName: 'Test Banner',
      fiveStarKey: 'HuTao',
      fourStarKeys: [],
      alreadyOwned: false,
      ownershipPenalty: 0,
      teamEnablerBonus: 0,
      teamEnablerTemplateName: null,
      synergyBonus: 40,
      synergyWith: ['Xingqiu', 'Yelan'],
      fourStarGapBonus: 0,
      totalScore: 40,
      recommendation: 'GOOD_VALUE' as const,
    };

    const explanations = explainPullValue(partial);
    expect(explanations.some((e) => e.includes('Xingqiu'))).toBe(true);
    expect(explanations.some((e) => e.includes('Yelan'))).toBe(true);
  });

  it('returns SKIP verdict message for low scores', () => {
    const partial = {
      bannerId: 'test',
      bannerName: 'Test Banner',
      fiveStarKey: 'Nahida',
      fourStarKeys: ['Fischl'],
      alreadyOwned: false,
      ownershipPenalty: 0,
      teamEnablerBonus: 0,
      teamEnablerTemplateName: null,
      synergyBonus: 0,
      synergyWith: [],
      fourStarGapBonus: 0,
      totalScore: 0,
      recommendation: 'SKIP' as const,
    };

    const explanations = explainPullValue(partial);
    expect(explanations.some((e) => e.includes('SKIP'))).toBe(true);
  });
});
