import React, { useState, useMemo, useEffect, useTransition, useRef } from 'react';
import type {
  Character,
  AbyssDualTeamPlan,
  OwnedCharacterProfile,
  CharacterSwapAlternative,
} from '../types/genshin';
import { swapAbyssDualHalves } from '../engines/abyss-solver';
import { isSameCharacterOrTraveler } from '../engines/team-rules';
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
import { CHARACTERS } from '../data/characters';
import { RotationBadgeList } from './RotationBadgeList';
import { InfoTooltip } from './InfoTooltip';
import { DataFreshnessBadge, StaleDataWarningBanner } from './DataFreshnessBadge';
import { useModalAccessibility } from '../hooks/useModalAccessibility';
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
  X,
  Compass,
  CheckCircle2,
} from 'lucide-react';

interface AbyssDualTeamViewProps {
  ownedIds: string[];
  profiles?: Record<string, OwnedCharacterProfile>;
  selectedCycleId?: string;
  onSelectCycleId?: (cycleId: string) => void;
}

const ELEMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Pyro: { bg: 'bg-rose-500/10', text: 'text-rose-300', border: 'border-rose-400/35' },
  Hydro: { bg: 'bg-sky-500/10', text: 'text-sky-300', border: 'border-sky-400/35' },
  Anemo: { bg: 'bg-teal-500/10', text: 'text-teal-300', border: 'border-teal-400/35' },
  Electro: { bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-400/35' },
  Dendro: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-400/35' },
  Cryo: { bg: 'bg-cyan-500/10', text: 'text-cyan-200', border: 'border-cyan-400/35' },
  Geo: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-400/35' },
};

export const AbyssDualTeamView: React.FC<AbyssDualTeamViewProps> = ({
  ownedIds,
  profiles,
  selectedCycleId: propSelectedCycleId,
  onSelectCycleId,
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [expandedRotationA, setExpandedRotationA] = useState<boolean>(true);
  const [expandedRotationB, setExpandedRotationB] = useState<boolean>(true);
  const [localSelectedCycleId, setLocalSelectedCycleId] = useState<string>(() =>
    getSavedAbyssCycleId()
  );
  const selectedCycleId = propSelectedCycleId || localSelectedCycleId;
  const [customCycle, setCustomCycle] = useState<AbyssCycleConfig>(() => getSavedCustomAbyss());
  const [showSandboxEditor, setShowSandboxEditor] = useState<boolean>(false);
  const [isSwapped, setIsSwapped] = useState<boolean>(false);
  const [selectedPairIndex, setSelectedPairIndex] = useState<number>(0);
  const [drawerAlternative, setDrawerAlternative] = useState<{
    originalMember: Character;
    teamName: string;
    alternatives: CharacterSwapAlternative[];
    oppositeTeamMembers: Character[];
    oppositeTeamName: string;
  } | null>(null);

  const altDialogRef = useRef<HTMLDivElement>(null);
  const altCloseBtnRef = useRef<HTMLButtonElement>(null);

  useModalAccessibility({
    isOpen: Boolean(drawerAlternative),
    onClose: () => setDrawerAlternative(null),
    containerRef: altDialogRef,
    initialFocusRef: altCloseBtnRef,
  });

  // Active Cycle
  const activeCycle: AbyssCycleConfig = useMemo(() => {
    if (selectedCycleId === 'custom-sandbox') {
      return customCycle;
    }
    const found = ABYSS_CYCLES.find((c) => c.id === selectedCycleId);
    return found || ABYSS_CYCLES[0];
  }, [selectedCycleId, customCycle]);

  const handleSelectCycle = (cycleId: string) => {
    if (onSelectCycleId) {
      onSelectCycleId(cycleId);
    } else {
      setLocalSelectedCycleId(cycleId);
    }
    saveAbyssCycleId(cycleId);
    setIsSwapped(false);
    setSelectedPairIndex(0);
    if (cycleId === 'custom-sandbox') {
      setShowSandboxEditor(true);
    }
  };

  const [basePlan, setBasePlan] = useState<AbyssDualTeamPlan | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;
    dispatchSolveAbyss(ownedIds, profiles, activeCycle).then((newPlan) => {
      if (isMounted) {
        startTransition(() => {
          setBasePlan(newPlan);
          setIsSwapped(false);
          setSelectedPairIndex(0);
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [ownedIds, profiles, activeCycle]);

  const currentBase = useMemo(() => {
    if (!basePlan) return null;
    return isSwapped ? swapAbyssDualHalves(basePlan, activeCycle) : basePlan;
  }, [basePlan, isSwapped, activeCycle]);

  const plan: AbyssDualTeamPlan | null = useMemo(() => {
    if (!currentBase) return null;
    if (currentBase.allPairs && currentBase.allPairs[selectedPairIndex]) {
      return currentBase.allPairs[selectedPairIndex];
    }
    return currentBase;
  }, [currentBase, selectedPairIndex]);

  const displayedPairs = currentBase?.allPairs || basePlan?.allPairs || [];

  if (!plan) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-[#121420] border border-[#24293d] rounded-2xl p-8 text-center text-xs text-zinc-300"
      >
        Calculating optimal Spiral Abyss Floor 12 dual-half teams…
      </div>
    );
  }

  const teamA = plan.firstHalfTeam;
  const teamB = plan.secondHalfTeam;

  const handleUpdateSandboxHalf = (
    chamberNum: number,
    half: 'firstHalf' | 'secondHalf',
    updater: (prev: AbyssChamberConfig[typeof half]) => AbyssChamberConfig[typeof half]
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

  const renderHalfTeamCard = (
    halfKey: 'first' | 'second',
    team: AbyssDualTeamPlan['firstHalfTeam'],
    oppositeTeam: AbyssDualTeamPlan['firstHalfTeam'],
    isExpandedRotation: boolean,
    onToggleRotation: () => void
  ) => {
    const isFirst = halfKey === 'first';
    const halfLabel = isFirst
      ? 'First Half Vanguard (12-1-A · 12-2-A · 12-3-A)'
      : 'Second Half Rearguard (12-1-B · 12-2-B · 12-3-B)';
    const teamDisplayTitle = isFirst ? 'First Half Vanguard' : 'Second Half Rearguard';
    const oppositeDisplayTitle = isFirst ? 'Second Half Rearguard' : 'First Half Vanguard';
    const accentText = isFirst ? 'text-sky-300' : 'text-amber-300';
    const rotationPanelId = `abyss-rotation-${halfKey}`;
    const halfExplanation = isFirst ? plan.firstHalfExplanation : plan.secondHalfExplanation;

    return (
      <article className="bg-[#121420] border border-[#24293d] rounded-2xl p-5 space-y-4 shadow-md flex flex-col justify-between">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#202538] pb-3">
            <div>
              <span className={`text-xs font-bold ${accentText} uppercase tracking-wider block`}>
                {halfLabel}
              </span>
              <h3 className="text-base font-bold text-zinc-100 font-serif mt-0.5">{team.name}</h3>
              <span className="text-xs bg-[#191d2d] text-[#f3cf58] px-2 py-0.5 rounded-md border border-[#d4af37]/30 font-medium inline-block mt-1">
                {team.archetype}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-[#161a29] px-2.5 py-1.5 rounded-xl border border-[#2c334d] text-center">
                <div className="text-[11px] text-zinc-300 font-semibold uppercase">Synergy</div>
                <div className="text-xs font-bold text-amber-200 tabular-nums">
                  {team.synergyScore}/100
                </div>
              </div>
              <div className="bg-[#161a29] px-2.5 py-1.5 rounded-xl border border-[#2c334d] text-center">
                <div className="text-[11px] text-zinc-300 font-semibold uppercase">Comfort</div>
                <div className="text-xs font-bold text-emerald-200 tabular-nums">
                  {team.comfortScore}/100
                </div>
              </div>
            </div>
          </div>

          {/* 4 Character Slots (sibling buttons — no nested interactive controls) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[0, 1, 2, 3].map((slotIdx) => {
              const member = team.members[slotIdx];
              if (member) {
                const color = ELEMENT_COLORS[member.element] || {
                  bg: 'bg-[#181c2b]',
                  text: 'text-zinc-200',
                  border: 'border-[#323954]',
                };
                const memberAlts =
                  team.explanation?.alternatives?.filter(
                    (alt) => alt.originalCharacterId === member.id
                  ) ?? [];

                return (
                  <div
                    key={member.id}
                    className={`bg-[#161928] border ${color.border} hover:border-[#d4af37]/75 rounded-xl p-2.5 flex flex-col justify-between items-center gap-1.5 transition-colors`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCharacter(member)}
                      aria-label={`View ${member.name} build and details`}
                      className="w-full flex flex-col items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer text-center"
                    >
                      <CharacterPortrait
                        src={member.icon}
                        name={member.name}
                        element={member.element}
                        rarity={member.rarity}
                        size="sm"
                      />
                      <div className="text-xs font-bold text-zinc-100 truncate w-full">
                        {member.name}
                      </div>
                      <div className="text-[11px] text-zinc-300 truncate w-full">
                        {member.weapon} · {member.roles[0]}
                      </div>
                    </button>

                    {memberAlts.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDrawerAlternative({
                            originalMember: member,
                            teamName: teamDisplayTitle,
                            alternatives: memberAlts,
                            oppositeTeamMembers: oppositeTeam.members,
                            oppositeTeamName: oppositeDisplayTitle,
                          })
                        }
                        className="w-full min-h-[30px] mt-1 px-2 py-1 rounded-lg text-[11px] font-bold text-[#f3cf58] bg-[#d4af37]/15 hover:bg-[#d4af37]/25 border border-[#d4af37]/40 transition-colors cursor-pointer"
                        title="View alternative substitution trade-offs"
                      >
                        Swap Alt
                      </button>
                    )}
                  </div>
                );
              }
              return (
                <div
                  key={`empty-${halfKey}-${slotIdx}`}
                  className="bg-[#0e1019] border border-dashed border-[#2c334d] rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 text-center min-h-[116px]"
                >
                  <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                    Slot {slotIdx + 1}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">Unassigned</span>
                </div>
              );
            })}
          </div>

          {/* Why This Team Suits Its Assigned Half */}
          {(halfExplanation || team.explanation) && (
            <div className="bg-[#0e1019] rounded-xl border border-[#202538] p-3.5 space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-[#f3cf58] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Why This Team Suits {isFirst ? 'First Half' : 'Second Half'}</span>
                </div>
                {halfExplanation && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      halfExplanation.targetProfileFit === 'Optimal'
                        ? 'bg-emerald-950/65 text-emerald-200 border-emerald-400/45'
                        : halfExplanation.targetProfileFit === 'Good'
                          ? 'bg-sky-950/65 text-sky-200 border-sky-400/45'
                          : 'bg-amber-950/65 text-amber-200 border-amber-400/45'
                    }`}
                  >
                    Target Fit: {halfExplanation.targetProfileFit}
                  </span>
                )}
              </div>

              {halfExplanation?.summary && (
                <p className="text-zinc-100 text-xs font-medium leading-relaxed">
                  {halfExplanation.summary}
                </p>
              )}

              {halfExplanation?.buffSynergy && (
                <div className="text-[11px] text-amber-200 bg-amber-950/25 border border-amber-400/30 px-2.5 py-1.5 rounded-lg">
                  ✨ Ley Line / Chamber Buff Match: {halfExplanation.buffSynergy}
                </div>
              )}

              {halfExplanation && halfExplanation.strengths.length > 0 && (
                <ul className="space-y-1">
                  {halfExplanation.strengths.map((str, sIdx) => (
                    <li key={sIdx} className="text-xs text-emerald-200 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="leading-snug">{str}</span>
                    </li>
                  ))}
                </ul>
              )}

              {halfExplanation && halfExplanation.risks.length > 0 && (
                <ul className="space-y-1">
                  {halfExplanation.risks.map((risk, rIdx) => (
                    <li key={rIdx} className="text-xs text-amber-200 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="leading-snug">{risk}</span>
                    </li>
                  ))}
                </ul>
              )}

              {halfExplanation && halfExplanation.movementNotes.length > 0 && (
                <div className="pt-2 border-t border-[#202538] space-y-1">
                  <div className="text-[11px] font-bold text-sky-300 flex items-center gap-1 uppercase tracking-wider">
                    <Compass className="w-3 h-3" aria-hidden="true" />
                    <span>Positioning &amp; Targeting Notes</span>
                  </div>
                  {halfExplanation.movementNotes.map((note, nIdx) => (
                    <div key={nIdx} className="text-[11px] text-zinc-300 leading-snug">
                      {note}
                    </div>
                  ))}
                </div>
              )}

              {team.explanation?.reactionWorkflow && (
                <p className="text-zinc-300 text-xs leading-relaxed pt-2 border-t border-[#202538]">
                  {team.explanation.reactionWorkflow}
                </p>
              )}

              {team.explanation?.energyAssessment?.warnings &&
                team.explanation.energyAssessment.warnings.length > 0 && (
                  <p className="text-amber-200 text-xs pt-1">
                    ⚡ Energy: {team.explanation.energyAssessment.warnings.join(' · ')}
                  </p>
                )}
            </div>
          )}

          {/* Stepped Rotation Accordion */}
          {team.steppedRotation && team.steppedRotation.steps.length > 0 && (
            <div className="bg-[#0e1019] rounded-xl border border-[#202538] overflow-hidden">
              <button
                type="button"
                aria-expanded={isExpandedRotation}
                aria-controls={rotationPanelId}
                onClick={onToggleRotation}
                className="w-full min-h-[44px] px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs font-bold text-zinc-200 hover:text-white hover:bg-[#151826] transition-colors cursor-pointer"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-[#d4af37]" aria-hidden="true" />
                  <span>Stepped Combat Rotation</span>
                  <span className="text-[11px] font-mono text-[#f3cf58] bg-[#16192b] px-2 py-0.5 rounded border border-[#d4af37]/30">
                    ~{team.steppedRotation.totalCycleTime}s Cycle
                  </span>
                </div>
                {isExpandedRotation ? (
                  <ChevronUp className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
              </button>

              {isExpandedRotation && (
                <div id={rotationPanelId} className="p-3 border-t border-[#202538] space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {team.steppedRotation.steps.map((step) => (
                      <div
                        key={step.stepNumber}
                        className="bg-[#141726] border border-[#24293d] p-2.5 rounded-lg flex flex-col justify-between gap-1.5"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <CharacterPortrait
                              src={step.icon}
                              name={step.characterName}
                              element={step.element}
                              size="xs"
                            />
                            <span className="text-xs font-bold text-zinc-100 truncate">
                              {step.characterName}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-zinc-200 bg-[#1a1e2e] px-1.5 py-0.5 rounded shrink-0">
                            ~{step.fieldTime}s
                          </span>
                        </div>
                        <div className="bg-[#0a0c14] p-1.5 rounded border border-[#1d2236]">
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
      </article>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#121420] via-[#191d30] to-[#121420] p-5 sm:p-6 rounded-2xl border border-[#24293d] shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#f3cf58] text-xs font-bold tracking-wider uppercase mb-1">
              <Swords className="w-4 h-4" aria-hidden="true" />
              <span>Endgame Guidance 2.0 · 0-Overlap Dual Half Matcher</span>
              {isPending && (
                <span
                  role="status"
                  className="text-xs text-amber-300 animate-pulse motion-reduce:animate-none font-normal lowercase tracking-normal"
                >
                  (solving…)
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 font-serif">
              Spiral Abyss Floor 12 Deployment
            </h1>
            <p className="text-sm text-zinc-300 mt-1 max-w-2xl leading-relaxed">
              Unified solver with exact KeqingMains Piecewise Resistance shred calculations, live Elemental Gauge Unit (GU) shield-break estimators, and 1-click half swapping.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Cycle Selector Dropdown */}
            <div className="flex items-center gap-2 bg-[#121422] px-3 py-1.5 rounded-xl border border-[#2c334d]">
              <label htmlFor="abyss-cycle-select" className="text-xs text-zinc-300 font-semibold shrink-0">
                Abyss Cycle:
              </label>
              <select
                id="abyss-cycle-select"
                value={selectedCycleId}
                onChange={(e) => handleSelectCycle(e.target.value)}
                className="bg-[#181c2e] text-xs font-bold text-[#f3cf58] border border-[#353d63] rounded-lg px-2.5 py-1.5 min-h-[36px] focus:border-[#d4af37] cursor-pointer max-w-[240px] sm:max-w-xs"
              >
                <optgroup label="Active Floor 12 (Version 7.x)">
                  {ABYSS_CYCLES.filter((c) => c.version.startsWith('7.')).map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#141624] text-[#f3cf58]">
                      ⭐ [v{c.version}] {c.phase}: {c.name.split(':')[1]?.trim() || c.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Historical Archive (Version 5.x)">
                  {ABYSS_CYCLES.filter((c) => !c.version.startsWith('7.')).map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#141624] text-zinc-200">
                      [v{c.version}] {c.phase}: {c.name.split(':')[1]?.trim() || c.name}
                    </option>
                  ))}
                </optgroup>
                <option value="custom-sandbox" className="bg-[#141624] text-amber-300 font-bold">
                  ⚡ Custom Sandbox
                </option>
              </select>
            </div>

            {/* Data Freshness Indicator */}
            <DataFreshnessBadge datasetId={activeCycle.id} />

            {/* 1-Click Swap Halves Toggle */}
            <button
              type="button"
              aria-pressed={isSwapped}
              onClick={() => setIsSwapped((prev) => !prev)}
              className={`min-h-[40px] sm:min-h-[36px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                isSwapped
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400/55 shadow-md'
                  : 'bg-[#161a29] text-zinc-200 border-[#2c334d] hover:text-[#f3cf58] hover:border-[#d4af37]/50'
              }`}
              title="Swap Team 1 and Team 2 positions with zero character duplicates"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isSwapped ? 'Swapped Halves' : 'Swap Halves'}</span>
            </button>

            {/* Mechanic Coverage Score Badge */}
            <div className="flex items-center gap-2 bg-[#161a29] px-3.5 py-2 rounded-xl border border-[#2c334d]">
              <Sparkles className="w-4 h-4 text-[#d4af37] shrink-0" aria-hidden="true" />
              <div className="text-xs flex items-center gap-1.5">
                <span className="text-zinc-300 flex items-center gap-1">
                  <span>Mechanic Coverage:</span>
                  <InfoTooltip
                    title="Mechanic Coverage Score"
                    content="Composite score evaluating elemental shield breaks, enemy mechanics counter-picks, Arkhe alignment, and blessing synergies across both Spiral Abyss halves."
                    align="right"
                  />
                </span>
                <span className="font-bold text-[#f3cf58] tabular-nums">
                  {plan.mechanicCoverageScore ?? plan.overallScore} Pts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stale Data Warning Banner */}
        <StaleDataWarningBanner datasetId={activeCycle.id} contextLabel="Spiral Abyss" className="mt-4" />

        {/* Active Cycle Blessing Banner */}
        <div className="mt-4 pt-3 border-t border-[#202538] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-zinc-200">
            <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
              Blessing of the Abyssal Moon:
            </span>
            <span>{activeCycle.buffDescription}</span>
          </div>
          {selectedCycleId === 'custom-sandbox' && (
            <button
              type="button"
              aria-expanded={showSandboxEditor}
              onClick={() => setShowSandboxEditor(!showSandboxEditor)}
              className="min-h-[38px] flex items-center gap-1.5 bg-[#1a1e32] hover:bg-[#252c48] text-amber-200 border border-amber-400/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{showSandboxEditor ? 'Hide Sandbox Editor' : 'Configure Sandbox Chambers'}</span>
            </button>
          )}
        </div>

        {/* Top-3 Pairing Selector Tabs */}
        {displayedPairs.length > 1 && (
          <div
            role="group"
            aria-label="Recommended Abyss Lineups"
            className="mt-4 pt-3 border-t border-[#202538] flex flex-wrap items-center gap-2"
          >
            <span className="text-xs text-zinc-300 font-semibold mr-1">Recommended Lineups:</span>
            {displayedPairs.map((p, idx) => (
              <button
                key={idx}
                type="button"
                aria-pressed={selectedPairIndex === idx}
                onClick={() => setSelectedPairIndex(idx)}
                className={`min-h-[40px] sm:min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedPairIndex === idx
                    ? 'bg-[#d4af37] text-[#0a0b0e] shadow-md'
                    : 'bg-[#161a29] text-zinc-200 border border-[#2c334d] hover:text-[#f3cf58] hover:border-[#d4af37]/50'
                }`}
              >
                <span>
                  {p.variantType === 'primary' ? '⭐' : p.variantType === 'comfort' ? '🛡️' : '🔄'}{' '}
                  {p.label || `Option ${idx + 1}`}
                </span>
                <span className="text-[11px] font-mono">
                  ({p.mechanicCoverageScore ?? p.overallScore} pts)
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom Sandbox Editor (Collapsible) */}
      {selectedCycleId === 'custom-sandbox' && showSandboxEditor && (
        <section
          aria-label="Interactive Sandbox Chamber Configurator"
          className="bg-[#121420] border border-amber-400/40 rounded-2xl p-5 space-y-4 shadow-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#24293d] pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-300" aria-hidden="true" />
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                Interactive Sandbox Chamber Configurator
              </h2>
            </div>
            <button
              type="button"
              onClick={handleResetSandbox}
              className="min-h-[36px] px-2.5 rounded-lg flex items-center gap-1.5 text-xs text-zinc-200 hover:text-amber-200 hover:bg-[#1a1e2e] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset to Baseline</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {customCycle.chambers.map((ch) => (
              <div
                key={ch.chamber}
                className="bg-[#161928] border border-[#282f48] p-3.5 rounded-xl space-y-3"
              >
                <div className="text-xs font-bold text-[#f3cf58] border-b border-[#24293d] pb-1.5">
                  Chamber 12-{ch.chamber}
                </div>

                {/* First Half Editor */}
                <div className="space-y-2 text-xs">
                  <div className="font-semibold text-sky-300">First Half:</div>
                  <input
                    type="text"
                    aria-label={`Chamber 12-${ch.chamber} first half enemy name`}
                    value={ch.firstHalf.enemies[0]?.name || ''}
                    onChange={(e) =>
                      handleUpdateSandboxHalf(ch.chamber, 'firstHalf', (prev) => {
                        const first = prev.enemies[0] || {
                          id: `custom-enemy-${ch.chamber}-1`,
                          name: '',
                          level: 95,
                          hp: 1500000,
                          baseRes: {
                            Pyro: 10,
                            Hydro: 10,
                            Anemo: 10,
                            Electro: 10,
                            Dendro: 10,
                            Cryo: 10,
                            Geo: 10,
                            Physical: 10,
                          },
                        };
                        return {
                          ...prev,
                          enemies: [{ ...first, name: e.target.value }, ...prev.enemies.slice(1)],
                        };
                      })
                    }
                    placeholder="Enemy Name"
                    className="w-full min-h-[36px] bg-[#0e1019] border border-[#323954] rounded-lg px-2.5 py-1.5 text-zinc-100 placeholder:text-zinc-400 text-xs"
                  />
                  <div className="flex gap-2">
                    <select
                      aria-label={`Chamber 12-${ch.chamber} first half shield type`}
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
                      className="bg-[#0e1019] border border-[#323954] rounded-lg px-2 py-1.5 min-h-[36px] text-zinc-100 text-xs flex-1"
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
                        aria-label={`Chamber 12-${ch.chamber} first half shield gauge units`}
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
                        className="w-16 min-h-[36px] bg-[#0e1019] border border-[#323954] rounded-lg px-2 py-1.5 text-zinc-100 text-xs font-mono"
                        title="Gauge Units (GU)"
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 pt-1 text-xs text-zinc-300">
                    <label className="flex items-center gap-1.5 cursor-pointer min-h-[32px]">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-[#d4af37]"
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
                    <label className="flex items-center gap-1.5 cursor-pointer min-h-[32px]">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-[#d4af37]"
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
                <div className="space-y-2 text-xs pt-2.5 border-t border-[#24293d]">
                  <div className="font-semibold text-amber-300">Second Half:</div>
                  <input
                    type="text"
                    aria-label={`Chamber 12-${ch.chamber} second half enemy name`}
                    value={ch.secondHalf.enemies[0]?.name || ''}
                    onChange={(e) =>
                      handleUpdateSandboxHalf(ch.chamber, 'secondHalf', (prev) => {
                        const first = prev.enemies[0] || {
                          id: `custom-enemy-${ch.chamber}-2`,
                          name: '',
                          level: 95,
                          hp: 1500000,
                          baseRes: {
                            Pyro: 10,
                            Hydro: 10,
                            Anemo: 10,
                            Electro: 10,
                            Dendro: 10,
                            Cryo: 10,
                            Geo: 10,
                            Physical: 10,
                          },
                        };
                        return {
                          ...prev,
                          enemies: [{ ...first, name: e.target.value }, ...prev.enemies.slice(1)],
                        };
                      })
                    }
                    placeholder="Enemy Name"
                    className="w-full min-h-[36px] bg-[#0e1019] border border-[#323954] rounded-lg px-2.5 py-1.5 text-zinc-100 placeholder:text-zinc-400 text-xs"
                  />
                  <div className="flex gap-2">
                    <select
                      aria-label={`Chamber 12-${ch.chamber} second half shield type`}
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
                      className="bg-[#0e1019] border border-[#323954] rounded-lg px-2 py-1.5 min-h-[36px] text-zinc-100 text-xs flex-1"
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
                        aria-label={`Chamber 12-${ch.chamber} second half shield gauge units`}
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
                        className="w-16 min-h-[36px] bg-[#0e1019] border border-[#323954] rounded-lg px-2 py-1.5 text-zinc-100 text-xs font-mono"
                        title="Gauge Units (GU)"
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 pt-1 text-xs text-zinc-300">
                    <label className="flex items-center gap-1.5 cursor-pointer min-h-[32px]">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-[#d4af37]"
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
                    <label className="flex items-center gap-1.5 cursor-pointer min-h-[32px]">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-[#d4af37]"
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
        </section>
      )}

      {/* Shortfall or Notice Banner */}
      {plan.warnings && plan.warnings.length > 0 && (
        <div
          role="status"
          className="bg-amber-950/40 border border-amber-400/45 p-4 rounded-xl flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-amber-200">Floor 12 Deployment Notice</div>
            {plan.warnings.map((w, idx) => (
              <div key={idx} className="text-zinc-200">
                {w}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chamber Clearance & Shield Breakdown Matrix */}
      <section className="bg-[#121420] border border-[#24293d] rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#202538] pb-2.5">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#d4af37]" aria-hidden="true" />
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Floor 12 Chamber Clearance &amp; Elemental Gauge Breakdown
            </h2>
          </div>
          <span className="text-xs text-zinc-300">{activeCycle.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {plan.chamberCoverage.map((cov) => {
            const chamberData = activeCycle.chambers.find((c) => c.chamber === cov.chamber);
            const firstEnemy = chamberData?.firstHalf.enemies[0];
            const secondEnemy = chamberData?.secondHalf.enemies[0];

            return (
              <div
                key={cov.chamber}
                className="bg-[#161928] border border-[#282f48] rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-[#24293d] pb-2">
                  <span className="text-xs font-bold text-[#f3cf58]">
                    Chamber 12-{cov.chamber}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      cov.firstHalfSatisfied && cov.secondHalfSatisfied
                        ? 'bg-emerald-950/65 text-emerald-200 border-emerald-400/45'
                        : 'bg-amber-950/65 text-amber-200 border-amber-400/45'
                    }`}
                  >
                    {cov.firstHalfSatisfied && cov.secondHalfSatisfied
                      ? '100% Cleared'
                      : 'Partial Coverage'}
                  </span>
                </div>

                {/* First Half Breakdown */}
                <div className="text-xs space-y-2">
                  <div className="flex items-center justify-between gap-1 text-xs font-semibold text-zinc-200">
                    <div className="flex items-center gap-1.5">
                      {cov.firstHalfSatisfied ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" aria-hidden="true" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
                      )}
                      <span className="text-sky-300">First Half:</span>
                    </div>
                    {firstEnemy && (
                      <span className="text-[11px] text-zinc-300 truncate max-w-[160px]">
                        {firstEnemy.name} (Lv.{firstEnemy.level})
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-200 pl-4 leading-snug">{cov.firstHalfStatus}</p>

                  {cov.firstHalfMetrics && (cov.firstHalfMetrics.targetProfile || (cov.firstHalfMetrics.movementTraits?.length ?? 0) > 0) && (
                    <div className="pl-4 flex flex-wrap gap-1.5">
                      {cov.firstHalfMetrics.targetProfile && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1a1e2e] text-sky-200 border border-sky-400/30">
                          {cov.firstHalfMetrics.targetProfile}
                          {(cov.firstHalfMetrics.waveCount ?? 1) > 1 ? ` · ${cov.firstHalfMetrics.waveCount}W` : ''}
                        </span>
                      )}
                      {cov.firstHalfMetrics.movementTraits?.slice(0, 2).map((trait) => (
                        <span
                          key={trait}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/50 text-purple-200 border border-purple-400/30"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}

                  {cov.firstHalfMetrics && (
                    <div className="pl-4 space-y-1.5 pt-1">
                      {cov.firstHalfMetrics.shieldBreakTime !== undefined && (
                        <div className="bg-[#0e1019] p-2.5 rounded-lg border border-[#202538] space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                            <span className="text-zinc-300 flex items-center gap-1 font-semibold">
                              <Gauge className="w-3 h-3 text-sky-300" aria-hidden="true" />
                              <span>Shield Break Time:</span>
                            </span>
                            <span
                              className={`font-bold font-mono px-1.5 py-0.5 rounded ${
                                cov.firstHalfMetrics.shieldBreakRating === 'Fast'
                                  ? 'text-emerald-200 bg-emerald-950/70'
                                  : cov.firstHalfMetrics.shieldBreakRating === 'Medium'
                                    ? 'text-sky-200 bg-sky-950/70'
                                    : cov.firstHalfMetrics.shieldBreakRating === 'Slow'
                                      ? 'text-amber-200 bg-amber-950/70'
                                      : 'text-rose-200 bg-rose-950/70'
                              }`}
                            >
                              ⚡{' '}
                              {cov.firstHalfMetrics.shieldBreakRating === 'Ineffective'
                                ? '∞ (Ineffective)'
                                : `${cov.firstHalfMetrics.shieldBreakTime}s (${cov.firstHalfMetrics.shieldBreakRating})`}
                            </span>
                          </div>
                          {cov.firstHalfMetrics.shieldBreakBreakdown && (
                            <div className="text-[11px] text-zinc-300 truncate">
                              {cov.firstHalfMetrics.shieldBreakBreakdown}
                            </div>
                          )}
                        </div>
                      )}

                      {cov.firstHalfMetrics.effectiveResShred !== undefined &&
                        cov.firstHalfMetrics.effectiveResShred > 0 && (
                          <div className="flex items-center justify-between text-[11px] text-zinc-300">
                            <span>Team RES Shred:</span>
                            <span className="text-emerald-300 font-bold font-mono">
                              -{cov.firstHalfMetrics.effectiveResShred}% (
                              {cov.firstHalfMetrics.effectiveDmgMultiplier}x DMG)
                            </span>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Second Half Breakdown */}
                <div className="text-xs space-y-2 pt-2.5 border-t border-[#24293d]">
                  <div className="flex items-center justify-between gap-1 text-xs font-semibold text-zinc-200">
                    <div className="flex items-center gap-1.5">
                      {cov.secondHalfSatisfied ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" aria-hidden="true" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-300 shrink-0" aria-hidden="true" />
                      )}
                      <span className="text-amber-300">Second Half:</span>
                    </div>
                    {secondEnemy && (
                      <span className="text-[11px] text-zinc-300 truncate max-w-[160px]">
                        {secondEnemy.name} (Lv.{secondEnemy.level})
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-200 pl-4 leading-snug">{cov.secondHalfStatus}</p>

                  {cov.secondHalfMetrics && (cov.secondHalfMetrics.targetProfile || (cov.secondHalfMetrics.movementTraits?.length ?? 0) > 0) && (
                    <div className="pl-4 flex flex-wrap gap-1.5">
                      {cov.secondHalfMetrics.targetProfile && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1a1e2e] text-amber-200 border border-amber-400/30">
                          {cov.secondHalfMetrics.targetProfile}
                          {(cov.secondHalfMetrics.waveCount ?? 1) > 1 ? ` · ${cov.secondHalfMetrics.waveCount}W` : ''}
                        </span>
                      )}
                      {cov.secondHalfMetrics.movementTraits?.slice(0, 2).map((trait) => (
                        <span
                          key={trait}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/50 text-purple-200 border border-purple-400/30"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}

                  {cov.secondHalfMetrics && (
                    <div className="pl-4 space-y-1.5 pt-1">
                      {cov.secondHalfMetrics.shieldBreakTime !== undefined && (
                        <div className="bg-[#0e1019] p-2.5 rounded-lg border border-[#202538] space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                            <span className="text-zinc-300 flex items-center gap-1 font-semibold">
                              <Gauge className="w-3 h-3 text-amber-300" aria-hidden="true" />
                              <span>Shield Break Time:</span>
                            </span>
                            <span
                              className={`font-bold font-mono px-1.5 py-0.5 rounded ${
                                cov.secondHalfMetrics.shieldBreakRating === 'Fast'
                                  ? 'text-emerald-200 bg-emerald-950/70'
                                  : cov.secondHalfMetrics.shieldBreakRating === 'Medium'
                                    ? 'text-sky-200 bg-sky-950/70'
                                    : cov.secondHalfMetrics.shieldBreakRating === 'Slow'
                                      ? 'text-amber-200 bg-amber-950/70'
                                      : 'text-rose-200 bg-rose-950/70'
                              }`}
                            >
                              ⚡{' '}
                              {cov.secondHalfMetrics.shieldBreakRating === 'Ineffective'
                                ? '∞ (Ineffective)'
                                : `${cov.secondHalfMetrics.shieldBreakTime}s (${cov.secondHalfMetrics.shieldBreakRating})`}
                            </span>
                          </div>
                          {cov.secondHalfMetrics.shieldBreakBreakdown && (
                            <div className="text-[11px] text-zinc-300 truncate">
                              {cov.secondHalfMetrics.shieldBreakBreakdown}
                            </div>
                          )}
                        </div>
                      )}

                      {cov.secondHalfMetrics.effectiveResShred !== undefined &&
                        cov.secondHalfMetrics.effectiveResShred > 0 && (
                          <div className="flex items-center justify-between text-[11px] text-zinc-300">
                            <span>Team RES Shred:</span>
                            <span className="text-emerald-300 font-bold font-mono">
                              -{cov.secondHalfMetrics.effectiveResShred}% (
                              {cov.secondHalfMetrics.effectiveDmgMultiplier}x DMG)
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
      </section>

      {/* Missing Counter Fallbacks & Owned Bench Substitutes */}
      {!isSwapped && plan.missingCounterFallbacks && plan.missingCounterFallbacks.length > 0 && (
        <section
          aria-label="Missing Counter Fallbacks and Substitutions"
          className="bg-[#121420] border border-amber-400/40 rounded-2xl p-5 space-y-3 shadow-md"
        >
          <div className="flex items-center gap-2 border-b border-[#24293d] pb-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
            <h2 className="text-sm font-bold text-amber-200 uppercase tracking-wider">
              Counter Gaps &amp; Owned Bench Substitutes
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plan.missingCounterFallbacks.map((fb, idx) => (
              <div
                key={`${fb.half}-${fb.chamber}-${idx}`}
                className="bg-[#0e1019] border border-[#282f48] rounded-xl p-3.5 space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-[#f3cf58]">
                    12-{fb.chamber} · {fb.half}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-950/60 text-rose-200 border border-rose-400/40">
                    Needs: {fb.missingRequirement}
                  </span>
                </div>
                <p className="text-zinc-200 leading-relaxed">{fb.strategyTip}</p>
                {fb.ownedSubstitutes.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {fb.ownedSubstitutes.map((sub) => {
                      const charObj = CHARACTERS.find((c) => c.id === sub.characterId);
                      return (
                        <button
                          key={sub.characterId}
                          type="button"
                          onClick={() => charObj && setSelectedCharacter(charObj)}
                          className="min-h-[34px] flex items-center gap-1.5 bg-[#161a29] hover:bg-[#22283f] border border-[#323954] hover:border-[#d4af37]/60 px-2.5 py-1 rounded-lg text-zinc-100 font-medium transition-colors cursor-pointer"
                          title={sub.reason}
                        >
                          {charObj && (
                            <CharacterPortrait
                              src={charObj.icon}
                              name={charObj.name}
                              element={charObj.element}
                              size="xs"
                            />
                          )}
                          <span>{sub.characterName}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[11px] text-zinc-400 italic">
                    No unused bench substitute in your roster matches this requirement—consider swapping halves or selecting an Alternative pairing above.
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dual Side-by-Side Team Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderHalfTeamCard('first', teamA, teamB, expandedRotationA, () =>
          setExpandedRotationA((prev) => !prev)
        )}
        {renderHalfTeamCard('second', teamB, teamA, expandedRotationB, () =>
          setExpandedRotationB((prev) => !prev)
        )}
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

      {/* Alternative Substitutions Modal (accessible dialog with focus trap & Escape) */}
      {drawerAlternative && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="abyss-alt-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setDrawerAlternative(null)}
        >
          <div
            ref={altDialogRef}
            tabIndex={-1}
            className="bg-[#121420] border border-[#2c334d] rounded-2xl w-full max-w-lg max-h-[88vh] p-5 flex flex-col gap-4 shadow-2xl relative focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 border-b border-[#24293d] pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-5 h-5 text-[#d4af37] shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <h2 id="abyss-alt-modal-title" className="text-sm font-bold text-zinc-100 font-serif">
                    Alternative Substitutions for {drawerAlternative.originalMember.name}
                  </h2>
                  <span className="text-xs text-zinc-300">
                    {drawerAlternative.teamName} slot alternatives with tactical trade-offs
                  </span>
                </div>
              </div>
              <button
                ref={altCloseBtnRef}
                type="button"
                aria-label="Close alternative substitutions modal"
                onClick={() => setDrawerAlternative(null)}
                className="min-w-[38px] min-h-[38px] text-zinc-300 hover:text-white rounded-xl hover:bg-[#1f243b] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1">
              {[...drawerAlternative.alternatives]
                .sort((a, b) => {
                  const aDeployed = drawerAlternative.oppositeTeamMembers.some((m) =>
                    isSameCharacterOrTraveler(m, a.alternativeCharacter)
                  );
                  const bDeployed = drawerAlternative.oppositeTeamMembers.some((m) =>
                    isSameCharacterOrTraveler(m, b.alternativeCharacter)
                  );
                  if (aDeployed !== bDeployed) return aDeployed ? 1 : -1;
                  return b.compatibilityImpact - a.compatibilityImpact;
                })
                .map((alt, idx) => {
                  const isDeployedInOpposite = drawerAlternative.oppositeTeamMembers.some((m) =>
                    isSameCharacterOrTraveler(m, alt.alternativeCharacter)
                  );
                  return (
                    <div
                      key={idx}
                      className={`border rounded-xl p-3.5 space-y-2 ${
                        isDeployedInOpposite
                          ? 'bg-[#161826] border-rose-400/40'
                          : 'bg-[#161a29] border-[#282f48]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <CharacterPortrait
                            src={alt.alternativeCharacter.icon}
                            name={alt.alternativeCharacter.name}
                            element={alt.alternativeCharacter.element}
                            rarity={alt.alternativeCharacter.rarity}
                            size="xs"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-zinc-100 flex flex-wrap items-center gap-1.5">
                              <span>{alt.alternativeCharacter.name}</span>
                              {isDeployedInOpposite && (
                                <span className="text-[11px] font-bold text-rose-200 bg-rose-950/75 border border-rose-400/45 px-1.5 py-0.5 rounded">
                                  Deployed in {drawerAlternative.oppositeTeamName}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-300">
                              {alt.alternativeCharacter.weapon} · {alt.alternativeCharacter.roles[0]}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono ${
                            alt.compatibilityImpact >= 0
                              ? 'bg-emerald-950/65 text-emerald-200 border border-emerald-400/45'
                              : 'bg-amber-950/65 text-amber-200 border border-amber-400/45'
                          }`}
                        >
                          {alt.compatibilityImpact >= 0
                            ? `+${alt.compatibilityImpact}%`
                            : `${alt.compatibilityImpact}%`}{' '}
                          Synergy
                        </span>
                      </div>

                      {alt.tradeOffPros.length > 0 && (
                        <div className="text-xs space-y-1">
                          <div className="text-emerald-300 font-semibold text-[11px] uppercase tracking-wider">
                            + Advantages:
                          </div>
                          <ul className="list-disc list-inside text-zinc-200 pl-1 space-y-0.5">
                            {alt.tradeOffPros.map((pro, pIdx) => (
                              <li key={pIdx}>{pro}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {alt.tradeOffCons.length > 0 && (
                        <div className="text-xs space-y-1">
                          <div className="text-amber-300 font-semibold text-[11px] uppercase tracking-wider">
                            − Trade-offs:
                          </div>
                          <ul className="list-disc list-inside text-zinc-300 pl-1 space-y-0.5">
                            {alt.tradeOffCons.map((con, cIdx) => (
                              <li key={cIdx}>{con}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
