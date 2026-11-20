import React, { useState } from 'react';
import type { EnhancedPullAdvice, PullBudgetState } from '../types/genshin';
import { generateProbabilityDistribution } from '../engines/gacha-math';
import { generate4StarProbabilityDistribution } from '../engines/gacha-4star';
import { X, TrendingUp, Info, CheckCircle2 } from 'lucide-react';

interface PullDistributionModalProps {
  item: EnhancedPullAdvice | null;
  onClose: () => void;
  pullsAvailable?: number;
  budget?: PullBudgetState;
  bannerFilter?: string;
}

export const PullDistributionModal: React.FC<PullDistributionModalProps> = ({
  item,
  onClose,
  pullsAvailable,
  budget,
  bannerFilter,
}) => {
  const [hoveredPull, setHoveredPull] = useState<number | null>(null);

  if (!item) return null;

  const is4Star = Boolean(item.odds.isUncapped);
  const isWeapon = item.targetType === 'Signature_Weapon';
  const isChronicled = Boolean(
    bannerFilter &&
      (bannerFilter.toLowerCase().includes('chronicled'))
  );

  const bannerType: 'character' | 'weapon' | 'chronicled' = isChronicled
    ? 'chronicled'
    : isWeapon
      ? 'weapon'
      : 'character';

  const currentPity = isChronicled
    ? (budget?.chronicledPity ?? 0)
    : isWeapon
      ? (budget?.weaponPity ?? 0)
      : (budget?.characterPity ?? 0);

  const isGuaranteed = isChronicled
    ? false
    : isWeapon
      ? false
      : (budget?.characterGuaranteed ?? false);

  const auxiliaryState = isChronicled
    ? (budget?.chronicledFatePoints ?? 0)
    : isWeapon
      ? (budget?.weaponFatePoints ?? 0)
      : (budget?.consecutiveLossCount ?? 0);

  const weaponGuaranteed = isWeapon ? (budget?.weaponGuaranteed ?? false) : false;
  const copiesCount = item.odds.copiesBreakdown?.length || 1;

  // Generate CDF data points
  const points = is4Star
    ? generate4StarProbabilityDistribution(0, false, 'character', copiesCount)
    : generateProbabilityDistribution(
        bannerType,
        currentPity,
        isGuaranteed,
        auxiliaryState,
        weaponGuaranteed,
        copiesCount,
      );

  const effectiveAvailable = pullsAvailable !== undefined ? pullsAvailable : item.odds.pullsAvailable;
  const maxPulls = Math.max(1, points[points.length - 1]?.pulls || (is4Star ? 120 : 180));
  const activePull = hoveredPull !== null ? hoveredPull : Math.min(effectiveAvailable, maxPulls);
  const activeProbPoint =
    points[activePull] ?? points.find((p) => p.pulls === activePull) ?? points[points.length - 1];
  const activeProbPct = ((activeProbPoint?.probability || 0) * 100).toFixed(1);

  const handlePointerInteraction = (clientX: number, currentTarget: SVGSVGElement) => {
    const rect = currentTarget.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (mouseX - padding.left) / chartWidth));
    setHoveredPull(Math.round(ratio * maxPulls));
  };

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Build SVG path
  const pathData = points
    .map((p, i) => {
      const x = padding.left + (p.pulls / maxPulls) * chartWidth;
      const y = padding.top + (1 - p.probability) * chartHeight;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const areaData = `${pathData} L ${(padding.left + chartWidth).toFixed(1)} ${(padding.top + chartHeight).toFixed(1)} L ${padding.left} ${(padding.top + chartHeight).toFixed(1)} Z`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="distribution-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#12141e] border border-[#262c42] rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5 text-zinc-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#202538] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h2 id="distribution-modal-title" className="text-lg font-bold text-zinc-100">
                Cumulative Wish Probability (CDF)
              </h2>
            </div>
            <p className="text-xs text-zinc-400">
              Exact mathematical probability distribution for{' '}
              <span className="text-[#d4af37] font-semibold">{item.name}</span> ({item.targetLevelText}).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 bg-[#181c2a] border border-[#2b334d] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Milestone Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#0e1017] p-3 rounded-xl border border-[#1e2233] text-center">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              25th Percentile
            </div>
            <div className="text-base font-bold text-sky-400 font-mono mt-0.5">
              {item.odds.p25 ?? '~'} pulls
            </div>
            <div className="text-[10px] text-zinc-500">Lucky outcome</div>
          </div>

          <div className="bg-[#0e1017] p-3 rounded-xl border border-[#1e2233] text-center">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              Median (50%)
            </div>
            <div className="text-base font-bold text-[#d4af37] font-mono mt-0.5">
              {item.odds.medianPulls} pulls
            </div>
            <div className="text-[10px] text-zinc-500">Typical player cost</div>
          </div>

          <div className="bg-[#0e1017] p-3 rounded-xl border border-[#1e2233] text-center">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              90th Percentile
            </div>
            <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
              {item.odds.p90 ?? '~'} pulls
            </div>
            <div className="text-[10px] text-zinc-500">Unlucky boundary</div>
          </div>

          <div className="bg-[#0e1017] p-3 rounded-xl border border-[#1e2233] text-center">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              Hard Ceiling (100%)
            </div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
              {is4Star ? 'Uncapped' : `${item.odds.guaranteedPulls} pulls`}
            </div>
            <div className="text-[10px] text-zinc-500">
              {is4Star ? 'No hard guarantee' : 'Absolute certainty'}
            </div>
          </div>
        </div>

        {/* Interactive SVG Chart */}
        <div className="bg-[#0e1017] p-4 rounded-xl border border-[#1e2233] space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Cumulative Probability Curve:</span>
            <span className="font-mono text-zinc-200">
              At <strong className="text-[#d4af37]">{activePull}</strong> pulls:{' '}
              <strong className="text-emerald-400">{`${activeProbPct}%`}</strong>
            </span>
          </div>

          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto select-none touch-none"
              onMouseMove={(e) => handlePointerInteraction(e.clientX, e.currentTarget)}
              onMouseLeave={() => setHoveredPull(null)}
              onPointerMove={(e) => handlePointerInteraction(e.clientX, e.currentTarget)}
              onPointerDown={(e) => handlePointerInteraction(e.clientX, e.currentTarget)}
              onPointerLeave={() => setHoveredPull(null)}
              onTouchMove={(e) => {
                if (e.touches && e.touches[0]) {
                  handlePointerInteraction(e.touches[0].clientX, e.currentTarget);
                }
              }}
              onTouchStart={(e) => {
                if (e.touches && e.touches[0]) {
                  handlePointerInteraction(e.touches[0].clientX, e.currentTarget);
                }
              }}
              onTouchEnd={() => setHoveredPull(null)}
            >
              {/* Gridlines */}
              {[0.25, 0.5, 0.75, 1.0].map((prob) => {
                const y = padding.top + (1 - prob) * chartHeight;
                return (
                  <g key={prob}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={padding.left + chartWidth}
                      y2={y}
                      stroke="#22283a"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padding.left - 6}
                      y={y + 3}
                      fill="#64748b"
                      fontSize="9"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {(prob * 100).toFixed(0)}%
                    </text>
                  </g>
                );
              })}

              {/* X-axis labels */}
              {[0, Math.round(maxPulls / 2), maxPulls].map((pull) => {
                const x = padding.left + (pull / maxPulls) * chartWidth;
                return (
                  <text
                    key={pull}
                    x={x}
                    y={padding.top + chartHeight + 18}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {pull} pulls
                  </text>
                );
              })}

              {/* Shaded Area */}
              <path d={areaData} fill="url(#gradCyan)" opacity="0.25" />

              {/* Gradient Definition */}
              <defs>
                <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* CDF Curve Line */}
              <path d={pathData} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />

              {/* Active Marker Line */}
              {(activePull > 0 || hoveredPull !== null) && (
                <g>
                  <line
                    x1={padding.left + (activePull / maxPulls) * chartWidth}
                    y1={padding.top}
                    x2={padding.left + (activePull / maxPulls) * chartWidth}
                    y2={padding.top + chartHeight}
                    stroke="#d4af37"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={padding.left + (activePull / maxPulls) * chartWidth}
                    cy={padding.top + (1 - Number(activeProbPoint?.probability || 0)) * chartHeight}
                    r="4"
                    fill="#d4af37"
                    stroke="#0e1017"
                    strokeWidth="2"
                  />
                </g>
              )}
            </svg>
          </div>

          <div className="text-[11px] text-zinc-500 text-center">
            Tip: Hover over the graph or adjust your pulls in the budget tracker to preview probability milestones.
          </div>
        </div>

        {/* Multi-Copy Step Breakdown (if applicable) */}
        {item.odds.copiesBreakdown && item.odds.copiesBreakdown.length > 1 && (
          <div className="bg-[#0e1017] p-4 rounded-xl border border-[#1e2233] space-y-2.5">
            <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Multi-Copy Cumulative Milestone Breakdown</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#202538] text-zinc-400">
                    <th className="py-1.5 font-medium">Milestone</th>
                    <th className="py-1.5 font-medium text-center">Median Pulls</th>
                    <th className="py-1.5 font-medium text-center">Expected Mean</th>
                    <th className="py-1.5 font-medium text-center">Hard Guarantee</th>
                    <th className="py-1.5 font-medium text-right">Probability with Your Pulls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181c2b] font-mono">
                  {item.odds.copiesBreakdown.map((step) => (
                    <tr key={step.copyNumber} className="hover:bg-[#151824]">
                      <td className="py-2 text-zinc-200 font-sans font-medium">{step.label}</td>
                      <td className="py-2 text-center text-[#d4af37]">~{step.medianPulls}</td>
                      <td className="py-2 text-center text-zinc-300">~{step.expectedPulls}</td>
                      <td className="py-2 text-center text-emerald-400">
                        {is4Star ? 'Uncapped' : `${step.guaranteedPulls}p`}
                      </td>
                      <td className="py-2 text-right text-sky-400 font-bold">
                        {(step.cumulativeProbability * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Explanatory Callout */}
        <div className="bg-[#151928] border border-[#2b334d] p-3.5 rounded-xl text-xs text-zinc-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-zinc-100">Probability vs Certainty:</span>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              {is4Star ? (
                <>
                  Featured 4-star targets have <strong>no hard pity or Fate Point guarantee</strong>. While the
                  median is ~35 pulls, catastrophic streaks are possible. Plan your budget conservatively.
                </>
              ) : (
                <>
                  Expected and median costs reflect typical outcome distributions (~{item.odds.medianPulls} pulls).
                  However, having fewer than the hard guarantee ({item.odds.guaranteedPulls} pulls) means there is still
                  a non-zero risk of losing both 50/50s.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
