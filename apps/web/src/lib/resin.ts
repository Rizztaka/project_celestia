import type { ResinState } from '@celestia/api-contracts';

/** Advance the original checkpoint, preserving its partial regeneration tick. */
export function projectResin(resin: ResinState, nowMs: number): number | null {
  if (!resin.known) return null;
  const recorded = Date.parse(resin.recordedAt);
  if (
    !Number.isFinite(nowMs) ||
    !Number.isFinite(recorded) ||
    recorded > nowMs ||
    !Number.isInteger(resin.checkpointAmount) ||
    resin.checkpointAmount < 0 ||
    resin.checkpointAmount > resin.cap ||
    resin.regenIntervalMs <= 0
  )
    return null;
  return Math.min(
    resin.cap,
    resin.checkpointAmount + Math.floor((nowMs - recorded) / resin.regenIntervalMs),
  );
}

export function formatRemaining(end: string, nowMs: number): string {
  const minutes = Math.max(0, Math.ceil((Date.parse(end) - nowMs) / 60000));
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
