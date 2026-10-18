import metadata from './artwork-metadata.json';

type CharacterMetadata = { name: string; rarity: number; element: string; weapon: string };
type WeaponMetadata = { name: string; rarity: number };
export const characterMetadata: Record<string, CharacterMetadata> = metadata.characters;
export const weaponMetadata: Record<string, WeaponMetadata> = metadata.weapons;
export function artworkDisplayName(key: string): string {
  return (
    characterMetadata[key]?.name ??
    weaponMetadata[key]?.name ??
    key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ')
  );
}
export const artworkSizes = { sm: 'h-9 w-9', md: 'h-12 w-12', lg: 'h-16 w-16', xl: 'h-24 w-24' };
export function rarityTheme(rarity?: number): string {
  if (rarity === 5)
    return 'border-amber-500/40 bg-gradient-to-br from-amber-600/30 to-zinc-950 text-amber-300';
  if (rarity === 4)
    return 'border-purple-500/40 bg-gradient-to-br from-purple-600/30 to-zinc-950 text-purple-300';
  if (rarity === 3)
    return 'border-sky-500/40 bg-gradient-to-br from-sky-600/30 to-zinc-950 text-sky-300';
  return 'border-zinc-600 bg-gradient-to-br from-zinc-700 to-zinc-950 text-zinc-300';
}
