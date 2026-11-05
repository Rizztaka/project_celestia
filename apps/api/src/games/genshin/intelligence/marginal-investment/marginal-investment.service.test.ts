import type { MarginalInvestmentRequestInput } from '@celestia/api-contracts';
import { describe, expect, it } from 'vitest';

import { MarginalInvestmentService } from './marginal-investment.service.js';

describe('Marginal Investment Service & Explainer Orchestration (ADR-0011)', () => {
  const service = new MarginalInvestmentService();

  it('orchestrates calculator and explainer returning { recommendation, score, explanations }', () => {
    const input: MarginalInvestmentRequestInput = {
      character: {
        characterKey: 'Xiangling',
        level: 80,
        ascension: 5,
        constellation: 4,
        talents: { normal: 1, skill: 6, burst: 6 },
        weapon: { weaponKey: 'TheCatch', level: 90 },
        artifacts: {
          flower: { slot: 'flower', setKey: 'EmblemOfSeveredFate', mainStatKey: 'hp', level: 20 },
          plume: { slot: 'plume', setKey: 'EmblemOfSeveredFate', mainStatKey: 'atk', level: 20 },
          sands: {
            slot: 'sands',
            setKey: 'EmblemOfSeveredFate',
            mainStatKey: 'energyRecharge',
            level: 20,
          },
          goblet: {
            slot: 'goblet',
            setKey: 'EmblemOfSeveredFate',
            mainStatKey: 'pyroDmg',
            level: 20,
          },
          circlet: {
            slot: 'circlet',
            setKey: 'EmblemOfSeveredFate',
            mainStatKey: 'critRate',
            level: 20,
          },
        },
        stats: { energyRecharge: 220, atk: 1400 },
      },
      roleProfile: 'off_field_damage',
    };

    const result = service.evaluate(input);

    // Structure verification
    expect(result).toHaveProperty('currentReadiness');
    expect(result).toHaveProperty('rankedUpgrades');
    expect(result).toHaveProperty('recommendedNextAction');
    expect(result).toHaveProperty('explanations');
    expect(result).toHaveProperty('recommendation');
    expect(result).toHaveProperty('score');

    expect(typeof result.score).toBe('number');
    expect(Array.isArray(result.explanations)).toBe(true);
    expect(result.explanations.length).toBeGreaterThan(0);

    // Explanations should contain rationale and exact materials
    const explanationsText = result.explanations.join(' ');
    expect(explanationsText).toContain('Top Recommendation:');
    expect(explanationsText).toContain('BURST');
    expect(explanationsText).toContain('Materials Required:');
    expect(explanationsText).toContain('Philosophies of Diligence');
  });

  it('generates ER deficit diagnosis in explanations when character lacks energy', () => {
    const input: MarginalInvestmentRequestInput = {
      character: {
        characterKey: 'Furina',
        level: 80,
        ascension: 5,
        talents: { normal: 1, skill: 8, burst: 8 },
        weapon: { weaponKey: 'SplendorOfTranquilWaters', level: 90 },
        artifacts: {
          flower: { slot: 'flower', setKey: 'GoldenTroupe', mainStatKey: 'hp' },
          plume: { slot: 'plume', setKey: 'GoldenTroupe', mainStatKey: 'atk' },
          sands: { slot: 'sands', setKey: 'GoldenTroupe', mainStatKey: 'hpPercent' },
          goblet: { slot: 'goblet', setKey: 'GoldenTroupe', mainStatKey: 'hpPercent' },
          circlet: { slot: 'circlet', setKey: 'GoldenTroupe', mainStatKey: 'critRate' },
        },
        stats: { energyRecharge: 130, maxHp: 38000 },
      },
      roleProfile: 'party_buff',
    };

    const result = service.evaluate(input);
    const explanationsText = result.explanations.join(' ');

    expect(explanationsText).toContain('Energy Recharge');
    expect(explanationsText).toContain('rotation energy threshold');
  });

  it('includes diminishing returns note when character is already ready_for_target', () => {
    const input: MarginalInvestmentRequestInput = {
      character: {
        characterKey: 'Xiangling',
        level: 80,
        ascension: 5,
        talents: { normal: 1, skill: 8, burst: 9 },
        weapon: { weaponKey: 'TheCatch', level: 90 },
        artifacts: {
          flower: { slot: 'flower', setKey: 'EmblemOfSeveredFate', mainStatKey: 'hp', level: 20 },
          plume: { slot: 'plume', setKey: 'EmblemOfSeveredFate', mainStatKey: 'atk', level: 20 },
          sands: {
            slot: 'sands',
            setKey: 'EmblemOfSeveredFate',
            mainStatKey: 'energyRecharge',
            level: 20,
          },
          goblet: {
            slot: 'goblet',
            setKey: 'EmblemOfSeveredFate',
            mainStatKey: 'pyroDmg',
            level: 20,
          },
          circlet: {
            slot: 'circlet',
            setKey: 'EmblemOfSeveredFate',
            mainStatKey: 'critRate',
            level: 20,
          },
        },
        stats: { energyRecharge: 220, atk: 1450 },
      },
      roleProfile: 'off_field_damage',
    };

    const result = service.evaluate(input);
    const explanationsText = result.explanations.join(' ');

    expect(result.currentReadiness.status).toBe('ready_for_target');
    expect(explanationsText).toContain('Diminishing Returns Note:');
  });

  it('includes farming trap warning when crowning non-essential talent is evaluated', () => {
    const input: MarginalInvestmentRequestInput = {
      character: {
        characterKey: 'Xiangling',
        level: 80,
        ascension: 5,
        talents: { normal: 9, skill: 6, burst: 6 },
        weapon: { weaponKey: 'TheCatch', level: 90 },
        artifacts: {
          flower: { slot: 'flower', setKey: 'EmblemOfSeveredFate', mainStatKey: 'hp' },
          plume: { slot: 'plume', setKey: 'EmblemOfSeveredFate', mainStatKey: 'atk' },
          sands: { slot: 'sands', setKey: 'EmblemOfSeveredFate', mainStatKey: 'energyRecharge' },
          goblet: { slot: 'goblet', setKey: 'EmblemOfSeveredFate', mainStatKey: 'pyroDmg' },
          circlet: { slot: 'circlet', setKey: 'EmblemOfSeveredFate', mainStatKey: 'critRate' },
        },
        stats: { energyRecharge: 220, atk: 1400 },
      },
      roleProfile: 'off_field_damage',
    };

    const result = service.evaluate(input);
    const explanationsText = result.explanations.join(' ');

    expect(explanationsText).toContain('Farming Trap Warning:');
    expect(explanationsText).toContain('Crown of Insight');
  });
});
