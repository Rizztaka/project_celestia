import { useState } from 'react';
import type { CreateGoalInput, GoalType, TalentType } from '../lib/api';

interface GoalFormProps {
  onSubmit: (input: CreateGoalInput) => void;
  isPending: boolean;
  onCancel: () => void;
}

const PHASE_LABELS: Record<number, string> = {
  0: 'Phase 0 (Lv. 1–20)',
  1: 'Phase 1 (Lv. 20–40)',
  2: 'Phase 2 (Lv. 40–50)',
  3: 'Phase 3 (Lv. 50–60)',
  4: 'Phase 4 (Lv. 60–70)',
  5: 'Phase 5 (Lv. 70–80)',
  6: 'Phase 6 (Lv. 80–90)',
};

const TALENT_LABELS: Record<TalentType, string> = {
  normal: 'Normal Attack',
  skill: 'Elemental Skill',
  burst: 'Elemental Burst',
};

export default function GoalForm({ onSubmit, isPending, onCancel }: GoalFormProps) {
  const [goalType, setGoalType] = useState<GoalType>('CHARACTER_ASCENSION');
  const [targetKey, setTargetKey] = useState('');
  const [fromPhase, setFromPhase] = useState(0);
  const [toPhase, setToPhase] = useState(6);
  const [talentType, setTalentType] = useState<TalentType>('normal');

  const isTalent = goalType === 'CHARACTER_TALENT';
  const isCharacter = goalType !== 'WEAPON_ASCENSION';
  const maxFromPhase = goalType === 'CHARACTER_TALENT' ? 9 : 5;
  const maxToPhase = goalType === 'CHARACTER_TALENT' ? 10 : 6;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetKey.trim()) return;
    onSubmit({
      goalType,
      targetKey: targetKey.trim(),
      fromPhase,
      toPhase,
      talentType: isTalent ? talentType : null,
    });
  };

  const phaseLabel = (phase: number) =>
    goalType === 'CHARACTER_TALENT' ? `Level ${phase}` : (PHASE_LABELS[phase] ?? `Phase ${phase}`);

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-fade-in mt-4 flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5"
    >
      {/* Goal type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Goal Type
        </label>
        <div className="flex flex-wrap gap-2">
          {(['CHARACTER_ASCENSION', 'CHARACTER_TALENT', 'WEAPON_ASCENSION'] as GoalType[]).map(
            (t) => (
              <button
                key={t}
                type="button"
                onClick={() => setGoalType(t)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  goalType === t
                    ? 'bg-accent-500/20 border-accent-500/50 text-accent-400'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {t === 'CHARACTER_ASCENSION'
                  ? 'Char. Ascension'
                  : t === 'CHARACTER_TALENT'
                    ? 'Char. Talent'
                    : 'Weapon Ascension'}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Target key */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {isCharacter ? 'Character Key' : 'Weapon Key'}
        </label>
        <input
          type="text"
          placeholder={isCharacter ? 'e.g. HuTao, RaidenShogun' : 'e.g. StaffOfHoma'}
          value={targetKey}
          onChange={(e) => setTargetKey(e.target.value)}
          className="focus:ring-accent-500/50 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2"
          required
        />
      </div>

      {/* Talent slot (only for CHARACTER_TALENT) */}
      {isTalent && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Talent Slot
          </label>
          <div className="flex gap-2">
            {(Object.entries(TALENT_LABELS) as [TalentType, string][]).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTalentType(k)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  talentType === k
                    ? 'bg-accent-500/20 border-accent-500/50 text-accent-400'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Phase range */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            From
          </label>
          <select
            value={fromPhase}
            onChange={(e) => setFromPhase(Number(e.target.value))}
            className="focus:ring-accent-500/50 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 [&>option]:bg-zinc-900"
          >
            {Array.from({ length: maxFromPhase + 1 }, (_, i) => (
              <option key={i} value={i}>
                {phaseLabel(i)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">To</label>
          <select
            value={toPhase}
            onChange={(e) => setToPhase(Number(e.target.value))}
            className="focus:ring-accent-500/50 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 [&>option]:bg-zinc-900"
          >
            {Array.from({ length: maxToPhase }, (_, i) => i + 1).map((i) => (
              <option key={i} value={i}>
                {phaseLabel(i)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending || !targetKey.trim() || fromPhase >= toPhase}
          className="from-accent-500 hover:from-accent-400 flex-1 rounded-xl bg-gradient-to-r to-indigo-600 py-2.5 text-sm font-semibold text-white transition-all hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Adding…' : 'Add Goal'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-400 transition-all hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
