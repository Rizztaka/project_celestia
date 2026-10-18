import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  genshinAccount: { findUnique: vi.fn() },
  genshinRoutineState: { findUnique: vi.fn() },
  dailyCompanion: { findUnique: vi.fn() },
  weeklyBossState: { findUnique: vi.fn() },
  upgradeGoal: { findMany: vi.fn() },
  genshinMaterial: { findMany: vi.fn() },
}));
vi.mock('@/core/db/prisma.js', () => ({ prisma: db }));
vi.mock('../intelligence/character-intelligence/character-intelligence.service.js', () => ({
  CharacterIntelligenceService: class {
    async getRecommendations() {
      return { recommendations: [] };
    }
  },
}));

import { companionRegistry } from '../../../platform/companion/companion-registry.service.js';
import { GoalService } from '../../../platform/companion/goal.service.js';
import { PlannerIntelligenceService } from '../intelligence/planner-intelligence/planner-intelligence.service.js';
import { GenshinCompanionProvider } from './genshin-companion.provider.js';

const provider = new GenshinCompanionProvider();
companionRegistry.register(provider);
const now = new Date('2026-09-27T20:00:00.000Z');
function routine(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'owner',
    revision: 1,
    serverId: 'asia',
    dailyPeriodStart: null,
    commissionsDone: false,
    teapotChecked: false,
    weeklyPeriodStart: null,
    weeklyRewardClaims: null,
    resinAmount: null,
    resinRecordedAt: null,
    transformerLastUsedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.clearAllMocks();
  db.genshinAccount.findUnique.mockResolvedValue({ id: 'account' });
  db.genshinRoutineState.findUnique.mockResolvedValue(routine());
  db.dailyCompanion.findUnique.mockResolvedValue(null);
  db.weeklyBossState.findUnique.mockResolvedValue(null);
  db.upgradeGoal.findMany.mockResolvedValue([]);
  db.genshinMaterial.findMany.mockResolvedValue([]);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Routine indirect read consumers', () => {
  it('Today Domains refuses an unselected server without creating a routine', async () => {
    db.genshinRoutineState.findUnique.mockResolvedValue(null);
    await expect(new GoalService().getTodayDomains('owner')).rejects.toMatchObject({
      statusCode: 422,
    });
    expect(db.genshinRoutineState.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { userId: 'owner' },
    });
  });
  it('Today Domains samples its injected clock once and uses the provider weekday at reset', async () => {
    const clock = vi.fn(() => now);
    const weekday = vi.spyOn(provider, 'getServerWeekday');
    const result = await new GoalService(clock).getTodayDomains('owner');
    expect(result.serverDay).toBe('Monday');
    expect(clock).toHaveBeenCalledTimes(1);
    expect(weekday).toHaveBeenCalledExactlyOnceWith('asia', now);
  });
  it('Planner reports actionable unknown resin instead of allocating zero', async () => {
    await expect(
      new PlannerIntelligenceService().getRecommendations('owner'),
    ).rejects.toMatchObject({
      statusCode: 422,
      message: expect.stringContaining('record your current resin'),
    });
    expect(db.upgradeGoal.findMany).not.toHaveBeenCalled();
  });
  it('Planner accepts an explicit zero and uses the snapshot time for weekday and analysis', async () => {
    db.genshinRoutineState.findUnique.mockResolvedValue(
      routine({ resinAmount: 0, resinRecordedAt: now }),
    );
    db.upgradeGoal.findMany.mockResolvedValue([
      {
        status: 'active',
        priority: 3,
        revision: 0,
        createdAt: now,
        updatedAt: now,
        id: 'goal',
        userId: 'owner',
        goalType: 'CHARACTER_ASCENSION',
        targetKey: 'HuTao',
        fromPhase: 0,
        toPhase: 1,
        talentType: null,
      },
    ]);
    const weekday = vi.spyOn(provider, 'getServerWeekday');
    const result = await new PlannerIntelligenceService().getRecommendations('owner');
    expect(result).toMatchObject({
      currentResin: 0,
      route: [],
      unallocatedResin: 0,
      analysedAt: now.toISOString(),
    });
    expect(weekday).toHaveBeenCalledExactlyOnceWith('asia', now);
  });
  it('both consumers reject unavailable clock even with selected server and confirmed resin', async () => {
    db.genshinRoutineState.findUnique.mockResolvedValue(
      routine({ resinAmount: 80, resinRecordedAt: now }),
    );
    vi.spyOn(provider, 'getServerWeekday').mockReturnValue(null);
    await expect(new GoalService().getTodayDomains('owner')).rejects.toMatchObject({
      statusCode: 422,
      message: expect.stringContaining('verified clock'),
    });
    await expect(
      new PlannerIntelligenceService().getRecommendations('owner'),
    ).rejects.toMatchObject({
      statusCode: 422,
      message: expect.stringContaining('verified clock'),
    });
  });
});
