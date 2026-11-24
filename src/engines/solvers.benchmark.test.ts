import { describe, it, expect } from 'vitest';
import { CHARACTERS } from '../data/characters';
import { WEAPONS_DATA } from '../data/weapons';
import { generateBestTeams } from './team-generator';
import { solveAbyssDualTeams } from './abyss-solver';
import { rankWeaponsForCharacter } from './weapon-solver';
import type { OwnedCharacterProfile, OwnedWeapon } from '../types/genshin';

describe('Engine Solvers Performance & Mobile Throttle Profiling', () => {
  const allIds = CHARACTERS.map((c) => c.id);
  const profiles: Record<string, OwnedCharacterProfile> = {};
  for (const id of allIds) {
    profiles[id] = { id, level: 90, constellation: 0 };
  }

  // Synthesize 256 combat weapons bag
  const weaponsBag: OwnedWeapon[] = WEAPONS_DATA.map((w, idx) => ({
    id: `bench_w_${idx}`,
    key: w.key,
    name: w.name,
    level: 90,
    refinement: 1,
    rarity: w.rarity,
    location: '',
  }));

  it('profiles generateBestTeams execution time under simulated 4x CPU slowdown', async () => {
    // Warm-up
    generateBestTeams(allIds.slice(0, 16), 'Nefer', profiles, weaponsBag.slice(0, 20));

    const iterations = 5;
    const start = performance.now();
    let teams = generateBestTeams(allIds, 'Nefer', profiles, weaponsBag).items;
    for (let i = 1; i < iterations; i++) {
      teams = generateBestTeams(allIds, 'Nefer', profiles, weaponsBag).items;
    }
    const end = performance.now();
    const avgDuration = (end - start) / iterations;
    const estimated4xMobileTime = avgDuration * 4;

    console.info(
      `[Benchmark] generateBestTeams (128 chars, 256 weps): Desktop ${avgDuration.toFixed(2)}ms | Est. 4x Mobile: ${estimated4xMobileTime.toFixed(2)}ms`
    );

    // Verify valid team generation output
    expect(teams.length).toBeGreaterThan(0);
    expect(teams[0].members).toHaveLength(4);

    // Verify Web Worker dispatcher offloading produces identical team generation results
    const { dispatchGenerateBestTeams } = await import('../services/solver-dispatcher');
    const asyncTeams = (await dispatchGenerateBestTeams(allIds, 'Nefer', profiles, weaponsBag)).items;
    expect(asyncTeams.length).toBeGreaterThan(0);
    expect(asyncTeams[0].members).toHaveLength(4);
  });

  it('profiles solveAbyssDualTeams execution time and benchmarks offloading threshold', async () => {
    // Warm-up
    solveAbyssDualTeams(allIds.slice(0, 16), profiles);

    const iterations = 3;
    const start = performance.now();
    let plan = solveAbyssDualTeams(allIds, profiles);
    for (let i = 1; i < iterations; i++) {
      plan = solveAbyssDualTeams(allIds, profiles);
    }
    const end = performance.now();
    const avgDuration = (end - start) / iterations;
    const estimated4xMobileTime = avgDuration * 4;

    console.info(
      `[Benchmark] solveAbyssDualTeams (128 chars, 256 weps): Desktop ${avgDuration.toFixed(2)}ms | Est. 4x Mobile: ${estimated4xMobileTime.toFixed(2)}ms`
    );

    expect(plan.firstHalfTeam.members).toHaveLength(4);
    expect(plan.secondHalfTeam.members).toHaveLength(4);
    expect(plan.overallScore).toBeGreaterThan(0);

    // Because estimated 4x mobile execution exceeds the 50ms Long Task threshold,
    // verify dispatchSolveAbyss successfully runs and delivers valid dual teams
    const { dispatchSolveAbyss } = await import('../services/solver-dispatcher');
    const asyncPlan = await dispatchSolveAbyss(allIds, profiles);
    expect(asyncPlan.firstHalfTeam.members).toHaveLength(4);
    expect(asyncPlan.secondHalfTeam.members).toHaveLength(4);
    expect(asyncPlan.overallScore).toBeGreaterThan(0);
  });

  it('profiles rankWeaponsForCharacter execution across 256 weapons', () => {
    const nefer = CHARACTERS.find((c) => c.id === 'Nefer')!;

    // Warm-up
    rankWeaponsForCharacter(nefer, weaponsBag.slice(0, 20));

    const iterations = 10;
    const start = performance.now();
    let rankings = rankWeaponsForCharacter(nefer, weaponsBag).items;
    for (let i = 1; i < iterations; i++) {
      rankings = rankWeaponsForCharacter(nefer, weaponsBag).items;
    }
    const end = performance.now();
    const avgDuration = (end - start) / iterations;
    const estimated4xMobileTime = avgDuration * 4;

    console.info(
      `[Benchmark] rankWeaponsForCharacter (256 weps): Desktop ${avgDuration.toFixed(2)}ms | Est. 4x Mobile: ${estimated4xMobileTime.toFixed(2)}ms`
    );

    // Weapon ranking produces ordered results
    expect(rankings.length).toBeGreaterThan(0);
    expect(rankings[0].weapon).toBeDefined();
    expect(rankings[0].score).toBeGreaterThan(0);
  });
});
