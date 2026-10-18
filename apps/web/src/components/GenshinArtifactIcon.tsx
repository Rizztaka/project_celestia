import { artworkDisplayName, artworkSizes } from '../lib/artwork';
import { artifactSlotIds, visualAssets } from '../lib/cdn-resolver';
import { ArtworkFrame } from './ArtworkFrame';
export function GenshinArtifactIcon({
  setKey,
  slotKey,
  rarity,
  size = 'md',
  className = '',
}: {
  setKey: string;
  slotKey: string;
  rarity?: number;
  size?: keyof typeof artworkSizes;
  className?: string;
}) {
  const set = visualAssets.artifacts[setKey];
  const piece = set?.slots[slotKey];
  return (
    <ArtworkFrame
      name={set?.name ?? artworkDisplayName(setKey)}
      label={`${set?.name ?? artworkDisplayName(setKey)}, ${slotKey}`}
      file={piece?.file}
      secondary={piece?.secondary}
      kind="artifact"
      rarity={rarity ?? set?.rarity}
      size={size}
      className={className}
    >
      <span
        aria-hidden="true"
        className="absolute right-0 top-0 z-10 rounded-bl-md bg-black/65 px-1 text-[8px] text-white"
      >
        {Object.hasOwn(artifactSlotIds, slotKey) ? slotKey.slice(0, 1).toUpperCase() : '?'}
      </span>
    </ArtworkFrame>
  );
}
