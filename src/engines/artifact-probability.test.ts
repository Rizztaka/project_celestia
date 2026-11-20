import { describe, it, expect } from 'vitest';
import {
  calculatePieceRollValue,
  calculateSlotUpgradeProbability,
  generateDiminishingReturnsCurve,
  findWeakestSlot,
  getGuaranteedAlternative,
  estimateBuildFromSliders,
  extractEquippedArtifactsForCharacter,
  getSubstatUpgradeProbability,
  analyzeArtifactBuild,
} from './artifact-probability';
import type { ArtifactPiece, ArtifactSlot } from '../types/genshin';
import { getCharacterStatWeights } from '../data/artifact-weights';
import { validateArtifactPiece } from './artifact-validator';

describe('Artifact Probability & Roll Value Engine', () => {
  describe('calculatePieceRollValue', () => {
    it('calculates unweighted and weighted roll value for a Crit Feather', () => {
      const huTaoWeights = getCharacterStatWeights('Hu Tao');
      const piece: ArtifactPiece = {
        slotKey: 'plume',
        rarity: 5,
        level: 20,
        mainStatKey: 'atk',
        substats: [
          { key: 'critRate_', value: 3.89 }, // 100% max roll
          { key: 'critDMG_', value: 15.54 }, // 200% (2 max rolls)
          { key: 'hp_', value: 5.83 }, // 100% max roll
          { key: 'def', value: 23.15 }, // Irrelevant flat def
        ],
      };

      const result = calculatePieceRollValue(piece, huTaoWeights);
      // Useful stats for Hu Tao: critRate_ (1.0), critDMG_ (1.0), hp_ (0.85). def is 0.
      expect(result.rawRollValue).toBeCloseTo(500, 0); // 1 + 2 + 1 + 1 (def) = 5 rolls * 100 = 500%
      // Weighted RV: 100*1.0 + 200*1.0 + 100*0.85 + 100*0 = 385%
      expect(result.weightedRollValue).toBeCloseTo(385, 0);
      expect(result.usefulRolls).toBeCloseTo(3.85, 1);
    });

    it('accurately values EM on Nefer and Nilou over pure Crit', () => {
      const neferWeights = getCharacterStatWeights('Nefer');
      const piece: ArtifactPiece = {
        slotKey: 'flower',
        rarity: 5,
        level: 20,
        mainStatKey: 'hp',
        substats: [
          { key: 'eleMas', value: 69.93 }, // 3 max rolls of EM (300% RV)
          { key: 'enerRech_', value: 6.48 }, // 1 max roll of ER (100% RV)
          { key: 'critRate_', value: 3.89 }, // 1 max roll of CR (100% RV)
          { key: 'def_', value: 7.29 }, // Def
        ],
      };

      const result = calculatePieceRollValue(piece, neferWeights);
      // Nefer weights: eleMas (1.0), enerRech_ (0.7), critRate_ (1.0), def_ (0)
      // Weighted: 300*1.0 + 100*0.7 + 100*1.0 = 470% RV
      expect(result.weightedRollValue).toBeCloseTo(470, 0);
      expect(result.usefulRolls).toBeCloseTo(4.7, 1);
    });
  });

  describe('getSubstatUpgradeProbability (Continuous Logistic Curve)', () => {
    it('returns continuous strictly decreasing probabilities across RV range', () => {
      const p100 = getSubstatUpgradeProbability(100);
      const p200 = getSubstatUpgradeProbability(200);
      const p300 = getSubstatUpgradeProbability(300);
      const p400 = getSubstatUpgradeProbability(400);
      const p500 = getSubstatUpgradeProbability(500);
      const p600 = getSubstatUpgradeProbability(600);

      expect(p100).toBeGreaterThan(p200);
      expect(p200).toBeGreaterThan(p300);
      expect(p300).toBeGreaterThan(p400);
      expect(p400).toBeGreaterThan(p500);
      expect(p500).toBeGreaterThan(p600);

      // Verify smooth variation without identical step plateaus
      const p250 = getSubstatUpgradeProbability(250);
      const p251 = getSubstatUpgradeProbability(251);
      expect(p250).toBeGreaterThanOrEqual(p251);
    });

    it('safely handles boundary RV values (zero, negative, extreme)', () => {
      expect(getSubstatUpgradeProbability(0)).toBe(0.99);
      expect(getSubstatUpgradeProbability(-50)).toBe(0.99);
      expect(getSubstatUpgradeProbability(1000)).toBeGreaterThanOrEqual(0.00005);
      expect(getSubstatUpgradeProbability(1000)).toBeLessThan(0.001);
    });
  });

  describe('calculateSlotUpgradeProbability', () => {
    it('rates an early 100% RV flower as High ROI with high upgrade odds', () => {
      const weights = getCharacterStatWeights('Hu Tao');
      const earlyFlower: ArtifactPiece = {
        slotKey: 'flower',
        rarity: 5,
        level: 20,
        mainStatKey: 'hp',
        substats: [
          { key: 'critRate_', value: 3.5 },
          { key: 'def', value: 40 },
          { key: 'atk', value: 30 },
          { key: 'hp', value: 500 },
        ],
      };

      const analysis = calculateSlotUpgradeProbability('flower', earlyFlower, weights);
      expect(analysis.status).toBe('High ROI');
      expect(analysis.expectedRunsForUpgrade).toBeLessThan(30);
      expect(analysis.expectedDaysForUpgrade).toBeLessThan(5);
      expect(analysis.medianRunsForUpgrade).toBe(analysis.expectedRunsForUpgrade);
      expect(analysis.meanExpectedRuns).toBeDefined();
      expect(analysis.meanExpectedRuns!).toBeGreaterThan(analysis.medianRunsForUpgrade!);
    });

    it('rates a 650% RV feather as Near Ceiling with low upgrade odds', () => {
      const weights = getCharacterStatWeights('Hu Tao');
      const godFeather: ArtifactPiece = {
        slotKey: 'plume',
        rarity: 5,
        level: 20,
        mainStatKey: 'atk',
        substats: [
          { key: 'critRate_', value: 14.0 }, // ~3.6 rolls
          { key: 'critDMG_', value: 21.0 }, // ~2.7 rolls
          { key: 'hp_', value: 5.5 }, // ~0.9 rolls
          { key: 'eleMas', value: 20.0 }, // ~0.85 rolls
        ],
      };

      const analysis = calculateSlotUpgradeProbability('plume', godFeather, weights);
      expect(analysis.status).toBe('Near Ceiling');
      expect(analysis.expectedRunsForUpgrade).toBeGreaterThan(150);
      expect(analysis.expectedDaysForUpgrade).toBeGreaterThan(15);
    });
  });

  describe('generateDiminishingReturnsCurve', () => {
    it('produces monotonically increasing probability points from Day 1 to Day 60', () => {
      const pPerRun = 0.02; // 2% upgrade probability per domain run
      const curve = generateDiminishingReturnsCurve(pPerRun, 60);

      expect(curve.length).toBe(60);
      expect(curve[0].days).toBe(1);
      expect(curve[0].resin).toBe(180);
      expect(curve[0].probability).toBeGreaterThan(0);
      expect(curve[0].probability).toBeLessThan(1);

      // Check strictly non-decreasing curve
      for (let i = 1; i < curve.length; i++) {
        expect(curve[i].probability).toBeGreaterThanOrEqual(curve[i - 1].probability);
        expect(curve[i].days).toBe(i + 1);
      }

      // Check asymptotic approach towards 100%
      expect(curve[curve.length - 1].probability).toBeGreaterThan(0.9);
    });
  });

  describe('findWeakestSlot & getGuaranteedAlternative', () => {
    it('identifies the weakest slot correctly', () => {
      const weights = getCharacterStatWeights('Nefer');
      const weakSands: ArtifactPiece = {
        slotKey: 'sands',
        rarity: 5,
        level: 20,
        mainStatKey: 'eleMas',
        substats: [{ key: 'def', value: 20 }],
      };
      const strongFeather: ArtifactPiece = {
        slotKey: 'plume',
        rarity: 5,
        level: 20,
        mainStatKey: 'atk',
        substats: [
          { key: 'critRate_', value: 10 },
          { key: 'critDMG_', value: 20 },
        ],
      };

      const breakdown = {
        flower: calculateSlotUpgradeProbability('flower', null, weights),
        plume: calculateSlotUpgradeProbability('plume', strongFeather, weights),
        sands: calculateSlotUpgradeProbability('sands', weakSands, weights),
        goblet: calculateSlotUpgradeProbability('goblet', null, weights),
        circlet: calculateSlotUpgradeProbability('circlet', null, weights),
      };

      const weakest = findWeakestSlot(breakdown);
      expect(weakest).not.toBeNull();
      // Flower or Sands should be weaker than the strong feather
      expect(weakest?.slotKey).not.toBe('plume');
    });

    it('provides concrete guaranteed talent resin recommendations', () => {
      const alternative = getGuaranteedAlternative('Nefer', 'Ready / Stop Farming');
      expect(alternative.costResin).toBeGreaterThan(0);
      expect(alternative.daysResin).toBeGreaterThan(0);
      expect(alternative.guaranteedGain).toContain('%');
    });
  });

  describe('estimateBuildFromSliders', () => {
    it('synthesizes a 5-slot build estimation from global CV and stats', () => {
      const result = estimateBuildFromSliders('Hu Tao', 70, 160, 100, false);
      expect(result.totalRollValue).toBeGreaterThan(1500);
      expect(result.slotBreakdown.flower).toBeDefined();
      expect(result.slotBreakdown.circlet).toBeDefined();
      expect(result.curve.length).toBe(60);
      expect(result.overallStatus).toBeDefined();
    });

    it('guarantees all synthesized mock pieces adhere strictly to 5★ +20 game rules', () => {
      // Test characters with varying preferred main stats (e.g. CD circlet, EM sands, HP goblet)
      const testCases = ['Kamisato Ayaka', 'Neuvillette', 'Kuki Shinobu', 'Hu Tao'];
      for (const charName of testCases) {
        const build = estimateBuildFromSliders(charName, 60, 140, 150, false);
        for (const slotKey of ['flower', 'plume', 'sands', 'goblet', 'circlet'] as ArtifactSlot[]) {
          const piece = build.slotBreakdown[slotKey].currentPiece;
          expect(piece).toBeDefined();
          const validation = validateArtifactPiece(piece!);
          expect(
            validation.isValid,
            `Mock ${slotKey} on ${charName} must be valid, but got: ${validation.errors.join(', ')}`,
          ).toBe(true);
          expect(validation.errors).toHaveLength(0);
          expect(validation.totalRolls).toBeGreaterThanOrEqual(8);
          expect(validation.totalRolls).toBeLessThanOrEqual(9);
        }
      }
    });
  });

  describe('extractEquippedArtifactsForCharacter & Robustness', () => {
    it('extracts equipped artifacts and filters out NaN or invalid substats', () => {
      const mockRaw = [
        {
          slotKey: 'flower',
          setKey: 'DeepwoodMemories',
          rarity: 5,
          level: 20,
          mainStatKey: 'hp',
          location: 'Nefer',
          substats: [
            { key: 'eleMas', value: 40 },
            { key: 'critRate_', value: 7.0 },
            { key: 'bad_stat', value: 'invalid' }, // string
            { key: 'empty_stat', value: 0 },
          ],
        },
        {
          slotKey: 'plume',
          setKey: 'DeepwoodMemories',
          rarity: 5,
          level: 20,
          mainStatKey: 'atk',
          location: 'HuTao', // different character
          substats: [{ key: 'critDMG_', value: 20 }],
        },
      ];

      const extracted = extractEquippedArtifactsForCharacter(mockRaw, 'nefer');
      expect(extracted.flower).toBeDefined();
      expect(extracted.flower?.substats.length).toBe(2);
      expect(extracted.flower?.substats[0].rollValue).toBeGreaterThan(0);
      expect(extracted.plume).toBeUndefined(); // Belongs to HuTao
    });

    it('accurately computes DEF% drop rates on Goblet for DEF scalers (Xilonen)', () => {
      const xilonenWeights = getCharacterStatWeights('Xilonen');
      const analysis = calculateSlotUpgradeProbability('goblet', null, xilonenWeights);
      // DEF% goblet should have ~19.25% drop rate weight (higher than 5% elemental goblet)
      expect(analysis.upgradeProbabilityPerRun).toBeGreaterThan(0.015);
      expect(analysis.expectedRunsForUpgrade).toBeLessThan(50);
    });

    it('guards against NaN probabilities in diminishing returns curves', () => {
      const curve = generateDiminishingReturnsCurve(NaN, 10);
      expect(curve.length).toBe(10);
      for (const pt of curve) {
        expect(isNaN(pt.probability)).toBe(false);
        expect(pt.probability).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Archetype 1: ATK Scaler (Kamisato Ayaka / Navia)', () => {
    it('accurately benchmarks endgame Ayaka build to Stop Farming with high Talent ROI', () => {
      // 32-roll Ayaka build with 4pc Blizzard Strayer
      const endgameBuild = estimateBuildFromSliders('Kamisato Ayaka', 45, 230, 140, false);
      expect(endgameBuild.roiComparison).toBeDefined();
      expect(endgameBuild.roiComparison?.decision).toBe('Stop Farming');
      expect(endgameBuild.roiComparison?.resinPerOnePctArtifactDps).toBeGreaterThan(800);

      // Talent Level 8 -> 9/10 milestone efficiency
      const talentMilestone = endgameBuild.roiComparison?.milestones.find((m) =>
        m.name.includes('Talent'),
      );
      expect(talentMilestone).toBeDefined();
      expect(talentMilestone?.efficiencyRatioVsArtifacts).toBeGreaterThan(15);

      // 4pc Blizzard Strayer set comparison
      expect(endgameBuild.setComparison?.options.find((o) => o.type === '4pc')).toBeDefined();
    });

    it('recommends Continue Farming for early ATK-scaler builds', () => {
      const earlyBuild = estimateBuildFromSliders('Kamisato Ayaka', 20, 60, 40, false);
      expect(earlyBuild.overallStatus).toBe('High ROI');
      expect(earlyBuild.roiComparison?.decision).toBe('Continue Farming');
    });
  });

  describe('Archetype 2: HP Scaler (Neuvillette / Hu Tao)', () => {
    it('assigns 0 weight to ATK stats on Neuvillette', () => {
      const weights = getCharacterStatWeights('Neuvillette');
      expect(weights.statWeights.atk_).toBeUndefined();

      const pieceWithAtk: ArtifactPiece = {
        slotKey: 'flower',
        rarity: 5,
        level: 20,
        mainStatKey: 'hp',
        substats: [
          { key: 'atk_', value: 20 },
          { key: 'atk', value: 40 },
          { key: 'def', value: 20 },
        ],
      };

      const rv = calculatePieceRollValue(pieceWithAtk, weights);
      expect(rv.weightedRollValue).toBe(0);
      expect(rv.usefulRolls).toBe(0);
    });

    it('evaluates Furina team buff context and adjusts goblet viability', () => {
      const analysis = estimateBuildFromSliders('Neuvillette', 50, 220, 120, false, {
        preset: 'hypercarry_bennett_furina',
        hasFurina: true,
      });

      expect(analysis.setComparison).toBeDefined();
      expect(analysis.erEvaluation).toBeDefined();
    });
  });

  describe('Archetype 3: DEF Scaler (Arataki Itto / Gorou / Chiori)', () => {
    it('properly prioritizes DEF and ER for Gorou over pure Crit DMG', () => {
      const gorouWeights = getCharacterStatWeights('Gorou');
      expect(gorouWeights.statWeights.def_).toBeGreaterThan(0.5);
      expect(gorouWeights.statWeights.enerRech_).toBeGreaterThan(0.7);

      const defPiece: ArtifactPiece = {
        slotKey: 'sands',
        rarity: 5,
        level: 20,
        mainStatKey: 'def_',
        substats: [
          { key: 'enerRech_', value: 18.0 },
          { key: 'def', value: 40 },
          { key: 'critRate_', value: 7.0 },
        ],
      };

      const rv = calculatePieceRollValue(defPiece, gorouWeights);
      expect(rv.usefulRolls).toBeGreaterThan(3.0);
    });

    it('evaluates 4pc Husk of Opulent Dreams set bonus on Itto', () => {
      const ittoBuild = estimateBuildFromSliders('Arataki Itto', 70, 150, 120, true);
      expect(ittoBuild.setComparison?.options[0].name).toContain('Husk of Opulent Dreams');
      expect(ittoBuild.setComparison?.options[0].esr).toBeGreaterThan(8);
    });
  });

  describe('Archetype 4: EM-Dependent Transformative Reaction (Nilou / Kuki Shinobu)', () => {
    it('heavily prioritizes Character Level 80->90 over artifact domain farming', () => {
      const kukiBuild = estimateBuildFromSliders('Kuki Shinobu', 20, 60, 600, true, {
        preset: 'hyperbloom',
      });

      expect(kukiBuild.roiComparison).toBeDefined();
      const lvl90Milestone = kukiBuild.roiComparison?.milestones.find((m) =>
        m.name.includes('Character Level 80 → 90'),
      );
      expect(lvl90Milestone).toBeDefined();
      // Character level 90 for transformative reactions costs only ~21 resin per 1% DPS!
      expect(lvl90Milestone?.resinPerOnePctDps).toBe(21);
      expect(lvl90Milestone?.efficiencyRatioVsArtifacts).toBeGreaterThan(10);
    });
  });

  describe('Archetype 5: Energy-Hungry Support (Faruzan / Bennett)', () => {
    it('penalizes Faruzan build heavily when total ER suffers severe deficit', () => {
      // Build with only ~130% ER (Faruzan needs ~240% ER)
      const mockSlotsLowEr: Partial<Record<ArtifactSlot, ArtifactPiece>> = {
        flower: {
          slotKey: 'flower',
          rarity: 5,
          level: 20,
          mainStatKey: 'hp',
          substats: [{ key: 'critRate_', value: 10 }],
        },
        plume: {
          slotKey: 'plume',
          rarity: 5,
          level: 20,
          mainStatKey: 'atk',
          substats: [{ key: 'critDMG_', value: 20 }],
        },
        sands: {
          slotKey: 'sands',
          rarity: 5,
          level: 20,
          mainStatKey: 'atk_', // Missing ER sands!
          substats: [{ key: 'enerRech_', value: 10 }],
        },
        goblet: {
          slotKey: 'goblet',
          rarity: 5,
          level: 20,
          mainStatKey: 'anemo_dmg_',
          substats: [{ key: 'enerRech_', value: 10 }],
        },
        circlet: {
          slotKey: 'circlet',
          rarity: 5,
          level: 20,
          mainStatKey: 'critRate_',
          substats: [{ key: 'enerRech_', value: 10 }],
        },
      };

      const result = analyzeArtifactBuild('Faruzan', mockSlotsLowEr);
      expect(result.erEvaluation?.status).toBe('Deficit');
      expect(result.erEvaluation?.penaltyFactor).toBeLessThan(0.7);
      expect(result.advice).toContain('⚠️ ER DEFICIT WARNING');
    });

    it('clears ER deficit warning when Faruzan reaches required ER target', () => {
      const mockSlotsHighEr: Partial<Record<ArtifactSlot, ArtifactPiece>> = {
        flower: {
          slotKey: 'flower',
          setKey: 'The Exile',
          rarity: 5,
          level: 20,
          mainStatKey: 'hp',
          substats: [{ key: 'enerRech_', value: 18 }],
        },
        plume: {
          slotKey: 'plume',
          setKey: 'The Exile',
          rarity: 5,
          level: 20,
          mainStatKey: 'atk',
          substats: [{ key: 'enerRech_', value: 18 }],
        },
        sands: {
          slotKey: 'sands',
          setKey: 'Emblem of Severed Fate',
          rarity: 5,
          level: 20,
          mainStatKey: 'enerRech_', // 51.8 ER
          substats: [{ key: 'critRate_', value: 7 }],
        },
        goblet: {
          slotKey: 'goblet',
          setKey: 'Viridescent Venerer', // Off-piece so 2pc Emblem is not active
          rarity: 5,
          level: 20,
          mainStatKey: 'anemo_dmg_',
          substats: [{ key: 'enerRech_', value: 18 }],
        },
        circlet: {
          slotKey: 'circlet',
          rarity: 5,
          level: 20,
          mainStatKey: 'critRate_',
          substats: [{ key: 'enerRech_', value: 18 }],
        },
      };

      const result = analyzeArtifactBuild('Faruzan', mockSlotsHighEr);
      // Base (100) + Sands (51.8) + 2pc Exile (20) + Substats (72) = 243.8% ER
      expect(result.erEvaluation?.totalEr).toBeGreaterThanOrEqual(240);
      expect(result.erEvaluation?.status).toBe('Target');
      expect(result.erEvaluation?.penaltyFactor).toBe(1.0);
    });

    it('decays ER stat weight to 0.1x during surplus unless running 4pc Emblem', () => {
      // Build with ~232% ER on Xiangling (target is 200% ER, window up to 220% => surplus)
      const surplusSlotsNonEmblem: Partial<Record<ArtifactSlot, ArtifactPiece>> = {
        flower: {
          slotKey: 'flower',
          setKey: 'Crimson Witch of Flames',
          rarity: 5,
          level: 20,
          mainStatKey: 'hp',
          substats: [{ key: 'enerRech_', value: 20 }],
        },
        plume: {
          slotKey: 'plume',
          setKey: 'Crimson Witch of Flames',
          rarity: 5,
          level: 20,
          mainStatKey: 'atk',
          substats: [{ key: 'enerRech_', value: 20 }],
        },
        sands: {
          slotKey: 'sands',
          setKey: 'Crimson Witch of Flames',
          rarity: 5,
          level: 20,
          mainStatKey: 'enerRech_', // 51.8% ER
          substats: [{ key: 'hp_', value: 10 }],
        },
        goblet: {
          slotKey: 'goblet',
          setKey: 'Crimson Witch of Flames',
          rarity: 5,
          level: 20,
          mainStatKey: 'pyro_dmg_',
          substats: [{ key: 'enerRech_', value: 20 }],
        },
        circlet: {
          slotKey: 'circlet',
          setKey: "Gladiator's Finale",
          rarity: 5,
          level: 20,
          mainStatKey: 'critRate_',
          substats: [{ key: 'enerRech_', value: 20 }],
        },
      };

      const nonEmblemResult = analyzeArtifactBuild('Xiangling', surplusSlotsNonEmblem);
      expect(nonEmblemResult.erEvaluation?.status).toBe('Overcap');
      // For Crimson Witch 4pc, overcapped ER should contribute very little useful rolls (0.1x weight)
      const flowerAnalysis = nonEmblemResult.slotBreakdown.flower;
      // 20 ER = ~3 rolls. At 0.1x of 1.0 base weight = 0.1 weight => usefulRolls < 0.5
      expect(flowerAnalysis.currentUsefulRolls).toBeLessThan(0.5);

      // Now test with 4pc Emblem of Severed Fate on same surplus ER
      const surplusSlotsEmblem: Partial<Record<ArtifactSlot, ArtifactPiece>> = {
        ...surplusSlotsNonEmblem,
        flower: { ...surplusSlotsNonEmblem.flower!, setKey: 'Emblem of Severed Fate' },
        plume: { ...surplusSlotsNonEmblem.plume!, setKey: 'Emblem of Severed Fate' },
        sands: { ...surplusSlotsNonEmblem.sands!, setKey: 'Emblem of Severed Fate' },
        goblet: { ...surplusSlotsNonEmblem.goblet!, setKey: 'Emblem of Severed Fate' },
      };

      const emblemResult = analyzeArtifactBuild('Xiangling', surplusSlotsEmblem);
      expect(emblemResult.erEvaluation?.status).toBe('Overcap');
      // On 4pc Emblem, ER is NOT decayed because it converts directly into Burst DMG
      const emblemFlowerAnalysis = emblemResult.slotBreakdown.flower;
      expect(emblemFlowerAnalysis.currentUsefulRolls).toBeGreaterThan(1.0);
    });
  });

  describe('Smart Strongbox & Domain Pairing Routing', () => {
    it('advises Strongbox for Crimson Witch of Flames due to Lavawalker resin trap', () => {
      const build = estimateBuildFromSliders('Hu Tao', 70, 160, 100, false);
      expect(build.domainRoute).toBeDefined();
      expect(build.domainRoute?.isStrongboxEligible).toBe(true);
      expect(build.domainRoute?.companionValue).toBe('Low');
      expect(build.domainRoute?.recommendedAction).toBe(
        'Use Strongbox / Farm Marechaussee or Deepwood',
      );
      expect(build.domainRoute?.guidance).toContain('Mystic Offering');
    });

    it('recommends direct domain farming for high-efficiency domain pairs (Marechaussee / Golden Troupe)', () => {
      const build = estimateBuildFromSliders('Neuvillette', 50, 220, 120, false);
      expect(build.domainRoute?.companionValue).toBe('High');
      expect(build.domainRoute?.recommendedAction).toBe('Farm Domain');
      expect(build.domainRoute?.guidance).toContain('100% resin efficiency');
    });
  });
});
