import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  History,
  ShieldAlert,
} from 'lucide-react';
import type { RecommendationReliability } from '../types/genshin';
import {
  formatReliabilityPresentation,
  type ReliabilityBadgeTone,
} from '../services/reliability-presentation';

export interface RecommendationReliabilityBannerProps {
  reliability?: RecommendationReliability | null;
  contextLabel: string;
  onToggleDetails?: () => void;
  isDetailsOpen?: boolean;
  detailsControlsId?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'recovery' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

interface BannerToneStyles {
  wrapper: string;
  title: string;
  body: string;
  tag: string;
  secondaryButton: string;
  recoveryButton: string;
  icon: React.ReactNode;
}

function getBannerToneStyles(tone: ReliabilityBadgeTone): BannerToneStyles {
  switch (tone) {
    case 'reliable':
      return {
        wrapper: 'bg-emerald-950/75 border-emerald-500/55 text-emerald-100',
        title: 'text-emerald-100',
        body: 'text-emerald-200',
        tag: 'bg-emerald-950 text-emerald-100 border-emerald-500/50',
        secondaryButton:
          'bg-emerald-950 text-emerald-100 border-emerald-500/60 hover:border-emerald-300',
        recoveryButton:
          'bg-emerald-200 text-emerald-950 border-emerald-200 hover:bg-emerald-100',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0 mt-0.5" aria-hidden="true" />,
      };
    case 'qualified_caution':
      return {
        wrapper: 'bg-amber-950/75 border-amber-500/55 text-amber-100',
        title: 'text-amber-100',
        body: 'text-amber-200',
        tag: 'bg-amber-950 text-amber-100 border-amber-500/50',
        secondaryButton:
          'bg-amber-950 text-amber-100 border-amber-500/60 hover:border-amber-300',
        recoveryButton: 'bg-amber-200 text-amber-950 border-amber-200 hover:bg-amber-100',
        icon: <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0 mt-0.5" aria-hidden="true" />,
      };
    case 'qualified_info':
      return {
        wrapper: 'bg-sky-950/75 border-sky-500/55 text-sky-100',
        title: 'text-sky-100',
        body: 'text-sky-200',
        tag: 'bg-sky-950 text-sky-100 border-sky-500/50',
        secondaryButton: 'bg-sky-950 text-sky-100 border-sky-500/60 hover:border-sky-300',
        recoveryButton: 'bg-sky-200 text-sky-950 border-sky-200 hover:bg-sky-100',
        icon: <Info className="w-4 h-4 text-sky-200 shrink-0 mt-0.5" aria-hidden="true" />,
      };
    case 'historical':
      return {
        wrapper: 'bg-indigo-950/75 border-indigo-500/55 text-indigo-100',
        title: 'text-indigo-100',
        body: 'text-indigo-200',
        tag: 'bg-indigo-950 text-indigo-100 border-indigo-500/50',
        secondaryButton:
          'bg-indigo-950 text-indigo-100 border-indigo-500/60 hover:border-indigo-300',
        recoveryButton: 'bg-indigo-200 text-indigo-950 border-indigo-200 hover:bg-indigo-100',
        icon: <History className="w-4 h-4 text-indigo-200 shrink-0 mt-0.5" aria-hidden="true" />,
      };
    case 'unsupported':
      return {
        wrapper: 'bg-rose-950/85 border-rose-500/65 text-rose-100',
        title: 'text-rose-100',
        body: 'text-rose-200',
        tag: 'bg-rose-950 text-rose-100 border-rose-500/60',
        secondaryButton: 'bg-rose-950 text-rose-100 border-rose-400/70 hover:border-rose-300',
        recoveryButton: 'bg-rose-200 text-rose-950 border-rose-200 hover:bg-rose-100',
        icon: <ShieldAlert className="w-4 h-4 text-rose-200 shrink-0 mt-0.5" aria-hidden="true" />,
      };
  }
}

export const RecommendationReliabilityBanner: React.FC<RecommendationReliabilityBannerProps> = ({
  reliability,
  contextLabel,
  onToggleDetails,
  isDetailsOpen = false,
  detailsControlsId,
  primaryAction,
  secondaryAction,
  className = '',
}) => {
  if (!reliability) {
    return null;
  }

  const model = formatReliabilityPresentation(reliability);
  if (model.containerKind === 'none') {
    return null;
  }

  const styles = getBannerToneStyles(model.badgeTone);
  const trimmedControlsId = detailsControlsId?.trim();
  const canToggleDetails =
    typeof onToggleDetails === 'function' && Boolean(trimmedControlsId);
  const hasControls = Boolean(primaryAction || secondaryAction || canToggleDetails);

  // Render the formatter's bannerSummary once; include only warnings not already represented verbatim.
  const additionalWarnings = model.warnings.filter((warning) => {
    const trimmed = warning.trim();
    return trimmed.length > 0 && !model.bannerSummary.includes(trimmed);
  });

  const messageContent = (
    <div className="flex items-start gap-2.5 min-w-0">
      {styles.icon}
      <div className="min-w-0 flex-1 space-y-1 leading-relaxed">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className={`text-xs font-bold break-words ${styles.title}`}>{model.bannerTitle}</p>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${styles.tag}`}
          >
            {model.actionabilityLabel}
          </span>
        </div>
        <p className={`text-xs break-words ${styles.body}`}>{model.bannerSummary}</p>
        {additionalWarnings.length > 0 && (
          <ul className={`list-disc pl-4 space-y-0.5 text-[11px] break-words ${styles.body}`}>
            {additionalWarnings.map((warning, index) => (
              <li key={`${index}-${warning}`}>{warning}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const controlsContainer = hasControls ? (
    <div className="shrink-0 flex flex-wrap items-center gap-2">
      {primaryAction && (
        <button
          type="button"
          onClick={primaryAction.onClick}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
            primaryAction.variant === 'recovery'
              ? styles.recoveryButton
              : styles.secondaryButton
          }`}
        >
          {primaryAction.label}
        </button>
      )}
      {secondaryAction && (
        <button
          type="button"
          onClick={secondaryAction.onClick}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${styles.secondaryButton}`}
        >
          {secondaryAction.label}
        </button>
      )}
      {canToggleDetails && trimmedControlsId && (
        <button
          type="button"
          onClick={onToggleDetails}
          aria-expanded={Boolean(isDetailsOpen)}
          aria-controls={trimmedControlsId}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${styles.secondaryButton}`}
        >
          {isDetailsOpen ? 'Hide Details' : 'Details'}
        </button>
      )}
    </div>
  ) : null;

  const cardClasses = `w-full max-w-full min-w-0 p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${styles.wrapper} ${className}`;

  if (model.containerKind === 'context') {
    return (
      <section
        aria-label={`${contextLabel} reliability context`}
        data-reliability-severity={model.bannerSeverity}
        data-reliability-container="context"
        className={cardClasses}
      >
        <div className="min-w-0 flex-1">{messageContent}</div>
        {controlsContainer}
      </section>
    );
  }

  if (model.containerKind === 'status') {
    return (
      <div
        data-reliability-severity={model.bannerSeverity}
        data-reliability-container="status"
        className={cardClasses}
      >
        <div role="status" className="min-w-0 flex-1">
          {messageContent}
        </div>
        {controlsContainer}
      </div>
    );
  }

  return (
    <div
      data-reliability-severity={model.bannerSeverity}
      data-reliability-container="alert"
      className={cardClasses}
    >
      <div role="alert" aria-live="assertive" className="min-w-0 flex-1">
        {messageContent}
      </div>
      {controlsContainer}
    </div>
  );
};
