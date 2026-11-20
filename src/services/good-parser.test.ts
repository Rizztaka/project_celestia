import { describe, it, expect } from 'vitest';
import {
  parseGOODJSON,
  mapGOODToCelestiaProfiles,
  mergeRosterProfiles,
  mergeWeapons,
  calculateDefaultAscension,
  exportToGOODJSON,
  formatWeaponKeyToName,
} from './good-parser';
import type { GOODData, OwnedCharacterProfile } from '../types/genshin';

describe('GOOD Parser Service', () => {
  const sampleGOODJson = JSON.stringify({
    format: 'GOOD',
    version: 2,
    source: 'GenshinOptimizer',
    characters: [
      {
        key: 'HuTao',
        level: 90,
        constellation: 1,
        ascension: 6,
        talent: { auto: 10, skill: 10, burst: 9 },
      },
      {
        key: 'Furina',
        level: 90,
        constellation: 2,
        ascension: 6,
        talent: { auto: 6, skill: 10, burst: 10 },
      },
      {
        key: 'Bennett',
        level: 80,
        constellation: 5,
        ascension: 5,
        talent: { auto: 1, skill: 6, burst: 9 },
      },
    ],
    weapons: [
      {
        key: 'StaffOfHoma',
        level: 90,
        refinement: 1,
        ascension: 6,
        location: 'HuTao',
        lock: true,
      },
      {
        key: 'SplendorOfTranquilWaters',
        level: 90,
        refinement: 1,
        ascension: 6,
        location: 'Furina',
        lock: true,
      },
      {
        key: 'SapwoodBlade',
        level: 90,
        refinement: 5,
        ascension: 6,
        location: 'Bennett',
        lock: true,
      },
      {
        key: 'FavoniusSword',
        level: 80,
        refinement: 3,
        location: '',
        lock: false,
      },
    ],
    artifacts: [
      {
        setKey: 'CrimsonWitchOfFlames',
        slotKey: 'flower',
        rarity: 5,
        mainStatKey: 'hp',
        level: 20,
        location: 'HuTao',
      },
      {
        setKey: 'GoldenTroupe',
        slotKey: 'flower',
        rarity: 5,
        mainStatKey: 'hp',
        level: 20,
        location: 'Furina',
      },
    ],
  });

  describe('parseGOODJSON', () => {
    it('successfully parses valid GOOD JSON', () => {
      const result = parseGOODJSON(sampleGOODJson);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.format).toBe('GOOD');
      expect(result.data?.characters?.length).toBe(3);
      expect(result.data?.weapons?.length).toBe(4);
      expect(result.data?.artifacts?.length).toBe(2);
    });

    it('rejects malformed JSON', () => {
      const result = parseGOODJSON('{ not valid json');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('rejects JSON without format: GOOD', () => {
      const result = parseGOODJSON(JSON.stringify({ someKey: 'value' }));
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not a recognized GOOD format');
    });

    it('rejects JSON without a characters array', () => {
      const result = parseGOODJSON(JSON.stringify({ format: 'GOOD', version: 1 }));
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing characters array');
    });
  });

  describe('mapGOODToCelestiaProfiles', () => {
    it('maps characters, clamps stats, and attaches equipped weapons', () => {
      const parsed = parseGOODJSON(sampleGOODJson);
      expect(parsed.data).toBeDefined();
      const mapped = mapGOODToCelestiaProfiles(parsed.data!);

      expect(mapped.summary.importedCharacters).toBe(3);
      expect(mapped.summary.importedWeapons).toBe(3); // 3 equipped to characters
      expect(mapped.rawWeapons.length).toBe(4); // 3 equipped + 1 unequipped bag weapon
      expect(mapped.rawWeapons[0].id).toBeDefined();
      expect(mapped.rawWeapons.find((w) => w.key === 'FavoniusSword')?.location).toBeUndefined();
      expect(mapped.rawArtifacts.length).toBe(2);

      // Verify Hu Tao profile
      const huTao = mapped.profiles['HuTao'];
      expect(huTao).toBeDefined();
      expect(huTao.id).toBe('HuTao');
      expect(huTao.level).toBe(90);
      expect(huTao.constellation).toBe(1);
      expect(huTao.talents?.auto).toBe(10);
      expect(huTao.weapon).toBeDefined();
      expect(huTao.weapon?.key).toBe('StaffOfHoma');
      expect(huTao.weapon?.name).toBe('Staff of Homa');
      expect(huTao.weapon?.level).toBe(90);
      expect(huTao.weapon?.refinement).toBe(1);

      // Verify Furina profile
      const furina = mapped.profiles['Furina'];
      expect(furina.constellation).toBe(2);
      expect(furina.weapon?.key).toBe('SplendorOfTranquilWaters');
    });

    it('clamps constellations between 0 and 6 and levels between 1 and 90', () => {
      const customData: GOODData = {
        format: 'GOOD',
        version: 1,
        source: 'CustomTest',
        characters: [
          { key: 'Nefer', level: 120, constellation: 10 },
          { key: 'Mavuika', level: 0, constellation: -2 },
        ],
      };
      const mapped = mapGOODToCelestiaProfiles(customData);
      expect(mapped.profiles['Nefer'].level).toBe(90);
      expect(mapped.profiles['Nefer'].constellation).toBe(6);
      expect(mapped.profiles['Mavuika'].level).toBe(1);
      expect(mapped.profiles['Mavuika'].constellation).toBe(0);
    });

    it('sanitizes imported artifacts, rejecting corrupted pieces and retaining valid ones', () => {
      const dataWithArtifacts: GOODData = {
        format: 'GOOD',
        version: 2,
        source: 'SanitizationTest',
        characters: [{ key: 'HuTao', level: 90, constellation: 0 }],
        artifacts: [
          // 1. Valid +20 5★ piece with 9 rolls
          {
            slotKey: 'flower',
            setKey: 'CrimsonWitchOfFlames',
            rarity: 5,
            level: 20,
            mainStatKey: 'hp',
            substats: [
              { key: 'critRate_', value: 7.0 },
              { key: 'critDMG_', value: 14.0 },
              { key: 'atk_', value: 9.9 },
              { key: 'enerRech_', value: 11.0 },
            ],
            location: 'HuTao',
          },
          // 2. Corrupted: impossible main stat on sands (critRate_)
          {
            slotKey: 'sands',
            setKey: 'CrimsonWitchOfFlames',
            rarity: 5,
            level: 20,
            mainStatKey: 'critRate_',
            substats: [
              { key: 'critDMG_', value: 14.0 },
              { key: 'atk_', value: 9.9 },
              { key: 'enerRech_', value: 11.0 },
              { key: 'hp_', value: 5.8 },
            ],
            location: 'HuTao',
          },
          // 3. Corrupted: duplicate substat (two critRate_)
          {
            slotKey: 'goblet',
            setKey: 'CrimsonWitchOfFlames',
            rarity: 5,
            level: 20,
            mainStatKey: 'pyro_dmg_',
            substats: [
              { key: 'critRate_', value: 3.5 },
              { key: 'critRate_', value: 3.9 },
              { key: 'atk_', value: 9.9 },
              { key: 'enerRech_', value: 11.0 },
            ],
            location: 'HuTao',
          },
          // 4. Corrupted: substat matches main stat (atk_ on atk_ sands)
          {
            slotKey: 'sands',
            setKey: 'CrimsonWitchOfFlames',
            rarity: 5,
            level: 20,
            mainStatKey: 'atk_',
            substats: [
              { key: 'atk_', value: 5.8 },
              { key: 'critDMG_', value: 14.0 },
              { key: 'critRate_', value: 3.9 },
              { key: 'enerRech_', value: 11.0 },
            ],
            location: 'HuTao',
          },
          // 5. Corrupted: invalid slotKey ('boots')
          {
            slotKey: 'boots',
            setKey: 'CrimsonWitchOfFlames',
            rarity: 5,
            level: 20,
            mainStatKey: 'hp',
            location: 'HuTao',
          },
        ],
      };

      const mapped = mapGOODToCelestiaProfiles(dataWithArtifacts);
      // Exactly 1 valid artifact preserved; all 4 corrupted pieces filtered out
      expect(mapped.rawArtifacts).toHaveLength(1);
      expect(mapped.rawArtifacts[0].slotKey).toBe('flower');
      expect(mapped.summary.importedArtifacts).toBe(1);
    });
  });

  describe('mergeRosterProfiles', () => {
    const existing: Record<string, OwnedCharacterProfile> = {
      Xiangling: { id: 'Xiangling', level: 80, constellation: 4 },
      Bennett: { id: 'Bennett', level: 70, constellation: 1 },
    };

    const incoming: Record<string, OwnedCharacterProfile> = {
      Bennett: { id: 'Bennett', level: 90, constellation: 5 },
      Furina: { id: 'Furina', level: 90, constellation: 2 },
    };

    it('preserves existing non-conflicting characters when overwriteAll is false', () => {
      const merged = mergeRosterProfiles(existing, incoming, false);
      expect(Object.keys(merged)).toHaveLength(3);
      expect(merged['Xiangling'].level).toBe(80); // Preserved
      expect(merged['Bennett'].level).toBe(90); // Updated
      expect(merged['Bennett'].constellation).toBe(5); // Updated
      expect(merged['Furina']).toBeDefined(); // Added
    });

    it('wipes non-imported characters when overwriteAll is true', () => {
      const merged = mergeRosterProfiles(existing, incoming, true);
      expect(Object.keys(merged)).toHaveLength(2);
      expect(merged['Xiangling']).toBeUndefined(); // Wiped
      expect(merged['Bennett'].level).toBe(90);
      expect(merged['Furina'].level).toBe(90);
    });
  });

  describe('exportToGOODJSON', () => {
    it('produces round-trip valid GOOD JSON', () => {
      const profiles: Record<string, OwnedCharacterProfile> = {
        HuTao: {
          id: 'HuTao',
          level: 90,
          constellation: 1,
          talents: { auto: 10, skill: 10, burst: 9 },
          weapon: {
            name: 'Staff of Homa',
            key: 'StaffOfHoma',
            level: 90,
            refinement: 1,
          },
        },
      };

      const exportedStr = exportToGOODJSON(profiles, [{ dummy: 'artifact' }]);
      const reparsed = parseGOODJSON(exportedStr);
      expect(reparsed.success).toBe(true);
      expect(reparsed.data?.format).toBe('GOOD');
      expect(reparsed.data?.characters?.[0].key).toBe('HuTao');
      expect(reparsed.data?.characters?.[0].constellation).toBe(1);
      expect(reparsed.data?.weapons?.[0].key).toBe('StaffOfHoma');
      expect(reparsed.data?.weapons?.[0].location).toBe('HuTao');
      expect(reparsed.data?.artifacts?.length).toBe(1);
    });

    it('serializes full rawWeapons bag when provided', () => {
      const profiles: Record<string, OwnedCharacterProfile> = {
        HuTao: {
          id: 'HuTao',
          level: 90,
          constellation: 1,
        },
      };

      const rawWeapons = [
        {
          id: 'w_1',
          key: 'StaffOfHoma',
          name: 'Staff of Homa',
          level: 90,
          refinement: 1,
          location: 'HuTao',
        },
        {
          id: 'w_2',
          key: 'FavoniusLance',
          name: 'Favonius Lance',
          level: 80,
          refinement: 5,
          location: '',
        },
      ];

      const exportedStr = exportToGOODJSON(profiles, [], rawWeapons);
      const reparsed = parseGOODJSON(exportedStr);
      expect(reparsed.success).toBe(true);
      expect(reparsed.data?.weapons?.length).toBe(2);
      expect(reparsed.data?.weapons?.[1].key).toBe('FavoniusLance');
      expect(reparsed.data?.weapons?.[1].refinement).toBe(5);
      // Valid default ascension populated
      expect(reparsed.data?.weapons?.[0].ascension).toBe(6);
      expect(reparsed.data?.weapons?.[1].ascension).toBe(5);
    });
  });

  describe('calculateDefaultAscension', () => {
    it('calculates correct ascension phases for various levels', () => {
      expect(calculateDefaultAscension(90)).toBe(6);
      expect(calculateDefaultAscension(85)).toBe(6);
      expect(calculateDefaultAscension(80)).toBe(5);
      expect(calculateDefaultAscension(70)).toBe(4);
      expect(calculateDefaultAscension(60)).toBe(3);
      expect(calculateDefaultAscension(50)).toBe(2);
      expect(calculateDefaultAscension(20)).toBe(0);
      expect(calculateDefaultAscension(1)).toBe(0);
    });
  });

  describe('mergeWeapons', () => {
    it('preserves existing weapons when overwriteAll is false', () => {
      const existing = [
        {
          id: 'w_existing_1',
          key: 'StaffOfHoma',
          name: 'Staff of Homa',
          level: 90,
          refinement: 1,
          location: 'HuTao',
        },
      ];
      const incoming = [
        {
          id: 'w_incoming_2',
          key: 'TheCatch',
          name: 'The Catch',
          level: 90,
          refinement: 5,
          location: 'Xiangling',
        },
      ];

      const merged = mergeWeapons(existing, incoming, false);
      expect(merged.length).toBe(2);
      expect(merged.map((w) => w.key)).toContain('StaffOfHoma');
      expect(merged.map((w) => w.key)).toContain('TheCatch');
    });

    it('overwrites all weapons when overwriteAll is true', () => {
      const existing = [
        {
          id: 'w_existing_1',
          key: 'StaffOfHoma',
          name: 'Staff of Homa',
          level: 90,
          refinement: 1,
        },
      ];
      const incoming = [
        {
          id: 'w_incoming_2',
          key: 'TheCatch',
          name: 'The Catch',
          level: 90,
          refinement: 5,
        },
      ];

      const overwritten = mergeWeapons(existing, incoming, true);
      expect(overwritten.length).toBe(1);
      expect(overwritten[0].key).toBe('TheCatch');
    });
  });

  describe('formatWeaponKeyToName', () => {
    it('turns PascalCase weapon keys into spaced names', () => {
      expect(formatWeaponKeyToName('StaffOfHoma')).toBe('Staff of Homa');
      expect(formatWeaponKeyToName('SplendorOfTranquilWaters')).toBe('Splendor of Tranquil Waters');
      expect(formatWeaponKeyToName('FavoniusSword')).toBe('Favonius Sword');
    });
  });
});
