import type { CompanionSummaryResponse } from '@celestia/api-contracts';
import { Link } from 'react-router-dom';

import { artworkDisplayName } from '../../lib/artwork';
import { GenshinAvatar } from '../GenshinAvatar';
import { UiIcon } from '../Ui';

export function CompanionSummaryGrid({
  summary,
  uid,
}: {
  summary: CompanionSummaryResponse;
  uid?: string;
}) {
  const basePrefix = uid ? `/u/${uid}` : '';
  const pullPrefix = uid ? `/u/${uid}/pulls` : '/intelligence';
  const endgamePrefix = uid ? `/u/${uid}/endgame` : '/endgame';
  const rosterPrefix = uid ? `/u/${uid}/roster` : '/roster';

  if (!summary || !summary.readyBuildsSummary) return null;

  const {
    readyBuildsSummary,
    topMarginalInvestments = [],
    endgameSnapshot,
    pullAdviceSnapshot,
  } = summary;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {/* 1. Ready Builds Card */}
      <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div>
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Ready Builds (M2)
            </span>
            <span className="text-xs font-bold text-emerald-400">
              {readyBuildsSummary.readyCount} / {readyBuildsSummary.totalAssessed}
            </span>
          </div>

          <p className="mt-2 text-xs text-zinc-400">
            Characters meeting Floor 12 encounter requirements.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {readyBuildsSummary.topReadyCharacters.length === 0 ? (
              <p className="text-xs text-zinc-500">No builds fully ready yet.</p>
            ) : (
              readyBuildsSummary.topReadyCharacters.slice(0, 4).map((char) => (
                <div
                  key={char.characterKey}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 p-1 pr-2"
                >
                  <GenshinAvatar characterKey={char.characterKey} size="sm" />
                  <div className="text-[11px] leading-tight">
                    <p className="max-w-[60px] truncate font-medium text-white">
                      {artworkDisplayName(char.characterKey)}
                    </p>
                    <p className="font-semibold text-emerald-400">{char.readinessScore}%</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-4 border-t border-zinc-800/60 pt-2">
          <Link
            to={rosterPrefix}
            className="flex items-center justify-between text-xs text-indigo-400 hover:text-indigo-300"
          >
            <span>View character roster</span>
            <UiIcon name="arrow" />
          </Link>
        </div>
      </div>

      {/* 2. Top Marginal Upgrades */}
      <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div>
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Top Upgrades (M2)
            </span>
            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">
              High ROI
            </span>
          </div>

          <div className="mt-2 space-y-2">
            {topMarginalInvestments.length === 0 ? (
              <p className="text-xs text-zinc-500">No pending upgrades recorded.</p>
            ) : (
              topMarginalInvestments.map((u, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-2 text-xs ${
                    u.todayDomainAvailable
                      ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">
                      {artworkDisplayName(u.characterKey)}
                    </span>
                    {u.todayDomainAvailable && (
                      <span className="py-0.2 rounded bg-emerald-500/30 px-1 text-[9px] font-bold uppercase text-emerald-300">
                        Drop Today
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-zinc-400">{u.actionDetail}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-4 border-t border-zinc-800/60 pt-2">
          <Link
            to={basePrefix ? `${basePrefix}/teams` : '/planner?tab=farming'}
            className="flex items-center justify-between text-xs text-indigo-400 hover:text-indigo-300"
          >
            <span>Plan material farming</span>
            <UiIcon name="arrow" />
          </Link>
        </div>
      </div>

      {/* 3. Team Lineup (M3) */}
      <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div>
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Team Lineup (M3)
            </span>
            <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
              {summary.teamSuggestion?.archetype ?? 'Defensible'}
            </span>
          </div>

          {summary.teamSuggestion ? (
            <div className="mt-2 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-1">
                <p className="font-semibold text-white">{summary.teamSuggestion.teamName}</p>
                {typeof summary.teamSuggestion.simulatedDps === 'number' && (
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 whitespace-nowrap">
                    ~{Math.round(summary.teamSuggestion.simulatedDps).toLocaleString()} DPS (gcsim tested)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {summary.teamSuggestion.members.map((charKey) => (
                  <div
                    key={charKey}
                    className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900/80 p-1"
                  >
                    <GenshinAvatar characterKey={charKey} size="sm" />
                    <span className="max-w-[50px] truncate text-[11px] text-zinc-200">
                      {artworkDisplayName(charKey)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">
                {summary.teamSuggestion.keyAdvantage}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-zinc-500">
              Assessing roster units for defensible team rotation synthesis.
            </p>
          )}
        </div>

        <div className="mt-4 border-t border-zinc-800/60 pt-2">
          <Link
            to={basePrefix ? `${basePrefix}/teams` : '/teams'}
            className="flex items-center justify-between text-xs text-indigo-400 hover:text-indigo-300"
          >
            <span>Explore team generator</span>
            <UiIcon name="arrow" />
          </Link>
        </div>
      </div>

      {/* 4. Endgame Center Status */}
      <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div>
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Endgame Center (M4)
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                endgameSnapshot.abyssReady
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {endgameSnapshot.abyssReady ? 'Abyss Ready' : 'In Progress'}
            </span>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Spiral Abyss F12:</span>
              <span className="font-semibold text-white">{endgameSnapshot.abyssScore}/100</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Stygian Onslaught:</span>
              <span className="font-semibold text-white">
                {endgameSnapshot.onslaughtReady ? '12-Hero Ready' : 'Needs Reserves'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Theater Acts:</span>
              <span className="font-semibold text-white">
                ~{endgameSnapshot.theaterMaxActsEstimated} Acts
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-zinc-800/60 pt-2">
          <Link
            to={endgamePrefix}
            className="flex items-center justify-between text-xs text-indigo-400 hover:text-indigo-300"
          >
            <span>Open Endgame Center</span>
            <UiIcon name="arrow" />
          </Link>
        </div>
      </div>

      {/* 5. Active Banner Advice */}
      <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div>
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Wish Advisor (M5)
            </span>
            {pullAdviceSnapshot && (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                  pullAdviceSnapshot.recommendation === 'HIGH_ACCOUNT_VALUE'
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {pullAdviceSnapshot.recommendation.replace('_', ' ')}
              </span>
            )}
          </div>

          {pullAdviceSnapshot ? (
            <div className="mt-3 space-y-1.5 text-xs">
              <p className="text-sm font-bold text-white">
                {artworkDisplayName(pullAdviceSnapshot.targetCharacterKey)}
              </p>
              <p className="line-clamp-3 text-[11px] leading-relaxed text-zinc-400">
                {pullAdviceSnapshot.keyReason}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-zinc-500">
              No active banner recommendations available.
            </p>
          )}
        </div>

        <div className="mt-4 border-t border-zinc-800/60 pt-2">
          <Link
            to={pullPrefix}
            className="flex items-center justify-between text-xs text-indigo-400 hover:text-indigo-300"
          >
            <span>View pull intelligence</span>
            <UiIcon name="arrow" />
          </Link>
        </div>
      </div>
    </div>
  );
}
