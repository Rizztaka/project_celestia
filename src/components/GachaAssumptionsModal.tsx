import React from 'react';
import { X, BookOpen, Shield, Target, Compass, Sparkles, ExternalLink, CheckCircle2 } from 'lucide-react';
import { GACHA_RULES_VERSION, CHARACTER_BANNER_RULES, WEAPON_BANNER_RULES, CHRONICLED_BANNER_RULES, FOUR_STAR_RULES, STARGLITTER_CASHBACK_RATE } from '../data/banner-rules';

interface GachaAssumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GachaAssumptionsModal: React.FC<GachaAssumptionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="assumptions-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#12141e] border border-[#262c42] rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative space-y-6 text-zinc-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#202538] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 id="assumptions-modal-title" className="text-lg font-bold text-zinc-100">
                Gacha Mathematics & Wish Engine Methodology
              </h2>
            </div>
            <p className="text-xs text-zinc-400">
              Complete mathematical specifications, Markov transition models, and primary source disclosures pegged to{' '}
              <strong className="text-[#d4af37]">{`Version ${GACHA_RULES_VERSION} Baseline`}</strong>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 bg-[#181c2a] border border-[#2b334d] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Character Event Wish & Capturing Radiance */}
        <div className="space-y-3 bg-[#0d0f16] p-4 rounded-xl border border-[#1e2336]">
          <div className="flex items-center gap-2 text-sm font-bold text-purple-300">
            <Target className="w-4 h-4 text-purple-400" />
            <span>1. Character Event Wish: 4-State Capturing Radiance</span>
          </div>
          <div className="text-xs text-zinc-300 space-y-2 leading-relaxed">
            <p>
              In Version 5.0+, HoYoverse introduced <strong>Capturing Radiance</strong> to raise the consolidated
              50/50 win rate from 50.0% to <strong>55.000%</strong>. Project Celestia implements the exact 4-state Markov renewal
              model where streak represents consecutive 50/50 losses:
            </p>
            <div className="bg-[#151824] p-3 rounded-lg border border-[#23293e] font-mono text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-zinc-400 block">Streak 0:</span>
                <span className="text-purple-300 font-bold">50.00%</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Streak 1:</span>
                <span className="text-purple-300 font-bold">50.00%</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Streak 2:</span>
                <span className="text-purple-300 font-bold">8/11 (~72.73%)</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Streak 3+:</span>
                <span className="text-emerald-400 font-bold">100.0% (Guaranteed)</span>
              </div>
            </div>
            <div className="text-[11px] text-zinc-400 bg-[#10131d] p-2.5 rounded-md border border-white/5">
              <strong className="text-zinc-200">Mathematical Proof of 55.000% Convergence:</strong><br />
              The stationary distribution vector is <code className="text-sky-300">π = [11/20, 11/40, 11/80, 3/80]</code>.<br />
              Consolidated Rate = <code className="text-[#d4af37]">0.55(0.50) + 0.275(0.50) + 0.1375(8/11) + 0.0375(1.00) = 0.55000 (55.000%)</code>.
            </div>
            <div className="text-[11px] text-zinc-400">
              • <strong>Base 5★ Rate</strong>: {(CHARACTER_BANNER_RULES.baseRate * 100).toFixed(3)}%<br />
              • <strong>Soft Pity Threshold</strong>: Pull {CHARACTER_BANNER_RULES.softPityStart} (+{(CHARACTER_BANNER_RULES.softIncrement * 100).toFixed(1)}%/pull ramp)<br />
              • <strong>Hard Pity Ceiling</strong>: Pull {CHARACTER_BANNER_RULES.hardPity} (100% guarantee)
            </div>
          </div>
        </div>

        {/* Section 2: Weapon Banner 75/25 Carryover */}
        <div className="space-y-3 bg-[#0d0f16] p-4 rounded-xl border border-[#1e2336]">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>2. Weapon Event Wish: 1 Fate Point & 75/25 Off-Banner Carryover</span>
          </div>
          <div className="text-xs text-zinc-300 space-y-2 leading-relaxed">
            <p>
              Version 5.0 reduced the Fate Point ceiling from 2 to <strong>1</strong> (hard ceiling of 160 pulls instead of 240).
              Crucially, Project Celestia models the <strong>75/25 off-banner guarantee carryover</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400 text-[11px]">
              <li>
                <strong className="text-zinc-200">Initial State (weaponGuaranteed = false)</strong>: 75% rate-up chance split evenly across 2 weapons = <strong>37.5% target win rate</strong> on 1st 5★.
              </li>
              <li>
                <strong className="text-zinc-200">Off-Banner Loss (weaponGuaranteed = true)</strong>: Losing to an off-banner standard weapon guarantees the NEXT 5★ is a featured rate-up weapon (100% rate-up pool split across 2 weapons = <strong>50.0% target win rate</strong>).
              </li>
              <li>
                <strong className="text-zinc-200">Persistence</strong>: Fate Points reset to 0 across banner phases, but the <strong>75/25 off-banner guarantee carries over indefinitely</strong>.
              </li>
              <li>
                • <strong>Base 5★ Rate</strong>: {(WEAPON_BANNER_RULES.baseRate * 100).toFixed(3)}% | <strong>Soft Pity</strong>: Pull {WEAPON_BANNER_RULES.softPityStart} (+{(WEAPON_BANNER_RULES.softIncrement * 100).toFixed(1)}%/pull) | <strong>Hard Pity</strong>: Pull {WEAPON_BANNER_RULES.hardPity}
              </li>
            </ul>
          </div>
        </div>

        {/* Section 3: Chronicled Wish & 4-Star Math */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 bg-[#0d0f16] p-4 rounded-xl border border-[#1e2336]">
            <div className="flex items-center gap-2 text-sm font-bold text-cyan-300">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>3. Chronicled Wish Rules</span>
            </div>
            <div className="text-[11px] text-zinc-400 space-y-1.5 leading-relaxed">
              <p>• <strong>Base 5★ Rate</strong>: {(CHRONICLED_BANNER_RULES.baseRate * 100).toFixed(3)}% (Soft {CHRONICLED_BANNER_RULES.softPityStart}, Hard {CHRONICLED_BANNER_RULES.hardPity})</p>
              <p>• <strong>Fate Point Ceiling</strong>: {CHRONICLED_BANNER_RULES.fatePointCeiling} Fate Point</p>
              <p>• <strong>Win Rate</strong>: Flat {(CHRONICLED_BANNER_RULES.baseTargetRate * 100).toFixed(0)}% rate-up on 1st 5★; 100% on 2nd 5★ if 50/50 lost.</p>
              <p>• <strong>Carryover</strong>: Pity carries over between periods; Fate Points reset to 0.</p>
              <p>• <em>Note: Capturing Radiance does not apply to Chronicled Wish.</em></p>
            </div>
          </div>

          <div className="space-y-2 bg-[#0d0f16] p-4 rounded-xl border border-[#1e2336]">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>4. Featured 4-Star Targets</span>
            </div>
            <div className="text-[11px] text-zinc-400 space-y-1.5 leading-relaxed">
              <p>• <strong>Base 4★ Rate</strong>: {(FOUR_STAR_RULES.characterBaseRate * 100).toFixed(3)}% (Soft {FOUR_STAR_RULES.softPityStart}, Hard {FOUR_STAR_RULES.hardPity})</p>
              <p>• <strong>Absorbing Markov Model</strong>: {(FOUR_STAR_RULES.baseRateUpChance * 100).toFixed(0)}% base rate-up pool (split across {FOUR_STAR_RULES.featuredPoolCount} rate-ups = {(FOUR_STAR_RULES.targetOddsNonGuaranteed * 100).toFixed(2)}% target chance).</p>
              <p>• <strong>Uncapped Reality</strong>: There is <strong>no hard ceiling or Fate Point</strong> for specific 4-stars. Realistic median is ~35 pulls; 90th percentile is ~105 pulls.</p>
            </div>
          </div>
        </div>

        {/* Section 4: Starglitter Cashback Projection */}
        <div className="space-y-2 bg-[#0d0f16] p-4 rounded-xl border border-[#1e2336]">
          <div className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
            <span>5. Masterless Starglitter Cashback Projection (~{(STARGLITTER_CASHBACK_RATE * 100).toFixed(0)}%)</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The core mathematical probability distributions remain strictly pure. When the optional <em>Factor in ~8% Starglitter Cashback</em> toggle
            is enabled, available pulls are multiplied by 1.08 to project the purchasing power of Masterless Starglitter refunded from duplicate 4★ and 5★ drops.
          </p>
        </div>

        {/* Primary Source Citations */}
        <div className="pt-2 border-t border-[#1e2336] flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Authoritative Sources: HoYoverse Disclosures (Version 5.0 & 7.2)</span>
          </span>
          <a
            href="https://genshin.hoyoverse.com/en/news/detail/125274"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sky-400 hover:text-sky-300 underline font-medium"
          >
            <span>View Official Notice</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
