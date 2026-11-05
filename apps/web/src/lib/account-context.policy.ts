/** Product policy; equipment may change sooner and an old build may still be accurate. */
export const PUBLIC_BUILD_FRESHNESS = Object.freeze({
  maxAgeMs: 7 * 24 * 60 * 60 * 1000,
  futureToleranceMs: 5 * 60 * 1000,
});
