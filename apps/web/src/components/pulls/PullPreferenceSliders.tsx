import type { PullBudgetInput, PullUserWeights } from '@celestia/api-contracts';

interface PullPreferenceSlidersProps {
  weights: PullUserWeights;
  budget: PullBudgetInput;
  onWeightsChange: (weights: PullUserWeights) => void;
  onBudgetChange: (budget: PullBudgetInput) => void;
}

export function PullPreferenceSliders({
  weights,
  budget,
  onWeightsChange,
  onBudgetChange,
}: PullPreferenceSlidersProps) {
  const updateWeight = (key: keyof PullUserWeights, val: number) => {
    onWeightsChange({
      ...weights,
      [key]: val / 100,
    });
  };

  const updateBudget = <K extends keyof PullBudgetInput>(key: K, val: PullBudgetInput[K]) => {
    onBudgetChange({
      ...budget,
      [key]: val,
    });
  };

  return (
    <div className="glass-panel space-y-6 rounded-2xl p-5 text-sm text-zinc-300">
      <div>
        <h3 className="text-base font-medium text-white">Priorities & Preferences</h3>
        <p className="mt-1 text-xs text-zinc-400">
          Tune the multi-objective evaluation weights to prioritize what matters most to your playstyle.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex justify-between text-xs">
            <span>Endgame Clearance</span>
            <span className="font-mono text-amber-400">{Math.round(weights.weightEndgame * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(weights.weightEndgame * 100)}
            onChange={(e) => updateWeight('weightEndgame', Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs">
            <span>Support Flexibility</span>
            <span className="font-mono text-cyan-400">{Math.round(weights.weightFlexibility * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(weights.weightFlexibility * 100)}
            onChange={(e) => updateWeight('weightFlexibility', Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs">
            <span>Execution Comfort</span>
            <span className="font-mono text-emerald-400">{Math.round(weights.weightComfort * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(weights.weightComfort * 100)}
            onChange={(e) => updateWeight('weightComfort', Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs">
            <span>Favorites Synergy</span>
            <span className="font-mono text-purple-400">{Math.round(weights.weightFavorites * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(weights.weightFavorites * 100)}
            onChange={(e) => updateWeight('weightFavorites', Number(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-4">
        <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-400">Wish Budget Context</h4>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-zinc-400">Primogems</span>
            <input
              type="number"
              min={0}
              step={160}
              value={budget.primogems}
              onChange={(e) => updateBudget('primogems', Math.max(0, Number(e.target.value)))}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-white focus:border-amber-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="text-zinc-400">Intertwined Fates</span>
            <input
              type="number"
              min={0}
              value={budget.fates}
              onChange={(e) => updateBudget('fates', Math.max(0, Number(e.target.value)))}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-white focus:border-amber-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="text-zinc-400">Current Pity (5★)</span>
            <input
              type="number"
              min={0}
              max={89}
              value={budget.pity}
              onChange={(e) => updateBudget('pity', Math.min(89, Math.max(0, Number(e.target.value))))}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-white focus:border-amber-500"
            />
          </label>

          <label className="flex items-center gap-2 pt-5 text-xs">
            <input
              type="checkbox"
              checked={budget.guaranteed}
              onChange={(e) => updateBudget('guaranteed', e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500"
            />
            <span className="text-zinc-300">50/50 Guaranteed</span>
          </label>
        </div>
      </div>
    </div>
  );
}
