import { describe, expect, it } from 'vitest';

import { MarginalInvestmentService } from './marginal-investment/marginal-investment.service.js';
import { ReadinessIntelligenceService } from './readiness-intelligence/readiness-intelligence.service.js';

describe('End-to-End Account Roster & Build Readiness Integration (KQM 1.0 - 7.1)', () => {
  const readinessService = new ReadinessIntelligenceService();
  const marginalService = new MarginalInvestmentService();

  // Case 1: Optimal Endgame Build (Hu Tao & Raiden Shogun)
  describe('Case 1: Optimal Build Evaluation', () => {
    it('evaluates optimal Raiden Shogun with Tier 1 weapon (Engulfing Lightning) and 4pc Emblem as ready_for_target', () => {
      const input = {
        character: {
          characterKey: 'RaidenShogun',
          level: 90,
          ascension: 6,
          constellation: 0,
          talents: { normal: 6, skill: 9, burst: 10 },
          weapon: {
            weaponKey: 'EngulfingLightning',
            level: 90,
            refinement: 1,
            weaponType: 'Polearm',
          },
          artifacts: {
            flower: {
              slot: 'flower' as const,
              setKey: 'EmblemOfSeveredFate',
              mainStatKey: 'hp',
              level: 20,
              rarity: 5,
            },
            plume: {
              slot: 'plume' as const,
              setKey: 'EmblemOfSeveredFate',
              mainStatKey: 'atk',
              level: 20,
              rarity: 5,
            },
            sands: {
              slot: 'sands' as const,
              setKey: 'EmblemOfSeveredFate',
              mainStatKey: 'energyRecharge',
              level: 20,
              rarity: 5,
            },
            goblet: {
              slot: 'goblet' as const,
              setKey: 'EmblemOfSeveredFate',
              mainStatKey: 'electroDmg',
              level: 20,
              rarity: 5,
            },
            circlet: {
              slot: 'circlet' as const,
              setKey: 'EmblemOfSeveredFate',
              mainStatKey: 'critRate',
              level: 20,
              rarity: 5,
            },
          },
          stats: {
            atk: 1850,
            energyRecharge: 270,
            critRate: 68,
            critDmg: 145,
          },
        },
        roleProfile: 'on_field_damage',
      };

      const readiness = readinessService.evaluateReadiness(input);

      expect(readiness.status).toBe('ready_for_target');
      expect(readiness.score).toBeGreaterThanOrEqual(90);
      expect(readiness.dimensions.weapon!.isReady).toBe(true);
      expect(readiness.dimensions.weapon!.status).toBe('ready_for_target');
      expect(readiness.dimensions.set_activation!.isReady).toBe(true);
      expect(readiness.dimensions.main_stats!.isReady).toBe(true);
      expect(readiness.dimensions.rotation_energy!.isReady).toBe(true);
      expect(readiness.dimensions.talents!.isReady).toBe(true);
    });

    it('evaluates optimal Hu Tao with Tier 1 weapon (Staff of Homa) and 4pc Crimson Witch as ready_for_target', () => {
      const input = {
        character: {
          characterKey: 'HuTao',
          level: 90,
          ascension: 6,
          constellation: 1,
          talents: { normal: 10, skill: 9, burst: 8 },
          weapon: {
            weaponKey: 'StaffOfHoma',
            level: 90,
            refinement: 1,
            weaponType: 'Polearm',
          },
          artifacts: {
            flower: {
              slot: 'flower' as const,
              setKey: 'CrimsonWitchOfFlames',
              mainStatKey: 'hp',
              level: 20,
              rarity: 5,
            },
            plume: {
              slot: 'plume' as const,
              setKey: 'CrimsonWitchOfFlames',
              mainStatKey: 'atk',
              level: 20,
              rarity: 5,
            },
            sands: {
              slot: 'sands' as const,
              setKey: 'CrimsonWitchOfFlames',
              mainStatKey: 'hpPercent',
              level: 20,
              rarity: 5,
            },
            goblet: {
              slot: 'goblet' as const,
              setKey: 'CrimsonWitchOfFlames',
              mainStatKey: 'pyroDmg',
              level: 20,
              rarity: 5,
            },
            circlet: {
              slot: 'circlet' as const,
              setKey: 'CrimsonWitchOfFlames',
              mainStatKey: 'critRate',
              level: 20,
              rarity: 5,
            },
          },
          stats: {
            hp: 33500,
            atk: 1280,
            energyRecharge: 115,
            critRate: 72,
            critDmg: 224,
          },
        },
        roleProfile: 'on_field_damage',
      };

      const readiness = readinessService.evaluateReadiness(input);

      expect(readiness.status).toBe('ready_for_target');
      expect(readiness.score).toBeGreaterThanOrEqual(90);
      expect(readiness.dimensions.weapon!.isReady).toBe(true);
      expect(readiness.dimensions.set_activation!.isReady).toBe(true);
      expect(readiness.dimensions.main_stats!.isReady).toBe(true);
      expect(readiness.dimensions.rotation_energy!.isReady).toBe(true);
      expect(readiness.dimensions.talents!.isReady).toBe(true);
    });
  });

  // Case 2: Suboptimal / Transitional Build Case (Odette & Sandrone)
  describe('Case 2: Suboptimal / Transitional Build Evaluation & Marginal Suggestions', () => {
    it('evaluates Odette with mismatched Cryo DMG% Goblet instead of ATK% Goblet as needs_investment with domain target', () => {
      const input = {
        character: {
          characterKey: 'Odette',
          level: 80,
          ascension: 5,
          constellation: 0,
          talents: { normal: 1, skill: 8, burst: 6 },
          weapon: {
            weaponKey: 'HarbingerOfDawn',
            level: 80,
            refinement: 5,
            weaponType: 'Sword',
          },
          artifacts: {
            flower: {
              slot: 'flower' as const,
              setKey: 'HeartOfTheFurnace',
              mainStatKey: 'hp',
              level: 20,
              rarity: 5,
            },
            plume: {
              slot: 'plume' as const,
              setKey: 'HeartOfTheFurnace',
              mainStatKey: 'atk',
              level: 20,
              rarity: 5,
            },
            sands: {
              slot: 'sands' as const,
              setKey: 'HeartOfTheFurnace',
              mainStatKey: 'atkPercent',
              level: 20,
              rarity: 5,
            },
            goblet: {
              slot: 'goblet' as const,
              // Odette's verified benchmark expects ATK% Goblet for stellar output scaling
              setKey: 'HeartOfTheFurnace',
              mainStatKey: 'cryoDmg',
              level: 20,
              rarity: 5,
            },
            circlet: {
              slot: 'circlet' as const,
              setKey: 'HeartOfTheFurnace',
              mainStatKey: 'critRate',
              level: 20,
              rarity: 5,
            },
          },
          stats: {
            atk: 1750,
            energyRecharge: 100,
            critRate: 60,
            critDmg: 120,
          },
        },
        roleProfile: 'off_field_damage',
      };

      const readiness = readinessService.evaluateReadiness(input);

      // Main stats dimension flags suboptimal slot
      expect(readiness.dimensions.main_stats!.isReady).toBe(false);
      expect(readiness.dimensions.main_stats!.status).toBe('needs_investment');
      expect(readiness.status).toBe('needs_investment');

      const marginal = marginalService.evaluate(input);
      expect(marginal.rankedUpgrades.length).toBeGreaterThan(0);

      // Proposes upgrading the mismatched Goblet main stat to ATK%
      const gobletUpgrade = marginal.rankedUpgrades.find(
        (u) => u.category === 'artifact_main_stat' && u.target === 'goblet',
      );
      expect(gobletUpgrade).toBeDefined();
      expect(gobletUpgrade!.category).toBe('artifact_main_stat');
      expect(gobletUpgrade!.target).toBe('goblet');
      expect(gobletUpgrade!.costs.some((c) => c.name.startsWith('Domain:'))).toBe(true);

      // Explanation details the domain and stat shift
      expect(marginal.explanations.some((exp) => exp.toLowerCase().includes('goblet'))).toBe(true);
      expect(marginal.explanations.some((exp) => exp.includes('Farming Target'))).toBe(true);
    });

    it('evaluates Odette with unnecessary ER Sands instead of ATK% Sands as needs_investment', () => {
      const input = {
        character: {
          characterKey: 'Odette',
          level: 80,
          ascension: 5,
          constellation: 0,
          talents: { normal: 1, skill: 8, burst: 6 },
          weapon: {
            weaponKey: 'HarbingerOfDawn',
            level: 80,
            refinement: 5,
            weaponType: 'Sword',
          },
          artifacts: {
            flower: {
              slot: 'flower' as const,
              setKey: 'HeartOfTheFurnace',
              mainStatKey: 'hp',
              level: 20,
              rarity: 5,
            },
            plume: {
              slot: 'plume' as const,
              setKey: 'HeartOfTheFurnace',
              mainStatKey: 'atk',
              level: 20,
              rarity: 5,
            },
            sands: {
              slot: 'sands' as const,
              // Mismatched ER sands when burst is skipped
              setKey: 'HeartOfTheFurnace',
              mainStatKey: 'energyRecharge',
              level: 20,
              rarity: 5,
            },
            goblet: {
              slot: 'goblet' as const,
              setKey: 'HeartOfTheFurnace',
              mainStatKey: 'atkPercent',
              level: 20,
              rarity: 5,
            },
            circlet: {
              slot: 'circlet' as const,
              setKey: 'HeartOfTheFurnace',
              mainStatKey: 'critRate',
              level: 20,
              rarity: 5,
            },
          },
          stats: {
            atk: 1600,
            energyRecharge: 152,
            critRate: 60,
            critDmg: 120,
          },
        },
        roleProfile: 'off_field_damage',
      };

      const readiness = readinessService.evaluateReadiness(input);
      expect(readiness.dimensions.main_stats!.isReady).toBe(false);

      const marginal = marginalService.evaluate(input);
      const sandsUpgrade = marginal.rankedUpgrades.find(
        (u) => u.category === 'artifact_main_stat' && u.target === 'sands',
      );
      expect(sandsUpgrade).toBeDefined();
      expect(sandsUpgrade!.category).toBe('artifact_main_stat');
      expect(sandsUpgrade!.target).toBe('sands');
      expect(sandsUpgrade!.costs.some((c) => c.name.startsWith('Domain:'))).toBe(true);
    });
  });

  // Case 3: Budget / F2P Build Case (Chevreuse & Vodyanitsa with 3★ weapons)
  describe('Case 3: Budget / F2P Viable BiS Evaluation', () => {
    it('recognizes 3★ Black Tassel on Chevreuse with 4pc Noblesse and HP >= 40k as fully ready_for_target', () => {
      const input = {
        character: {
          characterKey: 'Chevreuse',
          level: 80,
          ascension: 5,
          constellation: 0,
          talents: { normal: 1, skill: 8, burst: 6 },
          weapon: {
            // 3-star weapon that acts as verified F2P BiS for HP scaling
            weaponKey: 'BlackTassel',
            level: 80,
            refinement: 5,
            weaponType: 'Polearm',
          },
          artifacts: {
            flower: {
              slot: 'flower' as const,
              setKey: 'NoblesseOblige',
              mainStatKey: 'hp',
              level: 20,
              rarity: 5,
            },
            plume: {
              slot: 'plume' as const,
              setKey: 'NoblesseOblige',
              mainStatKey: 'atk',
              level: 20,
              rarity: 5,
            },
            sands: {
              slot: 'sands' as const,
              setKey: 'NoblesseOblige',
              mainStatKey: 'hpPercent',
              level: 20,
              rarity: 5,
            },
            goblet: {
              slot: 'goblet' as const,
              setKey: 'NoblesseOblige',
              mainStatKey: 'hpPercent',
              level: 20,
              rarity: 5,
            },
            circlet: {
              slot: 'circlet' as const,
              setKey: 'NoblesseOblige',
              mainStatKey: 'hpPercent',
              level: 20,
              rarity: 5,
            },
          },
          stats: {
            hp: 41200,
            energyRecharge: 110,
          },
        },
        roleProfile: 'resistance_shred',
      };

      const readiness = readinessService.evaluateReadiness(input);

      // Assert 3★ weapon is verified as recommended and fully ready
      expect(readiness.dimensions.weapon!.isReady).toBe(true);
      expect(readiness.dimensions.weapon!.status).toBe('ready_for_target');
      expect(readiness.dimensions.support_output!.isReady).toBe(true);
      expect(readiness.dimensions.set_activation!.isReady).toBe(true);
      expect(readiness.status).toBe('ready_for_target');
    });

    it('recognizes 3★ Thrilling Tales on Vodyanitsa with 4pc Tenacity and HP >= 40k as fully ready_for_target', () => {
      const input = {
        character: {
          characterKey: 'Vodyanitsa',
          level: 80,
          ascension: 5,
          constellation: 0,
          talents: { normal: 1, skill: 8, burst: 6 },
          weapon: {
            // 3-star weapon that acts as verified F2P BiS for ATK buffing & HP scaling
            weaponKey: 'ThrillingTalesOfDragonSlayers',
            level: 80,
            refinement: 5,
            weaponType: 'Catalyst',
          },
          artifacts: {
            flower: {
              slot: 'flower' as const,
              setKey: 'TenacityOfTheMillelith',
              mainStatKey: 'hp',
              level: 20,
              rarity: 5,
            },
            plume: {
              slot: 'plume' as const,
              setKey: 'TenacityOfTheMillelith',
              mainStatKey: 'atk',
              level: 20,
              rarity: 5,
            },
            sands: {
              slot: 'sands' as const,
              setKey: 'TenacityOfTheMillelith',
              mainStatKey: 'hpPercent',
              level: 20,
              rarity: 5,
            },
            goblet: {
              slot: 'goblet' as const,
              setKey: 'TenacityOfTheMillelith',
              mainStatKey: 'hpPercent',
              level: 20,
              rarity: 5,
            },
            circlet: {
              slot: 'circlet' as const,
              setKey: 'TenacityOfTheMillelith',
              mainStatKey: 'healingBonus',
              level: 20,
              rarity: 5,
            },
          },
          stats: {
            hp: 40500,
            energyRecharge: 105,
          },
        },
        roleProfile: 'healing_support',
      };

      const readiness = readinessService.evaluateReadiness(input);

      expect(readiness.dimensions.weapon!.isReady).toBe(true);
      expect(readiness.dimensions.weapon!.status).toBe('ready_for_target');
      expect(readiness.dimensions.support_output!.isReady).toBe(true);
      expect(readiness.dimensions.set_activation!.isReady).toBe(true);
      expect(readiness.status).toBe('ready_for_target');
    });
  });

  // Case 4: Talent Priority Scaling
  describe('Case 4: Talent Priority Guidance', () => {
    it('advises leveling Normal Attack before Skill for Sandrone', () => {
      const input = {
        character: {
          characterKey: 'Sandrone',
          level: 80,
          ascension: 5,
          constellation: 0,
          talents: { normal: 6, skill: 6, burst: 6 },
          weapon: {
            weaponKey: 'AThousandBlazingSuns',
            level: 80,
            refinement: 1,
            weaponType: 'Claymore',
          },
          artifacts: {
            flower: {
              slot: 'flower' as const,
              setKey: 'DisenchantmentInDeepShadow',
              mainStatKey: 'hp',
              level: 20,
              rarity: 5,
            },
            plume: {
              slot: 'plume' as const,
              setKey: 'DisenchantmentInDeepShadow',
              mainStatKey: 'atk',
              level: 20,
              rarity: 5,
            },
            sands: {
              slot: 'sands' as const,
              setKey: 'DisenchantmentInDeepShadow',
              mainStatKey: 'atkPercent',
              level: 20,
              rarity: 5,
            },
            goblet: {
              slot: 'goblet' as const,
              setKey: 'DisenchantmentInDeepShadow',
              mainStatKey: 'atkPercent',
              level: 20,
              rarity: 5,
            },
            circlet: {
              slot: 'circlet' as const,
              setKey: 'DisenchantmentInDeepShadow',
              mainStatKey: 'critRate',
              level: 20,
              rarity: 5,
            },
          },
          stats: {
            atk: 2200,
            energyRecharge: 100,
            critRate: 65,
            critDmg: 130,
          },
        },
        roleProfile: 'on_field_damage',
      };

      const marginal = marginalService.evaluate(input);

      // Verify that talent candidates are generated
      const talentUpgrades = marginal.rankedUpgrades.filter((u) => u.category === 'talent');
      expect(talentUpgrades.length).toBeGreaterThan(0);

      // First priority talent for Sandrone is normal attack
      const normalUpgrade = talentUpgrades.find((u) => u.target === 'normal');
      const skillUpgrade = talentUpgrades.find((u) => u.target === 'skill');

      expect(normalUpgrade).toBeDefined();
      expect(normalUpgrade!.targetLevel).toBe(8);

      if (skillUpgrade) {
        expect(normalUpgrade!.efficiencyScore).toBeGreaterThanOrEqual(skillUpgrade.efficiencyScore);
      }
    });

    it('advises leveling Skill and never Normal Attack for Odette', () => {
      const input = {
        character: {
          characterKey: 'Odette',
          level: 80,
          ascension: 5,
          constellation: 0,
          talents: { normal: 1, skill: 6, burst: 6 },
          weapon: {
            weaponKey: 'HarbingerOfDawn',
            level: 80,
            refinement: 5,
            weaponType: 'Sword',
          },
          artifacts: {
            flower: {
              slot: 'flower' as const,
              setKey: 'HeartOfTheFurnace',
              mainStatKey: 'hp',
              level: 20,
              rarity: 5,
            },
            plume: {
              slot: 'plume' as const,
              setKey: 'HeartOfTheFurnace',
              mainStatKey: 'atk',
              level: 20,
              rarity: 5,
            },
            sands: {
              slot: 'sands' as const,
              setKey: 'HeartOfTheFurnace',
              mainStatKey: 'atkPercent',
              level: 20,
              rarity: 5,
            },
            goblet: {
              slot: 'goblet' as const,
              setKey: 'HeartOfTheFurnace',
              mainStatKey: 'atkPercent',
              level: 20,
              rarity: 5,
            },
            circlet: {
              slot: 'circlet' as const,
              setKey: 'HeartOfTheFurnace',
              mainStatKey: 'critRate',
              level: 20,
              rarity: 5,
            },
          },
          stats: {
            atk: 2250,
            energyRecharge: 100,
            critRate: 65,
            critDmg: 130,
          },
        },
        roleProfile: 'off_field_damage',
      };

      const marginal = marginalService.evaluate(input);

      // Odette's primary talent is Skill
      const skillUpgrade = marginal.rankedUpgrades.find(
        (u) => u.category === 'talent' && u.target === 'skill',
      );
      expect(skillUpgrade).toBeDefined();
      expect(skillUpgrade!.targetLevel).toBe(8);

      // Normal Attack should NOT be recommended for off-field Odette
      const normalUpgrade = marginal.rankedUpgrades.find(
        (u) => u.category === 'talent' && u.target === 'normal',
      );
      expect(normalUpgrade).toBeUndefined();
    });

    it('advises leveling Burst and never Normal Attack for Raiden Shogun', () => {
      const input = {
        character: {
          characterKey: 'RaidenShogun',
          level: 80,
          ascension: 5,
          constellation: 0,
          talents: { normal: 1, skill: 6, burst: 6 },
          weapon: {
            weaponKey: 'TheCatch',
            level: 80,
            refinement: 5,
            weaponType: 'Polearm',
          },
          artifacts: {
            flower: {
              slot: 'flower' as const,
              setKey: 'EmblemOfSeveredFate',
              mainStatKey: 'hp',
              level: 20,
              rarity: 5,
            },
            plume: {
              slot: 'plume' as const,
              setKey: 'EmblemOfSeveredFate',
              mainStatKey: 'atk',
              level: 20,
              rarity: 5,
            },
            sands: {
              slot: 'sands' as const,
              setKey: 'EmblemOfSeveredFate',
              mainStatKey: 'energyRecharge',
              level: 20,
              rarity: 5,
            },
            goblet: {
              slot: 'goblet' as const,
              setKey: 'EmblemOfSeveredFate',
              mainStatKey: 'electroDmg',
              level: 20,
              rarity: 5,
            },
            circlet: {
              slot: 'circlet' as const,
              setKey: 'EmblemOfSeveredFate',
              mainStatKey: 'critRate',
              level: 20,
              rarity: 5,
            },
          },
          stats: {
            atk: 1550,
            energyRecharge: 220,
            critRate: 60,
            critDmg: 120,
          },
        },
        roleProfile: 'on_field_damage',
      };

      const marginal = marginalService.evaluate(input);

      // Raiden's top talent is Burst
      const burstUpgrade = marginal.rankedUpgrades.find(
        (u) => u.category === 'talent' && u.target === 'burst',
      );
      expect(burstUpgrade).toBeDefined();
      expect(burstUpgrade!.targetLevel).toBe(8);

      // Normal Attack should NOT be recommended for Raiden Burst carry
      const normalUpgrade = marginal.rankedUpgrades.find(
        (u) => u.category === 'talent' && u.target === 'normal',
      );
      expect(normalUpgrade).toBeUndefined();
    });
  });
});
