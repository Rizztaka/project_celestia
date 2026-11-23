import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import type { DataProvenance, VerificationMethod } from '../types/genshin';
import { getFreshnessInfo, type FreshnessInfo } from '../services/data-freshness';
import { CURRENT_GAME_VERSION } from '../data/game-version';

const METHOD_LABELS: Record<VerificationMethod, string> = {
  official_notice: 'Official Notice',
  in_game_verification: 'In-Game Verified',
  theorycraft_consensus: 'Theorycraft Audit',
};

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
      onBlur={(e) => {
        if (showTooltip && !e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setIsTooltipOpen(false);
        }
      }}
    >
      <button
        type="button"
        onClick={() => showTooltip && setIsTooltipOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer select-none ${styles.container}`}
        aria-label={`Data Freshness Status: ${info.status}, ${label}`}
        aria-expanded={isTooltipOpen}
      >
        {styles.icon}
        <span>{label}</span>
      </button>

      {showTooltip && isTooltipOpen && (
        <div
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 p-3 rounded-xl bg-[#0f121d] border border-[#2b3353] shadow-2xl text-left text-xs text-zinc-300 pointer-events-auto backdrop-blur-md"
        >
          <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-[#212740]">
            <span className="font-bold text-zinc-100 flex items-center gap-1.5 capitalize">
              {styles.icon}
              {info.status} Dataset (v{info.version})
            </span>
            <span className="text-[10px] text-zinc-300 shrink-0">
              {info.verifiedAt !== 'Unregistered' ? `Verified: ${info.verifiedAt}` : 'Unverified'}
            </span>
          </div>

          {info.verificationMethod && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#181d30] border border-[#2c3454] text-zinc-200">
                {METHOD_LABELS[info.verificationMethod]}
              </span>
              {info.effectiveEndDate && (
                <span className="text-[10px] font-mono text-zinc-400">
                  Ends {info.effectiveEndDate}
                </span>
              )}
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-zinc-300 mb-2">{info.evidence}</p>

          {info.verifiedFields && info.verifiedFields.length > 0 && (
            <p className="text-[10px] text-zinc-400 mb-2">
              <strong className="text-zinc-300">Audited fields:</strong>{' '}
              {info.verifiedFields.join(', ')}
            </p>
          )}

          {info.isStale && (
            <div className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-700/50 text-[10px] text-amber-300 mb-2">
              {info.isExpired && info.effectiveEndDate
                ? `⚠️ Schedule ended on ${info.effectiveEndDate}. In-game lineups or mechanics differ from active v${CURRENT_GAME_VERSION}.`
                : `⚠️ Data is older than the standard 42-day patch cycle or belongs to an earlier patch. In-game lineups or boss mechanics may differ.`}
            </div>
          )}

          {info.sourceUrl && (
            <a
              href={info.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-[#d4af37] hover:underline"
            >
              <span>View Reference Source</span>
              <ExternalLink className="w-2.5 h-2.5" aria-hidden="true" />
            </a>
          )}

          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-[#0f121d] border-r border-b border-[#2b3353] rotate-45" />
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
