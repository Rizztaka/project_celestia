/** Tier families joined from the existing pinned domain/material and per-phase tables. */
export function materialConversionGroups(data: {
  materials: Record<string, { gameItemId: number }>;
  domains: Record<string, { dropKeys: string[] }>;
  weapons: Record<string, { ascension: { phase: number; costs: Record<string, number> }[] }>;
}): string[][] {
  const groups = Object.values(data.domains).map(({ dropKeys }) =>
    [...dropKeys].sort((a, b) => data.materials[a]!.gameItemId - data.materials[b]!.gameItemId),
  );
  for (const key of Object.keys(data.materials)) {
    if (!key.endsWith('Sliver') || key.startsWith('BrilliantDiamond')) continue;
    const prefix = key.slice(0, -'Sliver'.length);
    const family = ['Sliver', 'Fragment', 'Chunk', 'Gemstone'].map((tier) => prefix + tier);
    if (family.every((item) => data.materials[item])) groups.push(family);
  }
  // Common and elite enemy tiers occur at phases 1, 3 and 5. Match their
  // consecutive source IDs across all three rows, excluding domain materials.
  const domainKeys = new Set(Object.values(data.domains).flatMap((domain) => domain.dropKeys));
  for (const { ascension } of Object.values(data.weapons)) {
    const tiers = [1, 3, 5].map((phase) => {
      const row = ascension.find((step) => step.phase === phase);
      return Object.keys(row?.costs ?? {}).filter(
        (key) =>
          !domainKeys.has(key) &&
          data.materials[key]!.gameItemId >= 112000 &&
          data.materials[key]!.gameItemId < 113000,
      );
    });
    for (const low of tiers[0]!) {
      const id = data.materials[low]!.gameItemId;
      const mid = tiers[1]!.find((key) => data.materials[key]!.gameItemId === id + 1);
      const high = tiers[2]!.find((key) => data.materials[key]!.gameItemId === id + 2);
      if (mid && high) groups.push([low, mid, high]);
    }
  }
  return [...new Map(groups.map((group) => [JSON.stringify(group), group])).values()];
}
