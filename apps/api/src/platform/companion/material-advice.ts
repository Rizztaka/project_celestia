import type {
  AdviceGoalInput,
  GoalAdvice,
  MaterialAdviceResponse,
  RecordedStockSnapshot,
} from '@celestia/api-contracts';

type Entry = { goal: AdviceGoalInput; advice: GoalAdvice };

/** Reserve direct demand before crafting; spend each recorded item only once. */
export function projectMaterialAccounting(goals: Entry[], stock: RecordedStockSnapshot) {
  const needed: Record<string, number> = {};
  const sources: MaterialAdviceResponse['sources'] = [];
  for (const { advice } of goals) {
    if (!advice.available) continue;
    for (const [key, amount] of Object.entries(advice.costs))
      needed[key] = (needed[key] ?? 0) + amount;
    for (const source of advice.sources) {
      if (
        !sources.some(
          (item) =>
            item.reference === source.reference && item.localEvidence === source.localEvidence,
        )
      )
        sources.push(source);
    }
  }
  const remaining = { ...stock.inventory };
  const reserved = { ...needed };
  const lower = new Map<string, string>();
  for (const { advice } of goals) {
    if (!advice.available) continue;
    for (const family of advice.conversionGroups ?? []) {
      if (family.length < 2 || new Set(family).size !== family.length) continue;
      for (let i = 1; i < family.length; i++) {
        const high = family[i]!;
        const low = family[i - 1]!;
        if (lower.has(high) && lower.get(high) !== low)
          throw new Error('Conflicting material conversion families');
        lower.set(high, low);
      }
    }
  }
  // Validate acyclic families before traversing them.
  for (const key of lower.keys()) {
    const seen = new Set<string>();
    for (let item: string | undefined = key; item !== undefined; item = lower.get(item)) {
      if (seen.has(item)) throw new Error('Cyclic material conversion family');
      seen.add(item);
    }
  }
  function capacity(key: string): number {
    const previous = lower.get(key);
    return Math.max(
      0,
      (remaining[key] ?? 0) +
        (previous ? Math.floor(capacity(previous) / 3) : 0) -
        (reserved[key] ?? 0),
    );
  }
  function take(key: string, amount: number, protect = false): number {
    const direct = Math.min(
      amount,
      Math.max(0, (remaining[key] ?? 0) - (protect ? (reserved[key] ?? 0) : 0)),
    );
    if (Object.hasOwn(remaining, key)) remaining[key] = remaining[key]! - direct;
    const previous = lower.get(key);
    const crafted = previous ? Math.min(amount - direct, Math.floor(capacity(previous) / 3)) : 0;
    if (crafted > 0) take(previous!, crafted * 3, true);
    return direct + crafted;
  }
  const planningDelta: Record<string, number> = {};
  const goalDeficits = goals.map(({ advice }) => {
    const deficits: Record<string, number | null> = {};
    if (!advice.available) return deficits;
    // Lower-tier reservations include later goals, regardless of object key order.
    for (const [key, amount] of Object.entries(advice.costs)) {
      const used = take(key, amount);
      planningDelta[key] = (planningDelta[key] ?? 0) + amount - used;
      deficits[key] =
        used === amount ? 0 : Object.hasOwn(stock.inventory, key) ? amount - used : null;
      reserved[key] = (reserved[key] ?? 0) - amount;
    }
    return deficits;
  });
  const delta: MaterialAdviceResponse['delta'] = {};
  for (const deficits of goalDeficits)
    for (const [key, amount] of Object.entries(deficits))
      delta[key] = amount === null || delta[key] === null ? null : (delta[key] ?? 0) + amount;
  const materials: MaterialAdviceResponse = {
    contractVersion: 2,
    ...stock,
    needed,
    delta,
    planningDelta,
    goals: goals.map(({ goal, advice }) => ({
      goalId: goal.id,
      targetKey: goal.targetKey,
      available: advice.available,
      reason: advice.available ? null : advice.reason,
    })),
    neededComplete: goals.every(({ advice }) => advice.available),
    sources,
  };
  return { materials, goalDeficits };
}

/** One accounting boundary for legacy Materials and the Today plan. */
export function projectMaterialAdvice(
  goals: Entry[],
  stock: RecordedStockSnapshot,
): MaterialAdviceResponse {
  return projectMaterialAccounting(goals, stock).materials;
}
