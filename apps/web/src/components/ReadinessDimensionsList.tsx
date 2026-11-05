import type {
  ReadinessDimension,
  ReadinessDimensionResult,
  ReadinessStatus,
} from '@celestia/api-contracts';
import { useState } from 'react';

export interface ReadinessDimensionsListProps {
  dimensions: Partial<Record<ReadinessDimension, ReadinessDimensionResult>>;
  explanations?: string[];
  defaultOpen?: boolean;
}

const dimensionLabels: Record<ReadinessDimension, { label: string; icon: string }> = {
  talents: { label: 'Talent Levels', icon: '✦' },
  weapon: { label: 'Weapon Level & Fit', icon: '◇' },
  main_stats: { label: 'Artifact Main Stats', icon: '◈' },
  set_activation: { label: 'Set Activation', icon: '◆' },
  rotation_energy: { label: 'Rotation Energy (ER)', icon: '⚡' },
  support_output: { label: 'Support Output & Scaling', icon: '🛡' },
};

const dimensionOrder: ReadinessDimension[] = [
  'talents',
  'weapon',
  'main_stats',
  'set_activation',
  'rotation_energy',
  'support_output',
];

const statusStyle: Record<ReadinessStatus, { text: string; bg: string; icon: string }> = {
  ready_for_target: { text: '#34d399', bg: 'rgba(16, 185, 129, 0.1)', icon: '✓' },
  conditional: { text: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)', icon: '⚠' },
  needs_investment: { text: '#f87171', bg: 'rgba(239, 68, 68, 0.1)', icon: '✕' },
  insufficient_data: { text: '#a1a1aa', bg: 'rgba(113, 113, 122, 0.1)', icon: '?' },
};

export function ReadinessDimensionsList({
  dimensions,
  explanations = [],
  defaultOpen = false,
}: ReadinessDimensionsListProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const energyDim = dimensions.rotation_energy;
  const energyDetails = energyDim?.details as
    | {
        hasEnergyDeficit?: boolean;
        deficitPp?: number;
        observedEr?: number | null;
        effectiveThreshold?: number;
      }
    | undefined;

  const hasErDeficit =
    energyDim?.status === 'needs_investment' ||
    Boolean(energyDetails?.hasEnergyDeficit) ||
    Boolean(energyDetails?.deficitPp && energyDetails.deficitPp > 0);

  return (
    <div className="space-y-3">
      {hasErDeficit && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border p-3"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
          }}
        >
          <span className="text-base font-bold leading-none text-red-400" aria-hidden="true">
            ⚡
          </span>
          <div className="text-xs leading-relaxed">
            <strong className="mb-0.5 block font-semibold text-red-300">
              Energy Deficit Gating Build
            </strong>
            <span>
              {energyDetails?.observedEr !== undefined &&
              energyDetails?.effectiveThreshold !== undefined
                ? `Current Energy Recharge (${Math.round(energyDetails.observedEr ?? 0)}%) falls short of the target threshold (${Math.round(energyDetails.effectiveThreshold)}%). Burst uptime defeats raw stat improvements.`
                : 'Insufficient Energy Recharge compromises burst availability per rotation. Address ER requirements before maximizing offensive substats.'}
            </span>
          </div>
        </div>
      )}

      <details
        className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]"
        open={isOpen}
        onToggle={(e) => setIsOpen(e.currentTarget.open)}
      >
        <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3 transition-colors hover:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-300">
              Readiness Dimensions Checklist
            </span>
            <span className="text-[11px] text-neutral-500">
              ({dimensionOrder.filter((d) => dimensions[d]?.isReady).length}/6 Met)
            </span>
          </div>
          <span className="text-xs text-neutral-400 transition-transform group-open:rotate-180">
            ▼
          </span>
        </summary>

        <div className="space-y-2 border-t border-white/5 p-4 pt-1">
          {dimensionOrder.map((dimKey) => {
            const dim = dimensions[dimKey];
            if (!dim) return null;
            const meta = dimensionLabels[dimKey];
            const style = statusStyle[dim.status] ?? statusStyle.insufficient_data;

            return (
              <div
                key={dimKey}
                className="flex flex-col justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.015] p-2 text-xs sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
                    style={{ background: style.bg, color: style.text }}
                    aria-hidden="true"
                  >
                    {style.icon}
                  </span>
                  <span className="truncate font-medium text-neutral-200">{meta.label}</span>
                </div>

                <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
                  {dim.missingReasons.length > 0 && (
                    <span className="text-[10px] italic text-neutral-400">
                      {dim.missingReasons.join(', ').replace(/_/g, ' ')}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-800">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(5, Math.min(100, dim.score))}%`,
                          backgroundColor: style.text,
                        }}
                      />
                    </div>
                    <span className="w-7 text-right font-mono text-[11px] text-neutral-400">
                      {Math.round(dim.score)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {explanations.length > 0 && (
            <div className="mt-3 border-t border-white/5 pt-3">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Diagnostic Rationale
              </span>
              <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-neutral-400">
                {explanations.map((exp, idx) => (
                  <li key={idx}>{exp}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

export default ReadinessDimensionsList;
