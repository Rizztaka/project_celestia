import React from 'react';
import type { PullBudgetState } from '../types/genshin';
import { Sparkles, Shield, Target, Plus, RotateCcw } from 'lucide-react';

export interface PullBudgetCardProps {
  budget: PullBudgetState;
  onChangeBudget: (newBudget: PullBudgetState) => void;
  className?: string;
}

export function calculateTotalPulls(primogems: number, fates: number): number {
  const safePrimos = Math.max(0, primogems || 0);
  const safeFates = Math.max(0, fates || 0);
  return Math.floor(safePrimos / 160) + safeFates;
}

export const PullBudgetCard: React.FC<PullBudgetCardProps> = ({
  budget,
  onChangeBudget,
  className = '',
}) => {
  const totalPulls = calculateTotalPulls(budget.primogems, budget.fates);

  const handleUpdate = (field: keyof PullBudgetState, val: number | boolean) => {
    let nextBudget = { ...budget };
    if (field === 'primogems') {
      nextBudget.primogems = Math.max(0, Number(val) || 0);
    } else if (field === 'fates') {
      nextBudget.fates = Math.max(0, Number(val) || 0);
    } else if (field === 'characterPity') {
      nextBudget.characterPity = Math.max(0, Math.min(89, Number(val) || 0));
    } else if (field === 'characterGuaranteed') {
      nextBudget.characterGuaranteed = Boolean(val);
    } else if (field === 'weaponPity') {
      nextBudget.weaponPity = Math.max(0, Math.min(79, Number(val) || 0));
    } else if (field === 'weaponFatePoints') {
      nextBudget.weaponFatePoints = Math.max(0, Math.min(1, Number(val) || 0));
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
      weaponPity: 0,
      weaponFatePoints: 0,
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
            </h2>
            <p className="text-xs text-zinc-400">
              Input your current savings and pity to calculate exact odds and remaining pulls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Total Pulls Badge */}
          <div className="bg-[#181c2b] border border-[#2d3550] px-3.5 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">Total Available:</span>
            <span className="text-base font-bold text-[#d4af37] font-mono">
              {totalPulls}{' '}
              <span className="text-xs font-normal text-zinc-400">Pulls</span>
            </span>
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

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1: Primogems & Fates */}
        <div className="bg-[#0e1017] p-4 rounded-xl border border-[#1e2233] space-y-3">
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
              <div className="text-[11px] text-zinc-500 mt-0.5">
                Formatted: {(budget.primogems || 0).toLocaleString()}
              </div>
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
            <div className="pt-1 flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-500">Quick:</span>
              <button
                onClick={() => handleQuickAdd(10)}
                className="text-[11px] bg-[#1a1e2f] hover:bg-[#252b42] text-zinc-300 px-2 py-0.5 rounded border border-[#2b334d] font-mono cursor-pointer transition-colors"
              >
                +10
              </button>
              <button
                onClick={() => handleQuickAdd(50)}
                className="text-[11px] bg-[#1a1e2f] hover:bg-[#252b42] text-zinc-300 px-2 py-0.5 rounded border border-[#2b334d] font-mono cursor-pointer transition-colors"
              >
                +50
              </button>
              <button
                onClick={() => handleQuickAdd(100)}
                className="text-[11px] bg-[#1a1e2f] hover:bg-[#252b42] text-zinc-300 px-2 py-0.5 rounded border border-[#2b334d] font-mono cursor-pointer transition-colors"
              >
                +100
              </button>
            </div>
          </div>
        </div>

        {/* Column 2: Character Banner Pity */}
        <div className="bg-[#0e1017] p-4 rounded-xl border border-[#1e2233] space-y-3">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span>Character Pity</span>
            </div>
            <span className="font-mono text-sm font-bold text-purple-300">
              {budget.characterPity} / 90
            </span>
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
                      ? 'Guaranteed Featured (100%)'
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
          </div>
        </div>

        {/* Column 3: Weapon Banner Pity (5.0+) */}
        <div className="bg-[#0e1017] p-4 rounded-xl border border-[#1e2233] space-y-3">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Weapon Pity (5.0+)</span>
            </div>
            <span className="font-mono text-sm font-bold text-amber-300">
              {budget.weaponPity} / 80
            </span>
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
          </div>
        </div>
      </div>
    </div>
  );
};
