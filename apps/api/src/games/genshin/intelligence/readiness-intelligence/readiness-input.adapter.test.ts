import { characterReadinessRequestSchema } from '@celestia/api-contracts';
import { describe, expect, it } from 'vitest';

import type { Artifact } from '../../account-data/account-context-provider.service.js';
import type { CharacterWithWeapon } from '../../characters/character.repository.js';
import { syntheticShowcase } from '../../showcase/showcase.fixtures.js';
import { parseShowcase } from '../../showcase/showcase.parser.js';
import {
  buildAuthenticatedReadinessInput,
  buildShowcaseReadinessInput,
  type ShowcaseCharacterRecord,
} from './readiness-input.adapter.js';
import { calculateReadiness } from './readiness-intelligence.calculator.js';

describe('readiness-input.adapter', () => {
  describe('buildAuthenticatedReadinessInput', () => {
    const mockBennett = {
      id: 'char-bennett-1',
      accountId: 'acc-1',
      characterKey: 'Bennett',
      level: 80,
      ascension: 5,
      constellation: 5,
      talentNormal: 1,
      talentSkill: 8,
      talentBurst: 10,
      equippedWeaponId: 'weap-fav-1',
      equippedWeapon: {
        id: 'weap-fav-1',
        accountId: 'acc-1',
        weaponKey: 'FavoniusSword',
        level: 90,
        ascension: 6,
        refinement: 5,
        locked: true,
        createdAt: new Date('2026-10-20T00:00:00.000Z'),
        updatedAt: new Date('2026-10-20T00:00:00.000Z'),
      },
      createdAt: new Date('2026-10-20T00:00:00.000Z'),
      updatedAt: new Date('2026-10-20T00:00:00.000Z'),
    } satisfies CharacterWithWeapon;

    const mockXiangling = {
      id: 'char-xl-1',
      accountId: 'acc-1',
      characterKey: 'Xiangling',
      level: 80,
      ascension: 5,
      constellation: 4,
      talentNormal: 1,
      talentSkill: 8,
      talentBurst: 9,
      equippedWeaponId: 'weap-catch-1',
      equippedWeapon: {
        id: 'weap-catch-1',
        accountId: 'acc-1',
        weaponKey: 'TheCatch',
        level: 90,
        ascension: 6,
        refinement: 5,
        locked: true,
        createdAt: new Date('2026-10-20T00:00:00.000Z'),
        updatedAt: new Date('2026-10-20T00:00:00.000Z'),
      },
      createdAt: new Date('2026-10-20T00:00:00.000Z'),
      updatedAt: new Date('2026-10-20T00:00:00.000Z'),
    } satisfies CharacterWithWeapon;

    const mockArtifacts: Artifact[] = [
      {
        id: 'art-flower',
        accountId: 'acc-1',
        setKey: 'NoblesseOblige',
        slotKey: 'flower',
        level: 20,
        rarity: 5,
        mainStatKey: 'hp',
        subStats: [
          { key: 'enerRech_', value: 16.2 },
          { key: 'hp_', value: 9.9 },
        ],
        locked: true,
        equippedCharacterId: 'char-bennett-1',
        createdAt: new Date('2026-10-20T00:00:00.000Z'),
        updatedAt: new Date('2026-10-20T00:00:00.000Z'),
      },
      {
        id: 'art-plume',
        accountId: 'acc-1',
        setKey: 'NoblesseOblige',
        slotKey: 'plume',
        level: 20,
        rarity: 5,
        mainStatKey: 'atk',
        subStats: [
          { key: 'enerRech_', value: 18.1 },
          { key: 'critRate_', value: 7.8 },
        ],
        locked: true,
        equippedCharacterId: 'char-bennett-1',
        createdAt: new Date('2026-10-20T00:00:00.000Z'),
        updatedAt: new Date('2026-10-20T00:00:00.000Z'),
      },
      {
        id: 'art-sands',
        accountId: 'acc-1',
        setKey: 'NoblesseOblige',
        slotKey: 'sands',
        level: 20,
        rarity: 5,
        mainStatKey: 'enerRech_',
        subStats: [{ key: 'hp_', value: 14.6 }],
        locked: true,
        equippedCharacterId: 'char-bennett-1',
        createdAt: new Date('2026-10-20T00:00:00.000Z'),
        updatedAt: new Date('2026-10-20T00:00:00.000Z'),
      },
      {
        id: 'art-goblet',
        accountId: 'acc-1',
        setKey: 'NoblesseOblige',
        slotKey: 'goblet',
        level: 20,
        rarity: 5,
        mainStatKey: 'hp_',
        subStats: [{ key: 'enerRech_', value: 15.5 }],
        locked: true,
        equippedCharacterId: 'char-bennett-1',
        createdAt: new Date('2026-10-20T00:00:00.000Z'),
        updatedAt: new Date('2026-10-20T00:00:00.000Z'),
      },
      {
        id: 'art-circlet',
        accountId: 'acc-1',
        setKey: 'EmblemOfSeveredFate',
        slotKey: 'circlet',
        level: 20,
        rarity: 5,
        mainStatKey: 'heal_',
        subStats: [{ key: 'enerRech_', value: 11.0 }],
        locked: true,
        equippedCharacterId: 'char-bennett-1',
        createdAt: new Date('2026-10-20T00:00:00.000Z'),
        updatedAt: new Date('2026-10-20T00:00:00.000Z'),
      },
      {
        id: 'art-other-character',
        accountId: 'acc-1',
        setKey: 'CrimsonWitchOfFlames',
        slotKey: 'sands',
        level: 20,
        rarity: 5,
        mainStatKey: 'atk_',
        subStats: [{ key: 'enerRech_', value: 99.0 }],
        locked: true,
        equippedCharacterId: 'char-xl-1',
        createdAt: new Date('2026-10-20T00:00:00.000Z'),
        updatedAt: new Date('2026-10-20T00:00:00.000Z'),
      },
    ];

    it('maps authenticated character, equipped artifacts, aggregated stats, and team energy context with 100% fidelity', () => {
      const input = buildAuthenticatedReadinessInput(
        mockBennett,
        mockArtifacts,
        ['Bennett', 'Xiangling', 'Xingqiu', 'KaedeharaKazuha'],
        {
          roster: [mockBennett, mockXiangling],
          targetEncounter: {
            encounterId: 'abyss_12',
            name: 'Spiral Abyss Floor 12',
            difficulty: 'abyss_12',
            minCharacterLevel: 80,
            minWeaponLevel: 80,
          },
        },
      );

      expect(characterReadinessRequestSchema.safeParse(input).success).toBe(true);
      expect(input.character.characterKey).toBe('Bennett');
      expect(input.character.level).toBe(80);
      expect(input.character.ascension).toBe(5);
      expect(input.character.constellation).toBe(5);
      expect(input.character.talents).toEqual({
        normal: 1,
        skill: 8,
        burst: 10,
      });
      expect(input.character.weapon).toEqual({
        weaponKey: 'FavoniusSword',
        level: 90,
        refinement: 5,
      });

      // Verify all 5 slots mapped and foreign character artifact was excluded
      expect(input.character.artifacts).toEqual({
        flower: {
          slot: 'flower',
          setKey: 'NoblesseOblige',
          mainStatKey: 'hp',
          level: 20,
          rarity: 5,
        },
        plume: {
          slot: 'plume',
          setKey: 'NoblesseOblige',
          mainStatKey: 'atk',
          level: 20,
          rarity: 5,
        },
        sands: {
          slot: 'sands',
          setKey: 'NoblesseOblige',
          mainStatKey: 'energyRecharge',
          level: 20,
          rarity: 5,
        },
        goblet: {
          slot: 'goblet',
          setKey: 'NoblesseOblige',
          mainStatKey: 'hpPercent',
          level: 20,
          rarity: 5,
        },
        circlet: {
          slot: 'circlet',
          setKey: 'EmblemOfSeveredFate',
          mainStatKey: 'healingBonus',
          level: 20,
          rarity: 5,
        },
      });

      // Verify stats aggregation: base 100 + 51.8 (ER Sands) + 16.2 + 18.1 + 15.5 + 11.0 = 212.6
      expect(input.character.stats?.energyRecharge).toBeCloseTo(212.6, 1);
      expect(input.character.stats?.maxHp).toBe(4780);
      expect(input.character.stats?.atk).toBe(311);
      expect(input.character.stats?.hpPercent).toBeCloseTo(46.6 + 9.9 + 14.6, 1);

      // Verify teamEnergyContext: Bennett + Xiangling = 2 Pyro (sameElementCount: 2), Bennett has FavoniusSword (favoniusWeaponCount: 1)
      expect(input.teamEnergyContext).toEqual({
        partyMembers: ['Bennett', 'Xiangling', 'Xingqiu', 'KaedeharaKazuha'],
        particlesPerRotation: 0,
        favoniusWeaponCount: 1,
        sameElementCount: 2,
        rotationLengthSeconds: 20,
      });

      // Verify downstream calculator evaluates main_stats, set_activation, and rotation_energy as ready_for_target
      const calcResult = calculateReadiness(input);
      expect(calcResult.status).toBe('ready_for_target');
      expect(calcResult.dimensions.main_stats.status).toBe('ready_for_target');
      expect(calcResult.dimensions.set_activation.status).toBe('ready_for_target');
      expect(calcResult.dimensions.rotation_energy.status).toBe('ready_for_target');
      expect(calcResult.metadata.observedEr).toBeCloseTo(212.6, 1);
    });

    it('preserves null for missing weapon, unequipped artifact slots, and unobserved stats without hallucinating defaults', () => {
      const bareCharacter: CharacterWithWeapon = {
        ...mockBennett,
        id: 'char-bare-1',
        equippedWeaponId: null,
        equippedWeapon: null,
      };

      const input = buildAuthenticatedReadinessInput(bareCharacter, []);

      expect(input.character.weapon).toBeNull();
      expect(input.character.artifacts).toEqual({
        flower: null,
        plume: null,
        sands: null,
        goblet: null,
        circlet: null,
      });
      expect(input.character.stats).toEqual({});
      expect(input.teamEnergyContext).toBeUndefined();

      const calcResult = calculateReadiness(input);
      expect(calcResult.status).toBe('insufficient_data');
      expect(calcResult.dimensions.rotation_energy.status).toBe('insufficient_data');
      expect(calcResult.dimensions.main_stats.status).toBe('insufficient_data');
    });
  });

  describe('buildShowcaseReadinessInput', () => {
    it('maps parsed Enka showcase character artifacts, stats, talents, weapon, and team energy context into CharacterReadinessRequestInput', () => {
      const parsed = parseShowcase('800000001', syntheticShowcase('800000001'));
      const rawHuTao = parsed.snapshot.characters[0]!;

      // Enrich synthetic HuTao with complete 4pc Crimson Witch of Flames artifacts to verify full readiness evaluation
      const enrichedHuTao: ShowcaseCharacterRecord = {
        ...rawHuTao,
        artifacts: [
          ...rawHuTao.artifacts,
          {
            id: 90544,
            name: 'Witchs Ever-Burning Plume',
            slot: 'Plume',
            setName: 'Crimson Witch of Flames',
            level: 20,
            rarity: 5,
            mainStat: {
              id: 'FIGHT_PROP_ATTACK',
              name: 'ATK',
              value: 311,
              formatted: '311',
            },
            stats: [],
          },
          {
            id: 90545,
            name: 'Witchs End Time',
            slot: 'Sands',
            setName: 'Crimson Witch of Flames',
            level: 20,
            rarity: 5,
            mainStat: {
              id: 'FIGHT_PROP_HP_PERCENT',
              name: 'HP%',
              value: 46.6,
              formatted: '46.6%',
            },
            stats: [],
          },
          {
            id: 90546,
            name: 'Witchs Heart Flames',
            slot: 'Goblet',
            setName: 'Crimson Witch of Flames',
            level: 20,
            rarity: 5,
            mainStat: {
              id: 'FIGHT_PROP_FIRE_ADD_HURT',
              name: 'Pyro DMG Bonus',
              value: 46.6,
              formatted: '46.6%',
            },
            stats: [],
          },
          {
            id: 90547,
            name: 'Witchs Scorching Hat',
            slot: 'Circlet',
            setName: 'Crimson Witch of Flames',
            level: 20,
            rarity: 5,
            mainStat: {
              id: 'FIGHT_PROP_CRITICAL',
              name: 'CRIT Rate',
              value: 31.1,
              formatted: '31.1%',
            },
            stats: [],
          },
        ],
      };

      const input = buildShowcaseReadinessInput(enrichedHuTao, [
        { characterKey: 'HuTao', weaponKey: 'StaffOfHoma' },
        { characterKey: 'Xingqiu', weaponKey: 'FavoniusSword' },
        { characterKey: 'Yelan', weaponKey: 'FavoniusWarbow' },
        { characterKey: 'Zhongli', weaponKey: 'BlackTassel' },
      ]);

      expect(characterReadinessRequestSchema.safeParse(input).success).toBe(true);
      expect(input.character.characterKey).toBe('HuTao');
      expect(input.character.level).toBe(80);
      expect(input.character.ascension).toBe(6);
      expect(input.character.constellation).toBe(1);
      expect(input.character.talents).toEqual({
        normal: 8,
        skill: 9,
        burst: 10,
      });
      expect(input.character.weapon).toEqual({
        weaponKey: 'StaffOfHoma',
        level: 90,
        refinement: 1,
      });

      expect(input.character.artifacts?.sands?.mainStatKey).toBe('hpPercent');
      expect(input.character.artifacts?.goblet?.mainStatKey).toBe('pyroDmg');
      expect(input.character.artifacts?.circlet?.mainStatKey).toBe('critRate');
      expect(input.character.artifacts?.flower?.setKey).toBe('CrimsonWitchOfFlames');

      // Enka fightPropMap 1.3 ratio normalized to 130% ER, Max HP 31234 preserved
      expect(input.character.stats?.energyRecharge).toBe(130);
      expect(input.character.stats?.maxHp).toBe(31234);
      expect(input.character.stats?.critRate).toBeCloseTo(73.1, 1);
      expect(input.character.stats?.critDmg).toBeCloseTo(212, 1);

      expect(input.teamEnergyContext).toEqual({
        partyMembers: ['HuTao', 'Xingqiu', 'Yelan', 'Zhongli'],
        particlesPerRotation: 0,
        favoniusWeaponCount: 2,
        sameElementCount: 1,
        rotationLengthSeconds: 20,
      });

      const calcResult = calculateReadiness(input);
      expect(calcResult.status).toBe('ready_for_target');
      expect(calcResult.dimensions.main_stats.status).toBe('ready_for_target');
      expect(calcResult.dimensions.set_activation.status).toBe('ready_for_target');
      expect(calcResult.dimensions.rotation_energy.status).toBe('ready_for_target');
      expect(calcResult.dimensions.support_output.status).toBe('ready_for_target');
    });

    it('supports showcase stats array with { key, value } objects and preserves null for omitted talents', () => {
      const partialShowcaseFurina: ShowcaseCharacterRecord = {
        key: 'Furina',
        level: 90,
        ascension: 6,
        constellation: 2,
        talents: [],
        weapon: {
          key: 'FleuveCendreFerryman',
          level: 90,
          refinement: 5,
        },
        artifacts: [
          {
            slot: 'sands',
            setName: 'Golden Troupe',
            level: 20,
            rarity: 5,
            mainStat: { key: 'er_', value: 51.8 },
          },
          {
            slot: 'goblet',
            setName: 'Golden Troupe',
            level: 20,
            rarity: 5,
            mainStat: { key: 'hp_', value: 46.6 },
          },
          {
            slot: 'circlet',
            setName: 'Golden Troupe',
            level: 20,
            rarity: 5,
            mainStat: { key: 'critRate', value: 31.1 },
          },
        ],
        stats: [
          { key: 'energyRecharge', value: 192.4 },
          { key: 'maxHp', value: 38500 },
        ],
      };

      const input = buildShowcaseReadinessInput(partialShowcaseFurina, ['Furina', 'Neuvillette']);

      expect(input.character.talents).toEqual({
        normal: null,
        skill: null,
        burst: null,
      });
      expect(input.character.stats).toEqual({
        energyRecharge: 192.4,
        maxHp: 38500,
      });
      expect(input.character.artifacts?.sands?.mainStatKey).toBe('energyRecharge');
      expect(input.character.artifacts?.goblet?.mainStatKey).toBe('hpPercent');
      expect(input.character.artifacts?.circlet?.mainStatKey).toBe('critRate');
      expect(input.teamEnergyContext?.sameElementCount).toBe(2);

      const calcResult = calculateReadiness(input);
      expect(calcResult.dimensions.main_stats.status).toBe('ready_for_target');
      expect(calcResult.dimensions.rotation_energy.status).toBe('ready_for_target');
      expect(calcResult.dimensions.talents.status).toBe('insufficient_data');
    });
  });
});
