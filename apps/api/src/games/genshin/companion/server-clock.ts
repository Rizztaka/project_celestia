/** Fixed server offsets; resets occur at 04:00 server time, Monday for weeks.
 * Explicit time inputs keep calculations independent of the host timezone/DST.
 * Asia defaults and v1 period IDs are retained for existing callers and records.
 */
import { SERVER_POLICIES, type SupportedServerId } from '@celestia/api-contracts';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
export const ASIA_UTC_OFFSET_MS = 8 * HOUR;
export const DAILY_RESET_LOCAL_HOUR = 4;
export const DAILY_RESET_UTC_HOUR = 20;
export const CLOCK_POLICY_VERSION = 'v1';
export const ASIA_SERVER_ID = 'asia' as const;

export function buildPeriodId(
  cadence: 'daily' | 'weekly',
  boundaryUtc: Date,
  serverId: SupportedServerId = ASIA_SERVER_ID,
): string {
  return `genshin:${serverId}:${CLOCK_POLICY_VERSION}:${cadence}:${boundaryUtc.toISOString()}`;
}

export function getLastDailyBoundary(
  now: Date,
  serverId: SupportedServerId = ASIA_SERVER_ID,
): Date {
  const shift = (SERVER_POLICIES[serverId].utcOffsetHours - DAILY_RESET_LOCAL_HOUR) * HOUR;
  return new Date(Math.floor((now.getTime() + shift) / DAY) * DAY - shift);
}

export function getNextDailyBoundary(
  now: Date,
  serverId: SupportedServerId = ASIA_SERVER_ID,
): Date {
  return new Date(getLastDailyBoundary(now, serverId).getTime() + DAY);
}

/** 0=Monday … 6=Sunday for the game day, which begins at 04:00. */
export function getServerWeekday(now: Date, serverId: SupportedServerId): number {
  const shift = (SERVER_POLICIES[serverId].utcOffsetHours - DAILY_RESET_LOCAL_HOUR) * HOUR;
  return (new Date(now.getTime() + shift).getUTCDay() + 6) % 7;
}

export function getAsiaServerWeekday(now: Date): number {
  return getServerWeekday(now, ASIA_SERVER_ID);
}

export function getLastWeeklyBoundary(
  now: Date,
  serverId: SupportedServerId = ASIA_SERVER_ID,
): Date {
  return new Date(
    getLastDailyBoundary(now, serverId).getTime() - getServerWeekday(now, serverId) * DAY,
  );
}

export function getNextWeeklyBoundary(
  now: Date,
  serverId: SupportedServerId = ASIA_SERVER_ID,
): Date {
  return new Date(getLastWeeklyBoundary(now, serverId).getTime() + 7 * DAY);
}

export function isDailyPeriodCurrent(
  storedPeriodStart: Date | null,
  now: Date,
  serverId: SupportedServerId = ASIA_SERVER_ID,
): boolean {
  return storedPeriodStart?.getTime() === getLastDailyBoundary(now, serverId).getTime();
}

export function isWeeklyPeriodCurrent(
  storedPeriodStart: Date | null,
  now: Date,
  serverId: SupportedServerId = ASIA_SERVER_ID,
): boolean {
  return storedPeriodStart?.getTime() === getLastWeeklyBoundary(now, serverId).getTime();
}
