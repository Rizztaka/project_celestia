import React, { useState, useRef } from 'react';
import type { EnhancedPullAdvice, PullBudgetState } from '../types/genshin';
import { generateProbabilityDistribution } from '../engines/gacha-math';
import { generate4StarProbabilityDistribution } from '../engines/gacha-4star';
import { useModalAccessibility } from '../hooks/useModalAccessibility';
import { X, TrendingUp, Info } from 'lucide-react';

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useModalAccessibility({
    isOpen: Boolean(item),
    onClose,
    containerRef: dialogRef,
    initialFocusRef: closeBtnRef,
  });

  if (!item) return null;

  const is4Star = Boolean(item.odds.isUncapped);
  const isWeapon = item.targetType === 'Signature_Weapon';
  const isChronicled = Boolean(
    bannerFilter && bannerFilter.toLowerCase().includes('chronicled')
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

  const points = is4Star
    ? generate4StarProbabilityDistribution(
        currentPity,
        isGuaranteed,
        bannerType === 'weapon' ? 'weapon' : 'character',
        copiesCount
      )
    : generateProbabilityDistribution(
        bannerType,
        currentPity,
        isGuaranteed,
        auxiliaryState,
        weaponGuaranteed,
        copiesCount
      );

  const maxPulls = points[points.length - 1]?.pulls || 180;
  const userPulls = pullsAvailable ?? item.odds.pullsAvailable ?? 0;

  // SVG Chart Geometry
  const width = 600;
  const height = 260;
  const padding = { top: 20, right: 30, bottom: 40, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (pull: number) => padding.left + (pull / maxPulls) * chartWidth;
  const getY = (prob: number) => padding.top + (1 - prob) * chartHeight;

  const userPoint = points.reduce((prev, curr) => {
    return Math.abs(curr.pulls - userPulls) < Math.abs(prev.pulls - userPulls) ? curr : prev;
  }, points[0]);

  const activeHoverPoint =
    hoveredPull !== null
      ? points.reduce((prev, curr) => {
          return Math.abs(curr.pulls - hoveredPull) < Math.abs(prev.pulls - hoveredPull)
            ? curr
            : prev;
        }, points[0])
      : null;

  const pathData = points
    .map((p, idx) => {
      const x = getX(p.pulls).toFixed(1);
      const y = getY(p.probability).toFixed(1);
      return idx === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  const areaData = `${pathData} L ${(padding.left + chartWidth).toFixed(1)} ${(
    padding.top + chartHeight
  ).toFixed(1)} L ${padding.left} ${(padding.top + chartHeight).toFixed(1)} Z`;

  const updatePointerPull = (clientX: number, svgEl: SVGSVGElement) => {
    const rect = svgEl.getBoundingClientRect();
    if (rect.width <= 0) return;
    const scaleX = width / rect.width;
    const svgX = (clientX - rect.left) * scaleX;
    const pullVal = Math.round(((svgX - padding.left) / chartWidth) * maxPulls);
    setHoveredPull(Math.max(0, Math.min(maxPulls, pullVal)));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="distribution-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-[#121420] border border-[#2c334d] rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative space-y-5 text-zinc-100 max-h-[90vh] overflow-y-auto focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#24293d] pb-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/35 flex items-center justify-center text-sky-300 shrink-0">
                <TrendingUp className="w-4 h-4" aria-hidden="true" />
              </div>
              <h2
                id="distribution-modal-title"
                className="text-base sm:text-lg font-bold text-zinc-100 font-serif"
              >
                Cumulative Wish Probability (CDF)
              </h2>
            </div>
            <p className="text-xs text-zinc-300">
              Exact mathematical probability distribution for{' '}
              <span className="text-[#f3cf58] font-semibold">{item.name}</span> ({item.targetLevelText}).
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close probability distribution dialog"
            className="min-w-[40px] min-h-[40px] rounded-xl text-zinc-300 hover:text-white bg-[#1a1e2e] hover:bg-[#252b42] border border-[#323954] flex items-center justify-center cursor-pointer transition-colors shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Milestone Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#0e1019] p-3 rounded-xl border border-[#22273c] text-center">
            <div className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold">
              25th Percentile
            </div>
            <div className="text-base font-bold text-sky-300 font-mono mt-0.5 tabular-nums">
              {item.odds.p25 !== undefined ? `${item.odds.p25} pulls` : '~ pulls'}
            </div>
            <div className="text-[11px] text-zinc-300">Lucky outcome</div>
          </div>

          <div className="bg-[#0e1019] p-3 rounded-xl border border-[#22273c] text-center">
            <div className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold">
              Median (50%)
            </div>
            <div className="text-base font-bold text-[#f3cf58] font-mono mt-0.5 tabular-nums">
              {`${item.odds.medianPulls} pulls`}
            </div>
            <div className="text-[11px] text-zinc-300">Typical player cost</div>
          </div>

          <div className="bg-[#0e1019] p-3 rounded-xl border border-[#22273c] text-center">
            <div className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold">
              90th Percentile
            </div>
            <div className="text-base font-bold text-amber-300 font-mono mt-0.5 tabular-nums">
              {item.odds.p90 !== undefined ? `${item.odds.p90} pulls` : '~ pulls'}
            </div>
            <div className="text-[11px] text-zinc-300">Unlucky budget</div>
          </div>

          <div className="bg-[#0e1019] p-3 rounded-xl border border-[#22273c] text-center">
            <div className="text-[11px] text-zinc-300 uppercase tracking-wider font-semibold">
              {is4Star ? '99th Percentile' : 'Hard Ceiling (100%)'}
            </div>
            <div className="text-base font-bold text-emerald-300 font-mono mt-0.5 tabular-nums">
              {is4Star ? 'Uncapped' : `${item.odds.guaranteedPulls} pulls`}
            </div>
            <div className="text-[11px] text-zinc-300">
              {is4Star ? 'No hard guarantee' : 'Absolute certainty'}
            </div>
          </div>
        </div>

        {/* SVG Interactive Chart (mouse + touch pointer scrubbing) */}
        <div className="bg-[#0b0d15] p-4 rounded-xl border border-[#22273c] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-zinc-200">
              Cumulative Success vs Pull Count
            </span>
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37]" aria-hidden="true" />
                <span>
                  Your Pulls: <strong className="text-white">{userPulls}</strong> ({`${(userPoint?.probability ? userPoint.probability * 100 : 0).toFixed(1)}%`})
                </span>
              </span>
              {activeHoverPoint && (
                <span className="flex items-center gap-1.5 text-sky-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-300" aria-hidden="true" />
                  <span>
                    Inspect: {`${activeHoverPoint.pulls}p`} ({`${(activeHoverPoint.probability * 100).toFixed(1)}%`})
                  </span>
                </span>
              )}
            </div>
          </div>

          <div className="relative overflow-hidden flex justify-center">
            <svg
              role="img"
              aria-label={`Cumulative probability curve for ${item.name}. Median is ${item.odds.medianPulls} pulls, 90th percentile is ${item.odds.p90 ?? 'unknown'} pulls.`}
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto select-none touch-none"
              onPointerMove={(e) => updatePointerPull(e.clientX, e.currentTarget)}
              onPointerDown={(e) => updatePointerPull(e.clientX, e.currentTarget)}
              onPointerLeave={() => setHoveredPull(null)}
            >
              <defs>
                <linearGradient id="cdfGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4af37" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#d4af37" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid Lines & Labels */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((prob) => {
                const y = getY(prob);
                return (
                  <g key={prob}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={padding.left + chartWidth}
                      y2={y}
                      stroke="#22283e"
                      strokeWidth="1"
                      strokeDasharray={prob === 0 || prob === 1.0 ? 'none' : '4 4'}
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 3}
                      fill="#c4c9d6"
                      fontSize="11"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {(prob * 100).toFixed(0)}%
                    </text>
                  </g>
                );
              })}

              {/* X Axis Ticks */}
              {[
                0,
                Math.round(maxPulls * 0.25),
                Math.round(maxPulls * 0.5),
                Math.round(maxPulls * 0.75),
                maxPulls,
              ].map((pullVal) => {
                const x = getX(pullVal);
                return (
                  <g key={pullVal}>
                    <line
                      x1={x}
                      y1={padding.top + chartHeight}
                      x2={x}
                      y2={padding.top + chartHeight + 4}
                      stroke="#323954"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={padding.top + chartHeight + 18}
                      fill="#c4c9d6"
                      fontSize="11"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {pullVal}p
                    </text>
                  </g>
                );
              })}

              {/* Shaded Area & Curve */}
              <path d={areaData} fill="url(#cdfGradient)" />
              <path
                d={pathData}
                fill="none"
                stroke="#d4af37"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* User Current Budget Line */}
              {userPulls > 0 && userPulls <= maxPulls && (
                <g>
                  <line
                    x1={getX(userPulls)}
                    y1={padding.top}
                    x2={getX(userPulls)}
                    y2={padding.top + chartHeight}
                    stroke="#d4af37"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={getX(userPulls)}
                    cy={getY(userPoint.probability)}
                    r="4.5"
                    fill="#d4af37"
                    stroke="#0b0d15"
                    strokeWidth="2"
                  />
                </g>
              )}

              {/* Interactive Hover Crosshair */}
              {activeHoverPoint && (
                <g>
                  <line
                    x1={getX(activeHoverPoint.pulls)}
                    y1={padding.top}
                    x2={getX(activeHoverPoint.pulls)}
                    y2={padding.top + chartHeight}
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={getX(activeHoverPoint.pulls)}
                    cy={getY(activeHoverPoint.probability)}
                    r="4.5"
                    fill="#38bdf8"
                    stroke="#0b0d15"
                    strokeWidth="2"
                  />
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Multi-Copy breakdown */}
        {copiesCount > 1 && item.odds.copiesBreakdown && (
          <div className="bg-[#0e1019] p-3.5 rounded-xl border border-[#22273c] space-y-2.5">
            <span className="text-xs font-bold text-zinc-200 block">
              Multi-Copy Cumulative Milestone Breakdown ({copiesCount} Copies Target):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {item.odds.copiesBreakdown.map((copy) => (
                <div
                  key={copy.copyNumber}
                  className="bg-[#151826] p-2.5 rounded-lg border border-[#282f48] text-center"
                >
                  <span className="text-zinc-300 block text-[11px]">{`Copy ${copy.copyNumber}`}</span>
                  <span className="text-[#f3cf58] font-bold font-mono">
                    {`~${copy.medianPulls}p median`}
                  </span>
                  <span className="text-[11px] text-zinc-300 block">
                    {copy.guaranteedPulls ? `${copy.guaranteedPulls}p hard` : 'Uncapped'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Educational Note */}
        <div className="text-xs text-zinc-200 leading-relaxed bg-[#0e1019] p-3.5 rounded-xl border border-[#22273c] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <strong className="text-zinc-100">Probability vs Certainty:</strong>{' '}
            {is4Star ? (
              <span>
                Featured 4-star targets have <strong>no hard pity or Fate Point guarantee</strong>. While the median is ~35 pulls, severe streaks can occasionally exceed 100+ pulls without acquiring the specific rate-up.
              </span>
            ) : (
              <span>
                Reaching the 50% median only gives a coin-flip chance of success. For risk-averse planning before a banner ends, target the <strong>90th percentile</strong> ({item.odds.p90} pulls) or the absolute guarantee ({item.odds.guaranteedPulls} pulls).
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
