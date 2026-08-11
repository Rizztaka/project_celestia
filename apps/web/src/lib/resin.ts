/**
 * Resin utility library — Phase 3A.
 *
 * Genshin Impact resin rules:
 *   - Maximum: 200 resin.
 *   - Regeneration: 1 resin every 8 minutes (480 seconds).
 *   - No regeneration beyond the cap.
 *
 * The backend stores only a checkpoint: the amount at a specific timestamp.
 * All "current" values are projected forward in the browser. This eliminates
 * server polling entirely.
 */

const MAX_RESIN      = 200;
const REGEN_SECONDS  = 8 * 60; // 480 seconds per resin

/**
 * Computes the effective current resin from a stored checkpoint.
 *
 * @param storedAmount  The resin value recorded at updatedAt.
 * @param updatedAt     ISO 8601 timestamp of when the checkpoint was saved.
 * @returns             Current resin, capped at MAX_RESIN.
 */
export function computeCurrentResin(storedAmount: number, updatedAt: string): number {
  const elapsedSeconds = (Date.now() - new Date(updatedAt).getTime()) / 1000;
  const regenerated    = Math.floor(elapsedSeconds / REGEN_SECONDS);
  return Math.min(storedAmount + regenerated, MAX_RESIN);
}

/**
 * Computes seconds remaining until the next resin tick.
 * Useful for rendering a live sub-minute countdown.
 *
 * Returns 0 when resin is already at cap (no more ticks).
 */
export function secondsUntilNextResin(storedAmount: number, updatedAt: string): number {
  if (computeCurrentResin(storedAmount, updatedAt) >= MAX_RESIN) return 0;
  const elapsedSeconds = (Date.now() - new Date(updatedAt).getTime()) / 1000;
  return REGEN_SECONDS - (elapsedSeconds % REGEN_SECONDS);
}

/**
 * Computes the Date at which the resin cap will be reached.
 * Returns null if resin is already at max.
 */
export function resinFullAt(storedAmount: number, updatedAt: string): Date | null {
  const current = computeCurrentResin(storedAmount, updatedAt);
  if (current >= MAX_RESIN) return null;

  const remaining      = MAX_RESIN - current;
  const elapsedSeconds = (Date.now() - new Date(updatedAt).getTime()) / 1000;
  // Time to next tick + time for remaining-1 full ticks
  const secsToNextTick = REGEN_SECONDS - (elapsedSeconds % REGEN_SECONDS);
  const secsToFull     = secsToNextTick + (remaining - 1) * REGEN_SECONDS;

  return new Date(Date.now() + secsToFull * 1000);
}

/**
 * Formats a future Date into a human-readable "Xh Ym" string.
 * Example: "14h 32m", "0h 7m"
 */
export function formatTimeUntilFull(fullAt: Date | null): string {
  if (!fullAt) return "FULL";
  const totalMinutes = Math.ceil((fullAt.getTime() - Date.now()) / 60_000);
  const hours   = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export { MAX_RESIN, REGEN_SECONDS };
