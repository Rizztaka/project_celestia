import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import type { CandidateEndgameTeamInput, RosterCharacter } from '../../lib/api';
import { fetchOnslaughtJointRecommendation } from '../../lib/api';
import { GenshinAvatar } from '../GenshinAvatar';

interface OnslaughtMatrixViewProps {
  roster: RosterCharacter[];
}

const DEFAULT_ONSLAUGHT_CANDIDATE_TEAMS: CandidateEndgameTeamInput[] = [
  {
    id: 'team-neuv',
    name: 'Neuvillette Sustained Core',
    memberKeys: ['Neuvillette', 'Furina', 'KaedeharaKazuha', 'Baizhu'],
    primaryElement: 'Hydro',
    baseDps: 92000,
    comfortScore: 90,
  },
  {
    id: 'team-national',
    name: 'Raiden National Overdrive',
    memberKeys: ['RaidenShogun', 'Xiangling', 'Xingqiu', 'Bennett'],
    primaryElement: 'Pyro',
    baseDps: 85000,
    comfortScore: 75,
  },
  {
    id: 'team-navia',
    name: 'Navia Heavy Geo Shatter',
    memberKeys: ['Navia', 'Zhongli', 'Chiori', 'Gorou'],
    primaryElement: 'Geo',
    baseDps: 84000,
    comfortScore: 88,
  },
  {
    id: 'team-yoimiya',
    name: 'Yoimiya Overload Anti-Air',
    memberKeys: ['Yoimiya', 'Chevreuse', 'Fischl', 'Beidou'],
    primaryElement: 'Pyro',
    baseDps: 82000,
    comfortScore: 80,
  },
  {
    id: 'team-alhaitham',
    name: 'Alhaitham Quickbloom Core',
    memberKeys: ['Alhaitham', 'Nahida', 'Yelan', 'KukiShinobu'],
    primaryElement: 'Dendro',
    baseDps: 88000,
    comfortScore: 80,
  },
  {
    id: 'team-tighnari',
    name: 'Tighnari Spread Precision',
    memberKeys: ['Tighnari', 'YaeMiko', 'Kirara', 'Sucrose'],
    primaryElement: 'Dendro',
    baseDps: 79000,
    comfortScore: 75,
  },
];

function buildOnslaughtCandidatesFromRoster(
  roster: RosterCharacter[],
): CandidateEndgameTeamInput[] {
  if (!roster || roster.length < 12) return [];

  const ownedKeys = new Set(roster.map((c) => c.characterKey));
  const matchedArchetypes = DEFAULT_ONSLAUGHT_CANDIDATE_TEAMS.filter((team) =>
    team.memberKeys.every((key) => ownedKeys.has(key)),
  );

  if (matchedArchetypes.length >= 3) {
    return matchedArchetypes;
  }

  const sorted = [...roster].sort((a, b) => (b.level ?? 0) - (a.level ?? 0));
  const teams: CandidateEndgameTeamInput[] = [];

  for (let i = 0; i + 3 < sorted.length && teams.length < 6; i += 4) {
    const chunk = sorted.slice(i, i + 4);
    const keys = chunk.map((c) => c.characterKey);
    const avgLevel = Math.round(chunk.reduce((sum, c) => sum + (c.level ?? 0), 0) / 4);

    teams.push({
      id: `onslaught-roster-team-${teams.length + 1}`,
      name: `Strike Squad ${teams.length + 1} (${chunk[0].characterKey} Lead)`,
      memberKeys: keys,
      baseDps: Math.max(30000, avgLevel * 850),
      comfortScore: 80,
      gear: chunk.map((c) => ({
        weaponInstanceId: c.equippedWeapon?.id ?? null,
        artifactInstanceIds: [],
      })),
    });
  }

  return teams;
}

export default function OnslaughtMatrixView({ roster = [] }: OnslaughtMatrixViewProps) {
  const [cycleId] = useState('5.2-1');

  const rosterCandidates = buildOnslaughtCandidatesFromRoster(roster);
  const hasRosterTeams = rosterCandidates.length >= 3;
  const [candidateSource, setCandidateSource] = useState<'ROSTER' | 'PRESET'>(() =>
    hasRosterTeams ? 'ROSTER' : 'PRESET',
  );

  const activeCandidates =
    candidateSource === 'ROSTER' && hasRosterTeams
      ? rosterCandidates
      : DEFAULT_ONSLAUGHT_CANDIDATE_TEAMS;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['onslaught-joint', cycleId, candidateSource, activeCandidates.length],
    queryFn: ({ signal }) =>
      fetchOnslaughtJointRecommendation(
        {
          cycleId,
          candidateTeams: activeCandidates,
        },
        signal,
      ),
  });

  return (
    <div className="space-y-6">
      {/* Onslaught Matrix Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 backdrop-blur-md">
        <div>
          <h2 className="text-base font-bold text-white">
            Stygian Onslaught 3-Boss Allocation Matrix
          </h2>
          <p className="text-xs text-zinc-400">
            Consecutive 3-boss clearance optimizer enforcing strict 12-character exclusivity (T1 ∩
            T2 ∩ T3 = ∅) across {roster.length} roster characters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Candidate Source Toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-zinc-950/70 p-1">
            <button
              type="button"
              onClick={() => setCandidateSource('ROSTER')}
              disabled={!hasRosterTeams}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                candidateSource === 'ROSTER' && hasRosterTeams
                  ? 'bg-amber-500 font-bold text-zinc-950 shadow-sm'
                  : hasRosterTeams
                    ? 'text-zinc-400 hover:text-white'
                    : 'cursor-not-allowed text-zinc-600'
              }`}
              title={
                hasRosterTeams
                  ? 'Optimize with your owned roster teams'
                  : 'Requires at least 12 characters in roster'
              }
            >
              Roster ({rosterCandidates.length})
            </button>
            <button
              type="button"
              onClick={() => setCandidateSource('PRESET')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                candidateSource === 'PRESET'
                  ? 'bg-amber-500 font-bold text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Presets
            </button>
          </div>

          {data && (
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${
                  data.allStagesCleared
                    ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                    : 'border-amber-500/30 bg-amber-500/15 text-amber-400'
                }`}
              >
                {data.allStagesCleared ? 'All 3 Bosses Cleared' : 'Incomplete Clearance'}
              </span>
              <div className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-1 text-right">
                <span className="block text-[10px] uppercase text-zinc-400">Harmonic Score</span>
                <span className="font-mono text-sm font-extrabold text-amber-400">
                  {data.jointScore.toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cycle Active / Archived Status Alert */}
      {data && !data.isCurrentCycle && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-300">
          <span className="font-semibold">⚠️ Archived Cycle Notice:</span>
          <span>
            {data.expirationNote ?? `Cycle ${data.cycleId} is evaluated in historical preset mode.`}
          </span>
        </div>
      )}

      {/* Mechanic Gap Warning */}
      {data && data.hasMechanicGaps && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs text-rose-300">
          <span className="font-semibold">⚠️ Mechanic Gap Warning:</span> One or more stages feature
          unmodeled boss mechanics lacking verified simulation curves. Combat clearance accuracy
          produces a gap.
        </div>
      )}

      {isLoading && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/30 p-8 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="mt-3 text-sm text-zinc-400">
            Optimizing 12-character 3-way disjoint allocation…
          </p>
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 text-center text-rose-300">
          <p className="text-sm font-semibold">Failed to allocate Onslaught teams.</p>
          <p className="mt-1 text-xs text-rose-400/80">
            {(error as Error)?.message ?? 'Unknown error'}
          </p>
        </div>
      )}

      {data && (
        <>
          {/* 3-Boss Horizontal Matrix Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {data.stages.map((stageItem) => (
              <div
                key={stageItem.stage}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-zinc-900/70 p-5 shadow-xl backdrop-blur-md transition-all hover:border-amber-500/30"
              >
                <div>
                  {/* Stage and Boss Header */}
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/20 text-xs font-bold text-amber-400">
                      S{stageItem.stage}
                    </span>
                    <span className="font-mono text-xs font-semibold text-amber-400">
                      Score: {stageItem.stageScore.toFixed(1)}
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm font-bold text-white">{stageItem.bossName}</h3>
                  <p className="text-xs font-medium text-zinc-300">{stageItem.team.name}</p>

                  {/* Team Members */}
                  <div className="mt-4 flex justify-between gap-1">
                    {stageItem.team.memberKeys.map((key) => (
                      <div key={key} className="flex flex-col items-center">
                        <GenshinAvatar
                          characterKey={key}
                          size="sm"
                          className="rounded-lg border border-white/15"
                        />
                        <span className="mt-1 max-w-[48px] truncate text-[9px] text-zinc-400">
                          {key}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Mechanic Counters */}
                  <div className="mt-4 space-y-1">
                    <span className="text-[10px] font-semibold uppercase text-zinc-400">
                      Counter Multipliers
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {stageItem.mechanicCounters.map((counter, idx) => (
                        <span
                          key={idx}
                          className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300"
                        >
                          {counter}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-white/5 pt-3 text-right">
                  <span className="text-[10px] text-zinc-400">Base DPS: </span>
                  <span className="font-mono text-xs text-zinc-300">
                    {stageItem.team.baseDps.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Tactical Rationale & Invariants */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-md">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-400">
                ✓
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                12-Character Exclusivity & Tactical Allocations
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
