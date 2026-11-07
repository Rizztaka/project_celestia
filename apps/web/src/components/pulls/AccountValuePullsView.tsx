import type {
  PullBudgetInput,
  PullRecommendation,
  PullTargetMode,
  PullUserWeights,
  StrategicRecommendation,
} from '@celestia/api-contracts';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import {
  compareHypotheticalPull,
  fetchPublicShowcasePullIntelligence,
  fetchPullIntelligence,
} from '../../lib/api';
import { artworkDisplayName } from '../../lib/artwork';
import { GenshinAvatar } from '../GenshinAvatar';
import { GenshinWeaponIcon } from '../GenshinWeaponIcon';
import { PullPreferenceSliders } from './PullPreferenceSliders';

interface AccountValuePullsViewProps {
  uid?: string; // If provided, evaluates for public showcase
  className?: string;
}

const DEFAULT_WEIGHTS: PullUserWeights = {
  weightEndgame: 0.35,
  weightFlexibility: 0.25,
  weightComfort: 0.2,
  weightFavorites: 0.2,
};

const DEFAULT_BUDGET: PullBudgetInput = {
  primogems: 0,
  fates: 0,
  pity: 0,
  guaranteed: false,
};

const POPULAR_TARGET_KEYS = [
  'Mavuika',
  'Citlali',
  'Xilonen',
  'Chasca',
  'Furina',
  'KaedeharaKazuha',
  'Nahida',
  'Zhongli',
  'RaidenShogun',
  'Neuvillette',
  'HuTao',
  'Arlecchino',
  'Yelan',
  'Yoimiya',
  'Ayaka',
  'Shenhe',
  'Baizhu',
  'Nilou',
  'Alhaitham',
];

function getVerdictBadge(verdict: StrategicRecommendation) {
  switch (verdict) {
    case 'HIGH_ACCOUNT_VALUE':
      return {
        label: 'High Account Value',
        color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700',
      };
    case 'MODERATE_UPGRADE':
      return {
        label: 'Moderate Upgrade',
        color: 'bg-sky-950/80 text-sky-300 border-sky-700',
      };
    case 'NICHE_OR_REDUNDANT':
      return {
        label: 'Niche / Redundant',
        color: 'bg-amber-950/80 text-amber-300 border-amber-700',
      };
    case 'SAVE_RECOMMENDED':
      return {
        label: 'Save Recommended',
        color: 'bg-purple-950/80 text-purple-300 border-purple-700',
      };
    case 'CONDITIONAL_DATA_GAP':
      return {
        label: 'Conditional (Partial Data)',
        color: 'bg-orange-950/80 text-orange-300 border-orange-700',
      };
  }
}

export function AccountValuePullsView({ uid, className = '' }: AccountValuePullsViewProps) {
  const [weights, setWeights] = useState<PullUserWeights>(DEFAULT_WEIGHTS);
  const [budget, setBudget] = useState<PullBudgetInput>(DEFAULT_BUDGET);
  const [showPreferences, setShowPreferences] = useState(false);

  const query = useQuery({
    queryKey: ['pull-intelligence', uid, weights, budget],
    queryFn: ({ signal }) =>
      uid
        ? fetchPublicShowcasePullIntelligence(uid, { weights, budget, signal })
        : fetchPullIntelligence({ weights, budget, signal }),
    retry: 1,
  });

  return (
    <section aria-label="Account-Value Pulls" className={`space-y-6 ${className}`}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Milestone 5 Intelligence
          </span>
          <h2 className="text-2xl font-bold text-white">Account-Value Pulls</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Personalized counterfactual evaluation across team flexibility, endgame coverage, and
            wish budget.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPreferences((prev) => !prev)}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:border-amber-500 hover:bg-zinc-800"
        >
          <span>{showPreferences ? 'Hide Preferences' : 'Adjust Priorities & Budget'}</span>
          <span className="text-xs text-amber-400">
            ({Math.round(weights.weightEndgame * 100)}% /{' '}
            {Math.round(weights.weightFlexibility * 100)}%)
          </span>
        </button>
      </header>

      {/* Partial Account Warning */}
      {query.data?.isPartialAccount && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-amber-800/60 bg-amber-950/40 p-4 text-xs text-amber-200"
        >
          <span className="text-base" aria-hidden="true">
            ⚠️
          </span>
          <div>
            <strong className="block font-semibold">Partial Showcase Account Active</strong>
            Unobserved characters from public showcases are treated as unknown rather than unowned.
            Recommendations reflect verified showcase characters only.
          </div>
        </div>
      )}

      {/* Custom Weights & Budget Slider Drawer */}
      {showPreferences && (
        <PullPreferenceSliders
          weights={weights}
          budget={budget}
          onWeightsChange={setWeights}
          onBudgetChange={setBudget}
        />
      )}

      {/* Loading & Error States */}
      {query.isPending && (
        <div className="glass-panel flex min-h-[240px] items-center justify-center rounded-2xl p-8 text-sm text-zinc-400">
          Evaluating counterfactual additions and roster impacts…
        </div>
      )}

      {query.isError && (
        <div
          role="alert"
          className="glass-panel rounded-2xl border-red-900/60 p-6 text-sm text-red-300"
        >
          <p className="font-medium">Could not evaluate pull intelligence.</p>
          <p className="mt-1 text-xs text-zinc-400">
            {query.error instanceof Error
              ? query.error.message
              : 'Please check your connection and account state.'}
          </p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700"
          >
            Retry Analysis
          </button>
        </div>
      )}

      {/* Recommendations Grid */}
      {query.data && (
        <div className="grid gap-6 md:grid-cols-2">
          {query.data.recommendations.map((rec) => (
            <PullCard
              key={`${rec.bannerId}_${rec.targetKey}`}
              rec={rec}
              weights={weights}
              budget={budget}
              uid={uid}
            />
          ))}

          {query.data.recommendations.length === 0 && (
            <div className="col-span-full rounded-2xl border border-zinc-800 bg-zinc-950/50 p-8 text-center text-sm text-zinc-400">
              No active banner targets available for current schedule.
            </div>
          )}
        </div>
      )}

      {/* Interactive Custom Counterfactual Workbench */}
      <CustomHypotheticalWorkbench weights={weights} budget={budget} uid={uid} />
    </section>
  );
}

interface PullCardProps {
  rec: PullRecommendation;
  weights?: PullUserWeights;
  budget?: PullBudgetInput;
  uid?: string;
  isCustomComparison?: boolean;
}

export function PullCard({
  rec,
  weights = DEFAULT_WEIGHTS,
  budget = DEFAULT_BUDGET,
  uid,
  isCustomComparison = false,
}: PullCardProps) {
  const [overrideRec, setOverrideRec] = useState<PullRecommendation | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [expandedExplanations, setExpandedExplanations] = useState(false);

  const effectiveRec = overrideRec ?? rec;
  const verdict = getVerdictBadge(effectiveRec.strategicRecommendation);
  const isWeapon = effectiveRec.targetType === 'weapon';
  const displayName = artworkDisplayName(effectiveRec.targetKey);

  const handleModeSwitch = async (mode: PullTargetMode, constellation?: number) => {
    setIsComparing(true);
    try {
      const res = await compareHypotheticalPull(
        {
          targetKey: rec.targetKey,
          targetType: rec.targetType,
          mode,
          targetConstellation: constellation,
          weights,
          budget,
        },
        uid,
      );
      setOverrideRec(res.comparison);
    } catch {
      // Fallback stays intact
    } finally {
      setIsComparing(false);
    }
  };

  const handleReset = () => {
    setOverrideRec(null);
  };

  const visibleExplanations = expandedExplanations
    ? effectiveRec.explanations
    : effectiveRec.explanations.slice(0, 3);

  return (
    <article className="glass-panel flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 transition hover:border-zinc-700">
      <div>
        {/* Card Header: Avatar, Name, Verdict Badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {isWeapon ? (
              <GenshinWeaponIcon weaponKey={effectiveRec.targetKey} size="md" />
            ) : (
              <GenshinAvatar
                characterKey={effectiveRec.targetKey}
                constellation={effectiveRec.targetConstellation}
                size="md"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{displayName}</h3>
                {effectiveRec.mode === 'constellation' && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                    C{effectiveRec.targetConstellation ?? 1}
                  </span>
                )}
                {isWeapon && (
                  <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-purple-300">
                    5★ Weapon
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {isCustomComparison ? 'Custom Counterfactual Simulation' : effectiveRec.bannerName}
              </p>
            </div>
          </div>

          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${verdict.color}`}>
            {verdict.label}
          </span>
        </div>

        {/* Interactive Mode & Constellation Switcher for Characters */}
        {!isWeapon && !isCustomComparison && (
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-zinc-800/80 pt-3">
            <span className="mr-1 text-[11px] font-medium text-zinc-400">Simulate:</span>
            <button
              type="button"
              disabled={isComparing}
              onClick={() => handleModeSwitch('c0_unlock')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                effectiveRec.mode === 'c0_unlock'
                  ? 'bg-amber-500 font-semibold text-zinc-950 shadow-sm'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              C0 Unlock
            </button>
            <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
              {[1, 2, 3, 6].map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={isComparing}
                  onClick={() => handleModeSwitch('constellation', c)}
                  className={`rounded-md px-2 py-0.5 text-xs transition ${
                    effectiveRec.mode === 'constellation' && effectiveRec.targetConstellation === c
                      ? 'bg-amber-500/20 font-semibold text-amber-300'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  C{c}
                </button>
              ))}
            </div>
            {overrideRec && (
              <button
                type="button"
                onClick={handleReset}
                className="ml-auto text-[11px] text-zinc-500 underline hover:text-zinc-300"
              >
                Reset
              </button>
            )}
          </div>
        )}

        {/* Score & Multi-Objective Meter */}
        <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Account Value Score
              {isComparing && (
                <span className="ml-2 animate-pulse font-normal text-amber-400">
                  (recalculating…)
                </span>
              )}
            </span>
            <span className="font-mono text-2xl font-bold text-amber-400">
              {effectiveRec.accountValueScore}
              <span className="text-xs font-normal text-zinc-500"> / 100</span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
              style={{ width: `${effectiveRec.accountValueScore}%` }}
            />
          </div>

          {/* Subscores Grid */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <div className="rounded-lg bg-zinc-950/60 p-2">
              <span className="block text-[10px] text-zinc-400">Endgame Gain</span>
              <span className="font-mono font-semibold text-white">
                {effectiveRec.breakdown.endgameCoverageImpact}/100
              </span>
            </div>
            <div className="rounded-lg bg-zinc-950/60 p-2">
              <span className="block text-[10px] text-zinc-400">Flexibility</span>
              <span className="font-mono font-semibold text-cyan-300">
                {effectiveRec.breakdown.supportFlexibility}/100
              </span>
            </div>
            <div className="rounded-lg bg-zinc-950/60 p-2">
              <span className="block text-[10px] text-zinc-400">Comfort Boost</span>
              <span className="font-mono font-semibold text-emerald-300">
                {effectiveRec.breakdown.comfortImpact}/100
              </span>
            </div>
          </div>

          {/* Redundancy Penalty Notice */}
          {effectiveRec.breakdown.redundancyPenalty > 0 && (
            <div className="mt-2.5 rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-1.5 text-xs text-red-300">
              <span className="font-semibold">
                Redundancy -{effectiveRec.breakdown.redundancyPenalty}pts:{' '}
              </span>
              Competes with owned{' '}
              {effectiveRec.breakdown.redundantWithOwned.map(artworkDisplayName).join(', ')}.
            </div>
          )}
        </div>

        {/* Explanations List with Expand/Collapse */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Key Insights & Rationale
            </h4>
            {effectiveRec.explanations.length > 3 && (
              <button
                type="button"
                onClick={() => setExpandedExplanations(!expandedExplanations)}
                className="text-[11px] font-medium text-amber-400 hover:text-amber-300"
              >
                {expandedExplanations
                  ? 'Collapse insights ▴'
                  : `View all (${effectiveRec.explanations.length}) ▾`}
              </button>
            )}
          </div>
          <ul className="space-y-1.5 text-xs leading-relaxed text-zinc-300">
            {visibleExplanations.map((exp, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                <span>{exp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer: Budget & Probability Pill */}
      <div className="mt-5 border-t border-zinc-800/80 pt-3 text-xs">
        <div className="flex items-center justify-between text-zinc-400">
          <span>
            Pulls:{' '}
            <strong className="text-white">
              {effectiveRec.budgetForecast.currentPullsAvailable}
            </strong>
          </span>
          <span>
            Acquisition Chance:{' '}
            <strong className="font-mono text-amber-400">
              {Math.round(effectiveRec.budgetForecast.acquisitionProbability * 100)}%
            </strong>
          </span>
        </div>
      </div>
    </article>
  );
}

function CustomHypotheticalWorkbench({
  weights,
  budget,
  uid,
}: {
  weights: PullUserWeights;
  budget: PullBudgetInput;
  uid?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetKey, setTargetKey] = useState('Furina');
  const [targetType, setTargetType] = useState<'character' | 'weapon'>('character');
  const [mode, setMode] = useState<PullTargetMode>('c0_unlock');
  const [targetConstellation, setTargetConstellation] = useState<number>(1);
  const [simulatedRec, setSimulatedRec] = useState<PullRecommendation | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    try {
      const res = await compareHypotheticalPull(
        {
          targetKey,
          targetType,
          mode,
          targetConstellation: mode === 'constellation' ? targetConstellation : undefined,
          weights,
          budget,
        },
        uid,
      );
      setSimulatedRec(res.comparison);
    } catch (err) {
      console.error('Failed to simulate hypothetical pull:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5 text-sm text-zinc-300">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">
            Simulate Custom Counterfactual Pull
          </h3>
          <p className="text-xs text-zinc-400">
            Test hypothetical account-value gains for any unowned character, future constellation,
            or signature weapon.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="self-start rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white transition hover:border-amber-500 hover:bg-zinc-800"
        >
          {isOpen ? 'Close Workbench' : 'Open Simulator Workbench'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-5 space-y-6 border-t border-zinc-800/80 pt-5">
          <form onSubmit={handleSimulate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400">
                Target Character / Key
              </label>
              <select
                value={targetKey}
                onChange={(e) => setTargetKey(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-amber-500"
              >
                {POPULAR_TARGET_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {artworkDisplayName(k)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400">Target Type</label>
              <select
                value={targetType}
                onChange={(e) => {
                  const val = e.target.value as 'character' | 'weapon';
                  setTargetType(val);
                  if (val === 'weapon') setMode('signature_weapon');
                  else if (mode === 'signature_weapon') setMode('c0_unlock');
                }}
                className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-amber-500"
              >
                <option value="character">Character</option>
                <option value="weapon">Weapon</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400">Evaluation Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as PullTargetMode)}
                className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-amber-500"
              >
                {targetType === 'character' ? (
                  <>
                    <option value="c0_unlock">C0 Unlock</option>
                    <option value="constellation">Constellation Upgrade</option>
                  </>
                ) : (
                  <option value="signature_weapon">Signature Weapon</option>
                )}
              </select>
            </div>

            {mode === 'constellation' ? (
              <div>
                <label className="block text-xs font-medium text-zinc-400">
                  Target Constellation
                </label>
                <select
                  value={targetConstellation}
                  onChange={(e) => setTargetConstellation(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-amber-500"
                >
                  {[1, 2, 3, 4, 5, 6].map((c) => (
                    <option key={c} value={c}>
                      C{c}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="w-full rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {isSimulating ? 'Evaluating…' : 'Evaluate Counterfactual'}
                </button>
              </div>
            )}

            {mode === 'constellation' && (
              <div className="col-span-full flex justify-end">
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="rounded-lg bg-amber-500 px-6 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {isSimulating ? 'Evaluating…' : 'Evaluate Counterfactual'}
                </button>
              </div>
            )}
          </form>

          {simulatedRec && (
            <div className="mt-5 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Counterfactual Simulation Result
              </h4>
              <div className="max-w-xl">
                <PullCard
                  rec={simulatedRec}
                  weights={weights}
                  budget={budget}
                  uid={uid}
                  isCustomComparison
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
