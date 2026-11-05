import type { MarginalInvestmentRequestInput } from '@celestia/api-contracts';
import { describe, expect, it } from 'vitest';

import {
  calculateCharacterAscensionCosts,
  calculateMarginalInvestment,
  calculateNormalizedCost,
  calculateTalentUpgradeCosts,
  calculateWeaponAscensionCosts,
  findCatalogCharacter,
  findCatalogWeapon,
} from './marginal-investment.calculator.js';

describe('Marginal Investment Advice Calculator (ADR-0011)', () => {
  describe('Progression Catalog Material Exact Cost Lookups', () => {
    it('resolves character aliases and weapon keys case-insensitively', () => {
      expect(findCatalogCharacter('Kazuha')?.name).toBe('Kaedehara Kazuha');
      expect(findCatalogCharacter('Furina')?.key).toBe('Furina');
      expect(findCatalogCharacter('Xiangling')?.key).toBe('Xiangling');
      expect(findCatalogWeapon('TheCatch')?.name).toBe('"The Catch"');
      expect(findCatalogWeapon('DragonBane')?.name).toBe("Dragon's Bane");
      expect(findCatalogWeapon('dragonsbane')?.name).toBe("Dragon's Bane");
    });

    it('calculates exact talent progression costs for Xiangling Pyronado (Lv 6 -> 8)', () => {
      const costs = calculateTalentUpgradeCosts('Xiangling', 6, 8)!;
      const costMap = Object.fromEntries(costs.map((c) => [c.materialKey, c.count]));

      // Phase 7 (6->7): 120,000 Mora + 4 PhilosophiesOfDiligence + 4 SlimeConcentrate + 1 DvalinsClaw
      // Phase 8 (7->8): 260,000 Mora + 6 PhilosophiesOfDiligence + 6 SlimeConcentrate + 1 DvalinsClaw
      expect(costMap['Mora']).toBe(380000);
      expect(costMap['PhilosophiesOfDiligence']).toBe(10);
      expect(costMap['SlimeConcentrate']).toBe(10);
      expect(costMap['DvalinsClaw']).toBe(2);

      const dvalin = costs.find((c) => c.materialKey === 'DvalinsClaw');
      expect(dvalin?.name).toBe("Dvalin's Claw");
    });

    it('calculates exact crowning costs for Furina (Lv 9 -> 10)', () => {
      const costs = calculateTalentUpgradeCosts('Furina', 9, 10)!;
      const costMap = Object.fromEntries(costs.map((c) => [c.materialKey, c.count]));

      // Phase 10: 700,000 Mora + 16 PhilosophiesOfJustice + 12 EnergyNectar + 2 LightlessMass + 1 CrownOfInsight
      expect(costMap['Mora']).toBe(700000);
      expect(costMap['PhilosophiesOfJustice']).toBe(16);
      expect(costMap['EnergyNectar']).toBe(12);
      expect(costMap['LightlessMass']).toBe(2);
      expect(costMap['CrownOfInsight']).toBe(1);

      const crown = costs.find((c) => c.materialKey === 'CrownOfInsight');
      expect(crown?.name).toBe('Crown of Insight');
    });

    it('calculates exact character ascension costs for Furina Phase 4 -> 5 (A4 -> A5)', () => {
      const costs = calculateCharacterAscensionCosts('Furina', 4, 5)!;
      const costMap = Object.fromEntries(costs.map((c) => [c.materialKey, c.count]));

      // Phase 5: 100,000 Mora + 6 VarunadaLazuriteChunk + 12 WaterThatFailedToTranscend + 45 LakelightLily + 12 EnergyNectar
      expect(costMap['Mora']).toBe(100000);
      expect(costMap['VarunadaLazuriteChunk']).toBe(6);
      expect(costMap['WaterThatFailedToTranscend']).toBe(12);
      expect(costMap['LakelightLily']).toBe(45);
      expect(costMap['EnergyNectar']).toBe(12);
    });

    it('calculates exact weapon ascension costs for The Catch Phase 5 -> 6', () => {
      const costs = calculateWeaponAscensionCosts('TheCatch', 5, 6)!;
      const costMap = Object.fromEntries(costs.map((c) => [c.materialKey, c.count]));

      // Phase 6: 45,000 Mora + 4 MaskOfTheKijin + 18 ChaosOculus + 12 SpectralNucleus
      expect(costMap['Mora']).toBe(45000);
      expect(costMap['MaskOfTheKijin']).toBe(4);
      expect(costMap['ChaosOculus']).toBe(18);
      expect(costMap['SpectralNucleus']).toBe(12);
    });

    it('assigns high normalized cost penalty to Crown of Insight and scarce boss items', () => {
      const regularLevelCosts = calculateTalentUpgradeCosts('Xiangling', 6, 8)!;
      const crownCosts = calculateTalentUpgradeCosts('Xiangling', 9, 10)!;

      const normalCost = calculateNormalizedCost(regularLevelCosts);
      const crownCost = calculateNormalizedCost(crownCosts);

      expect(crownCost).toBeGreaterThan(normalCost);
      expect(crownCost).toBeGreaterThan(3000);
    });
  });

  describe('Readiness Gap Closure vs Farming Trap Deprioritization', () => {
    it('prioritizes leveling Xiangling Pyronado over crowning Normal Attack on off-field DPS', () => {
      const input: MarginalInvestmentRequestInput = {
        character: {
          characterKey: 'Xiangling',
          level: 80,
          ascension: 5,
          constellation: 4,
          talents: {
            normal: 9, // artificially high normal attack considered for crown
            skill: 6,
            burst: 6, // priority talent below benchmark minimum of 8
          },
          weapon: {
            weaponKey: 'TheCatch',
            level: 90,
          },
          artifacts: {
            flower: { slot: 'flower', setKey: 'EmblemOfSeveredFate', mainStatKey: 'hp' },
            plume: { slot: 'plume', setKey: 'EmblemOfSeveredFate', mainStatKey: 'atk' },
            sands: { slot: 'sands', setKey: 'EmblemOfSeveredFate', mainStatKey: 'energyRecharge' },
            goblet: { slot: 'goblet', setKey: 'EmblemOfSeveredFate', mainStatKey: 'pyroDmg' },
            circlet: { slot: 'circlet', setKey: 'EmblemOfSeveredFate', mainStatKey: 'critRate' },
          },
          stats: {
            energyRecharge: 220,
            atk: 1400,
          },
        },
        roleProfile: 'off_field_damage',
      };

      const result = calculateMarginalInvestment(input);

      expect(result.recommendedNextAction).not.toBeNull();
      const topAction = result.recommendedNextAction!;

      // Top action must be burst upgrade (Pyronado)
      expect(topAction.category).toBe('talent');
      expect(topAction.target).toBe('burst');
      expect(topAction.currentLevel).toBe(6);
      expect(topAction.targetLevel).toBe(8);
      expect(topAction.closesGap).toBe(true);

      // Crowning normal attack must be present in ranked candidates but ranked at the bottom
      const crownNormal = result.rankedUpgrades.find(
        (u) => u.category === 'talent' && u.target === 'normal' && u.targetLevel === 10,
      );
      expect(crownNormal).toBeDefined();
      expect(crownNormal!.closesGap).toBe(false);
      expect(topAction.efficiencyScore).toBeGreaterThan(crownNormal!.efficiencyScore);
    });

    it('prioritizes resolving Furina Energy Recharge deficit over any talent upgrades', () => {
      const input: MarginalInvestmentRequestInput = {
        character: {
          characterKey: 'Furina',
          level: 80,
          ascension: 5,
          constellation: 0,
          talents: {
            normal: 1,
            skill: 8,
            burst: 8,
          },
          weapon: {
            weaponKey: 'SplendorOfTranquilWaters',
            level: 90,
          },
          artifacts: {
            flower: { slot: 'flower', setKey: 'GoldenTroupe', mainStatKey: 'hp' },
            plume: { slot: 'plume', setKey: 'GoldenTroupe', mainStatKey: 'atk' },
            sands: { slot: 'sands', setKey: 'GoldenTroupe', mainStatKey: 'hpPercent' }, // sands is HP instead of ER
            goblet: { slot: 'goblet', setKey: 'GoldenTroupe', mainStatKey: 'hpPercent' },
            circlet: { slot: 'circlet', setKey: 'GoldenTroupe', mainStatKey: 'critRate' },
          },
          stats: {
            energyRecharge: 130, // severe ER deficit (threshold is 180)
            maxHp: 38000,
          },
        },
        roleProfile: 'party_buff',
      };

      const result = calculateMarginalInvestment(input);

      // Current readiness should reflect the energy deficit penalty
      expect(result.currentReadiness.metadata.hasEnergyDeficit).toBe(true);
      expect(result.currentReadiness.score).toBeLessThanOrEqual(58);

      expect(result.recommendedNextAction).not.toBeNull();
      const topAction = result.recommendedNextAction!;

      // Top action must address ER via Sands
      expect(topAction.category).toBe('artifact_main_stat');
      expect(topAction.target).toBe('sands');
      expect(topAction.closesGap).toBe(true);
      expect(topAction.expectedScoreDelta).toBeGreaterThanOrEqual(25);
      expect(topAction.efficiencyScore).toBeGreaterThan(10);
    });
  });

  describe('Diminishing Returns on Ready Characters', () => {
    it('flags remaining upgrades as optional with diminishing returns when character is ready_for_target', () => {
      const input: MarginalInvestmentRequestInput = {
        character: {
          characterKey: 'Xiangling',
          level: 80,
          ascension: 5,
          constellation: 6,
          talents: {
            normal: 1,
            skill: 8,
            burst: 9,
          },
          weapon: {
            weaponKey: 'TheCatch',
            level: 90,
          },
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
          stats: {
            energyRecharge: 220,
            atk: 1450,
          },
        },
        roleProfile: 'off_field_damage',
      };

      const result = calculateMarginalInvestment(input);

      expect(result.currentReadiness.status).toBe('ready_for_target');
      expect(result.currentReadiness.score).toBeGreaterThanOrEqual(90);

      // All remaining upgrades on a ready character must have closesGap = false
      for (const upgrade of result.rankedUpgrades) {
        expect(upgrade.closesGap).toBe(false);
      }
    });
  });
});
