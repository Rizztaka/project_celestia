import type { TheaterActPlanRequestInput } from '@celestia/api-contracts';
import { describe, expect, it } from 'vitest';

import { getTheaterRole, solveTheaterActPlan } from './theater-act-planner.calculator.js';
import { explainTheaterActPlan } from './theater-act-planner.explainer.js';

function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const val = (obj as Record<string, unknown>)[key];
    if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  }
  return obj;
}

describe('M4 Subphase 4.4 — Imaginarium Theater Dynamic Act & Vigor Planner', () => {
  // Realistic 22-character Visionary cast (Pyro, Hydro, Electro + Guests)
  const visionaryCast: string[] = [
    // Opening / Carries
    'HuTao',
    'Arlecchino',
    'RaidenShogun',
    'Keqing',
    'Yoimiya',
    'Diluc',
    // Sub-DPS / Off-field
    'Xiangling',
    'Xingqiu',
    'Yelan',
    'Fischl',
    'Furina',
    'YaeMiko',
    // Supports / Buffers
    'Bennett',
    'KaedeharaKazuha',
    'Sucrose',
    'KujouSara',
    'Chevreuse',
    // Sustain
    'Zhongli',
    'Baizhu',
    'SangonomiyaKokomi',
    'KukiShinobu',
    'Layla',
  ];

  it('correctly categorizes character tactical roles in Theater', () => {
    expect(getTheaterRole('HuTao')).toBe('main_dps');
    expect(getTheaterRole('Zhongli')).toBe('sustain');
    expect(getTheaterRole('Bennett')).toBe('buffer_support');
    expect(getTheaterRole('Xiangling')).toBe('sub_dps');
    expect(getTheaterRole('Fischl')).toBe('sub_dps');
  });

  it('simulates a complete 10-Act Visionary draft without vigor exhaustion', () => {
    const request: TheaterActPlanRequestInput = {
      seasonId: '2026-11-01',
      difficulty: 'VISIONARY',
      castKeys: visionaryCast,
      currentAct: 1,
      remainingVigor: {}, // defaults all to 2
      completedActs: [],
    };

    const result = solveTheaterActPlan(request);

    expect(result.totalActs).toBe(10);
    expect(result.currentAct).toBe(1);
    expect(result.projectedSchedule).toHaveLength(10);
    expect(result.vigorExhaustionRisk).toBe(false);

    // Every act must have a full 4-person team
    for (const actItem of result.projectedSchedule) {
      expect(actItem.recommendedTeam).toHaveLength(4);
    }

    // Boss acts (3, 6, 8, 10) must be flagged and have boss names
    const bossActs = result.projectedSchedule.filter((a) => a.isBoss);
    expect(bossActs.map((b) => b.act)).toEqual([3, 6, 8, 10]);
    expect(bossActs[0].bossName).toContain('Millennial Pearl Seahorse');
    expect(bossActs[1].bossName).toContain('Maguu Kenki');
    expect(bossActs[2].bossName).toContain('Coppelius');
    expect(bossActs[3].bossName).toContain('Iniquitous Baptist');

    // Explainer formatting
    const explanations = explainTheaterActPlan(result);
    expect(explanations.some((p) => p.includes('Vigor Reserves: Healthy'))).toBe(true);
    expect(explanations.some((p) => p.includes('Boss Reserve Locks'))).toBe(true);
    expect(explanations.some((p) => p.includes('Next Action (Act 1'))).toBe(true);
  });

  it('backward-chains boss reservations to protect key carries from premature exhaustion', () => {
    const request: TheaterActPlanRequestInput = {
      seasonId: '2026-11-01',
      difficulty: 'VISIONARY',
      castKeys: visionaryCast,
      currentAct: 1,
      remainingVigor: {},
      completedActs: [],
    };

    const result = solveTheaterActPlan(request);

    // Characters reserved for Boss Act 10 or 8 must NOT be drained to 0 before that act
    for (const [charKey, reservedAct] of Object.entries(result.reservedForBosses)) {
      // Find all acts prior to the reserved boss act where this character was deployed
      const deploymentsBeforeBoss = result.projectedSchedule.filter(
        (a) => a.act < reservedAct && a.recommendedTeam.includes(charKey),
      );

      // Each character starts with 2 vigor; deploying them before the boss can happen at most once!
      expect(deploymentsBeforeBoss.length).toBeLessThanOrEqual(1);

      // And they must be successfully deployed in the reserved boss act
      const bossActSchedule = result.projectedSchedule.find((a) => a.act === reservedAct)!;
      expect(bossActSchedule.recommendedTeam).toContain(charKey);
    }
  });

  it('adapts dynamically to mid-run state with already completed acts', () => {
    // Player has cleared Acts 1 and 2 already
    const completedActs = [
      { act: 1, teamKeys: ['Diluc', 'Fischl', 'Sucrose', 'Layla'] },
      { act: 2, teamKeys: ['Keqing', 'Xingqiu', 'KujouSara', 'KukiShinobu'] },
    ];

    const request: TheaterActPlanRequestInput = {
      seasonId: '2026-11-01',
      difficulty: 'VISIONARY',
      castKeys: visionaryCast,
      currentAct: 3, // Now at Boss Act 3!
      remainingVigor: {
        Diluc: 1,
        Fischl: 1,
        Sucrose: 1,
        Layla: 1,
        Keqing: 1,
        Xingqiu: 1,
        KujouSara: 1,
        KukiShinobu: 1,
      },
      completedActs,
    };

    const result = solveTheaterActPlan(request);

    expect(result.currentAct).toBe(3);
    expect(result.projectedSchedule).toHaveLength(8); // Acts 3 to 10
    expect(result.projectedSchedule[0].act).toBe(3);
    expect(result.projectedSchedule[0].isBoss).toBe(true);

    // Next recommended team is for Act 3 (Boss)
    expect(result.nextRecommendedTeam).toHaveLength(4);
  });

  it('flags vigor exhaustion risk when cast is insufficient for difficulty acts', () => {
    // 10 characters attempting Visionary (10 acts * 4 slots = 40 slots needed; 10 * 2 = 20 max vigor!)
    const smallCast = visionaryCast.slice(0, 10);
    const request: TheaterActPlanRequestInput = {
      seasonId: '2026-11-01',
      difficulty: 'VISIONARY',
      castKeys: smallCast,
      currentAct: 1,
      remainingVigor: {},
      completedActs: [],
    };

    const result = solveTheaterActPlan(request);

    expect(result.vigorExhaustionRisk).toBe(true);
    const explanations = explainTheaterActPlan(result);
    expect(explanations.some((p) => p.includes('CRITICAL VIGOR WARNING'))).toBe(true);
  });

  it('preserves input immutability under deepFreeze', () => {
    const frozenRequest = deepFreeze({
      seasonId: '2026-11-01',
      difficulty: 'HARD' as const,
      castKeys: visionaryCast.slice(0, 18),
      currentAct: 1,
      remainingVigor: {},
      completedActs: [],
    });

    expect(() => solveTheaterActPlan(frozenRequest)).not.toThrow();
  });

  it('identifies characters outside standard season elements and records them', () => {
    const request: TheaterActPlanRequestInput = {
      seasonId: '2026-11-01',
      difficulty: 'HARD',
      castKeys: visionaryCast.slice(0, 18),
      currentAct: 1,
      remainingVigor: {},
      completedActs: [],
    };

    const result = solveTheaterActPlan(request);
    expect(result.isCurrentSeason).toBe(true);
    expect(result.ineligibleCastExcluded.length).toBeGreaterThan(0);
    // Sucrose (Anemo) is outside standard Pyro/Hydro/Electro and not an Opening or Special Guest
    expect(result.ineligibleCastExcluded.some((e) => e.characterKey === 'Sucrose')).toBe(true);

    const explanations = explainTheaterActPlan(result);
    expect(explanations.some((e) => e.includes('Season Ineligible Cast Excluded'))).toBe(true);
  });

  it('flags non-active season as historical draft mode', () => {
    const request: TheaterActPlanRequestInput = {
      seasonId: '2024-07',
      difficulty: 'HARD',
      castKeys: visionaryCast.slice(0, 18),
      currentAct: 1,
      remainingVigor: {},
      completedActs: [],
    };

    const result = solveTheaterActPlan(request);
    expect(result.isCurrentSeason).toBe(false);
    expect(result.isExpired).toBe(true);
    expect(result.expirationNote).toContain('does not match active season');

    const explanations = explainTheaterActPlan(result);
    expect(explanations.some((e) => e.includes('[ARCHIVED / HISTORICAL SEASON]'))).toBe(true);
  });
});
