import { artworkDisplayName, artworkSizes, rarityTheme, weaponMetadata } from '../lib/artwork';
import { ASSET_MAPPING } from '../lib/asset-mapping';
import { CdnArtwork } from './CdnArtwork';

export function GenshinWeaponIcon({
  weaponKey,
  size = 'md',
  className = '',
}: {
  weaponKey: string;
  size?: keyof typeof artworkSizes;
  className?: string;
}) {
  const name = artworkDisplayName(weaponKey);
  const rarity = weaponMetadata[weaponKey]?.rarity;
  const asset = ASSET_MAPPING.weapons[weaponKey];
  return (
    <div
      role="img"
      aria-label={`${name} weapon icon${rarity ? `, ${rarity} star` : ''}`}
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border ${artworkSizes[size]} ${rarityTheme(rarity)} ${className}`}
    >
      <svg
        aria-hidden="true"
        className="h-2/3 w-2/3 opacity-70"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <path d="m8 16 12-12v5L11 18m-5-5 7 7M4 20l4-4m-5 3 2 2" />
      </svg>
      {asset && (
        <CdnArtwork
          key={asset}
          file={`UI_EquipIcon_${asset}`}
          alt={`${name} weapon icon`}
          className="object-contain"
        />
      )}
    </div>
  );
}
