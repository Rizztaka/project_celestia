import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import type { CandidateEndgameTeamInput, RosterCharacter } from '../../lib/api';
import { fetchAbyssJointRecommendation } from '../../lib/api';
import { GenshinAvatar } from '../GenshinAvatar';

interface AbyssJointRecommendationViewProps {
  roster: RosterCharacter[];
}

const DEFAULT_CANDIDATE_TEAMS: CandidateEndgameTeamInput[] = [
  {
    id: 'team-neuv',
    name: 'Neuvillette Hypercarry',
    memberKeys: ['Neuvillette', 'Furina', 'KaedeharaKazuha', 'Baizhu'],
    primaryElement: 'Hydro',
    baseDps: 92000,
    comfortScore: 90,
  },
  {
    id: 'team-national',
    name: 'Raiden National',
    memberKeys: ['RaidenShogun', 'Xiangling', 'Xingqiu', 'Bennett'],
    primaryElement: 'Pyro',
    baseDps: 85000,
    comfortScore: 75,
  },
  {
    id: 'team-alhaitham',
    name: 'Alhaitham Quickbloom',
    memberKeys: ['Alhaitham', 'Nahida', 'Yelan', 'KukiShinobu'],
    primaryElement: 'Dendro',
    baseDps: 88000,
    comfortScore: 80,
  },
  {
    id: 'team-hutao',
    name: 'Hu Tao Double Hydro',
    memberKeys: ['HuTao', 'Yelan', 'Xingqiu', 'Zhongli'],
    primaryElement: 'Pyro',
    baseDps: 86000,
    comfortScore: 85,
  },
  {
    id: 'team-navia',
    name: 'Navia Geo Core',
    memberKeys: ['Navia', 'Zhongli', 'Xiangling', 'Bennett'],
    primaryElement: 'Geo',
    baseDps: 82000,
    comfortScore: 85,
  },
  {
    id: 'team-ayaka',
    name: 'Ayaka Freeze',
    memberKeys: ['KamisatoAyaka', 'Shenhe', 'SangonomiyaKokomi', 'KaedeharaKazuha'],
    primaryElement: 'Cryo',
    baseDps: 80000,
    comfortScore: 75,
  },
];

function buildCandidateTeamsFromRoster(roster: RosterCharacter[]): CandidateEndgameTeamInput[] {
  if (!roster || roster.length < 8) return [];

  const ownedKeys = new Set(roster.map((c) => c.characterKey));

  // Check which benchmark archetypes the player completely owns
  const matchedArchetypes = DEFAULT_CANDIDATE_TEAMS.filter((team) =>
    team.memberKeys.every((key) => ownedKeys.has(key)),
  );

  if (matchedArchetypes.length >= 2) {
    return matchedArchetypes;
  }

  // Construct teams from player's top-level characters
  const sorted = [...roster].sort((a, b) => (b.level ?? 0) - (a.level ?? 0));
  const teams: CandidateEndgameTeamInput[] = [];

  for (let i = 0; i + 3 < sorted.length && teams.length < 6; i += 4) {
    const chunk = sorted.slice(i, i + 4);
    const keys = chunk.map((c) => c.characterKey);
    const avgLevel = Math.round(chunk.reduce((sum, c) => sum + (c.level ?? 0), 0) / 4);

    teams.push({
      id: `roster-team-${teams.length + 1}`,
      name: `Roster Squad ${teams.length + 1} (${chunk[0].characterKey} Core)`,
      memberKeys: keys,
      baseDps: Math.max(30000, avgLevel * 850),
      comfortScore: 75,
      gear: chunk.map((c) => ({
        weaponInstanceId: c.equippedWeapon?.id ?? null,
        artifactInstanceIds: [],
      })),
    });
  }

  return teams;
}

export default function AbyssJointRecommendationView({
  roster = [],
}: AbyssJointRecommendationViewProps) {
  const [cycleId] = useState('5.2-1');
  const [floor, setFloor] = useState<number>(12);
  const [chamber, setChamber] = useState<number>(1);

  const rosterCandidates = buildCandidateTeamsFromRoster(roster);
  const hasRosterTeams = rosterCandidates.length >= 2;
  const [candidateSource, setCandidateSource] = useState<'ROSTER' | 'PRESET'>(() =>
    hasRosterTeams ? 'ROSTER' : 'PRESET',
  );

  const activeCandidates =
    candidateSource === 'ROSTER' && hasRosterTeams ? rosterCandidates : DEFAULT_CANDIDATE_TEAMS;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['abyss-joint', cycleId, floor, chamber, candidateSource, activeCandidates.length],
    queryFn: ({ signal }) =>
      fetchAbyssJointRecommendation(
        {
          cycleId,
          floor,
          chamber,
          candidateTeams: activeCandidates,
        },
        signal,
      ),
  });

  return (
    <div className="space-y-6">
      {/* Chamber Selector & Config Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 backdrop-blur-md">
        <div>
          <h2 className="text-base font-bold text-white">Spiral Abyss Joint Optimization</h2>
          <p className="text-xs text-zinc-400">
            Harmonic mean joint solver guarantees optimal dual-half clearance across {roster.length}{' '}
            roster characters without character or gear collision.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Floor Selector */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-zinc-950/70 p-1">
            <span className="px-2 text-xs font-medium text-zinc-400">Floor</span>
            {[9, 10, 11, 12].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFloor(f)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  floor === f
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Chamber Selector */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-zinc-950/70 p-1">
            <span className="px-2 text-xs font-medium text-zinc-400">Chamber</span>
            {[1, 2, 3].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChamber(c)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  chamber === c
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Candidate Source Toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-zinc-950/70 p-1">
            <button
              type="button"
              onClick={() => setCandidateSource('ROSTER')}
              disabled={!hasRosterTeams}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                candidateSource === 'ROSTER' && hasRosterTeams
                  ? 'bg-violet-600 text-white shadow-sm'
                  : hasRosterTeams
                    ? 'text-zinc-400 hover:text-white'
                    : 'cursor-not-allowed text-zinc-600'
              }`}
              title={
                hasRosterTeams
                  ? 'Optimize with your owned roster teams'
                  : 'Requires at least 8 characters in roster'
              }
            >
              Roster ({rosterCandidates.length})
            </button>
            <button
              type="button"
              onClick={() => setCandidateSource('PRESET')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                candidateSource === 'PRESET'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Presets
            </button>
          </div>
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

      {isLoading && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/30 p-8 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="mt-3 text-sm text-zinc-400">Computing joint dual-half Pareto frontier…</p>
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 text-center text-rose-300">
          <p className="text-sm font-semibold">Failed to load joint recommendation.</p>
          <p className="mt-1 text-xs text-rose-400/80">
            {(error as Error)?.message ?? 'Unknown error'}
          </p>
        </div>
      )}

      {data && (
        <>
          {/* Greedy vs Joint Performance Callout */}
          {data.greedyComparison && (
            <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/40 via-purple-950/20 to-zinc-900/60 p-5 backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-violet-500/30 bg-violet-500/20 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
                      Joint Optimization Gain
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      +{data.greedyComparison.scoreDeltaPercent.toFixed(1)}% Harmonic Throughput
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    Greedy single-half selection starves Half 2 of essential supports. The joint
                    solver balanced both halves to eliminate the bottleneck.
                  </p>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400">
                      Greedy Joint Score
                    </p>
                    <p className="font-mono text-sm font-bold text-zinc-400">
                      {data.greedyComparison.greedyJointScore.toFixed(1)}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-violet-300">
                      Optimal Joint Score
                    </p>
                    <p className="font-mono text-lg font-extrabold text-violet-400">
                      {data.jointScore.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Side-by-side Dual Half Team Cards */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* First Half */}
            <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-zinc-900/70 p-5 shadow-xl backdrop-blur-md">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/20 text-xs font-bold text-sky-400">
                      1
                    </span>
                    <h3 className="font-bold text-white">First Half</h3>
                  </div>
                  <span className="font-mono text-sm font-semibold text-sky-400">
                    Score: {data.firstHalf.score.toFixed(1)}
                  </span>
                </div>

                <p className="mt-1 text-sm font-medium text-zinc-300">{data.firstHalf.team.name}</p>

                {/* Team Members */}
                <div className="mt-4 flex gap-3">
                  {data.firstHalf.team.memberKeys.map((key) => (
                    <div key={key} className="flex flex-col items-center">
                      <GenshinAvatar
                        characterKey={key}
                        size="md"
                        className="rounded-xl border border-white/15"
                      />
                      <span className="mt-1 max-w-[64px] truncate text-[10px] text-zinc-400">
                        {key}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Multipliers Grid */}
                <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-zinc-950/60 p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Shield Breaking</span>
                    <span className="font-mono font-semibold text-zinc-200">
                      x{data.firstHalf.multipliers.shield.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Res Adaptation</span>
                    <span className="font-mono font-semibold text-zinc-200">
                      x{data.firstHalf.multipliers.resistance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Wave Geometry</span>
                    <span className="font-mono font-semibold text-zinc-200">
                      x{data.firstHalf.multipliers.geometry.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Comfort</span>
                    <span className="font-mono font-semibold text-zinc-200">
                      x{data.firstHalf.multipliers.comfort.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Shield & Geometry Badges */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {data.firstHalf.shieldCounters.map((counter, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-amber-500/20 bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-300"
                    >
                      {counter}
                    </span>
                  ))}
                  {data.firstHalf.geometryNotes.map((note, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-sky-500/20 bg-sky-500/15 px-2 py-0.5 text-[11px] font-medium text-sky-300"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Second Half */}
            <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-zinc-900/70 p-5 shadow-xl backdrop-blur-md">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/20 text-xs font-bold text-indigo-400">
                      2
                    </span>
                    <h3 className="font-bold text-white">Second Half</h3>
                  </div>
                  <span className="font-mono text-sm font-semibold text-indigo-400">
                    Score: {data.secondHalf.score.toFixed(1)}
                  </span>
                </div>

                <p className="mt-1 text-sm font-medium text-zinc-300">
                  {data.secondHalf.team.name}
                </p>

                {/* Team Members */}
                <div className="mt-4 flex gap-3">
                  {data.secondHalf.team.memberKeys.map((key) => (
                    <div key={key} className="flex flex-col items-center">
                      <GenshinAvatar
                        characterKey={key}
                        size="md"
                        className="rounded-xl border border-white/15"
                      />
                      <span className="mt-1 max-w-[64px] truncate text-[10px] text-zinc-400">
                        {key}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Multipliers Grid */}
                <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-zinc-950/60 p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Shield Breaking</span>
                    <span className="font-mono font-semibold text-zinc-200">
                      x{data.secondHalf.multipliers.shield.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Res Adaptation</span>
                    <span className="font-mono font-semibold text-zinc-200">
                      x{data.secondHalf.multipliers.resistance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Wave Geometry</span>
                    <span className="font-mono font-semibold text-zinc-200">
                      x{data.secondHalf.multipliers.geometry.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Comfort</span>
                    <span className="font-mono font-semibold text-zinc-200">
                      x{data.secondHalf.multipliers.comfort.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Shield & Geometry Badges */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {data.secondHalf.shieldCounters.map((counter, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-amber-500/20 bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-300"
                    >
                      {counter}
                    </span>
                  ))}
                  {data.secondHalf.geometryNotes.map((note, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-indigo-500/20 bg-indigo-500/15 px-2 py-0.5 text-[11px] font-medium text-indigo-300"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Explanations & Invariant Proof */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-md">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-400">
                ✓
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Disjoint Integrity & Tactical Rationale
              </h4>
            </div>

            <ul className="space-y-2 text-xs text-zinc-300">
              {data.explanations.map((explanation, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400" />
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
