import React, { useState, useMemo, useRef } from 'react';
import type {
  Character,
  EnhancedPullAdvice,
  OwnedCharacterProfile,
  OwnedWeapon,
  PullBudgetState,
} from '../types/genshin';
import { evaluateComprehensivePullROI } from '../engines/pull-advisor';
import { BANNER_PHASES } from '../data/banners';
import { CHARACTERS } from '../data/characters';
import { getWeaponByKey } from '../data/weapons';
import { getSavedPullBudget, savePullBudget } from '../services/storage';
import { CharacterDetailModal } from './CharacterDetailModal';
import { CharacterPortrait } from './CharacterPortrait';
import { PullBudgetCard } from './PullBudgetCard';
import { InfoTooltip } from './InfoTooltip';
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
  const [bannerFilter, setBannerFilter] = useState<string>('banner_7_2_phase_1');
  const [budget, setBudget] = useState<PullBudgetState>(() => getSavedPullBudget());
  const [simulationToast, setSimulationToast] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync budget changes with persistent localStorage
  const handleBudgetChange = (newBudget: PullBudgetState) => {
    setBudget(newBudget);
    savePullBudget(newBudget);
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

  const recommendations = useMemo(() => {
    return evaluateComprehensivePullROI(
      effectiveProfiles,
      effectiveWeapons,
      budget,
      bannerFilter,
    );
  }, [effectiveProfiles, effectiveWeapons, budget, bannerFilter]);

  const displayedRecommendations = showAll
    ? recommendations
    : recommendations.slice(0, 12);

  const tierColors: Record<EnhancedPullAdvice['tier'], string> = {
    'Must Pull': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    'High Value': 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    'Situational': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    'Skip / Redundant': 'bg-zinc-800 text-zinc-400 border-zinc-700',
  };

  const targetTypeBadge = (item: EnhancedPullAdvice) => {
    if (item.targetType === 'C0_Character') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          C0 New Character
        </span>
      );
    }
    if (item.targetType === 'Constellation') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
          {item.targetLevelText}
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
        R1 Signature Weapon
      </span>
    );
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
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Simulation Feedback Toast */}
      {simulationToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161a29] border border-[#d4af37]/60 text-zinc-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in text-sm font-medium">
          <Sparkles className="w-4 h-4 text-[#d4af37]" />
          <span>{simulationToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#141624] via-[#1a1e32] to-[#141624] p-6 rounded-2xl border border-[#262c44] shadow-lg">
        <div className="flex items-center gap-2 text-[#d4af37] text-xs font-bold tracking-wider uppercase mb-1">
          <Compass className="w-4 h-4" />
          <span>Account-Aware Pull Advisor v2</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100 font-serif">
          Who Should You Pull Next?
        </h1>
        <p className="text-sm text-zinc-400 mt-1 max-w-3xl">
          Calculates marginal team DPS uplift and archetype unlocking ROI for C0 new unlocks, high-impact constellations, and signature weapons. Powered by exact 5.x gacha math with Capturing Radiance (~55% win rate) and 5.0 1 Fate Point guarantee rules.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-[#10121b] text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Owned C0 units are never recommended for C0</span>
          </div>
          <div className="flex items-center gap-2 bg-[#10121b] text-purple-400 px-3 py-1.5 rounded-xl border border-purple-500/20">
            <Target className="w-4 h-4 shrink-0" />
            <span>Spikes evaluated for owned characters (C1–C6 ceiling)</span>
          </div>
        </div>
      </div>

      {/* Interactive Budget Tracker Card */}
      <PullBudgetCard budget={budget} onChangeBudget={handleBudgetChange} />

      {/* Banner Phase Selector & Mode Switcher */}
      <div className="bg-[#12141d] border border-[#23273a] rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
          <Calendar className="w-4 h-4 text-[#d4af37]" />
          <span>Banner Phase Filter:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {BANNER_PHASES.map((phase) => (
            <button
              key={phase.id}
              onClick={() => setBannerFilter(phase.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                bannerFilter === phase.id
                  ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]'
                  : 'bg-[#161926] border-[#292f44] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {phase.phaseName}
            </button>
          ))}
          <button
            onClick={() => setBannerFilter('sandbox')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
              bannerFilter === 'sandbox' || bannerFilter === 'all'
                ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                : 'bg-[#161926] border-[#292f44] text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All-Target Sandbox
          </button>
        </div>
      </div>

      {/* Target Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {displayedRecommendations.map((item, idx) => {
          const char = CHARACTERS.find((c) => c.id === item.characterId);
          const dbWeapon = item.weaponKey
            ? getWeaponByKey(item.weaponKey)
            : item.targetType === 'Signature_Weapon'
              ? getWeaponByKey(item.name)
              : undefined;

          // Probability styling
          const probPct = (item.odds.cumulativeProbability * 100).toFixed(1);
          let probColor = 'bg-rose-950/40 text-rose-300 border-rose-500/40';
          if (item.odds.cumulativeProbability >= 0.8) {
            probColor = 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40';
          } else if (item.odds.cumulativeProbability >= 0.45) {
            probColor = 'bg-amber-950/40 text-amber-300 border-amber-500/40';
          }

          return (
            <div
              key={item.id}
              className="bg-[#12141d] border border-[#23273a] hover:border-[#d4af37]/50 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 border-b border-[#1f2334] pb-3">
                  <div className="flex items-center gap-3">
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
                          className="border-[#2e354e]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#1b1f2e] border border-[#2e354e] flex items-center justify-center text-[#d4af37]">
                          <Shield className="w-6 h-6" />
                        </div>
                      )}
                      <div className="absolute -bottom-1.5 -left-1 bg-black/90 px-1.5 py-0.2 rounded text-[10px] font-bold text-[#d4af37] border border-[#d4af37]/40">
                        #{idx + 1}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-zinc-100 leading-tight">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {item.targetType === 'Signature_Weapon'
                          ? `${dbWeapon?.weaponType ? `5★ ${dbWeapon.weaponType}` : '5★ Weapon'} · BiS for ${char?.name ?? item.characterId}`
                          : `${char?.element || ''} · ${char?.weapon || ''} · ${char?.roles?.[0] || ''}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        tierColors[item.tier]
                      }`}
                    >
                      {item.tier}
                    </span>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <span>Account Value: {item.score}/100</span>
                      <InfoTooltip
                        title="Estimated Account Value"
                        content="Composite score (0-100) quantifying marginal DPS uplift, team archetype unlocks, and gacha pull probability."
                      />
                    </span>
                  </div>
                </div>

                {/* Target Level & Uplift Badges */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {targetTypeBadge(item)}

                  {item.teamDamageUpliftPct > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950/50 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      +{item.teamDamageUpliftPct}% Team DMG
                    </span>
                  )}

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${probColor}`}
                  >
                    {probPct}% Pull Chance
                  </span>
                </div>

                {/* Pull Economics Bar */}
                <div className="mt-3 bg-[#0d0f15] border border-[#1d2130] rounded-xl p-2.5 flex items-center justify-between text-xs text-zinc-400">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-zinc-500 block">Expected Cost:</span>
                    <span className="font-mono text-zinc-200 font-semibold">
                      ~{item.odds.expectedPulls} pulls
                    </span>
                  </div>

                  <div className="space-y-0.5 text-center">
                    <span className="text-[11px] text-zinc-500 block">Hard Guarantee:</span>
                    <span className="font-mono text-zinc-200 font-semibold">
                      {item.odds.guaranteedPulls} pulls
                    </span>
                  </div>

                  <div className="space-y-0.5 text-right">
                    <span className="text-[11px] text-zinc-500 block">Guarantee Deficit:</span>
                    {item.odds.primogemsNeeded === 0 ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1 justify-end">
                        <Check className="w-3.5 h-3.5" /> Covered!
                      </span>
                    ) : (
                      <span className="font-mono text-amber-400 font-semibold">
                        +{item.odds.primogemsNeeded.toLocaleString()} Primos
                      </span>
                    )}
                  </div>
                </div>

                {/* Unlocked Archetypes */}
                {item.unlockedArchetypes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.unlockedArchetypes.map((arch, aIdx) => (
                      <span
                        key={aIdx}
                        className="text-[11px] bg-[#1a1e30] text-sky-300 px-2 py-0.5 rounded border border-sky-500/20 font-medium"
                      >
                        ★ {arch}
                      </span>
                    ))}
                  </div>
                )}

                {/* Account Benefits */}
                <div className="mt-3 space-y-1.5 text-xs text-zinc-300">
                  {item.accountBenefits.map((b, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                {/* Caution */}
                {item.caution && (
                  <div className="mt-3 flex items-start gap-2 bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs p-2.5 rounded-xl">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>{item.caution}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                {char && (
                  <button
                    onClick={() => setSelectedCharacter(char)}
                    className="flex items-center gap-1 text-[#d4af37] hover:underline font-semibold cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>View Talents & Kit</span>
                  </button>
                )}

                <button
                  onClick={() => handleSimulatePull(item)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#191d2c] hover:bg-[#23293e] text-zinc-200 border border-[#2d344d] cursor-pointer transition-colors text-xs font-medium ml-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Simulate Pull</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {recommendations.length > 12 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-5 py-2.5 rounded-xl bg-[#161926] hover:bg-[#202538] text-zinc-300 hover:text-zinc-100 border border-[#2b334d] text-xs font-semibold cursor-pointer transition-colors shadow-sm"
          >
            {showAll ? 'Show Top 12 Targets' : `View All ${recommendations.length} Targets`}
          </button>
        </div>
      )}

      {recommendations.length === 0 && (
        <div className="bg-[#12141d] border border-[#23273a] rounded-2xl p-8 text-center text-zinc-400">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
          <p className="font-semibold text-zinc-200">All targets in this banner phase are already maxed out!</p>
          <p className="text-xs text-zinc-500 mt-1">Switch to All-Target Sandbox to view upcoming meta targets.</p>
        </div>
      )}

      {/* Character Details Modal */}
      <CharacterDetailModal
        character={selectedCharacter}
        onClose={() => setSelectedCharacter(null)}
        isOwned={selectedCharacter ? Boolean(effectiveProfiles[selectedCharacter.id]) : false}
      />
    </div>
  );
};
