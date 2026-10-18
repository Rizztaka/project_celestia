import { artworkDisplayName, artworkSizes, weaponMetadata } from '../lib/artwork';
import { ASSET_MAPPING } from '../lib/asset-mapping';
import { visualAssets } from '../lib/cdn-resolver';
import { ArtworkFrame } from './ArtworkFrame';
const categoryPaths: Record<string, string> = {
  Sword: 'm5 19 14-14v5L9 20m-5-7 7 7',
  Claymore: 'm5 19 12-16 4 4L9 21m-6-9 9 9',
  Polearm: 'M4 20 17 7m-3 1 4-6 4 4-6 4',
  Bow: 'M5 3c15 1 15 17 0 18L12 12 5 3Zm0 9h17m-3-3 3 3-3 3',
  Catalyst: 'm12 2 9 10-9 10L3 12 12 2Zm0 5v10m-5-5h10',
};
export function GenshinWeaponIcon({
  weaponKey,
  size = 'md',
  className = '',
  refinement,
}: {
  weaponKey: string;
  size?: keyof typeof artworkSizes;
  className?: string;
  refinement?: number;
}) {
  const name = artworkDisplayName(weaponKey);
  const metadata = visualAssets.weapons[weaponKey];
  const asset = ASSET_MAPPING.weapons[weaponKey];
  return (
    <ArtworkFrame
      name={name}
      label={`${name} weapon icon`}
      kind="weapon"
      file={asset ? `UI_EquipIcon_${asset}` : null}
      secondary={metadata?.secondary}
      rarity={weaponMetadata[weaponKey]?.rarity}
      size={size}
      className={className}
    >
      <span
        aria-hidden="true"
        title={metadata?.weaponType ?? 'Weapon'}
        className="absolute right-0 top-0 z-10 h-4 w-4 rounded-bl-lg bg-black/65 p-0.5 text-white/90"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path
            d={categoryPaths[metadata?.weaponType ?? ''] ?? 'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 4v1'}
          />
        </svg>
      </span>
      {refinement !== undefined && (
        <span
          aria-hidden="true"
          className="absolute bottom-2 left-0 z-10 rounded-r-md bg-black/65 px-1 text-[9px] text-white"
        >
          R{refinement}
        </span>
      )}
    </ArtworkFrame>
  );
}
