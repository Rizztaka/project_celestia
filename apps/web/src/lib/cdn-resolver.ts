import manifest from './visual-assets.json';

export type ArtworkKind = 'character' | 'weapon' | 'artifact' | 'material' | 'boss' | 'domain';
export interface VisualAsset {
  name: string;
  file: string | null;
  rarity?: number | null;
  secondary?: string | null;
  weaponType?: string;
  region?: string;
}
export const visualAssets = manifest as unknown as {
  characters: Record<string, VisualAsset>;
  weapons: Record<string, VisualAsset>;
  materials: Record<string, VisualAsset & { gameItemId: number }>;
  artifacts: Record<
    string,
    {
      name: string;
      rarity: number;
      slots: Record<string, { file: string; secondary?: string | null }>;
    }
  >;
  bosses: Record<
    string,
    VisualAsset & { kind: 'weekly' | 'world'; dropKeys: string[]; location: string | null }
  >;
  domains: Record<string, VisualAsset>;
};
export function resolveCdnSources(
  file: string,
  kind: ArtworkKind,
  secondary?: string | null,
): string[] {
  if (!/^UI_[A-Za-z0-9_]+$/.test(file)) return [];
  const directory =
    kind === 'character'
      ? 'character_icon'
      : kind === 'boss'
        ? 'monster'
        : kind === 'domain'
          ? 'dungeon'
          : 'equip';
  const official = secondary?.startsWith('https://upload-os-bbs.mihoyo.com/game_record/genshin/')
    ? secondary
    : `https://upload-os-bbs.mihoyo.com/game_record/genshin/${directory}/${file}.png`;
  return [
    ...new Set([
      `https://enka.network/ui/${file}.png`,
      official,
      // Verified mirror coverage for items/bosses absent from Enka and the official index.
      `https://gi.yatta.moe/assets/UI/${kind === 'boss' ? 'monster/' : ''}${file}.png`,
    ]),
  ];
}
export const artifactSlotIds = { goblet: 1, plume: 2, circlet: 3, flower: 4, sands: 5 } as const;
export function artworkInitials(name: string): string {
  return (name.match(/[\p{L}\p{N}]+/gu) ?? ['?'])
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}
