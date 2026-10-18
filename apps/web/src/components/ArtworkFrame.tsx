import { type ReactNode, useState } from 'react';

import { artworkSizes, rarityTheme } from '../lib/artwork';
import { artworkInitials, type ArtworkKind } from '../lib/cdn-resolver';
import { CdnArtwork } from './CdnArtwork';

export function ArtworkFrame({
  name,
  label = name,
  file,
  kind,
  secondary,
  rarity,
  size = 'md',
  className = '',
  imageClass = 'object-contain p-1',
  children,
}: {
  name: string;
  label?: string;
  file?: string | null;
  kind: ArtworkKind;
  secondary?: string | null;
  rarity?: number | null;
  size?: keyof typeof artworkSizes;
  className?: string;
  imageClass?: string;
  children?: ReactNode;
}) {
  const [loadedFile, setLoadedFile] = useState<string | null>(null);
  return (
    <div
      role="img"
      aria-label={`${label}${rarity ? `, ${rarity} star` : ''}`}
      className={`relative isolate flex shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-inner ${artworkSizes[size]} ${rarityTheme(rarity ?? undefined)} ${className}`}
    >
      <span
        aria-hidden="true"
        style={{ visibility: file && loadedFile === file ? 'hidden' : 'visible' }}
        className="font-display text-xl font-black tracking-tight text-white/80 drop-shadow-lg"
      >
        {artworkInitials(name)}
      </span>
      {file && (
        <CdnArtwork
          key={`${kind}:${file}`}
          file={file}
          kind={kind}
          secondary={secondary}
          alt={label}
          className={imageClass}
          onReady={() => setLoadedFile(file)}
        />
      )}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-t from-black/35 via-transparent to-white/10"
      />
      {rarity && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 z-10 rounded-t-[50%] bg-black/45 text-center text-[7px] leading-[11px] tracking-tight text-amber-100"
        >
          {'★'.repeat(Math.min(5, Math.max(1, rarity)))}
        </span>
      )}
      {children}
    </div>
  );
}
