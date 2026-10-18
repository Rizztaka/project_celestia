import { createRequire } from 'node:module';

import type { AdviceGoalInput, GoalAdvice } from '@celestia/api-contracts';
import { describe, expect, it } from 'vitest';

import { GenshinProgressionCatalog, progressionCatalog } from './progression-catalog.js';

const require = createRequire(import.meta.url);
const advice = (
  targetKey: string,
  goalType = 'CHARACTER_ASCENSION',
  fromPhase = 0,
  toPhase = 6,
  talentType: string | null = null,
) =>
  progressionCatalog.getAdvice({ id: 'test', targetKey, goalType, fromPhase, toPhase, talentType });
function available(result: GoalAdvice) {
  expect(result.available).toBe(true);
  if (!result.available) throw new Error(result.reason);
  return result;
}
describe('Pinned progression coverage', () => {
  it('matches the independently recorded Hu Tao 1–6 primary totals and full 1–10 totals', () => {
    expect(available(advice('HuTao', 'CHARACTER_TALENT', 1, 6, 'normal')).costs).toEqual({
      Mora: 122500,
      TeachingsOfDiligence: 3,
      GuideToDiligence: 21,
      WhopperflowerNectar: 6,
      ShimmeringNectar: 22,
    });
    for (const slot of ['normal', 'skill', 'burst']) {
      expect(available(advice('HuTao', 'CHARACTER_TALENT', 1, 10, slot)).costs).toEqual({
        Mora: 1652500,
        TeachingsOfDiligence: 3,
        GuideToDiligence: 21,
        PhilosophiesOfDiligence: 38,
        WhopperflowerNectar: 6,
        ShimmeringNectar: 22,
        EnergyNectar: 31,
        ShardOfAFoulLegacy: 6,
        CrownOfInsight: 1,
      });
    }
  });
  it('computes every Raiden ascension material using canonical keys', () => {
    expect(available(advice('RaidenShogun')).costs).toEqual({
      Mora: 420000,
      VajradaAmethystSliver: 1,
      VajradaAmethystFragment: 9,
      VajradaAmethystChunk: 9,
      VajradaAmethystGemstone: 6,
      StormBeads: 46,
      AmakumoFruit: 168,
      OldHandguard: 18,
      KageuchiHandguard: 30,
      FamedHandguard: 36,
    });
  });
  it('supports the requested Fontaine, Natlan and older roster targets', () => {
    for (const key of ['Furina', 'Zhongli', 'Neuvillette', 'Mavuika', 'Sethos']) {
      const costs = available(advice(key)).costs;
      expect(costs.Mora).toBe(420000);
      expect(available(advice(key, 'CHARACTER_TALENT', 9, 10, 'skill')).costs.CrownOfInsight).toBe(
        1,
      );
    }
    expect(available(advice('Neuvillette')).costs.Lumitoile).toBe(168);
    expect(available(advice('Mavuika')).costs.WitheringPurpurbloom).toBe(168);
  });
  it('includes four weapon-domain tiers and correct Staff of Homa totals', () => {
    expect(available(advice('StaffOfHoma', 'WEAPON_ASCENSION')).costs).toEqual({
      Mora: 225000,
      GrainOfAerosiderite: 5,
      PieceOfAerosiderite: 14,
      BitOfAerosiderite: 14,
      ChunkOfAerosiderite: 6,
      DeadLeyLineBranch: 23,
      DeadLeyLineLeaves: 27,
      LeyLineSprout: 41,
      SlimeCondensate: 15,
      SlimeSecretions: 23,
      SlimeConcentrate: 27,
    });
    expect(advice('DullBlade', 'WEAPON_ASCENSION').available).toBe(false);
    expect(advice('DullBlade', 'WEAPON_ASCENSION', 0, 4).available).toBe(true);
  });
  it('joins talent and weapon schedules, with all tiers grouped consistently', () => {
    const talent = available(advice('HuTao', 'CHARACTER_TALENT', 1, 2, 'normal'));
    const weapon = available(advice('StaffOfHoma', 'WEAPON_ASCENSION'));
    expect(talent.routes?.[0]).toMatchObject({
      location: 'Taishan Mansion, Liyue',
      days: [1, 4, 6],
      resinPerClaim: 20,
    });
    expect(talent.routes?.[0]?.dropKeys).toContain('PhilosophiesOfDiligence');
    expect(weapon.routes?.[0]).toMatchObject({ days: [2, 5, 6], resinPerClaim: 20 });
    expect(talent.sources[0]).toMatchObject({
      authority: 'community',
      observedOn: null,
      gameVersion: null,
    });
  });
  it('does not manufacture unknown targets, invalid ranges or Traveler slot costs', () => {
    expect(advice('UnknownCharacter').available).toBe(false);
    expect(advice('HuTao', 'CHARACTER_ASCENSION', 0, 7).available).toBe(false);
    expect(advice('HuTao', 'CHARACTER_TALENT', 1, 11, 'normal').available).toBe(false);
    expect(advice('HuTao', 'CHARACTER_TALENT', 1, 10, null).available).toBe(false);
    for (const entry of Object.values(progressionCatalog.data.characters).filter(
      (item) => !item.talent.length,
    )) {
      expect(advice(entry.key, 'CHARACTER_TALENT', 1, 2, 'skill').available).toBe(false);
      expect(advice(entry.key).available).toBe(true);
    }
  });
  it('rejects catalog drift and retains an immutable runtime snapshot', () => {
    const changed = structuredClone(require('../static/progression-catalog.json'));
    changed.characters.RaidenShogun.ascension[0].costs.Mora = 1;
    expect(() => new GenshinProgressionCatalog(changed)).toThrow(/fingerprint/);
    expect(Object.isFrozen(progressionCatalog.data.characters.HuTao!.ascension[0]!.costs)).toBe(
      true,
    );
  });
  it('calculates every supported complete range with safe positive quantities', () => {
    const goals: AdviceGoalInput[] = [
      ...Object.values(progressionCatalog.data.characters).flatMap((entry) => [
        {
          id: entry.key,
          targetKey: entry.key,
          goalType: 'CHARACTER_ASCENSION',
          fromPhase: 0,
          toPhase: 6,
          talentType: null,
        },
        ...(entry.talent.length
          ? ['normal', 'skill', 'burst'].map((talentType) => ({
              id: entry.key,
              targetKey: entry.key,
              goalType: 'CHARACTER_TALENT',
              fromPhase: 1,
              toPhase: 10,
              talentType,
            }))
          : []),
      ]),
      ...Object.values(progressionCatalog.data.weapons).map((entry) => ({
        id: entry.key,
        targetKey: entry.key,
        goalType: 'WEAPON_ASCENSION',
        fromPhase: 0,
        toPhase: entry.ascension.at(-1)!.phase,
        talentType: null,
      })),
    ];
    for (const goal of goals) {
      for (const quantity of Object.values(available(progressionCatalog.getAdvice(goal)).costs))
        expect(Number.isSafeInteger(quantity) && quantity > 0).toBe(true);
    }
  });
});
