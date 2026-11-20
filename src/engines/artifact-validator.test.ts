import { describe, it, expect } from 'vitest';
import {
  isValidMainStatForSlot,
  decomposeSubstatRolls,
  validateArtifactPiece,
  validateGoodArtifact,
} from './artifact-validator';
import type { ArtifactPiece } from '../types/genshin';

describe('Artifact Validator Engine', () => {
  describe('isValidMainStatForSlot', () => {
    it('permits only valid main stats for flower and plume', () => {
      expect(isValidMainStatForSlot('flower', 'hp')).toBe(true);
      expect(isValidMainStatForSlot('flower', 'atk')).toBe(false);
      expect(isValidMainStatForSlot('flower', 'critRate_')).toBe(false);

      expect(isValidMainStatForSlot('plume', 'atk')).toBe(true);
      expect(isValidMainStatForSlot('plume', 'hp')).toBe(false);
      expect(isValidMainStatForSlot('plume', 'atk_')).toBe(false);
    });

    it('permits valid main stats for sands and rejects invalid ones', () => {
      expect(isValidMainStatForSlot('sands', 'atk_')).toBe(true);
      expect(isValidMainStatForSlot('sands', 'hp_')).toBe(true);
      expect(isValidMainStatForSlot('sands', 'def_')).toBe(true);
      expect(isValidMainStatForSlot('sands', 'enerRech_')).toBe(true);
      expect(isValidMainStatForSlot('sands', 'eleMas')).toBe(true);

      expect(isValidMainStatForSlot('sands', 'critRate_')).toBe(false);
      expect(isValidMainStatForSlot('sands', 'critDMG_')).toBe(false);
      expect(isValidMainStatForSlot('sands', 'pyro_dmg_')).toBe(false);
      expect(isValidMainStatForSlot('sands', 'heal_')).toBe(false);
    });

    it('permits all 8 elemental/physical damages and percentages on goblet', () => {
      const validGobletStats = [
        'pyro_dmg_',
        'hydro_dmg_',
        'cryo_dmg_',
        'electro_dmg_',
        'anemo_dmg_',
        'geo_dmg_',
        'dendro_dmg_',
        'physical_dmg_',
        'atk_',
        'hp_',
        'def_',
        'eleMas',
      ] as const;

      for (const stat of validGobletStats) {
        expect(isValidMainStatForSlot('goblet', stat)).toBe(true);
      }

      expect(isValidMainStatForSlot('goblet', 'critRate_')).toBe(false);
      expect(isValidMainStatForSlot('goblet', 'critDMG_')).toBe(false);
      expect(isValidMainStatForSlot('goblet', 'enerRech_')).toBe(false);
      expect(isValidMainStatForSlot('goblet', 'heal_')).toBe(false);
    });

    it('permits crit rate, crit dmg, healing bonus and basic stats on circlet', () => {
      expect(isValidMainStatForSlot('circlet', 'critRate_')).toBe(true);
      expect(isValidMainStatForSlot('circlet', 'critDMG_')).toBe(true);
      expect(isValidMainStatForSlot('circlet', 'heal_')).toBe(true);
      expect(isValidMainStatForSlot('circlet', 'atk_')).toBe(true);
      expect(isValidMainStatForSlot('circlet', 'hp_')).toBe(true);
      expect(isValidMainStatForSlot('circlet', 'def_')).toBe(true);
      expect(isValidMainStatForSlot('circlet', 'eleMas')).toBe(true);

      expect(isValidMainStatForSlot('circlet', 'enerRech_')).toBe(false);
      expect(isValidMainStatForSlot('circlet', 'pyro_dmg_')).toBe(false);
    });
  });

  describe('decomposeSubstatRolls', () => {
    it('accurately identifies 1-roll base tiers for Crit Rate', () => {
      const minRoll = decomposeSubstatRolls('critRate_', 2.7);
      expect(minRoll.isValid).toBe(true);
      expect(minRoll.rolls).toBe(1);
      expect(minRoll.averageEfficiency).toBeCloseTo(70, 0);

      const maxRoll = decomposeSubstatRolls('critRate_', 3.9);
      expect(maxRoll.isValid).toBe(true);
      expect(maxRoll.rolls).toBe(1);
      expect(maxRoll.averageEfficiency).toBeCloseTo(100, 0);
    });

    it('decomposes multiple roll values correctly', () => {
      // 2 rolls: 3.5 + 3.5 = 7.0
      const twoRolls = decomposeSubstatRolls('critRate_', 7.0);
      expect(twoRolls.isValid).toBe(true);
      expect(twoRolls.rolls).toBe(2);

      // 3 rolls of CD ~ 21.0
      const threeCd = decomposeSubstatRolls('critDMG_', 21.0);
      expect(threeCd.isValid).toBe(true);
      expect(threeCd.rolls).toBe(3);

      // 4 rolls of CR ~ 14.0
      const fourCr = decomposeSubstatRolls('critRate_', 14.0);
      expect(fourCr.isValid).toBe(true);
      expect(fourCr.rolls).toBe(4);

      // 5 rolls of CD ~ 35.0
      const fiveCd = decomposeSubstatRolls('critDMG_', 35.0);
      expect(fiveCd.isValid).toBe(true);
      expect(fiveCd.rolls).toBe(5);

      // 6 rolls max CD ~ 46.6 (7.77 * 6 = 46.62)
      const sixCd = decomposeSubstatRolls('critDMG_', 46.6);
      expect(sixCd.isValid).toBe(true);
      expect(sixCd.rolls).toBe(6);
    });

    it('handles flat stats like EM, ATK, HP, DEF', () => {
      // 1 roll EM: 23
      const oneEm = decomposeSubstatRolls('eleMas', 23);
      expect(oneEm.isValid).toBe(true);
      expect(oneEm.rolls).toBe(1);

      // 2 rolls EM: ~42 or 47
      const twoEm = decomposeSubstatRolls('eleMas', 47);
      expect(twoEm.isValid).toBe(true);
      expect(twoEm.rolls).toBe(2);

      // 1 roll Flat HP: ~299
      const oneHp = decomposeSubstatRolls('hp', 299);
      expect(oneHp.isValid).toBe(true);
      expect(oneHp.rolls).toBe(1);
    });

    it('rejects impossible roll values', () => {
      // Negative
      expect(decomposeSubstatRolls('critRate_', -3.5).isValid).toBe(false);
      // Zero
      expect(decomposeSubstatRolls('critRate_', 0).isValid).toBe(false);
      // Below min tier (min is 2.7)
      expect(decomposeSubstatRolls('critRate_', 1.2).isValid).toBe(false);
      // Above max 6 rolls (6 * 3.89 = 23.34)
      expect(decomposeSubstatRolls('critRate_', 30.0).isValid).toBe(false);
      // Invalid stat key with no tiers (e.g. heal_)
      expect(decomposeSubstatRolls('heal_', 10.0).isValid).toBe(false);
    });
  });

  describe('validateArtifactPiece', () => {
    it('accepts a fully legal 5★ +20 piece with 9 total rolls', () => {
      const piece: ArtifactPiece = {
        slotKey: 'flower',
        rarity: 5,
        level: 20,
        mainStatKey: 'hp',
        substats: [
          { key: 'critRate_', value: 10.5 }, // 3 rolls
          { key: 'critDMG_', value: 14.0 }, // 2 rolls
          { key: 'atk_', value: 9.9 }, // 2 rolls
          { key: 'enerRech_', value: 11.0 }, // 2 rolls
        ],
      };

      const result = validateArtifactPiece(piece);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.totalRolls).toBe(9);
    });

    it('accepts a legal 5★ +20 piece with 8 total rolls (started with 3 lines)', () => {
      const piece: ArtifactPiece = {
        slotKey: 'plume',
        rarity: 5,
        level: 20,
        mainStatKey: 'atk',
        substats: [
          { key: 'critRate_', value: 10.5 }, // 3 rolls
          { key: 'critDMG_', value: 14.0 }, // 2 rolls
          { key: 'eleMas', value: 42.0 }, // 2 rolls
          { key: 'enerRech_', value: 5.8 }, // 1 roll
        ],
      };

      const result = validateArtifactPiece(piece);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.totalRolls).toBe(8);
    });

    it('rejects an artifact with an invalid main stat for its slot', () => {
      const piece: ArtifactPiece = {
        slotKey: 'sands',
        rarity: 5,
        level: 20,
        mainStatKey: 'critRate_', // Illegal on sands!
        substats: [
          { key: 'atk_', value: 9.9 },
          { key: 'critDMG_', value: 14.0 },
          { key: 'eleMas', value: 42.0 },
          { key: 'enerRech_', value: 5.8 },
        ],
      };

      const result = validateArtifactPiece(piece);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid main stat'))).toBe(true);
    });

    it('rejects an artifact with duplicate substats', () => {
      const piece: ArtifactPiece = {
        slotKey: 'goblet',
        rarity: 5,
        level: 20,
        mainStatKey: 'hydro_dmg_',
        substats: [
          { key: 'critRate_', value: 3.5 },
          { key: 'critRate_', value: 3.9 }, // Duplicate!
          { key: 'critDMG_', value: 14.0 },
          { key: 'hp_', value: 5.8 },
        ],
      };

      const result = validateArtifactPiece(piece);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Duplicate substat'))).toBe(true);
    });

    it('rejects an artifact where a substat matches the main stat', () => {
      const piece: ArtifactPiece = {
        slotKey: 'sands',
        rarity: 5,
        level: 20,
        mainStatKey: 'atk_',
        substats: [
          { key: 'atk_', value: 5.8 }, // Illegal: matches main stat!
          { key: 'critRate_', value: 3.9 },
          { key: 'critDMG_', value: 14.0 },
          { key: 'eleMas', value: 23.0 },
        ],
      };

      const result = validateArtifactPiece(piece);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('matches main stat'))).toBe(true);
    });

    it('rejects an artifact with single substat exceeding 6 rolls', () => {
      const piece: ArtifactPiece = {
        slotKey: 'flower',
        rarity: 5,
        level: 20,
        mainStatKey: 'hp',
        substats: [
          { key: 'critDMG_', value: 55.0 }, // Impossible > 6 rolls!
          { key: 'critRate_', value: 3.5 },
          { key: 'atk_', value: 5.0 },
          { key: 'enerRech_', value: 5.0 },
        ],
      };

      const result = validateArtifactPiece(piece);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects +20 piece with fewer than 8 total rolls', () => {
      const piece: ArtifactPiece = {
        slotKey: 'circlet',
        rarity: 5,
        level: 20,
        mainStatKey: 'critRate_',
        substats: [
          { key: 'critDMG_', value: 7.8 }, // 1 roll
          { key: 'atk_', value: 5.8 }, // 1 roll
          { key: 'eleMas', value: 23.0 }, // 1 roll
          { key: 'enerRech_', value: 6.5 }, // 1 roll => total 4 rolls on +20!
        ],
      };

      const result = validateArtifactPiece(piece);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Total rolls'))).toBe(true);
    });
  });

  describe('validateGoodArtifact', () => {
    it('sanitizes and extracts a valid GOOD JSON artifact piece', () => {
      const raw = {
        slotKey: 'flower',
        setKey: 'EmblemOfSeveredFate',
        rarity: 5,
        level: 20,
        mainStatKey: 'hp',
        substats: [
          { key: 'critRate_', value: 7.0 },
          { key: 'critDMG_', value: 14.0 },
          { key: 'atk_', value: 9.9 },
          { key: 'enerRech_', value: 11.0 },
        ],
        location: 'RaidenShogun',
      };

      const res = validateGoodArtifact(raw);
      expect(res.isValid).toBe(true);
      expect(res.sanitizedPiece).toBeDefined();
      expect(res.sanitizedPiece?.slotKey).toBe('flower');
      expect(res.sanitizedPiece?.substats).toHaveLength(4);
    });

    it('rejects invalid or null raw input', () => {
      expect(validateGoodArtifact(null).isValid).toBe(false);
      expect(validateGoodArtifact({}).isValid).toBe(false);
      expect(
        validateGoodArtifact({
          slotKey: 'invalid_slot',
          mainStatKey: 'hp',
        }).isValid,
      ).toBe(false);
    });
  });
});
