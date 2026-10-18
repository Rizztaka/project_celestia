import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

import { characterElements, collectibleCharacterCount } from './character-reference.js';
import { materialConversionGroups } from './material-conversion.js';
import { progressionCatalog } from './progression-catalog.js';

const require = createRequire(import.meta.url);
const profiles = require('../static/character-profiles.json');
const weaponTypes = require('../static/character-weapon-types.json');
const weights = require('../static/artifact-stat-weights.json');
const weekly = require('../static/weekly-bosses.json').bosses;
const world = require('../static/world-bosses.json').bosses;
const targets = require('../../../../../web/src/lib/progression-targets.json');
const catalog = progressionCatalog.data;

describe('Sourced catalog parity and macro planning anchors', () => {
  it('covers every supported goal in both clients and descriptive character references', () => {
    expect(targets.characters.map((target: { key: string }) => target.key)).toEqual(
      Object.keys(catalog.characters),
    );
    expect(targets.weapons.map((target: { key: string }) => target.key)).toEqual(
      Object.keys(catalog.weapons),
    );
    for (const character of Object.values(catalog.characters)) {
      expect(profiles[character.key]).toMatchObject({ gameId: character.gameId });
      expect(characterElements[character.key]).toBeDefined();
      expect(weaponTypes[character.key]).toMatch(/^(Sword|Claymore|Polearm|Bow|Catalyst)$/);
    }
    expect(collectibleCharacterCount).toBe(122);
    expect(Object.keys(catalog.characters)).toHaveLength(129);
    expect(catalog.excludedTargets.filter((entry) => /manekin/.test(entry.file))).toHaveLength(2);
    expect(profiles.Manekin.recommendationBasis).toBe('unavailable');
    expect(profiles.Mavuika.metaTier).toBeUndefined();
    expect(profiles.Mavuika.weaponType).toBe('Claymore');
    expect(characterElements.Kazuha).toBe('Anemo');
    expect(characterElements.Ushi).toBeUndefined();
  });
  it('provides all requested Natlan characters and canonical final-ascension costs', () => {
    for (const key of [
      'Mualani',
      'Kinich',
      'Kachina',
      'Xilonen',
      'Chasca',
      'Mavuika',
      'Citlali',
      'Iansan',
      'Varesa',
      'Ifa',
    ])
      expect(catalog.characters[key]?.talent).toHaveLength(9);
    expect(catalog.characters.Mavuika?.ascension.at(-1)?.costs).toMatchObject({
      GoldInscribedSecretSourceCore: 20,
      WitheringPurpurbloom: 60,
      Mora: 120000,
    });
    expect(catalog.characters.TravelerPyro?.talent).toEqual([]);
    expect(catalog.characters.TravelerPyro?.ascension).toEqual(
      catalog.characters.Aether?.ascension,
    );
  });
  it('joins Fontaine and Natlan rotations with every tier and Sunday access', () => {
    for (const [key, days] of [
      ['TeachingsOfContention', [0, 3, 6]],
      ['TeachingsOfKindling', [1, 4, 6]],
      ['TeachingsOfConflict', [2, 5, 6]],
      ['TeachingsOfEquity', [0, 3, 6]],
      ['TeachingsOfJustice', [1, 4, 6]],
      ['TeachingsOfOrder', [2, 5, 6]],
    ] as const) {
      const domain = catalog.domains[catalog.materials[key]!.domainKey!]!;
      expect(domain.days).toEqual(days);
      expect(domain.dropKeys).toHaveLength(3);
    }
    for (const domain of Object.values(catalog.domains)) expect(domain.days).toContain(6);
  });
  it('retains the five actionable anchors and excludes non-progression clutter', () => {
    const categories = new Set<string>(
      Object.values(catalog.materials).map((material) => material.category),
    );
    for (const category of [
      'talent_book',
      'weapon_material',
      'weekly_boss',
      'world_boss',
      'local_specialty',
    ])
      expect(categories.has(category)).toBe(true);
    for (const key of ['Mint', 'SweetFlower', 'PineWood', 'RedDye', 'Fowl', 'SweetMadame'])
      expect(catalog.materials[key]).toBeUndefined();
    expect(catalog.materials.Mora?.category).toBe('progression_support');
    expect(catalog.materials.QuenepaBerry?.category).toBe('local_specialty');
    expect(catalog.materials.OverripeFlamegranate?.category).toBe('world_boss');
  });
  it('uses real boss drops and removes the fictional placeholder bosses', () => {
    expect(weekly.find((boss: { key: string }) => boss.key === 'Dvalin').dropKeys).toEqual([
      'DvalinsPlume',
      'DvalinsClaw',
      'DvalinsSigh',
    ]);
    expect(weekly.find((boss: { key: string }) => boss.key === 'TheKnave')).toMatchObject({
      location: 'Fontaine',
      domainName: 'Scattered Ruins',
      dropKeys: ['FadingCandle', 'SilkenFeather', 'DenialAndJudgment'],
    });
    expect(
      weekly.some((boss: { key: string }) =>
        ['Beisht', 'Chlothar', 'BabyLizard'].includes(boss.key),
      ),
    ).toBe(false);
    for (const [bosses, category] of [
      [weekly, 'weekly_boss'],
      [world, 'world_boss'],
    ] as const)
      for (const boss of bosses)
        for (const key of boss.dropKeys) expect(catalog.materials[key]?.category).toBe(category);
  });
  it('includes every artifact set without converting conditional set effects into stat weights', () => {
    expect(targets.artifactSets).toHaveLength(63);
    for (const key of [
      'ObsidianCodex',
      'ScrollOfTheHeroOfCinderCity',
      'FragmentOfHarmonicWhimsy',
      'UnfinishedReverie',
    ])
      expect(weights._sets[key]).toMatchObject({
        key,
        rarities: [4, 5],
        effect2Pc: expect.any(String),
        effect4Pc: expect.any(String),
      });
    expect(weights._sets.ObsidianCodex.effect4Pc).toContain('40%');
    expect(weights._sets.ObsidianCodex.subStatWeights).toBeUndefined();
  });
  it('rejects cyclic or missing sourced crafting joins', () => {
    expect(() =>
      materialConversionGroups({ ...catalog, conversionGroups: [['Mora', 'Absent']] }),
    ).toThrow(/Invalid/);
    expect(() =>
      materialConversionGroups({
        ...catalog,
        conversionGroups: [
          ['TeachingsOfDiligence', 'GuideToDiligence'],
          ['GuideToDiligence', 'TeachingsOfDiligence'],
        ],
      }),
    ).toThrow(/Cyclic/);
  });
});
