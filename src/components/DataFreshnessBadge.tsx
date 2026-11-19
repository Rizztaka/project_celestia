import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import type { DataProvenance } from '../types/genshin';
import { getFreshnessInfo, type FreshnessInfo } from '../services/data-freshness';

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
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const info: FreshnessInfo = getFreshnessInfo(provenance || datasetId || '', referenceDate);

  const label = labelOverride || info.badgeLabel;

  const getStatusStyles = () => {
    switch (info.status) {
      case 'verified':
        return {
          container: 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40 hover:border-emerald-500/80',
          dot: 'bg-emerald-400',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" aria-hidden="true" />,
        };
      case 'provisional':
        return {
          container: 'bg-sky-950/60 text-sky-300 border-sky-600/40 hover:border-sky-500/80',
          dot: 'bg-sky-400',
          icon: <Info className="w-3 h-3 text-sky-400 shrink-0" aria-hidden="true" />,
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

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => showTooltip && setIsTooltipOpen(true)}
      onMouseLeave={() => showTooltip && setIsTooltipOpen(false)}
      onFocus={() => showTooltip && setIsTooltipOpen(true)}
      onBlur={() => showTooltip && setIsTooltipOpen(false)}
    >
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer select-none ${styles.container}`}
        aria-label={`Data Freshness Status: ${info.status}, ${label}`}
        aria-expanded={isTooltipOpen}
      >
        {styles.icon}
        <span>{label}</span>
      </button>

      {/* Hover / Focus Tooltip */}
      {showTooltip && isTooltipOpen && (
        <div
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 rounded-xl bg-[#0f121d] border border-[#2b3353] shadow-2xl text-left text-xs text-zinc-300 pointer-events-auto backdrop-blur-md"
        >
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#212740]">
            <span className="font-bold text-zinc-100 flex items-center gap-1.5 capitalize">
              {styles.icon}
              {info.status} Dataset (v{info.version})
            </span>
            <span className="text-[10px] text-zinc-400">
              {info.verifiedAt !== 'Unregistered' ? `Verified: ${info.verifiedAt}` : 'Active Default'}
            </span>
          </div>

          <p className="text-[11px] leading-relaxed text-zinc-300 mb-2">
            {info.evidence}
          </p>

          {info.isStale && (
            <div className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-700/50 text-[10px] text-amber-300 mb-2">
              ⚠️ Data is older than the standard 42-day patch cycle. In-game lineups or boss mechanics may differ.
            </div>
          )}

          {info.sourceUrl && (
            <a
              href={info.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-[#d4af37] hover:underline"
            >
              <span>View Hoyoverse Official Source</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}

          {/* Tooltip triangle caret */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-[#0f121d] border-r border-b border-[#2b3353] rotate-45" />
        </div>
      )}
    </div>
  );
};
