import type { CharacterReadinessRequestInput } from '@celestia/api-contracts';
import { describe, expect, it } from 'vitest';

import {
  calculateReadiness,
  normalizeSlot,
  normalizeStatKey,
  resolveRoleBenchmark,
} from './readiness-intelligence.calculator.js';

describe('Readiness Intelligence Calculator', () => {
  describe('Stat & Slot Normalization Helpers', () => {
    it('normalizes various stat key representations correctly', () => {
      expect(normalizeStatKey('hp%')).toBe('hpPercent');
      expect(normalizeStatKey('HP_PERCENT')).toBe('hpPercent');
      expect(normalizeStatKey('er')).toBe('energyRecharge');
      expect(normalizeStatKey('energy_recharge')).toBe('energyRecharge');
      expect(normalizeStatKey('em')).toBe('elementalMastery');
      expect(normalizeStatKey('crit_rate')).toBe('critRate');
      expect(normalizeStatKey('crit_dmg')).toBe('critDmg');
      expect(normalizeStatKey('healing_bonus')).toBe('healingBonus');
      expect(normalizeStatKey('hydro_dmg')).toBe('hydroDmg');
      expect(normalizeStatKey('pyro_dmg')).toBe('pyroDmg');
    });

    it('normalizes artifact slot names correctly', () => {
      expect(normalizeSlot('Flower')).toBe('flower');
      expect(normalizeSlot('SANDS')).toBe('sands');
      expect(normalizeSlot('Circlet')).toBe('circlet');
    });
  });

  describe('Role Benchmark Resolution', () => {
    it('resolves Furina default party_buff benchmark', () => {
      const benchmark = resolveRoleBenchmark('Furina')!;
      expect(benchmark.roleId).toBe('party_buff');
      expect(benchmark.scalingStat).toBe('hp');
      expect(benchmark.energyRechargeThreshold).toBe(180);
    });

    it('resolves Xiangling off_field_damage benchmark', () => {
      const benchmark = resolveRoleBenchmark('Xiangling', 'off_field_damage')!;
      expect(benchmark.roleId).toBe('off_field_damage');
      expect(benchmark.priorityTalents).toContain('burst');
    });

    it('allows custom RoleBenchmarkProfile override', () => {
      const custom = {
        roleId: 'custom_speedrun',
        targetLevel: 90,
        targetAscension: 6,
        priorityTalents: ['burst' as const],
        minTalentLevels: { burst: 10 },
        recommendedWeapons: ['StaffOfHoma'],
        minWeaponLevel: 90,
        recommendedMainStats: {
          sands: ['atkPercent'],
          goblet: ['pyroDmg'],
          circlet: ['critDmg'],
        },
        recommendedSets: [{ setKey: 'CrimsonWitchOfFlames', pieces: 4 as const }],
        energyRechargeThreshold: 140,
        scalingStat: 'atk' as const,
      };
      const resolved = resolveRoleBenchmark('HuTao', custom)!;
      expect(resolved.roleId).toBe('custom_speedrun');
      expect(resolved.targetLevel).toBe(90);
    });
  });

  describe('Paired Archetype Fixtures: Ready vs Not-Ready', () => {
    // 1. DPS Role: Xiangling
    describe('DPS Archetype (Xiangling)', () => {
      const readyXiangling: CharacterReadinessRequestInput = {
        character: {
          characterKey: 'Xiangling',
          level: 80,
          ascension: 5,
          constellation: 4,
          talents: { normal: 1, skill: 8, burst: 9 },
          weapon: {
            weaponKey: 'TheCatch',
            level: 90,
            refinement: 5,
          },
          artifacts: {
            flower: { slot: 'flower', setKey: 'EmblemOfSeveredFate', mainStatKey: 'hp' },
            plume: { slot: 'plume', setKey: 'EmblemOfSeveredFate', mainStatKey: 'atk' },
            sands: { slot: 'sands', setKey: 'EmblemOfSeveredFate', mainStatKey: 'energyRecharge' },
            goblet: { slot: 'goblet', setKey: 'EmblemOfSeveredFate', mainStatKey: 'pyroDmg' },
            circlet: { slot: 'circlet', setKey: 'GladiatorsFinale', mainStatKey: 'critRate' },
          },
          stats: {
            energyRecharge: 215,
            critRate: 62.4,
            critDmg: 135.2,
            atk: 1450,
          },
        },
        roleProfile: 'off_field_damage',
        teamEnergyContext: {
          partyMembers: ['Bennett', 'Xingqiu', 'Kazuha'],
          sameElementCount: 2, // Bennett battery reduces ER requirement by 15%
          favoniusWeaponCount: 1, // Favonius reduces requirement by 10%
        },
      };

      const notReadyXiangling: CharacterReadinessRequestInput = {
        character: {
          characterKey: 'Xiangling',
          level: 60,
          ascension: 3,
          constellation: 0,
          talents: { normal: 1, skill: 4, burst: 4 },
          weapon: {
            weaponKey: 'DragonBane',
            level: 50,
            refinement: 1,
          },
          artifacts: {
            flower: { slot: 'flower', setKey: 'Berserker', mainStatKey: 'hp' },
            plume: { slot: 'plume', setKey: 'Berserker', mainStatKey: 'atk' },
            sands: { slot: 'sands', setKey: 'DefendersWill', mainStatKey: 'defPercent' },
            goblet: { slot: 'goblet', setKey: 'DefendersWill', mainStatKey: 'defPercent' },
            circlet: { slot: 'circlet', setKey: 'TheExile', mainStatKey: 'healingBonus' },
          },
          stats: {
            energyRecharge: 120,
            atk: 900,
          },
        },
        roleProfile: 'off_field_damage',
      };

      it('evaluates ready DPS as ready_for_target with a high composite score', () => {
        const result = calculateReadiness(readyXiangling);
        expect(result.status).toBe('ready_for_target');
        expect(result.score).toBeGreaterThanOrEqual(90);
        expect(result.dimensions.talents.isReady).toBe(true);
        expect(result.dimensions.weapon.isReady).toBe(true);
        expect(result.dimensions.main_stats.isReady).toBe(true);
        expect(result.dimensions.set_activation.isReady).toBe(true);
        expect(result.dimensions.rotation_energy.isReady).toBe(true);
      });

      it('evaluates not-ready DPS as needs_investment with specific dimension failures', () => {
        const result = calculateReadiness(notReadyXiangling);
        expect(result.status).toBe('needs_investment');
        expect(result.score).toBeLessThan(60);
        expect(result.dimensions.talents.status).toBe('needs_investment');
        expect(result.dimensions.weapon.status).toBe('needs_investment');
        expect(result.dimensions.main_stats.status).toBe('needs_investment');
        expect(result.dimensions.set_activation.status).toBe('needs_investment');
        expect(result.dimensions.rotation_energy.status).toBe('needs_investment');
      });
    });

    // 2. Support Archetype: Kazuha
    describe('Support Archetype (Kaedehara Kazuha)', () => {
      const readyKazuha: CharacterReadinessRequestInput = {
        character: {
          characterKey: 'KaedeharaKazuha',
          level: 90,
          ascension: 6,
          constellation: 0,
          talents: { normal: 6, skill: 8, burst: 8 },
          weapon: {
            weaponKey: 'IronSting',
            level: 90,
            refinement: 1,
          },
          artifacts: {
            flower: { slot: 'flower', setKey: 'ViridescentVenerer', mainStatKey: 'hp' },
            plume: { slot: 'plume', setKey: 'ViridescentVenerer', mainStatKey: 'atk' },
            sands: { slot: 'sands', setKey: 'ViridescentVenerer', mainStatKey: 'elementalMastery' },
            goblet: {
              slot: 'goblet',
              setKey: 'ViridescentVenerer',
              mainStatKey: 'elementalMastery',
            },
            circlet: {
              slot: 'circlet',
              setKey: 'WanderersTroupe',
              mainStatKey: 'elementalMastery',
            },
          },
          stats: {
            energyRecharge: 165,
            elementalMastery: 860,
          },
        },
        roleProfile: 'resistance_shred',
      };

      const notReadyKazuha: CharacterReadinessRequestInput = {
        character: {
          characterKey: 'KaedeharaKazuha',
          level: 70,
          ascension: 4,
          constellation: 0,
          talents: { normal: 1, skill: 4, burst: 4 },
          weapon: {
            weaponKey: 'IronSting',
            level: 60,
            refinement: 1,
          },
          artifacts: {
            flower: { slot: 'flower', setKey: 'ViridescentVenerer', mainStatKey: 'hp' },
            plume: { slot: 'plume', setKey: 'ViridescentVenerer', mainStatKey: 'atk' },
            sands: { slot: 'sands', setKey: 'NoblesseOblige', mainStatKey: 'atkPercent' },
            goblet: { slot: 'goblet', setKey: 'NoblesseOblige', mainStatKey: 'anemoDmg' },
            circlet: { slot: 'circlet', setKey: 'GladiatorsFinale', mainStatKey: 'critRate' },
          },
          stats: {
            energyRecharge: 115,
            elementalMastery: 220,
          },
        },
        roleProfile: 'resistance_shred',
      };

      it('evaluates ready Support as ready_for_target and verifies support output', () => {
        const result = calculateReadiness(readyKazuha);
        expect(result.status).toBe('ready_for_target');
        expect(result.dimensions.support_output.isReady).toBe(true);
        expect(result.dimensions.support_output.status).toBe('ready_for_target');
      });

      it('evaluates not-ready Support with support_output deficit and needs_investment', () => {
        const result = calculateReadiness(notReadyKazuha);
        expect(result.status).toBe('needs_investment');
        expect(result.dimensions.support_output.status).toBe('needs_investment');
      });
    });

    // 3. Buffer Archetype: Furina
    describe('Buffer Archetype (Furina)', () => {
      const readyFurina: CharacterReadinessRequestInput = {
        character: {
          characterKey: 'Furina',
          level: 80,
          ascension: 5,
          constellation: 0,
          talents: { normal: 1, skill: 9, burst: 9 },
          weapon: {
            weaponKey: 'FleuveCendreFerryman',
            level: 90,
            refinement: 5,
          },
          artifacts: {
            flower: { slot: 'flower', setKey: 'GoldenTroupe', mainStatKey: 'hp' },
            plume: { slot: 'plume', setKey: 'GoldenTroupe', mainStatKey: 'atk' },
            sands: { slot: 'sands', setKey: 'GoldenTroupe', mainStatKey: 'hpPercent' },
            goblet: { slot: 'goblet', setKey: 'GoldenTroupe', mainStatKey: 'hydroDmg' },
            circlet: { slot: 'circlet', setKey: 'MarechausseeHunter', mainStatKey: 'critRate' },
          },
          stats: {
            energyRecharge: 185,
            maxHp: 34500,
            critRate: 65,
            critDmg: 140,
          },
        },
        roleProfile: 'party_buff',
      };

      const notReadyFurina: CharacterReadinessRequestInput = {
        character: {
          characterKey: 'Furina',
          level: 70,
          ascension: 4,
          constellation: 0,
          talents: { normal: 1, skill: 5, burst: 5 },
          weapon: {
            weaponKey: 'HarbingerOfDawn',
            level: 70,
            refinement: 5,
          },
          artifacts: {
            flower: { slot: 'flower', setKey: 'GoldenTroupe', mainStatKey: 'hp' },
            plume: { slot: 'plume', setKey: 'GoldenTroupe', mainStatKey: 'atk' },
            sands: { slot: 'sands', setKey: 'GoldenTroupe', mainStatKey: 'atkPercent' },
            goblet: { slot: 'goblet', setKey: 'NoblesseOblige', mainStatKey: 'pyroDmg' },
            circlet: { slot: 'circlet', setKey: 'NoblesseOblige', mainStatKey: 'defPercent' },
          },
          stats: {
            energyRecharge: 125,
            maxHp: 21000,
          },
        },
        roleProfile: 'party_buff',
      };

      it('evaluates ready Buffer as ready_for_target with HP threshold met', () => {
        const result = calculateReadiness(readyFurina);
        expect(result.status).toBe('ready_for_target');
        expect(result.dimensions.set_activation.isReady).toBe(true);
        expect(result.dimensions.rotation_energy.isReady).toBe(true);
        expect(result.dimensions.support_output.isReady).toBe(true);
      });

      it('evaluates not-ready Buffer as needs_investment with main stats and HP deficits', () => {
        const result = calculateReadiness(notReadyFurina);
        expect(result.status).toBe('needs_investment');
        expect(result.dimensions.main_stats.status).toBe('needs_investment');
        expect(result.dimensions.support_output.status).toBe('needs_investment');
      });
    });
  });

  describe('Regression Tests', () => {
    // REGRESSION 1: Energy Recharge Deficit Defeats High Raw Stats
    it('forces status to needs_investment when ER deficit occurs despite perfect offensive stats', () => {
      const godRollOffensiveFurina: CharacterReadinessRequestInput = {
        character: {
          characterKey: 'Furina',
          level: 90,
          ascension: 6,
          constellation: 6,
          talents: { normal: 10, skill: 10, burst: 10 },
          weapon: {
            weaponKey: 'SplendorOfTranquilWaters',
            level: 90,
            refinement: 5,
          },
          artifacts: {
            flower: { slot: 'flower', setKey: 'GoldenTroupe', mainStatKey: 'hp' },
            plume: { slot: 'plume', setKey: 'GoldenTroupe', mainStatKey: 'atk' },
            sands: { slot: 'sands', setKey: 'GoldenTroupe', mainStatKey: 'hpPercent' },
            goblet: { slot: 'goblet', setKey: 'GoldenTroupe', mainStatKey: 'hydroDmg' },
            circlet: { slot: 'circlet', setKey: 'GoldenTroupe', mainStatKey: 'critRate' },
          },
          stats: {
            // High offensive stats
            critRate: 85.0,
            critDmg: 240.0,
            maxHp: 42000,
            // SEVERE ER DEFICIT: 110% ER vs 180% required
            energyRecharge: 110,
          },
        },
        roleProfile: 'party_buff',
        teamEnergyContext: {
          sameElementCount: 1, // Solo Hydro
          favoniusWeaponCount: 0,
        },
      };

      const result = calculateReadiness(godRollOffensiveFurina);

      // Invariant checks:
      expect(result.dimensions.talents.isReady).toBe(true);
      expect(result.dimensions.weapon.isReady).toBe(true);
      expect(result.dimensions.main_stats.isReady).toBe(true);
      expect(result.dimensions.set_activation.isReady).toBe(true);
      expect(result.dimensions.support_output.isReady).toBe(true);

      // But Rotation Energy is in severe deficit
      expect(result.dimensions.rotation_energy.status).toBe('needs_investment');
      expect(result.dimensions.rotation_energy.isReady).toBe(false);
      expect(result.metadata.hasEnergyDeficit).toBe(true);
      expect(result.metadata.energyDeficitPp).toBe(70);

      // The ER deficit MUST override everything else and mark the build needs_investment
      expect(result.status).toBe('needs_investment');
      // Composite score must be penalized and capped
      expect(result.score).toBeLessThanOrEqual(58);
    });

    it('marks build as conditional when ER is only marginally below threshold', () => {
      const marginalErXiangling: CharacterReadinessRequestInput = {
        character: {
          characterKey: 'Xiangling',
          level: 80,
          ascension: 5,
          talents: { normal: 1, skill: 8, burst: 9 },
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
            // Target is 200%, observed is 192% (deficit of 8pp <= 10pp)
            energyRecharge: 192,
            atk: 1400,
          },
        },
        roleProfile: 'off_field_damage',
      };

      const result = calculateReadiness(marginalErXiangling);
      expect(result.dimensions.rotation_energy.status).toBe('conditional');
      expect(result.status).toBe('conditional');
    });

    // REGRESSION 2: Missing Stats and Talents Return insufficient_data (Never False Positive)
    it('returns insufficient_data when priority talents are unrecorded', () => {
      const unrecordedTalentsBuild: CharacterReadinessRequestInput = {
        character: {
          characterKey: 'Furina',
          level: 80,
          ascension: 5,
          // Missing talents
          talents: { normal: null, skill: null, burst: null },
          weapon: { weaponKey: 'FleuveCendreFerryman', level: 90 },
          artifacts: {
            flower: { slot: 'flower', setKey: 'GoldenTroupe', mainStatKey: 'hp' },
            plume: { slot: 'plume', setKey: 'GoldenTroupe', mainStatKey: 'atk' },
            sands: { slot: 'sands', setKey: 'GoldenTroupe', mainStatKey: 'hpPercent' },
            goblet: { slot: 'goblet', setKey: 'GoldenTroupe', mainStatKey: 'hydroDmg' },
            circlet: { slot: 'circlet', setKey: 'GoldenTroupe', mainStatKey: 'critRate' },
          },
          stats: { energyRecharge: 185, maxHp: 32000 },
        },
        roleProfile: 'party_buff',
      };

      const result = calculateReadiness(unrecordedTalentsBuild);
      expect(result.dimensions.talents.status).toBe('insufficient_data');
      expect(result.dimensions.talents.isReady).toBe(false);
      expect(result.missingData.some((m) => m.dimension === 'talents')).toBe(true);
      // Overall status cannot be ready_for_target
      expect(result.status).toBe('insufficient_data');
    });

    it('returns insufficient_data when weapon is missing', () => {
      const noWeaponBuild: CharacterReadinessRequestInput = {
        character: {
          characterKey: 'Xiangling',
          level: 80,
          ascension: 5,
          talents: { normal: 1, skill: 8, burst: 8 },
          weapon: null,
          artifacts: {
            flower: { slot: 'flower', setKey: 'EmblemOfSeveredFate', mainStatKey: 'hp' },
            plume: { slot: 'plume', setKey: 'EmblemOfSeveredFate', mainStatKey: 'atk' },
            sands: { slot: 'sands', setKey: 'EmblemOfSeveredFate', mainStatKey: 'energyRecharge' },
            goblet: { slot: 'goblet', setKey: 'EmblemOfSeveredFate', mainStatKey: 'pyroDmg' },
            circlet: { slot: 'circlet', setKey: 'EmblemOfSeveredFate', mainStatKey: 'critRate' },
          },
          stats: { energyRecharge: 200, atk: 1200 },
        },
        roleProfile: 'off_field_damage',
      };

      const result = calculateReadiness(noWeaponBuild);
      expect(result.dimensions.weapon.status).toBe('insufficient_data');
      expect(result.status).toBe('insufficient_data');
    });

    it('returns insufficient_data when energy recharge stat is unrecorded in stats', () => {
      const missingErBuild: CharacterReadinessRequestInput = {
        character: {
          characterKey: 'Xiangling',
          level: 80,
          ascension: 5,
          talents: { normal: 1, skill: 8, burst: 8 },
          weapon: { weaponKey: 'TheCatch', level: 90 },
          artifacts: {
            flower: { slot: 'flower', setKey: 'EmblemOfSeveredFate', mainStatKey: 'hp' },
            plume: { slot: 'plume', setKey: 'EmblemOfSeveredFate', mainStatKey: 'atk' },
            sands: { slot: 'sands', setKey: 'EmblemOfSeveredFate', mainStatKey: 'energyRecharge' },
            goblet: { slot: 'goblet', setKey: 'EmblemOfSeveredFate', mainStatKey: 'pyroDmg' },
            circlet: { slot: 'circlet', setKey: 'EmblemOfSeveredFate', mainStatKey: 'critRate' },
          },
          // Missing energyRecharge from stats record
          stats: { atk: 1500, critRate: 60 },
        },
        roleProfile: 'off_field_damage',
      };

      const result = calculateReadiness(missingErBuild);
      expect(result.dimensions.rotation_energy.status).toBe('insufficient_data');
      expect(result.status).toBe('insufficient_data');
      expect(result.missingData.some((m) => m.dimension === 'rotation_energy')).toBe(true);
    });

    it('returns insufficient_data when key artifact slots (Sands/Goblet/Circlet) are missing', () => {
      const incompleteArtifactsBuild: CharacterReadinessRequestInput = {
        character: {
          characterKey: 'Furina',
          level: 80,
          ascension: 5,
          talents: { normal: 1, skill: 8, burst: 8 },
          weapon: { weaponKey: 'FleuveCendreFerryman', level: 90 },
          artifacts: {
            flower: { slot: 'flower', setKey: 'GoldenTroupe', mainStatKey: 'hp' },
            plume: { slot: 'plume', setKey: 'GoldenTroupe', mainStatKey: 'atk' },
            sands: null,
            goblet: null,
            circlet: null,
          },
          stats: { energyRecharge: 185, maxHp: 32000 },
        },
        roleProfile: 'party_buff',
      };

      const result = calculateReadiness(incompleteArtifactsBuild);
      expect(result.dimensions.main_stats.status).toBe('insufficient_data');
      expect(result.dimensions.set_activation.status).toBe('insufficient_data');
      expect(result.status).toBe('insufficient_data');
    });

    it('rejects unindexed/unverified characters and explains data gap without guessing scaling', async () => {
      const { explainReadiness } = await import('./readiness-intelligence.explainer.js');
      const unverifiedBuild: CharacterReadinessRequestInput = {
        character: {
          characterKey: 'NonExistentHero_999',
          level: 90,
          ascension: 6,
          talents: { normal: 10, skill: 10, burst: 10 },
          weapon: { weaponKey: 'FavoniusSword', level: 90 },
        },
        roleProfile: 'on_field_dps',
      };

      const result = calculateReadiness(unverifiedBuild);
      expect(result.status).toBe('insufficient_data');
      expect(result.score).toBe(0);
      expect(result.missingData.some((m) => m.reason === 'unverified_character_reference')).toBe(true);

      const explanations = explainReadiness(result);
      expect(
        explanations.some((e) =>
          e.includes(
            'Unverified character: "NonExistentHero_999" is not present in the verified character reference index',
          ),
        ),
      ).toBe(true);
    });
  });
});
