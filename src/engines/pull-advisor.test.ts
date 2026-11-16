import { describe, it, expect } from 'vitest';
import { evaluateComprehensivePullROI } from './pull-advisor';
import type { OwnedCharacterProfile, OwnedWeapon, PullBudgetState } from '../types/genshin';
import { getWeaponByKey } from '../data/weapons';
import { CHARACTERS } from '../data/characters';

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

    // Also recognizes ownership when weapon key is stored as lowercase alias in bag
    const weaponsAlias: OwnedWeapon[] = [
      {
        id: 'w_tome_alias',
        key: 'tomeoftheeternalflow',
        name: 'Tome of the Eternal Flow',
        level: 90,
        refinement: 1,
        location: '',
      },
    ];
    const adviceAlias = evaluateComprehensivePullROI(
      profiles,
      weaponsAlias,
      baseBudget,
      'banner_5_2_phase_2',
    );
    const tomeAdviceAlias = adviceAlias.find(
      (a) => a.targetType === 'Signature_Weapon' && a.weaponKey === 'TomeOfTheEternalFlow',
    );
    expect(tomeAdviceAlias).toBeDefined();
    expect(tomeAdviceAlias?.tier).toBe('Skip / Redundant');
    expect(tomeAdviceAlias?.score).toBe(20);

    // Also recognizes ownership when weapon key is in owned character profile as alias
    const profilesEquippedAlias: Record<string, OwnedCharacterProfile> = {
      Neuvillette: {
        id: 'Neuvillette',
        level: 90,
        constellation: 0,
        weapon: {
          key: 'tomeoftheeternalflow',
          name: 'Tome of the Eternal Flow',
          level: 90,
          refinement: 1,
          rarity: 5,
        },
      },
    };
    const adviceEquipped = evaluateComprehensivePullROI(
      profilesEquippedAlias,
      [],
      baseBudget,
      'banner_5_2_phase_2',
    );
    const tomeAdviceEquipped = adviceEquipped.find(
      (a) => a.targetType === 'Signature_Weapon' && a.weaponKey === 'TomeOfTheEternalFlow',
    );
    expect(tomeAdviceEquipped).toBeDefined();
    expect(tomeAdviceEquipped?.tier).toBe('Skip / Redundant');
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

  it('evaluates Version 7.2 Phase 1 banner with Mitya, Furina, Valeriy, and Starsealed Edict', () => {
    const advice = evaluateComprehensivePullROI({}, [], baseBudget, 'banner_7_2_phase_1');
    const mitya = advice.find((a) => a.characterId === 'Mitya' && a.targetType === 'C0_Character');
    const furina = advice.find((a) => a.characterId === 'Furina' && a.targetType === 'C0_Character');
    const valeriy = advice.find((a) => a.characterId === 'Valeriy');
    const starsealed = advice.find((a) => a.weaponKey === 'StarsealedEdict');
    const splendor = advice.find((a) => a.weaponKey === 'SplendorOfTranquilWaters');

    expect(mitya).toBeDefined();
    expect(mitya?.score).toBeGreaterThanOrEqual(90);
    expect(furina).toBeDefined();
    expect(valeriy).toBeDefined();
    expect(starsealed).toBeDefined();
    expect(starsealed?.characterId).toBe('Mitya');
    expect(splendor).toBeDefined();
    expect(splendor?.characterId).toBe('Furina');
  });

  it('evaluates Version 7.2 Phase 2 banner with Zibai and Linnea without cross-character hijacking', () => {
    const advice = evaluateComprehensivePullROI({}, [], baseBudget, 'banner_7_2_phase_2');
    const zibai = advice.find((a) => a.characterId === 'Zibai' && a.targetType === 'C0_Character');
    const linnea = advice.find((a) => a.characterId === 'Linnea' && a.targetType === 'C0_Character');
    const foliar = advice.find((a) => a.weaponKey === 'LightOfFoliarIncision');
    const aqua = advice.find((a) => a.weaponKey === 'AquaSimulacra');

    expect(zibai).toBeDefined();
    expect(linnea).toBeDefined();

    // Verify Foliar belongs to Zibai (NOT Alhaitham) on 7.2 Phase 2
    expect(foliar).toBeDefined();
    expect(foliar?.characterId).toBe('Zibai');

    // Verify Aqua Simulacra belongs to Linnea (NOT Yelan) on 7.2 Phase 2
    expect(aqua).toBeDefined();
    expect(aqua?.characterId).toBe('Linnea');
  });

  it('evaluates Version 7.2 Natlan Chronicled Wish with Natlan 5★ units and authentic signatures', () => {
    const advice = evaluateComprehensivePullROI({}, [], baseBudget, 'banner_7_2_natlan_chronicled');
    const xilonen = advice.find((a) => a.characterId === 'Xilonen');
    const chasca = advice.find((a) => a.characterId === 'Chasca');
    const kinich = advice.find((a) => a.characterId === 'Kinich');
    const mualani = advice.find((a) => a.characterId === 'Mualani');
    const varesa = advice.find((a) => a.characterId === 'Varesa');

    const peakPatrol = advice.find((a) => a.weaponKey === 'PeakPatrolSong');
    const vividNotions = advice.find((a) => a.weaponKey === 'VividNotions');

    expect(xilonen).toBeDefined();
    expect(chasca).toBeDefined();
    expect(kinich).toBeDefined();
    expect(mualani).toBeDefined();
    expect(varesa).toBeDefined();
    expect(peakPatrol).toBeDefined();
    expect(vividNotions).toBeDefined();
    expect(vividNotions?.characterId).toBe('Varesa');
  });

  it('evaluates all 122 playable gacha characters in Sandbox mode (excluding story Travelers)', () => {
    const advice = evaluateComprehensivePullROI({}, [], baseBudget, 'sandbox');
    const charAdvice = advice.filter((a) => a.targetType === 'C0_Character');

    // Exactly 122 playable gacha characters (128 total canonical units minus 6 free story Travelers)
    const expectedGachaChars = CHARACTERS.filter((c) => !c.id.startsWith('Traveler'));
    expect(charAdvice.length).toBe(expectedGachaChars.length);
    expect(charAdvice.length).toBe(122);

    // Free story Travelers must never be recommended as gacha pull targets
    expect(charAdvice.some((a) => a.characterId.startsWith('Traveler'))).toBe(false);

    // Verify presence of modern 7.x/Nod-Krai/Celestia era characters
    expect(charAdvice.some((a) => a.characterId === 'Mitya')).toBe(true);
    expect(charAdvice.some((a) => a.characterId === 'Columbina')).toBe(true);
    expect(charAdvice.some((a) => a.characterId === 'Sandrone')).toBe(true);
    expect(charAdvice.some((a) => a.characterId === 'Varka')).toBe(true);
    expect(charAdvice.some((a) => a.characterId === 'Skirk')).toBe(true);
  });

  it('verifies that every Signature_Weapon recommendation has a resolvable weaponKey with non-empty icon', () => {
    const advice = evaluateComprehensivePullROI({}, [], baseBudget, 'sandbox');
    const weaponAdvice = advice.filter((a) => a.targetType === 'Signature_Weapon');
    expect(weaponAdvice.length).toBeGreaterThan(0);

    for (const item of weaponAdvice) {
      expect(item.weaponKey).toBeDefined();
      const dbWeapon = getWeaponByKey(item.weaponKey!);
      expect(dbWeapon, `Failed to resolve weapon for key: ${item.weaponKey}`).toBeDefined();
      expect(dbWeapon?.icon).toBeTruthy();
      expect(dbWeapon?.icon).toMatch(/^https:\/\//);
    }
  });

  it('provides dynamic constellation fallback advice for owned characters without hardcoded spikes', () => {
    // Escoffier has no custom entry in CONSTELLATION_SPIKES
    const profiles: Record<string, OwnedCharacterProfile> = {
      Escoffier: { id: 'Escoffier', level: 90, constellation: 0 },
    };
    const advice = evaluateComprehensivePullROI(profiles, [], baseBudget, 'sandbox');
    const escoffierConst = advice.find(
      (a) => a.characterId === 'Escoffier' && a.targetType === 'Constellation',
    );
    expect(escoffierConst).toBeDefined();
    expect(escoffierConst?.targetLevelText).toContain('C1');
    expect(escoffierConst?.score).toBeGreaterThan(50);
  });

  it('correctly matches WolfSGravestone and alias substitutes in signature weapon evaluations', () => {
    // Navia owns WolfSGravestone (canonical key)
    const profiles: Record<string, OwnedCharacterProfile> = {
      Navia: { id: 'Navia', level: 90, constellation: 0 },
    };
    const weaponsWithoutSub: OwnedWeapon[] = [];
    const adviceWithoutSub = evaluateComprehensivePullROI(profiles, weaponsWithoutSub, baseBudget, 'sandbox');
    const verdictWithout = adviceWithoutSub.find(
      (a) => a.characterId === 'Navia' && a.targetType === 'Signature_Weapon',
    );
    expect(verdictWithout).toBeDefined();

    // With owned WolfSGravestone substitute
    const weaponsWithSub: OwnedWeapon[] = [
      {
        id: 'w_wgs',
        key: 'WolfSGravestone',
        name: "Wolf's Gravestone",
        level: 90,
        refinement: 1,
        location: '',
      },
    ];
    const adviceWithSub = evaluateComprehensivePullROI(profiles, weaponsWithSub, baseBudget, 'sandbox');
    const verdictWith = adviceWithSub.find(
      (a) => a.characterId === 'Navia' && a.targetType === 'Signature_Weapon',
    );
    expect(verdictWith).toBeDefined();
    // Uplift should be penalized by 8% (from base 20% down to 12%)
    expect(verdictWith!.teamDamageUpliftPct).toBeLessThan(verdictWithout!.teamDamageUpliftPct);
    expect(verdictWith!.caution).toContain("Wolf's Gravestone");

    // Also with alias key variation 'wolfsgravestone'
    const weaponsWithAlias: OwnedWeapon[] = [
      {
        id: 'w_alias_wgs',
        key: 'wolfsgravestone',
        name: "Wolf's Gravestone",
        level: 90,
        refinement: 1,
        location: '',
      },
    ];
    const adviceWithAlias = evaluateComprehensivePullROI(profiles, weaponsWithAlias, baseBudget, 'sandbox');
    const verdictWithAlias = adviceWithAlias.find(
      (a) => a.characterId === 'Navia' && a.targetType === 'Signature_Weapon',
    );
    expect(verdictWithAlias).toBeDefined();
    expect(verdictWithAlias!.teamDamageUpliftPct).toBe(verdictWith!.teamDamageUpliftPct);
    expect(verdictWithAlias!.caution).toContain("Wolf's Gravestone");
  });
});
