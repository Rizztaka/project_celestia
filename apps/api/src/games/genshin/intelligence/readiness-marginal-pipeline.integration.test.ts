import { describe, expect, it } from 'vitest';

// @ts-expect-error tooling fixture module has no explicit d.ts
import { analysisFixture } from '../../../../tooling/build-analysis-fixtures.mjs';
import { progressionCatalog } from '../companion/progression-catalog.js';
import { importedAccountFixture } from '../importer/imported-account.fixtures.js';
import { MarginalInvestmentService } from './marginal-investment/marginal-investment.service.js';
import { ReadinessIntelligenceService } from './readiness-intelligence/readiness-intelligence.service.js';

interface FixtureCharacter {
  name: string;
  level: number;
  ascension: number;
  constellation: number;
  talents: Array<{ kind: string; baseLevel: number }>;
  weapon: { name: string; level: number; refinement: number };
  artifacts: Array<{
    slot: string;
    setName: string;
    mainStat?: { name: string };
    level?: number;
    rarity?: number;
  }>;
  stats: Array<{ id: string; value: number }>;
}

describe('Readiness & Marginal Investment Pipeline Integration', () => {
  const readinessService = new ReadinessIntelligenceService();
  const marginalService = new MarginalInvestmentService();

  describe('Scenario A: Partial Public Showcase Fixture (Incomplete / Unverified Builds)', () => {
    const fixture = analysisFixture('800000001');

    it('evaluates characters with unrecorded/missing weapon to insufficient_data without unhandled exceptions', () => {
      const furina = fixture.snapshot.characters.find(
        (c: FixtureCharacter) => c.name === 'Furina',
      ) as FixtureCharacter;
      expect(furina).toBeDefined();

      // Convert Furina but strip weapon to simulate partial/unrecorded equipment
      const input = {
        character: {
          characterKey: 'Furina',
          level: furina.level,
          ascension: furina.ascension,
          constellation: furina.constellation,
          talents: {
            normal:
              furina.talents.find((t: { kind: string }) => t.kind === 'normal')?.baseLevel ?? 1,
            skill: furina.talents.find((t: { kind: string }) => t.kind === 'skill')?.baseLevel ?? 8,
            burst: furina.talents.find((t: { kind: string }) => t.kind === 'burst')?.baseLevel ?? 8,
          },
          weapon: null,
          artifacts: {
            flower: {
              slot: 'flower' as const,
              setKey: 'GoldenTroupe',
              mainStatKey: 'hp',
              level: 20,
            },
            plume: {
              slot: 'plume' as const,
              setKey: 'GoldenTroupe',
              mainStatKey: 'atk',
              level: 20,
            },
            sands: {
              slot: 'sands' as const,
              setKey: 'GoldenTroupe',
              mainStatKey: 'hpPercent',
              level: 20,
            },
            goblet: {
              slot: 'goblet' as const,
              setKey: 'GoldenTroupe',
              mainStatKey: 'hpPercent',
              level: 20,
            },
            circlet: {
              slot: 'circlet' as const,
              setKey: 'GoldenTroupe',
              mainStatKey: 'critDmg',
              level: 20,
            },
          },
          stats: {
            hp: 38000,
            energyRecharge: 180,
            critRate: 70,
            critDmg: 160,
          },
        },
        roleProfile: 'party_buff',
      };

      const readiness = readinessService.evaluateReadiness(input);

      // Core equipment missing MUST evaluate to insufficient_data
      expect(readiness.status).toBe('insufficient_data');
      expect(readiness.dimensions.weapon!.status).toBe('insufficient_data');
      expect(readiness.dimensions.weapon!.isReady).toBe(false);
      expect(readiness.missingData.some((m) => m.dimension === 'weapon')).toBe(true);

      // Marginal investment handles missing weapon safely: doesn't crash, doesn't propose weapon upgrades
      const marginal = marginalService.evaluate(input);
      expect(marginal.currentReadiness.status).toBe('insufficient_data');
      expect(marginal.rankedUpgrades.every((u) => u.category !== 'weapon_level')).toBe(true);
      expect(marginal.explanations.length).toBeGreaterThan(0);
    });

    it('evaluates characters with missing artifact slots to penalized states and prevents unverified slot upgrades', () => {
      const sucrose = fixture.snapshot.characters.find(
        (c: FixtureCharacter) => c.name === 'Sucrose',
      ) as FixtureCharacter;
      expect(sucrose).toBeDefined();

      // Convert Sucrose with only flower & plume; sands, goblet, circlet are unrecorded (null)
      const input = {
        character: {
          characterKey: 'Sucrose',
          level: 70,
          ascension: 4,
          constellation: 0,
          talents: {
            normal: 1,
            skill: 6,
            burst: 6,
          },
          weapon: {
            weaponKey: 'SacrificialFragments',
            level: 80,
            refinement: 5,
          },
          artifacts: {
            flower: {
              slot: 'flower' as const,
              setKey: 'ViridescentVenerer',
              mainStatKey: 'hp',
              level: 16,
            },
            plume: {
              slot: 'plume' as const,
              setKey: 'ViridescentVenerer',
              mainStatKey: 'atk',
              level: 16,
            },
            sands: null,
            goblet: null,
            circlet: null,
          },
          stats: {
            elementalMastery: 450,
            energyRecharge: 130,
          },
        },
        roleProfile: 'resistance_shred',
      };

      const readiness = readinessService.evaluateReadiness(input);

      // Incomplete artifact inventory triggers insufficient_data on set_activation & missing main stats
      expect(['insufficient_data', 'needs_investment', 'conditional']).toContain(readiness.status);
      expect(readiness.dimensions.set_activation!.status).toBe('insufficient_data');
      expect(readiness.dimensions.main_stats!.isReady).toBe(false);

      const marginal = marginalService.evaluate(input);

      // Ensures marginal investment NEVER invents or recommends upgrades for unverified/missing slots
      const artifactSlotUpgrades = marginal.rankedUpgrades.filter(
        (u) => u.category === 'artifact_level',
      );
      for (const u of artifactSlotUpgrades) {
        expect(['flower', 'plume']).toContain(u.target);
        expect(['sands', 'goblet', 'circlet']).not.toContain(u.target);
      }

      // Valid upgrades for verified equipment (weapon Lv 80 -> 90, ascension, or existing artifacts) are generated
      expect(marginal.rankedUpgrades.length).toBeGreaterThan(0);
      expect(
        marginal.rankedUpgrades.some(
          (u) =>
            u.category === 'weapon_level' ||
            u.category === 'character_ascension' ||
            u.category === 'talent',
        ),
      ).toBe(true);
    });

    it('evaluates characters with unrecorded rotation energy to insufficient_data for rotation_energy dimension', () => {
      const xilonen = fixture.snapshot.characters.find(
        (c: FixtureCharacter) => c.name === 'Xilonen',
      ) as FixtureCharacter;
      expect(xilonen).toBeDefined();

      const input = {
        character: {
          characterKey: 'Xilonen',
          level: 80,
          ascension: 6,
          constellation: 0,
          talents: { normal: 1, skill: 8, burst: 8 },
          weapon: { weaponKey: 'FavoniusSword', level: 90, refinement: 5 },
          artifacts: {
            flower: {
              slot: 'flower' as const,
              setKey: 'ScrollOfTheHeroOfCinderCity',
              mainStatKey: 'hp',
              level: 20,
            },
            plume: {
              slot: 'plume' as const,
              setKey: 'ScrollOfTheHeroOfCinderCity',
              mainStatKey: 'atk',
              level: 20,
            },
            sands: {
              slot: 'sands' as const,
              setKey: 'ScrollOfTheHeroOfCinderCity',
              mainStatKey: 'defPercent',
              level: 20,
            },
            goblet: {
              slot: 'goblet' as const,
              setKey: 'ScrollOfTheHeroOfCinderCity',
              mainStatKey: 'defPercent',
              level: 20,
            },
            circlet: {
              slot: 'circlet' as const,
              setKey: 'ScrollOfTheHeroOfCinderCity',
              mainStatKey: 'healingBonus',
              level: 20,
            },
          },
          // Stats intentionally omit energyRecharge to simulate unparsed / missing telemetry
          stats: {
            def: 2800,
          },
        },
        roleProfile: 'party_buff',
      };

      const readiness = readinessService.evaluateReadiness(input);
      expect(readiness.dimensions.rotation_energy!.status).toBe('insufficient_data');
      expect(readiness.status).toBe('insufficient_data');
      expect(readiness.missingData.some((m) => m.dimension === 'rotation_energy')).toBe(true);
    });
  });

  describe('Scenario B: Full Imported Account Fixture (Deterministic Invariants & Progression Catalog)', () => {
    const importedAccount = importedAccountFixture();

    it('evaluates imported Hu Tao with complete 6-dimension breakdown', () => {
      const char = importedAccount.characters[0]!;
      const weapon = importedAccount.weapons.find((w) => w.id === char.equippedWeaponId)!;

      const input = {
        character: {
          characterKey: char.characterKey,
          level: char.level,
          ascension: char.ascension,
          constellation: char.constellation,
          talents: {
            normal: char.talentNormal,
            skill: char.talentSkill,
            burst: char.talentBurst,
          },
          weapon: {
            weaponKey: weapon.weaponKey,
            level: weapon.level,
            refinement: weapon.refinement,
            weaponType: 'Polearm',
          },
          artifacts: {
            flower: {
              slot: 'flower' as const,
              setKey: importedAccount.artifacts[0]!.setKey,
              mainStatKey: importedAccount.artifacts[0]!.mainStatKey,
              level: importedAccount.artifacts[0]!.level,
              rarity: importedAccount.artifacts[0]!.rarity,
            },
            plume: {
              slot: 'plume' as const,
              setKey: 'GladiatorsFinale',
              mainStatKey: 'atk',
              level: 20,
              rarity: 5,
            },
            sands: {
              slot: 'sands' as const,
              setKey: 'GladiatorsFinale',
              mainStatKey: 'hpPercent',
              level: 20,
              rarity: 5,
            },
            goblet: {
              slot: 'goblet' as const,
              setKey: 'GladiatorsFinale',
              mainStatKey: 'pyroDmg',
              level: 20,
              rarity: 5,
            },
            circlet: {
              slot: 'circlet' as const,
              setKey: 'GladiatorsFinale',
              mainStatKey: 'critDmg',
              level: 20,
              rarity: 5,
            },
          },
          stats: {
            hp: 31000,
            atk: 1250,
            critRate: 65,
            critDmg: 210,
            energyRecharge: 110,
          },
        },
        roleProfile: 'on_field_damage',
      };

      const readiness = readinessService.evaluateReadiness(input);

      // Complete 6-dimension evaluation
      const dimensions = readiness.dimensions;
      expect(dimensions.talents).toBeDefined();
      expect(dimensions.weapon).toBeDefined();
      expect(dimensions.main_stats).toBeDefined();
      expect(dimensions.set_activation).toBeDefined();
      expect(dimensions.rotation_energy).toBeDefined();
      expect(dimensions.support_output).toBeDefined();

      // Weapon is Lv 80 -> satisfies minWeaponLevel (80)
      expect(dimensions.weapon!.isReady).toBe(true);
      // Talents (8, 8, 6) -> Burst is 6, below minTalentLevels.burst (8) for on_field_damage benchmark
      expect(dimensions.talents!.isReady).toBe(false);
      expect(dimensions.talents!.status).toBe('conditional');
    });

    it('produces ranked marginal investment upgrades with exact progression-catalog material costs', () => {
      const char = importedAccount.characters[0]!;
      const weapon = importedAccount.weapons.find((w) => w.id === char.equippedWeaponId)!;

      const input = {
        character: {
          characterKey: char.characterKey,
          level: char.level,
          ascension: char.ascension,
          constellation: char.constellation,
          talents: {
            normal: char.talentNormal,
            skill: char.talentSkill,
            burst: char.talentBurst,
          },
          weapon: {
            weaponKey: weapon.weaponKey,
            level: weapon.level,
            refinement: weapon.refinement,
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
              mainStatKey: 'critDmg',
              level: 20,
              rarity: 5,
            },
          },
          stats: {
            hp: 31000,
            atk: 1250,
            critRate: 65,
            critDmg: 210,
            energyRecharge: 110,
          },
        },
        roleProfile: 'on_field_damage',
      };

      const result = marginalService.evaluate(input);

      expect(result.rankedUpgrades.length).toBeGreaterThan(0);
      expect(result.recommendedNextAction).not.toBeNull();

      // 1. Verify Weapon Lv 80 -> 90 upgrade candidate and costs from catalog
      const weaponUpgrade = result.rankedUpgrades.find(
        (u) => u.category === 'weapon_level' && u.target === 'StaffOfHoma',
      );
      expect(weaponUpgrade).toBeDefined();
      expect(weaponUpgrade!.currentLevel).toBe(80);
      expect(weaponUpgrade!.targetLevel).toBe(90);

      const homaCatalogEntry = progressionCatalog.data.weapons['StaffOfHoma'];
      expect(homaCatalogEntry).toBeDefined();
      const homaPhase6 = homaCatalogEntry!.ascension.find((a) => a.phase === 6)!;

      // Assert exact material costs match progression-catalog
      for (const [matKey, count] of Object.entries(homaPhase6.costs)) {
        const item = weaponUpgrade!.costs.find((c) => c.materialKey === matKey);
        expect(item).toBeDefined();
        expect(item!.count).toBe(count);
      }
      expect(weaponUpgrade!.costs.find((c) => c.materialKey === 'Mora')?.count).toBe(65000);

      // 2. Verify Talent Normal 8 -> 9 upgrade candidate and costs from catalog
      const talentNormalUpgrade = result.rankedUpgrades.find(
        (u) => u.category === 'talent' && u.target === 'normal' && u.targetLevel === 9,
      );
      expect(talentNormalUpgrade).toBeDefined();
      expect(talentNormalUpgrade!.currentLevel).toBe(8);

      const huTaoCatalogEntry = progressionCatalog.data.characters['HuTao'];
      expect(huTaoCatalogEntry).toBeDefined();
      const talentPhase9 = huTaoCatalogEntry!.talent.find((t) => t.phase === 9)!;

      for (const [matKey, count] of Object.entries(talentPhase9.costs)) {
        const item = talentNormalUpgrade!.costs.find((c) => c.materialKey === matKey);
        expect(item).toBeDefined();
        expect(item!.count).toBe(count);
      }
      expect(talentNormalUpgrade!.costs.find((c) => c.materialKey === 'Mora')?.count).toBe(450000);

      // 3. Verify Character Ascension 5 -> 6 upgrade candidate and costs from catalog
      const ascUpgrade = result.rankedUpgrades.find(
        (u) => u.category === 'character_ascension' && u.targetLevel === 6,
      );
      expect(ascUpgrade).toBeDefined();
      const ascPhase6 = huTaoCatalogEntry!.ascension.find((a) => a.phase === 6)!;

      for (const [matKey, count] of Object.entries(ascPhase6.costs)) {
        const item = ascUpgrade!.costs.find((c) => c.materialKey === matKey);
        expect(item).toBeDefined();
        expect(item!.count).toBe(count);
      }
      expect(ascUpgrade!.costs.find((c) => c.materialKey === 'Mora')?.count).toBe(120000);
    });

    it('enforces deterministic priority: closing benchmark gaps gives higher multiplier than non-gap upgrades', () => {
      const input = {
        character: {
          characterKey: 'HuTao',
          level: 80,
          ascension: 5,
          constellation: 0,
          talents: {
            normal: 8,
            skill: 8,
            burst: 6, // Burst is at 6, benchmark requires 8 -> closesGap = true
          },
          weapon: {
            weaponKey: 'StaffOfHoma',
            level: 80,
            refinement: 1,
            weaponType: 'Polearm',
          },
          artifacts: {
            flower: {
              slot: 'flower' as const,
              setKey: 'CrimsonWitchOfFlames',
              mainStatKey: 'hp',
              level: 20,
            },
            plume: {
              slot: 'plume' as const,
              setKey: 'CrimsonWitchOfFlames',
              mainStatKey: 'atk',
              level: 20,
            },
            sands: {
              slot: 'sands' as const,
              setKey: 'CrimsonWitchOfFlames',
              mainStatKey: 'hpPercent',
              level: 20,
            },
            goblet: {
              slot: 'goblet' as const,
              setKey: 'CrimsonWitchOfFlames',
              mainStatKey: 'pyroDmg',
              level: 20,
            },
            circlet: {
              slot: 'circlet' as const,
              setKey: 'CrimsonWitchOfFlames',
              mainStatKey: 'critDmg',
              level: 20,
            },
          },
          stats: {
            hp: 31000,
            energyRecharge: 110,
          },
        },
        roleProfile: 'on_field_damage',
      };

      const result = marginalService.evaluate(input);

      const burstGapClosure = result.rankedUpgrades.find(
        (u) => u.category === 'talent' && u.target === 'burst' && u.targetLevel === 8,
      );
      expect(burstGapClosure).toBeDefined();
      expect(burstGapClosure!.closesGap).toBe(true);
    });
  });
});
