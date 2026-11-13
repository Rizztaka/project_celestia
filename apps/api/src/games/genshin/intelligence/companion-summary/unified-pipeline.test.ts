import { GoalType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    genshinAccount: {
      findUnique: vi.fn(),
    },
    genshinPlanPreferences: {
      findUnique: vi.fn(),
    },
    genshinPlanDismissal: {
      findMany: vi.fn(),
    },
    upgradeGoal: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/core/db/prisma.js';

import { companionRegistry } from '../../../../platform/companion/companion-registry.service.js';
import type { RoutineService } from '../../../../platform/companion/routine.service.js';
import { AccountContextProvider } from '../../account-data/account-context-provider.service.js';
import { GenshinCompanionProvider } from '../../companion/genshin-companion.provider.js';
import type { GenshinRecordedStockRepository } from '../../companion/recorded-stock.repository.js';
import { EndgameIntelligenceService } from '../endgame-intelligence/endgame-intelligence.service.js';
import { PlannerIntelligenceService } from '../planner-intelligence/planner-intelligence.service.js';
import { TeamIntelligenceService } from '../team-intelligence/team-intelligence.service.js';
import { CompanionSummaryService } from './companion-summary.service.js';

companionRegistry.register(new GenshinCompanionProvider());

function makeTwelveCharacterRoster() {
  const characters = [
    { key: 'HuTao', normal: 8, skill: 8, burst: 6, level: 80, asc: 5, weapon: 'DragonsBane' },
    { key: 'Xingqiu', normal: 1, skill: 8, burst: 8, level: 80, asc: 5, weapon: 'FavoniusSword' },
    { key: 'Bennett', normal: 1, skill: 1, burst: 8, level: 80, asc: 5, weapon: 'FavoniusSword' },
    {
      key: 'KaedeharaKazuha',
      normal: 6,
      skill: 8,
      burst: 8,
      level: 90,
      asc: 6,
      weapon: 'IronSting',
    },
    {
      key: 'Nahida',
      normal: 1,
      skill: 9,
      burst: 8,
      level: 90,
      asc: 6,
      weapon: 'SacrificialFragments',
    },
    {
      key: 'SangonomiyaKokomi',
      normal: 6,
      skill: 8,
      burst: 8,
      level: 85,
      asc: 5,
      weapon: 'ThrillingTales',
    },
    { key: 'KukiShinobu', normal: 1, skill: 8, burst: 6, level: 90, asc: 6, weapon: 'IronSting' },
    { key: 'Yelan', normal: 1, skill: 8, burst: 8, level: 90, asc: 6, weapon: 'FavoniusWarbow' },
    {
      key: 'KamisatoAyaka',
      normal: 8,
      skill: 8,
      burst: 8,
      level: 90,
      asc: 6,
      weapon: 'AmenomaKageuchi',
    },
    { key: 'Mona', normal: 1, skill: 6, burst: 8, level: 80, asc: 5, weapon: 'FavoniusCodex' },
    { key: 'Diona', normal: 1, skill: 8, burst: 8, level: 80, asc: 5, weapon: 'SacrificialBow' },
    { key: 'Zhongli', normal: 1, skill: 8, burst: 8, level: 90, asc: 6, weapon: 'BlackTassel' },
  ];

  return characters.map((c, idx) => ({
    id: `char-${idx + 1}`,
    accountId: 'acc-1',
    characterKey: c.key,
    level: c.level,
    ascension: c.asc,
    constellation: 1,
    talentNormal: c.normal,
    talentSkill: c.skill,
    talentBurst: c.burst,
    equippedWeaponId: `weap-${idx + 1}`,
    equippedWeapon: {
      id: `weap-${idx + 1}`,
      accountId: 'acc-1',
      weaponKey: c.weapon,
      level: 90,
      ascension: 6,
      refinement: 5,
      locked: true,
      createdAt: new Date('2026-10-20T00:00:00Z'),
      updatedAt: new Date('2026-10-20T00:00:00Z'),
    },
    createdAt: new Date('2026-10-20T00:00:00Z'),
    updatedAt: new Date('2026-10-20T00:00:00Z'),
  }));
}

describe('One Unified Optimization Pipeline (Companion Summary + Planner)', () => {
  let summaryService: CompanionSummaryService;
  let plannerService: PlannerIntelligenceService;
  let mockContextProvider: { getForUser: ReturnType<typeof vi.fn> };
  let mockStockRepository: { readForUser: ReturnType<typeof vi.fn> };
  let mockRoutineService: { getSnapshot: ReturnType<typeof vi.fn> };
  let realEndgameService: EndgameIntelligenceService;
  let realTeamService: TeamIntelligenceService;

  // Tuesday in Asia server time (Taishan Mansion Diligence / Gold is open)
  const TUESDAY_SERVER_NOW = '2026-11-10T10:00:00.000Z';

  beforeEach(() => {
    vi.clearAllMocks();

    mockContextProvider = {
      getForUser: vi.fn().mockResolvedValue({
        context: {
          version: 1,
          scope: 'private_authenticated',
          uid: '800000001',
          accountId: 'acc-1',
          rosterScope: 'complete',
          completenessEvidence: null,
          absentCharacterOwnership: 'known_absent',
          sources: ['stored_account'],
          oldestObservationAt: null,
          newestObservationAt: null,
          mixedObservationTimes: false,
          equipmentExclusivity: 'verified_exclusive',
          rejectedRecordCount: 0,
          freshnessPolicy: { maxAgeMs: 604800000, futureToleranceMs: 300000 },
          sourceTimestamps: [],
          missingData: [],
          characters: [],
          issues: [],
          fingerprint: 'fp-1',
          freshness: 'fresh',
        },
        rawRoster: makeTwelveCharacterRoster(),
        weapons: [],
        artifacts: [],
      }),
    };

    mockStockRepository = {
      readForUser: vi.fn().mockResolvedValue({
        inventory: {
          // 0 Diligence owned -> 100% material deficit
          TeachingsOfDiligence: 0,
          GuideToDiligence: 0,
          PhilosophiesOfDiligence: 0,
        },
        stockBasis: {
          kind: 'recorded_import',
          importedAt: '2026-11-09T00:00:00.000Z',
          source: 'GOOD',
          scope: 'replacement_section',
          suppliedEntryCount: 0,
        },
      }),
    };

    mockRoutineService = {
      getSnapshot: vi.fn().mockResolvedValue({
        contractVersion: 2,
        revision: 1,
        serverId: 'asia',
        clockStatus: 'verified',
        serverNow: TUESDAY_SERVER_NOW,
        period: {
          dailyPeriodId: 'daily-asia-2026-11-10',
          dailyResetAt: '2026-11-10T20:00:00.000Z',
          weeklyPeriodId: 'weekly-asia-2026-11-08',
          weeklyResetAt: '2026-11-15T20:00:00.000Z',
        },
        resin: {
          known: true,
          currentAmount: 160,
          maxAmount: 200,
          capAt: '2026-11-10T15:20:00.000Z',
          recordedAt: '2026-11-10T09:00:00.000Z',
        },
        tasks: [],
        weeklyClaims: { available: true, remainingClaims: 3 },
        legacySummary: null,
      }),
    };

    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValue({
      id: 'acc-1',
      userId: 'user-1',
      uid: '800000001',
      nickname: 'Traveler',
      adventureRank: 60,
      worldLevel: 8,
      createdAt: new Date('2026-10-20T00:00:00Z'),
      updatedAt: new Date('2026-10-20T00:00:00Z'),
    });

    vi.mocked(prisma.genshinPlanPreferences.findUnique).mockResolvedValue({
      userId: 'user-1',
      revision: 1,
      dailyResinBudget: 120,
      commissions: true,
      teapot: true,
      transformer: false,
      weeklyClaims: true,
    });

    vi.mocked(prisma.genshinPlanDismissal.findMany).mockResolvedValue([]);

    vi.mocked(prisma.upgradeGoal.findMany).mockResolvedValue([
      {
        id: 'goal-hutao-burst',
        userId: 'user-1',
        goalType: GoalType.CHARACTER_TALENT,
        targetKey: 'HuTao',
        talentType: 'burst',
        fromPhase: 6,
        toPhase: 8,
        priority: 1,
        status: 'active',
        revision: 1,
        completedAt: null,
        completionReason: null,
        predecessorId: null,
        createRequestId: null,
        createdAt: new Date('2026-10-20T00:00:00Z'),
        updatedAt: new Date('2026-10-20T00:00:00Z'),
      },
    ]);

    realEndgameService = new EndgameIntelligenceService();
    realTeamService = new TeamIntelligenceService(
      mockContextProvider as unknown as AccountContextProvider,
    );

    plannerService = new PlannerIntelligenceService(
      mockContextProvider as unknown as AccountContextProvider,
      mockStockRepository as unknown as GenshinRecordedStockRepository,
      mockRoutineService as unknown as RoutineService,
    );

    summaryService = new CompanionSummaryService(
      mockContextProvider as unknown as AccountContextProvider,
      undefined,
      realEndgameService,
      undefined,
      undefined,
      undefined,
      realTeamService,
      undefined,
      plannerService,
    );
  });

  it('a) CompanionSummaryService executes the multi-objective optimization pipeline incorporating resin budget, time budget, and inventory deficits', async () => {
    const spyGetOptimizedPlan = vi.spyOn(plannerService, 'getOptimizedPlan');

    const summary = await summaryService.getSummary('user-1');

    expect(spyGetOptimizedPlan).toHaveBeenCalledWith('user-1');
    expect(summary.primaryAction).toBeDefined();
    expect(summary.primaryAction.category).toBeDefined();
  }, 30000);

  it('b) summary.primaryAction matches the top allocated action from the optimizer schedule', async () => {
    const plannerResult = await plannerService.getRecommendations('user-1');
    const summary = await summaryService.getSummary('user-1');

    const opt = plannerResult.optimization as
      | { allocatedPlan?: Array<{ targetKey: string; timeGated?: boolean; actionType: string }> }
      | undefined;
    const topAllocatedAction =
      opt?.allocatedPlan?.[0] ?? plannerResult.optimization?.rankedPlan?.[0];
    expect(topAllocatedAction).toBeDefined();

    expect(summary.primaryAction.headline).toContain(topAllocatedAction!.targetKey);
    if (topAllocatedAction!.timeGated || topAllocatedAction!.actionType.startsWith('domain_')) {
      expect(summary.primaryAction.targetRoute).toBe('/planner?tab=farming');
    }
  }, 30000);

  it('c) when a high-deficit material domain is open today, the primary action prioritizes farming that domain (FARMING_AVAILABLE)', async () => {
    const summary = await summaryService.getSummary('user-1');

    expect(summary.primaryAction.category).toBe('FARMING_AVAILABLE');
    expect(summary.primaryAction.priority).toBe('HIGH');
    expect(summary.primaryAction.headline).toMatch(/^Today's Domain:/);
    expect(summary.primaryAction.headline).toContain('HuTao');
    expect(summary.primaryAction.targetRoute).toBe('/planner?tab=farming');
  }, 30000);

  it('d) an account with 0 manual goals receives a complete, coherent daily plan and hero recommendation driven by autonomous progression discovery', async () => {
    // Zero manual goals in database
    vi.mocked(prisma.upgradeGoal.findMany).mockResolvedValue([]);

    const summary = await summaryService.getSummary('user-1');

    expect(summary).toBeDefined();
    expect(summary.primaryAction).toBeDefined();
    // Must NOT throw 422, and must NOT fall back to generic "Balanced Standing" when under-invested units exist
    expect(['FARMING_AVAILABLE', 'BUILD_INVESTMENT']).toContain(summary.primaryAction.category);
    expect(summary.primaryAction.headline).not.toBe('Roster in Balanced Standing');
    expect(summary.topMarginalInvestments.length).toBeGreaterThan(0);
  }, 30000);
});
