import { describe, it, expect } from 'vitest';
import genshindb from 'genshin-db';
import { CHARACTERS } from './characters';

describe('Rich Character Database Verification', () => {
  it('contains all 122 playable characters through Version 7.2 with full data', () => {
    expect(CHARACTERS.length).toBeGreaterThanOrEqual(122);
  });

  it('includes Version 7.2 Snezhnaya characters Mitya and Valeriy with complete data', () => {
    const snezhnaya72 = ['Mitya', 'Valeriy'];
    for (const key of snezhnaya72) {
      const char = CHARACTERS.find((c) => c.id === key);
      expect(char, `Missing 7.2 character ${key}`).toBeDefined();
      expect(char?.name).toBeTruthy();
      expect(char?.element).toBe('Electro');
      expect(char?.stats?.hp).toBeGreaterThan(0);
      expect(char?.talents?.length).toBeGreaterThanOrEqual(5);
      expect(char?.constellations?.length).toBe(6);
      expect(char?.build?.weapons.length).toBeGreaterThanOrEqual(2);
      expect(char?.build?.artifacts.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('includes key meta & latest characters: Nefer, Mavuika, Xilonen, Citlali, Furina', () => {
    const requiredKeys = ['Nefer', 'Mavuika', 'Xilonen', 'Citlali', 'Furina'];
    for (const key of requiredKeys) {
      const char = CHARACTERS.find((c) => c.id === key);
      expect(char, `Missing character ${key}`).toBeDefined();
      expect(char?.name).toBeTruthy();
      expect(char?.element).toBeTruthy();
      expect(char?.weapon).toBeTruthy();
    }
  });

  it('includes newly supported future & milestone characters: Skirk, Columbina, Varka, Durin, Escoffier', () => {
    const milestoneKeys = ['Skirk', 'Columbina', 'Varka', 'Durin', 'Escoffier', 'Ifa', 'Dahlia', 'Ineffa'];
    for (const key of milestoneKeys) {
      const char = CHARACTERS.find((c) => c.id === key);
      expect(char, `Missing character ${key}`).toBeDefined();
      expect(char?.name).toBeTruthy();
      expect(char?.element).toBeTruthy();
      expect(char?.weapon).toBeTruthy();
      expect(char?.stats).toBeDefined();
      expect(char?.talents?.length).toBeGreaterThanOrEqual(5);
      expect(char?.constellations?.length).toBe(6);
    }
  });

  it('provides public Enka CDN image URLs for all characters', () => {
    for (const char of CHARACTERS) {
      expect(char.icon, `Missing icon for ${char.name}`).toBeDefined();
      expect(char.icon).toMatch(/^https:\/\/enka\.network\/ui\/UI_AvatarIcon_[A-Za-z0-9_]+\.png$/);
    }
  });

  it('provides complete level 90 base attributes and ascension stats', () => {
    for (const char of CHARACTERS) {
      expect(char.stats, `Missing stats for ${char.name}`).toBeDefined();
      expect(char.stats?.hp).toBeGreaterThan(0);
      expect(char.stats?.attack).toBeGreaterThan(0);
      expect(char.stats?.defense).toBeGreaterThan(0);
      expect(char.stats?.specializedStat).toBeTruthy();
      expect(char.stats?.specializedValue).toBeTruthy();
    }
  });

  it('provides full combat talents and passives with non-empty names and descriptions', () => {
    for (const char of CHARACTERS) {
      expect(char.talents, `Missing talents for ${char.name}`).toBeDefined();
      expect(char.talents?.length).toBeGreaterThanOrEqual(5);

      const types = char.talents?.map((t) => t.type);
      expect(types).toContain('normal');
      expect(types).toContain('skill');
      expect(types).toContain('burst');
      expect(types).toContain('passive');

      for (const t of char.talents || []) {
        expect(t.name, `Empty talent name in ${char.name}`).toBeTruthy();
        expect(t.description.length, `Empty talent description in ${char.name}`).toBeGreaterThan(0);
        if (t.icon) {
          expect(t.icon).toMatch(/^https:\/\/enka\.network\/ui\/.+\.png$/);
        }
      }
    }
  });

  it('provides full constellations C1 through C6 with descriptions and CDN icons', () => {
    for (const char of CHARACTERS) {
      expect(char.constellations, `Missing constellations for ${char.name}`).toBeDefined();
      expect(char.constellations?.length).toBe(6);

      const levels = char.constellations?.map((c) => c.level);
      expect(levels).toEqual([1, 2, 3, 4, 5, 6]);

      for (const c of char.constellations || []) {
        expect(c.name, `Empty const name in ${char.name}`).toBeTruthy();
        expect(c.description.length, `Empty const description in ${char.name}`).toBeGreaterThan(0);
        if (c.icon) {
          expect(c.icon).toMatch(/^https:\/\/enka\.network\/ui\/.+\.png$/);
        }
      }
    }
  });

  it('provides recommended builds with weapons, artifacts, and stat priorities', () => {
    for (const char of CHARACTERS) {
      expect(char.build, `Missing build for ${char.name}`).toBeDefined();
      expect(char.build?.weapons.length).toBeGreaterThanOrEqual(2);
      expect(char.build?.artifacts.length).toBeGreaterThanOrEqual(1);

      // Verify weapon structure
      for (const w of char.build?.weapons || []) {
        expect(w.name).toBeTruthy();
        expect(w.rarity).toBeGreaterThanOrEqual(3);
        expect(w.rarity).toBeLessThanOrEqual(5);
        expect(w.reason).toBeTruthy();
      }

      // Verify artifact structure
      for (const a of char.build?.artifacts || []) {
        expect(a.name).toBeTruthy();
        expect([2, 4]).toContain(a.pieces);
        expect(a.reason).toBeTruthy();
      }

      // Verify main stats
      expect(char.build?.mainStats?.sands.length).toBeGreaterThan(0);
      expect(char.build?.mainStats?.goblet.length).toBeGreaterThan(0);
      expect(char.build?.mainStats?.circlet.length).toBeGreaterThan(0);
      expect(char.build?.subStats?.length).toBeGreaterThan(0);
    }
  });

  it('verifies Nefer specifics for Lunar-Bloom archetype', () => {
    const nefer = CHARACTERS.find((c) => c.id === 'Nefer');
    expect(nefer).toBeDefined();
    expect(nefer?.element).toBe('Dendro');
    expect(nefer?.weapon).toBe('Catalyst');
    expect(nefer?.rarity).toBe(5);
    expect(nefer?.tags).toContain('Lunar-Bloom');
    expect(nefer?.tags).toContain('Nod-Krai');
    expect(nefer?.build?.artifacts.some((a) => a.name.includes('Silken Moon'))).toBe(true);
  });

  it('verifies Furina specifics for Fanfare and universal buffering', () => {
    const furina = CHARACTERS.find((c) => c.id === 'Furina');
    expect(furina).toBeDefined();
    expect(furina?.element).toBe('Hydro');
    expect(furina?.weapon).toBe('Sword');
    expect(furina?.rarity).toBe(5);
    expect(furina?.tags).toContain('Universal-Buffer');
    expect(furina?.tags).toContain('Fanfare');
    expect(furina?.build?.artifacts.some((a) => a.name.includes('Golden Troupe'))).toBe(true);
  });

  it('verifies KQM authoritative builds for key elemental carries and staples', () => {
    // Xiangling
    const xiangling = CHARACTERS.find((c) => c.id === 'Xiangling');
    expect(xiangling?.build?.weapons.some((w) => w.name === '"The Catch"' || w.name === 'The Catch')).toBe(true);
    expect(xiangling?.build?.artifacts.some((a) => a.name === 'Emblem of Severed Fate')).toBe(true);
    expect(xiangling?.build?.subStats?.some((s) => s.includes('Energy Recharge'))).toBe(true);

    // Xingqiu
    const xingqiu = CHARACTERS.find((c) => c.id === 'Xingqiu');
    expect(xingqiu?.build?.weapons.some((w) => w.name === 'Sacrificial Sword')).toBe(true);
    expect(xingqiu?.build?.artifacts.some((a) => a.name === 'Emblem of Severed Fate')).toBe(true);

    // Alhaitham
    const alhaitham = CHARACTERS.find((c) => c.id === 'Alhaitham');
    expect(alhaitham?.build?.weapons.some((w) => w.name === 'Light of Foliar Incision')).toBe(true);
    expect(alhaitham?.build?.artifacts.some((a) => a.name === 'Gilded Dreams')).toBe(true);

    // Kamisato Ayaka
    const ayaka = CHARACTERS.find((c) => c.id === 'KamisatoAyaka');
    expect(ayaka?.build?.weapons.some((w) => w.name === 'Mistsplitter Reforged')).toBe(true);
    expect(ayaka?.build?.artifacts.some((a) => a.name === 'Blizzard Strayer')).toBe(true);

    // Navia
    const navia = CHARACTERS.find((c) => c.id === 'Navia');
    expect(navia?.build?.weapons.some((w) => w.name === 'Verdict')).toBe(true);
    expect(navia?.build?.artifacts.some((a) => a.name.includes('Nighttime Whispers'))).toBe(true);
  });

  it('guarantees 100% weapon type matching for every recommended weapon across all characters', () => {
    const mismatches: { char: string; charWeapon: string; weapon: string; weaponType: string }[] = [];
    for (const char of CHARACTERS) {
      for (const w of char.build?.weapons || []) {
        const gw = genshindb.weapons(w.name);
        if (gw && gw.weaponText && gw.weaponText !== char.weapon) {
          mismatches.push({
            char: char.name,
            charWeapon: char.weapon,
            weapon: w.name,
            weaponType: gw.weaponText
          });
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('guarantees all recommended weapons resolve against WEAPONS_DATA with exact rarity and weaponType match', async () => {
    const { getWeaponByKey } = await import('./weapons');
    const errors: string[] = [];

    for (const char of CHARACTERS) {
      for (const w of char.build?.weapons || []) {
        const canonical = getWeaponByKey(w.name);
        if (!canonical) {
          errors.push(`[${char.name}] Cannot resolve weapon "${w.name}"`);
          continue;
        }
        if (canonical.name !== w.name) {
          errors.push(`[${char.name}] w.name: "${w.name}" !== canonical.name: "${canonical.name}"`);
        }
        if (canonical.rarity !== w.rarity) {
          errors.push(`[${char.name}] Weapon "${w.name}" rarity mismatch: build has ${w.rarity}★, canonical WEAPONS_DATA has ${canonical.rarity}★`);
        }
        if (canonical.weaponType !== char.weapon) {
          errors.push(`[${char.name}] Weapon "${w.name}" (${canonical.weaponType}) does not match character weapon (${char.weapon})`);
        }
      }
    }

    expect(errors).toEqual([]);
  });

  it('verifies Arlecchino build recommends Primordial Jade Winged-Spear with 5★ rarity', async () => {
    const { getWeaponByKey } = await import('./weapons');
    const arlecchino = CHARACTERS.find((c) => c.id === 'Arlecchino');
    expect(arlecchino).toBeDefined();

    const pjws = arlecchino?.build?.weapons.find((w) => w.name === 'Primordial Jade Winged-Spear');
    expect(pjws, 'Arlecchino build must include Primordial Jade Winged-Spear').toBeDefined();
    expect(pjws?.rarity, 'PJWS in Arlecchino build must be 5★').toBe(5);

    const canonicalPjws = getWeaponByKey('PrimordialJadeWingedSpear');
    expect(canonicalPjws).toBeDefined();
    expect(canonicalPjws?.rarity).toBe(5);
    expect(canonicalPjws?.weaponType).toBe('Polearm');
  });

  it('resolves weapons with escaped, curved, or stripped quotes via getWeaponByKey and getWeaponByName', async () => {
    const { getWeaponByKey, getWeaponByName } = await import('./weapons');

    // "The Catch"
    const catchVariants = [
      'The Catch',
      '"The Catch"',
      '\"The Catch\"',
      '“The Catch”',
      'the catch',
      'TheCatch',
    ];
    for (const v of catchVariants) {
      const w1 = getWeaponByKey(v);
      const w2 = getWeaponByName(v);
      expect(w1, `Failed to resolve The Catch variant "${v}" via getWeaponByKey`).toBeDefined();
      expect(w2, `Failed to resolve The Catch variant "${v}" via getWeaponByName`).toBeDefined();
      expect(w1?.key).toBe('TheCatch');
      expect(w1?.rarity).toBe(4);
      expect(w1?.weaponType).toBe('Polearm');
    }

    // "Ultimate Overlord's Mega Magic Sword"
    const overlordVariants = [
      "Ultimate Overlord's Mega Magic Sword",
      "\"Ultimate Overlord's Mega Magic Sword\"",
      '“Ultimate Overlord\'s Mega Magic Sword”',
      'UltimateOverlordSMegaMagicSword',
    ];
    for (const v of overlordVariants) {
      const w1 = getWeaponByKey(v);
      const w2 = getWeaponByName(v);
      expect(w1, `Failed to resolve Overlord variant "${v}" via getWeaponByKey`).toBeDefined();
      expect(w2, `Failed to resolve Overlord variant "${v}" via getWeaponByName`).toBeDefined();
      expect(w1?.key).toBe('UltimateOverlordSMegaMagicSword');
      expect(w1?.rarity).toBe(4);
      expect(w1?.weaponType).toBe('Claymore');
    }

    // PJWS alias and key
    expect(getWeaponByKey('pjws')?.key).toBe('PrimordialJadeWingedSpear');
    expect(getWeaponByKey('Primordial Jade Winged-Spear')?.rarity).toBe(5);
  });

  it('guarantees weapon rarity resolver correctly assigns 5★ to PJWS when rarity is undefined or defaulted', async () => {
    const { getWeaponByKey } = await import('./weapons');
    const resolveDisplayRarity = (w: { key?: string; name?: string; rarity?: number }) =>
      (w.key ? getWeaponByKey(w.key)?.rarity : undefined) ||
      (w.name ? getWeaponByKey(w.name)?.rarity : undefined) ||
      w.rarity ||
      4;

    // Case 1: Weapon with key only and no rarity
    expect(resolveDisplayRarity({ key: 'PrimordialJadeWingedSpear' })).toBe(5);

    // Case 2: Weapon with name only and no rarity
    expect(resolveDisplayRarity({ name: 'Primordial Jade Winged-Spear' })).toBe(5);

    // Case 3: Weapon with corrupted/defaulted 4★ rarity but canonical 5★
    expect(resolveDisplayRarity({ key: 'PrimordialJadeWingedSpear', rarity: 4 })).toBe(5);

    // Case 4: Staff of Homa missing rarity
    expect(resolveDisplayRarity({ key: 'StaffOfHoma' })).toBe(5);

    // Case 5: 4★ weapon correctly stays 4★
    expect(resolveDisplayRarity({ key: 'TheCatch' })).toBe(4);

    // Case 6: 3★ weapon correctly stays 3★
    expect(resolveDisplayRarity({ key: 'WhiteTassel' })).toBe(3);
  });

  it('safely handles non-string and falsy arguments in getWeaponByKey and normalizeWeaponKey', async () => {
    const { getWeaponByKey, getWeaponByName, normalizeWeaponKey } = await import('./weapons');

    // getWeaponByKey non-string guards
    expect(getWeaponByKey('' as any)).toBeUndefined();
    expect(getWeaponByKey(null as any)).toBeUndefined();
    expect(getWeaponByKey(undefined as any)).toBeUndefined();
    expect(getWeaponByKey(12345 as any)).toBeUndefined();
    expect(getWeaponByKey({} as any)).toBeUndefined();
    expect(getWeaponByKey([] as any)).toBeUndefined();
    expect(getWeaponByKey(true as any)).toBeUndefined();

    // getWeaponByName non-string guards
    expect(getWeaponByName(null as any)).toBeUndefined();
    expect(getWeaponByName(undefined as any)).toBeUndefined();
    expect(getWeaponByName(42 as any)).toBeUndefined();

    // normalizeWeaponKey non-string guards
    expect(normalizeWeaponKey('' as any)).toBe('');
    expect(normalizeWeaponKey(null as any)).toBe('');
    expect(normalizeWeaponKey(undefined as any)).toBe('');
    expect(normalizeWeaponKey(999 as any)).toBe('');
    expect(normalizeWeaponKey({ key: 'test' } as any)).toBe('');
    expect(normalizeWeaponKey([1, 2] as any)).toBe('');
  });
});
