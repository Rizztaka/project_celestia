import React, { useState } from 'react';
import type { DiminishingReturnsPoint } from '../types/genshin';
import { TrendingUp, HelpCircle } from 'lucide-react';

interface ArtifactDiminishingReturnsCurveProps {
  curve: DiminishingReturnsPoint[];
  characterName: string;
  totalRollValue: number;
}

export const ArtifactDiminishingReturnsCurve: React.FC<ArtifactDiminishingReturnsCurveProps> = ({
  curve,
  characterName,
  totalRollValue,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!curve || curve.length === 0) return null;

  const width = 640;
  const height = 240;
  const padding = { top: 25, right: 30, bottom: 40, left: 55 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxDays = curve[curve.length - 1].days;

  // Scales
  const getX = (days: number) => padding.left + (days / maxDays) * innerWidth;
  const getY = (prob: number) => padding.top + innerHeight - prob * innerHeight;

  // Build SVG path
  const pathD = curve.reduce((acc, pt, index) => {
    const x = getX(pt.days);
    const y = getY(pt.probability);
    return `${acc} ${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, '');

  const areaD = `${pathD} L ${getX(maxDays)} ${getY(0)} L ${getX(curve[0].days)} ${getY(0)} Z`;

  // Find 50%, 80%, 90% confidence points
  const p50 = curve.find((pt) => pt.probability >= 0.5);
  const p80 = curve.find((pt) => pt.probability >= 0.8);
  const p90 = curve.find((pt) => pt.probability >= 0.9);

  const activePoint = hoverIndex !== null ? curve[hoverIndex] : p50 || curve[Math.floor(curve.length / 2)];

  return (
    <div className="bg-[#12141d] border border-[#23273a] p-5 rounded-2xl shadow-lg space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#202538] pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#d4af37]" />
          <h3 className="text-sm font-bold text-zinc-100">
            Resin Investment vs. Upgrade Probability
          </h3>
          <span className="text-xs text-zinc-400">({characterName} · {totalRollValue}% Total RV)</span>
        </div>

        {/* Dynamic Metric Badge */}
        {activePoint && (
          <div className="flex items-center gap-2 bg-[#181b28] px-3 py-1.5 rounded-lg border border-[#2d344d] text-xs">
            <span className="text-zinc-400">Day {activePoint.days} ({activePoint.resin.toLocaleString()} Resin):</span>
            <span className="text-[#d4af37] font-bold">{(activePoint.probability * 100).toFixed(1)}% Chance</span>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (25%, 50%, 75%, 100%) */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((level) => {
            const y = getY(level);
            return (
              <g key={level}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1c2132"
                  strokeDasharray={level === 0 || level === 1 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="end"
                  className="font-mono"
                >
                  {(level * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* X Axis ticks */}
          {[1, 15, 30, 45, 60].map((d) => {
            const x = getX(d);
            return (
              <g key={d}>
                <line
                  x1={x}
                  y1={height - padding.bottom}
                  x2={x}
                  y2={height - padding.bottom + 5}
                  stroke="#2c3347"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="middle"
                  className="font-mono"
                >
                  {d}d
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={padding.left + innerWidth / 2}
            y={height - 6}
            fill="#94a3b8"
            fontSize="10"
            textAnchor="middle"
            className="font-semibold"
          >
            Farming Time in Days (180 Daily Resin = 9 Domain Runs/Day)
          </text>

          {/* Area Fill */}
          <path d={areaD} fill="url(#curveGradient)" />

          {/* Main Curve Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#d4af37"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* 50% Median Marker */}
          {p50 && (
            <g>
              <line
                x1={getX(p50.days)}
                y1={padding.top}
                x2={getX(p50.days)}
                y2={height - padding.bottom}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
              <circle
                cx={getX(p50.days)}
                cy={getY(p50.probability)}
                r="4.5"
                fill="#10b981"
                stroke="#0a0b0e"
                strokeWidth="2"
              />
              <text
                x={getX(p50.days) + 6}
                y={padding.top + 16}
                fill="#10b981"
                fontSize="10"
                className="font-bold"
              >
                50% (Day {p50.days})
              </text>
            </g>
          )}

          {/* 80% Reasonable Milestone */}
          {p80 && p80.days !== p50?.days && (
            <g>
              <circle
                cx={getX(p80.days)}
                cy={getY(p80.probability)}
                r="4"
                fill="#38bdf8"
                stroke="#0a0b0e"
                strokeWidth="1.5"
              />
              <text
                x={getX(p80.days) + 6}
                y={getY(p80.probability) - 6}
                fill="#38bdf8"
                fontSize="9"
                className="font-semibold"
              >
                80% (Day {p80.days})
              </text>
            </g>
          )}

          {/* 90% Near Certainty Milestone */}
          {p90 && (
            <g>
              <circle
                cx={getX(p90.days)}
                cy={getY(p90.probability)}
                r="4"
                fill="#c084fc"
                stroke="#0a0b0e"
                strokeWidth="1.5"
              />
              <text
                x={getX(p90.days) - 6}
                y={getY(p90.probability) - 6}
                fill="#c084fc"
                fontSize="9"
                textAnchor="end"
                className="font-semibold"
              >
                90% (Day {p90.days})
              </text>
            </g>
          )}

          {/* Invisible interactive hover rects */}
          {curve.map((pt, i) => {
            const x = getX(pt.days) - (innerWidth / maxDays) / 2;
            const barWidth = innerWidth / maxDays;
            return (
              <rect
                key={pt.days}
                x={x}
                y={padding.top}
                width={barWidth}
                height={innerHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoverIndex(i)}
              />
            );
          })}

          {/* Hover indicator crosshair */}
          {hoverIndex !== null && (
            <g pointerEvents="none">
              <line
                x1={getX(curve[hoverIndex].days)}
                y1={padding.top}
                x2={getX(curve[hoverIndex].days)}
                y2={height - padding.bottom}
                stroke="#f59e0b"
                strokeWidth="1"
              />
              <circle
                cx={getX(curve[hoverIndex].days)}
                cy={getY(curve[hoverIndex].probability)}
                r="5"
                fill="#f59e0b"
                stroke="#0a0b0e"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Footer Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400 pt-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>50% Target (Median Expectation)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
            <span>80% Target (Comfortable Clear)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
            <span>90% Target (Near Ceiling)</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-zinc-500">
          <HelpCircle className="w-3 h-3" />
          <span>Formula: P(t) = 1 - (1 - p)^(9 × Days)</span>
        </div>
      </div>
    </div>
  );
};
