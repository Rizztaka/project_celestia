import { useEffect, useRef, useState } from 'react';

import { type ArtworkKind, resolveCdnSources } from '../lib/cdn-resolver';

// A key on each consumer resets the attempts when a recycled card changes identity.
export function CdnArtwork({
  file,
  alt,
  className,
  kind = 'character',
  secondary,
  onReady,
}: {
  file: string;
  alt: string;
  className: string;
  kind?: ArtworkKind;
  secondary?: string | null;
  onReady?: () => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [loadedSource, setLoadedSource] = useState('');
  const sources = resolveCdnSources(file, kind, secondary);
  const source = sources[attempt];
  const loaded = loadedSource === source;
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (loaded || !source || !image.current) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const begin = () => {
      // A stalled CDN must not leave an empty portrait, including when onError never fires.
      timer = setTimeout(() => {
        setAttempt((value) => (value === attempt ? value + 1 : value));
      }, 8000);
    };
    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer?.disconnect();
            begin();
          });
    if (observer) observer.observe(image.current);
    else begin();
    return () => {
      observer?.disconnect();
      clearTimeout(timer);
    };
  }, [attempt, loaded, source]);
  if (!source) return null;
  return (
    <img
      ref={image}
      key={source}
      src={source}
      alt={alt}
      loading="lazy"
      decoding="async"
      width={96}
      height={96}
      className={`absolute inset-0 h-full w-full ${className} ${loaded ? 'opacity-100' : 'opacity-0'}`}
      onLoad={() => {
        setLoadedSource(source);
        onReady?.();
      }}
      onError={() => {
        setAttempt((value) => (value === attempt ? value + 1 : value));
      }}
    />
  );
}
