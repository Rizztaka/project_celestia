import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

export interface InfoTooltipProps {
  content: React.ReactNode;
  title?: string;
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md';
  align?: 'center' | 'left' | 'right';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  title,
  className = '',
  iconClassName = 'text-zinc-400 hover:text-amber-400',
  size = 'sm',
  align = 'center',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  const positionClasses =
    align === 'right'
      ? 'right-0 bottom-full mb-2'
      : align === 'left'
      ? 'left-0 bottom-full mb-2'
      : 'left-1/2 -translate-x-1/2 bottom-full mb-2';

  const arrowClasses =
    align === 'right'
      ? 'right-3'
      : align === 'left'
      ? 'left-3'
      : 'left-1/2 -translate-x-1/2';

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center align-middle ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-label={title || 'Information'}
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setIsOpen(false);
          }
        }}
        className="inline-flex items-center justify-center p-0.5 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400"
      >
        <HelpCircle className={`${iconSize} ${iconClassName} transition-colors`} />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-50 ${positionClasses} w-64 sm:w-72 max-w-[calc(100vw-32px)] p-2.5 rounded-xl bg-[#161927] border border-[#2a3048] shadow-2xl text-left pointer-events-auto backdrop-blur-md`}
        >
          {title && (
            <div className="font-semibold text-xs text-amber-300 mb-1 border-b border-[#252c42] pb-1 flex items-center justify-between">
              <span>{title}</span>
            </div>
          )}
          <div className="text-[11px] leading-relaxed text-zinc-300 font-normal">
            {content}
          </div>
          {/* Arrow */}
          <div className={`absolute top-full ${arrowClasses} -mt-1 border-4 border-transparent border-t-[#2a3048]`} />
        </div>
      )}
    </div>
  );
};
