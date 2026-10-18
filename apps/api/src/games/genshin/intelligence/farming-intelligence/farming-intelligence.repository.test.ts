import { beforeEach, expect, it, vi } from 'vitest';

import { FarmingIntelligenceRepository } from './farming-intelligence.repository.js';

const mocks = vi.hoisted(() => ({ snapshot: vi.fn(), advice: vi.fn(), weekday: vi.fn() }));
vi.mock('../../../../platform/companion/plan.service.js', () => ({
  PlanService: class {
    getSnapshot = mocks.snapshot;
    getAdvice = mocks.advice;
  },
}));
vi.mock('../../../../platform/companion/companion-registry.service.js', () => ({
  companionRegistry: { getProvider: () => ({ getServerWeekday: mocks.weekday }) },
}));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.snapshot.mockResolvedValue({
    revision: 1,
    routineRevision: 2,
    goalRevisions: [{ id: 'own-goal', revision: 3 }],
    serverId: 'europe',
    period: { dailyPeriodId: 'own-day' },
  });
  mocks.advice.mockResolvedValue({
    revision: 1,
    routineRevision: 2,
    goalRevisions: [{ id: 'own-goal', revision: 3 }],
    dailyPeriodId: 'own-day',
    serverNow: '2026-10-17T12:00:00.000Z',
  });
  mocks.weekday.mockReturnValue(5);
});
it('passes only the authenticated owner to coherent reads and uses the advice timestamp', async () => {
  const response = await new FarmingIntelligenceRepository().read('owner-a');
  expect(response.serverId).toBe('europe');
  expect(response.weekday).toBe(5);
  expect(mocks.snapshot).toHaveBeenCalledWith('owner-a');
  expect(mocks.advice).toHaveBeenCalledWith('owner-a');
  expect(mocks.weekday).toHaveBeenCalledWith('europe', new Date('2026-10-17T12:00:00.000Z'));
});
it.each(['revision', 'routineRevision', 'goalRevisions', 'dailyPeriodId'])(
  'fails closed after bounded retries when %s changes',
  async (field) => {
    const value =
      field === 'goalRevisions'
        ? [{ id: 'changed', revision: 9 }]
        : field === 'dailyPeriodId'
          ? 'changed-day'
          : 9;
    mocks.advice.mockResolvedValue({
      revision: 1,
      routineRevision: 2,
      goalRevisions: [{ id: 'own-goal', revision: 3 }],
      dailyPeriodId: 'own-day',
      serverNow: '2026-10-17T12:00:00.000Z',
      [field]: value,
    });
    await expect(new FarmingIntelligenceRepository().read('owner-a')).rejects.toThrow(
      /plan changed/i,
    );
    expect(mocks.advice).toHaveBeenCalledTimes(2);
  },
);
