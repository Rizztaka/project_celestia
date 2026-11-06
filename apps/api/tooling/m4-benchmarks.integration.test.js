import { describe, expect, it } from 'vitest';

import { solveAbyssJoint } from '../src/games/genshin/intelligence/endgame-intelligence/abyss-joint.calculator.ts';
import { explainAbyssJoint } from '../src/games/genshin/intelligence/endgame-intelligence/abyss-joint.explainer.ts';
import { solveOnslaughtJoint } from '../src/games/genshin/intelligence/endgame-intelligence/onslaught-joint.calculator.ts';
import { explainOnslaughtJoint } from '../src/games/genshin/intelligence/endgame-intelligence/onslaught-joint.explainer.ts';
import { solveTheaterActPlan } from '../src/games/genshin/intelligence/endgame-intelligence/theater-act-planner.calculator.ts';
import { explainTheaterActPlan } from '../src/games/genshin/intelligence/endgame-intelligence/theater-act-planner.explainer.ts';
import encounterPack from '../src/games/genshin/static/endgame-encounters.json';

describe('M4 End-to-End Integration Benchmarks', () => {
  it('benchmark 1: Spiral Abyss Joint Solver proves joint pair beats greedy selection', () => {
    const chamberConfig = {
      chamber: 1,
      firstHalf: {
        half: 1,
        targetTimeSeconds: 90,
        waves: [
          {
            waveNumber: 1,
            enemies: ['Hydro Abyss Mage', 'Hydro Eidolon'],
            shields: ['Hydro'],
            aura: null,
            geometry: 'aoe_crowd',
            ccDemand: 'recommended',
            resistanceProfile: { Hydro: 0.7, Cryo: 0.1, Dendro: 0.1 },
          },
        ],
      },
      secondHalf: {
        half: 2,
        targetTimeSeconds: 90,
        waves: [
          {
            waveNumber: 1,
            enemies: ['Cryo Abyss Herald', 'Frostarm Lawachurl'],
            shields: ['Cryo'],
            aura: null,
            geometry: 'single_target_boss',
            ccDemand: 'optional',
            resistanceProfile: { Cryo: 0.7, Pyro: 0.1, Electro: 0.1 },
          },
        ],
      },
    };

    // teamA: Dominant for Half 1 (Cryo/Dendro freeze/bloom) + shares Zhongli
    const teamA = {
      id: 'team-a-freeze',
      name: 'Ayaka Freeze Core',
      memberKeys: ['KamisatoAyaka', 'Shenhe', 'KaedeharaKazuha', 'Zhongli'],
      primaryElement: 'Cryo',
      baseDps: 90000,
      comfortScore: 80,
      gear: [],
    };

    // teamB: Dominant for Half 2 (Pyro shield shatter), but also relies on Zhongli
    const teamB = {
      id: 'team-b-pyro-zhongli',
      name: 'Hu Tao Zhongli Shield',
      memberKeys: ['HuTao', 'Xingqiu', 'Yelan', 'Zhongli'],
      primaryElement: 'Pyro',
      baseDps: 95000,
      comfortScore: 90,
      gear: [],
    };

    // teamC: Alternative Half 1 (Hydro hypercarry) that frees Zhongli for Half 2
    const teamC = {
      id: 'team-c-neuv',
      name: 'Neuvillette Hypercarry',
      memberKeys: ['Neuvillette', 'Furina', 'KaedeharaKazuha', 'Baizhu'],
      primaryElement: 'Hydro',
      baseDps: 70000,
      comfortScore: 85,
      gear: [],
    };

    // teamD: Weak Half 2 fallback without Zhongli
    const teamD = {
      id: 'team-d-pyro-weak',
      name: 'Yanfei Shieldless Budget',
      memberKeys: ['Yanfei', 'Xingqiu', 'Yelan', 'Thoma'],
      primaryElement: 'Pyro',
      baseDps: 20000,
      comfortScore: 40,
      gear: [],
    };

    const result = solveAbyssJoint({
      cycleId: '5.2-1',
      floor: 12,
      chamber: 1,
      candidateTeams: [teamA, teamB, teamC, teamD],
      encounterOverride: chamberConfig,
    });

    // Assert that solver selected joint pair (teamC + teamB) instead of greedy (teamA + teamD)
    expect(result.firstHalf.team.id).toBe('team-c-neuv');
    expect(result.secondHalf.team.id).toBe('team-b-pyro-zhongli');
    expect(result.isJointOptimal).toBe(true);

    // Greedy comparison exists and joint beats greedy
    expect(result.greedyComparison).not.toBeNull();
    expect(result.greedyComparison.scoreDeltaPercent).toBeGreaterThan(0);
    expect(result.jointScore).toBeGreaterThan(result.greedyComparison.greedyJointScore);

    const explanations = explainAbyssJoint(result);
    expect(explanations.length).toBeGreaterThanOrEqual(3);
    expect(explanations.some((e) => /joint/i.test(e))).toBe(true);
  });

  it('benchmark 2: Strict disjoint character and gear exclusivity across joint halves', () => {
    const chamberConfig = {
      chamber: 1,
      firstHalf: {
        half: 1,
        targetTimeSeconds: 90,
        waves: [
          {
            waveNumber: 1,
            enemies: ['Ruin Guard'],
            shields: [],
            aura: null,
            geometry: 'single_target_boss',
            ccDemand: 'optional',
            resistanceProfile: {},
          },
        ],
      },
      secondHalf: {
        half: 2,
        targetTimeSeconds: 90,
        waves: [
          {
            waveNumber: 1,
            enemies: ['Ruin Grader'],
            shields: [],
            aura: null,
            geometry: 'single_target_boss',
            ccDemand: 'optional',
            resistanceProfile: {},
          },
        ],
      },
    };

    // Candidate teams sharing gear or Traveler forms
    const team1 = {
      id: 'team-traveler-dendro',
      name: 'Dendro Traveler Team',
      memberKeys: ['TravelerAnemo', 'RaidenShogun', 'Xingqiu', 'Bennett'],
      gear: [{ weaponInstanceId: 'w-fav-1', artifactInstanceIds: ['art-noblesse-1'] }],
    };

    const team2 = {
      id: 'team-traveler-geo',
      name: 'Geo Traveler Team',
      memberKeys: ['TravelerGeo', 'Navia', 'Chiori', 'Zhongli'],
      gear: [{ weaponInstanceId: 'w-fav-2', artifactInstanceIds: ['art-archaic-1'] }],
    };

    const team3 = {
      id: 'team-navia-disjoint',
      name: 'Navia Disjoint Team',
      memberKeys: ['Navia', 'Zhongli', 'Chiori', 'Gorou'],
      gear: [{ weaponInstanceId: 'w-serpent-1', artifactInstanceIds: ['art-nighttime-1'] }],
    };

    const result = solveAbyssJoint({
      cycleId: '5.2-1',
      floor: 12,
      chamber: 1,
      candidateTeams: [team1, team2, team3],
      encounterOverride: chamberConfig,
    });

    // Proves Traveler variants (TravelerAnemo and TravelerGeo) CANNOT be co-deployed
    const half1Keys = new Set(result.firstHalf.team.memberKeys);
    const half2Keys = new Set(result.secondHalf.team.memberKeys);

    // No character collision
    for (const key of half1Keys) {
      expect(half2Keys.has(key)).toBe(false);
    }

    // Traveler not in both halves
    const half1HasTraveler = result.firstHalf.team.memberKeys.some((k) => k.startsWith('Traveler'));
    const half2HasTraveler = result.secondHalf.team.memberKeys.some((k) =>
      k.startsWith('Traveler'),
    );
    expect(half1HasTraveler && half2HasTraveler).toBe(false);

    // No gear collision
    const half1Weapons = (result.firstHalf.team.gear ?? [])
      .map((g) => g.weaponInstanceId)
      .filter(Boolean);
    const half2Weapons = (result.secondHalf.team.gear ?? [])
      .map((g) => g.weaponInstanceId)
      .filter(Boolean);
    for (const w of half1Weapons) {
      expect(half2Weapons.includes(w)).toBe(false);
    }
  });

  it('benchmark 3: Stygian Onslaught satisfies strict 12-character exclusivity and counters 3 consecutive bosses', () => {
    const candidateTeams = [
      {
        id: 'team-neuv',
        name: 'Neuvillette Sustained Core',
        memberKeys: ['Neuvillette', 'Furina', 'KaedeharaKazuha', 'Baizhu'],
        primaryElement: 'Hydro',
        baseDps: 92000,
        comfortScore: 90,
      },
      {
        id: 'team-navia',
        name: 'Navia Heavy Geo Shatter',
        memberKeys: ['Navia', 'Zhongli', 'Chiori', 'Gorou'],
        primaryElement: 'Geo',
        baseDps: 84000,
        comfortScore: 88,
      },
      {
        id: 'team-yoimiya',
        name: 'Yoimiya Overload Anti-Air',
        memberKeys: ['Yoimiya', 'Chevreuse', 'Fischl', 'Beidou'],
        primaryElement: 'Pyro',
        baseDps: 82000,
        comfortScore: 80,
      },
      {
        id: 'team-national',
        name: 'Raiden National Overdrive',
        memberKeys: ['RaidenShogun', 'Xiangling', 'Xingqiu', 'Bennett'],
        primaryElement: 'Pyro',
        baseDps: 85000,
        comfortScore: 75,
      },
    ];

    const result = solveOnslaughtJoint({
      cycleId: '5.2-1',
      candidateTeams,
    });

    // Exactly 3 stages allocated
    expect(result.stages.length).toBe(3);
    expect(result.allStagesCleared).toBe(true);
    expect(result.jointScore).toBeGreaterThan(0);

    // Strict 12-character exclusivity (T1 ∩ T2 ∩ T3 = ∅)
    const deployedKeys = new Set();
    for (const stage of result.stages) {
      for (const charKey of stage.team.memberKeys) {
        expect(deployedKeys.has(charKey)).toBe(false);
        deployedKeys.add(charKey);
      }
    }
    expect(deployedKeys.size).toBe(12);

    // Mechanic counters verified
    expect(result.stages[0].mechanicCounters.length).toBeGreaterThan(0);
    expect(result.stages[1].mechanicCounters.length).toBeGreaterThan(0);
    expect(result.stages[2].mechanicCounters.length).toBeGreaterThan(0);

    const explanations = explainOnslaughtJoint(result);
    expect(explanations.length).toBeGreaterThanOrEqual(4);
    expect(explanations.some((e) => /exclusivity/i.test(e))).toBe(true);
  });

  it('benchmark 4: Imaginarium Theater completes 10-Act Visionary draft without early vigor exhaustion', () => {
    const visionaryCast = [
      'Neuvillette',
      'Furina',
      'KaedeharaKazuha',
      'Baizhu',
      'RaidenShogun',
      'Xiangling',
      'Xingqiu',
      'Bennett',
      'Alhaitham',
      'Nahida',
      'Yelan',
      'KukiShinobu',
      'HuTao',
      'Zhongli',
      'Navia',
      'KamisatoAyaka',
      'Shenhe',
      'SangonomiyaKokomi',
      'Yoimiya',
      'Fischl',
      'Beidou',
      'Sucrose',
    ];

    const initialVigor = {};
    for (const key of visionaryCast) {
      initialVigor[key] = 2;
    }

    const plan = solveTheaterActPlan({
      seasonId: '2024-11',
      difficulty: 'VISIONARY',
      castKeys: visionaryCast,
      currentAct: 1,
      remainingVigor: initialVigor,
      completedActs: [],
    });

    // 10 projected acts
    expect(plan.projectedSchedule.length).toBe(10);
    expect(plan.vigorExhaustionRisk).toBe(false);

    // Boss acts (3, 6, 8, 10) are flagged and have reserved carries
    const bossActs = plan.projectedSchedule.filter((s) => s.isBoss);
    expect(bossActs.length).toBe(4);
    expect(bossActs.map((b) => b.act)).toEqual([3, 6, 8, 10]);

    // Character usage total across 10 acts must not exceed 2 for any character
    const charUsageCount = {};
    for (const actItem of plan.projectedSchedule) {
      expect(actItem.recommendedTeam.length).toBe(4);
      for (const charKey of actItem.recommendedTeam) {
        charUsageCount[charKey] = (charUsageCount[charKey] ?? 0) + 1;
        expect(charUsageCount[charKey]).toBeLessThanOrEqual(2);
      }
    }

    // Explanations explain backward chaining & boss reserves
    const explanations = explainTheaterActPlan(plan);
    expect(explanations.length).toBeGreaterThanOrEqual(3);
    expect(explanations.some((e) => /reserve/i.test(e))).toBe(true);
  });

  it('benchmark 5: Encounter Pack fixture integrity and version conformity', () => {
    expect(encounterPack.version).toBe('5.2-1');
    expect(encounterPack.cycleId).toBe('5.2-1');
    expect(encounterPack.isExpired).toBe(false);

    // Abyss floor 12 present with 3 chambers
    expect(encounterPack.abyssFloors.length).toBeGreaterThanOrEqual(1);
    const floor12 = encounterPack.abyssFloors.find((f) => f.floor === 12);
    expect(floor12).toBeDefined();
    expect(floor12.chambers.length).toBe(3);
    for (const chamber of floor12.chambers) {
      expect(chamber.firstHalf.waves.length).toBeGreaterThan(0);
      expect(chamber.secondHalf.waves.length).toBeGreaterThan(0);
    }

    // 3 Onslaught stages
    expect(encounterPack.onslaughtBosses.length).toBe(3);
    expect(encounterPack.onslaughtBosses.map((b) => b.stage)).toEqual([1, 2, 3]);

    // Theater season config
    expect(encounterPack.theaterSeason).not.toBeNull();
    expect(encounterPack.theaterSeason.actCount).toBe(10);
    expect(encounterPack.theaterSeason.bossActs).toEqual([3, 6, 8, 10]);

    // Active vs Expired Cycle differentiation
    const activeAbyss = solveAbyssJoint({
      cycleId: '5.2-1',
      floor: 12,
      chamber: 1,
      candidateTeams: [
        {
          id: 't1',
          name: 'T1',
          memberKeys: ['Bennett', 'Xiangling', 'Xingqiu', 'RaidenShogun'],
          baseDps: 60000,
          comfortScore: 70,
        },
        {
          id: 't2',
          name: 'T2',
          memberKeys: ['Keqing', 'Fischl', 'Nahida', 'KaedeharaKazuha'],
          baseDps: 55000,
          comfortScore: 65,
        },
      ],
    });
    expect(activeAbyss.isCurrentCycle).toBe(true);
    expect(activeAbyss.isExpired).toBe(false);

    const expiredAbyss = solveAbyssJoint({
      cycleId: '4.8-1',
      floor: 12,
      chamber: 1,
      candidateTeams: [
        {
          id: 't1',
          name: 'T1',
          memberKeys: ['Bennett', 'Xiangling', 'Xingqiu', 'RaidenShogun'],
          baseDps: 60000,
          comfortScore: 70,
        },
        {
          id: 't2',
          name: 'T2',
          memberKeys: ['Keqing', 'Fischl', 'Nahida', 'KaedeharaKazuha'],
          baseDps: 55000,
          comfortScore: 65,
        },
      ],
    });
    expect(expiredAbyss.isCurrentCycle).toBe(false);
    expect(expiredAbyss.isExpired).toBe(true);
    expect(expiredAbyss.expirationNote).toContain('does not match active cycle');
  });
});
