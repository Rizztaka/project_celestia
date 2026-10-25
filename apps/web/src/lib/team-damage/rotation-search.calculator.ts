import type { RotationStep } from './calculator';

export interface RotationCandidate {
  id: string;
  steps: RotationStep[];
}

/** Bounded deterministic search; contiguous character turns keep their internal order. */
export function rotationCandidates(steps: RotationStep[], limit: 12 | 48) {
  const blocks: RotationStep[][] = [];
  for (const step of steps) {
    if (blocks.at(-1)?.[0].characterKey !== step.characterKey) blocks.push([]);
    blocks.at(-1)!.push({ ...step });
  }
  if (!blocks.length || blocks.length > 8)
    return {
      candidates: [],
      blocks: blocks.length,
      issue: !blocks.length ? 'empty' : 'turn_limit',
    } as const;
  const candidates: RotationCandidate[] = [];
  const seen = new Set<string>();
  function add(sequence: RotationStep[]) {
    const key = JSON.stringify(sequence);
    if (seen.has(key) || candidates.length >= limit) return;
    seen.add(key);
    candidates.push({
      id: String(candidates.length),
      steps: sequence.map((step) => ({ ...step })),
    });
  }
  const orders: number[][] = [];
  const orderSeen = new Set<string>();
  function addOrder(order: number[]) {
    const key = order.join(',');
    if (orderSeen.has(key)) return;
    orderSeen.add(key);
    orders.push(order);
  }
  const original = blocks.map((_, i) => i);
  addOrder(original);
  // Include changes near the end even if the full permutation space exceeds the budget.
  for (let i = 0; i < blocks.length - 1; i++) {
    const order = [...original];
    [order[i], order[i + 1]] = [order[i + 1], order[i]];
    addOrder(order);
  }
  function permutations(prefix: number[], remaining: number[]) {
    if (orders.length >= limit / 2) return;
    if (!remaining.length) {
      addOrder(prefix);
      return;
    }
    for (const index of remaining) {
      permutations(
        [...prefix, index],
        remaining.filter((n) => n !== index),
      );
      if (orders.length >= limit / 2) break;
    }
  }
  permutations([], original);
  for (const order of orders) add(order.flatMap((index) => blocks[index]));
  for (const order of orders) {
    for (const repeat of [3, 6, 9]) {
      const sequence = order.flatMap((index) => blocks[index]).map((step) => ({ ...step }));
      const attack = sequence.findLastIndex((step) => step.action === 'attack');
      if (attack < 0) continue;
      sequence[attack].repeat = repeat;
      if (sequence.reduce((sum, step) => sum + step.repeat, 0) <= 200) add(sequence);
    }
  }
  return { candidates, blocks: blocks.length, issue: null } as const;
}

export function rankDamage<T extends { id: string; dps: number }>(rows: T[]) {
  if (rows.some((row) => !Number.isFinite(row.dps) || row.dps < 0))
    throw new Error('INVALID_SEARCH_DAMAGE');
  return [...rows].sort((a, b) => b.dps - a.dps || Number(a.id) - Number(b.id));
}

export const damageChange = (before: number, after: number) =>
  before > 0 ? ((after - before) / before) * 100 : null;
