import React, { useState, useMemo, useEffect, useTransition } from 'react';
import type { Character, AbyssDualTeamPlan, OwnedCharacterProfile } from '../types/genshin';
import { solveAbyssDualTeams, swapAbyssDualHalves } from '../engines/abyss-solver';
import { dispatchSolveAbyss } from '../services/solver-dispatcher';
import {
  ABYSS_CYCLES,
  type AbyssCycleConfig,
  type AbyssChamberConfig,
  createCustomSandboxCycle,
} from '../data/abyss-schedules';
import type { ShieldType } from '../engines/combat-mechanics';
import {
  getSavedAbyssCycleId,
  saveAbyssCycleId,
  getSavedCustomAbyss,
  saveCustomAbyss,
} from '../services/storage';
import { CharacterPortrait } from './CharacterPortrait';
import { LazyCharacterDetailModal } from './LazyCharacterDetailModal';
import { RotationBadgeList } from './RotationBadgeList';
import { InfoTooltip } from './InfoTooltip';
import {
  Swords,
  ShieldCheck,
  ShieldAlert,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  AlertTriangle,
  ArrowLeftRight,
  Sliders,
  RotateCcw,
  Gauge,
} from 'lucide-react';

interface AbyssDualTeamViewProps {
  ownedIds: string[];
  profiles?: Record<string, OwnedCharacterProfile>;
}

const ELEMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Pyro: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  Hydro: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  Anemo: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  Electro: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  Dendro: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Cryo: { bg: 'bg-cyan-500/10', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  Geo: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
};

export const AbyssDualTeamView: React.FC<AbyssDualTeamViewProps> = ({
  ownedIds,
  profiles,
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [expandedRotationA, setExpandedRotationA] = useState<boolean>(true);
  const [expandedRotationB, setExpandedRotationB] = useState<boolean>(true);
  const [selectedCycleId, setSelectedCycleId] = useState<string>(() => getSavedAbyssCycleId());
  const [customCycle, setCustomCycle] = useState<AbyssCycleConfig>(() => getSavedCustomAbyss());
  const [showSandboxEditor, setShowSandboxEditor] = useState<boolean>(false);
  const [isSwapped, setIsSwapped] = useState<boolean>(false);

  // Active Cycle
  const activeCycle: AbyssCycleConfig = useMemo(() => {
    if (selectedCycleId === 'custom-sandbox') {
      return customCycle;
    }
    const found = ABYSS_CYCLES.find((c) => c.id === selectedCycleId);
    return found || ABYSS_CYCLES[0];
  }, [selectedCycleId, customCycle]);

  // Handle cycle selection
  const handleSelectCycle = (cycleId: string) => {
    setSelectedCycleId(cycleId);
    saveAbyssCycleId(cycleId);
    if (cycleId === 'custom-sandbox') {
      setShowSandboxEditor(true);
    }
  };

  // Base plan before swap with Web Worker offloading & useTransition
  const [basePlan, setBasePlan] = useState<AbyssDualTeamPlan>(() =>
    solveAbyssDualTeams(ownedIds, profiles, activeCycle),
  );
  const [, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;
    dispatchSolveAbyss(ownedIds, profiles, activeCycle).then((newPlan) => {
      if (isMounted) {
        startTransition(() => {
          setBasePlan(newPlan);
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [ownedIds, profiles, activeCycle]);

  // Effective plan accounting for 1-click swap
  const plan: AbyssDualTeamPlan = useMemo(() => {
    if (!isSwapped) return basePlan;
    return swapAbyssDualHalves(basePlan, activeCycle);
  }, [basePlan, isSwapped, activeCycle]);

  const teamA = plan.firstHalfTeam;
  const teamB = plan.secondHalfTeam;

  // Custom sandbox editing handlers
  const handleUpdateSandboxHalf = (
    chamberNum: number,
    half: 'firstHalf' | 'secondHalf',
    updater: (prev: AbyssChamberConfig[typeof half]) => AbyssChamberConfig[typeof half],
  ) => {
    setCustomCycle((prev) => {
      const updatedChambers = prev.chambers.map((ch) => {
        if (ch.chamber !== chamberNum) return ch;
        return {
          ...ch,
          [half]: updater(ch[half]),
        };
      });
      const updated: AbyssCycleConfig = { ...prev, chambers: updatedChambers };
      saveCustomAbyss(updated);
      return updated;
    });
  };

  const handleResetSandbox = () => {
    const fresh = createCustomSandboxCycle();
    setCustomCycle(fresh);
    saveCustomAbyss(fresh);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#141624] via-[#1a1e32] to-[#141624] p-6 rounded-2xl border border-[#262c44] shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#d4af37] text-xs font-bold tracking-wider uppercase mb-1">
              <Swords className="w-4 h-4" />
              <span>Endgame Guidance 2.0 · 0-Overlap Dual Half Matcher</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 font-serif">
              Spiral Abyss Floor 12 Deployment
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Unified solver with exact KeqingMains Piecewise Resistance shred calculations, live Elemental Gauge Unit (GU) shield-break estimators, and 1-click half swapping.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Cycle Selector Dropdown */}
            <div className="flex items-center gap-2 bg-[#121422] px-3 py-1.5 rounded-xl border border-[#2b3353]">
              <span className="text-xs text-zinc-400 font-semibold">Abyss Cycle:</span>
              <select
                value={selectedCycleId}
                onChange={(e) => handleSelectCycle(e.target.value)}
                className="bg-[#181c2e] text-xs font-bold text-[#d4af37] border border-[#353d63] rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#d4af37] cursor-pointer"
              >
                <optgroup label="Active Floor 12 (Version 7.x)">
                  {ABYSS_CYCLES.filter((c) => c.version.startsWith('7.')).map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#141624] text-[#d4af37]">
                      ⭐ [v{c.version}] {c.phase}: {c.name.split(':')[1]?.trim() || c.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Historical Archive (Version 5.x)">
                  {ABYSS_CYCLES.filter((c) => !c.version.startsWith('7.')).map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#141624] text-zinc-300">
                      [v{c.version}] {c.phase}: {c.name.split(':')[1]?.trim() || c.name}
                    </option>
                  ))}
                </optgroup>
                <option value="custom-sandbox" className="bg-[#141624] text-amber-300 font-bold">
                  ⚡ Custom Sandbox
                </option>
              </select>
            </div>

            {/* 1-Click Swap Halves Toggle */}
            <button
              type="button"
              onClick={() => setIsSwapped((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isSwapped
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                  : 'bg-[#121422] text-zinc-300 border-[#2b3353] hover:text-[#d4af37] hover:border-[#d4af37]/50'
              }`}
              title="Instantly swap Team 1 and Team 2 positions with zero character duplicates"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{isSwapped ? 'Swapped Halves' : 'Swap Halves'}</span>
            </button>

            {/* Mechanic Coverage Score Badge */}
            <div className="flex items-center gap-2 bg-[#121422] px-3.5 py-1.5 rounded-xl border border-[#2b3353]">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <div className="text-xs flex items-center gap-1.5">
                <span className="text-zinc-400 flex items-center gap-1">
                  <span>Mechanic Coverage:</span>
                  <InfoTooltip
                    title="Mechanic Coverage Score"
                    content="Composite score evaluating elemental shield breaks, enemy mechanics counter-picks, Arkhe alignment, and blessing synergies across both Spiral Abyss halves."
                    align="right"
                  />
                </span>
                <span className="font-bold text-[#d4af37]">
                  {plan.mechanicCoverageScore ?? plan.overallScore} Pts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Cycle Blessing Banner */}
        <div className="mt-4 pt-3 border-t border-[#1e2338] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Blessing of the Abyssal Moon:</span>
            <span>{activeCycle.buffDescription}</span>
          </div>
          {selectedCycleId === 'custom-sandbox' && (
            <button
              type="button"
              onClick={() => setShowSandboxEditor(!showSandboxEditor)}
              className="flex items-center gap-1.5 bg-[#1a1e32] hover:bg-[#252c48] text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showSandboxEditor ? 'Hide Sandbox Editor' : 'Configure Sandbox Chambers'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Sandbox Editor (Collapsible) */}
      {selectedCycleId === 'custom-sandbox' && showSandboxEditor && (
        <div className="bg-[#10121d] border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#21273e] pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                Interactive Sandbox Chamber Configurator
              </h2>
            </div>
            <button
              type="button"
              onClick={handleResetSandbox}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to 5.3 Baseline</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {customCycle.chambers.map((ch) => (
              <div key={ch.chamber} className="bg-[#151827] border border-[#232a44] p-3.5 rounded-xl space-y-3">
                <div className="text-xs font-bold text-[#d4af37] border-b border-[#1d2238] pb-1.5">
                  Chamber 12-{ch.chamber}
                </div>

                {/* First Half Editor */}
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-sky-400">First Half:</div>
                  <input
                    type="text"
                    value={ch.firstHalf.enemies[0]?.name || ''}
                    onChange={(e) =>
                      handleUpdateSandboxHalf(ch.chamber, 'firstHalf', (prev) => {
                        const first = prev.enemies[0] || {
                          id: `custom-enemy-${ch.chamber}-1`,
                          name: '',
                          level: 95,
                          hp: 1500000,
                          baseRes: { Pyro: 10, Hydro: 10, Anemo: 10, Electro: 10, Dendro: 10, Cryo: 10, Geo: 10, Physical: 10 },
                        };
                        return {
                          ...prev,
                          enemies: [{ ...first, name: e.target.value }, ...prev.enemies.slice(1)],
                        };
                      })
                    }
                    placeholder="Enemy Name"
                    className="w-full bg-[#0d0f1a] border border-[#2b3353] rounded px-2 py-1 text-zinc-200 text-xs"
                  />
                  <div className="flex gap-2">
                    <select
                      value={ch.firstHalf.mechanics.shieldType || ''}
                      onChange={(e) =>
                        handleUpdateSandboxHalf(ch.chamber, 'firstHalf', (prev) => ({
                          ...prev,
                          mechanics: {
                            ...prev.mechanics,
                            shieldType: (e.target.value || undefined) as ShieldType | undefined,
                            shieldUnits: prev.mechanics.shieldUnits ?? 36,
                          },
                        }))
                      }
                      className="bg-[#0d0f1a] border border-[#2b3353] rounded px-2 py-1 text-zinc-300 text-[11px] flex-1"
                    >
                      <option value="">No Shield</option>
                      <option value="Pyro">Pyro Shield</option>
                      <option value="Hydro">Hydro Shield</option>
                      <option value="Cryo">Cryo Shield</option>
                      <option value="Electro">Electro Shield</option>
                      <option value="Geo">Geo Shield</option>
                      <option value="Nightspirit">Nightspirit Ward</option>
                      <option value="Phlogiston">Phlogiston Barrier</option>
                    </select>
                    {ch.firstHalf.mechanics.shieldType && (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={ch.firstHalf.mechanics.shieldUnits ?? 36}
                        onChange={(e) =>
                          handleUpdateSandboxHalf(ch.chamber, 'firstHalf', (prev) => ({
                            ...prev,
                            mechanics: {
                              ...prev.mechanics,
                              shieldUnits: Math.max(0, parseInt(e.target.value, 10) || 0),
                            },
                          }))
                        }
                        className="w-14 bg-[#0d0f1a] border border-[#2b3353] rounded px-1.5 py-1 text-zinc-200 text-xs font-mono"
                        title="Gauge Units (GU)"
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-zinc-400">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!ch.firstHalf.mechanics.favorsNightsoul}
                        onChange={(e) =>
                          handleUpdateSandboxHalf(ch.chamber, 'firstHalf', (prev) => ({
                            ...prev,
                            mechanics: { ...prev.mechanics, favorsNightsoul: e.target.checked },
                          }))
                        }
                      />
                      <span>Nightsoul</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!ch.firstHalf.mechanics.favorsAoE}
                        onChange={(e) =>
                          handleUpdateSandboxHalf(ch.chamber, 'firstHalf', (prev) => ({
                            ...prev,
                            mechanics: { ...prev.mechanics, favorsAoE: e.target.checked },
                          }))
                        }
                      />
                      <span>AoE</span>
                    </label>
                  </div>
                </div>

                {/* Second Half Editor */}
                <div className="space-y-1.5 text-xs pt-2 border-t border-[#1d2238]">
                  <div className="font-semibold text-amber-400">Second Half:</div>
                  <input
                    type="text"
                    value={ch.secondHalf.enemies[0]?.name || ''}
                    onChange={(e) =>
                      handleUpdateSandboxHalf(ch.chamber, 'secondHalf', (prev) => {
                        const first = prev.enemies[0] || {
                          id: `custom-enemy-${ch.chamber}-2`,
                          name: '',
                          level: 95,
                          hp: 1500000,
                          baseRes: { Pyro: 10, Hydro: 10, Anemo: 10, Electro: 10, Dendro: 10, Cryo: 10, Geo: 10, Physical: 10 },
                        };
                        return {
                          ...prev,
                          enemies: [{ ...first, name: e.target.value }, ...prev.enemies.slice(1)],
                        };
                      })
                    }
                    placeholder="Enemy Name"
                    className="w-full bg-[#0d0f1a] border border-[#2b3353] rounded px-2 py-1 text-zinc-200 text-xs"
                  />
                  <div className="flex gap-2">
                    <select
                      value={ch.secondHalf.mechanics.shieldType || ''}
                      onChange={(e) =>
                        handleUpdateSandboxHalf(ch.chamber, 'secondHalf', (prev) => ({
                          ...prev,
                          mechanics: {
                            ...prev.mechanics,
                            shieldType: (e.target.value || undefined) as ShieldType | undefined,
                            shieldUnits: prev.mechanics.shieldUnits ?? 36,
                          },
                        }))
                      }
                      className="bg-[#0d0f1a] border border-[#2b3353] rounded px-2 py-1 text-zinc-300 text-[11px] flex-1"
                    >
                      <option value="">No Shield</option>
                      <option value="Pyro">Pyro Shield</option>
                      <option value="Hydro">Hydro Shield</option>
                      <option value="Cryo">Cryo Shield</option>
                      <option value="Electro">Electro Shield</option>
                      <option value="Geo">Geo Shield</option>
                      <option value="Nightspirit">Nightspirit Ward</option>
                      <option value="Phlogiston">Phlogiston Barrier</option>
                    </select>
                    {ch.secondHalf.mechanics.shieldType && (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={ch.secondHalf.mechanics.shieldUnits ?? 36}
                        onChange={(e) =>
                          handleUpdateSandboxHalf(ch.chamber, 'secondHalf', (prev) => ({
                            ...prev,
                            mechanics: {
                              ...prev.mechanics,
                              shieldUnits: Math.max(0, parseInt(e.target.value, 10) || 0),
                            },
                          }))
                        }
                        className="w-14 bg-[#0d0f1a] border border-[#2b3353] rounded px-1.5 py-1 text-zinc-200 text-xs font-mono"
                        title="Gauge Units (GU)"
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-zinc-400">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!ch.secondHalf.mechanics.requiresBow}
                        onChange={(e) =>
                          handleUpdateSandboxHalf(ch.chamber, 'secondHalf', (prev) => ({
                            ...prev,
                            mechanics: { ...prev.mechanics, requiresBow: e.target.checked },
                          }))
                        }
                      />
                      <span>Bow Required</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!ch.secondHalf.mechanics.favorsNightsoul}
                        onChange={(e) =>
                          handleUpdateSandboxHalf(ch.chamber, 'secondHalf', (prev) => ({
                            ...prev,
                            mechanics: { ...prev.mechanics, favorsNightsoul: e.target.checked },
                          }))
                        }
                      />
                      <span>Nightsoul</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shortfall or Notice Banner */}
      {plan.warnings && plan.warnings.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-500/40 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-amber-300">Floor 12 Deployment Notice</div>
            {plan.warnings.map((w, idx) => (
              <div key={idx} className="text-zinc-300">
                {w}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chamber Clearance & Shield Breakdown Matrix */}
      <div className="bg-[#12141e] border border-[#22273d] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1c2134] pb-2.5">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#d4af37]" />
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              Floor 12 Chamber Clearance & Elemental Gauge Breakdown
            </h2>
          </div>
          <span className="text-[11px] text-zinc-400">
            {activeCycle.name}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {plan.chamberCoverage.map((cov) => {
            const chamberData = activeCycle.chambers.find((c) => c.chamber === cov.chamber);
            const firstEnemy = chamberData?.firstHalf.enemies[0];
            const secondEnemy = chamberData?.secondHalf.enemies[0];

            return (
              <div
                key={cov.chamber}
                className="bg-[#161928] border border-[#252c46] rounded-xl p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#21273e] pb-2">
                  <span className="text-xs font-bold text-[#d4af37]">
                    Chamber 12-{cov.chamber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      cov.firstHalfSatisfied && cov.secondHalfSatisfied
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {cov.firstHalfSatisfied && cov.secondHalfSatisfied
                      ? '100% Cleared'
                      : 'Partial Coverage'}
                  </span>
                </div>

                {/* First Half Breakdown */}
                <div className="text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      {cov.firstHalfSatisfied ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <span className="text-sky-300">First Half:</span>
                    </div>
                    {firstEnemy && (
                      <span className="text-[10px] text-zinc-400 truncate max-w-[150px]">
                        {firstEnemy.name} (Lv.{firstEnemy.level})
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-300 pl-4 leading-snug">
                    {cov.firstHalfStatus}
                  </p>

                  {/* Shield Gauge Bar & RES Shred Metrics for First Half */}
                  {cov.firstHalfMetrics && (
                    <div className="pl-4 space-y-1.5 pt-1">
                      {cov.firstHalfMetrics.shieldBreakTime !== undefined && (
                        <div className="bg-[#0f111c] p-2 rounded-lg border border-[#1f263d] space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-zinc-400 flex items-center gap-1 font-semibold">
                              <Gauge className="w-3 h-3 text-sky-400" />
                              <span>Shield Break Time:</span>
                            </span>
                            <span
                              className={`font-bold font-mono px-1.5 py-0.2 rounded ${
                                cov.firstHalfMetrics.shieldBreakRating === 'Fast'
                                  ? 'text-emerald-300 bg-emerald-950/60'
                                  : cov.firstHalfMetrics.shieldBreakRating === 'Medium'
                                  ? 'text-sky-300 bg-sky-950/60'
                                  : cov.firstHalfMetrics.shieldBreakRating === 'Slow'
                                  ? 'text-amber-300 bg-amber-950/60'
                                  : 'text-rose-300 bg-rose-950/60'
                              }`}
                            >
                              ⚡ {cov.firstHalfMetrics.shieldBreakRating === 'Ineffective'
                                ? '∞ (Ineffective)'
                                : `${cov.firstHalfMetrics.shieldBreakTime}s (${cov.firstHalfMetrics.shieldBreakRating})`}
                            </span>
                          </div>
                          {cov.firstHalfMetrics.shieldBreakBreakdown && (
                            <div className="text-[9px] text-zinc-400 truncate">
                              {cov.firstHalfMetrics.shieldBreakBreakdown}
                            </div>
                          )}
                        </div>
                      )}

                      {cov.firstHalfMetrics.effectiveResShred !== undefined && cov.firstHalfMetrics.effectiveResShred > 0 && (
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span>Team RES Shred:</span>
                          <span className="text-emerald-400 font-bold font-mono">
                            -{cov.firstHalfMetrics.effectiveResShred}% ({cov.firstHalfMetrics.effectiveDmgMultiplier}x DMG)
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Second Half Breakdown */}
                <div className="text-xs space-y-2 pt-2 border-t border-[#1d2236]">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      {cov.secondHalfSatisfied ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <span className="text-amber-300">Second Half:</span>
                    </div>
                    {secondEnemy && (
                      <span className="text-[10px] text-zinc-400 truncate max-w-[150px]">
                        {secondEnemy.name} (Lv.{secondEnemy.level})
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-300 pl-4 leading-snug">
                    {cov.secondHalfStatus}
                  </p>

                  {/* Shield Gauge Bar & RES Shred Metrics for Second Half */}
                  {cov.secondHalfMetrics && (
                    <div className="pl-4 space-y-1.5 pt-1">
                      {cov.secondHalfMetrics.shieldBreakTime !== undefined && (
                        <div className="bg-[#0f111c] p-2 rounded-lg border border-[#1f263d] space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-zinc-400 flex items-center gap-1 font-semibold">
                              <Gauge className="w-3 h-3 text-amber-400" />
                              <span>Shield Break Time:</span>
                            </span>
                            <span
                              className={`font-bold font-mono px-1.5 py-0.2 rounded ${
                                cov.secondHalfMetrics.shieldBreakRating === 'Fast'
                                  ? 'text-emerald-300 bg-emerald-950/60'
                                  : cov.secondHalfMetrics.shieldBreakRating === 'Medium'
                                  ? 'text-sky-300 bg-sky-950/60'
                                  : cov.secondHalfMetrics.shieldBreakRating === 'Slow'
                                  ? 'text-amber-300 bg-amber-950/60'
                                  : 'text-rose-300 bg-rose-950/60'
                              }`}
                            >
                              ⚡ {cov.secondHalfMetrics.shieldBreakRating === 'Ineffective'
                                ? '∞ (Ineffective)'
                                : `${cov.secondHalfMetrics.shieldBreakTime}s (${cov.secondHalfMetrics.shieldBreakRating})`}
                            </span>
                          </div>
                          {cov.secondHalfMetrics.shieldBreakBreakdown && (
                            <div className="text-[9px] text-zinc-400 truncate">
                              {cov.secondHalfMetrics.shieldBreakBreakdown}
                            </div>
                          )}
                        </div>
                      )}

                      {cov.secondHalfMetrics.effectiveResShred !== undefined && cov.secondHalfMetrics.effectiveResShred > 0 && (
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span>Team RES Shred:</span>
                          <span className="text-emerald-400 font-bold font-mono">
                            -{cov.secondHalfMetrics.effectiveResShred}% ({cov.secondHalfMetrics.effectiveDmgMultiplier}x DMG)
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dual Side-by-Side Team Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team 1: First Half */}
        <div className="bg-[#12141f] border border-[#232942] rounded-2xl p-5 space-y-4 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#21273e] pb-3">
              <div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                  First Half Vanguard (12-1-A · 12-2-A · 12-3-A)
                </span>
                <h3 className="text-base font-bold text-zinc-100 font-serif mt-0.5">
                  {teamA.name}
                </h3>
                <span className="text-xs bg-[#191d2d] text-[#d4af37] px-2 py-0.5 rounded-md border border-[#d4af37]/20 font-medium inline-block mt-1">
                  {teamA.archetype}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-[#181c2c] px-2.5 py-1.5 rounded-xl border border-[#28314e] text-center">
                  <div className="text-[9px] text-zinc-400 font-semibold uppercase">Synergy</div>
                  <div className="text-xs font-bold text-amber-300">{teamA.synergyScore}/100</div>
                </div>
                <div className="bg-[#181c2c] px-2.5 py-1.5 rounded-xl border border-[#28314e] text-center">
                  <div className="text-[9px] text-zinc-400 font-semibold uppercase">Comfort</div>
                  <div className="text-xs font-bold text-emerald-300">{teamA.comfortScore}/100</div>
                </div>
              </div>
            </div>

            {/* 4 Character Slots */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[0, 1, 2, 3].map((slotIdx) => {
                const member = teamA.members[slotIdx];
                if (member) {
                  const color = ELEMENT_COLORS[member.element] || {
                    bg: 'bg-zinc-800',
                    text: 'text-zinc-200',
                    border: 'border-zinc-700',
                  };
                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedCharacter(member)}
                      className={`bg-[#161928] border ${color.border} hover:border-[#d4af37] rounded-xl p-2.5 flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-150 group`}
                      title="Click to view details"
                    >
                      <CharacterPortrait
                        src={member.icon}
                        name={member.name}
                        element={member.element}
                        rarity={member.rarity}
                        size="sm"
                      />
                      <div className="text-xs font-bold text-zinc-100 truncate w-full text-center">
                        {member.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        {member.weapon} · {member.roles[0]}
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={`empty-a-${slotIdx}`}
                    className="bg-[#0f111c] border border-dashed border-[#232943] rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 text-center min-h-[110px]"
                  >
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Slot {slotIdx + 1}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">Unassigned</span>
                  </div>
                );
              })}
            </div>

            {/* Stepped Rotation Accordion */}
            {teamA.steppedRotation && teamA.steppedRotation.steps.length > 0 && (
              <div className="bg-[#0e1018] rounded-xl border border-[#1b2032] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedRotationA(!expandedRotationA)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Stepped Combat Rotation</span>
                    <span className="text-[10px] font-mono text-[#d4af37] bg-[#16192b] px-2 py-0.5 rounded border border-[#d4af37]/20">
                      ~{teamA.steppedRotation.totalCycleTime}s Cycle
                    </span>
                  </div>
                  {expandedRotationA ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {expandedRotationA && (
                  <div className="p-3 border-t border-[#1b2032] space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {teamA.steppedRotation.steps.map((step) => (
                        <div
                          key={step.stepNumber}
                          className="bg-[#131624] border border-[#22283e] p-2 rounded-lg flex flex-col justify-between gap-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <CharacterPortrait
                                src={step.icon}
                                name={step.characterName}
                                element={step.element}
                                size="xs"
                              />
                              <span className="text-xs font-bold text-zinc-200 truncate">
                                {step.characterName}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-zinc-400 bg-[#191d2d] px-1 py-0.5 rounded">
                              ~{step.fieldTime}s
                            </span>
                          </div>
                          <div className="bg-[#0a0c14] p-1 rounded border border-[#171a2b]">
                            <RotationBadgeList actions={step.actions} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Team 2: Second Half */}
        <div className="bg-[#12141f] border border-[#232942] rounded-2xl p-5 space-y-4 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#21273e] pb-3">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Second Half Rearguard (12-1-B · 12-2-B · 12-3-B)
                </span>
                <h3 className="text-base font-bold text-zinc-100 font-serif mt-0.5">
                  {teamB.name}
                </h3>
                <span className="text-xs bg-[#191d2d] text-[#d4af37] px-2 py-0.5 rounded-md border border-[#d4af37]/20 font-medium inline-block mt-1">
                  {teamB.archetype}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-[#181c2c] px-2.5 py-1.5 rounded-xl border border-[#28314e] text-center">
                  <div className="text-[9px] text-zinc-400 font-semibold uppercase">Synergy</div>
                  <div className="text-xs font-bold text-amber-300">{teamB.synergyScore}/100</div>
                </div>
                <div className="bg-[#181c2c] px-2.5 py-1.5 rounded-xl border border-[#28314e] text-center">
                  <div className="text-[9px] text-zinc-400 font-semibold uppercase">Comfort</div>
                  <div className="text-xs font-bold text-emerald-300">{teamB.comfortScore}/100</div>
                </div>
              </div>
            </div>

            {/* 4 Character Slots */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[0, 1, 2, 3].map((slotIdx) => {
                const member = teamB.members[slotIdx];
                if (member) {
                  const color = ELEMENT_COLORS[member.element] || {
                    bg: 'bg-zinc-800',
                    text: 'text-zinc-200',
                    border: 'border-zinc-700',
                  };
                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedCharacter(member)}
                      className={`bg-[#161928] border ${color.border} hover:border-[#d4af37] rounded-xl p-2.5 flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-150 group`}
                      title="Click to view details"
                    >
                      <CharacterPortrait
                        src={member.icon}
                        name={member.name}
                        element={member.element}
                        rarity={member.rarity}
                        size="sm"
                      />
                      <div className="text-xs font-bold text-zinc-100 truncate w-full text-center">
                        {member.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        {member.weapon} · {member.roles[0]}
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={`empty-b-${slotIdx}`}
                    className="bg-[#0f111c] border border-dashed border-[#232943] rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 text-center min-h-[110px]"
                  >
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Slot {slotIdx + 1}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">Unassigned</span>
                  </div>
                );
              })}
            </div>

            {/* Stepped Rotation Accordion */}
            {teamB.steppedRotation && teamB.steppedRotation.steps.length > 0 && (
              <div className="bg-[#0e1018] rounded-xl border border-[#1b2032] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedRotationB(!expandedRotationB)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Stepped Combat Rotation</span>
                    <span className="text-[10px] font-mono text-[#d4af37] bg-[#16192b] px-2 py-0.5 rounded border border-[#d4af37]/20">
                      ~{teamB.steppedRotation.totalCycleTime}s Cycle
                    </span>
                  </div>
                  {expandedRotationB ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {expandedRotationB && (
                  <div className="p-3 border-t border-[#1b2032] space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {teamB.steppedRotation.steps.map((step) => (
                        <div
                          key={step.stepNumber}
                          className="bg-[#131624] border border-[#22283e] p-2 rounded-lg flex flex-col justify-between gap-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <CharacterPortrait
                                src={step.icon}
                                name={step.characterName}
                                element={step.element}
                                size="xs"
                              />
                              <span className="text-xs font-bold text-zinc-200 truncate">
                                {step.characterName}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-zinc-400 bg-[#191d2d] px-1 py-0.5 rounded">
                              ~{step.fieldTime}s
                            </span>
                          </div>
                          <div className="bg-[#0a0c14] p-1 rounded border border-[#171a2b]">
                            <RotationBadgeList actions={step.actions} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Character Detail Modal */}
      {selectedCharacter && (
        <LazyCharacterDetailModal
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          isOwned={ownedIds.includes(selectedCharacter.id)}
          profile={profiles ? profiles[selectedCharacter.id] : undefined}
          onSelectCharacter={setSelectedCharacter}
        />
      )}
    </div>
  );
};
