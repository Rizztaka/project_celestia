import { useEffect, useRef, useState } from 'react';

// A key on each consumer resets the attempts when a recycled card changes identity.
export function CdnArtwork({
  file,
  alt,
  className,
}: {
  file: string;
  alt: string;
  className: string;
}) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (loaded || attempt >= 2 || !image.current) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      // A stalled CDN must not leave an empty portrait, including when onError never fires.
      timer = setTimeout(() => {
        setAttempt((value) => value + 1);
      }, 8000);
    });
    observer.observe(image.current);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [attempt, loaded]);
  if (attempt >= 2) return null;
  return (
    <img
      ref={image}
      src={`${attempt === 0 ? 'https://enka.network/ui/' : 'https://api.ambr.top/assets/UI/'}${file}.png`}
      alt={alt}
      loading="lazy"
      decoding="async"
      width={96}
      height={96}
      className={`absolute inset-0 h-full w-full ${className} ${loaded ? 'opacity-100' : 'opacity-0'}`}
      onLoad={() => setLoaded(true)}
      onError={() => {
        setLoaded(false);
        setAttempt((value) => value + 1);
      }}
    />
  );
}
