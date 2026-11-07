import { describe, expect, it } from 'vitest';

import {
  applyWishResultToSession,
  buildSandboxPullRequest,
  createInitialWishSandboxSession,
  getActivePityForBanner,
  MAX_RECENT_PULLS_RETAINED,
  setBannerScenario,
  setPathTarget,
  updatePityOverrides,
} from '../../web/src/lib/wish-sandbox-session.ts';
import { calculateCompanionSummary } from '../src/games/genshin/intelligence/companion-summary/companion-summary.calculator.ts';
import { explainCompanionSummary } from '../src/games/genshin/intelligence/companion-summary/companion-summary.explainer.ts';

describe('M6 End-to-End Integration Benchmarks: Autonomous Companion Orchestration & Wish Sandbox', () => {
  const mavuikaBanner = {
    bannerId: 'banner_mavuika',
    name: 'Ancient Flame Ablaze',
    type: 'CHARACTER',
    fiveStarKey: 'Mavuika',
    fiveStarKeys: ['Mavuika'],
    fourStarKeys: ['Kachina', 'Bennett', 'Diona'],
    startDate: '2025-01-01',
    endDate: '2025-01-21',
    historical: false,
    hardPity: 90,
    fatePointCap: 0,
  };

  const weaponBanner = {
    bannerId: 'banner_weapon_v53',
    name: 'Epitome Invocation',
    type: 'WEAPON',
    fiveStarKeys: ['AThousandBlazingSuns', 'EngulfingLightning'],
    fourStarKeys: ['FavoniusSword', 'TheCatch'],
    startDate: '2025-01-01',
    endDate: '2025-01-21',
    historical: false,
    hardPity: 80,
    fatePointCap: 1,
  };

  it('benchmark 1: synthesizes readiness, marginal investment, and domain schedule into FARMING_AVAILABLE primary action', () => {
    const input = {
      accountScope: 'authenticated',
      isPartialAccount: false,
      readinessList: [
        { characterKey: 'Mavuika', role: 'on_field_dps', score: 88, status: 'ready_for_target' },
        { characterKey: 'Citlali', role: 'support', score: 72, status: 'conditional' },
        { characterKey: 'Bennett', role: 'buffer_healer', score: 92, status: 'ready_for_target' },
        {
          characterKey: 'Xilonen',
          role: 'support_res_shred',
          score: 85,
          status: 'ready_for_target',
        },
      ],
      upgradesList: [
        {
          characterKey: 'Citlali',
          actionType: 'TALENT_UPGRADE',
          actionDetail: 'Elemental Skill 6 -> 8',
          efficiencyScore: 55,
          domainFamily: 'teachings_of_contention',
        },
        {
          characterKey: 'Mavuika',
          actionType: 'WEAPON_ASCENSION',
          actionDetail: 'Ascension 80 -> 90',
          efficiencyScore: 35,
          domainFamily: 'blazing_sacrificial_heart',
        },
      ],
      openDomainFamilies: ['teachings_of_contention'],
      endgameStatus: {
        abyssScore: 82,
        abyssReady: true,
        onslaughtReady: true,
        theaterMaxActs: 10,
      },
      pullAdvice: {
        targetCharacterKey: 'Citlali',
        targetBannerName: 'Star-Spangled Night',
        recommendation: 'HIGH_ACCOUNT_VALUE',
        keyReason: 'Provides universal off-field Cryo application and shield support.',
      },
    };

    const summary = calculateCompanionSummary(input);

    expect(summary.readyBuildsSummary.readyCount).toBe(3);
    expect(summary.readyBuildsSummary.totalAssessed).toBe(4);
    expect(summary.topMarginalInvestments[0].characterKey).toBe('Citlali');
    expect(summary.topMarginalInvestments[0].todayDomainAvailable).toBe(true);

    expect(summary.primaryAction.category).toBe('FARMING_AVAILABLE');
    expect(summary.primaryAction.headline).toContain(
      "Today's Domain: Upgrade Citlali's Elemental Skill 6 -> 8",
    );
    expect(summary.primaryAction.targetRoute).toBe('/planner?tab=farming');

    const narrative = explainCompanionSummary(summary);
    expect(narrative.some((line) => line.includes("Today's Focus [FARMING_AVAILABLE]"))).toBe(true);
    expect(
      narrative.some((line) => line.includes('Active Drop Schedules: Materials for Citlali')),
    ).toBe(true);
    expect(
      narrative.some((line) => line.includes('3 of 4 evaluated characters meet ABYSS_12')),
    ).toBe(true);
  });

  it('benchmark 2: prioritizes ENDGAME_READINESS when no urgent upgrades are open today and Abyss is not ready', () => {
    const input = {
      accountScope: 'authenticated',
      isPartialAccount: false,
      readinessList: [
        { characterKey: 'Xiangling', role: 'off_field_dps', score: 65, status: 'needs_investment' },
        { characterKey: 'Bennett', role: 'buffer_healer', score: 70, status: 'conditional' },
      ],
      upgradesList: [
        {
          characterKey: 'Xiangling',
          actionType: 'TALENT_UPGRADE',
          actionDetail: 'Burst 6 -> 7',
          efficiencyScore: 25,
          domainFamily: 'teachings_of_diligence',
        },
      ],
      openDomainFamilies: ['teachings_of_freedom'], // Diligence not open today
      endgameStatus: {
        abyssScore: 54,
        abyssReady: false,
        onslaughtReady: false,
        theaterMaxActs: 6,
      },
    };

    const summary = calculateCompanionSummary(input);

    expect(summary.primaryAction.category).toBe('ENDGAME_READINESS');
    expect(summary.primaryAction.targetRoute).toBe('/endgame');
    expect(summary.primaryAction.subtext).toContain('54/100');

    const narrative = explainCompanionSummary(summary);
    expect(
      narrative.some((line) => line.includes('Spiral Abyss Floor 12 clearance bottlenecked')),
    ).toBe(true);
  });

  it('benchmark 3: prioritizes PULL_STRATEGY when account is endgame-ready with a HIGH_ACCOUNT_VALUE pull recommendation', () => {
    const input = {
      accountScope: 'authenticated',
      isPartialAccount: false,
      readinessList: [
        {
          characterKey: 'Neuvillette',
          role: 'on_field_dps',
          score: 98,
          status: 'ready_for_target',
        },
        { characterKey: 'Furina', role: 'buffer_sub_dps', score: 96, status: 'ready_for_target' },
        { characterKey: 'Kazuha', role: 'vv_support', score: 94, status: 'ready_for_target' },
        { characterKey: 'Zhongli', role: 'shielder', score: 90, status: 'ready_for_target' },
      ],
      upgradesList: [],
      openDomainFamilies: [],
      endgameStatus: {
        abyssScore: 95,
        abyssReady: true,
        onslaughtReady: true,
        theaterMaxActs: 10,
      },
      pullAdvice: {
        targetCharacterKey: 'Mavuika',
        targetBannerName: 'Ancient Flame Ablaze',
        recommendation: 'HIGH_ACCOUNT_VALUE',
        keyReason: 'Universal Natlan Nightsoul burst DPS and off-field Pyro applicator.',
      },
    };

    const summary = calculateCompanionSummary(input);

    expect(summary.primaryAction.category).toBe('PULL_STRATEGY');
    expect(summary.primaryAction.headline).toContain('High Value Pull: Mavuika');
    expect(summary.primaryAction.targetRoute).toBe('/intelligence');

    const narrative = explainCompanionSummary(summary);
    expect(
      narrative.some((line) => line.includes('Wish Spending Advisory: Mavuika on banner')),
    ).toBe(true);
    expect(summary.teamSuggestion).toBeDefined();
    expect(summary.teamSuggestion?.teamName).toBe('Neuvillette Core');
    expect(summary.teamSuggestion?.members).toEqual(['Neuvillette', 'Furina', 'Kazuha', 'Zhongli']);
    expect(summary.teamSuggestion?.targetRoute).toBe('/teams');
    expect(
      narrative.some((line) =>
        line.includes('Recommended Lineup [Defensible Synergy]: Neuvillette Core'),
      ),
    ).toBe(true);
  });

  it('benchmark 4: handles safe degradation for empty roster and partial public showcase data', () => {
    const emptyShowcaseInput = {
      accountScope: 'public_showcase',
      isPartialAccount: true,
      readinessList: [],
      upgradesList: [],
      openDomainFamilies: [],
      endgameStatus: {
        abyssScore: 0,
        abyssReady: false,
        onslaughtReady: false,
        theaterMaxActs: 0,
      },
    };

    const summary = calculateCompanionSummary(emptyShowcaseInput);

    expect(summary.readyBuildsSummary.readyCount).toBe(0);
    expect(summary.readyBuildsSummary.totalAssessed).toBe(0);
    expect(summary.topMarginalInvestments).toEqual([]);
    expect(summary.isPartialAccount).toBe(true);
    expect(summary.missingDataCaveats.length).toBeGreaterThan(0);
    expect(summary.missingDataCaveats[0]).toContain('showcase');

    const narrative = explainCompanionSummary(summary);
    expect(
      narrative.some((line) => line.includes('Encounter Readiness: No characters assessed yet.')),
    ).toBe(true);
    expect(narrative.some((line) => line.includes('Data Gap Notice:'))).toBe(true);
  });

  it('benchmark 5: sub-100ms execution latency benchmark across 100 consecutive synthesis calculations', () => {
    // Generate a realistic 30-character roster and 15 upgrades
    const mockRoster = Array.from({ length: 30 }, (_, i) => ({
      characterKey: `Character_${i}`,
      role: i % 2 === 0 ? 'on_field_dps' : 'support',
      score: 50 + (i % 50),
      status: i % 3 === 0 ? 'ready_for_target' : 'conditional',
    }));

    const mockUpgrades = Array.from({ length: 15 }, (_, i) => ({
      characterKey: `Character_${i}`,
      actionType: i % 2 === 0 ? 'TALENT_UPGRADE' : 'WEAPON_ASCENSION',
      actionDetail: `Level ${i} -> ${i + 1}`,
      efficiencyScore: 10 + i * 4,
      domainFamily: `domain_family_${i % 5}`,
    }));

    const input = {
      accountScope: 'authenticated',
      isPartialAccount: false,
      readinessList: mockRoster,
      upgradesList: mockUpgrades,
      openDomainFamilies: ['domain_family_2', 'domain_family_4'],
      endgameStatus: {
        abyssScore: 78,
        abyssReady: true,
        onslaughtReady: false,
        theaterMaxActs: 8,
      },
      pullAdvice: {
        targetCharacterKey: 'Mavuika',
        targetBannerName: 'Ancient Flame Ablaze',
        recommendation: 'HIGH_ACCOUNT_VALUE',
        keyReason: 'Major DPS upgrade.',
      },
    };

    const iterations = 100;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      const res = calculateCompanionSummary(input);
      expect(res.readyBuildsSummary.totalAssessed).toBe(30);
    }

    const durationMs = performance.now() - start;
    const averageMs = durationMs / iterations;

    // Strict requirements: total < 100ms, average < 1ms
    expect(durationMs).toBeLessThan(100);
    expect(averageMs).toBeLessThan(1.0);
  });

  it('benchmark 6: fictional wish sandbox state machine transitions and isolation', () => {
    let session = createInitialWishSandboxSession();

    // Set scenario to Mavuika banner
    session = setBannerScenario(session, mavuikaBanner);
    expect(session.currentScenarioId).toBe('banner_mavuika');

    // Override pity to 73 (soft pity boundary)
    session = updatePityOverrides(session, mavuikaBanner, {
      pity5: 73,
      pity4: 8,
      guaranteed5: false,
    });
    expect(session.characterPity.pity5).toBe(73);

    // Build pull request for 10 pulls
    const req = buildSandboxPullRequest(session, mavuikaBanner, 10);
    expect(req.count).toBe(10);
    expect(req.currentPity5).toBe(73);
    expect(req.currentPity4).toBe(8);

    // Simulate outcome with a 5-star standard character (Jean) - triggers 50/50 loss
    const pullResult = {
      pulls: [
        { id: 'p1', type: '3_STAR', itemKey: 'DebateClub', itemKind: 'weapon', isFeatured: false },
        { id: 'p2', type: '5_STAR', itemKey: 'Jean', itemKind: 'character', isFeatured: false },
        { id: 'p3', type: '4_STAR', itemKey: 'Bennett', itemKind: 'character', isFeatured: true },
        { id: 'p4', type: '3_STAR', itemKey: 'CoolSteel', itemKind: 'weapon', isFeatured: false },
      ],
      endPity5: 2,
      endPity4: 1,
      endGuaranteed5: true, // Now guaranteed next 5-star
      endGuaranteed4: false,
      endFatePoints: 0,
    };

    session = applyWishResultToSession(session, mavuikaBanner, pullResult);
    expect(session.characterPity.pity5).toBe(2);
    expect(session.characterPity.guaranteed5).toBe(true);
    expect(session.stats.total5Stars).toBe(1);

    // Switch to weapon banner - character pity/guarantee must NOT leak into weapon banner
    session = setBannerScenario(session, weaponBanner);
    const wepPity = getActivePityForBanner(session, weaponBanner);
    expect(wepPity.pity5).toBe(0);
    expect(wepPity.guaranteed5).toBe(false);

    // Set path target to AThousandBlazingSuns
    session = setPathTarget(session, weaponBanner, 'AThousandBlazingSuns');
    expect(session.pathTargetKey).toBe('AThousandBlazingSuns');

    // Simulate getting EngulfingLightning (fate point lost to other featured weapon)
    const weaponPullResult = {
      pulls: [
        {
          id: 'w1',
          type: '5_STAR',
          itemKey: 'EngulfingLightning',
          itemKind: 'weapon',
          isFeatured: true,
        },
      ],
      endPity5: 0,
      endPity4: 0,
      endGuaranteed5: false,
      endGuaranteed4: false,
      endFatePoints: 1, // Fate point accumulated
    };

    session = applyWishResultToSession(session, weaponBanner, weaponPullResult);
    expect(session.weaponPity.fatePoints).toBe(1);

    // Changing path target resets Fate Points to 0
    session = setPathTarget(session, weaponBanner, 'EngulfingLightning');
    expect(session.weaponPity.fatePoints).toBe(0);

    // Verify 200-pull bounded retention: add 220 items
    const manyPulls = Array.from({ length: 220 }, (_, i) => ({
      id: `pull-${i}`,
      type: '3_STAR',
      itemKey: `Item_${i}`,
      itemKind: 'weapon',
      isFeatured: false,
    }));

    session = applyWishResultToSession(session, weaponBanner, {
      pulls: manyPulls,
      endPity5: 10,
      endPity4: 0,
      endGuaranteed5: false,
      endGuaranteed4: false,
      endFatePoints: 0,
    });

    expect(session.recentPulls.length).toBeLessThanOrEqual(MAX_RECENT_PULLS_RETAINED);
    expect(session.stats.totalPulls).toBe(4 + 1 + 220);
  });
});
