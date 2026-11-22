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
  Scale,
  RefreshCw,
} from 'lucide-react';
import { useModalAccessibility } from '../hooks/useModalAccessibility';
import {
  GACHA_RULES_VERSION,
  CHARACTER_BANNER_RULES,
  WEAPON_BANNER_RULES,
  CHRONICLED_BANNER_RULES,
  FOUR_STAR_RULES,
  STARGLITTER_CASHBACK_RATE,
  STARGLITTER_CASHBACK_CONFIG,
} from '../data/banner-rules';
import { getProvenance } from '../data/provenance-registry';
import { DataFreshnessBadge } from './DataFreshnessBadge';

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

  const charProv = getProvenance(CHARACTER_BANNER_RULES.provenanceId);
  const weapProv = getProvenance(WEAPON_BANNER_RULES.provenanceId);
  const chronProv = getProvenance(CHRONICLED_BANNER_RULES.provenanceId);
  const fourStarProv = getProvenance(FOUR_STAR_RULES.provenanceId);
  const cashbackProv = getProvenance(STARGLITTER_CASHBACK_CONFIG.provenanceId);

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
              Complete mathematical specifications, Markov transition models, and source-verified disclosures pegged to{' '}
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

        {/* Probability vs Certainty Banner */}
        <section className="space-y-2 bg-[#141827] p-4 rounded-xl border border-[#d4af37]/35">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#f3cf58]">
            <Scale className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Probability vs. Certainty: How to Read Pull Budgets</span>
          </h3>
          <p className="text-xs text-zinc-200 leading-relaxed">
            Every target reports three distinct planning figures so chance is never confused with a guarantee:{' '}
            <strong className="text-zinc-100">Median (50%)</strong> is a coin-flip outcome,{' '}
            <strong className="text-zinc-100">Expected Mean</strong> is the long-run average across many banners, and{' '}
            <strong className="text-emerald-300">Hard Ceiling (100%)</strong> is the worst-case pull count required for mathematical certainty (where a pity ceiling exists).
          </p>
        </section>

        {/* Section 1: Character Event Wish & Capturing Radiance */}
        <section className="space-y-3 bg-[#0e1019] p-4 rounded-xl border border-[#22273c]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-purple-200">
              <Target className="w-4 h-4 text-purple-300 shrink-0" aria-hidden="true" />
              <span>1. Character Event Wish: 4-State Capturing Radiance</span>
            </h3>
            <DataFreshnessBadge datasetId={CHARACTER_BANNER_RULES.provenanceId} />
          </div>
          <div className="text-xs text-zinc-200 space-y-2.5 leading-relaxed">
            <p>
              In Version {CHARACTER_BANNER_RULES.versionIntroduced}+, HoYoverse introduced <strong>Capturing Radiance</strong> to raise the consolidated
              50/50 win rate from 50.0% to <strong>{(CHARACTER_BANNER_RULES.consolidatedWinRate * 100).toFixed(3)}%</strong>. Project Celestia implements the exact 4-state Markov renewal
              model (including exact streak propagation across multi-copy C1–C6 targets) where streak represents consecutive 50/50 losses:
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
                {CHARACTER_BANNER_RULES.hardPity} (100% guarantee; max 180 pulls per non-guaranteed copy, capped at 90 on 4th consecutive 50/50)
              </li>
            </ul>
            {charProv && (
              <p className="text-[11px] text-zinc-400">
                Verified {charProv.verifiedAt} · {charProv.evidence}
              </p>
            )}
          </div>
        </section>

        {/* Section 2: Weapon Banner 75/25 Carryover */}
        <section className="space-y-3 bg-[#0e1019] p-4 rounded-xl border border-[#22273c]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-amber-200">
              <Shield className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
              <span>2. Weapon Event Wish: 1 Fate Point &amp; 75/25 Off-Banner Carryover</span>
            </h3>
            <DataFreshnessBadge datasetId={WEAPON_BANNER_RULES.provenanceId} />
          </div>
          <div className="text-xs text-zinc-200 space-y-2 leading-relaxed">
            <p>
              Version {WEAPON_BANNER_RULES.versionIntroduced} reduced the Fate Point ceiling from 2 to{' '}
              <strong>{WEAPON_BANNER_RULES.fatePointCeiling}</strong> (hard ceiling of {WEAPON_BANNER_RULES.hardPity * 2} pulls instead of 240).
              Crucially, Project Celestia models the <strong>75/25 off-banner guarantee carryover</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300 text-xs">
              <li>
                <strong className="text-zinc-100">Initial State (weaponGuaranteed = false)</strong>: {(WEAPON_BANNER_RULES.baseRateUpChance * 100).toFixed(0)}% rate-up chance split evenly across {WEAPON_BANNER_RULES.featuredPoolCount} weapons ={' '}
                <strong className="text-zinc-100">{`${(WEAPON_BANNER_RULES.baseTargetRate * 100).toFixed(1)}% target win rate`}</strong> on 1st 5★.
              </li>
              <li>
                <strong className="text-zinc-100">Off-Banner Loss (weaponGuaranteed = true)</strong>: Losing to an off-banner standard weapon guarantees the next 5★ is a featured rate-up weapon (100% rate-up pool split across {WEAPON_BANNER_RULES.featuredPoolCount} weapons ={' '}
                <strong className="text-zinc-100">{`${(WEAPON_BANNER_RULES.guaranteedRateUpTargetRate * 100).toFixed(1)}% target win rate`}</strong>).
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
            {weapProv && (
              <p className="text-[11px] text-zinc-400">
                Verified {weapProv.verifiedAt} · {weapProv.evidence}
              </p>
            )}
          </div>
        </section>

        {/* Section 3: Chronicled Wish & 4-Star Math */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="space-y-2 bg-[#0e1019] p-4 rounded-xl border border-[#22273c]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-cyan-200">
                <Compass className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                <span>3. Chronicled Wish Rules</span>
              </h3>
              <DataFreshnessBadge datasetId={CHRONICLED_BANNER_RULES.provenanceId} />
            </div>
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
            {chronProv && (
              <p className="text-[11px] text-zinc-400 pt-1">
                Verified {chronProv.verifiedAt}
              </p>
            )}
          </section>

          <section className="space-y-2 bg-[#0e1019] p-4 rounded-xl border border-[#22273c]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-200">
                <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />
                <span>4. Featured 4-Star Targets</span>
              </h3>
              <DataFreshnessBadge datasetId={FOUR_STAR_RULES.provenanceId} />
            </div>
            <ul className="list-disc pl-5 text-xs text-zinc-300 space-y-1.5 leading-relaxed">
              <li>
                <strong className="text-zinc-100">Character 4★ Rate</strong>:{' '}
                {(FOUR_STAR_RULES.characterBaseRate * 100).toFixed(3)}% (Soft{' '}
                {FOUR_STAR_RULES.softPityStart}, Hard {FOUR_STAR_RULES.hardPity};{' '}
                {(FOUR_STAR_RULES.targetOddsNonGuaranteed * 100).toFixed(2)}% non-guaranteed /{' '}
                {(FOUR_STAR_RULES.targetOddsGuaranteed * 100).toFixed(2)}% guaranteed)
              </li>
              <li>
                <strong className="text-zinc-100">Weapon 4★ Rate</strong>:{' '}
                {(FOUR_STAR_RULES.weaponBaseRate * 100).toFixed(3)}% (Soft{' '}
                {FOUR_STAR_RULES.weaponSoftPityStart}, Hard {FOUR_STAR_RULES.hardPity};{' '}
                {(FOUR_STAR_RULES.weaponTargetOddsNonGuaranteed * 100).toFixed(1)}% non-guaranteed across{' '}
                {FOUR_STAR_RULES.weaponFeaturedPoolCount} weapons)
              </li>
              <li>
                <strong className="text-zinc-100">Uncapped Reality</strong>: Strictly segregated from 5★ pity with{' '}
                <strong className="text-zinc-100">no hard ceiling or Fate Point</strong>. On Character Wish, exact mean is ~34.6 pulls (~35 pulls), median is ~26 pulls, and 90th percentile is ~77 pulls.
              </li>
            </ul>
            {fourStarProv && (
              <p className="text-[11px] text-zinc-400 pt-1">
                Verified {fourStarProv.verifiedAt}
              </p>
            )}
          </section>
        </div>

        {/* Section 5: Starglitter Cashback Projection */}
        <section className="space-y-2 bg-[#0e1019] p-4 rounded-xl border border-[#22273c]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0" aria-hidden="true" />
              <span>
                5. Masterless Starglitter Cashback Projection (~
                {(STARGLITTER_CASHBACK_RATE * 100).toFixed(0)}%)
              </span>
            </h3>
            <DataFreshnessBadge datasetId={STARGLITTER_CASHBACK_CONFIG.provenanceId} />
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            The core mathematical probability distributions remain strictly pure. When the optional{' '}
            <em>Factor in ~8% Cashback</em> toggle is enabled, available pulls are multiplied by{' '}
            {(1 + STARGLITTER_CASHBACK_RATE).toFixed(2)} to project the purchasing power of Masterless Starglitter refunded from duplicate 4★ and 5★ drops ({STARGLITTER_CASHBACK_CONFIG.starglitterPerFate} Starglitter = 1 Intertwined Fate).
          </p>
          {cashbackProv && (
            <p className="text-[11px] text-zinc-400">
              Verified {cashbackProv.verifiedAt} · {cashbackProv.evidence}
            </p>
          )}
        </section>

        {/* Section 6: Versioning & Update Protocol */}
        <section className="space-y-1.5 bg-[#0e1019] p-4 rounded-xl border border-[#22273c]">
          <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
            <RefreshCw className="w-3.5 h-3.5 text-sky-300 shrink-0" aria-hidden="true" />
            <span>Model Versioning &amp; Independent Verification</span>
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed">
            All banner rates, pity curves, and carryover constants are centralized in{' '}
            <code className="text-sky-300">banner-rules.ts</code>, linked to{' '}
            <code className="text-sky-300">provenance-registry.ts</code>, and cross-checked in CI against an independent dynamic-programming state machine and deterministic Monte Carlo suite whenever game mechanics change.
          </p>
        </section>

        {/* Primary Source Citations */}
        <div className="pt-3 border-t border-[#24293d] flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-300">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#d4af37]" aria-hidden="true" />
            <span>
              Authoritative Sources: HoYoverse Disclosures (Version 5.0 &amp; {GACHA_RULES_VERSION})
            </span>
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={charProv?.sourceUrl || 'https://genshin.hoyoverse.com/en/news/detail/125274'}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[36px] inline-flex items-center gap-1.5 text-sky-300 hover:text-sky-200 underline font-semibold"
            >
              <span>View Official Notice</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
            {chronProv?.sourceUrl && (
              <a
                href={chronProv.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[36px] inline-flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200 underline font-semibold"
              >
                <span>Chronicled Notice</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
