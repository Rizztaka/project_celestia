import { artworkDisplayName, artworkSizes, characterMetadata } from '../lib/artwork';
import { ASSET_MAPPING } from '../lib/asset-mapping';
import { getElementTheme } from '../lib/element-colors';
import { ArtworkFrame } from './ArtworkFrame';

export function GenshinAvatar({
  characterKey,
  size = 'md',
  className = '',
  showElementBadge = true,
  constellation,
}: {
  characterKey: string;
  size?: keyof typeof artworkSizes;
  className?: string;
  showElementBadge?: boolean;
  constellation?: number;
}) {
  const theme = getElementTheme(characterKey);
  const name = artworkDisplayName(characterKey);
  const asset = ASSET_MAPPING.characters[characterKey];
  return (
    <ArtworkFrame
      name={name}
      label={`${name} avatar${theme.element !== 'Unknown' ? `, ${theme.element}` : ''}${constellation !== undefined ? `, Constellation ${constellation}` : ''}`}
      kind="character"
      file={asset ? `UI_AvatarIcon_${asset}` : null}
      rarity={characterMetadata[characterKey]?.rarity}
      size={size}
      className={className}
      imageClass="object-cover object-top scale-110"
    >
      {showElementBadge && (
        <span
          aria-hidden="true"
          title={theme.element}
          className={`absolute right-0 top-0 z-10 h-4 w-4 rounded-bl-lg bg-zinc-950/80 p-0.5 ${theme.text}`}
          style={{ filter: `drop-shadow(0 0 3px ${theme.glow})` }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-full w-full"
          >
            <path d={theme.icon} />
          </svg>
        </span>
      )}
      {constellation !== undefined && (
        <span
          aria-hidden="true"
          className="absolute bottom-2 left-0 z-10 rounded-r-md bg-black/70 px-1 text-[9px] font-bold text-white"
        >
          C{constellation}
        </span>
      )}
    </ArtworkFrame>
  );
}
