import React, { useState, useRef, useEffect, useId } from 'react';
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
  iconClassName = 'text-zinc-300 hover:text-[#f3cf58]',
  size = 'sm',
  align = 'center',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Capture phase ensures Escape closes the tooltip before bubbling to any parent modal
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown, true);
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
        aria-describedby={isOpen ? tooltipId : undefined}
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
        className="inline-flex items-center justify-center p-1.5 -m-1 rounded-full transition-colors cursor-pointer"
      >
        <HelpCircle className={`${iconSize} ${iconClassName} transition-colors`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          id={tooltipId}
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-50 ${positionClasses} w-64 sm:w-72 max-w-[calc(100vw-32px)] p-3 rounded-xl bg-[#161927] border border-[#323954] shadow-2xl text-left pointer-events-auto backdrop-blur-md`}
        >
          {title && (
            <div className="font-semibold text-xs text-[#f3cf58] mb-1.5 border-b border-[#262c44] pb-1">
              {title}
            </div>
          )}
          <div className="text-xs leading-relaxed text-zinc-200 font-normal">
            {content}
          </div>
          <div
            aria-hidden="true"
            className={`absolute top-full ${arrowClasses} -mt-1 border-4 border-transparent border-t-[#323954]`}
          />
        </div>
      )}
    </div>
  );
};
