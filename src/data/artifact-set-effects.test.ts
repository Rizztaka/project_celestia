import { describe, it, expect } from 'vitest';
import {
  ARTIFACT_SET_EFFECTS,
  calculateSetEquivalentSubstatRolls,
  parseActiveSetBonuses,
} from './artifact-set-effects';

describe('Artifact Set Effects & Equivalent Substat Rolls (ESR)', () => {
  describe('ARTIFACT_SET_EFFECTS Registry', () => {
    it('defines effects for all 37 combat artifact sets', () => {
      const keys = Object.keys(ARTIFACT_SET_EFFECTS);
      expect(keys.length).toBeGreaterThanOrEqual(37);

      expect(ARTIFACT_SET_EFFECTS['Emblem of Severed Fate']).toBeDefined();
      expect(ARTIFACT_SET_EFFECTS['Marechaussee Hunter']).toBeDefined();
      expect(ARTIFACT_SET_EFFECTS['Obsidian Codex']).toBeDefined();
      expect(ARTIFACT_SET_EFFECTS['Blizzard Strayer']).toBeDefined();
      expect(ARTIFACT_SET_EFFECTS['Deepwood Memories']).toBeDefined();
      expect(ARTIFACT_SET_EFFECTS['Viridescent Venerer']).toBeDefined();
      expect(ARTIFACT_SET_EFFECTS['Golden Troupe']).toBeDefined();
      expect(ARTIFACT_SET_EFFECTS['Crimson Witch of Flames']).toBeDefined();
    });
  });

  describe('parseActiveSetBonuses', () => {
    it('detects 4-piece active set from 4 or 5 pieces of the same set', () => {
      const pieces = [
        'Emblem of Severed Fate',
        'Emblem of Severed Fate',
        'Emblem of Severed Fate',
        'Emblem of Severed Fate',
        "Gladiator's Finale",
      ];
      const active = parseActiveSetBonuses(pieces);
      expect(active.active4pc).toContain('Emblem of Severed Fate');
      expect(active.active2pc).toContain('Emblem of Severed Fate');
      expect(active.active2pc).not.toContain("Gladiator's Finale");
    });

    it('detects 2pc + 2pc hybrid sets', () => {
      const pieces = [
        'Golden Troupe',
        'Golden Troupe',
        'Marechaussee Hunter',
        'Marechaussee Hunter',
        'Obsidian Codex',
      ];
      const active = parseActiveSetBonuses(pieces);
      expect(active.active4pc).toHaveLength(0);
      expect(active.active2pc).toContain('Golden Troupe');
      expect(active.active2pc).toContain('Marechaussee Hunter');
      expect(active.active2pc).not.toContain('Obsidian Codex');
    });

    it('detects rainbow build (no active 2pc or 4pc)', () => {
      const pieces = [
        'Golden Troupe',
        'Marechaussee Hunter',
        'Obsidian Codex',
        'Deepwood Memories',
        'Noblesse Oblige',
      ];
      const active = parseActiveSetBonuses(pieces);
      expect(active.active4pc).toHaveLength(0);
      expect(active.active2pc).toHaveLength(0);
    });
  });

  describe('calculateSetEquivalentSubstatRolls', () => {
    it('evaluates Marechaussee Hunter 4pc for Neuvillette', () => {
      const activeSets = [{ setKey: 'Marechaussee Hunter', pieces: 4 }];
      const esr = calculateSetEquivalentSubstatRolls(
        activeSets,
        'Neuvillette',
        120,
      );

      // 4pc MH gives +36% Crit Rate (36 / 3.89 ~ 9.25 rolls) + 15% CA DMG (~3 rolls)
      expect(esr.totalEsr).toBeGreaterThan(10);
      expect(esr.breakdown['critRate_']).toBeCloseTo(9.25, 0);
      expect(esr.active4pc).toContain('Marechaussee Hunter');
    });

    it('evaluates Emblem of Severed Fate scaling with ER for Raiden Shogun', () => {
      const activeSets = [{ setKey: 'Emblem of Severed Fate', pieces: 4 }];
      const esrHighEr = calculateSetEquivalentSubstatRolls(
        activeSets,
        'RaidenShogun',
        250, // 250% ER => 62.5% Burst DMG
      );
      const esrLowEr = calculateSetEquivalentSubstatRolls(
        activeSets,
        'RaidenShogun',
        140, // 140% ER => 35% Burst DMG
      );

      // Higher ER must yield significantly higher ESR from 4pc Emblem
      expect(esrHighEr.totalEsr).toBeGreaterThan(esrLowEr.totalEsr);
      expect(esrHighEr.breakdown['dmg_bonus']).toBeGreaterThan(
        esrLowEr.breakdown['dmg_bonus'],
      );
      expect(esrHighEr.breakdown['enerRech_']).toBeCloseTo(20 / 6.48, 1);
    });

    it('evaluates 2pc + 2pc hybrid build correctly', () => {
      const activeSets = [
        { setKey: "Gladiator's Finale", pieces: 2 }, // +18% ATK
        { setKey: 'Gilded Dreams', pieces: 2 }, // +80 EM
      ];
      // Use an ATK & EM character (e.g. Xiangling or generic ATK scaler)
      const esr = calculateSetEquivalentSubstatRolls(activeSets, 'Xiangling', 100);

      // 18% ATK = 18 / 5.83 = 3.09 max rolls * atk_ weight
      // 80 EM = 80 / 23.31 = 3.43 max rolls * eleMas weight
      expect(esr.breakdown['atk_']).toBeGreaterThan(1.5);
      expect(esr.breakdown['eleMas']).toBeGreaterThan(2.0);
      expect(esr.active2pc).toHaveLength(2);
      expect(esr.active4pc).toHaveLength(0);
    });

    it('returns 0 ESR for rainbow builds', () => {
      const esr = calculateSetEquivalentSubstatRolls([], 'Hu Tao', 100);
      expect(esr.totalEsr).toBe(0);
      expect(esr.active2pc).toHaveLength(0);
      expect(esr.active4pc).toHaveLength(0);
    });
  });
});
