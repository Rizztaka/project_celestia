import { companionSummaryResponseSchema } from '@celestia/api-contracts';
import { describe, expect, it } from 'vitest';

import {
  calculateCompanionSummary,
  type CompanionSummaryCalculationInput,
} from './companion-summary.calculator.js';
import { explainCompanionSummary } from './companion-summary.explainer.js';

describe('CompanionSummary pure calculator & explainer', () => {
  const baseInput: CompanionSummaryCalculationInput = {
    accountScope: 'authenticated',
    isPartialAccount: false,
    readinessList: [
      { characterKey: 'Mavuika', role: 'on_field_dps', score: 92, status: 'ready_for_target' },
      { characterKey: 'Bennett', role: 'attack_buffer', score: 88, status: 'ready_for_target' },
      { characterKey: 'Citlali', role: 'shielder', score: 75, status: 'needs_investment' },
      { characterKey: 'Xilonen', role: 'shred_support', score: 85, status: 'ready_for_target' },
      { characterKey: 'Furina', role: 'buff_sub_dps', score: 94, status: 'ready_for_target' },
      { characterKey: 'Kazuha', role: 'vv_support', score: 90, status: 'ready_for_target' },
      { characterKey: 'Yelan', role: 'off_field_hydro', score: 86, status: 'ready_for_target' },
      { characterKey: 'Xiangling', role: 'off_field_pyro', score: 82, status: 'ready_for_target' },
    ],
    upgradesList: [
      {
        characterKey: 'Bennett',
        actionType: 'TALENT_UPGRADE',
        actionDetail: 'talent: burst (8→9)',
        efficiencyScore: 55,
        domainFamily: 'Resistance',
      },
      {
        characterKey: 'Citlali',
        actionType: 'WEAPON_ASCENSION',
        actionDetail: 'weapon_ascension: StarcallersWatch (80→90)',
        efficiencyScore: 48,
        domainFamily: 'Elysium',
      },
    ],
    openDomainFamilies: ['Resistance', 'Ballad'],
    endgameStatus: {
      abyssScore: 88,
      abyssReady: true,
      onslaughtReady: false,
      theaterMaxActs: 4,
    },
    pullAdvice: {
      recommendation: 'HIGH_ACCOUNT_VALUE',
      targetBannerName: 'Ancient Flame Ablaze',
      targetCharacterKey: 'Mavuika',
      keyReason: 'Expands top team archetypes by +50%.',
    },
  };

  it('selects FARMING_AVAILABLE when top upgrade matches today open domain family', () => {
    const result = calculateCompanionSummary(baseInput);

    expect(result.primaryAction.category).toBe('FARMING_AVAILABLE');
    expect(result.primaryAction.priority).toBe('HIGH');
    expect(result.primaryAction.headline).toContain("Today's Domain: Upgrade Bennett's");
    expect(result.primaryAction.targetRoute).toBe('/planner?tab=farming');
    expect(result.topMarginalInvestments[0].todayDomainAvailable).toBe(true);
  });

  it('selects BUILD_INVESTMENT when high-efficiency upgrade exists but domain is not open today', () => {
    const input: CompanionSummaryCalculationInput = {
      ...baseInput,
      openDomainFamilies: ['Diligence', 'Gold'], // neither Resistance nor Elysium open
    };
    const result = calculateCompanionSummary(input);

    expect(result.primaryAction.category).toBe('BUILD_INVESTMENT');
    expect(result.primaryAction.headline).toContain('Priority Upgrade: Bennett');
    expect(result.primaryAction.targetRoute).toBe('/roster/Bennett');
  });

  it('selects ENDGAME_READINESS when roster lacks enough ready units for Abyss', () => {
    const input: CompanionSummaryCalculationInput = {
      ...baseInput,
      readinessList: baseInput.readinessList.slice(0, 4), // only 4 units
      upgradesList: [], // no upgrades
      endgameStatus: {
        abyssScore: 45,
        abyssReady: false,
        onslaughtReady: false,
        theaterMaxActs: 2,
      },
    };
    const result = calculateCompanionSummary(input);

    expect(result.primaryAction.category).toBe('ENDGAME_READINESS');
    expect(result.primaryAction.headline).toContain('Strengthen Roster for Spiral Abyss');
    expect(result.primaryAction.targetRoute).toBe('/endgame');
  });

  it('selects PULL_STRATEGY when no immediate upgrades or endgame deficits exist and banner is high value', () => {
    const input: CompanionSummaryCalculationInput = {
      ...baseInput,
      upgradesList: [],
      endgameStatus: {
        abyssScore: 95,
        abyssReady: true,
        onslaughtReady: true,
        theaterMaxActs: 8,
      },
    };
    const result = calculateCompanionSummary(input);

    expect(result.primaryAction.category).toBe('PULL_STRATEGY');
    expect(result.primaryAction.headline).toContain('High Value Pull: Mavuika');
    expect(result.primaryAction.targetRoute).toBe('/intelligence');
  });

  it('flags partial account caveats and unrecorded talent notices', () => {
    const input: CompanionSummaryCalculationInput = {
      ...baseInput,
      accountScope: 'public_showcase',
      isPartialAccount: true,
      readinessList: [
        { characterKey: 'Mavuika', role: 'on_field_dps', score: 0, status: 'insufficient_data' },
      ],
    };
    const result = calculateCompanionSummary(input);

    expect(result.isPartialAccount).toBe(true);
    expect(result.missingDataCaveats).toHaveLength(2);
    expect(result.missingDataCaveats[0]).toContain('Partial public showcase');
    expect(result.missingDataCaveats[1]).toContain('unrecorded weapon or talent levels');
  });

  it('produces valid contracts matching companionSummaryResponseSchema', () => {
    const calcResult = calculateCompanionSummary(baseInput);
    const narrativeOverview = explainCompanionSummary(calcResult);

    const fullResponse = {
      ...calcResult,
      narrativeOverview,
    };

    const parsed = companionSummaryResponseSchema.safeParse(fullResponse);
    expect(parsed.success).toBe(true);
  });

  it('explainer produces clean, actionable narrative points', () => {
    const calcResult = calculateCompanionSummary(baseInput);
    const explanations = explainCompanionSummary(calcResult);

    expect(explanations.length).toBeGreaterThanOrEqual(4);
    expect(explanations[0]).toContain("Today's Focus [FARMING_AVAILABLE]");
    expect(explanations.some((e) => e.includes('Encounter Readiness: 7 of 8'))).toBe(true);
    expect(
      explanations.some((e) => e.includes('Active Drop Schedules: Materials for Bennett')),
    ).toBe(true);
    expect(explanations.some((e) => e.includes('Wish Spending Advisory: Mavuika'))).toBe(true);
  });

  it('synthesizes defensible team suggestions when at least 4 ready units exist', () => {
    const result = calculateCompanionSummary(baseInput);

    expect(result.teamSuggestion).toBeDefined();
    expect(result.teamSuggestion?.teamName).toBe('Furina Core');
    expect(result.teamSuggestion?.members).toHaveLength(4);
    expect(result.teamSuggestion?.targetRoute).toBe('/teams');

    const explanations = explainCompanionSummary(result);
    expect(explanations.some((e) => e.includes('Recommended Lineup'))).toBe(true);
  });
});
