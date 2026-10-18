/**
 * routine.service.test.ts — Unit tests for RoutineService.
 *
 * Tests the concurrency validation logic (revision, server, period ID checks),
 * period normalization on expired state, and the read-only snapshot path.
 *
 * Database is mocked via vi.mock. Clock is injected for determinism.
 * All mocks are established at the top level (no require() calls).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mock prisma.$transaction BEFORE importing anything that uses prisma ──────
const mockTransact = vi.fn();

vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    $transaction: (...args: unknown[]) => mockTransact(...args),
    genshinRoutineState: { findUnique: vi.fn() },
  },
}));

// ── Mock RoutineRepository ────────────────────────────────────────────────────
const mockFindByUserId = vi.fn();
const mockFindByUserIdInTx = vi.fn();
const mockCreateInTx = vi.fn();
const mockUpdateInTx = vi.fn();
const mockFindLegacyCompanion = vi.fn();
const mockFindLegacyWeeklyBossState = vi.fn();

vi.mock('./routine.repository.js', () => ({
  RoutineRepository: vi.fn().mockImplementation(() => ({
    findByUserId: mockFindByUserId,
    findByUserIdInTx: mockFindByUserIdInTx,
    createInTx: mockCreateInTx,
    updateInTx: mockUpdateInTx,
    findLegacyCompanion: mockFindLegacyCompanion,
    findLegacyWeeklyBossState: mockFindLegacyWeeklyBossState,
  })),
}));

// ── Now import the modules under test ────────────────────────────────────────
import { GenshinCompanionProvider } from '../../games/genshin/companion/genshin-companion.provider.js';
import { companionRegistry } from './companion-registry.service.js';
import { RoutineRepository } from './routine.repository.js';
import { RoutineService } from './routine.service.js';

// Register provider once (safe; registry guards duplicate registrations)
try {
  companionRegistry.register(new GenshinCompanionProvider(false));
} catch {
  // Provider already registered in a previous test run (module hot-reload)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const FIXED_NOW = new Date('2026-09-28T10:00:00.000Z'); // Monday after weekly reset

function makeService(): RoutineService {
  const provider = companionRegistry.getProvider('genshin');
  const repo = new RoutineRepository();
  return new RoutineService(repo, provider, () => FIXED_NOW);
}

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'user-1',
    revision: 5,
    serverId: 'asia',
    dailyPeriodStart: new Date('2026-09-27T20:00:00.000Z'),
    commissionsDone: false,
    teapotChecked: false,
    transformerLastUsedAt: null,
    resinAmount: null,
    resinRecordedAt: null,
    weeklyPeriodStart: new Date('2026-09-27T20:00:00.000Z'),
    weeklyRewardClaims: null,
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
    ...overrides,
  };
}

// Simulate atomicWrite transaction: lock → callback → return
function mockTx(existingRow: unknown) {
  mockTransact.mockImplementationOnce(async (callback: (tx: unknown) => Promise<unknown>) => {
    const fakeTx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'user-1' }]),
      genshinPlanDismissal: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
      genshinPlanPreferences: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
    };
    mockFindByUserIdInTx.mockResolvedValueOnce(existingRow);
    return callback(fakeTx);
  });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockFindLegacyCompanion.mockResolvedValue(null);
  mockFindLegacyWeeklyBossState.mockResolvedValue(null);
});

// ============================================================
// READ PROJECTION
// ============================================================

describe('RoutineService.getSnapshot', () => {
  it('returns contractVersion 2 with revision 0 when no row exists', async () => {
    mockFindByUserId.mockResolvedValue(null);
    const service = makeService();
    const result = await service.getSnapshot('user-1');
    expect(result.contractVersion).toBe(2);
    expect(result.revision).toBe(0);
    expect(result.serverId).toBeNull();
  });

  it('returns the stored revision from an existing row', async () => {
    mockFindByUserId.mockResolvedValue(makeRow({ revision: 7 }));
    const service = makeService();
    const result = await service.getSnapshot('user-1');
    expect(result.revision).toBe(7);
  });

  it('does NOT call any write method during getSnapshot', async () => {
    mockFindByUserId.mockResolvedValue(null);
    const service = makeService();
    await service.getSnapshot('user-1');
    expect(mockCreateInTx).not.toHaveBeenCalled();
    expect(mockUpdateInTx).not.toHaveBeenCalled();
    expect(mockTransact).not.toHaveBeenCalled();
  });

  it('returns unknown resin when no checkpoint exists', async () => {
    mockFindByUserId.mockResolvedValue(makeRow({ resinAmount: null, resinRecordedAt: null }));
    const service = makeService();
    const result = await service.getSnapshot('user-1');
    expect(result.resin.known).toBe(false);
  });

  it('returns period as null when the injected provider is explicitly unverified', async () => {
    mockFindByUserId.mockResolvedValue(makeRow({ serverId: 'asia' }));
    const service = makeService();
    const result = await service.getSnapshot('user-1');
    // This test explicitly injects an unverified provider, independent of production defaults.
    expect(result.period).toBeNull();
  });

  it('uses the verified production default to expose Asia periods without writing', async () => {
    mockFindByUserId.mockResolvedValue(makeRow());
    const service = new RoutineService(
      new RoutineRepository(),
      new GenshinCompanionProvider(),
      () => FIXED_NOW,
    );
    const result = await service.getSnapshot('user-1');
    expect(result.clockStatus).toBe('available');
    expect(result.period).toMatchObject({
      dailyPeriodId: 'genshin:asia:v1:daily:2026-09-27T20:00:00.000Z',
      weeklyPeriodId: 'genshin:asia:v1:weekly:2026-09-27T20:00:00.000Z',
    });
    expect(mockTransact).not.toHaveBeenCalled();
    expect(mockUpdateInTx).not.toHaveBeenCalled();
  });
});

// ============================================================
// patchSettings — revision validation
// ============================================================

describe('RoutineService.patchSettings', () => {
  it('throws 409 STALE_REVISION when expectedRevision does not match', async () => {
    mockTx(makeRow({ revision: 5 }));
    const service = makeService();
    await expect(
      service.patchSettings('user-1', {
        contractVersion: 2,
        expectedRevision: 3, // wrong — stored is 5
        serverId: 'asia',
      }),
    ).rejects.toMatchObject({ errorCode: 'COMPANION_STALE_REVISION', statusCode: 409 });
    expect(mockCreateInTx).not.toHaveBeenCalled();
    expect(mockUpdateInTx).not.toHaveBeenCalled();
  });

  it('creates a row when none exists and revision 0 is provided', async () => {
    const savedRow = makeRow({ revision: 1, serverId: 'asia' });
    mockCreateInTx.mockResolvedValue(savedRow);
    mockTx(null); // no existing row

    const service = makeService();
    const result = await service.patchSettings('user-1', {
      contractVersion: 2,
      expectedRevision: 0,
      serverId: 'asia',
    });

    expect(mockCreateInTx).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: 'user-1', revision: 1, serverId: 'asia' }),
    );
    expect(result.contractVersion).toBe(2);
  });

  it('updates the row and increments revision when row exists', async () => {
    const existingRow = makeRow({ revision: 5, serverId: null });
    const savedRow = makeRow({ revision: 6, serverId: 'asia' });
    mockUpdateInTx.mockResolvedValue(savedRow);
    mockTx(existingRow);

    const service = makeService();
    await service.patchSettings('user-1', {
      contractVersion: 2,
      expectedRevision: 5,
      serverId: 'asia',
    });

    expect(mockUpdateInTx).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      expect.objectContaining({ revision: 6, serverId: 'asia' }),
    );
  });
});

// ============================================================
// patchChecklist — setDaily rejected when clock gate closed=false
// ============================================================

describe('RoutineService.patchChecklist — setDaily clock gate enforcement', () => {
  it('throws 400 CLOCK_UNAVAILABLE for setDaily when clock gate is not closed', async () => {
    mockTx(makeRow({ revision: 2, serverId: 'asia' }));
    const service = makeService();
    await expect(
      service.patchChecklist('user-1', {
        contractVersion: 2,
        expectedRevision: 2,
        serverId: 'asia',
        dailyPeriodId: 'genshin:asia:v1:daily:2026-09-27T20:00:00.000Z',
        action: 'setDaily',
        commissionsDone: true,
      }),
    ).rejects.toMatchObject({ errorCode: 'COMPANION_CLOCK_UNAVAILABLE', statusCode: 400 });
    expect(mockCreateInTx).not.toHaveBeenCalled();
    expect(mockUpdateInTx).not.toHaveBeenCalled();
  });

  it('throws 400 CLOCK_UNAVAILABLE for setDaily when serverId null', async () => {
    mockTx(makeRow({ revision: 1, serverId: null }));
    const service = makeService();
    await expect(
      service.patchChecklist('user-1', {
        contractVersion: 2,
        expectedRevision: 1,
        serverId: null,
        dailyPeriodId: null,
        action: 'setDaily',
        commissionsDone: true,
      }),
    ).rejects.toMatchObject({ errorCode: 'COMPANION_CLOCK_UNAVAILABLE', statusCode: 400 });
  });
});

// ============================================================
// patchChecklist — Transformer (allowed without server/clock)
// ============================================================

describe('RoutineService.patchChecklist — Transformer actions', () => {
  it('recordTransformerUse succeeds without server selection', async () => {
    const existingRow = makeRow({ revision: 3, serverId: null });
    const savedRow = { ...existingRow, revision: 4, transformerLastUsedAt: FIXED_NOW };
    mockUpdateInTx.mockResolvedValue(savedRow);
    mockTx(existingRow);

    const service = makeService();
    await service.patchChecklist('user-1', {
      contractVersion: 2,
      expectedRevision: 3,
      serverId: null,
      dailyPeriodId: null,
      action: 'recordTransformerUse',
    });

    expect(mockUpdateInTx).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      expect.objectContaining({ transformerLastUsedAt: FIXED_NOW, revision: 4 }),
    );
  });

  it('clearTransformerUse sets transformerLastUsedAt to null', async () => {
    const existingRow = makeRow({ revision: 4, serverId: null, transformerLastUsedAt: new Date() });
    const savedRow = { ...existingRow, revision: 5, transformerLastUsedAt: null };
    mockUpdateInTx.mockResolvedValue(savedRow);
    mockTx(existingRow);

    const service = makeService();
    await service.patchChecklist('user-1', {
      contractVersion: 2,
      expectedRevision: 4,
      serverId: null,
      dailyPeriodId: null,
      action: 'clearTransformerUse',
    });

    expect(mockUpdateInTx).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      expect.objectContaining({ transformerLastUsedAt: null, revision: 5 }),
    );
  });
});

// ============================================================
// patchResin — server-side timestamp enforcement
// ============================================================

describe('RoutineService.patchResin', () => {
  it('throws 409 STALE_REVISION on revision mismatch', async () => {
    mockTx(makeRow({ revision: 5 }));
    const service = makeService();
    await expect(
      service.patchResin('user-1', {
        contractVersion: 2,
        expectedRevision: 3,
        serverId: 'asia',
        dailyPeriodId: null,
        amount: 100,
      }),
    ).rejects.toMatchObject({ errorCode: 'COMPANION_STALE_REVISION' });
  });

  it('throws 409 SERVER_MISMATCH when serverId does not match stored', async () => {
    mockTx(makeRow({ revision: 2, serverId: null }));
    const service = makeService();
    await expect(
      service.patchResin('user-1', {
        contractVersion: 2,
        expectedRevision: 2,
        serverId: 'asia', // stored is null
        dailyPeriodId: null,
        amount: 100,
      }),
    ).rejects.toMatchObject({ errorCode: 'COMPANION_SERVER_MISMATCH' });
  });

  it('uses server-side now as resinRecordedAt (client provides only amount)', async () => {
    const existingRow = makeRow({ revision: 2, serverId: null });
    const savedRow = { ...existingRow, revision: 3, resinAmount: 80, resinRecordedAt: FIXED_NOW };
    mockUpdateInTx.mockResolvedValue(savedRow);
    mockTx(existingRow);

    const service = makeService();
    await service.patchResin('user-1', {
      contractVersion: 2,
      expectedRevision: 2,
      serverId: null,
      dailyPeriodId: null,
      amount: 80,
    });

    expect(mockUpdateInTx).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      expect.objectContaining({ resinRecordedAt: FIXED_NOW, resinAmount: 80 }),
    );
  });

  it('creates first row when no row exists and amount is valid zero', async () => {
    const savedRow = makeRow({
      revision: 1,
      serverId: null,
      resinAmount: 0,
      resinRecordedAt: FIXED_NOW,
    });
    mockCreateInTx.mockResolvedValue(savedRow);
    mockTx(null);

    const service = makeService();
    const result = await service.patchResin('user-1', {
      contractVersion: 2,
      expectedRevision: 0,
      serverId: null,
      dailyPeriodId: null,
      amount: 0,
    });

    expect(mockCreateInTx).toHaveBeenCalled();
    expect(result.resin.known).toBe(true);
    if (result.resin.known) expect(result.resin.currentAmount).toBe(0);
  });
});

// ============================================================
// GET safety: no write path reachable from getSnapshot
// ============================================================

describe('GET read-safety', () => {
  it('samples the injected clock once for the complete read snapshot', async () => {
    mockFindByUserId.mockResolvedValue(null);
    const clock = vi.fn(() => FIXED_NOW);
    const service = new RoutineService(
      new RoutineRepository(),
      new GenshinCompanionProvider(),
      clock,
    );
    expect((await service.getSnapshot('user-1')).serverNow).toBe(FIXED_NOW.toISOString());
    expect(clock).toHaveBeenCalledTimes(1);
  });
  it('getSnapshot never calls $transaction', async () => {
    mockFindByUserId.mockResolvedValue(null);
    const service = makeService();
    await service.getSnapshot('user-1');
    expect(mockTransact).not.toHaveBeenCalled();
  });

  it('repeated getSnapshot calls do not accumulate writes', async () => {
    mockFindByUserId.mockResolvedValue(makeRow({ revision: 3 }));
    const service = makeService();
    await service.getSnapshot('user-1');
    await service.getSnapshot('user-1');
    await service.getSnapshot('user-1');
    expect(mockCreateInTx).not.toHaveBeenCalled();
    expect(mockUpdateInTx).not.toHaveBeenCalled();
  });

  it('getSnapshot on expired-period row does not write', async () => {
    // Row has yesterday's period — projection should show false but no write
    const staleRow = makeRow({
      revision: 2,
      dailyPeriodStart: new Date('2026-09-20T20:00:00.000Z'), // 8 days ago
      commissionsDone: true,
      teapotChecked: true,
    });
    mockFindByUserId.mockResolvedValue(staleRow);
    const service = makeService();
    const result = await service.getSnapshot('user-1');
    // The explicitly unverified provider suppresses task availability.
    expect(result.tasks.find((t) => t.id === 'commissions')?.done).toBe(false);
    expect(mockTransact).not.toHaveBeenCalled();
  });
});

describe('Service boundary validation', () => {
  it('rejects forged timestamps and empty daily actions before opening a transaction', () => {
    const service = makeService();
    const common = { contractVersion: 2, expectedRevision: 0, serverId: null, dailyPeriodId: null };
    expect(() =>
      service.patchResin('user-1', { ...common, amount: 0, recordedAt: FIXED_NOW.toISOString() }),
    ).toThrow();
    expect(() => service.patchChecklist('user-1', { ...common, action: 'setDaily' })).toThrow();
    expect(() =>
      service.patchSettings('user-1', {
        contractVersion: 2,
        expectedRevision: 0,
        serverId: 'asia',
        userId: 'victim',
      }),
    ).toThrow();
    expect(mockTransact).not.toHaveBeenCalled();
  });
  it('does not expose an unsupported stored server as a typed supported selection', async () => {
    mockFindByUserId.mockResolvedValue(makeRow({ serverId: 'unsupported-fixture' }));
    const snapshot = await makeService().getSnapshot('user-1');
    expect(snapshot).toMatchObject({ serverId: null, period: null, clockStatus: 'unsupported' });
  });
});
