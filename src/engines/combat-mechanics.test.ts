import { describe, it, expect } from 'vitest';
import {
  calculateEffectiveResMultiplier,
  calculateShieldBreakTime,
  getCharacterGaugeRate,
  calculateTeamResShred,
  isNightsoulCharacter,
  NATLAN_NIGHTSOUL_IDS,
} from './combat-mechanics';
import type { Character } from '../types/genshin';

const mockCharacter = (partial: Partial<Character>): Character => ({
  id: partial.id || 'CustomChar',
  name: partial.name || 'Custom Char',
  element: partial.element || 'Pyro',
  weapon: partial.weapon || 'Sword',
  rarity: partial.rarity || 5,
  roles: partial.roles || ['On-Field DPS'],
  tags: partial.tags || [],
  ...partial,
});

describe('Combat Mechanics Engine', () => {
  describe('Piecewise Enemy Resistance Curve (KeqingMains standard)', () => {
    it('calculates standard 10% base RES with 0 shred', () => {
      // effectiveRes = 0.10 -> 1 - 0.10 = 0.90
      const mult = calculateEffectiveResMultiplier(10, 0);
      expect(mult).toBeCloseTo(0.9, 4);
    });

    it('calculates negative effective RES with 40% VV shred on 10% base RES', () => {
      // (10 - 40) / 100 = -0.30 -> 1 - (-0.30 / 2) = 1.15
      const mult = calculateEffectiveResMultiplier(10, 40);
      expect(mult).toBeCloseTo(1.15, 4);
    });

    it('calculates negative effective RES with 60% shred (VV + Zhongli) on 10% base RES', () => {
      // (10 - 60) / 100 = -0.50 -> 1 - (-0.50 / 2) = 1.25
      const mult = calculateEffectiveResMultiplier(10, 60);
      expect(mult).toBeCloseTo(1.25, 4);
    });

    it('calculates extreme 80% base RES with 0 shred', () => {
      // 80% res = 0.80 > 0.75 -> 1 / (4 * 0.80 + 1) = 1 / 4.2 ≈ 0.238095
      const mult = calculateEffectiveResMultiplier(80, 0);
      expect(mult).toBeCloseTo(1 / 4.2, 4);
    });

    it('calculates 80% base RES with 40% shred down to 40% normal RES', () => {
      // (80 - 40) / 100 = 0.40 <= 0.75 -> 1 - 0.40 = 0.60
      const mult = calculateEffectiveResMultiplier(80, 40);
      expect(mult).toBeCloseTo(0.6, 4);
    });

    it('evaluates continuity at exact boundary thresholds (0% and 75%)', () => {
      // Boundary 0: effectiveRes = 0 -> 1 - 0 = 1.0
      expect(calculateEffectiveResMultiplier(0, 0)).toBe(1.0);
      // Boundary 75%: effectiveRes = 0.75 -> 1 - 0.75 = 0.25; 1 / (4 * 0.75 + 1) = 0.25
      expect(calculateEffectiveResMultiplier(75, 0)).toBeCloseTo(0.25, 4);
    });

    it('safely handles non-finite or NaN inputs without crashing', () => {
      expect(Number.isFinite(calculateEffectiveResMultiplier(NaN, 0))).toBe(true);
      expect(Number.isFinite(calculateEffectiveResMultiplier(10, NaN))).toBe(true);
    });
  });

  describe('Shield Break Calculator', () => {
    const xingqiu = mockCharacter({ id: 'Xingqiu', name: 'Xingqiu', element: 'Hydro', weapon: 'Sword' });
    const furina = mockCharacter({ id: 'Furina', name: 'Furina', element: 'Hydro', weapon: 'Sword' });
    const xiangling = mockCharacter({ id: 'Xiangling', name: 'Xiangling', element: 'Pyro', weapon: 'Polearm' });
    const nahida = mockCharacter({ id: 'Nahida', name: 'Nahida', element: 'Dendro', weapon: 'Catalyst' });

    it('breaks 36 GU Pyro Lector shield rapidly with Hydro units (Furina + Xingqiu)', () => {
      const res = calculateShieldBreakTime('Pyro', 36, [furina, xingqiu]);
      expect(res.rating).toBe('Fast');
      expect(res.seconds).toBeLessThanOrEqual(5.0);
      expect(res.breakdown).toContain('Xingqiu');
      expect(res.breakdown).toContain('Furina');
    });

    it('rates pure Pyro/Dendro team as Ineffective against Pyro shield', () => {
      const res = calculateShieldBreakTime('Pyro', 36, [xiangling, nahida]);
      expect(res.rating).toBe('Ineffective');
      expect(res.seconds).toBe(Infinity);
      expect(res.effectiveRate).toBe(0);
    });

    it('retrieves custom character gauge rates accurately', () => {
      const xqRate = getCharacterGaugeRate(xingqiu);
      expect(xqRate.guPerSec).toBe(2.5);
      expect(xqRate.element).toBe('Hydro');

      const customCatalyst = mockCharacter({ id: 'CustomUnknown', weapon: 'Catalyst', element: 'Anemo' });
      const customRate = getCharacterGaugeRate(customCatalyst);
      expect(customRate.guPerSec).toBe(1.0);
    });

    it('handles 0 shield units immediately as Fast', () => {
      const res = calculateShieldBreakTime('Pyro', 0, [xingqiu]);
      expect(res.seconds).toBe(0);
      expect(res.rating).toBe('Fast');
    });

    it('handles empty team gracefully', () => {
      const res = calculateShieldBreakTime('Pyro', 36, []);
      expect(res.rating).toBe('Ineffective');
      expect(res.seconds).toBe(Infinity);
    });
  });

  describe('Natlan Nightsoul Barrier Advantage', () => {
    const mavuika = mockCharacter({
      id: 'Mavuika',
      name: 'Mavuika',
      element: 'Pyro',
      weapon: 'Claymore',
      tags: ['Nightsoul'],
    });
    const standardPyro = mockCharacter({
      id: 'Diluc',
      name: 'Diluc',
      element: 'Pyro',
      weapon: 'Claymore',
    });

    it('identifies Natlan Nightsoul characters correctly', () => {
      expect(isNightsoulCharacter(mavuika)).toBe(true);
      expect(isNightsoulCharacter(standardPyro)).toBe(false);
      expect(NATLAN_NIGHTSOUL_IDS.has('Xilonen')).toBe(true);
      expect(NATLAN_NIGHTSOUL_IDS.has('Kinich')).toBe(true);
      expect(NATLAN_NIGHTSOUL_IDS.has('Chasca')).toBe(true);
      expect(NATLAN_NIGHTSOUL_IDS.has('Citlali')).toBe(true);
    });

    it('gives Natlan characters a 3.0x multiplier on Nightspirit Ward gauge depletion', () => {
      const nightspiritShieldUnits = 18;

      // Rate for standard Diluc (1.2 GU/s * 1.0 = 1.2 GU/s) -> 18 / 1.2 = 15.0s
      const standardRes = calculateShieldBreakTime('Nightspirit', nightspiritShieldUnits, [standardPyro]);

      // Rate for Natlan Mavuika (2.0 GU/s * 3.0 = 6.0 GU/s) -> 18 / 6.0 = 3.0s
      const natlanRes = calculateShieldBreakTime('Nightspirit', nightspiritShieldUnits, [mavuika]);

      expect(natlanRes.rating).toBe('Fast');
      expect(natlanRes.seconds).toBeLessThan(standardRes.seconds);
      expect(standardRes.seconds / natlanRes.seconds).toBeGreaterThanOrEqual(2.5);
    });
  });

  describe('Team RES Shred Estimation', () => {
    it('detects 4pc VV 40% shred when Anemo is present', () => {
      const kazuha = mockCharacter({ id: 'KaedeharaKazuha', name: 'Kazuha', element: 'Anemo' });
      const { totalShred, sources } = calculateTeamResShred([kazuha], 'Pyro');
      expect(totalShred).toBe(40);
      expect(sources[0]).toContain('4pc VV');
    });

    it('stacks Zhongli 20% and VV 40% for 60% total shred', () => {
      const kazuha = mockCharacter({ id: 'KaedeharaKazuha', name: 'Kazuha', element: 'Anemo' });
      const zhongli = mockCharacter({ id: 'Zhongli', name: 'Zhongli', element: 'Geo' });
      const { totalShred } = calculateTeamResShred([kazuha, zhongli], 'Hydro');
      expect(totalShred).toBe(60);
    });

    it('applies Xilonen 36% shred for elemental targets', () => {
      const xilonen = mockCharacter({ id: 'Xilonen', name: 'Xilonen', element: 'Geo' });
      const { totalShred } = calculateTeamResShred([xilonen], 'Electro');
      expect(totalShred).toBe(36);
    });

    it('detects 4pc Deepwood 30% shred when Dendro character is present', () => {
      const nahida = mockCharacter({ id: 'Nahida', name: 'Nahida', element: 'Dendro' });
      const { totalShred, sources } = calculateTeamResShred([nahida], 'Dendro');
      expect(totalShred).toBe(30);
      expect(sources[0]).toContain('4pc Deepwood');
    });

    it('detects Geo Resonance 20% shred when 2+ Geo characters are present', () => {
      const zhongli = mockCharacter({ id: 'Zhongli', name: 'Zhongli', element: 'Geo' });
      const navia = mockCharacter({ id: 'Navia', name: 'Navia', element: 'Geo' });
      const { totalShred, sources } = calculateTeamResShred([zhongli, navia], 'Geo');
      // Zhongli shield (20%) + Geo resonance (20%) = 40%
      expect(totalShred).toBe(40);
      expect(sources.some((s) => s.includes('Geo Resonance'))).toBe(true);
    });

    it('detects Superconduct 40% shred for Physical damage when Electro + Cryo are present', () => {
      const fischl = mockCharacter({ id: 'Fischl', name: 'Fischl', element: 'Electro' });
      const eula = mockCharacter({ id: 'Eula', name: 'Eula', element: 'Cryo' });
      const { totalShred, sources } = calculateTeamResShred([fischl, eula], 'Physical');
      expect(totalShred).toBe(40);
      expect(sources[0]).toContain('Superconduct');
    });
  });
});
