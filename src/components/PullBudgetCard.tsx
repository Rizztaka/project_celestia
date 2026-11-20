import React from 'react';
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
    <div
      className={`bg-[#12141d] border border-[#23273a] rounded-2xl p-5 shadow-lg space-y-5 ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1f2334] pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <span>Wish & Pity Budget</span>
              {onOpenAssumptions && (
                <button
                  type="button"
                  onClick={onOpenAssumptions}
                  className="text-xs font-normal text-amber-400 hover:text-amber-300 underline cursor-pointer ml-1"
                >
                  (Assumptions & Rules)
                </button>
              )}
            </h2>
            <p className="text-xs text-zinc-400">
              Input your savings, current pity, and guarantee carryover to compute calibrated odds.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Total Pulls Badge */}
          <div className="bg-[#181c2b] border border-[#2d3550] px-3.5 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">Available:</span>
            <span className="text-base font-bold text-[#d4af37] font-mono">
              {effectivePulls}{' '}
              <span className="text-xs font-normal text-zinc-400">Pulls</span>
            </span>
            {budget.includeCashback && bonusCashbackPulls > 0 && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 font-mono">
                {`+${bonusCashbackPulls} cashback`}
              </span>
            )}
          </div>

          <button
            onClick={handleReset}
            title="Reset Budget"
            className="p-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 bg-[#161926] text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4-Column Grid: Savings, Character, Weapon, Chronicled */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Column 1: Currency Savings */}
        <div className="bg-[#0e1017] p-4 rounded-xl border border-[#1e2233] space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Currency Savings</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Primogems</span>
                  <span className="font-mono text-zinc-300">
                    ≈ {Math.floor((budget.primogems || 0) / 160)} pulls
                  </span>
                </div>
                <input
                  type="number"
                  min={0}
                  step={160}
                  value={budget.primogems || ''}
                  placeholder="0"
                  onChange={(e) => handleUpdate('primogems', Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#151824] border border-[#282e44] focus:border-[#d4af37] text-zinc-100 px-3 py-1.5 rounded-lg font-mono text-sm outline-none transition-colors"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Intertwined Fates</span>
                  <span className="font-mono text-zinc-300">{budget.fates || 0} pulls</span>
                </div>
                <input
                  type="number"
                  min={0}
                  value={budget.fates || ''}
                  placeholder="0"
                  onChange={(e) => handleUpdate('fates', Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#151824] border border-[#282e44] focus:border-[#d4af37] text-zinc-100 px-3 py-1.5 rounded-lg font-mono text-sm outline-none transition-colors"
                />
              </div>

              {/* Quick Add Buttons */}
              <div className="pt-0.5 flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-500">Quick:</span>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(10)}
                  className="text-[11px] bg-[#1a1e2f] hover:bg-[#252b42] text-zinc-300 px-2 py-0.5 rounded border border-[#2b334d] font-mono cursor-pointer transition-colors"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(50)}
                  className="text-[11px] bg-[#1a1e2f] hover:bg-[#252b42] text-zinc-300 px-2 py-0.5 rounded border border-[#2b334d] font-mono cursor-pointer transition-colors"
                >
                  +50
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(100)}
                  className="text-[11px] bg-[#1a1e2f] hover:bg-[#252b42] text-zinc-300 px-2 py-0.5 rounded border border-[#2b334d] font-mono cursor-pointer transition-colors"
                >
                  +100
                </button>
              </div>
            </div>
          </div>

          {/* Starglitter Cashback Projection Toggle */}
          <div className="pt-2 border-t border-[#1a1e2e]">
            <label className="flex items-center justify-between gap-2 cursor-pointer select-none text-xs text-zinc-300 hover:text-zinc-100">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
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
                className="w-4 h-4 rounded accent-[#d4af37] cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Column 2: Character Banner Pity */}
        <div className="bg-[#0e1017] p-4 rounded-xl border border-[#1e2233] space-y-3">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span>Character Pity</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={89}
                value={budget.characterPity}
                onChange={(e) => handleUpdate('characterPity', parseInt(e.target.value) || 0)}
                className="w-12 bg-[#151824] border border-[#282e44] focus:border-purple-400 text-purple-300 px-1.5 py-0.5 rounded font-mono text-xs text-right outline-none font-bold"
              />
              <span className="font-mono text-xs text-zinc-500 font-bold">/ 90</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <input
                type="range"
                min={0}
                max={89}
                value={budget.characterPity}
                onChange={(e) => handleUpdate('characterPity', parseInt(e.target.value) || 0)}
                className="w-full accent-purple-500 cursor-pointer h-1.5 bg-[#1f2438] rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                <span>0</span>
                <span className="text-purple-400/80">Soft 74</span>
                <span>89</span>
              </div>
            </div>

            {/* 50/50 Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleUpdate('characterGuaranteed', !budget.characterGuaranteed)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${
                  budget.characterGuaranteed
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-sm'
                    : 'bg-[#151824] border-[#292f45] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>
                    {budget.characterGuaranteed
                      ? 'Guaranteed Featured'
                      : '50/50 (~55% Radiance)'}
                  </span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    budget.characterGuaranteed
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {budget.characterGuaranteed ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            {/* Capturing Radiance 4-State Consecutive Losses Stepper */}
            {!budget.characterGuaranteed && (
              <div className="pt-1 flex items-center justify-between text-xs bg-[#151824] border border-[#23283c] px-2.5 py-1.5 rounded-lg">
                <span className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                  <span>Radiance Streak:</span>
                  <span className="text-purple-300 font-bold font-mono">
                    {budget.consecutiveLossCount ?? 0} {budget.consecutiveLossCount === 1 ? 'loss' : 'losses'}
                  </span>
                  <InfoTooltip
                    title="Capturing Radiance (v7.2 Baseline)"
                    content="Official 4-state Markov renewal model: 0 losses: 50% win; 1 loss: 50% win; 2 losses: 8/11 (~72.7%) win; 3 losses: 100% guarantee on 4th attempt. Converges to exactly 55.000% consolidated win rate."
                    align="left"
                  />
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Decrease consecutive loss count"
                    disabled={(budget.consecutiveLossCount ?? 0) <= 0}
                    onClick={() =>
                      handleUpdate('consecutiveLossCount', Math.max(0, (budget.consecutiveLossCount ?? 0) - 1))
                    }
                    className="w-5 h-5 rounded bg-[#1f2438] hover:bg-[#2b334d] disabled:opacity-40 text-zinc-300 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    title="Increase consecutive loss count"
                    disabled={(budget.consecutiveLossCount ?? 0) >= 3}
                    onClick={() =>
                      handleUpdate('consecutiveLossCount', Math.min(3, (budget.consecutiveLossCount ?? 0) + 1))
                    }
                    className="w-5 h-5 rounded bg-[#1f2438] hover:bg-[#2b334d] disabled:opacity-40 text-zinc-300 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Weapon Banner Pity (5.0+) */}
        <div className="bg-[#0e1017] p-4 rounded-xl border border-[#1e2233] space-y-3">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Weapon Pity (5.0+)</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={79}
                value={budget.weaponPity}
                onChange={(e) => handleUpdate('weaponPity', parseInt(e.target.value) || 0)}
                className="w-12 bg-[#151824] border border-[#282e44] focus:border-amber-400 text-amber-300 px-1.5 py-0.5 rounded font-mono text-xs text-right outline-none font-bold"
              />
              <span className="font-mono text-xs text-zinc-500 font-bold">/ 80</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <input
                type="range"
                min={0}
                max={79}
                value={budget.weaponPity}
                onChange={(e) => handleUpdate('weaponPity', parseInt(e.target.value) || 0)}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-[#1f2438] rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                <span>0</span>
                <span className="text-amber-400/80">Soft 63</span>
                <span>79</span>
              </div>
            </div>

            {/* Fate Point Toggle (5.0+ Max 1) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() =>
                  handleUpdate('weaponFatePoints', budget.weaponFatePoints === 1 ? 0 : 1)
                }
                className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${
                  budget.weaponFatePoints === 1
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 shadow-sm'
                    : 'bg-[#151824] border-[#292f45] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>
                    {budget.weaponFatePoints === 1
                      ? '1 Fate Point (Guaranteed)'
                      : '0 / 1 Fate Point'}
                  </span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    budget.weaponFatePoints === 1
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {budget.weaponFatePoints === 1 ? '1/1' : '0/1'}
                </span>
              </button>
            </div>

            {/* 75/25 Off-Banner Guarantee Carryover Checkbox */}
            {budget.weaponFatePoints !== 1 && (
              <div className="pt-1">
                <label className="flex items-center justify-between gap-2 cursor-pointer select-none text-xs text-zinc-300 bg-[#151824] border border-[#23283c] px-2.5 py-1.5 rounded-lg hover:text-zinc-100">
                  <span className="flex items-center gap-1.5 text-[11px]">
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
                    className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Column 4: Chronicled Wish Pity (4.5+) */}
        <div className="bg-[#0e1017] p-4 rounded-xl border border-[#1e2233] space-y-3">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Chronicled Wish</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={89}
                value={budget.chronicledPity ?? 0}
                onChange={(e) => handleUpdate('chronicledPity', parseInt(e.target.value) || 0)}
                className="w-12 bg-[#151824] border border-[#282e44] focus:border-cyan-400 text-cyan-300 px-1.5 py-0.5 rounded font-mono text-xs text-right outline-none font-bold"
              />
              <span className="font-mono text-xs text-zinc-500 font-bold">/ 90</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <input
                type="range"
                min={0}
                max={89}
                value={budget.chronicledPity ?? 0}
                onChange={(e) => handleUpdate('chronicledPity', parseInt(e.target.value) || 0)}
                className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-[#1f2438] rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                <span>0</span>
                <span className="text-cyan-400/80">Soft 74</span>
                <span>89</span>
              </div>
            </div>

            {/* Fate Point Toggle (Chronicled Max 1) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() =>
                  handleUpdate('chronicledFatePoints', (budget.chronicledFatePoints ?? 0) === 1 ? 0 : 1)
                }
                className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${
                  (budget.chronicledFatePoints ?? 0) === 1
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 shadow-sm'
                    : 'bg-[#151824] border-[#292f45] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>
                    {(budget.chronicledFatePoints ?? 0) === 1
                      ? '1 Fate Point (Guaranteed)'
                      : '0 / 1 Fate Point'}
                  </span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    (budget.chronicledFatePoints ?? 0) === 1
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {(budget.chronicledFatePoints ?? 0) === 1 ? '1/1' : '0/1'}
                </span>
              </button>
            </div>

            <div className="text-[10px] text-zinc-500 italic pt-0.5">
              Pity carries over between events; Fate Points reset to 0.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
