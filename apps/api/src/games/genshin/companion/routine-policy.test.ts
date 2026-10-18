/**
 * routine-policy.test.ts — Unit tests for pure routine projection helpers.
 *
 * No database access, no mocks needed — all functions are pure.
 */

import { describe, expect, it } from 'vitest';

import {
  buildPeriodMetadata,
  buildTaskDescriptors,
  MAX_RESIN,
  projectResinState,
  projectRoutineSnapshot,
  projectWeeklyClaimsState,
  RESIN_REGEN_MS,
} from './routine-policy.js';

// ============================================================
// projectResinState
// ============================================================

describe('projectResinState', () => {
  it('returns unknown when resinAmount is null', () => {
    const result = projectResinState(null, null, new Date());
    expect(result.known).toBe(false);
    if (!result.known) expect(result.reason).toBe('no_checkpoint');
  });

  it('returns unknown when resinRecordedAt is in the future', () => {
    const now = new Date('2026-09-27T10:00:00.000Z');
    const future = new Date('2026-09-27T11:00:00.000Z');
    const result = projectResinState(50, future, now);
    expect(result.known).toBe(false);
    if (!result.known) expect(result.reason).toBe('future_timestamp');
  });

  it('returns unknown for out-of-range amount', () => {
    const now = new Date('2026-09-27T10:00:00.000Z');
    const past = new Date('2026-09-27T09:00:00.000Z');
    const result = projectResinState(201, past, now);
    expect(result.known).toBe(false);
    if (!result.known) expect(result.reason).toBe('invalid_checkpoint');
  });

  it('returns the stored amount when no time has elapsed', () => {
    const now = new Date('2026-09-27T10:00:00.000Z');
    const result = projectResinState(100, now, now);
    expect(result.known).toBe(true);
    if (result.known) expect(result.currentAmount).toBe(100);
  });

  it('adds exactly 1 resin after one tick (8 minutes)', () => {
    const recordedAt = new Date('2026-09-27T10:00:00.000Z');
    const now = new Date(recordedAt.getTime() + RESIN_REGEN_MS);
    const result = projectResinState(100, recordedAt, now);
    expect(result.known).toBe(true);
    if (result.known) expect(result.currentAmount).toBe(101);
  });

  it('caps at MAX_RESIN (200) regardless of elapsed time', () => {
    const recordedAt = new Date('2026-09-27T10:00:00.000Z');
    // 300 ticks worth of time, but starting at 199 → caps at 200
    const now = new Date(recordedAt.getTime() + 300 * RESIN_REGEN_MS);
    const result = projectResinState(199, recordedAt, now);
    expect(result.known).toBe(true);
    if (result.known) {
      expect(result.currentAmount).toBe(MAX_RESIN);
      expect(result.capAt).toBeNull();
    }
  });

  it('returns non-null capAt when not yet capped', () => {
    const recordedAt = new Date('2026-09-27T10:00:00.000Z');
    const now = new Date(recordedAt.getTime() + RESIN_REGEN_MS); // 1 tick elapsed, 100+1=101
    const result = projectResinState(100, recordedAt, now);
    expect(result.known).toBe(true);
    if (result.known) {
      expect(result.capAt).not.toBeNull();
      // Cap should be in the future
      expect(new Date(result.capAt!).getTime()).toBeGreaterThan(now.getTime());
    }
  });

  it('returns 0 amount from 0 checkpoint with no time elapsed', () => {
    const now = new Date('2026-09-27T10:00:00.000Z');
    const result = projectResinState(0, now, now);
    expect(result.known).toBe(true);
    if (result.known) expect(result.currentAmount).toBe(0);
  });
});

// ============================================================
// projectWeeklyClaimsState
// ============================================================

describe('projectWeeklyClaimsState', () => {
  it('returns the stored claims when known', () => {
    const result = projectWeeklyClaimsState(3);
    expect(result.rewardClaims).toBe(3);
  });

  it('returns null claims when not set', () => {
    const result = projectWeeklyClaimsState(null);
    expect(result.rewardClaims).toBeNull();
  });

  it('always returns null discountedRemaining and nextRewardClaimCost (gate not closed)', () => {
    const result = projectWeeklyClaimsState(2);
    expect(result.discountedRemaining).toBeNull();
    expect(result.nextRewardClaimCost).toBeNull();
    expect(result.unavailableReason).not.toBeNull();
  });
});

// ============================================================
// buildTaskDescriptors
// ============================================================

describe('buildTaskDescriptors', () => {
  const now = new Date('2026-09-27T21:00:00.000Z'); // After daily reset

  const baseState = {
    commissionsDone: true,
    teapotChecked: false,
    transformerLastUsedAt: null as Date | null,
    dailyPeriodStart: new Date('2026-09-27T20:00:00.000Z'), // current period
  };

  it('returns commissions task with correct done state when period is current', () => {
    const tasks = buildTaskDescriptors(baseState, now, true);
    const commissions = tasks.find((t) => t.id === 'commissions')!;
    expect(commissions.done).toBe(true);
  });

  it('projects commissions as false when period has changed', () => {
    const stateWithOldPeriod = {
      ...baseState,
      dailyPeriodStart: new Date('2026-09-26T20:00:00.000Z'), // yesterday
    };
    const tasks = buildTaskDescriptors(stateWithOldPeriod, now, true);
    const commissions = tasks.find((t) => t.id === 'commissions')!;
    expect(commissions.done).toBe(false);
  });

  it('projects commissions as false when server is not selected', () => {
    const tasks = buildTaskDescriptors(baseState, now, false);
    const commissions = tasks.find((t) => t.id === 'commissions')!;
    expect(commissions.done).toBe(false);
  });

  it('returns transformer task with null done and correct lastRecordedAt', () => {
    const lastUsed = new Date('2026-09-25T10:00:00.000Z');
    const stateWithTransformer = { ...baseState, transformerLastUsedAt: lastUsed };
    const tasks = buildTaskDescriptors(stateWithTransformer, now, true);
    const transformer = tasks.find((t) => t.id === 'transformer')!;
    expect(transformer.done).toBeNull();
    expect(transformer.lastRecordedAt).toBe(lastUsed.toISOString());
  });

  it('returns transformer with null lastRecordedAt when never used', () => {
    const tasks = buildTaskDescriptors(baseState, now, true);
    const transformer = tasks.find((t) => t.id === 'transformer')!;
    expect(transformer.lastRecordedAt).toBeNull();
  });

  it('returns all three tasks', () => {
    const tasks = buildTaskDescriptors(baseState, now, true);
    expect(tasks.length).toBe(3);
    expect(tasks.map((t) => t.id)).toContain('commissions');
    expect(tasks.map((t) => t.id)).toContain('teapot');
    expect(tasks.map((t) => t.id)).toContain('transformer');
  });
});

// ============================================================
// buildPeriodMetadata
// ============================================================

describe('buildPeriodMetadata', () => {
  const now = new Date('2026-09-28T10:00:00.000Z'); // Monday 10:00 UTC

  it('returns null when serverId is null', () => {
    expect(buildPeriodMetadata(null, now)).toBeNull();
  });

  it('returns null when serverId is unknown (not asia)', () => {
    expect(buildPeriodMetadata('eu', now)).toBeNull();
  });

  it('returns period metadata when serverId is asia', () => {
    const meta = buildPeriodMetadata('asia', now);
    expect(meta).not.toBeNull();
    expect(meta!.serverId).toBe('asia');
    expect(meta!.serverWeekday).toBe(0); // Monday
    // Daily period should start at 2026-09-27T20:00:00Z (last 20:00 UTC)
    expect(meta!.dailyStart).toBe('2026-09-27T20:00:00.000Z');
    // Weekly period should start at 2026-09-27T20:00:00Z (last Sunday 20:00 UTC)
    expect(meta!.weeklyStart).toBe('2026-09-27T20:00:00.000Z');
    // Period IDs should include v1 policy version
    expect(meta!.dailyPeriodId).toContain('genshin:asia:v1:daily:');
    expect(meta!.weeklyPeriodId).toContain('genshin:asia:v1:weekly:');
  });
});

// ============================================================
// projectRoutineSnapshot
// ============================================================

describe('projectRoutineSnapshot', () => {
  const now = new Date('2026-09-28T10:00:00.000Z');

  it('returns contractVersion: 2', () => {
    const result = projectRoutineSnapshot({ routineRow: null, legacySummary: null, now });
    expect(result.contractVersion).toBe(2);
  });

  it('returns revision 0 and null serverId when no row exists', () => {
    const result = projectRoutineSnapshot({ routineRow: null, legacySummary: null, now });
    expect(result.revision).toBe(0);
    expect(result.serverId).toBeNull();
    expect(result.period).toBeNull();
  });

  it('returns unknown resin when no row exists', () => {
    const result = projectRoutineSnapshot({ routineRow: null, legacySummary: null, now });
    expect(result.resin.known).toBe(false);
  });

  it('returns known resin when a valid checkpoint exists', () => {
    const row = {
      userId: 'u1',
      revision: 3,
      serverId: 'asia',
      dailyPeriodStart: new Date('2026-09-27T20:00:00.000Z'),
      commissionsDone: true,
      teapotChecked: false,
      transformerLastUsedAt: null,
      resinAmount: 80,
      resinRecordedAt: now, // recorded at `now` means 0 elapsed ticks
      weeklyPeriodStart: new Date('2026-09-27T20:00:00.000Z'),
      weeklyRewardClaims: 2,
      createdAt: now,
      updatedAt: now,
    };
    const result = projectRoutineSnapshot({ routineRow: row, legacySummary: null, now });
    expect(result.resin.known).toBe(true);
    if (result.resin.known) expect(result.resin.currentAmount).toBe(80);
  });

  it('projects commissions as false when period has changed', () => {
    const row = {
      userId: 'u1',
      revision: 1,
      serverId: 'asia',
      dailyPeriodStart: new Date('2026-09-26T20:00:00.000Z'), // yesterday's period
      commissionsDone: true,
      teapotChecked: true,
      transformerLastUsedAt: null,
      resinAmount: null,
      resinRecordedAt: null,
      weeklyPeriodStart: null,
      weeklyRewardClaims: null,
      createdAt: now,
      updatedAt: now,
    };
    const result = projectRoutineSnapshot({ routineRow: row, legacySummary: null, now });
    const commissionsTask = result.tasks.find((t) => t.id === 'commissions')!;
    expect(commissionsTask.done).toBe(false);
  });

  it('projects weekly claims as null when weekly period has changed', () => {
    const row = {
      userId: 'u1',
      revision: 1,
      serverId: 'asia',
      dailyPeriodStart: new Date('2026-09-27T20:00:00.000Z'),
      commissionsDone: false,
      teapotChecked: false,
      transformerLastUsedAt: null,
      resinAmount: null,
      resinRecordedAt: null,
      weeklyPeriodStart: new Date('2026-09-13T20:00:00.000Z'), // 2 weeks ago
      weeklyRewardClaims: 5,
      createdAt: now,
      updatedAt: now,
    };
    const result = projectRoutineSnapshot({ routineRow: row, legacySummary: null, now });
    // Old period — weekly claims should project as null
    expect(result.weeklyClaims.rewardClaims).toBeNull();
  });

  it('includes legacy summary when provided', () => {
    const legacy = {
      hadLegacyResin: true,
      legacyResinAmount: 120,
      legacyResinUpdatedAt: '2026-09-27T10:00:00.000Z',
      legacyCommissionsDone: true,
      legacyTeapotClaimed: false,
      legacyTransformerClaimed: false,
      legacyDefeatedBossKeys: ['dvalin'],
    };
    const result = projectRoutineSnapshot({ routineRow: null, legacySummary: legacy, now });
    expect(result.legacy).toEqual(legacy);
  });
});
