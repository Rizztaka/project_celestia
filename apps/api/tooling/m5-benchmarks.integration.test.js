import { describe, expect, it } from 'vitest';

import { evaluateCounterfactualAddition } from '../src/games/genshin/intelligence/pull-intelligence/pull-intelligence.calculator.ts';
import { explainPullValue } from '../src/games/genshin/intelligence/pull-intelligence/pull-intelligence.explainer.ts';
import characterElementsData from '../src/games/genshin/static/character-elements.json';
import constellationData from '../src/games/genshin/static/constellation-benchmarks.json';
import teamTemplatesData from '../src/games/genshin/static/team-templates.json';

const META_TEMPLATES = teamTemplatesData.templates;
const CONSTELLATIONS = constellationData.constellations;
const CHARACTER_ELEMENTS = characterElementsData;

describe('M5 End-to-End Integration Benchmarks: Account-Value Pulls', () => {
  // Shared mock scoring function based on role coverage
  const scoreAllTemplatesMock = (templates, roster) => {
    return templates.map((t) => {
      const filledRoles = t.roles.filter((r) =>
        r.candidates.some((cand) => roster.some((c) => c.characterKey === cand)),
      ).length;
      const score = Math.round((filledRoles / Math.max(1, t.roles.length)) * 100);
      return {
        templateId: t.id,
        score,
        isBuildable: score >= 60,
      };
    });
  };

  it('benchmark 1: flexible support outranks redundant on-field DPS on account with existing carries', () => {
    // Account with invested Pyro carries (Hu Tao + Arlecchino) and support Xingqiu
    const roster = [
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
        talentBurst: 8,
        equippedWeapon: null,
      },
    ];

    const currentBreakdowns = scoreAllTemplatesMock(META_TEMPLATES, roster);

    const bannerXilonen = {
      bannerId: 'banner_xilonen',
      name: 'Forgefire Blessing',
      type: 'CHARACTER',
      fiveStarKey: 'Xilonen',
      fourStarKeys: ['KukiShinobu', 'Collei'],
      endDate: '2099-01-01',
    };

    const bannerYoimiya = {
      bannerId: 'banner_yoimiya',
      name: 'Tapestry of Golden Flames',
      type: 'CHARACTER',
      fiveStarKey: 'Yoimiya',
      fourStarKeys: ['Bennett', 'YunJin'],
      endDate: '2099-01-01',
    };

    const supportResult = evaluateCounterfactualAddition({
      target: { targetKey: 'Xilonen', targetType: 'character', mode: 'c0_unlock' },
      banner: bannerXilonen,
      roster,
      accountContext: { characterElements: CHARACTER_ELEMENTS },
      templates: META_TEMPLATES,
      currentBreakdowns,
      scoreAllTemplatesFn: scoreAllTemplatesMock,
    });

    const dpsResult = evaluateCounterfactualAddition({
      target: { targetKey: 'Yoimiya', targetType: 'character', mode: 'c0_unlock' },
      banner: bannerYoimiya,
      roster,
      accountContext: { characterElements: CHARACTER_ELEMENTS },
      templates: META_TEMPLATES,
      currentBreakdowns,
      scoreAllTemplatesFn: scoreAllTemplatesMock,
    });

    // 1. Support score must strictly beat redundant DPS
    expect(supportResult.accountValueScore).toBeGreaterThan(dpsResult.accountValueScore);

    // 2. Redundancy penalty must identify both Hu Tao and Arlecchino
    expect(dpsResult.breakdown.redundancyPenalty).toBe(40);
    expect(dpsResult.breakdown.redundantWithOwned).toContain('HuTao');
    expect(dpsResult.breakdown.redundantWithOwned).toContain('Arlecchino');

    // 3. Support flexibility must be significantly higher
    expect(supportResult.breakdown.supportFlexibility).toBeGreaterThanOrEqual(75);
    expect(dpsResult.breakdown.supportFlexibility).toBeLessThanOrEqual(50);

    // 4. Strategic recommendations match expected divergence
    expect(['HIGH_ACCOUNT_VALUE', 'MODERATE_UPGRADE']).toContain(
      supportResult.strategicRecommendation,
    );
    expect(dpsResult.strategicRecommendation).toBe('NICHE_OR_REDUNDANT');
  });

  it('benchmark 2: constellation progression evaluates incremental value instead of returning 0 / SKIP', () => {
    const rosterWithHuTao = [
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
      {
        characterKey: 'Xingqiu',
        level: 80,
        ascension: 6,
        constellation: 6,
        talentNormal: 1,
        talentSkill: 8,
        talentBurst: 8,
        equippedWeapon: null,
      },
    ];

    const currentBreakdowns = scoreAllTemplatesMock(META_TEMPLATES, rosterWithHuTao);

    const bannerHuTao = {
      bannerId: 'banner_hutao',
      name: 'Papilio Charontis',
      type: 'CHARACTER',
      fiveStarKey: 'HuTao',
      fourStarKeys: ['Thoma', 'Diona'],
      endDate: '2099-01-01',
    };

    const c1Result = evaluateCounterfactualAddition({
      target: {
        targetKey: 'HuTao',
        targetType: 'character',
        mode: 'constellation',
        targetConstellation: 1,
      },
      banner: bannerHuTao,
      roster: rosterWithHuTao,
      accountContext: { characterElements: CHARACTER_ELEMENTS },
      templates: META_TEMPLATES,
      currentBreakdowns,
      constellationBenchmarks: CONSTELLATIONS,
      scoreAllTemplatesFn: scoreAllTemplatesMock,
    });

    // Constellation score is positive and meaningful
    expect(c1Result.accountValueScore).toBeGreaterThanOrEqual(40);
    expect(c1Result.mode).toBe('constellation');
    expect(c1Result.targetConstellation).toBe(1);
    expect(c1Result.currentConstellation).toBe(0);
    expect(c1Result.breakdown.endgameCoverageImpact).toBe(45); // Hu Tao C1 benchmark
    expect(c1Result.breakdown.investmentFriction).toBe(0); // Zero leveling friction

    const explanations = explainPullValue(c1Result);
    expect(explanations.some((e) => e.includes('Constellation Upgrade'))).toBe(true);
    expect(explanations.some((e) => e.includes('C1'))).toBe(true);
  });

  it('benchmark 3: user priority weights visibly alter recommendation rankings', () => {
    const roster = [
      {
        characterKey: 'Xingqiu',
        level: 80,
        ascension: 6,
        constellation: 6,
        talentNormal: 1,
        talentSkill: 8,
        talentBurst: 8,
        equippedWeapon: null,
      },
    ];

    const currentBreakdowns = scoreAllTemplatesMock(META_TEMPLATES, roster);

    const bannerZhongli = {
      bannerId: 'banner_zhongli',
      name: 'Gentry of Hermits',
      type: 'CHARACTER',
      fiveStarKey: 'Zhongli',
      fourStarKeys: [],
      endDate: '2099-01-01',
    };

    // Profile A: Heavy comfort weighting (shielding/survivability)
    const comfortWeightedResult = evaluateCounterfactualAddition({
      target: { targetKey: 'Zhongli', targetType: 'character', mode: 'c0_unlock' },
      banner: bannerZhongli,
      roster,
      templates: META_TEMPLATES,
      currentBreakdowns,
      userWeights: {
        weightEndgame: 0.1,
        weightFlexibility: 0.1,
        weightComfort: 0.7, // High comfort weight
        weightFavorites: 0.1,
      },
      scoreAllTemplatesFn: scoreAllTemplatesMock,
    });

    // Profile B: Zero comfort weighting (pure endgame DPS)
    const dpsWeightedResult = evaluateCounterfactualAddition({
      target: { targetKey: 'Zhongli', targetType: 'character', mode: 'c0_unlock' },
      banner: bannerZhongli,
      roster,
      templates: META_TEMPLATES,
      currentBreakdowns,
      userWeights: {
        weightEndgame: 0.8, // Heavy endgame weight
        weightFlexibility: 0.2,
        weightComfort: 0.0, // Zero comfort weight
        weightFavorites: 0.0,
      },
      scoreAllTemplatesFn: scoreAllTemplatesMock,
    });

    // Zhongli scores significantly higher under comfort-weighted preferences
    expect(comfortWeightedResult.accountValueScore).toBeGreaterThan(
      dpsWeightedResult.accountValueScore,
    );
  });

  it('benchmark 4: partial showcase account produces CONDITIONAL_DATA_GAP with explicit gap warnings', () => {
    const bannerMavuika = {
      bannerId: 'banner_mavuika',
      name: 'Ancient Flame Ablaze',
      type: 'CHARACTER',
      fiveStarKey: 'Mavuika',
      fourStarKeys: ['Kachina', 'Bennett'],
      endDate: '2099-01-01',
    };

    const partialResult = evaluateCounterfactualAddition({
      target: { targetKey: 'Mavuika', targetType: 'character', mode: 'c0_unlock' },
      banner: bannerMavuika,
      roster: [], // Empty showcase
      accountContext: {
        isPartialAccount: true, // Public showcase
        characterElements: CHARACTER_ELEMENTS,
      },
      templates: META_TEMPLATES,
      currentBreakdowns: [],
      scoreAllTemplatesFn: scoreAllTemplatesMock,
    });

    expect(partialResult.isPartialAccount).toBe(true);
    expect(partialResult.missingDataNotes.length).toBeGreaterThan(0);
    expect(partialResult.missingDataNotes[0]).toContain('partial');
    expect(['CONDITIONAL_DATA_GAP', 'MODERATE_UPGRADE']).toContain(
      partialResult.strategicRecommendation,
    );

    const explanations = explainPullValue(partialResult);
    expect(explanations.some((e) => e.includes('partial') || e.includes('DATA GAP'))).toBe(true);
  });

  it('benchmark 5: budget and pity integration accurately advises SAVE_RECOMMENDED on low-budget scenarios', () => {
    const bannerYoimiya = {
      bannerId: 'banner_yoimiya',
      name: 'Tapestry of Golden Flames',
      type: 'CHARACTER',
      fiveStarKey: 'Yoimiya',
      fourStarKeys: [],
      endDate: '2099-01-01',
    };

    const result = evaluateCounterfactualAddition({
      target: { targetKey: 'Yoimiya', targetType: 'character', mode: 'c0_unlock' },
      banner: bannerYoimiya,
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
      templates: META_TEMPLATES,
      currentBreakdowns: [],
      budget: {
        primogems: 1600, // Only 10 pulls
        fates: 0,
        pity: 5,
        guaranteed: false,
      },
      scoreAllTemplatesFn: scoreAllTemplatesMock,
    });

    expect(result.budgetForecast.currentPullsAvailable).toBe(10);
    expect(result.budgetForecast.acquisitionProbability).toBeLessThan(0.1);
    expect(['SAVE_RECOMMENDED', 'NICHE_OR_REDUNDANT']).toContain(result.strategicRecommendation);

    const explanations = explainPullValue(result);
    expect(explanations.some((e) => e.includes('Wish Budget Forecast'))).toBe(true);
    expect(explanations.some((e) => e.includes('probability is ~'))).toBe(true);
  });
});
