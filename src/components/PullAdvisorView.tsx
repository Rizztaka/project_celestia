import React, { useState, useMemo, useRef, useEffect, useDeferredValue, Suspense } from 'react';
import type {
  Character,
  EnhancedPullAdvice,
  OwnedCharacterProfile,
  OwnedWeapon,
  PullBudgetState,
} from '../types/genshin';
import { evaluateComprehensivePullROI } from '../engines/pull-advisor';
import { calculateRadianceWinRate } from '../engines/gacha-math';
import {
  GACHA_RULES_VERSION,
  CHARACTER_BANNER_RULES,
  WEAPON_BANNER_RULES,
  STARGLITTER_CASHBACK_RATE,
} from '../data/banner-rules';
import { BANNER_PHASES } from '../data/banners';
import { CHARACTERS } from '../data/characters';
import { CURRENT_GAME_VERSION } from '../data/game-version';
import { getWeaponByKey } from '../data/weapons';
import { getSavedPullBudget, savePullBudget } from '../services/storage';
import { LazyCharacterDetailModal } from './LazyCharacterDetailModal';
import { CharacterPortrait } from './CharacterPortrait';
import { PullBudgetCard } from './PullBudgetCard';
import { InfoTooltip } from './InfoTooltip';
import { DataFreshnessBadge, StaleDataWarningBanner } from './DataFreshnessBadge';

const LazyPullDistributionModal = React.lazy(() =>
  import('./PullDistributionModal').then((m) => ({ default: m.PullDistributionModal }))
);
const LazyGachaAssumptionsModal = React.lazy(() =>
  import('./GachaAssumptionsModal').then((m) => ({ default: m.GachaAssumptionsModal }))
);
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  Check,
  Info,
  Sparkles,
  Shield,
  Zap,
  Calendar,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  BookOpen,
  X,
} from 'lucide-react';

interface PullAdvisorViewProps {
  ownedIds: string[];
  profiles?: Record<string, OwnedCharacterProfile>;
  weapons?: OwnedWeapon[];
}

export const PullAdvisorView: React.FC<PullAdvisorViewProps> = ({
  ownedIds,
  profiles,
  weapons,
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedDistributionItem, setSelectedDistributionItem] =
    useState<EnhancedPullAdvice | null>(null);
  const [isAssumptionsOpen, setIsAssumptionsOpen] = useState(false);
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Record<string, boolean>>({});
  const [bannerFilter, setBannerFilter] = useState<string>('banner_7_2_phase_1');
  const [budget, setBudget] = useState<PullBudgetState>(() => getSavedPullBudget());
  const deferredBudget = useDeferredValue(budget);
  const [simulationToast, setSimulationToast] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleBudgetChange = (newBudget: PullBudgetState) => {
    setBudget(newBudget);
    savePullBudget(newBudget);
  };

  const toggleBreakdown = (id: string) => {
    setExpandedBreakdowns((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const effectiveProfiles = useMemo(() => {
    const map: Record<string, OwnedCharacterProfile> = { ...(profiles || {}) };
    for (const id of ownedIds) {
      if (!map[id]) {
        map[id] = { id, level: 90, constellation: 0 };
      }
    }
    return map;
  }, [profiles, ownedIds]);

  const effectiveWeapons = useMemo(() => weapons || [], [weapons]);

  // Retain full RecommendationCollection envelope (items + reliability) at view boundary
  const pullAdviceResult = useMemo(() => {
    return evaluateComprehensivePullROI(
      effectiveProfiles,
      effectiveWeapons,
      deferredBudget,
      bannerFilter,
    );
  }, [effectiveProfiles, effectiveWeapons, deferredBudget, bannerFilter]);
  const recommendations = pullAdviceResult.items;

  const displayedRecommendations = showAll
    ? recommendations
    : recommendations.slice(0, 12);

  const tierColors: Record<EnhancedPullAdvice['tier'], string> = {
    'Must Pull': 'bg-amber-500/20 text-amber-200 border-amber-400/45',
    'High Value': 'bg-sky-500/20 text-sky-200 border-sky-400/45',
    Situational: 'bg-purple-500/20 text-purple-200 border-purple-400/45',
    'Skip / Redundant': 'bg-[#1c2032] text-zinc-200 border-[#323954]',
  };

  const targetTypeBadge = (item: EnhancedPullAdvice) => {
    if (item.odds.isUncapped) {
      return (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/45 inline-flex items-center gap-1">
          <span>4★ Featured Target (No Hard Guarantee)</span>
        </span>
      );
    }
    if (item.targetType === 'C0_Character') {
      return (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
          C0 New Character
        </span>
      );
    }
    if (item.targetType === 'Constellation') {
      return (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-400/40">
          {item.targetLevelText}
        </span>
      );
    }
    return (
      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/40">
        R1 Signature Weapon
      </span>
    );
  };

  const dismissSimulationToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setSimulationToast(null);
  };

  const handleSimulatePull = (item: EnhancedPullAdvice) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setSimulationToast(
      `Simulated: ${item.name} (${item.targetLevelText}) with ${(item.odds.cumulativeProbability * 100).toFixed(1)}% pull chance!`,
    );
    toastTimerRef.current = setTimeout(() => {
      setSimulationToast(null);
      toastTimerRef.current = null;
    }, 4500);
  };

  return (
    <div className="space-y-6">
      {/* Simulation Feedback Toast (clears mobile bottom tab bar) */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-[76px] md:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 pointer-events-none"
      >
        {simulationToast && (
          <div
            role="status"
            className="pointer-events-auto bg-[#161a29]/95 border border-[#d4af37]/60 text-zinc-100 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs font-medium"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-[#f3cf58] shrink-0" aria-hidden="true" />
              <span className="leading-relaxed">{simulationToast}</span>
            </div>
            <button
              type="button"
              onClick={dismissSimulationToast}
              aria-label="Dismiss simulation toast"
              className="min-w-[34px] min-h-[34px] -my-1 -mr-1.5 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#121420] via-[#191d30] to-[#121420] p-5 sm:p-6 rounded-2xl border border-[#24293d] shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-2 text-[#f3cf58] text-xs font-bold tracking-wider uppercase">
            <Compass className="w-4 h-4" aria-hidden="true" />
            <span>Account-Aware Pull Advisor v2 (Version {CURRENT_GAME_VERSION} Baseline)</span>
          </div>

          <button
            type="button"
            onClick={() => setIsAssumptionsOpen(true)}
            className="min-h-[38px] sm:min-h-[34px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#181c2b] hover:bg-[#22273d] text-amber-200 border border-amber-400/40 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Assumptions &amp; Methodology</span>
          </button>
        </div>

        <h1 className="text-2xl font-bold text-zinc-100 font-serif">
          Who Should You Pull Next?
        </h1>
        <p className="text-sm text-zinc-300 mt-1 max-w-3xl leading-relaxed">
          Calculates marginal team DPS uplift and archetype unlocking ROI for C0 new unlocks, high-impact constellations, and signature weapons. Powered by exact gacha math with 4-state Capturing Radiance (55.000% consolidated win rate), Weapon 75/25 off-banner carryover, and Chronicled Wish.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-2 bg-[#10121b] text-emerald-200 px-3 py-1.5 rounded-xl border border-emerald-400/30">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" aria-hidden="true" />
            <span>Owned C0 units are never recommended for C0</span>
          </div>
          <div className="flex items-center gap-2 bg-[#10121b] text-purple-200 px-3 py-1.5 rounded-xl border border-purple-400/30">
            <Target className="w-4 h-4 shrink-0 text-purple-300" aria-hidden="true" />
            <span>Multi-Copy discrete convolution evaluated up to C6</span>
          </div>
          <div className="flex items-center gap-2 bg-[#10121b] text-amber-200 px-3 py-1.5 rounded-xl border border-amber-400/30">
            <Shield className="w-4 h-4 shrink-0 text-amber-300" aria-hidden="true" />
            <span>Weapon 75/25 carryover &amp; 1 Fate Point ceiling</span>
          </div>
        </div>
      </div>

      {/* Interactive Budget Tracker Card */}
      <PullBudgetCard
        budget={budget}
        onChangeBudget={handleBudgetChange}
        onOpenAssumptions={() => setIsAssumptionsOpen(true)}
      />

      {/* Active Wish Model Assumptions Summary Strip */}
      <div className="bg-[#0e1019] border border-[#22273c] rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-300">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-zinc-100">Active Wish Model:</span>
          <span className="px-2 py-0.5 rounded bg-[#161a29] border border-[#282f48] font-mono text-[#f3cf58]">
            v{GACHA_RULES_VERSION} Rules
          </span>
          <span className="px-2 py-0.5 rounded bg-[#161a29] border border-[#282f48] font-mono text-purple-200">
            Char:{' '}
            {budget.characterGuaranteed
              ? '100% Guaranteed'
              : `Radiance ${(calculateRadianceWinRate(budget.consecutiveLossCount ?? 0) * 100).toFixed(1)}% (Streak ${budget.consecutiveLossCount ?? 0})`}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#161a29] border border-[#282f48] font-mono text-amber-200">
            Weapon:{' '}
            {budget.weaponFatePoints >= WEAPON_BANNER_RULES.fatePointCeiling
              ? '1/1 Fate (100%)'
              : budget.weaponGuaranteed
                ? '75/25 Carryover ON (50%)'
                : `Standard (${(WEAPON_BANNER_RULES.baseTargetRate * 100).toFixed(1)}%)`}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#161a29] border border-[#282f48] font-mono text-zinc-200">
            Soft/Hard: {CHARACTER_BANNER_RULES.softPityStart}/{CHARACTER_BANNER_RULES.hardPity} (Char) ·{' '}
            {WEAPON_BANNER_RULES.softPityStart}/{WEAPON_BANNER_RULES.hardPity} (Weap)
          </span>
          {budget.includeCashback && (
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/40 font-mono text-emerald-200">
              +{(STARGLITTER_CASHBACK_RATE * 100).toFixed(0)}% Cashback Active
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsAssumptionsOpen(true)}
          className="text-sky-300 hover:text-sky-200 underline font-semibold cursor-pointer"
        >
          Verify Rules &amp; Sources
        </button>
      </div>

      {/* Banner Phase Selector & Mode Switcher */}
      <div className="bg-[#121420] border border-[#24293d] rounded-2xl p-4 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-200">
          <Calendar className="w-4 h-4 text-[#d4af37]" aria-hidden="true" />
          <span>Banner Phase Filter:</span>
          {bannerFilter !== 'sandbox' && bannerFilter !== 'all' && (
            <DataFreshnessBadge datasetId={bannerFilter} className="ml-1" />
          )}
        </div>

        <div
          role="group"
          aria-label="Banner phase filter"
          className="flex flex-wrap items-center gap-2"
        >
          {BANNER_PHASES.map((phase) => (
            <button
              key={phase.id}
              type="button"
              aria-pressed={bannerFilter === phase.id}
              onClick={() => setBannerFilter(phase.id)}
              className={`min-h-[40px] sm:min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors border ${
                bannerFilter === phase.id
                  ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f3cf58]'
                  : 'bg-[#161928] border-[#2c334d] text-zinc-300 hover:text-white hover:bg-[#1e2336]'
              }`}
            >
              {phase.phaseName}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={bannerFilter === 'sandbox' || bannerFilter === 'all'}
            onClick={() => setBannerFilter('sandbox')}
            className={`min-h-[40px] sm:min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors border ${
              bannerFilter === 'sandbox' || bannerFilter === 'all'
                ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                : 'bg-[#161928] border-[#2c334d] text-zinc-300 hover:text-white hover:bg-[#1e2336]'
            }`}
          >
            All-Target Sandbox
          </button>
        </div>
      </div>

      {bannerFilter !== 'sandbox' && bannerFilter !== 'all' && (
        <StaleDataWarningBanner datasetId={bannerFilter} contextLabel="Banner Schedule" />
      )}

      {/* Target Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {displayedRecommendations.map((item, idx) => {
          const char = CHARACTERS.find((c) => c.id === item.characterId);
          const dbWeapon = item.weaponKey
            ? getWeaponByKey(item.weaponKey)
            : item.targetType === 'Signature_Weapon'
              ? getWeaponByKey(item.name)
              : undefined;

          const probPct = (item.odds.cumulativeProbability * 100).toFixed(1);
          let probColor = 'bg-rose-950/60 text-rose-200 border-rose-400/45';
          if (item.odds.cumulativeProbability >= 0.8) {
            probColor = 'bg-emerald-950/60 text-emerald-200 border-emerald-400/45';
          } else if (item.odds.cumulativeProbability >= 0.45) {
            probColor = 'bg-amber-950/60 text-amber-200 border-amber-400/45';
          }

          const hasBreakdown = Boolean(
            item.odds.copiesBreakdown && item.odds.copiesBreakdown.length > 1
          );
          const isExpanded = Boolean(expandedBreakdowns[item.id]);
          const breakdownPanelId = `pull-breakdown-${item.id}`;

          return (
            <article
              key={item.id}
              className="bg-[#121420] border border-[#24293d] hover:border-[#d4af37]/50 rounded-2xl p-5 transition-colors shadow-md flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 border-b border-[#202538] pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      {item.targetType === 'Signature_Weapon' && dbWeapon ? (
                        <>
                          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-b from-[#5c4424] to-[#1c1710] border-2 border-[#d4af37]/70 p-1 flex items-center justify-center shadow-md overflow-hidden">
                            <img
                              src={dbWeapon.icon}
                              alt={dbWeapon.name}
                              className="w-10 h-10 object-contain drop-shadow-md"
                            />
                          </div>
                          {char && (
                            <img
                              src={char.icon}
                              alt={char.name}
                              title={`BiS for ${char.name}`}
                              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-[#d4af37] bg-black/90 object-cover shadow-sm z-10"
                            />
                          )}
                        </>
                      ) : char ? (
                        <CharacterPortrait
                          src={char.icon}
                          name={char.name}
                          element={char.element}
                          size="md"
                          className="border-[#323954]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#1b1f2e] border border-[#323954] flex items-center justify-center text-[#d4af37]">
                          <Shield className="w-6 h-6" aria-hidden="true" />
                        </div>
                      )}
                      <div className="absolute -bottom-1.5 -left-1 bg-[#0a0b0e] px-1.5 py-0.5 rounded text-[10px] font-bold text-[#f3cf58] border border-[#d4af37]/50">
                        #{idx + 1}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-bold text-zinc-100 leading-tight truncate">
                        {item.name}
                      </h2>
                      <div className="text-xs text-zinc-300 mt-0.5 truncate">
                        {item.targetType === 'Signature_Weapon'
                          ? `${dbWeapon?.weaponType ? `5★ ${dbWeapon.weaponType}` : '5★ Weapon'} · BiS for ${char?.name ?? item.characterId}`
                          : `${char?.element || ''} · ${char?.weapon || ''} · ${char?.roles?.[0] || ''}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        tierColors[item.tier]
                      }`}
                    >
                      {item.tier}
                    </span>
                    <span className="text-xs font-bold text-amber-200 flex items-center gap-1 tabular-nums">
                      <span>Account Value: {item.score}/100</span>
                      <InfoTooltip
                        title="Estimated Account Value"
                        content="Composite score (0-100) quantifying marginal DPS uplift, team archetype unlocks, and gacha pull probability."
                        align="right"
                      />
                    </span>
                  </div>
                </div>

                {/* Target Level & Uplift Badges */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {targetTypeBadge(item)}

                  {item.teamDamageUpliftPct > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-200 border border-cyan-400/40 inline-flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-300" aria-hidden="true" />
                      +{item.teamDamageUpliftPct}% Team DMG
                    </span>
                  )}

                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border tabular-nums ${probColor}`}>
                    {probPct}% Pull Chance
                  </span>
                </div>

                {/* 3-Column Economics Bar */}
                <div className="mt-3 bg-[#0c0e17] border border-[#202538] rounded-xl p-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-zinc-300 block uppercase font-medium">
                      Median (50%)
                    </span>
                    <span className="font-mono text-[#f3cf58] font-bold text-sm tabular-nums">
                      ~{item.odds.medianPulls}{' '}
                      <span className="text-[11px] font-normal text-zinc-300">pulls</span>
                    </span>
                  </div>

                  <div className="space-y-0.5 text-center">
                    <span className="text-[11px] text-zinc-300 block uppercase font-medium">
                      Expected Mean
                    </span>
                    <span className="font-mono text-zinc-100 font-bold text-sm tabular-nums">
                      ~{item.odds.expectedPulls}{' '}
                      <span className="text-[11px] font-normal text-zinc-300">pulls</span>
                    </span>
                  </div>

                  <div className="space-y-0.5 text-right">
                    <span className="text-[11px] text-zinc-300 block uppercase font-medium">
                      Hard Ceiling
                    </span>
                    {item.odds.isUncapped ? (
                      <span className="font-mono text-amber-200 font-semibold text-xs block pt-0.5">
                        Uncapped
                      </span>
                    ) : (
                      <span className="font-mono text-emerald-300 font-bold text-sm tabular-nums">
                        {item.odds.guaranteedPulls}{' '}
                        <span className="text-[11px] font-normal text-zinc-300">pulls</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Deficit Clarity Row */}
                <div className="mt-2 px-1 flex flex-wrap items-center justify-between gap-1 text-xs text-zinc-300">
                  <div>
                    {item.odds.pullsAvailable >= item.odds.medianPulls ? (
                      <span className="text-emerald-300 font-medium inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Covers 50% Median</span>
                      </span>
                    ) : (
                      <span>
                        Needs{' '}
                        <strong className="text-amber-200 font-mono">
                          {item.odds.medianPulls - item.odds.pullsAvailable}
                        </strong>{' '}
                        more pulls for 50% median
                      </span>
                    )}
                  </div>

                  <div>
                    {item.odds.isUncapped ? (
                      <span className="text-zinc-300 italic">No guarantee ceiling</span>
                    ) : item.odds.primogemsNeeded === 0 ? (
                      <span className="text-emerald-300 font-bold inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>100% Guaranteed!</span>
                      </span>
                    ) : (
                      <span className="font-mono text-amber-200 font-semibold">
                        +{item.odds.primogemsNeeded.toLocaleString()} Primos to 100%
                      </span>
                    )}
                  </div>
                </div>

                {/* Multi-Copy Expandable Breakdown */}
                {hasBreakdown && (
                  <div className="mt-2.5 pt-2 border-t border-[#202538]">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={breakdownPanelId}
                      onClick={() => toggleBreakdown(item.id)}
                      className="min-h-[36px] px-1.5 -ml-1.5 rounded-lg text-xs text-sky-300 hover:text-sky-200 hover:bg-sky-500/10 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-4 h-4" aria-hidden="true" />
                      )}
                      <span>
                        {isExpanded ? 'Hide' : 'View'} Step-by-Step Breakdown (
                        {item.odds.copiesBreakdown?.length} copies)
                      </span>
                    </button>

                    {isExpanded && (
                      <div
                        id={breakdownPanelId}
                        className="mt-2 bg-[#0a0c14] rounded-lg p-3 border border-[#202538] text-xs space-y-1.5 font-mono"
                      >
                        <div className="grid grid-cols-4 text-zinc-300 text-[11px] uppercase pb-1 border-b border-white/10">
                          <span>Target</span>
                          <span className="text-center">Median</span>
                          <span className="text-center">Hard Pity</span>
                          <span className="text-right">Chance</span>
                        </div>
                        {item.odds.copiesBreakdown?.map((step) => (
                          <div key={step.copyNumber} className="grid grid-cols-4 text-zinc-200 tabular-nums">
                            <span className="font-sans font-semibold text-zinc-100">{step.label}</span>
                            <span className="text-center text-[#f3cf58]">~{step.medianPulls}p</span>
                            <span className="text-center text-emerald-300">
                              {item.odds.isUncapped ? 'Uncapped' : `${step.guaranteedPulls}p`}
                            </span>
                            <span className="text-right text-sky-300 font-bold">
                              {(step.cumulativeProbability * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Unlocked Archetypes */}
                {item.unlockedArchetypes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.unlockedArchetypes.map((arch, aIdx) => (
                      <span
                        key={aIdx}
                        className="text-xs bg-[#181c2e] text-sky-200 px-2 py-0.5 rounded border border-sky-400/30 font-medium"
                      >
                        ★ {arch}
                      </span>
                    ))}
                  </div>
                )}

                {/* Account Benefits */}
                <div className="mt-3 space-y-1.5 text-xs text-zinc-200">
                  {item.accountBenefits.map((b, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                {/* Caution */}
                {item.caution && (
                  <div className="mt-3 flex items-start gap-2 bg-amber-950/35 border border-amber-400/40 text-amber-100 text-xs p-3 rounded-xl">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" aria-hidden="true" />
                    <span>{item.caution}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {char && (
                    <button
                      type="button"
                      onClick={() => setSelectedCharacter(char)}
                      className="min-h-[40px] sm:min-h-[34px] px-2.5 rounded-lg flex items-center gap-1.5 text-[#f3cf58] hover:bg-[#d4af37]/10 font-semibold cursor-pointer transition-colors"
                    >
                      <Info className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Kit &amp; Build</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedDistributionItem(item)}
                    className="min-h-[40px] sm:min-h-[34px] px-2.5 rounded-lg flex items-center gap-1.5 text-sky-300 hover:bg-sky-500/10 font-semibold cursor-pointer transition-colors"
                  >
                    <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>View Curve</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleSimulatePull(item)}
                  className="min-h-[40px] sm:min-h-[34px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1a1e2e] hover:bg-[#252b42] text-zinc-100 border border-[#323954] cursor-pointer transition-colors text-xs font-semibold ml-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" aria-hidden="true" />
                  <span>Simulate Pull</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {recommendations.length > 12 && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="min-h-[44px] sm:min-h-[38px] px-5 py-2.5 rounded-xl bg-[#161a29] hover:bg-[#22283d] text-zinc-100 border border-[#323954] text-xs font-semibold cursor-pointer transition-colors shadow-sm"
          >
            {showAll ? 'Show Top 12 Targets' : `View All ${recommendations.length} Targets`}
          </button>
        </div>
      )}

      {recommendations.length === 0 && (
        <div
          role="status"
          className="bg-[#121420] border border-[#24293d] rounded-2xl p-8 text-center space-y-3"
        >
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-300" aria-hidden="true" />
          <p className="font-semibold text-zinc-100">
            All targets in this banner phase are already maxed out!
          </p>
          <p className="text-xs text-zinc-300">
            Switch to All-Target Sandbox to evaluate upcoming meta characters, constellations, and signatures.
          </p>
          <button
            type="button"
            onClick={() => setBannerFilter('sandbox')}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e5c14d] text-[#0a0b0e] text-xs font-bold transition-colors cursor-pointer"
          >
            Open All-Target Sandbox
          </button>
        </div>
      )}

      {/* Character Details Modal */}
      <LazyCharacterDetailModal
        character={selectedCharacter}
        onClose={() => setSelectedCharacter(null)}
        isOwned={selectedCharacter ? Boolean(effectiveProfiles[selectedCharacter.id]) : false}
      />

      {/* Probability Distribution Modal */}
      {selectedDistributionItem && (
        <Suspense fallback={null}>
          <LazyPullDistributionModal
            item={selectedDistributionItem}
            onClose={() => setSelectedDistributionItem(null)}
            pullsAvailable={selectedDistributionItem?.odds.pullsAvailable}
            budget={budget}
            bannerFilter={bannerFilter}
          />
        </Suspense>
      )}

      {/* Gacha Assumptions & Methodology Modal */}
      {isAssumptionsOpen && (
        <Suspense fallback={null}>
          <LazyGachaAssumptionsModal
            isOpen={isAssumptionsOpen}
            onClose={() => setIsAssumptionsOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
};
