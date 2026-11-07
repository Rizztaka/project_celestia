import { describe, expect, it } from 'vitest';

import type { CharacterInput } from '../character-intelligence/character-intelligence.calculator.js';
import type {
  TeamScoreBreakdown,
  TeamTemplate,
} from '../team-intelligence/team-intelligence.calculator.js';
import {
  type ActiveBanner,
  calculateArchetypeFlexibility,
  calculatePullProbability,
  calculateRedundancyPenalty,
  type ConstellationBenchmarksMap,
  evaluateCounterfactualAddition,
} from './pull-intelligence.calculator.js';
import { explainPullValue } from './pull-intelligence.explainer.js';

// -------------------------------------------------------
// Test Fixtures
// -------------------------------------------------------

const BANNER_HUTAO: ActiveBanner = {
  bannerId: 'banner_hutao_test',
  name: 'Papilio Charontis',
  type: 'CHARACTER',
  fiveStarKey: 'HuTao',
  fourStarKeys: ['Xingqiu', 'Thoma', 'Diona'],
  endDate: '2099-01-01T00:00:00Z',
};

const BANNER_XILONEN: ActiveBanner = {
  bannerId: 'banner_xilonen_test',
  name: 'Forgefire Blessing',
  type: 'CHARACTER',
  fiveStarKey: 'Xilonen',
  fourStarKeys: ['KukiShinobu', 'Xingqiu', 'Collei'],
  endDate: '2099-01-01T00:00:00Z',
};

const BANNER_YOIMIYA: ActiveBanner = {
  bannerId: 'banner_yoimiya_test',
  name: 'Tapestry of Golden Flames',
  type: 'CHARACTER',
  fiveStarKey: 'Yoimiya',
  fourStarKeys: ['Bennett', 'YunJin', 'Sayu'],
  endDate: '2099-01-01T00:00:00Z',
};

const MOCK_TEMPLATES: TeamTemplate[] = [
  {
    id: 'national',
    name: 'National Vaporize',
    archetype: 'VAPORIZE',
    reaction: 'Vaporize',
    reactionElements: ['Pyro', 'Hydro'],
    description: 'Vaporize template',
    roles: [
      {
        roleId: 'pyro_dps',
        label: 'Pyro DPS',
        element: 'Pyro',
        candidates: ['HuTao', 'Yoimiya', 'Arlecchino'],
        required: true,
        flex: false,
        weight: 35,
      },
      {
        roleId: 'hydro_support',
        label: 'Hydro Enabler',
        element: 'Hydro',
        candidates: ['Xingqiu', 'Yelan', 'Furina'],
        required: true,
        flex: false,
        weight: 30,
      },
      {
        roleId: 'geo_buffer',
        label: 'Geo Buffer',
        element: 'Geo',
        candidates: ['Xilonen', 'Zhongli'],
        required: false,
        flex: true,
        weight: 20,
      },
    ],
  },
  {
    id: 'hyperbloom',
    name: 'Quickbloom Engine',
    archetype: 'HYPERBLOOM',
    reaction: 'Hyperbloom',
    reactionElements: ['Dendro', 'Hydro', 'Electro'],
    description: 'Hyperbloom template',
    roles: [
      {
        roleId: 'electro_trigger',
        label: 'Electro Trigger',
        element: 'Electro',
        candidates: ['KukiShinobu', 'RaidenShogun'],
        required: true,
        flex: false,
        weight: 35,
      },
      {
        roleId: 'hydro_support',
        label: 'Hydro Enabler',
        element: 'Hydro',
        candidates: ['Xingqiu', 'Yelan', 'Furina'],
        required: true,
        flex: false,
        weight: 30,
      },
      {
        roleId: 'flex_buffer',
        label: 'Flex Buffer',
        element: 'Geo',
        candidates: ['Xilonen', 'Zhongli', 'KaedeharaKazuha'],
        required: false,
        flex: true,
        weight: 20,
      },
    ],
  },
  {
    id: 'freeze',
    name: 'Blizzard Freeze',
    archetype: 'FREEZE',
    reaction: 'Freeze',
    reactionElements: ['Cryo', 'Hydro'],
    description: 'Freeze template',
    roles: [
      {
        roleId: 'cryo_dps',
        label: 'Cryo DPS',
        element: 'Cryo',
        candidates: ['Ayaka', 'Ganyu'],
        required: true,
        flex: false,
        weight: 35,
      },
      {
        roleId: 'buffer',
        label: 'Universal Buffer',
        element: 'Geo',
        candidates: ['Xilonen', 'KaedeharaKazuha', 'Furina'],
        required: false,
        flex: true,
        weight: 25,
      },
    ],
  },
];

const MOCK_BREAKDOWN_LOW: TeamScoreBreakdown = {
  templateId: 'national',
  score: 30,
  subScores: { roleCoverage: 20, investmentLevel: 5, resonanceBonus: 0, reactionCompleteness: 5 },
  roles: [],
  isBuildable: false,
};

const MOCK_CONSTELLATIONS: ConstellationBenchmarksMap = {
  HuTao: {
    '1': {
      valueScore: 45,
      comfortBoost: 40,
      category: 'qol_and_dps',
      description: 'Eliminates stamina cost for Charged Attacks during Paramita Papilio.',
    },
  },
  Furina: {
    '2': {
      valueScore: 50,
      comfortBoost: 25,
      category: 'damage_and_buff',
      description: 'Accelerates Fanfare accumulation by 250%.',
    },
  },
};

const CHARACTER_ELEMENTS: Record<string, string> = {
  HuTao: 'Pyro',
  Arlecchino: 'Pyro',
  Yoimiya: 'Pyro',
  Xilonen: 'Geo',
  Furina: 'Hydro',
  Zhongli: 'Geo',
  Xingqiu: 'Hydro',
  KukiShinobu: 'Electro',
};

const scoreAllMock = (
  _templates: TeamTemplate[],
  roster: CharacterInput[],
): TeamScoreBreakdown[] => {
  const hasXingqiu = roster.some((c) => c.characterKey === 'Xingqiu');
  const hasHuTao = roster.some((c) => c.characterKey === 'HuTao');
  const hasXilonen = roster.some((c) => c.characterKey === 'Xilonen');

  const score = (hasHuTao || hasXilonen) && hasXingqiu ? 80 : 30;
  return [{ ...MOCK_BREAKDOWN_LOW, score, isBuildable: score >= 55 }];
};

// -------------------------------------------------------
// Tests
// -------------------------------------------------------

describe('pull-intelligence calculator', () => {
  it('calculates probability accurately across pull ranges', () => {
    expect(calculatePullProbability(0, 0, false, false)).toBe(0);
    expect(calculatePullProbability(90, 0, true, false)).toBe(1);
    expect(calculatePullProbability(180, 0, false, false)).toBe(1);
    const midProb = calculatePullProbability(40, 20, false, false);
    expect(midProb).toBeGreaterThan(0.1);
    expect(midProb).toBeLessThan(0.7);
  });

  it('evaluates archetype flexibility correctly', () => {
    const xilonenFlex = calculateArchetypeFlexibility('Xilonen', MOCK_TEMPLATES);
    expect(xilonenFlex.archetypes).toContain('VAPORIZE');
    expect(xilonenFlex.archetypes).toContain('HYPERBLOOM');
    expect(xilonenFlex.archetypes).toContain('FREEZE');
    expect(xilonenFlex.score).toBe(75); // 3 archetypes * 25 = 75

    const yoimiyaFlex = calculateArchetypeFlexibility('Yoimiya', MOCK_TEMPLATES);
    expect(yoimiyaFlex.archetypes).toEqual(['VAPORIZE']);
    expect(yoimiyaFlex.score).toBe(25); // 1 archetype * 25 = 25
  });

  it('penalizes redundant on-field carries of the same element', () => {
    const rosterWithTwoPyroCarries: CharacterInput[] = [
      {
        characterKey: 'HuTao',
        level: 90,
        ascension: 6,
        constellation: 0,
        talentNormal: 9,
        talentSkill: 9,
        talentBurst: 9,
        equippedWeapon: null,
      },
      {
        characterKey: 'Arlecchino',
        level: 90,
        ascension: 6,
        constellation: 0,
        talentNormal: 9,
        talentSkill: 8,
        talentBurst: 8,
        equippedWeapon: null,
      },
    ];

    const redundancy = calculateRedundancyPenalty(
      'Yoimiya',
      rosterWithTwoPyroCarries,
      MOCK_TEMPLATES,
      CHARACTER_ELEMENTS,
    );

    expect(redundancy.penalty).toBe(40); // 2 redundant carries * 20 = 40
    expect(redundancy.redundantWith).toContain('HuTao');
    expect(redundancy.redundantWith).toContain('Arlecchino');

    // Supports should have zero redundancy
    const supportRedundancy = calculateRedundancyPenalty(
      'Xilonen',
      rosterWithTwoPyroCarries,
      MOCK_TEMPLATES,
      CHARACTER_ELEMENTS,
    );
    expect(supportRedundancy.penalty).toBe(0);
    expect(supportRedundancy.redundantWith).toHaveLength(0);
  });

  it('evaluates constellation upgrades with positive value instead of Score 0 / SKIP', () => {
    const rosterWithHuTao: CharacterInput[] = [
      {
        characterKey: 'HuTao',
        level: 90,
        ascension: 6,
        constellation: 0,
        talentNormal: 10,
        talentSkill: 10,
        talentBurst: 10,
        equippedWeapon: null,
      },
    ];

    const result = evaluateCounterfactualAddition({
      target: {
        targetKey: 'HuTao',
        targetType: 'character',
        mode: 'constellation',
        targetConstellation: 1,
      },
      banner: BANNER_HUTAO,
      roster: rosterWithHuTao,
      accountContext: { characterElements: CHARACTER_ELEMENTS },
      templates: MOCK_TEMPLATES,
      currentBreakdowns: [MOCK_BREAKDOWN_LOW],
      constellationBenchmarks: MOCK_CONSTELLATIONS,
      scoreAllTemplatesFn: scoreAllMock,
    });

    expect(result.mode).toBe('constellation');
    expect(result.targetConstellation).toBe(1);
    expect(result.currentConstellation).toBe(0);
    expect(result.accountValueScore).toBeGreaterThan(0);
    expect(result.strategicRecommendation).not.toBe('SKIP');
    expect(result.breakdown.endgameCoverageImpact).toBe(45); // Hu Tao C1 benchmark
    expect(result.breakdown.investmentFriction).toBe(0); // Zero leveling friction for owned char
  });

  it('rewards flexible support over redundant DPS on an account with built carries', () => {
    const rosterWithBuiltCarries: CharacterInput[] = [
      {
        characterKey: 'HuTao',
        level: 90,
        ascension: 6,
        constellation: 0,
        talentNormal: 9,
        talentSkill: 9,
        talentBurst: 9,
        equippedWeapon: null,
      },
      {
        characterKey: 'Arlecchino',
        level: 90,
        ascension: 6,
        constellation: 0,
        talentNormal: 9,
        talentSkill: 9,
        talentBurst: 8,
        equippedWeapon: null,
      },
      {
        characterKey: 'Xingqiu',
        level: 80,
        ascension: 6,
        constellation: 6,
        talentNormal: 1,
        talentSkill: 8,
        talentBurst: 9,
        equippedWeapon: null,
      },
    ];

    const supportResult = evaluateCounterfactualAddition({
      target: { targetKey: 'Xilonen', targetType: 'character', mode: 'c0_unlock' },
      banner: BANNER_XILONEN,
      roster: rosterWithBuiltCarries,
      accountContext: { characterElements: CHARACTER_ELEMENTS },
      templates: MOCK_TEMPLATES,
      currentBreakdowns: [MOCK_BREAKDOWN_LOW],
      scoreAllTemplatesFn: scoreAllMock,
    });

    const dpsResult = evaluateCounterfactualAddition({
      target: { targetKey: 'Yoimiya', targetType: 'character', mode: 'c0_unlock' },
      banner: BANNER_YOIMIYA,
      roster: rosterWithBuiltCarries,
      accountContext: { characterElements: CHARACTER_ELEMENTS },
      templates: MOCK_TEMPLATES,
      currentBreakdowns: [MOCK_BREAKDOWN_LOW],
      scoreAllTemplatesFn: scoreAllMock,
    });

    // Versatile support should outrank redundant DPS
    expect(supportResult.accountValueScore).toBeGreaterThan(dpsResult.accountValueScore);
    expect(dpsResult.breakdown.redundancyPenalty).toBeGreaterThan(0);
    expect(supportResult.breakdown.supportFlexibility).toBeGreaterThan(
      dpsResult.breakdown.supportFlexibility,
    );
  });

  it('flags partial showcase accounts with CONDITIONAL_DATA_GAP notes', () => {
    const result = evaluateCounterfactualAddition({
      target: { targetKey: 'Yoimiya', targetType: 'character', mode: 'c0_unlock' },
      banner: BANNER_YOIMIYA,
      roster: [],
      accountContext: { isPartialAccount: true, characterElements: CHARACTER_ELEMENTS },
      templates: MOCK_TEMPLATES,
      currentBreakdowns: [MOCK_BREAKDOWN_LOW],
      scoreAllTemplatesFn: scoreAllMock,
    });

    expect(result.isPartialAccount).toBe(true);
    expect(result.missingDataNotes.length).toBeGreaterThan(0);
    expect(result.missingDataNotes[0]).toContain('partial');
  });

  it('generates transparent, plain-language explanations with explainer', () => {
    const rec = evaluateCounterfactualAddition({
      target: {
        targetKey: 'HuTao',
        targetType: 'character',
        mode: 'constellation',
        targetConstellation: 1,
      },
      banner: BANNER_HUTAO,
      roster: [
        {
          characterKey: 'HuTao',
          level: 90,
          ascension: 6,
          constellation: 0,
          talentNormal: 10,
          talentSkill: 10,
          talentBurst: 10,
          equippedWeapon: null,
        },
      ],
      accountContext: { characterElements: CHARACTER_ELEMENTS },
      templates: MOCK_TEMPLATES,
      currentBreakdowns: [MOCK_BREAKDOWN_LOW],
      constellationBenchmarks: MOCK_CONSTELLATIONS,
      budget: { primogems: 1600, fates: 10, pity: 30, guaranteed: false },
      scoreAllTemplatesFn: scoreAllMock,
    });

    const explanations = explainPullValue(rec);
    expect(explanations.length).toBeGreaterThanOrEqual(4);
    expect(explanations.some((e) => e.includes('Constellation Upgrade'))).toBe(true);
    expect(explanations.some((e) => e.includes('Wish Budget Forecast'))).toBe(true);
    expect(explanations.some((e) => e.includes('Strategic Verdict'))).toBe(true);
  });
});
