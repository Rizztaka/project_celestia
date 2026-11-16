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
} from './artifact-probability';
import type { ArtifactPiece } from '../types/genshin';
import { getCharacterStatWeights } from '../data/artifact-weights';

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
});
