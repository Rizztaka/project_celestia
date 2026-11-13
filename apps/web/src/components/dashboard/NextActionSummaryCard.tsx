import type { CompanionSummaryResponse, PrimaryActionCategory } from '@celestia/api-contracts';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { UiIcon } from '../Ui';

function parseEpistemologicalPoint(point: string): {
  badge: { label: string; className: string } | null;
  text: string;
} {
  if (point.startsWith('[Game Rule]')) {
    return {
      badge: {
        label: 'Game Rule',
        className: 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300',
      },
      text: point.replace('[Game Rule]', '').trim(),
    };
  }
  if (point.startsWith('[Simulated]')) {
    return {
      badge: {
        label: 'GCSim Simulation',
        className: 'border-cyan-500/40 bg-cyan-950/60 text-cyan-300',
      },
      text: point.replace('[Simulated]', '').trim(),
    };
  }
  if (point.startsWith('[Comfort & Goals]')) {
    return {
      badge: {
        label: 'Comfort & Goals',
        className: 'border-indigo-500/40 bg-indigo-950/60 text-indigo-300',
      },
      text: point.replace('[Comfort & Goals]', '').trim(),
    };
  }
  return { badge: null, text: point };
}

export function NextActionSummaryCard({
  summary,
  onRefresh,
  isRefreshing = false,
  uid,
}: {
  summary: CompanionSummaryResponse;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  uid?: string;
}) {
  const [showExplanation, setShowExplanation] = useState(false);
  const action = summary?.primaryAction;
  if (!action || !action.category) return null;

  const resolveTarget = (route: string) => {
    if (!uid) return route;
    if (route.startsWith('/teams')) return `/u/${uid}/teams`;
    if (route.startsWith('/endgame')) return `/u/${uid}/endgame`;
    if (route.startsWith('/intelligence')) return `/u/${uid}/pulls`;
    if (route.startsWith('/roster/')) {
      const key = route.replace('/roster/', '');
      return `/u/${uid}/character/${key}`;
    }
    if (route.startsWith('/roster')) return `/u/${uid}/roster`;
    if (route.startsWith('/planner')) return `/u/${uid}#today-domains`;
    return route;
  };

  const finalRoute = resolveTarget(action.targetRoute);

  const categoryBadgeColors: Record<PrimaryActionCategory, string> = {
    FARMING_AVAILABLE:
      'border-emerald-500/50 bg-emerald-950/40 text-emerald-300 shadow-emerald-500/10',
    BUILD_INVESTMENT: 'border-indigo-500/50 bg-indigo-950/40 text-indigo-300 shadow-indigo-500/10',
    ENDGAME_READINESS: 'border-amber-500/50 bg-amber-950/40 text-amber-300 shadow-amber-500/10',
    PULL_STRATEGY: 'border-purple-500/50 bg-purple-950/40 text-purple-300 shadow-purple-500/10',
    TEAM_RECOMMENDATION: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300 shadow-cyan-500/10',
  };

  const badgeClass =
    categoryBadgeColors[action.category] ?? 'border-zinc-700 bg-zinc-800 text-zinc-300';

  return (
    <section
      aria-label="Today's recommended next action"
      className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-zinc-950 p-6 shadow-xl"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider shadow-sm ${badgeClass}`}
            >
              {action.category.replace('_', ' ')}
            </span>
            <span className="text-xs text-zinc-400">
              {summary.isPartialAccount ? 'Public Showcase Analysis' : 'Companion Synthesis'}
            </span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {action.headline}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-300">{action.subtext}</p>
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-2.5">
          <Link
            to={finalRoute}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-400 hover:to-indigo-500"
          >
            Take Action <UiIcon name="arrow" />
          </Link>
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-3.5 py-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white"
          >
            {showExplanation ? 'Hide Rationale' : 'Why this focus?'}
          </button>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-3 py-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50"
              title="Refresh companion advice"
            >
              {isRefreshing ? 'Refreshing...' : '↻ Refresh'}
            </button>
          )}
        </div>
      </div>

      {/* Progressive disclosure reasoning */}
      {showExplanation && (
        <div className="animate-fadeIn mt-5 space-y-2 border-t border-zinc-800/80 pt-4 text-xs text-zinc-300">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white">
            Synthesized Reasoning & Evidentiary Layers (ADR-0011)
          </h3>
          <ul className="space-y-2 pt-1 text-zinc-300">
            {summary.narrativeOverview.map((point, idx) => {
              const { badge, text } = parseEpistemologicalPoint(point);
              return (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  {badge && (
                    <span
                      className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  )}
                  <span className="text-zinc-300">{text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
