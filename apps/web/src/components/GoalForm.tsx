import { useId, useState } from 'react';

import type { CreateGoalInput, GoalType, TalentType } from '../lib/api';
import targets from '../lib/progression-targets.json';

interface GoalFormProps {
  onSubmit: (input: CreateGoalInput) => void;
  isPending: boolean;
  onCancel: () => void;
  initial?: Partial<CreateGoalInput>;
  fixedIdentity?: boolean;
  submitLabel?: string;
}
const field = 'w-full rounded-lg border border-white/20 bg-zinc-900 px-3 py-2 text-sm text-white';
export default function GoalForm({
  onSubmit,
  isPending,
  onCancel,
  initial,
  fixedIdentity = false,
  submitLabel = 'Add goal',
}: GoalFormProps) {
  const id = useId();
  const [requestId] = useState(() => crypto.randomUUID());
  const [goalType, setGoalType] = useState<GoalType>(initial?.goalType ?? 'CHARACTER_ASCENSION');
  const [targetKey, setTargetKey] = useState(initial?.targetKey ?? '');
  const [fromPhase, setFromPhase] = useState(
    initial?.fromPhase ?? (initial?.goalType === 'CHARACTER_TALENT' ? 1 : 0),
  );
  const [toPhase, setToPhase] = useState(initial?.toPhase ?? 6);
  const [talentType, setTalentType] = useState<TalentType | null>(
    fixedIdentity && initial?.goalType === 'CHARACTER_TALENT'
      ? (initial.talentType ?? null)
      : (initial?.talentType ?? 'normal'),
  );
  const [priority, setPriority] = useState(initial?.priority ?? 3);
  const isTalent = goalType === 'CHARACTER_TALENT';
  const choices = goalType === 'WEAPON_ASCENSION' ? targets.weapons : targets.characters;
  return (
    <form
      className="my-4 space-y-4 rounded-xl border border-indigo-400/30 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          contractVersion: 3,
          requestId,
          goalType,
          targetKey,
          fromPhase,
          toPhase,
          talentType: isTalent ? talentType : null,
          priority,
        });
      }}
    >
      <label className="block text-sm" htmlFor={`${id}-type`}>
        Goal type
        <select
          id={`${id}-type`}
          className={field}
          value={goalType}
          disabled={fixedIdentity || isPending}
          onChange={(event) => {
            const next = event.target.value as GoalType;
            setGoalType(next);
            setFromPhase((value) =>
              next === 'CHARACTER_TALENT' ? Math.max(1, value) : Math.min(5, value),
            );
            setToPhase((value) =>
              next === 'CHARACTER_TALENT' ? Math.max(2, value) : Math.min(6, value),
            );
          }}
        >
          <option value="CHARACTER_ASCENSION">Character ascension</option>
          <option value="CHARACTER_TALENT">Base talent</option>
          <option value="WEAPON_ASCENSION">Weapon type ascension</option>
        </select>
      </label>
      <label className="block text-sm" htmlFor={`${id}-key`}>
        {goalType === 'WEAPON_ASCENSION' ? 'Weapon' : 'Character'}
        <input
          id={`${id}-key`}
          className={field}
          value={choices.find((choice) => choice.key === targetKey)?.name ?? targetKey}
          list={`${id}-targets`}
          placeholder={goalType === 'WEAPON_ASCENSION' ? 'Search a weapon' : 'Search a character'}
          maxLength={200}
          required
          disabled={fixedIdentity || isPending}
          onChange={(event) =>
            setTargetKey(
              choices.find((choice) => choice.name === event.target.value)?.key ??
                event.target.value,
            )
          }
        />
        <datalist id={`${id}-targets`}>
          {choices.map((choice) => (
            <option key={choice.key} value={choice.name}>
              {choice.key}
            </option>
          ))}
        </datalist>
      </label>
      {isTalent && (
        <label className="block text-sm" htmlFor={`${id}-slot`}>
          Talent slot
          <select
            id={`${id}-slot`}
            className={field}
            value={talentType ?? ''}
            disabled={fixedIdentity || isPending}
            onChange={(event) => setTalentType(event.target.value as TalentType)}
          >
            {!['normal', 'skill', 'burst'].includes(talentType ?? '') && (
              <option value={talentType ?? ''}>
                Unsupported stored slot: {talentType ?? '(missing)'}
              </option>
            )}
            <option value="normal">Normal attack</option>
            <option value="skill">Skill</option>
            <option value="burst">Burst</option>
          </select>
        </label>
      )}
      <p className="text-xs text-zinc-400">
        {goalType === 'WEAPON_ASCENSION'
          ? 'This intent tracks a weapon type, not one physical copy or its assignment. Progress comparison is unknown.'
          : isTalent
            ? 'Set base talent levels 1–10, excluding constellation bonuses. Sync does not change your chosen starting value.'
            : 'Declare ascension phases 0–6. Sync never advances this starting value.'}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-sm" htmlFor={`${id}-from`}>
          Declared from
          <input
            id={`${id}-from`}
            className={field}
            type="number"
            min={isTalent ? 1 : 0}
            max={isTalent ? 9 : 5}
            step={1}
            value={fromPhase}
            required
            disabled={isPending}
            onChange={(event) => setFromPhase(event.target.valueAsNumber)}
          />
        </label>
        <label className="text-sm" htmlFor={`${id}-to`}>
          Your target
          <input
            id={`${id}-to`}
            className={field}
            type="number"
            min={isTalent ? 2 : 1}
            max={isTalent ? 10 : 6}
            step={1}
            value={toPhase}
            required
            disabled={isPending}
            onChange={(event) => setToPhase(event.target.valueAsNumber)}
          />
        </label>
      </div>
      <label className="block text-sm" htmlFor={`${id}-priority`}>
        Priority (1 first, 5 last)
        <select
          id={`${id}-priority`}
          className={field}
          value={priority}
          disabled={isPending}
          onChange={(event) => setPriority(Number(event.target.value))}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
          disabled={
            isPending ||
            !targetKey ||
            !Number.isInteger(fromPhase) ||
            !Number.isInteger(toPhase) ||
            fromPhase >= toPhase
          }
        >
          {isPending ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          className="rounded-lg border border-white/20 px-4 py-2"
          disabled={isPending}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
