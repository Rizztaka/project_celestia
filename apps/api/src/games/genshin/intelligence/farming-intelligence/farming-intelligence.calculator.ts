import type {
  FarmingPoint,
  FarmingRoute,
  FarmingSchedule,
  YieldProjection,
} from '@celestia/api-contracts';

export function estimateYield(
  needed: number[],
  stock: (number | null)[],
  rates: number[] | null,
): YieldProjection {
  if (
    !needed.length ||
    needed.length !== stock.length ||
    needed.some((n) => !Number.isSafeInteger(n) || n < 0) ||
    stock.some((n) => n !== null && (!Number.isSafeInteger(n) || n < 0)) ||
    (rates && (rates.length !== needed.length || rates.some((n) => !Number.isFinite(n) || n < 0)))
  )
    throw new RangeError();
  const result = (state: YieldProjection['state'], runs: number | null): YieldProjection => ({
    state,
    planningRuns: runs,
    resin: runs === null ? null : runs * 20,
    meanDrops: runs === null || !rates ? null : rates.map((n) => n * runs),
  });
  if (needed.some((n, i) => n > 0 && stock[i] === null)) return result('unknown_stock', null);
  function covered(runs: number) {
    let carry = 0;
    for (let i = 0; i < needed.length; i++) {
      const remaining = (stock[i] ?? 0) + (rates?.[i] ?? 0) * runs + carry - needed[i]!;
      if (remaining < -1e-9) return false;
      carry = Math.floor((remaining + 1e-9) / 3);
    }
    return true;
  }
  if (covered(0)) return result('covered', 0);
  if (!rates) return result('difficulty_required', null);
  let high = 1;
  while (!covered(high) && high < 100000000) high = Math.min(high * 2, 100000000);
  if (!covered(high)) return result('limit', null);
  let low = 0;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (covered(middle)) high = middle;
    else low = middle;
  }
  return result('estimated', high);
}

export function paceFamilies(
  families: { key: string; days: number[]; runs: number }[],
  budget: number | null,
  weekday: number | null,
): FarmingSchedule {
  const base = { start: 'next_server_reset' as const, days: [] as FarmingSchedule['days'] };
  if (
    budget === null ||
    weekday === null ||
    !Number.isInteger(budget) ||
    budget < 20 ||
    budget > 200 ||
    !Number.isInteger(weekday) ||
    weekday < 0 ||
    weekday > 6 ||
    families.some(
      (f) =>
        !Number.isSafeInteger(f.runs) ||
        f.runs < 0 ||
        !f.days.length ||
        f.days.some((d) => !Number.isInteger(d) || d < 0 || d > 6),
    )
  )
    return { ...base, state: 'unavailable', calendarDays: null };
  const remaining = families.map((f) => ({ ...f, runs: f.runs }));
  if (remaining.every((f) => f.runs === 0)) return { ...base, state: 'complete', calendarDays: 0 };
  for (let offset = 1; offset <= 3650; offset++) {
    const day = (weekday + offset) % 7;
    let capacity = Math.floor(budget / 20);
    const allocations: { domainKey: string; runs: number }[] = [];
    for (const family of remaining)
      if (family.days.includes(day) && family.runs > 0 && capacity > 0) {
        const runs = Math.min(family.runs, capacity);
        family.runs -= runs;
        capacity -= runs;
        allocations.push({ domainKey: family.key, runs });
      }
    if (offset <= 28)
      base.days.push({
        offset,
        weekday: day,
        resin: allocations.reduce((sum, a) => sum + a.runs * 20, 0),
        allocations,
      });
    if (remaining.every((f) => f.runs === 0))
      return { ...base, state: 'complete', calendarDays: offset };
  }
  return { ...base, state: 'exceeds_horizon', calendarDays: null };
}

const distance = (a: FarmingPoint, b: FarmingPoint) => Math.hypot(a.x - b.x, a.y - b.y);
export function routeDistance(start: FarmingPoint, points: FarmingPoint[]) {
  return points.reduce((sum, point, i) => sum + distance(i ? points[i - 1]! : start, point), 0);
}
export function optimizeStops(start: FarmingPoint, candidates: FarmingPoint[], maxStops: number) {
  if (
    !Number.isInteger(maxStops) ||
    maxStops < 1 ||
    maxStops > 20 ||
    [start, ...candidates].some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))
  )
    throw new RangeError();
  const unique = [...new Map(candidates.map((p) => [p.id, p])).values()].sort(
    (a, b) => distance(start, a) - distance(start, b) || a.id.localeCompare(b.id, 'en'),
  );
  const pool = unique.slice(0, maxStops);
  const ordered: FarmingPoint[] = [];
  let current = start;
  while (pool.length) {
    pool.sort(
      (a, b) => distance(current, a) - distance(current, b) || a.id.localeCompare(b.id, 'en'),
    );
    current = pool.shift()!;
    ordered.push(current);
  }
  const baselineDistance = routeDistance(start, ordered);
  // Bounded open-path 2-opt, keeping the chosen teleport fixed. No terrain model.
  for (let pass = 0; pass < 20; pass++) {
    let improved = false;
    for (let i = 0; i < ordered.length - 1; i++)
      for (let j = i + 1; j < ordered.length; j++) {
        const candidate = [
          ...ordered.slice(0, i),
          ...ordered.slice(i, j + 1).reverse(),
          ...ordered.slice(j + 1),
        ];
        if (routeDistance(start, candidate) + 1e-8 < routeDistance(start, ordered)) {
          ordered.splice(0, ordered.length, ...candidate);
          improved = true;
        }
      }
    if (!improved) break;
  }
  return {
    stops: ordered,
    mapDistance: routeDistance(start, ordered),
    baselineDistance,
    candidateCount: unique.length,
  };
}
export function emptyRoute(materialKey: string | null): FarmingRoute {
  return {
    available: false,
    materialKey,
    name: null,
    kind: null,
    start: null,
    stops: [],
    mapDistance: 0,
    baselineDistance: 0,
    candidateCount: 0,
  };
}
