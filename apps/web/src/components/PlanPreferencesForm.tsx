import {
  PLAN_ROUTINE_KINDS,
  type PlanPreferences,
  planPreferencesSchema,
} from '@celestia/api-contracts';
import { useState } from 'react';

import { planButton, routineLabels } from '../lib/plan-view';

export function PlanPreferencesForm({
  initial,
  disabled,
  saving,
  onSave,
  onRestore,
}: {
  initial: PlanPreferences;
  disabled: boolean;
  saving: boolean;
  onSave: (preferences: PlanPreferences) => void;
  onRestore: () => void;
}) {
  const [budget, setBudget] = useState(
    initial.dailyResinBudget === null ? '' : String(initial.dailyResinBudget),
  );
  const [kinds, setKinds] = useState(initial.enabledRoutineKinds);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = planPreferencesSchema.safeParse({
          enabledRoutineKinds: kinds,
          dailyResinBudget: budget.trim() === '' ? null : Number(budget),
        });
        if (!parsed.success) {
          setError('Choose a whole-number daily ceiling from 0 to 200, or leave it unset.');
          return;
        }
        setError(null);
        onSave(parsed.data);
      }}
    >
      <fieldset disabled={saving} className="space-y-3">
        <legend className="mb-2 font-medium text-white">Optional routines on Today</legend>
        <p className="text-sm text-zinc-400">
          Choose what matters to you. Hiding a routine preserves its records.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PLAN_ROUTINE_KINDS.map((kind) => (
            <label
              key={kind}
              className="flex min-h-11 items-center gap-3 rounded-lg border border-white/10 px-3 text-sm"
            >
              <input
                type="checkbox"
                checked={kinds.includes(kind)}
                onChange={(event) =>
                  setKinds((old) =>
                    event.target.checked ? [...old, kind] : old.filter((item) => item !== kind),
                  )
                }
              />
              {routineLabels[kind]}
            </label>
          ))}
        </div>
        <label className="flex flex-col gap-2 text-sm">
          Recurring daily resin ceiling (0–200; blank is unset)
          <input
            aria-label="Recurring daily resin ceiling"
            className="min-h-11 w-full max-w-xs rounded-lg border border-white/20 bg-zinc-900 px-3 text-white focus-visible:outline-indigo-300"
            type="number"
            min="0"
            max="200"
            step="1"
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
          />
        </label>
        <p className="text-sm text-zinc-400">
          This choice repeats each server day. It is not a resin checkpoint; spending and loot are
          never recorded automatically.
        </p>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-amber-200">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button className={planButton} disabled={disabled}>
          Save plan choices
        </button>
        <button type="button" className={planButton} disabled={saving} onClick={onRestore}>
          Restore confirmed choices
        </button>
      </div>
    </form>
  );
}
