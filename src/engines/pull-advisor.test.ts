import { describe, it, expect } from 'vitest';
import { evaluateComprehensivePullROI } from './pull-advisor';
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

  it('progresses constellations stepwise (C0 -> C1 -> C2) with accurate single-copy odds', () => {
    // When Nahida is owned at C0, recommend C1 first
    const profilesC0: Record<string, OwnedCharacterProfile> = {
      Nahida: { id: 'Nahida', level: 90, constellation: 0 },
    };
    const adviceC0 = evaluateComprehensivePullROI(profilesC0, [], baseBudget);
    const nahidaC0 = adviceC0.find((a) => a.characterId === 'Nahida' && a.targetType === 'Constellation');
    expect(nahidaC0).toBeDefined();
    expect(nahidaC0?.targetLevelText).toContain('C1');

    // When Nahida is owned at C1, recommend C2 next
    const profilesC1: Record<string, OwnedCharacterProfile> = {
      Nahida: { id: 'Nahida', level: 90, constellation: 1 },
    };
    const adviceC1 = evaluateComprehensivePullROI(profilesC1, [], baseBudget);
    const nahidaC1 = adviceC1.find((a) => a.characterId === 'Nahida' && a.targetType === 'Constellation');
    expect(nahidaC1).toBeDefined();
    expect(nahidaC1?.targetLevelText).toContain('C2');
  });

  it('marks featured signature weapon as Skip / Redundant if player already owns it', () => {
    const profiles: Record<string, OwnedCharacterProfile> = {
      Neuvillette: { id: 'Neuvillette', level: 90, constellation: 0 },
    };
    const weapons: OwnedWeapon[] = [
      {
        id: 'w_tome',
        key: 'TomeOfTheEternalFlow',
        name: 'Tome of the Eternal Flow',
        level: 90,
        refinement: 1,
        location: 'Neuvillette',
      },
    ];

    const advice = evaluateComprehensivePullROI(
      profiles,
      weapons,
      baseBudget,
      'banner_5_2_phase_2', // Neuvillette & Zhongli banner
    );

    const tomeAdvice = advice.find(
      (a) => a.targetType === 'Signature_Weapon' && a.weaponKey === 'TomeOfTheEternalFlow',
    );
    expect(tomeAdvice).toBeDefined();
    expect(tomeAdvice?.tier).toBe('Skip / Redundant');
    expect(tomeAdvice?.score).toBe(20);
    expect(tomeAdvice?.teamDamageUpliftPct).toBe(0);
  });

  it('accurately evaluates all featured weapons across 5.x banner phases (Homa, Uraku, Great Magic)', () => {
    // When Hu Tao is owned, Staff of Homa is High Value / Must Pull
    const profilesWithHuTao: Record<string, OwnedCharacterProfile> = {
      HuTao: { id: 'HuTao', level: 90, constellation: 0 },
    };
    const weapons: OwnedWeapon[] = [];

    // 5.1 Phase 2 (Nahida & Hu Tao -> Floating Dreams & Staff of Homa)
    const advice51p2 = evaluateComprehensivePullROI(profilesWithHuTao, weapons, baseBudget, 'banner_5_1_phase_2');
    const homa = advice51p2.find((a) => a.weaponKey === 'StaffOfHoma');
    expect(homa).toBeDefined();
    expect(homa?.tier).toMatch(/Must Pull|High Value/);

    // When character is unowned, signature weapon receives unowned penalty ('Situational')
    const adviceUnowned = evaluateComprehensivePullROI({}, weapons, baseBudget, 'banner_5_1_phase_2');
    const homaUnowned = adviceUnowned.find((a) => a.weaponKey === 'StaffOfHoma');
    expect(homaUnowned?.tier).toBe('Situational');
    expect(homaUnowned?.caution).toContain('does not yet own Hu Tao');

    // 5.1 Phase 1 (Xilonen & Chiori -> Peak Patrol Song & Uraku Misugiri)
    const advice51p1 = evaluateComprehensivePullROI({}, weapons, baseBudget, 'banner_5_1_phase_1');
    const uraku = advice51p1.find((a) => a.weaponKey === 'UrakuMisugiri');
    expect(uraku).toBeDefined();

    // 5.2 Phase 1 (Chasca & Lyney -> Crimson Plumage & The First Great Magic)
    const advice52p1 = evaluateComprehensivePullROI({}, weapons, baseBudget, 'banner_5_2_phase_1');
    const magic = advice52p1.find((a) => a.weaponKey === 'TheFirstGreatMagic');
    expect(magic).toBeDefined();

    // 5.4 Phase 1 (Nefer & Furina -> Reliquary of Truth & Splendor)
    const advice54p1 = evaluateComprehensivePullROI({}, weapons, baseBudget, 'banner_5_4_phase_1');
    const reliquary = advice54p1.find((a) => a.weaponKey === 'ReliquaryOfTruth');
    const splendor = advice54p1.find((a) => a.weaponKey === 'SplendorOfTranquilWaters');
    expect(reliquary).toBeDefined();
    expect(splendor).toBeDefined();
  });

  it('selects the highest refinement across bag and equipped profiles when penalizing substitutes', () => {
    const profiles: Record<string, OwnedCharacterProfile> = {
      Neuvillette: {
        id: 'Neuvillette',
        level: 90,
        constellation: 0,
        // Equipped R1 copy
        weapon: { key: 'SacrificialJade', name: 'Sacrificial Jade', level: 90, refinement: 1 },
      },
    };
    // But player also has an unequipped R5 copy in weapon inventory
    const weapons: OwnedWeapon[] = [
      {
        id: 'w_sj_5',
        key: 'SacrificialJade',
        name: 'Sacrificial Jade',
        level: 90,
        refinement: 5,
        location: '',
      },
    ];

    const advice = evaluateComprehensivePullROI(profiles, weapons, baseBudget);
    const tome = advice.find((a) => a.weaponKey === 'TomeOfTheEternalFlow');
    expect(tome).toBeDefined();
    // Must trigger the R4-R5 penalty (uplift 24 - 18 = 6%), NOT the R1 penalty (uplift 24 - 12 = 12%)
    expect(tome?.teamDamageUpliftPct).toBe(6);
    expect(tome?.caution).toContain('R4-R5');
  });
});
