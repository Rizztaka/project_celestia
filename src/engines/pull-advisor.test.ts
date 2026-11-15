import { describe, it, expect } from 'vitest';
import { evaluateComprehensivePullROI, evaluatePullRecommendations } from './pull-advisor';
import type { OwnedCharacterProfile, OwnedWeapon, PullBudgetState } from '../types/genshin';

describe('Pull Advisor v2 - Account-Aware Comprehensive ROI Evaluator', () => {
  const baseBudget: PullBudgetState = {
    primogems: 16000,
    fates: 20, // Total = 120 pulls
    characterPity: 20,
    characterGuaranteed: false,
    weaponPity: 10,
    weaponFatePoints: 0,
  };

  it('recommends C1/C2 constellation for owned C0 Furina, NOT C0', () => {
    const profiles: Record<string, OwnedCharacterProfile> = {
      Furina: { id: 'Furina', level: 90, constellation: 0 },
      Bennett: { id: 'Bennett', level: 90, constellation: 1 },
    };
    const weapons: OwnedWeapon[] = [];

    const advice = evaluateComprehensivePullROI(profiles, weapons, baseBudget);

    // Furina C0 should NOT be recommended
    const furinaC0 = advice.find((a) => a.characterId === 'Furina' && a.targetType === 'C0_Character');
    expect(furinaC0).toBeUndefined();

    // Furina Constellation SHOULD be recommended
    const furinaConst = advice.find(
      (a) => a.characterId === 'Furina' && a.targetType === 'Constellation',
    );
    expect(furinaConst).toBeDefined();
    expect(furinaConst?.targetLevelText).toMatch(/C1|C2/);
    expect(furinaConst?.teamDamageUpliftPct).toBeGreaterThanOrEqual(15);
  });

  it('never recommends constellation advice for an owned C6 character', () => {
    const profiles: Record<string, OwnedCharacterProfile> = {
      Furina: { id: 'Furina', level: 90, constellation: 6 },
    };
    const weapons: OwnedWeapon[] = [];

    const advice = evaluateComprehensivePullROI(profiles, weapons, baseBudget);

    const furinaConst = advice.find(
      (a) => a.characterId === 'Furina' && a.targetType === 'Constellation',
    );
    expect(furinaConst).toBeUndefined();
  });

  it('ranks Xilonen C0 as Must Pull when account lacks universal buffers', () => {
    // Account has no Xilonen, no Kazuha
    const profiles: Record<string, OwnedCharacterProfile> = {
      Xiangling: { id: 'Xiangling', level: 90, constellation: 4 },
      Bennett: { id: 'Bennett', level: 90, constellation: 1 },
      Xingqiu: { id: 'Xingqiu', level: 90, constellation: 6 },
    };
    const weapons: OwnedWeapon[] = [];

    const advice = evaluateComprehensivePullROI(profiles, weapons, baseBudget);

    const xilonen = advice.find((a) => a.characterId === 'Xilonen' && a.targetType === 'C0_Character');
    expect(xilonen).toBeDefined();
    expect(xilonen?.tier).toBe('Must Pull');
    expect(xilonen?.score).toBeGreaterThanOrEqual(90);
    expect(xilonen?.unlockedArchetypes.length).toBeGreaterThan(0);
  });

  it('drops signature weapon ROI if character already possesses a high-refinement substitute', () => {
    // Case A: Neuvillette with only 3-star/starter weapon -> Tome is high value
    const profilesA: Record<string, OwnedCharacterProfile> = {
      Neuvillette: {
        id: 'Neuvillette',
        level: 90,
        constellation: 0,
        weapon: { key: 'MagicGuide', name: 'Magic Guide', level: 90, refinement: 5 },
      },
    };
    const weaponsA: OwnedWeapon[] = [
      {
        id: 'w_mg',
        key: 'MagicGuide',
        name: 'Magic Guide',
        level: 90,
        refinement: 5,
        location: 'Neuvillette',
      },
    ];

    const adviceA = evaluateComprehensivePullROI(profilesA, weaponsA, baseBudget);
    const tomeA = adviceA.find(
      (a) => a.targetType === 'Signature_Weapon' && a.weaponKey === 'TomeOfTheEternalFlow',
    );
    expect(tomeA).toBeDefined();
    expect(tomeA?.tier).toMatch(/Must Pull|High Value/);

    // Case B: Neuvillette already has Sacrificial Jade R5 equipped
    const profilesB: Record<string, OwnedCharacterProfile> = {
      Neuvillette: {
        id: 'Neuvillette',
        level: 90,
        constellation: 0,
        weapon: { key: 'SacrificialJade', name: 'Sacrificial Jade', level: 90, refinement: 5 },
      },
    };
    const weaponsB: OwnedWeapon[] = [
      {
        id: 'w_sj',
        key: 'SacrificialJade',
        name: 'Sacrificial Jade',
        level: 90,
        refinement: 5,
        location: 'Neuvillette',
      },
    ];

    const adviceB = evaluateComprehensivePullROI(profilesB, weaponsB, baseBudget);
    const tomeB = adviceB.find(
      (a) => a.targetType === 'Signature_Weapon' && a.weaponKey === 'TomeOfTheEternalFlow',
    );
    expect(tomeB).toBeDefined();
    // With Sac Jade R5, the score must drop significantly compared to Case A
    expect(tomeB!.score).toBeLessThan(tomeA!.score);
    expect(tomeB!.teamDamageUpliftPct).toBeLessThan(tomeA!.teamDamageUpliftPct);
  });

  it('correctly binds odds and primogem requirements to current budget state', () => {
    const profiles: Record<string, OwnedCharacterProfile> = {
      Xiangling: { id: 'Xiangling', level: 90, constellation: 4 },
    };
    const weapons: OwnedWeapon[] = [];

    // 0 pulls, 0 pity
    const zeroBudget: PullBudgetState = {
      primogems: 0,
      fates: 0,
      characterPity: 0,
      characterGuaranteed: false,
      weaponPity: 0,
      weaponFatePoints: 0,
    };
    const adviceZero = evaluateComprehensivePullROI(profiles, weapons, zeroBudget);
    const targetZero = adviceZero[0];
    expect(targetZero.odds.pullsAvailable).toBe(0);
    expect(targetZero.odds.cumulativeProbability).toBe(0);
    expect(targetZero.odds.primogemsNeeded).toBeGreaterThan(0);

    // Guaranteed with sufficient pulls
    const richBudget: PullBudgetState = {
      primogems: 32000,
      fates: 50,
      characterPity: 80,
      characterGuaranteed: true,
      weaponPity: 70,
      weaponFatePoints: 1,
    };
    const adviceRich = evaluateComprehensivePullROI(profiles, weapons, richBudget);
    const targetRich = adviceRich[0];
    expect(targetRich.odds.cumulativeProbability).toBe(1.0);
    expect(targetRich.odds.primogemsNeeded).toBe(0);
  });

  it('filters by banner phase id when specified', () => {
    const profiles: Record<string, OwnedCharacterProfile> = {};
    const weapons: OwnedWeapon[] = [];

    // Filter to 5.3 Phase 1 (Mavuika & Citlali)
    const advice53 = evaluateComprehensivePullROI(
      profiles,
      weapons,
      baseBudget,
      'banner_5_3_phase_1',
    );

    const characterIds = new Set(advice53.map((a) => a.characterId));
    expect(characterIds.has('Mavuika') || characterIds.has('Citlali')).toBe(true);
    // Should not include characters outside 5.3 Phase 1
    expect(characterIds.has('Neuvillette')).toBe(false);
  });
});
