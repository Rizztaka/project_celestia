/** Validate exact directional 3:1 families normalized from the pinned crafting recipes. */
export function materialConversionGroups(data: {
  conversionGroups: string[][];
  materials: Record<string, { gameItemId: number }>;
}): string[][] {
  const lower = new Map<string, string>();
  const higher = new Map<string, string>();
  for (const family of data.conversionGroups) {
    if (
      family.length < 2 ||
      new Set(family).size !== family.length ||
      family.some((key) => !Object.hasOwn(data.materials, key))
    )
      throw new Error('Invalid sourced material conversion family');
    for (let i = 1; i < family.length; i++) {
      const high = family[i]!;
      const low = family[i - 1]!;
      if (lower.has(high) || higher.has(low))
        throw new Error('Overlapping sourced material conversion family');
      lower.set(high, low);
      higher.set(low, high);
    }
  }
  for (const key of lower.keys()) {
    const seen = new Set<string>();
    for (let item: string | undefined = key; item !== undefined; item = lower.get(item)) {
      if (seen.has(item)) throw new Error('Cyclic sourced material conversion family');
      seen.add(item);
    }
  }
  return data.conversionGroups.map((family) => [...family]);
}
