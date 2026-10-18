import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatRemaining, projectResin } from '../../web/src/lib/resin.ts';
import { newestRoutine, routineExpired, routineNow } from '../../web/src/lib/routine-state.ts';

const instant = Date.parse('2026-09-27T19:59:59.999Z');
const received = (revision = 1, serverNow = instant, receivedAt = 100) => ({
  snapshot: {
    revision,
    serverNow: new Date(serverNow).toISOString(),
    period: {
      dailyEnd: '2026-09-27T20:00:00.000Z',
      weeklyEnd: '2026-09-27T20:00:00.000Z',
    },
  },
  receivedAt,
});
afterEach(() => vi.restoreAllMocks());

describe('Routine browser timing and confirmed-cache ordering', () => {
  it('rejects late lower revisions even if their projection time is newer', () => {
    const confirmed = received(5);
    expect(newestRoutine(confirmed, received(4, instant + 10000))).toBe(confirmed);
    expect(newestRoutine(confirmed, received(6))).toMatchObject({ snapshot: { revision: 6 } });
  });
  it('rejects out-of-order GET projections within a revision, allowing a newer reset projection', () => {
    const current = received(5, instant + 1);
    expect(newestRoutine(current, received(5, instant))).toBe(current);
    expect(newestRoutine(current, received(5, instant + 100))).not.toBe(current);
  });
  it('anchors to server time and monotonic elapsed time despite device clock jumps', () => {
    const snapshot = received();
    vi.spyOn(Date, 'now').mockReturnValue(instant + 30 * 86400000);
    expect(routineNow(snapshot, 1100)).toBe(instant + 1000);
    vi.mocked(Date.now).mockReturnValue(0);
    expect(routineNow(snapshot, 1100)).toBe(instant + 1000);
    expect(routineNow(snapshot, 90)).toBe(instant);
  });
  it('disables expired writes exactly at reset, including after an overnight pause', () => {
    const snapshot = received();
    expect(routineExpired(snapshot.snapshot, routineNow(snapshot, 100))).toBe(false);
    expect(routineExpired(snapshot.snapshot, routineNow(snapshot, 101))).toBe(true);
    expect(routineExpired(snapshot.snapshot, routineNow(snapshot, 86400100))).toBe(true);
    expect(routineExpired({ period: null }, instant)).toBe(false);
  });
  it('distinguishes unknown from explicit zero and preserves sub-tick time', () => {
    const resin = {
      known: true,
      checkpointAmount: 0,
      recordedAt: new Date(instant).toISOString(),
      regenIntervalMs: 480000,
      cap: 200,
    };
    expect(projectResin({ known: false }, instant)).toBeNull();
    expect(projectResin(resin, instant)).toBe(0);
    expect(projectResin(resin, instant + 479999)).toBe(0);
    expect(projectResin(resin, instant + 480000)).toBe(1);
    expect(projectResin(resin, instant + 480001)).toBe(1);
    expect(projectResin(resin, instant + 1000000000)).toBe(200);
    expect(projectResin(resin, instant - 1)).toBeNull();
    expect(formatRemaining(new Date(instant + 60000).toISOString(), instant)).toBe('0h 1m');
  });
});
