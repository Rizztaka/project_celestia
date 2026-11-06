import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import type { RosterCharacter, TheaterDifficulty } from '../../lib/api';
import { fetchTheaterActPlan } from '../../lib/api';
import { GenshinAvatar } from '../GenshinAvatar';

interface TheaterActPlannerViewProps {
  roster: RosterCharacter[];
}

const DEFAULT_THEATER_CAST = [
  'Neuvillette',
  'Furina',
  'KaedeharaKazuha',
  'Baizhu',
  'RaidenShogun',
  'Xiangling',
  'Xingqiu',
  'Bennett',
  'Alhaitham',
  'Nahida',
  'Yelan',
  'KukiShinobu',
  'HuTao',
  'Zhongli',
  'Navia',
  'KamisatoAyaka',
  'Shenhe',
  'SangonomiyaKokomi',
  'Yoimiya',
  'Fischl',
  'Beidou',
  'Sucrose',
];

export default function TheaterActPlannerView({ roster = [] }: TheaterActPlannerViewProps) {
  const [seasonId] = useState('2024-11');
  const [difficulty, setDifficulty] = useState<TheaterDifficulty>('VISIONARY');
  const [currentAct, setCurrentAct] = useState<number>(1);

  // Derive qualified roster characters (level >= 70)
  const rosterCastKeys = roster.filter((c) => (c.level ?? 0) >= 70).map((c) => c.characterKey);
  const hasRosterCast = rosterCastKeys.length >= 10;

  const [castSource, setCastSource] = useState<'ROSTER' | 'PRESET'>(() =>
    hasRosterCast ? 'ROSTER' : 'PRESET',
  );

  const activeCastKeys =
    castSource === 'ROSTER' && hasRosterCast ? rosterCastKeys : DEFAULT_THEATER_CAST;

  // Vigor state: maps char key to remaining vigor (0, 1, or 2)
  const [remainingVigor, setRemainingVigor] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const key of activeCastKeys) {
      initial[key] = 2;
    }
    return initial;
  });

  const [completedActs, setCompletedActs] = useState<Array<{ act: number; teamKeys: string[] }>>(
    [],
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'theater-plan',
      seasonId,
      difficulty,
      currentAct,
      remainingVigor,
      completedActs,
      castSource,
      activeCastKeys.length,
    ],
    queryFn: ({ signal }) =>
      fetchTheaterActPlan(
        {
          seasonId,
          difficulty,
          castKeys: activeCastKeys,
          currentAct,
          remainingVigor,
          completedActs,
        },
        signal,
      ),
  });

  // Action: Clear current act with recommended team
  const handleClearAct = () => {
    if (!data?.nextRecommendedTeam) return;
    const team = data.nextRecommendedTeam;

    // Deduct vigor
    setRemainingVigor((prev) => {
      const updated = { ...prev };
      for (const charKey of team) {
        updated[charKey] = Math.max(0, (updated[charKey] ?? 2) - 1);
      }
      return updated;
    });

    // Record completed act
    setCompletedActs((prev) => [...prev, { act: currentAct, teamKeys: team }]);

    const maxActs = difficulty === 'HARD' ? 8 : difficulty === 'VISIONARY' ? 10 : 6;
    if (currentAct < maxActs) {
      setCurrentAct((prev) => prev + 1);
    }
  };

  // Reset run
  const handleResetRun = () => {
    setCurrentAct(1);
    setCompletedActs([]);
    const resetVigor: Record<string, number> = {};
    for (const key of activeCastKeys) {
      resetVigor[key] = 2;
    }
    setRemainingVigor(resetVigor);
  };

  const maxActs = difficulty === 'HARD' ? 8 : difficulty === 'VISIONARY' ? 10 : 6;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 backdrop-blur-md">
        <div>
          <h2 className="text-base font-bold text-white">
            Imaginarium Theater Dynamic Act & Vigor Planner
          </h2>
          <p className="text-xs text-zinc-400">
            Backward-chains premiere carries for boss acts and simulates dynamic forward vigor
            allocation across {roster.length} roster characters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Difficulty selector */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-zinc-950/70 p-1">
            <span className="px-2 text-xs font-medium text-zinc-400">Difficulty</span>
            {(['HARD', 'VISIONARY'] as TheaterDifficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDifficulty(d);
                  handleResetRun();
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  difficulty === d
                    ? d === 'VISIONARY'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'bg-violet-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Cast Source Toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-zinc-950/70 p-1">
            <button
              type="button"
              onClick={() => {
                setCastSource('ROSTER');
                handleResetRun();
              }}
              disabled={!hasRosterCast}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                castSource === 'ROSTER' && hasRosterCast
                  ? 'bg-amber-500 font-bold text-zinc-950 shadow-sm'
                  : hasRosterCast
                    ? 'text-zinc-400 hover:text-white'
                    : 'cursor-not-allowed text-zinc-600'
              }`}
              title={
                hasRosterCast
                  ? 'Use your owned level 70+ characters'
                  : 'Requires at least 10 level 70+ characters in roster'
              }
            >
              Roster ({rosterCastKeys.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setCastSource('PRESET');
                handleResetRun();
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                castSource === 'PRESET'
                  ? 'bg-amber-500 font-bold text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Presets
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetRun}
            className="rounded-xl border border-white/10 bg-zinc-800/80 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
          >
            Reset Run
          </button>
        </div>
      </div>

      {/* Season Active / Archived Status Alert */}
      {data && !data.isCurrentSeason && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-300">
          <span className="font-semibold">⚠️ Archived Season Notice:</span>
          <span>
            {data.expirationNote ??
              `Season ${data.seasonId} is evaluated in historical draft mode.`}
          </span>
        </div>
      )}

      {/* Special Guest / Friend Borrow Notice */}
      {data && data.ineligibleCastExcluded && data.ineligibleCastExcluded.length > 0 && (
        <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 text-xs text-sky-300">
          <span className="font-semibold">ℹ️ Special Guest / Borrow Notice:</span>{' '}
          {data.ineligibleCastExcluded.length} characters (
          {data.ineligibleCastExcluded.map((c) => c.characterKey).join(', ')}) are outside standard
          season elements and qualify as special guests or friend borrows.
        </div>
      )}

      {isLoading && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/30 p-8 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="mt-3 text-sm text-zinc-400">
            Backward-chaining boss reserves and scheduling acts…
          </p>
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 text-center text-rose-300">
          <p className="text-sm font-semibold">Failed to schedule Theater acts.</p>
          <p className="mt-1 text-xs text-rose-400/80">
            {(error as Error)?.message ?? 'Unknown error'}
          </p>
        </div>
      )}

      {data && (
        <>
          {/* Next Recommended Act Action Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-zinc-900/80 to-zinc-900/60 p-5 shadow-xl backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/20 text-xs font-bold text-amber-400">
                    {currentAct}
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    Next Recommended Team — Act {currentAct} of {maxActs}
                  </h3>
                  {[3, 6, 8, 10].includes(currentAct) && (
                    <span className="rounded-md border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
                      BOSS ACT
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-300">
                  {currentAct <= maxActs
                    ? 'Deploy this team to preserve reserved carries for upcoming boss acts without risking vigor exhaustion.'
                    : 'All acts in this difficulty run are completed!'}
                </p>
              </div>

              {currentAct <= maxActs && (
                <button
                  type="button"
                  onClick={handleClearAct}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 shadow-md transition-all hover:bg-amber-400 hover:shadow-amber-500/20"
                >
                  Clear Act {currentAct} & Advance →
                </button>
              )}
            </div>

            {/* Recommended 4-character team for next act */}
            {data.nextRecommendedTeam.length === 4 && (
              <div className="mt-4 flex flex-wrap items-center gap-4">
                {data.nextRecommendedTeam.map((charKey) => (
                  <div
                    key={charKey}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/60 p-2"
                  >
                    <GenshinAvatar
                      characterKey={charKey}
                      size="sm"
                      className="rounded-lg border border-white/15"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{charKey}</p>
                      <p className="text-[10px] text-zinc-400">
                        Vigor: {remainingVigor[charKey] ?? 2}/2
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vigor Exhaustion Risk Alert if flagged */}
          {data.vigorExhaustionRisk && (
            <div className="flex items-center gap-3 rounded-2xl border border-rose-500/40 bg-rose-950/20 p-4 text-xs text-rose-300">
              <span className="text-base">⚠️</span>
              <div>
                <p className="font-bold">High Vigor Exhaustion Risk Detected</p>
                <p className="text-rose-300/80">
                  Available character vigor pool is tightly constrained. Avoid burning premier
                  supports on regular acts.
                </p>
              </div>
            </div>
          )}

          {/* 10-Act Timeline / Schedule View */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Projected Full Schedule (Acts 1 — {maxActs})
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {data.projectedSchedule.map((actItem) => {
                const isCompleted = actItem.act < currentAct;
                const isCurrent = actItem.act === currentAct;

                return (
                  <div
                    key={actItem.act}
                    className={`rounded-2xl border p-4 backdrop-blur-md transition-all ${
                      isCurrent
                        ? 'border-amber-500/60 bg-amber-950/20 shadow-lg shadow-amber-500/10'
                        : isCompleted
                          ? 'border-white/5 bg-zinc-950/40 opacity-70'
                          : actItem.isBoss
                            ? 'border-amber-500/30 bg-zinc-900/80'
                            : 'border-white/10 bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white">
                        Act {actItem.act}
                      </span>
                      {actItem.isBoss ? (
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                          {actItem.bossName ?? 'BOSS'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500">Regular</span>
                      )}
                    </div>

                    <div className="mt-3 flex justify-between gap-1">
                      {actItem.recommendedTeam.map((k) => (
                        <div key={k} className="flex flex-col items-center">
                          <GenshinAvatar
                            characterKey={k}
                            size="sm"
                            className="rounded-md border border-white/10"
                          />
                        </div>
                      ))}
                    </div>

                    <p
                      className="mt-2 line-clamp-2 text-[10px] text-zinc-400"
                      title={actItem.rationale}
                    >
                      {actItem.rationale}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Vigor Tracker Grid */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Cast Vigor Inventory ({activeCastKeys.length} Characters)
              </h3>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> 2/2 Available
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> 1/2 Depleted
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-zinc-600" /> 0/2 Exhausted
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {activeCastKeys.map((key: string) => {
                const vigor = remainingVigor[key] ?? 0;
                const reservedAct = data.reservedForBosses[key];

                return (
                  <div
                    key={key}
                    className="flex flex-col items-center rounded-xl border border-white/5 bg-zinc-950/50 p-2 text-center"
                  >
                    <GenshinAvatar
                      characterKey={key}
                      size="sm"
                      className="rounded-lg border border-white/10"
                    />
                    <span className="mt-1 max-w-[64px] truncate text-[10px] font-medium text-zinc-300">
                      {key}
                    </span>

                    <span
                      className={`mt-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold ${
                        vigor === 2
                          ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                          : vigor === 1
                            ? 'border border-amber-500/30 bg-amber-500/20 text-amber-300'
                            : 'border border-zinc-700 bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {vigor}/2
                    </span>

                    {reservedAct !== undefined && (
                      <span className="mt-1 rounded bg-violet-500/20 px-1 py-0.5 text-[8px] font-semibold text-violet-300">
                        Act {reservedAct} Boss
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tactical Explanations & Reserve Rationale */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-md">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-xs text-amber-400">
                ✓
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Backward Chaining & Act Rationale
              </h4>
            </div>

            <ul className="space-y-2 text-xs text-zinc-300">
              {data.explanations.map((explanation, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                  <span>{explanation}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
