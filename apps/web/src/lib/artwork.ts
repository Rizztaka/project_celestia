import metadata from './artwork-metadata.json';
import referenceIndex from './character-reference-index.json';
import targets from './progression-targets.json';

type CharacterMetadata = { name: string; rarity: number; element: string; weapon: string };
type WeaponMetadata = { name: string; rarity: number };
export const referenceCharacters: Record<string, CharacterMetadata> = referenceIndex;
export const characterMetadata: Record<string, CharacterMetadata> = {
  ...metadata.characters,
  ...referenceCharacters,
};
export const weaponMetadata: Record<string, WeaponMetadata> = metadata.weapons;
export function artworkDisplayName(key: string): string {
  return (
    characterMetadata[key]?.name ??
    weaponMetadata[key]?.name ??
    targets.artifactSets.find((set) => set.key === key)?.name ??
    key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ')
  );
}
export const artworkSizes = { sm: 'h-9 w-9', md: 'h-12 w-12', lg: 'h-16 w-16', xl: 'h-24 w-24' };
export function rarityTheme(rarity?: number): string {
  if (rarity === 5)
    return 'border-amber-400/60 bg-gradient-to-br from-amber-500/80 via-amber-700/60 to-zinc-950 text-amber-200 shadow-amber-500/15';
  if (rarity === 4)
    return 'border-purple-400/60 bg-gradient-to-br from-purple-500/80 via-purple-700/60 to-zinc-950 text-purple-200 shadow-purple-500/15';
  if (rarity === 3)
    return 'border-sky-400/60 bg-gradient-to-br from-sky-500/80 via-sky-800/60 to-zinc-950 text-sky-200';
  if (rarity === 2)
    return 'border-emerald-400/60 bg-gradient-to-br from-emerald-500/70 via-emerald-800/50 to-zinc-950 text-emerald-100';
  return 'border-slate-400/50 bg-gradient-to-br from-slate-500/70 via-slate-700/50 to-zinc-950 text-slate-200';
}
