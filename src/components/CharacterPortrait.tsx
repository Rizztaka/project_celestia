import React, { useState, useEffect } from 'react';
import type { Element } from '../types/genshin';

interface CharacterPortraitProps {
  src?: string;
  name: string;
  element?: Element;
  rarity?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showRarity?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: {
    container: 'w-4 h-4 rounded-full',
    text: 'text-[8px]',
    img: 'w-full h-full object-cover',
    badge: 'text-[8px] px-0.5',
  },
  sm: {
    container: 'w-7 h-7 rounded-lg',
    text: 'text-[10px]',
    img: 'w-full h-full object-cover scale-110',
    badge: 'text-[8px] px-0.5 -bottom-1 -right-0.5',
  },
  md: {
    container: 'w-11 h-11 rounded-xl',
    text: 'text-xs',
    img: 'w-full h-full object-cover scale-110',
    badge: 'text-[9px] px-1 -bottom-1 -right-0.5',
  },
  lg: {
    container: 'w-16 h-16 sm:w-18 sm:h-18 rounded-2xl',
    text: 'text-lg sm:text-xl',
    img: 'w-full h-full object-cover scale-110',
    badge: 'text-[9px] px-1 -bottom-1.5 -right-1',
  },
  xl: {
    container: 'w-20 h-20 rounded-2xl',
    text: 'text-2xl',
    img: 'w-full h-full object-cover scale-110',
    badge: 'text-[10px] px-1.5 py-0.2 -bottom-2 -right-1',
  },
};

const ELEMENT_TEXT_COLORS: Record<Element, string> = {
  Pyro: 'text-rose-400',
  Hydro: 'text-sky-400',
  Dendro: 'text-emerald-400',
  Electro: 'text-purple-400',
  Anemo: 'text-teal-400',
  Cryo: 'text-cyan-300',
  Geo: 'text-amber-400',
};

export const CharacterPortrait: React.FC<CharacterPortraitProps> = ({
  src,
  name,
  element,
  rarity,
  size = 'md',
  showRarity = false,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error if image URL changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();

  const sizeConfig = SIZE_MAP[size];
  const textColor = element ? ELEMENT_TEXT_COLORS[element] : 'text-[#d4af37]';

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <div
        className={`${sizeConfig.container} overflow-hidden bg-[#161a29] border border-[#2b324c] flex items-center justify-center shadow-sm select-none ${className}`}
      >
        {src && !hasError ? (
          <img
            src={src}
            alt={name}
            className={sizeConfig.img}
            loading="lazy"
            onError={() => setHasError(true)}
          />
        ) : (
          <span className={`font-bold ${sizeConfig.text} ${textColor}`}>
            {initials}
          </span>
        )}
      </div>

      {showRarity && rarity && (
        <div
          className={`absolute ${sizeConfig.badge} bg-black/90 rounded font-bold text-[#d4af37] border border-[#d4af37]/40 leading-tight z-10 pointer-events-none`}
        >
          {'★'.repeat(rarity)}
        </div>
      )}
    </div>
  );
};
