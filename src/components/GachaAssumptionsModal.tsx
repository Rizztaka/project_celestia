import React, { useRef } from 'react';
import {
  X,
  BookOpen,
  Shield,
  Target,
  Compass,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { useModalAccessibility } from '../hooks/useModalAccessibility';
import {
  GACHA_RULES_VERSION,
  CHARACTER_BANNER_RULES,
  WEAPON_BANNER_RULES,
  CHRONICLED_BANNER_RULES,
  FOUR_STAR_RULES,
  STARGLITTER_CASHBACK_RATE,
} from '../data/banner-rules';

interface GachaAssumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GachaAssumptionsModal: React.FC<GachaAssumptionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useModalAccessibility({
    isOpen,
    onClose,
    containerRef: dialogRef,
    initialFocusRef: closeBtnRef,
  });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="assumptions-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-[#121420] border border-[#2c334d] rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl relative space-y-5 text-zinc-100 max-h-[90vh] overflow-y-auto focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#24293d] pb-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/35 flex items-center justify-center text-[#f3cf58] shrink-0">
                <BookOpen className="w-4 h-4" aria-hidden="true" />
              </div>
              <h2
                id="assumptions-modal-title"
                className="text-base sm:text-lg font-bold text-zinc-100 font-serif"
              >
                Gacha Mathematics &amp; Wish Engine Methodology
              </h2>
            </div>
            <p className="text-xs text-zinc-300">
              Complete mathematical specifications, Markov transition models, and primary source disclosures pegged to{' '}
              <strong className="text-[#f3cf58]">{`Version ${GACHA_RULES_VERSION} Baseline`}</strong>.
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close methodology dialog"
            className="min-w-[40px] min-h-[40px] rounded-xl text-zinc-300 hover:text-white bg-[#1a1e2e] hover:bg-[#252b42] border border-[#323954] flex items-center justify-center cursor-pointer transition-colors shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Section 1: Character Event Wish & Capturing Radiance */}
        <section className="space-y-3 bg-[#0e1019] p-4 rounded-xl border border-[#22273c]">
          <h3 className="flex items-center gap-2 text-sm font-bold text-purple-200">
            <Target className="w-4 h-4 text-purple-300 shrink-0" aria-hidden="true" />
            <span>1. Character Event Wish: 4-State Capturing Radiance</span>
          </h3>
          <div className="text-xs text-zinc-200 space-y-2.5 leading-relaxed">
            <p>
              In Version 5.0+, HoYoverse introduced <strong>Capturing Radiance</strong> to raise the consolidated
              50/50 win rate from 50.0% to <strong>55.000%</strong>. Project Celestia implements the exact 4-state Markov renewal
              model where streak represents consecutive 50/50 losses:
            </p>
            <div className="bg-[#161928] p-3 rounded-lg border border-[#282f48] font-mono text-xs grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <span className="text-zinc-300 block">Streak 0:</span>
                <span className="text-purple-200 font-bold">50.00%</span>
              </div>
              <div>
                <span className="text-zinc-300 block">Streak 1:</span>
                <span className="text-purple-200 font-bold">50.00%</span>
              </div>
              <div>
                <span className="text-zinc-300 block">Streak 2:</span>
                <span className="text-purple-200 font-bold">8/11 (~72.73%)</span>
              </div>
              <div>
                <span className="text-zinc-300 block">Streak 3+:</span>
                <span className="text-emerald-300 font-bold">100.0% (Guaranteed)</span>
              </div>
            </div>
            <div className="text-xs text-zinc-300 bg-[#121524] p-3 rounded-lg border border-[#202538] space-y-1">
              <strong className="text-zinc-100 block">Mathematical Proof of 55.000% Convergence:</strong>
              <div>
                Stationary distribution vector:{' '}
                <code className="text-sky-300">π = [11/20, 11/40, 11/80, 3/80]</code>.
              </div>
              <div>
                Consolidated Rate ={' '}
                <code className="text-[#f3cf58]">
                  0.55(0.50) + 0.275(0.50) + 0.1375(8/11) + 0.0375(1.00) = 0.55000 (55.000%)
                </code>.
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-300">
              <li>
                <strong className="text-zinc-100">Base 5★ Rate</strong>:{' '}
                {(CHARACTER_BANNER_RULES.baseRate * 100).toFixed(3)}%
              </li>
              <li>
                <strong className="text-zinc-100">Soft Pity Threshold</strong>: Pull{' '}
                {CHARACTER_BANNER_RULES.softPityStart} (+
                {(CHARACTER_BANNER_RULES.softIncrement * 100).toFixed(1)}%/pull ramp)
              </li>
              <li>
                <strong className="text-zinc-100">Hard Pity Ceiling</strong>: Pull{' '}
                {CHARACTER_BANNER_RULES.hardPity} (100% guarantee)
              </li>
            </ul>
          </div>
        </section>

        {/* Section 2: Weapon Banner 75/25 Carryover */}
        <section className="space-y-3 bg-[#0e1019] p-4 rounded-xl border border-[#22273c]">
          <h3 className="flex items-center gap-2 text-sm font-bold text-amber-200">
            <Shield className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
            <span>2. Weapon Event Wish: 1 Fate Point &amp; 75/25 Off-Banner Carryover</span>
          </h3>
          <div className="text-xs text-zinc-200 space-y-2 leading-relaxed">
            <p>
              Version 5.0 reduced the Fate Point ceiling from 2 to <strong>1</strong> (hard ceiling of 160 pulls instead of 240).
              Crucially, Project Celestia models the <strong>75/25 off-banner guarantee carryover</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300 text-xs">
              <li>
                <strong className="text-zinc-100">Initial State (weaponGuaranteed = false)</strong>: 75% rate-up chance split evenly across 2 weapons ={' '}
                <strong className="text-zinc-100">37.5% target win rate</strong> on 1st 5★.
              </li>
              <li>
                <strong className="text-zinc-100">Off-Banner Loss (weaponGuaranteed = true)</strong>: Losing to an off-banner standard weapon guarantees the next 5★ is a featured rate-up weapon (100% rate-up pool split across 2 weapons ={' '}
                <strong className="text-zinc-100">50.0% target win rate</strong>).
              </li>
              <li>
                <strong className="text-zinc-100">Persistence</strong>: Fate Points reset to 0 across banner phases, while the{' '}
                <strong className="text-zinc-100">75/25 off-banner guarantee carries over indefinitely</strong>.
              </li>
              <li>
                <strong className="text-zinc-100">Base 5★ Rate</strong>:{' '}
                {(WEAPON_BANNER_RULES.baseRate * 100).toFixed(3)}% |{' '}
                <strong className="text-zinc-100">Soft Pity</strong>: Pull{' '}
                {WEAPON_BANNER_RULES.softPityStart} (+
                {(WEAPON_BANNER_RULES.softIncrement * 100).toFixed(1)}%/pull) |{' '}
                <strong className="text-zinc-100">Hard Pity</strong>: Pull{' '}
                {WEAPON_BANNER_RULES.hardPity}
              </li>
            </ul>
          </div>
        </section>

        {/* Section 3: Chronicled Wish & 4-Star Math */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="space-y-2 bg-[#0e1019] p-4 rounded-xl border border-[#22273c]">
            <h3 className="flex items-center gap-2 text-sm font-bold text-cyan-200">
              <Compass className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
              <span>3. Chronicled Wish Rules</span>
            </h3>
            <ul className="list-disc pl-5 text-xs text-zinc-300 space-y-1.5 leading-relaxed">
              <li>
                <strong className="text-zinc-100">Base 5★ Rate</strong>:{' '}
                {(CHRONICLED_BANNER_RULES.baseRate * 100).toFixed(3)}% (Soft{' '}
                {CHRONICLED_BANNER_RULES.softPityStart}, Hard {CHRONICLED_BANNER_RULES.hardPity})
              </li>
              <li>
                <strong className="text-zinc-100">Fate Point Ceiling</strong>:{' '}
                {CHRONICLED_BANNER_RULES.fatePointCeiling} Fate Point
              </li>
              <li>
                <strong className="text-zinc-100">Win Rate</strong>: Flat{' '}
                {(CHRONICLED_BANNER_RULES.baseTargetRate * 100).toFixed(0)}% rate-up on 1st 5★; 100% on 2nd 5★ if 50/50 lost.
              </li>
              <li>
                <strong className="text-zinc-100">Carryover</strong>: Pity carries over between periods; Fate Points reset to 0.
              </li>
              <li>
                <em>Note: Capturing Radiance does not apply to Chronicled Wish.</em>
              </li>
            </ul>
          </section>

          <section className="space-y-2 bg-[#0e1019] p-4 rounded-xl border border-[#22273c]">
            <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-200">
              <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />
              <span>4. Featured 4-Star Targets</span>
            </h3>
            <ul className="list-disc pl-5 text-xs text-zinc-300 space-y-1.5 leading-relaxed">
              <li>
                <strong className="text-zinc-100">Base 4★ Rate</strong>:{' '}
                {(FOUR_STAR_RULES.characterBaseRate * 100).toFixed(3)}% (Soft{' '}
                {FOUR_STAR_RULES.softPityStart}, Hard {FOUR_STAR_RULES.hardPity})
              </li>
              <li>
                <strong className="text-zinc-100">Absorbing Markov Model</strong>:{' '}
                {(FOUR_STAR_RULES.baseRateUpChance * 100).toFixed(0)}% base rate-up pool (split across{' '}
                {FOUR_STAR_RULES.featuredPoolCount} rate-ups ={' '}
                {(FOUR_STAR_RULES.targetOddsNonGuaranteed * 100).toFixed(2)}% target chance).
              </li>
              <li>
                <strong className="text-zinc-100">Uncapped Reality</strong>: There is{' '}
                <strong className="text-zinc-100">no hard ceiling or Fate Point</strong> for specific 4-stars. Realistic median is ~35 pulls; 90th percentile is ~105 pulls.
              </li>
            </ul>
          </section>
        </div>

        {/* Section 5: Starglitter Cashback Projection */}
        <section className="space-y-2 bg-[#0e1019] p-4 rounded-xl border border-[#22273c]">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0" aria-hidden="true" />
            <span>
              5. Masterless Starglitter Cashback Projection (~
              {(STARGLITTER_CASHBACK_RATE * 100).toFixed(0)}%)
            </span>
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed">
            The core mathematical probability distributions remain strictly pure. When the optional{' '}
            <em>Factor in ~8% Cashback</em> toggle is enabled, available pulls are multiplied by 1.08 to project the purchasing power of Masterless Starglitter refunded from duplicate 4★ and 5★ drops.
          </p>
        </section>

        {/* Primary Source Citations */}
        <div className="pt-3 border-t border-[#24293d] flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-300">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#d4af37]" aria-hidden="true" />
            <span>Authoritative Sources: HoYoverse Disclosures (Version 5.0 &amp; {GACHA_RULES_VERSION})</span>
          </span>
          <a
            href="https://genshin.hoyoverse.com/en/news/detail/125274"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[36px] inline-flex items-center gap-1.5 text-sky-300 hover:text-sky-200 underline font-semibold"
          >
            <span>View Official Notice</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
};
