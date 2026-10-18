import { describe, expect, it } from 'vitest';

import evidence from '../static/catalog-evidence.json' with { type: 'json' };
import characters from '../static/character-materials.json' with { type: 'json' };
import references from '../static/material-references.json' with { type: 'json' };
import weapons from '../static/weapon-materials.json' with { type: 'json' };
import { GenshinCatalogTrust, stableFingerprint } from './catalog-trust.js';
import { GenshinCompanionProvider } from './genshin-companion.provider.js';

const goal = {
  id: 'talent',
  targetKey: 'HuTao',
  goalType: 'CHARACTER_TALENT',
  fromPhase: 1,
  toPhase: 6,
  talentType: 'normal',
};
function fixture() {
  return {
    characters: structuredClone(characters),
    weapons: structuredClone(weapons),
    references: structuredClone(references),
    domains: {} as Record<string, unknown>,
    manifest: structuredClone(evidence),
  };
}
describe('C2b source-bound catalog', () => {
  it.each([
    ['ascension'],
    ['talent.book'],
    [...evidence[0]!.fields, 'unreviewed.extra'],
    evidence[0]!.fields.map((field) =>
      field === 'materials.commonT2' ? 'materials.commonT1' : field,
    ),
    evidence[0]!.fields.map((field) =>
      field === 'talent.costs[tier=2..6]' ? 'talent.costs[tier=2..5]' : field,
    ),
  ])('rejects false field coverage %j even with the correct content fingerprint', (...fields) => {
    const input = fixture();
    input.manifest[0]!.fields = fields;
    expect(new GenshinCatalogTrust(input).getAdvice(goal)).toMatchObject({
      available: false,
      reason: expect.stringContaining('field coverage'),
    });
  });
  it('rejects invalid talent claim bounds and ambiguous overlapping evidence', () => {
    const input = fixture();
    input.manifest[0]!.from = 0;
    expect(new GenshinCatalogTrust(input).getAdvice(goal).available).toBe(false);
    const ambiguous = fixture();
    ambiguous.manifest.push(structuredClone(ambiguous.manifest[0]!));
    expect(new GenshinCatalogTrust(ambiguous).getAdvice(goal)).toMatchObject({
      available: false,
      reason: expect.stringContaining('Ambiguous'),
    });
  });
  // Expected counts were transcribed independently from the saved official requests, not the catalog.
  it('has a sourced single talent step including Mora and canonical material keys', () => {
    expect(new GenshinCatalogTrust(fixture()).getAdvice({ ...goal, toPhase: 2 })).toMatchObject({
      available: true,
      costs: { TeachingsOfDiligence: 3, WhopperflowerNectar: 6, Mora: 12500 },
    });
  });
  it.each(['normal', 'skill', 'burst'])(
    'has independently sourced level 1–6 totals for %s',
    (talentType) => {
      const result = new GenshinCatalogTrust(fixture()).getAdvice({ ...goal, talentType });
      expect(result).toMatchObject({
        available: true,
        costs: {
          TeachingsOfDiligence: 3,
          GuideToDiligence: 21,
          WhopperflowerNectar: 6,
          ShimmeringNectar: 22,
          Mora: 122500,
        },
        route: { available: false },
      });
    },
  );
  it.each([0, -1, 1.5, 6, 7])(
    'preserves an unsupported starting level %s as unavailable',
    (fromPhase) => {
      expect(new GenshinCatalogTrust(fixture()).getAdvice({ ...goal, fromPhase })).toMatchObject({
        available: false,
        reason: expect.stringContaining('range'),
      });
    },
  );
  it.each(['StaffOfHoma', 'UnknownCharacter', '_comment'])(
    'does not promote candidate/metadata target %s',
    (targetKey) => {
      expect(new GenshinCatalogTrust(fixture()).getAdvice({ ...goal, targetKey })).toMatchObject({
        available: false,
      });
    },
  );
  it.each(Object.keys(characters).filter((key) => !key.startsWith('_')))(
    'supports full local character ranges for %s with explicit owner attribution',
    (targetKey) => {
      const trust = new GenshinCatalogTrust(fixture());
      for (const talentType of ['normal', 'skill', 'burst']) {
        expect(trust.getAdvice({ ...goal, targetKey, talentType, toPhase: 10 })).toMatchObject({
          available: true,
          sources: [{ authority: 'owner' }],
        });
        for (let fromPhase = 1; fromPhase < 10; fromPhase++)
          expect(
            trust.getAdvice({ ...goal, targetKey, talentType, fromPhase, toPhase: 10 }).available,
          ).toBe(true);
      }
      for (let fromPhase = 0; fromPhase < 6; fromPhase++)
        expect(
          trust.getAdvice({
            ...goal,
            targetKey,
            goalType: 'CHARACTER_ASCENSION',
            talentType: null,
            fromPhase,
            toPhase: 6,
          }).available,
        ).toBe(true);
    },
  );
  it('computes the cumulative delta for high talent levels including weekly drops and crowns', () => {
    expect(
      new GenshinCatalogTrust(fixture()).getAdvice({ ...goal, fromPhase: 8, toPhase: 10 }),
    ).toMatchObject({
      available: true,
      costs: {
        PhilosophiesOfDiligence: 28,
        EnergyNectar: 21,
        ShardOfFoulLegacy: 4,
        CrownOfInsight: 1,
        Mora: 1150000,
      },
    });
    expect(
      new GenshinCatalogTrust(fixture()).getAdvice({
        ...goal,
        goalType: 'CHARACTER_ASCENSION',
        talentType: null,
        fromPhase: 5,
        toPhase: 6,
      }),
    ).toMatchObject({
      available: true,
      costs: {
        AgnidusAgateGemstone: 6,
        JuvenileJade: 20,
        SilkFlower: 60,
        EnergyNectar: 24,
        Mora: 120000,
      },
    });
  });
  it('rejects changed local high-tier costs and missing weekly dependencies', () => {
    const input = fixture();
    input.characters.HuTao.talent.costs[8]!.bookT3++;
    expect(new GenshinCatalogTrust(input).getAdvice({ ...goal, toPhase: 10 })).toMatchObject({
      available: false,
      reason: expect.stringContaining('changed'),
    });
    const missing = fixture();
    Reflect.deleteProperty(missing.characters.HuTao.talent, 'bossWeekly');
    expect(new GenshinCatalogTrust(missing).getAdvice({ ...goal, toPhase: 10 }).available).toBe(
      false,
    );
  });
  it.each([11, 10.5, Infinity])('rejects an invalid talent destination %s', (toPhase) => {
    expect(new GenshinCatalogTrust(fixture()).getAdvice({ ...goal, toPhase }).available).toBe(
      false,
    );
  });
  it.each([-1, 0.5, Infinity, NaN])('rejects invalid cost %s', (value) => {
    const input = fixture();
    input.characters.HuTao.talent.costs[0]!.mora = value;
    expect(new GenshinCatalogTrust(input).getAdvice(goal).available).toBe(false);
  });
  it('rejects a duplicate talent row and a missing row', () => {
    const input = fixture();
    input.characters.HuTao.talent.costs[1]!.tier = 2;
    expect(new GenshinCatalogTrust(input).getAdvice(goal).available).toBe(false);
    const missing = fixture();
    missing.characters.HuTao.talent.costs.splice(1, 1);
    expect(new GenshinCatalogTrust(missing).getAdvice(goal).available).toBe(false);
  });
  it('rejects missing/wrong exact material joins', () => {
    const input = fixture();
    input.characters.HuTao.materials.commonT1 = 'OtherNectar';
    expect(new GenshinCatalogTrust(input).getAdvice(goal).available).toBe(false);
    const wrong = fixture();
    wrong.references.Mora.key = 'OtherMora';
    expect(new GenshinCatalogTrust(wrong).getAdvice(goal).available).toBe(false);
  });
  it('invalidates affected advice when a dependency changes even though costs did not', () => {
    const input = fixture();
    input.references.ShimmeringNectar.gameItemId = 123;
    expect(new GenshinCatalogTrust(input).getAdvice(goal)).toMatchObject({
      available: false,
      reason: expect.stringContaining('changed'),
    });
  });
  it('does not validate a source from its schema or an empty attribution', () => {
    const input = fixture();
    input.manifest = [];
    expect(new GenshinCatalogTrust(input).getAdvice(goal).available).toBe(false);
    const invalid = fixture();
    invalid.manifest[0]!.sources[0]!.verifier = '';
    expect(new GenshinCatalogTrust(invalid).getAdvice(goal).available).toBe(false);
  });
  it('retains explicit unresolved conflicts', () => {
    const input = fixture();
    (input.manifest[0]!.conflicts as string[]).push('conflicting primary costs');
    expect(new GenshinCatalogTrust(input).getAdvice(goal)).toMatchObject({
      available: false,
      reason: expect.stringContaining('conflict'),
    });
  });
  it('fingerprints sorted objects without sorting phase arrays', () => {
    expect(stableFingerprint({ a: 1, b: 2 })).toBe(stableFingerprint({ b: 2, a: 1 }));
    expect(stableFingerprint([1, 2])).not.toBe(stableFingerprint([2, 1]));
  });
  it('excludes placeholder events at their original active date and weekly catalogs', () => {
    const provider = new GenshinCompanionProvider();
    expect(provider.getEventsData()).toMatchObject({
      events: [],
      availability: { available: false },
    });
    expect(provider.getWeeklyBossesData().bosses).toEqual([]);
    expect(
      provider.projectSnapshot({
        routineRow: null,
        legacySummary: null,
        now: new Date('2026-08-10'),
      }).resin.known,
    ).toBe(false);
  });
  it('rejects missing/duplicate ascension phases and legacy weapon tiers including billet', () => {
    const input = fixture();
    input.characters.HuTao.ascension[1]!.phase = 1;
    expect(() =>
      new GenshinCatalogTrust(input).project('HuTao', 'CHARACTER_ASCENSION', 0, 6),
    ).toThrow();
    expect(() =>
      new GenshinCatalogTrust(fixture()).project('StaffOfHoma', 'WEAPON_ASCENSION', 0, 6),
    ).toThrow();
  });
  it.each([[-1], [1.5], [7], [1, 1], []].map((days) => ({ days })))(
    'rejects malformed route weekdays $days without disabling sourced costs',
    ({ days }) => {
      const input = fixture();
      const domain = {
        domainKey: 'TestDomain',
        name: 'Test-only source',
        location: 'test-only',
        days,
        drops: ['Diligence'],
        dropKeys: ['TeachingsOfDiligence'],
        resinPerClaim: 20,
      };
      input.domains['HuTao:CHARACTER_TALENT'] = domain;
      const claim = {
        ...input.manifest[0]!,
        routeFingerprint: stableFingerprint({
          domain,
          costFingerprint: input.manifest[0]!.fingerprint,
        }),
        routeSources: input.manifest[0]!.sources,
      };
      expect(
        new GenshinCatalogTrust({ ...input, manifest: [claim] }).getAdvice(goal),
      ).toMatchObject({ available: true, route: { available: false } });
    },
  );
  it('rejects a broken domain/material-group join and stale route fingerprint', () => {
    const input = fixture();
    const domain = {
      domainKey: 'TestDomain',
      name: 'Test-only source',
      location: 'test-only',
      days: [1, 4, 6],
      drops: ['Ballad'],
      dropKeys: ['UnknownMaterial'],
      resinPerClaim: 20,
    };
    input.domains['HuTao:CHARACTER_TALENT'] = domain;
    const claim = {
      ...input.manifest[0]!,
      routeFingerprint: stableFingerprint({
        domain,
        costFingerprint: input.manifest[0]!.fingerprint,
      }),
      routeSources: input.manifest[0]!.sources,
    };
    expect(new GenshinCatalogTrust({ ...input, manifest: [claim] }).getAdvice(goal)).toMatchObject({
      available: true,
      route: { available: false },
    });
    domain.drops = ['Diligence'];
    domain.dropKeys = ['TeachingsOfDiligence'];
    expect(new GenshinCatalogTrust({ ...input, manifest: [claim] }).getAdvice(goal)).toMatchObject({
      available: true,
      route: { available: false },
    });
  });
});
