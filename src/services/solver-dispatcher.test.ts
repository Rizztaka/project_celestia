import { describe, it, expect, vi, afterEach } from 'vitest';
import { handleSolverWorkerMessage } from '../workers/solver-worker';
import { ABYSS_CYCLES } from '../data/abyss-schedules';
import { THEATER_SEASONS } from '../data/theater-seasons';
import { filterEligibleTheaterRoster } from '../engines/theater-solver';
import type { RecommendationExecutionContext } from '../types/genshin';

/**
 * Production worker-handler and `structuredClone` transport parity suite.
 *
 * Imports and invokes the actual production `handleSolverWorkerMessage` handler
 * wired to `self.onmessage` in `src/workers/solver-worker.ts`, applying `structuredClone`
 * on both inbound requests and outbound responses, and compares results against the
 * main-thread fallback path. Runs in Vitest (Node); does not execute an actual browser
 * Web Worker thread.
 */
describe('Solver Dispatcher — Production Worker Handler & structuredClone Parity (M9 Phase 3)', () => {
  const DETERMINISTIC_CONTEXT: RecommendationExecutionContext = {
    evaluatedAt: '2026-11-23',
  };

  const sampleRoster = [
    'Nefer',
    'Furina',
    'Nahida',
    'KukiShinobu',
    'Mavuika',
    'Yelan',
    'KaedeharaKazuha',
    'Bennett',
    'Xilonen',
    'Citlali',
    'Chasca',
    'Arlecchino',
    'RaidenShogun',
    'Xingqiu',
    'Zhongli',
  ];

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  function installProductionWorkerHandlerTransport(options?: { shouldFail?: boolean }) {
    let handlerInvocations = 0;

    class MockProductionHandlerTransport {
      onmessage: ((e: MessageEvent) => void) | null = null;
      onerror: ((err: unknown) => void) | null = null;

      postMessage(message: unknown) {
        handlerInvocations++;
        const clonedInbound = structuredClone(message);
        queueMicrotask(() => {
          if (options?.shouldFail) {
            this.onerror?.(new Error('Simulated worker transport failure'));
            return;
          }
          handleSolverWorkerMessage({ data: clonedInbound } as MessageEvent, (response) => {
            const clonedOutbound = structuredClone(response);
            this.onmessage?.({ data: clonedOutbound } as MessageEvent);
          });
        });
      }

      terminate() {
        // no-op
      }
    }

    vi.stubGlobal('window', {});
    vi.stubGlobal('Worker', MockProductionHandlerTransport);
    return { getInvocationCount: () => handlerInvocations };
  }

  it('safely imports solver-worker.ts when self is unavailable and invokes production handleSolverWorkerMessage', async () => {
    vi.resetModules();
    vi.stubGlobal('self', undefined);
    const workerMod = await import('../workers/solver-worker');
    expect(typeof workerMod.handleSolverWorkerMessage).toBe('function');

    const posted: unknown[] = [];
    workerMod.handleSolverWorkerMessage(
      {
        data: structuredClone({
          id: 99,
          type: 'UNKNOWN_SOLVER_TASK',
          payload: {},
        }),
      } as MessageEvent,
      (msg) => posted.push(structuredClone(msg)),
    );

    expect(posted).toHaveLength(1);
    expect(posted[0]).toEqual({
      id: 99,
      type: 'UNKNOWN_SOLVER_TASK',
      error: 'Unknown worker task type: UNKNOWN_SOLVER_TASK',
    });
  });

  it('proves production worker-handler vs. main-thread fallback parity for dispatchGenerateBestTeams (normal, empty, and invalid evaluatedAt)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-23T12:00:00Z'));

    vi.resetModules();
    vi.stubGlobal('Worker', undefined);
    const fallbackMod = await import('./solver-dispatcher');
    const fallbackNormal = await fallbackMod.dispatchGenerateBestTeams(
      sampleRoster,
      'Nefer',
      undefined,
      undefined,
      false,
      DETERMINISTIC_CONTEXT,
    );
    const fallbackEmpty = await fallbackMod.dispatchGenerateBestTeams(
      [],
      undefined,
      undefined,
      undefined,
      false,
      DETERMINISTIC_CONTEXT,
    );
    const fallbackInvalidDate = await fallbackMod.dispatchGenerateBestTeams(
      sampleRoster,
      'Nefer',
      undefined,
      undefined,
      false,
      { evaluatedAt: '2026-11-23T12:00:00' },
    );

    vi.resetModules();
    const tracker = installProductionWorkerHandlerTransport();
    const workerMod = await import('./solver-dispatcher');
    const workerNormal = await workerMod.dispatchGenerateBestTeams(
      sampleRoster,
      'Nefer',
      undefined,
      undefined,
      false,
      DETERMINISTIC_CONTEXT,
    );
    const workerEmpty = await workerMod.dispatchGenerateBestTeams(
      [],
      undefined,
      undefined,
      undefined,
      false,
      DETERMINISTIC_CONTEXT,
    );
    const workerInvalidDate = await workerMod.dispatchGenerateBestTeams(
      sampleRoster,
      'Nefer',
      undefined,
      undefined,
      false,
      { evaluatedAt: '2026-11-23T12:00:00' },
    );

    expect(tracker.getInvocationCount()).toBe(3);
    expect(workerNormal).toEqual(fallbackNormal);
    expect(workerNormal.items.length).toBeGreaterThan(0);
    expect(workerNormal.reliability.status).toBe('reliable');
    expect(workerNormal.reliability.evaluatedAt).toBe('2026-11-23');
    expect(Array.isArray(workerNormal)).toBe(false);
    expect('reliability' in workerNormal.items).toBe(false);

    expect(workerEmpty).toEqual(fallbackEmpty);
    expect(workerEmpty.items).toEqual([]);
    expect(workerEmpty.reliability.status).toBe('reliable');
    expect(workerEmpty.reliability.evaluatedAt).toBe('2026-11-23');

    expect(workerInvalidDate).toEqual(fallbackInvalidDate);
    expect(workerInvalidDate.reliability.status).toBe('unsupported');
    expect(workerInvalidDate.reliability.isActionable).toBe(false);
  });

  it('resolves identical default evaluatedAt across worker-handler and fallback when evaluatedAt is omitted', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-23T15:00:00Z'));

    vi.resetModules();
    vi.stubGlobal('Worker', undefined);
    const fallbackMod = await import('./solver-dispatcher');
    const fallbackRes = await fallbackMod.dispatchGenerateBestTeams(sampleRoster, 'Nefer');

    vi.resetModules();
    const tracker = installProductionWorkerHandlerTransport();
    const workerMod = await import('./solver-dispatcher');
    const workerRes = await workerMod.dispatchGenerateBestTeams(sampleRoster, 'Nefer');

    expect(tracker.getInvocationCount()).toBe(1);
    expect(workerRes).toEqual(fallbackRes);
    expect(workerRes.reliability.evaluatedAt).toBe('2026-11-23');
  });

  it('proves production worker-handler vs. main-thread fallback parity for dispatchSolveAbyss (normal + partial shortfall)', async () => {
    vi.resetModules();
    vi.stubGlobal('Worker', undefined);
    const fallbackMod = await import('./solver-dispatcher');
    const fallbackPlan = await fallbackMod.dispatchSolveAbyss(
      sampleRoster,
      undefined,
      ABYSS_CYCLES[0],
      DETERMINISTIC_CONTEXT,
    );
    const fallbackShortfall = await fallbackMod.dispatchSolveAbyss(
      ['Bennett'],
      undefined,
      ABYSS_CYCLES[0],
      DETERMINISTIC_CONTEXT,
    );

    vi.resetModules();
    const tracker = installProductionWorkerHandlerTransport();
    const workerMod = await import('./solver-dispatcher');
    const workerPlan = await workerMod.dispatchSolveAbyss(
      sampleRoster,
      undefined,
      ABYSS_CYCLES[0],
      DETERMINISTIC_CONTEXT,
    );
    const workerShortfall = await workerMod.dispatchSolveAbyss(
      ['Bennett'],
      undefined,
      ABYSS_CYCLES[0],
      DETERMINISTIC_CONTEXT,
    );

    expect(tracker.getInvocationCount()).toBe(2);
    expect(workerPlan.reliability).toEqual(fallbackPlan.reliability);
    expect(workerPlan.firstHalfTeam.members.map((m) => m.id)).toEqual(
      fallbackPlan.firstHalfTeam.members.map((m) => m.id),
    );
    expect(workerPlan.secondHalfTeam.members.map((m) => m.id)).toEqual(
      fallbackPlan.secondHalfTeam.members.map((m) => m.id),
    );
    expect(workerPlan.overallScore).toBe(fallbackPlan.overallScore);
    expect(workerShortfall.reliability).toEqual(fallbackShortfall.reliability);
  });

  it('proves production worker-handler vs. main-thread fallback parity for dispatchAutoDraftTheater', async () => {
    const activeSeason = THEATER_SEASONS[0];
    const eligible = filterEligibleTheaterRoster(sampleRoster, activeSeason).eligible;

    vi.resetModules();
    vi.stubGlobal('Worker', undefined);
    const fallbackMod = await import('./solver-dispatcher');
    const fallbackTheater = await fallbackMod.dispatchAutoDraftTheater(
      eligible,
      'Normal',
      activeSeason,
      undefined,
      undefined,
      DETERMINISTIC_CONTEXT,
    );

    vi.resetModules();
    const tracker = installProductionWorkerHandlerTransport();
    const workerMod = await import('./solver-dispatcher');
    const workerTheater = await workerMod.dispatchAutoDraftTheater(
      eligible,
      'Normal',
      activeSeason,
      undefined,
      undefined,
      DETERMINISTIC_CONTEXT,
    );

    expect(tracker.getInvocationCount()).toBe(1);
    expect(workerTheater).toEqual(fallbackTheater);
    expect(workerTheater.reliability.status).toBe('qualified');
    expect(workerTheater.reliability.isActionable).toBe(false);
    expect(workerTheater.seasonAnalysis?.reliability).toEqual(workerTheater.reliability);
    expect(workerTheater.reliability.evaluatedAt).toBe('2026-11-23');
  });

  it('preserves identical reliability when worker transport crashes and falls back to main thread', async () => {
    vi.resetModules();
    const tracker = installProductionWorkerHandlerTransport({ shouldFail: true });
    const spyError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mod = await import('./solver-dispatcher');
    const res = await mod.dispatchGenerateBestTeams(
      sampleRoster,
      'Nefer',
      undefined,
      undefined,
      false,
      DETERMINISTIC_CONTEXT,
    );

    expect(tracker.getInvocationCount()).toBe(1);
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.reliability.status).toBe('reliable');
    expect(res.reliability.evaluatedAt).toBe('2026-11-23');
    spyError.mockRestore();
  });
});
