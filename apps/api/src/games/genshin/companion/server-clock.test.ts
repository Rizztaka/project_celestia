/**
 * server-clock.test.ts — Unit tests for the Asia server clock helpers.
 *
 * Verified Asia policy: daily reset 20:00 UTC, weekly reset Sunday 20:00 UTC.
 * Game evidence is recorded in sources.md; tests verify only implementation.
 * All test dates are in UTC.
 */

import { describe, expect, it } from 'vitest';

import {
  buildPeriodId,
  getAsiaServerWeekday,
  getLastDailyBoundary,
  getLastWeeklyBoundary,
  getNextDailyBoundary,
  getNextWeeklyBoundary,
  isDailyPeriodCurrent,
  isWeeklyPeriodCurrent,
} from './server-clock.js';

// ============================================================
// getLastDailyBoundary
// ============================================================

describe('getLastDailyBoundary (Asia policy)', () => {
  it('returns today 20:00 UTC when called after the reset (same calendar day)', () => {
    // 2026-09-27 21:00 UTC — reset already happened at 20:00 UTC today
    const now = new Date('2026-09-27T21:00:00.000Z');
    const boundary = getLastDailyBoundary(now);
    expect(boundary.toISOString()).toBe('2026-09-27T20:00:00.000Z');
  });

  it('returns yesterday 20:00 UTC when called before the reset', () => {
    // 2026-09-27 19:59:59 UTC — reset hasn't happened yet today
    const now = new Date('2026-09-27T19:59:59.999Z');
    const boundary = getLastDailyBoundary(now);
    expect(boundary.toISOString()).toBe('2026-09-26T20:00:00.000Z');
  });

  it('returns the boundary itself when called exactly at 20:00 UTC', () => {
    // At the exact boundary instant, we are in the NEW period
    const now = new Date('2026-09-27T20:00:00.000Z');
    const boundary = getLastDailyBoundary(now);
    expect(boundary.toISOString()).toBe('2026-09-27T20:00:00.000Z');
  });

  it('returns last-month boundary correctly across month boundary', () => {
    // 2026-09-01 10:00 UTC — before reset, so returns 2026-08-31T20:00 UTC
    const now = new Date('2026-09-01T10:00:00.000Z');
    const boundary = getLastDailyBoundary(now);
    expect(boundary.toISOString()).toBe('2026-08-31T20:00:00.000Z');
  });
});

// ============================================================
// getNextDailyBoundary
// ============================================================

describe('getNextDailyBoundary (Asia policy)', () => {
  it("returns tomorrow 20:00 UTC when called after today's reset", () => {
    const now = new Date('2026-09-27T21:00:00.000Z');
    const boundary = getNextDailyBoundary(now);
    expect(boundary.toISOString()).toBe('2026-09-28T20:00:00.000Z');
  });

  it("returns today 20:00 UTC when called before today's reset", () => {
    const now = new Date('2026-09-27T19:00:00.000Z');
    const boundary = getNextDailyBoundary(now);
    expect(boundary.toISOString()).toBe('2026-09-27T20:00:00.000Z');
  });
});

// ============================================================
// getLastWeeklyBoundary
// ============================================================

describe('getLastWeeklyBoundary (Asia policy)', () => {
  it('returns most recent Sunday 20:00 UTC when called on a Monday', () => {
    // 2026-09-28 is a Monday UTC
    const now = new Date('2026-09-28T10:00:00.000Z');
    const boundary = getLastWeeklyBoundary(now);
    // Most recent Sunday 20:00 UTC = 2026-09-27T20:00:00Z
    expect(boundary.toISOString()).toBe('2026-09-27T20:00:00.000Z');
  });

  it('returns same Sunday 20:00 UTC when called on a Sunday after 20:00 UTC', () => {
    // 2026-09-27 is a Sunday, at 21:00 UTC — reset already happened
    const now = new Date('2026-09-27T21:00:00.000Z');
    const boundary = getLastWeeklyBoundary(now);
    expect(boundary.toISOString()).toBe('2026-09-27T20:00:00.000Z');
  });

  it('returns previous Sunday 20:00 UTC when called on Sunday before 20:00 UTC', () => {
    // 2026-09-27 is a Sunday, at 19:00 UTC — reset not happened yet
    const now = new Date('2026-09-27T19:00:00.000Z');
    const boundary = getLastWeeklyBoundary(now);
    // Previous Sunday = 2026-09-20T20:00:00Z
    expect(boundary.toISOString()).toBe('2026-09-20T20:00:00.000Z');
  });

  it('returns correct boundary on a Saturday', () => {
    // 2026-09-26 is a Saturday
    const now = new Date('2026-09-26T15:00:00.000Z');
    const boundary = getLastWeeklyBoundary(now);
    expect(boundary.toISOString()).toBe('2026-09-20T20:00:00.000Z');
  });

  it('returns correct boundary on a Thursday', () => {
    const now = new Date('2026-09-24T12:00:00.000Z');
    const boundary = getLastWeeklyBoundary(now);
    expect(boundary.toISOString()).toBe('2026-09-20T20:00:00.000Z');
  });
});

// ============================================================
// getNextWeeklyBoundary
// ============================================================

describe('getNextWeeklyBoundary (Asia policy)', () => {
  it('returns next Sunday 20:00 UTC when called on Monday', () => {
    const now = new Date('2026-09-28T10:00:00.000Z'); // Monday
    const boundary = getNextWeeklyBoundary(now);
    expect(boundary.toISOString()).toBe('2026-10-04T20:00:00.000Z');
  });

  it('returns current Sunday 20:00 UTC when called on Sunday before reset', () => {
    const now = new Date('2026-09-27T19:00:00.000Z'); // Sunday, before reset
    const boundary = getNextWeeklyBoundary(now);
    expect(boundary.toISOString()).toBe('2026-09-27T20:00:00.000Z');
  });
});

// ============================================================
// getAsiaServerWeekday
// ============================================================

describe('getAsiaServerWeekday (Asia policy)', () => {
  // Week: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
  const cases: [string, number, string][] = [
    // Monday 20:00 UTC = Tuesday reset boundary in Asia (game day advances to Tuesday)
    ['2026-09-28T20:00:00.000Z', 1, 'Tuesday at Asia reset boundary (Monday 20:00 UTC)'],
    ['2026-09-28T05:00:00.000Z', 0, 'Monday morning Asia time'],
    ['2026-09-27T21:00:00.000Z', 0, 'Sunday 21:00 UTC = Monday in Asia'],
    ['2026-09-27T20:00:00.000Z', 0, 'Sunday 20:00 UTC = Monday in Asia (boundary)'],
    ['2026-09-27T19:59:59.999Z', 6, 'Sunday 19:59 UTC = Sunday in Asia (still prev day)'],
    ['2026-09-26T20:00:00.000Z', 6, 'Saturday 20:00 UTC = Sunday in Asia'],
    ['2026-09-26T19:59:59.999Z', 5, 'Saturday 19:59 UTC = Saturday in Asia'],
    ['2026-09-29T10:00:00.000Z', 1, 'Tuesday in Asia'],
  ];

  for (const [isoString, expected, description] of cases) {
    it(`returns ${expected} for ${description}`, () => {
      const now = new Date(isoString);
      expect(getAsiaServerWeekday(now)).toBe(expected);
    });
  }
});

// ============================================================
// buildPeriodId
// ============================================================

describe('buildPeriodId', () => {
  it('builds a daily period ID with the correct format', () => {
    const boundary = new Date('2026-09-27T20:00:00.000Z');
    const id = buildPeriodId('daily', boundary);
    expect(id).toBe('genshin:asia:v1:daily:2026-09-27T20:00:00.000Z');
  });

  it('builds a weekly period ID with the correct format', () => {
    const boundary = new Date('2026-09-20T20:00:00.000Z');
    const id = buildPeriodId('weekly', boundary);
    expect(id).toBe('genshin:asia:v1:weekly:2026-09-20T20:00:00.000Z');
  });
});

// ============================================================
// isDailyPeriodCurrent / isWeeklyPeriodCurrent
// ============================================================

describe('isDailyPeriodCurrent', () => {
  it('returns true when stored period start matches current boundary', () => {
    const now = new Date('2026-09-27T21:00:00.000Z');
    const storedPeriodStart = new Date('2026-09-27T20:00:00.000Z');
    expect(isDailyPeriodCurrent(storedPeriodStart, now)).toBe(true);
  });

  it('returns false when stored period start is from the previous day', () => {
    const now = new Date('2026-09-27T21:00:00.000Z');
    const storedPeriodStart = new Date('2026-09-26T20:00:00.000Z'); // yesterday
    expect(isDailyPeriodCurrent(storedPeriodStart, now)).toBe(false);
  });

  it('returns false when storedPeriodStart is null', () => {
    const now = new Date('2026-09-27T21:00:00.000Z');
    expect(isDailyPeriodCurrent(null, now)).toBe(false);
  });
});

describe('isWeeklyPeriodCurrent', () => {
  it('returns true when stored weekly period matches current week', () => {
    const now = new Date('2026-09-28T10:00:00.000Z'); // Monday
    const storedPeriodStart = new Date('2026-09-27T20:00:00.000Z'); // last Sunday 20:00 UTC
    expect(isWeeklyPeriodCurrent(storedPeriodStart, now)).toBe(true);
  });

  it('returns false when stored weekly period is from last week', () => {
    const now = new Date('2026-09-28T10:00:00.000Z'); // Monday
    const storedPeriodStart = new Date('2026-09-20T20:00:00.000Z'); // prior Sunday
    expect(isWeeklyPeriodCurrent(storedPeriodStart, now)).toBe(false);
  });
});
