import type { MarginalInvestmentResponse, UpgradeCandidate } from '@celestia/api-contracts';

export interface MarginalUpgradeCardProps {
  marginalData?: MarginalInvestmentResponse | null;
  isLoading?: boolean;
  isGoodEnough?: boolean;
  className?: string;
}

export function MarginalUpgradeCard({
  marginalData,
  isLoading = false,
  isGoodEnough = false,
  className = '',
}: MarginalUpgradeCardProps) {
  if (isLoading) {
    return (
      <div
        className={`animate-pulse space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 ${className}`}
      >
        <div className="h-4 w-32 rounded bg-white/10" />
        <div className="h-6 w-48 rounded bg-white/10" />
        <div className="h-10 w-full rounded bg-white/5" />
      </div>
    );
  }

  if (!marginalData || !marginalData.currentReadiness) return null;

  const {
    currentReadiness,
    recommendedNextAction,
    rankedUpgrades = [],
    explanations = [],
  } = marginalData;
  const isReady = currentReadiness?.status === 'ready_for_target';
  const nextAction: UpgradeCandidate | null =
    recommendedNextAction ?? (rankedUpgrades.length > 0 ? rankedUpgrades[0] : null);

  // Farming trap explanation if present
  const trapWarning = explanations?.find(
    (exp) =>
      exp.toLowerCase().includes('farming trap') ||
      exp.toLowerCase().includes('crowning') ||
      exp.toLowerCase().includes('trap'),
  );

  return (
    <div className={`space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-400" aria-hidden="true">
            ▲
          </span>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            Highest-Yield Next Upgrade
          </h3>
        </div>
        {nextAction?.closesGap && (
          <span
            className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
            style={{
              background: 'rgba(56, 189, 248, 0.1)',
              borderColor: 'rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
            }}
          >
            Closes Target Gap
          </span>
        )}
      </div>

      {isGoodEnough ? (
        <div
          className="rounded-lg border p-3 text-xs leading-relaxed"
          style={{
            background: 'rgba(56, 189, 248, 0.06)',
            borderColor: 'rgba(56, 189, 248, 0.25)',
            color: '#bae6fd',
          }}
        >
          <strong className="mb-0.5 block font-semibold text-sky-300">
            Marked as Good Enough · Farming Muted
          </strong>
          <span>
            You have marked this character as meeting your standards. High-urgency farming calls are
            suppressed.
          </span>
        </div>
      ) : isReady && !nextAction ? (
        <div
          className="rounded-lg border p-3 text-xs leading-relaxed"
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            borderColor: 'rgba(16, 185, 129, 0.3)',
            color: '#a7f3d0',
          }}
        >
          <strong className="mb-0.5 block font-semibold text-emerald-300">
            Target Met · Diminishing Returns
          </strong>
          <span>
            This build satisfies all encounter thresholds. Further investment yields low marginal
            DPS return per resin spent.
          </span>
        </div>
      ) : nextAction ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.03] p-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-100">
                <span>{nextAction.target}</span>
                <span className="text-xs font-normal text-neutral-400">
                  Lv. {nextAction.currentLevel} → Lv. {nextAction.targetLevel}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-neutral-400">
                Category:{' '}
                <span className="capitalize">{nextAction.category.replace(/_/g, ' ')}</span>
              </p>
            </div>

            <div className="shrink-0 text-right">
              <span className="block font-mono text-xs font-semibold text-emerald-400">
                +{Math.round(nextAction.expectedScoreDelta * 10) / 10} pts
              </span>
              <span className="font-mono text-[10px] text-neutral-400">
                Eff: {nextAction.efficiencyScore.toFixed(3)}
              </span>
            </div>
          </div>

          {nextAction.costs.length > 0 && (
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                {nextAction.category === 'artifact_main_stat'
                  ? 'Domain Farming Target'
                  : 'Required Progression Materials'}
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {nextAction.costs.map((cost) => (
                  <div
                    key={cost.materialKey}
                    className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] p-2 text-xs"
                  >
                    <span className="mr-2 truncate text-neutral-300" title={cost.name}>
                      {cost.name}
                    </span>
                    {cost.materialKey !== 'ArtifactDomain' && (
                      <span className="shrink-0 font-mono font-medium text-amber-300/90">
                        ×{cost.count.toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isReady && (
            <p className="rounded border border-amber-500/20 bg-amber-500/[0.06] p-2 text-[11px] italic leading-relaxed text-amber-300/80">
              Note: Character is already target-ready. This upgrade provides incremental refinement
              with diminishing marginal returns.
            </p>
          )}

          {trapWarning && (
            <p className="rounded border border-rose-500/20 bg-rose-500/[0.06] p-2 text-[11px] leading-relaxed text-rose-300/80">
              {trapWarning}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs italic text-neutral-400">
          No immediate high-priority upgrades modeled for this build.
        </p>
      )}
    </div>
  );
}

export default MarginalUpgradeCard;
