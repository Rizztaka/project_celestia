import React, { useId } from 'react';
import type { PullBudgetState } from '../types/genshin';
import { calculateTotalPulls } from '../engines/gacha-math';
import { STARGLITTER_CASHBACK_RATE } from '../data/banner-rules';
import { Sparkles, Shield, Target, RotateCcw, Coins, Compass } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

export { calculateTotalPulls };

export interface PullBudgetCardProps {
  budget: PullBudgetState;
  onChangeBudget: (newBudget: PullBudgetState) => void;
  className?: string;
  onOpenAssumptions?: () => void;
}

export const PullBudgetCard: React.FC<PullBudgetCardProps> = ({
  budget,
  onChangeBudget,
  className = '',
  onOpenAssumptions,
}) => {
  const idPrefix = useId();
  const rawPulls = calculateTotalPulls(budget.primogems, budget.fates);
  const effectivePulls = budget.includeCashback
    ? Math.floor(rawPulls * (1 + STARGLITTER_CASHBACK_RATE))
    : rawPulls;
  const bonusCashbackPulls = effectivePulls - rawPulls;

  const handleUpdate = (field: keyof PullBudgetState, val: number | boolean) => {
    const nextBudget = { ...budget };
    if (field === 'primogems') {
      nextBudget.primogems = Math.max(0, Math.floor(Number(val)) || 0);
    } else if (field === 'fates') {
      nextBudget.fates = Math.max(0, Math.floor(Number(val)) || 0);
    } else if (field === 'characterPity') {
      nextBudget.characterPity = Math.max(0, Math.min(89, Math.floor(Number(val)) || 0));
    } else if (field === 'characterGuaranteed') {
      nextBudget.characterGuaranteed = Boolean(val);
    } else if (field === 'consecutiveLossCount') {
      nextBudget.consecutiveLossCount = Math.max(0, Math.min(5, Math.floor(Number(val)) || 0));
    } else if (field === 'weaponPity') {
      nextBudget.weaponPity = Math.max(0, Math.min(79, Math.floor(Number(val)) || 0));
    } else if (field === 'weaponGuaranteed') {
      nextBudget.weaponGuaranteed = Boolean(val);
    } else if (field === 'weaponFatePoints') {
      nextBudget.weaponFatePoints = Math.max(0, Math.min(1, Math.floor(Number(val)) || 0));
    } else if (field === 'chronicledPity') {
      nextBudget.chronicledPity = Math.max(0, Math.min(89, Math.floor(Number(val)) || 0));
    } else if (field === 'chronicledFatePoints') {
      nextBudget.chronicledFatePoints = Math.max(0, Math.min(1, Math.floor(Number(val)) || 0));
    } else if (field === 'includeCashback') {
      nextBudget.includeCashback = Boolean(val);
    }
    onChangeBudget(nextBudget);
  };

  const handleQuickAdd = (pullCount: number) => {
    const additionalPrimos = pullCount * 160;
    handleUpdate('primogems', (budget.primogems || 0) + additionalPrimos);
  };

  const handleReset = () => {
    onChangeBudget({
      primogems: 0,
      fates: 0,
      characterPity: 0,
      characterGuaranteed: false,
      consecutiveLossCount: 0,
      weaponPity: 0,
      weaponGuaranteed: false,
      weaponFatePoints: 0,
      chronicledPity: 0,
      chronicledFatePoints: 0,
      includeCashback: false,
    });
  };

  return (
    <section
      aria-label="Wish and Pity Budget"
      className={`bg-[#121420] border border-[#24293d] rounded-2xl p-5 shadow-lg space-y-5 ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#202538] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/35 flex items-center justify-center text-[#f3cf58] shrink-0">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex flex-wrap items-center gap-2">
              <span>Wish &amp; Pity Budget</span>
              {onOpenAssumptions && (
                <button
                  type="button"
                  onClick={onOpenAssumptions}
                  className="text-xs font-medium text-[#f3cf58] hover:text-amber-200 underline cursor-pointer"
                >
                  (Assumptions &amp; Rules)
                </button>
              )}
            </h2>
            <p className="text-xs text-zinc-300 mt-0.5">
              Input your savings, current pity, and guarantee carryover to compute calibrated odds.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Total Pulls Badge */}
          <div className="bg-[#181c2b] border border-[#323954] px-3.5 py-2 rounded-xl flex items-center gap-2">
            <span className="text-xs text-zinc-300 font-medium">Available:</span>
            <span className="text-base font-bold text-[#f3cf58] font-mono tabular-nums">
              {effectivePulls}{' '}
              <span className="text-xs font-normal text-zinc-300">Pulls</span>
            </span>
            {budget.includeCashback && bonusCashbackPulls > 0 && (
              <span className="text-[11px] bg-emerald-500/20 text-emerald-200 px-1.5 py-0.5 rounded border border-emerald-400/40 font-mono">
                {`+${bonusCashbackPulls} cashback`}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleReset}
            title="Reset Budget"
            aria-label="Reset Budget"
            className="min-w-[40px] min-h-[40px] sm:min-w-[36px] sm:min-h-[36px] rounded-xl border border-[#323954] hover:border-[#d4af37]/60 bg-[#161a29] text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 4-Column Grid: Savings, Character, Weapon, Chronicled */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Column 1: Currency Savings */}
        <div className="bg-[#0e1019] p-4 rounded-xl border border-[#22273c] space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" aria-hidden="true" />
              <span>Currency Savings</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs text-zinc-300 mb-1">
                  <label htmlFor={`${idPrefix}-primogems`}>Primogems</label>
                  <span className="font-mono text-zinc-200 tabular-nums">
                    ≈ {Math.floor((budget.primogems || 0) / 160)} pulls
                  </span>
                </div>
                <input
                  id={`${idPrefix}-primogems`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={160}
                  value={budget.primogems || ''}
                  placeholder="0"
                  onChange={(e) =>
                    handleUpdate('primogems', Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  className="w-full min-h-[40px] sm:min-h-[36px] bg-[#161928] border border-[#2c334d] focus:border-[#d4af37] text-zinc-100 placeholder:text-zinc-400 px-3 py-1.5 rounded-lg font-mono text-sm transition-colors"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-300 mb-1">
                  <label htmlFor={`${idPrefix}-fates`}>Intertwined Fates</label>
                  <span className="font-mono text-zinc-200 tabular-nums">{budget.fates || 0} pulls</span>
                </div>
                <input
                  id={`${idPrefix}-fates`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={budget.fates || ''}
                  placeholder="0"
                  onChange={(e) =>
                    handleUpdate('fates', Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  className="w-full min-h-[40px] sm:min-h-[36px] bg-[#161928] border border-[#2c334d] focus:border-[#d4af37] text-zinc-100 placeholder:text-zinc-400 px-3 py-1.5 rounded-lg font-mono text-sm transition-colors"
                />
              </div>

              {/* Quick Add Buttons */}
              <div className="pt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-zinc-300">Quick:</span>
                {[10, 50, 100].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    aria-label={`Add ${amount} pulls`}
                    onClick={() => handleQuickAdd(amount)}
                    className="min-h-[36px] sm:min-h-[28px] text-xs bg-[#1a1e2e] hover:bg-[#252b42] text-zinc-100 px-2.5 py-1 rounded-lg border border-[#323954] font-mono cursor-pointer transition-colors"
                  >
                    {`+${amount}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Starglitter Cashback Projection Toggle */}
          <div className="pt-2.5 border-t border-[#202538]">
            <label className="flex items-center justify-between gap-2 cursor-pointer select-none text-xs text-zinc-200 hover:text-white min-h-[36px]">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
                <span>Factor in ~8% Cashback</span>
                <InfoTooltip
                  title="Starglitter Cashback (+~8%)"
                  content="4★ and 5★ duplicate pulls grant Masterless Starglitter (5 Starglitter = 1 Intertwined Fate). In standard wish sessions, this refunds approximately 1 extra fate per ~12.5 pulls (~8.0% cashback)."
                  align="left"
                />
              </span>
              <input
                type="checkbox"
                checked={Boolean(budget.includeCashback)}
                onChange={(e) => handleUpdate('includeCashback', e.target.checked)}
                className="w-4 h-4 rounded accent-[#d4af37] cursor-pointer shrink-0"
              />
            </label>
          </div>
        </div>

        {/* Column 2: Character Banner Pity */}
        <div className="bg-[#0e1019] p-4 rounded-xl border border-[#22273c] space-y-3">
          <div className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center justify-between gap-2">
            <label htmlFor={`${idPrefix}-char-pity`} className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-purple-300" aria-hidden="true" />
              <span>Character Pity</span>
            </label>
            <div className="flex items-center gap-1">
              <input
                id={`${idPrefix}-char-pity`}
                type="number"
                inputMode="numeric"
                min={0}
                max={89}
                aria-label="Character banner pity count"
                value={budget.characterPity}
                onChange={(e) => handleUpdate('characterPity', parseInt(e.target.value, 10) || 0)}
                className="w-14 min-h-[34px] sm:min-h-[28px] bg-[#161928] border border-[#2c334d] focus:border-purple-400 text-purple-200 px-2 py-0.5 rounded font-mono text-xs text-right font-bold tabular-nums"
              />
              <span className="font-mono text-xs text-zinc-300 font-bold">/ 90</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <input
                type="range"
                min={0}
                max={89}
                aria-label="Character banner pity slider"
                aria-valuetext={`${budget.characterPity} of 90 pulls`}
                value={budget.characterPity}
                onChange={(e) => handleUpdate('characterPity', parseInt(e.target.value, 10) || 0)}
                className="w-full accent-purple-400 cursor-pointer h-2 bg-[#1f2438] rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-zinc-300 mt-1">
                <span>0</span>
                <span className="text-purple-300 font-medium">Soft 74</span>
                <span>89</span>
              </div>
            </div>

            {/* 50/50 Toggle */}
            <div className="pt-1">
              <button
                type="button"
                aria-pressed={budget.characterGuaranteed}
                onClick={() => handleUpdate('characterGuaranteed', !budget.characterGuaranteed)}
                className={`w-full min-h-[42px] sm:min-h-[38px] py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  budget.characterGuaranteed
                    ? 'bg-emerald-950/50 border-emerald-400/55 text-emerald-200 shadow-sm'
                    : 'bg-[#161928] border-[#2c334d] text-zinc-200 hover:text-white hover:bg-[#1e2336]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Shield className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {budget.characterGuaranteed
                      ? 'Guaranteed Featured'
                      : '50/50 (~55% Radiance)'}
                  </span>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded font-bold shrink-0 ${
                    budget.characterGuaranteed
                      ? 'bg-emerald-500/25 text-emerald-200'
                      : 'bg-[#22283d] text-zinc-200'
                  }`}
                >
                  {budget.characterGuaranteed ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            {/* Capturing Radiance 4-State Consecutive Losses Stepper */}
            {!budget.characterGuaranteed && (
              <div className="pt-1 flex items-center justify-between gap-2 text-xs bg-[#161928] border border-[#282f48] px-2.5 py-2 rounded-lg">
                <span className="text-zinc-200 text-xs flex items-center gap-1.5 min-w-0">
                  <span className="truncate">Radiance Streak:</span>
                  <span className="text-purple-200 font-bold font-mono shrink-0">
                    {budget.consecutiveLossCount ?? 0}{' '}
                    {budget.consecutiveLossCount === 1 ? 'loss' : 'losses'}
                  </span>
                  <InfoTooltip
                    title="Capturing Radiance (v7.2 Baseline)"
                    content="Official 4-state Markov renewal model: 0 losses: 50% win; 1 loss: 50% win; 2 losses: 8/11 (~72.7%) win; 3 losses: 100% guarantee on 4th attempt. Converges to exactly 55.000% consolidated win rate."
                    align="left"
                  />
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title="Decrease consecutive loss count"
                    aria-label="Decrease consecutive loss count"
                    disabled={(budget.consecutiveLossCount ?? 0) <= 0}
                    onClick={() =>
                      handleUpdate(
                        'consecutiveLossCount',
                        Math.max(0, (budget.consecutiveLossCount ?? 0) - 1)
                      )
                    }
                    className="min-w-[34px] min-h-[34px] sm:min-w-[28px] sm:min-h-[28px] rounded-md bg-[#20263b] hover:bg-[#2c3450] disabled:opacity-40 text-zinc-100 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    title="Increase consecutive loss count"
                    aria-label="Increase consecutive loss count"
                    disabled={(budget.consecutiveLossCount ?? 0) >= 3}
                    onClick={() =>
                      handleUpdate(
                        'consecutiveLossCount',
                        Math.min(3, (budget.consecutiveLossCount ?? 0) + 1)
                      )
                    }
                    className="min-w-[34px] min-h-[34px] sm:min-w-[28px] sm:min-h-[28px] rounded-md bg-[#20263b] hover:bg-[#2c3450] disabled:opacity-40 text-zinc-100 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Weapon Banner Pity (5.0+) */}
        <div className="bg-[#0e1019] p-4 rounded-xl border border-[#22273c] space-y-3">
          <div className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center justify-between gap-2">
            <label htmlFor={`${idPrefix}-weapon-pity`} className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
              <span>Weapon Pity (5.0+)</span>
            </label>
            <div className="flex items-center gap-1">
              <input
                id={`${idPrefix}-weapon-pity`}
                type="number"
                inputMode="numeric"
                min={0}
                max={79}
                aria-label="Weapon banner pity count"
                value={budget.weaponPity}
                onChange={(e) => handleUpdate('weaponPity', parseInt(e.target.value, 10) || 0)}
                className="w-14 min-h-[34px] sm:min-h-[28px] bg-[#161928] border border-[#2c334d] focus:border-amber-400 text-amber-200 px-2 py-0.5 rounded font-mono text-xs text-right font-bold tabular-nums"
              />
              <span className="font-mono text-xs text-zinc-300 font-bold">/ 80</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <input
                type="range"
                min={0}
                max={79}
                aria-label="Weapon banner pity slider"
                aria-valuetext={`${budget.weaponPity} of 80 pulls`}
                value={budget.weaponPity}
                onChange={(e) => handleUpdate('weaponPity', parseInt(e.target.value, 10) || 0)}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-[#1f2438] rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-zinc-300 mt-1">
                <span>0</span>
                <span className="text-amber-300 font-medium">Soft 63</span>
                <span>79</span>
              </div>
            </div>

            {/* Fate Point Toggle (5.0+ Max 1) */}
            <div className="pt-1">
              <button
                type="button"
                aria-pressed={budget.weaponFatePoints === 1}
                onClick={() =>
                  handleUpdate('weaponFatePoints', budget.weaponFatePoints === 1 ? 0 : 1)
                }
                className={`w-full min-h-[42px] sm:min-h-[38px] py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  budget.weaponFatePoints === 1
                    ? 'bg-amber-950/50 border-amber-400/55 text-amber-200 shadow-sm'
                    : 'bg-[#161928] border-[#2c334d] text-zinc-200 hover:text-white hover:bg-[#1e2336]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Target className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {budget.weaponFatePoints === 1
                      ? '1 Fate Point (Guaranteed)'
                      : '0 / 1 Fate Point'}
                  </span>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded font-bold shrink-0 ${
                    budget.weaponFatePoints === 1
                      ? 'bg-amber-500/25 text-amber-200'
                      : 'bg-[#22283d] text-zinc-200'
                  }`}
                >
                  {budget.weaponFatePoints === 1 ? '1/1' : '0/1'}
                </span>
              </button>
            </div>

            {/* 75/25 Off-Banner Guarantee Carryover Checkbox */}
            {budget.weaponFatePoints !== 1 && (
              <div className="pt-1">
                <label className="flex items-center justify-between gap-2 cursor-pointer select-none text-xs text-zinc-200 bg-[#161928] border border-[#282f48] px-2.5 py-2 rounded-lg hover:text-white min-h-[38px]">
                  <span className="flex items-center gap-1.5 text-xs">
                    <span>75/25 Off-Banner Guar.</span>
                    <InfoTooltip
                      title="75/25 Off-Banner Guarantee Carryover"
                      content="If you lost your previous 5★ weapon to an off-banner standard weapon, your next 5★ is guaranteed to be one of the two featured weapons (50.0% target odds instead of 37.5%). This carryover persists across banner phases!"
                      align="left"
                    />
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(budget.weaponGuaranteed)}
                    onChange={(e) => handleUpdate('weaponGuaranteed', e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-400 cursor-pointer shrink-0"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Column 4: Chronicled Wish Pity (4.5+) */}
        <div className="bg-[#0e1019] p-4 rounded-xl border border-[#22273c] space-y-3">
          <div className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center justify-between gap-2">
            <label htmlFor={`${idPrefix}-chronicled-pity`} className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
              <span>Chronicled Wish</span>
            </label>
            <div className="flex items-center gap-1">
              <input
                id={`${idPrefix}-chronicled-pity`}
                type="number"
                inputMode="numeric"
                min={0}
                max={89}
                aria-label="Chronicled wish pity count"
                value={budget.chronicledPity ?? 0}
                onChange={(e) => handleUpdate('chronicledPity', parseInt(e.target.value, 10) || 0)}
                className="w-14 min-h-[34px] sm:min-h-[28px] bg-[#161928] border border-[#2c334d] focus:border-cyan-400 text-cyan-200 px-2 py-0.5 rounded font-mono text-xs text-right font-bold tabular-nums"
              />
              <span className="font-mono text-xs text-zinc-300 font-bold">/ 90</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <input
                type="range"
                min={0}
                max={89}
                aria-label="Chronicled wish pity slider"
                aria-valuetext={`${budget.chronicledPity ?? 0} of 90 pulls`}
                value={budget.chronicledPity ?? 0}
                onChange={(e) => handleUpdate('chronicledPity', parseInt(e.target.value, 10) || 0)}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-[#1f2438] rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-zinc-300 mt-1">
                <span>0</span>
                <span className="text-cyan-300 font-medium">Soft 74</span>
                <span>89</span>
              </div>
            </div>

            {/* Fate Point Toggle (Chronicled Max 1) */}
            <div className="pt-1">
              <button
                type="button"
                aria-pressed={(budget.chronicledFatePoints ?? 0) === 1}
                onClick={() =>
                  handleUpdate(
                    'chronicledFatePoints',
                    (budget.chronicledFatePoints ?? 0) === 1 ? 0 : 1
                  )
                }
                className={`w-full min-h-[42px] sm:min-h-[38px] py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  (budget.chronicledFatePoints ?? 0) === 1
                    ? 'bg-cyan-950/50 border-cyan-400/55 text-cyan-200 shadow-sm'
                    : 'bg-[#161928] border-[#2c334d] text-zinc-200 hover:text-white hover:bg-[#1e2336]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Target className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {(budget.chronicledFatePoints ?? 0) === 1
                      ? '1 Fate Point (Guaranteed)'
                      : '0 / 1 Fate Point'}
                  </span>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded font-bold shrink-0 ${
                    (budget.chronicledFatePoints ?? 0) === 1
                      ? 'bg-cyan-500/25 text-cyan-200'
                      : 'bg-[#22283d] text-zinc-200'
                  }`}
                >
                  {(budget.chronicledFatePoints ?? 0) === 1 ? '1/1' : '0/1'}
                </span>
              </button>
            </div>

            <p className="text-xs text-zinc-300 italic pt-0.5">
              Pity carries over between events; Fate Points reset to 0.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
