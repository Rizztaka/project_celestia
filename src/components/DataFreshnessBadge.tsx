import React, { useState, useRef, useEffect, useId } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  ExternalLink,
  X,
} from 'lucide-react';
import type { DataProvenance, VerificationMethod } from '../types/genshin';
import { getFreshnessInfo, type FreshnessInfo } from '../services/data-freshness';
import { CURRENT_GAME_VERSION } from '../data/game-version';

const METHOD_LABELS: Record<VerificationMethod, string> = {
  official_notice: 'Official Notice',
  in_game_verification: 'In-Game Verified',
  theorycraft_consensus: 'Theorycraft Audit',
};

const UNREGISTERED_EXPLANATION =
  'This dataset has no registered provenance record. Verification metadata and source links are withheld; verify details in-game before committing resources.';

function sanitizeHttpsUrl(rawUrl?: string): string | undefined {
  if (typeof rawUrl !== 'string') return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

function getAppliedTranslateX(element: HTMLElement): number {
  const computedTransform = window.getComputedStyle(element).transform;
  const inlineTransform = element.style.transform;
  const transform =
    computedTransform && computedTransform !== 'none' ? computedTransform : inlineTransform;

  if (!transform || transform === 'none') return 0;

  if (typeof DOMMatrix !== 'undefined') {
    try {
      return new DOMMatrix(transform).m41;
    } catch {
      // Fallback to regex parsing below when DOMMatrix cannot parse the transform string
    }
  }

  const matrixMatch = transform.match(/^matrix\(([^)]+)\)$/);
  if (matrixMatch) {
    const parts = matrixMatch[1].split(',').map((value) => Number.parseFloat(value.trim()));
    return parts.length >= 5 && Number.isFinite(parts[4]) ? parts[4] : 0;
  }

  const translateMatch = transform.match(/translateX\(\s*([-\d.]+)px\s*\)/);
  if (translateMatch) {
    const parsed = Number.parseFloat(translateMatch[1]);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export interface DataFreshnessBadgeProps {
  datasetId?: string;
  provenance?: DataProvenance;
  labelOverride?: string;
  className?: string;
  showTooltip?: boolean;
  referenceDate?: Date;
}

export const DataFreshnessBadge: React.FC<DataFreshnessBadgeProps> = ({
  datasetId,
  provenance,
  labelOverride,
  className = '',
  showTooltip = true,
  referenceDate,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [horizontalOffset, setHorizontalOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  const isExplicitlyUnregisteredProvenance =
    provenance !== undefined && (provenance as { status?: string }).status === 'unregistered';

  const info: FreshnessInfo = isExplicitlyUnregisteredProvenance
    ? {
        datasetId: provenance.datasetId || 'unknown',
        version: 'unknown',
        status: 'unregistered',
        isStale: false,
        isExpired: false,
        ageDays: -1,
        verifiedAt: 'Unregistered',
        sourceUrl: '',
        evidence: '',
        badgeLabel: 'Unregistered',
        badgeDescription:
          'No provenance record found for this dataset. Do not treat as verified or active without checking in-game.',
      }
    : getFreshnessInfo(provenance || datasetId || '', referenceDate);

  const isUnregistered = info.status === 'unregistered';
  const label = labelOverride || info.badgeLabel;
  const safeSourceUrl = isUnregistered ? undefined : sanitizeHttpsUrl(info.sourceUrl);

  useEffect(() => {
    if (!showTooltip || !isPopoverOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };

    // Capture phase ensures Escape dismisses only this disclosure before reaching parent modal listeners
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setIsPopoverOpen(false);
        triggerRef.current?.focus();
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
  }, [isPopoverOpen, showTooltip]);

  useEffect(() => {
    if (!showTooltip || !isPopoverOpen) {
      setHorizontalOffset(0);
      return;
    }

    let rafId: number | null = null;

    const clampToViewport = () => {
      const popover = popoverRef.current;
      if (!popover) return;
      const rect = popover.getBoundingClientRect();
      if (rect.width === 0) return;

      const margin = 16;
      const viewportWidth = window.innerWidth;
      const appliedOffset = getAppliedTranslateX(popover);
      const naturalLeft = rect.left - appliedOffset;
      const naturalRight = rect.right - appliedOffset;

      let nextOffset = 0;
      if (naturalLeft < margin) {
        nextOffset = margin - naturalLeft;
      } else if (naturalRight > viewportWidth - margin) {
        nextOffset = viewportWidth - margin - naturalRight;
      }

      const roundedOffset = Math.round(nextOffset * 100) / 100;
      setHorizontalOffset((prev) =>
        Math.abs(prev - roundedOffset) < 0.01 ? prev : roundedOffset,
      );
    };

    const scheduleClamp = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        clampToViewport();
      });
    };

    scheduleClamp();
    window.addEventListener('resize', scheduleClamp);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('resize', scheduleClamp);
    };
  }, [isPopoverOpen, showTooltip]);

  const getStatusStyles = () => {
    switch (info.status) {
      case 'verified':
        return {
          container:
            'bg-emerald-950/60 text-emerald-300 border-emerald-600/40 hover:border-emerald-500/80',
          dot: 'bg-emerald-400',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" aria-hidden="true" />,
        };
      case 'provisional':
        return {
          container: 'bg-sky-950/60 text-sky-300 border-sky-600/40 hover:border-sky-500/80',
          dot: 'bg-sky-400',
          icon: <Info className="w-3 h-3 text-sky-400 shrink-0" aria-hidden="true" />,
        };
      case 'unregistered':
        return {
          container:
            'bg-rose-950/85 text-rose-100 border-rose-500/60 hover:border-rose-400/90',
          dot: 'bg-rose-400',
          icon: <ShieldAlert className="w-3 h-3 text-rose-200 shrink-0" aria-hidden="true" />,
        };
      case 'stale':
      default:
        return {
          container: 'bg-amber-950/60 text-amber-300 border-amber-600/40 hover:border-amber-500/80',
          dot: 'bg-amber-400',
          icon: <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />,
        };
    }
  };

  const styles = getStatusStyles();
  const hasKnownVersion = Boolean(info.version && info.version !== 'unknown');
  const headerTitle = isUnregistered
    ? 'Unregistered Dataset'
    : `${info.status} Dataset${hasKnownVersion ? ` (v${info.version})` : ''}`;
  const headerVerificationMeta =
    isUnregistered || info.verifiedAt === 'Unregistered'
      ? 'Not Registered'
      : `Verified: ${info.verifiedAt}`;

  return (
    <div ref={containerRef} className={`relative inline-flex items-center max-w-full ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (showTooltip) {
            setIsPopoverOpen((prev) => !prev);
          }
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer select-none max-w-full ${styles.container}`}
        aria-label={`Data Freshness Status: ${info.status}, ${label}`}
        aria-expanded={showTooltip ? isPopoverOpen : undefined}
        aria-controls={showTooltip ? popoverId : undefined}
      >
        {styles.icon}
        <span className="truncate">{label}</span>
      </button>

      {showTooltip && (
        <div
          ref={popoverRef}
          id={popoverId}
          role="region"
          aria-label={`Data freshness details for ${label}`}
          hidden={!isPopoverOpen}
          aria-hidden={isPopoverOpen ? undefined : true}
          onClick={(event) => event.stopPropagation()}
          style={
            horizontalOffset !== 0
              ? { transform: `translateX(${horizontalOffset}px)` }
              : undefined
          }
          className={
            isPopoverOpen
              ? 'absolute z-50 top-full right-0 mt-2 w-[min(18rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] p-3 rounded-xl bg-[#0f121d] border border-[#2b3353] shadow-2xl text-left text-xs text-zinc-200 pointer-events-auto backdrop-blur-md'
              : 'hidden'
          }
        >
          <div className="flex items-start justify-between gap-2 pb-1.5 mb-1.5 border-b border-[#212740]">
            <div className="min-w-0 space-y-0.5">
              <span className="font-bold text-zinc-100 flex items-center gap-1.5 capitalize break-words">
                {styles.icon}
                <span>{headerTitle}</span>
              </span>
              <span className="block text-[11px] text-zinc-200">{headerVerificationMeta}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsPopoverOpen(false);
                triggerRef.current?.focus();
              }}
              aria-label="Close data freshness details"
              className="p-1 rounded-md text-zinc-200 hover:text-zinc-100 hover:bg-[#1a2035] transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {!isUnregistered && info.verificationMethod && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[#181d30] border border-[#2c3454] text-zinc-100">
                {METHOD_LABELS[info.verificationMethod]}
              </span>
              {info.effectiveEndDate && (
                <span className="text-[11px] font-mono text-zinc-200">
                  Ends {info.effectiveEndDate}
                </span>
              )}
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-zinc-200 mb-2 break-words">
            {isUnregistered ? UNREGISTERED_EXPLANATION : info.evidence}
          </p>

          {!isUnregistered && info.verifiedFields && info.verifiedFields.length > 0 && (
            <p className="text-[11px] text-zinc-200 mb-2 break-words">
              <strong className="text-zinc-100">Audited fields:</strong>{' '}
              {info.verifiedFields.join(', ')}
            </p>
          )}

          {!isUnregistered && info.isStale && (
            <div className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-500/50 text-[11px] text-amber-100 mb-2 break-words">
              {info.isExpired && info.effectiveEndDate
                ? `Schedule ended on ${info.effectiveEndDate}. In-game lineups or mechanics differ from active v${CURRENT_GAME_VERSION}.`
                : `Data is older than the standard 42-day patch cycle or belongs to an earlier patch. In-game lineups or boss mechanics may differ.`}
            </div>
          )}

          {safeSourceUrl && (
            <a
              href={safeSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#f3cf58] hover:underline break-all"
            >
              <span>View Reference Source</span>
              <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export interface StaleDataWarningBannerProps {
  datasetId: string;
  contextLabel: string;
  referenceDate?: Date;
  className?: string;
}

/**
 * Prominent inline warning banner shown whenever a recommendation view is operating
 * on stale, expired, or provisional (non-sandbox) game data.
 */
export const StaleDataWarningBanner: React.FC<StaleDataWarningBannerProps> = ({
  datasetId,
  contextLabel,
  referenceDate,
  className = '',
}) => {
  const info = getFreshnessInfo(datasetId, referenceDate);
  const isSandbox = datasetId.includes('sandbox') || datasetId.startsWith('custom-');

  if (!info.isStale && (info.status === 'verified' || isSandbox)) {
    return null;
  }

  const isStale = info.isStale;
  return (
    <div
      role="status"
      className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
        isStale
          ? 'bg-amber-950/45 border-amber-500/45 text-amber-100'
          : 'bg-sky-950/40 border-sky-500/40 text-sky-100'
      } ${className}`}
    >
      {isStale ? (
        <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
      ) : (
        <Info className="w-4 h-4 text-sky-300 shrink-0 mt-0.5" aria-hidden="true" />
      )}
      <div className="space-y-0.5 leading-relaxed">
        <p className="font-semibold">
          {isStale
            ? `Outdated ${contextLabel} Data (v${info.version} · Verified ${info.verifiedAt})`
            : `Provisional ${contextLabel} Data (v${info.version})`}
        </p>
        <p className={isStale ? 'text-amber-200/90' : 'text-sky-200/90'}>
          {isStale
            ? `${info.badgeDescription} Recommendations below reflect archived encounters and should not be used for active Version ${CURRENT_GAME_VERSION} clears without switching to a current schedule.`
            : `${info.evidence} Treat recommendations as provisional until verified live in-game.`}
        </p>
      </div>
    </div>
  );
};
