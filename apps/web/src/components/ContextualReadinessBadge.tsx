import type { ReadinessStatus } from '@celestia/api-contracts';

export interface ContextualReadinessBadgeProps {
  status: ReadinessStatus;
  score: number;
  isGoodEnough?: boolean;
  compact?: boolean;
  className?: string;
}

const statusConfig: Record<
  ReadinessStatus,
  { label: string; bg: string; border: string; text: string; icon: string }
> = {
  ready_for_target: {
    label: 'Ready for Target',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.4)',
    text: '#34d399',
    icon: '✓',
  },
  conditional: {
    label: 'Conditional',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.4)',
    text: '#fbbf24',
    icon: '⚠',
  },
  needs_investment: {
    label: 'Needs Investment',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.4)',
    text: '#f87171',
    icon: '✕',
  },
  insufficient_data: {
    label: 'Incomplete Data',
    bg: 'rgba(113, 113, 122, 0.15)',
    border: 'rgba(113, 113, 122, 0.4)',
    text: '#a1a1aa',
    icon: '?',
  },
};

export function ContextualReadinessBadge({
  status,
  score,
  isGoodEnough = false,
  compact = false,
  className = '',
}: ContextualReadinessBadgeProps) {
  const cfg = statusConfig[status] ?? statusConfig.insufficient_data;
  const roundedScore = Math.round(score);

  if (isGoodEnough) {
    return (
      <span
        className={`shadow-xs inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}
        style={{
          background: 'rgba(56, 189, 248, 0.12)',
          borderColor: 'rgba(56, 189, 248, 0.4)',
          color: '#38bdf8',
        }}
        role="status"
        title="Marked as Good Enough: Farming alerts muted"
      >
        <span aria-hidden="true">★</span>
        <span>Target Met · Maintained</span>
        <span
          className="py-0.2 ml-1 rounded-full px-1.5 font-mono text-[10px]"
          style={{ background: 'rgba(56, 189, 248, 0.2)' }}
        >
          {roundedScore}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`shadow-xs inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}
      style={{
        background: cfg.bg,
        borderColor: cfg.border,
        color: cfg.text,
      }}
      role="status"
      aria-label={`Readiness: ${cfg.label}, score ${roundedScore} out of 100`}
    >
      <span aria-hidden="true" className="font-bold">
        {cfg.icon}
      </span>
      <span>{cfg.label}</span>
      {!compact && (
        <span
          className="py-0.2 ml-1 rounded-full px-1.5 font-mono text-[10px]"
          style={{ background: 'rgba(255, 255, 255, 0.08)' }}
        >
          {roundedScore}
        </span>
      )}
    </span>
  );
}

export default ContextualReadinessBadge;
