import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  History,
  ShieldAlert,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { RecommendationReliability } from '../types/genshin';
import {
  formatReliabilityPresentation,
  type ReliabilityBadgeTone,
} from '../services/reliability-presentation';

export interface RecommendationReliabilityBadgeProps {
  reliability?: RecommendationReliability | null;
  isLoading?: boolean;
  emptyLabel?: string;
  size?: 'sm' | 'md';
  showActionability?: boolean;
  interactive?: boolean;
  isDetailsOpen?: boolean;
  onToggleDetails?: () => void;
  detailsControlsId?: string;
  className?: string;
}

interface ToneVisuals {
  container: string;
  interactiveHover: string;
  icon: (iconClassName: string) => React.ReactNode;
}

function getToneVisuals(tone: ReliabilityBadgeTone): ToneVisuals {
  switch (tone) {
    case 'reliable':
      return {
        container: 'bg-emerald-950/85 text-emerald-100 border-emerald-500/60',
        interactiveHover: 'hover:border-emerald-400 hover:bg-emerald-950',
        icon: (cls) => (
          <CheckCircle2 className={`${cls} text-emerald-200 shrink-0`} aria-hidden="true" />
        ),
      };
    case 'qualified_caution':
      return {
        container: 'bg-amber-950/85 text-amber-100 border-amber-500/60',
        interactiveHover: 'hover:border-amber-400 hover:bg-amber-950',
        icon: (cls) => (
          <AlertTriangle className={`${cls} text-amber-200 shrink-0`} aria-hidden="true" />
        ),
      };
    case 'qualified_info':
      return {
        container: 'bg-sky-950/85 text-sky-100 border-sky-500/60',
        interactiveHover: 'hover:border-sky-400 hover:bg-sky-950',
        icon: (cls) => (
          <Info className={`${cls} text-sky-200 shrink-0`} aria-hidden="true" />
        ),
      };
    case 'historical':
      return {
        container: 'bg-indigo-950/85 text-indigo-100 border-indigo-500/60',
        interactiveHover: 'hover:border-indigo-400 hover:bg-indigo-950',
        icon: (cls) => (
          <History className={`${cls} text-indigo-200 shrink-0`} aria-hidden="true" />
        ),
      };
    case 'unsupported':
      return {
        container: 'bg-rose-950/90 text-rose-100 border-rose-500/65',
        interactiveHover: 'hover:border-rose-400 hover:bg-rose-950',
        icon: (cls) => (
          <ShieldAlert className={`${cls} text-rose-200 shrink-0`} aria-hidden="true" />
        ),
      };
  }
}

export const RecommendationReliabilityBadge: React.FC<RecommendationReliabilityBadgeProps> = ({
  reliability,
  isLoading = false,
  emptyLabel,
  size = 'md',
  showActionability = true,
  interactive = true,
  isDetailsOpen = false,
  onToggleDetails,
  detailsControlsId,
  className = '',
}) => {
  const sizeClasses =
    size === 'sm' ? 'px-2.5 py-1 text-[11px] gap-1.5' : 'px-3 py-1.5 text-xs gap-2';
  const iconSizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  if (isLoading) {
    return (
      <span
        className={`inline-flex flex-wrap items-center max-w-full min-w-0 rounded-full border bg-slate-950/90 text-slate-100 border-slate-600/60 font-semibold select-none motion-reduce:animate-none ${sizeClasses} ${className}`}
      >
        <Loader2
          className={`${iconSizeClass} text-slate-200 shrink-0 animate-spin motion-reduce:animate-none`}
          aria-hidden="true"
        />
        <span>Evaluating Reliability…</span>
      </span>
    );
  }

  if (!reliability) {
    if (emptyLabel && emptyLabel.trim().length > 0) {
      return (
        <span
          className={`inline-flex flex-wrap items-center max-w-full min-w-0 rounded-full border bg-zinc-950/85 text-zinc-200 border-zinc-600/60 font-semibold select-none ${sizeClasses} ${className}`}
        >
          <Info className={`${iconSizeClass} text-zinc-200 shrink-0`} aria-hidden="true" />
          <span>{emptyLabel}</span>
        </span>
      );
    }
    return null;
  }

  const model = formatReliabilityPresentation(reliability);
  const visuals = getToneVisuals(model.badgeTone);
  const trimmedControlsId = detailsControlsId?.trim();
  const isInteractiveTrigger =
    interactive !== false &&
    typeof onToggleDetails === 'function' &&
    Boolean(trimmedControlsId);

  const badgeContent = (
    <>
      {visuals.icon(iconSizeClass)}
      <span className="font-semibold break-words">{model.badgeLabel}</span>
      {showActionability && (
        <>
          <span className="opacity-70" aria-hidden="true">
            ·
          </span>
          <span className="font-medium opacity-95 break-words">{model.actionabilityLabel}</span>
        </>
      )}
    </>
  );

  if (isInteractiveTrigger && trimmedControlsId) {
    return (
      <button
        type="button"
        onClick={onToggleDetails}
        aria-expanded={Boolean(isDetailsOpen)}
        aria-controls={trimmedControlsId}
        aria-label={model.triggerAriaLabel}
        data-reliability-status={model.status}
        data-reliability-tone={model.badgeTone}
        className={`inline-flex flex-wrap items-center max-w-full min-w-0 text-left rounded-full border transition-colors cursor-pointer ${sizeClasses} ${visuals.container} ${visuals.interactiveHover} ${className}`}
      >
        {badgeContent}
        {isDetailsOpen ? (
          <ChevronUp className="w-3.5 h-3.5 shrink-0 opacity-85" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-85" aria-hidden="true" />
        )}
      </button>
    );
  }

  return (
    <span
      data-reliability-status={model.status}
      data-reliability-tone={model.badgeTone}
      className={`inline-flex flex-wrap items-center max-w-full min-w-0 text-left rounded-full border select-none ${sizeClasses} ${visuals.container} ${className}`}
    >
      {badgeContent}
    </span>
  );
};
