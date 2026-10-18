import { artworkDisplayName, artworkSizes } from '../lib/artwork';
import { ASSET_MAPPING } from '../lib/asset-mapping';
import { getElementTheme } from '../lib/element-colors';
import { CdnArtwork } from './CdnArtwork';

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
  const crest = (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
      className="h-full w-full"
    >
      <path d={theme.icon} />
    </svg>
  );
  return (
    <div
      role="img"
      aria-label={`${name} avatar${theme.element !== 'Unknown' ? `, ${theme.element}` : ''}${constellation !== undefined ? `, Constellation ${constellation}` : ''}`}
      className={`relative isolate flex shrink-0 items-center justify-center overflow-hidden rounded-xl border ${artworkSizes[size]} ${theme.border} ${theme.text} ${className}`}
      style={{ background: `radial-gradient(circle at 30% 20%, ${theme.glow}, #18181b 85%)` }}
    >
      <div aria-hidden="true" className="h-2/3 w-2/3 opacity-80">
        {crest}
      </div>
      {asset && (
        <CdnArtwork
          key={asset}
          file={`UI_AvatarIcon_${asset}`}
          alt={`${name} avatar`}
          className="object-cover"
        />
      )}
      {showElementBadge && (
        <span
          aria-hidden="true"
          className={`absolute right-0 top-0 h-4 w-4 rounded-bl-md bg-zinc-950/90 p-0.5 ${theme.text}`}
        >
          {crest}
        </span>
      )}
      {constellation !== undefined && (
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 rounded-tr-md bg-zinc-950/90 px-1 text-[10px] font-semibold text-white"
        >
          C{constellation}
        </span>
      )}
    </div>
  );
}
