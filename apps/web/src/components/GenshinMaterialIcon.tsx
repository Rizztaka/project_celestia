import { artworkSizes } from '../lib/artwork';
import { visualAssets } from '../lib/cdn-resolver';
import { materialDisplayName } from '../lib/static';
import { ArtworkFrame } from './ArtworkFrame';
export function GenshinMaterialIcon({
  itemKey,
  size = 'md',
  className = '',
}: {
  itemKey: string;
  size?: keyof typeof artworkSizes;
  className?: string;
}) {
  const asset = visualAssets.materials[itemKey];
  return (
    <ArtworkFrame
      name={asset?.name ?? materialDisplayName(itemKey)}
      file={asset?.file}
      kind="material"
      rarity={asset?.rarity}
      size={size}
      className={className}
    />
  );
}
