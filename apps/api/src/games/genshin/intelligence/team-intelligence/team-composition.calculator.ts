export const resonanceElements = [
  'Pyro',
  'Hydro',
  'Anemo',
  'Electro',
  'Cryo',
  'Geo',
  'Dendro',
] as const;
export type ResonanceElement = (typeof resonanceElements)[number];

const reactionRequirements = {
  Vaporize: ['Pyro', 'Hydro'],
  Melt: ['Pyro', 'Cryo'],
  Hyperbloom: ['Dendro', 'Hydro', 'Electro'],
  Swirl: ['Anemo'],
  Aggravate: ['Dendro', 'Electro'],
} as const;

export function calculateComposition(characterKeys: string[], elements: Record<string, string>) {
  const counts = Object.fromEntries(resonanceElements.map((element) => [element, 0]));
  for (const key of characterKeys) if (elements[key] in counts) counts[elements[key]]++;
  const reactions = Object.entries(reactionRequirements)
    .filter(
      ([reaction, required]) =>
        required.every((element) => counts[element] > 0) &&
        (reaction !== 'Swirl' ||
          ['Pyro', 'Hydro', 'Electro', 'Cryo'].some((element) => counts[element] > 0)),
    )
    .map(([reaction]) => reaction);
  return {
    characterKeys,
    counts,
    complete: characterKeys.length === 4,
    resonanceElements: resonanceElements.filter((element) => counts[element] >= 2),
    reactions,
    score: characterKeys.length * 25,
  };
}
export type Composition = ReturnType<typeof calculateComposition>;
